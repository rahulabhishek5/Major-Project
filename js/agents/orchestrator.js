/**
 * UBS Continuous Regulatory Change Manager
 * Orchestrator Agent — Central coordinator for the multi-agent pipeline
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};

  var H = window.AppCore.Helpers;
  var Bus = window.AppCore.EventBus;
  var State = window.AppCore.StateManager;
  var Trace = window.AppCore.TraceLogger;

  /** Workflow state machine states */
  var STATES = {
    RECEIVED: 'received',
    VALIDATING: 'validating',
    PARSING: 'parsing',
    CLASSIFYING: 'classifying',
    RETRIEVING: 'retrieving_policies',
    ANALYZING: 'analyzing_impact',
    DECIDING: 'deciding',
    DRAFTING: 'drafting_policy',
    SCORING: 'scoring_risk',
    ESCALATING: 'escalating',
    NOTIFYING: 'notifying',
    COMPLETED: 'completed',
    FAILED: 'failed',
    QUARANTINED: 'quarantined'
  };

  function OrchestratorAgent() {
    this.id = 'orchestrator';
    this.name = 'Orchestrator Agent';
    this.workflows = {};
    this.maxRetries = 3;
    this._init();
  }

  OrchestratorAgent.prototype._init = function () {
    var self = this;
    // Listen for workflow triggers
    Bus.subscribe('regulatory.update.received', function (data) {
      self.startWorkflow(data);
    });
    // Listen for step completions
    Bus.subscribe('workflow.step.completed', function (data) {
      self._advanceWorkflow(data.workflowId, data.step, data.result);
    });
    Bus.subscribe('workflow.step.failed', function (data) {
      self._handleStepFailure(data.workflowId, data.step, data.error);
    });
    Bus.subscribe('escalation.resolved', function (data) {
      self._handleEscalationResolved(data);
    });
  };

  /** Start a new workflow for a regulatory update */
  OrchestratorAgent.prototype.startWorkflow = function (update) {
    var workflowId = H.generateId('WF');
    var traceId = Trace.startTrace(update.update_id, {
      triggered_by: 'auto_ingestion',
      workflow_id: workflowId
    });

    var workflow = {
      id: workflowId,
      updateId: update.update_id,
      update: update,
      traceId: traceId,
      state: STATES.RECEIVED,
      startedAt: new Date().toISOString(),
      completedAt: null,
      retries: {},
      results: {},
      error: null
    };

    this.workflows[workflowId] = workflow;
    State.setState('activeWorkflows.' + workflowId, workflow);

    Bus.publish('audit.logged', {
      agent_id: this.id,
      action: 'workflow_started',
      update_id: update.update_id,
      workflow_id: workflowId,
      message: 'Orchestrator started workflow for: ' + (update.document_title || update.update_id)
    });

    // Start the pipeline
    this._transition(workflowId, STATES.VALIDATING);
  };

  /** Transition the workflow to a new state and trigger the corresponding agent */
  OrchestratorAgent.prototype._transition = function (workflowId, newState) {
    var wf = this.workflows[workflowId];
    if (!wf) return;

    var oldState = wf.state;
    wf.state = newState;
    State.setState('activeWorkflows.' + workflowId + '.state', newState);

    Bus.publish('agent.status.changed', {
      workflow_id: workflowId,
      from: oldState,
      to: newState
    });

    // Dispatch to the appropriate agent
    switch (newState) {
      case STATES.VALIDATING:
        Bus.publishAsync('agent.task.ingestion', { workflowId: workflowId, update: wf.update }, 200);
        break;
      case STATES.PARSING:
        Bus.publishAsync('agent.task.parser', { workflowId: workflowId, update: wf.update, validation: wf.results.ingestion }, 300);
        break;
      case STATES.CLASSIFYING:
        Bus.publishAsync('agent.task.classifier', { workflowId: workflowId, update: wf.update, parsed: wf.results.parser }, 200);
        break;
      case STATES.RETRIEVING:
        Bus.publishAsync('agent.task.retriever', { workflowId: workflowId, update: wf.update, classification: wf.results.classifier }, 300);
        break;
      case STATES.ANALYZING:
        Bus.publishAsync('agent.task.impact', {
          workflowId: workflowId, update: wf.update,
          classification: wf.results.classifier,
          policies: wf.results.retriever
        }, 400);
        break;
      case STATES.DECIDING:
        Bus.publishAsync('agent.task.decision', {
          workflowId: workflowId, update: wf.update,
          classification: wf.results.classifier,
          policies: wf.results.retriever,
          impact: wf.results.impact
        }, 300);
        break;
      case STATES.DRAFTING:
        Bus.publishAsync('agent.task.drafter', {
          workflowId: workflowId, update: wf.update,
          policies: wf.results.retriever,
          decision: wf.results.decision
        }, 400);
        break;
      case STATES.SCORING:
        Bus.publishAsync('agent.task.risk', {
          workflowId: workflowId, update: wf.update,
          decision: wf.results.decision,
          impact: wf.results.impact
        }, 200);
        break;
      case STATES.ESCALATING:
        this._updateFeedStatus(wf.updateId, 'escalated');
        Bus.publishAsync('agent.task.escalation', {
          workflowId: workflowId, update: wf.update,
          decision: wf.results.decision,
          risk: wf.results.risk
        }, 200);
        break;
      case STATES.NOTIFYING:
        Bus.publishAsync('agent.task.notification', {
          workflowId: workflowId, update: wf.update,
          decision: wf.results.decision,
          risk: wf.results.risk
        }, 200);
        break;
      case STATES.COMPLETED:
        this._completeWorkflow(workflowId);
        break;
      case STATES.QUARANTINED:
        this._quarantineWorkflow(workflowId);
        break;
      case STATES.FAILED:
        this._failWorkflow(workflowId);
        break;
    }
  };

  /** Handle a completed step and advance to the next */
  OrchestratorAgent.prototype._advanceWorkflow = function (workflowId, step, result) {
    var wf = this.workflows[workflowId];
    if (!wf) return;

    wf.results[step] = result;

    // Determine next state based on current step and result
    var nextState;
    switch (step) {
      case 'ingestion':
        if (result.is_duplicate) {
          nextState = STATES.COMPLETED; // Skip processing for duplicates
          wf.results.decision = { action: 'DISMISS', reason: 'Duplicate detected: ' + result.duplicate_of };
        } else if (result.is_malformed) {
          nextState = STATES.QUARANTINED;
        } else {
          nextState = STATES.PARSING;
        }
        break;
      case 'parser':
        if (result.confidence < 0.4) {
          nextState = STATES.QUARANTINED;
        } else {
          nextState = STATES.CLASSIFYING;
        }
        break;
      case 'classifier':
        nextState = STATES.RETRIEVING;
        break;
      case 'retriever':
        nextState = STATES.ANALYZING;
        break;
      case 'impact':
        nextState = STATES.DECIDING;
        break;
      case 'decision':
        if (result.action === 'COMPLY') {
          nextState = STATES.DRAFTING;
        } else {
          nextState = STATES.SCORING;
        }
        break;
      case 'drafter':
        nextState = STATES.SCORING;
        break;
      case 'risk':
        // Check if escalation is needed
        if (result.score > 80 || result.requiresEscalation) {
          nextState = STATES.ESCALATING;
        } else {
          nextState = STATES.NOTIFYING;
        }
        break;
      case 'escalation':
        // After escalation, wait for human feedback (handled by escalation.resolved)
        return;
      case 'notification':
        nextState = STATES.COMPLETED;
        break;
      default:
        nextState = STATES.COMPLETED;
    }

    this._transition(workflowId, nextState);
  };

  /** Handle step failure with retry logic */
  OrchestratorAgent.prototype._handleStepFailure = function (workflowId, step, error) {
    var wf = this.workflows[workflowId];
    if (!wf) return;

    wf.retries[step] = (wf.retries[step] || 0) + 1;

    Bus.publish('audit.logged', {
      agent_id: this.id,
      action: 'step_failed',
      update_id: wf.updateId,
      workflow_id: workflowId,
      severity: 'warning',
      message: 'Step "' + step + '" failed (attempt ' + wf.retries[step] + '/' + this.maxRetries + '): ' + error
    });

    if (wf.retries[step] < this.maxRetries) {
      // Retry with exponential backoff
      var delay = Math.pow(2, wf.retries[step]) * 500;
      Bus.publishAsync('agent.task.' + step, {
        workflowId: workflowId,
        update: wf.update,
        retry: wf.retries[step]
      }, delay);
    } else {
      wf.error = 'Step "' + step + '" failed after ' + this.maxRetries + ' retries: ' + error;
      this._transition(workflowId, STATES.FAILED);
    }
  };

  /** Handle escalation resolution */
  OrchestratorAgent.prototype._handleEscalationResolved = function (data) {
    var wf = this.workflows[data.workflowId];
    if (!wf) return;

    wf.results.humanFeedback = data.feedback;
    wf.results.decision.humanOverride = data.feedback;

    Trace.addStep(wf.traceId, {
      agent_id: 'escalation',
      agent_name: 'Human Escalation Agent',
      action: 'Human review completed',
      inputs: { escalation_id: data.escalationId },
      outputs: data.feedback,
      reasoning: 'Human reviewer ' + (data.feedback.reviewer || 'unknown') + ' resolved the escalation with action: ' + data.feedback.action,
      confidence: 1.0,
      status: 'success'
    });

    this._transition(data.workflowId, STATES.NOTIFYING);
  };

  /** Complete a workflow */
  OrchestratorAgent.prototype._completeWorkflow = function (workflowId) {
    var wf = this.workflows[workflowId];
    wf.completedAt = new Date().toISOString();
    wf.state = STATES.COMPLETED;
    this._updateFeedStatus(wf.updateId, 'completed');

    var finalDecision = wf.results.decision || { action: 'DISMISS', reason: 'No action required' };

    Trace.completeTrace(wf.traceId, finalDecision);

    // [AUTO-REMEDIATION] Automatically push drafted changes to the database
    if (wf.results.drafter && wf.results.drafter.proposed_edits) {
      wf.results.drafter.proposed_edits.forEach(function(edit) {
        var internalPolicies = (window.APP_DATA && window.APP_DATA.policies) || [];
        var pol = internalPolicies.find(function(p) { return p.policy_id === edit.policy_id; });
        if (pol) {
          // Increment minor version
          var vParts = pol.version.split('.');
          var minor = parseInt(vParts[1]) || 0;
          pol.version = vParts[0] + '.' + (minor + 1);

          // Set overall policy status to under review so it syncs with UI badges
          pol.status = 'under_review';

          // Update sections and mark them for review
          var sec = pol.sections.find(function(s) { return s.title === edit.section_title; });
          if (sec) {
            sec.text = edit.proposed_text;
            sec.status = 'needs_review';
          } else {
            pol.sections.push({ title: edit.section_title, text: edit.proposed_text, status: 'added_by_ai' });
          }

          // Append to change history
          if (!pol.change_history) pol.change_history = [];
          pol.change_history.push({
            date: new Date().toISOString().split('T')[0],
            reason: 'Automated Remediation for: ' + (wf.update.document_title || wf.updateId),
            original_text: edit.original_text,
            new_text: edit.proposed_text
          });

          // Sync with database
          fetch('http://localhost:3000/api/policies/' + pol.policy_id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pol)
          }).then(function(res) {
            return res.json();
          }).then(function(data) {
            console.log('Automated Remediation Success:', data);
            // TRIGGER EMAIL NOTIFICATION
            fetch('http://localhost:3000/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subject: '🚨 URGENT: Policy Auto-Remediated - ' + pol.title,
                html: '<h3>Policy Auto-Remediation Notice</h3><p>The AI Orchestrator has successfully detected a regulatory change and updated an internal policy.</p><b>Policy:</b> ' + pol.title + ' (v' + pol.version + ')<br><b>Trigger:</b> ' + (wf.update.document_title || wf.updateId) + '<br><br><b>Old Text:</b><br><i>' + edit.original_text + '</i><br><br><b>New Text:</b><br><b style="color:green">' + edit.proposed_text + '</b><br><br><p>Please review the changes in the PolicyPilot Dashboard.</p>'
              })
            }).then(function(r) { return r.json(); }).then(function(emailRes) {
               if (emailRes.previewUrl) {
                  window.AppCore.App.showToast('info', 'Email Sent', 'Compliance team notified. <a href="' + emailRes.previewUrl + '" target="_blank" style="color:white;text-decoration:underline">View Email</a>');
               }
            });
          }).catch(function(err) {
            console.error('Automated Remediation Failed:', err);
          });
        }
      });
    }

    // Update global state
    var processed = State.getByPath('processedUpdates') || [];
    processed.push({
      update_id: wf.updateId,
      workflow_id: workflowId,
      decision: finalDecision,
      risk: wf.results.risk,
      impact: wf.results.impact,
      completed_at: wf.completedAt,
      duration_ms: new Date(wf.completedAt) - new Date(wf.startedAt)
    });
    State.setState('processedUpdates', processed);

    // Update stats
    var stats = State.getByPath('stats') || {};
    stats.totalProcessed = (stats.totalProcessed || 0) + 1;
    stats.totalPending = Math.max(0, (stats.totalPending || 0) - 1);
    State.setState('stats', stats);

    Bus.publish('workflow.completed', {
      workflow_id: workflowId,
      update_id: wf.updateId,
      decision: finalDecision,
      risk: wf.results.risk,
      duration_ms: new Date(wf.completedAt) - new Date(wf.startedAt)
    });

    Bus.publish('audit.logged', {
      agent_id: this.id,
      action: 'workflow_completed',
      update_id: wf.updateId,
      workflow_id: workflowId,
      severity: 'info',
      message: 'Workflow completed: ' + finalDecision.action + ' — ' + (finalDecision.reason || '').substring(0, 100)
    });
  };

  /** Quarantine a workflow */
  OrchestratorAgent.prototype._quarantineWorkflow = function (workflowId) {
    var wf = this.workflows[workflowId];
    wf.completedAt = new Date().toISOString();
    this._updateFeedStatus(wf.updateId, 'quarantined');

    Trace.failTrace(wf.traceId, 'Quarantined: document quality below threshold');

    Bus.publish('audit.logged', {
      agent_id: this.id,
      action: 'workflow_quarantined',
      update_id: wf.updateId,
      workflow_id: workflowId,
      severity: 'warning',
      message: 'Update quarantined due to quality issues. Manual retrieval recommended.'
    });

    Bus.publish('workflow.failed', {
      workflow_id: workflowId,
      update_id: wf.updateId,
      reason: 'quarantined',
      message: 'Document quality below processing threshold'
    });
  };

  /** Fail a workflow */
  OrchestratorAgent.prototype._failWorkflow = function (workflowId) {
    var wf = this.workflows[workflowId];
    wf.completedAt = new Date().toISOString();
    this._updateFeedStatus(wf.updateId, 'failed');

    Trace.failTrace(wf.traceId, wf.error || 'System error');

    Bus.publish('workflow.failed', {
      workflow_id: workflowId,
      update_id: wf.updateId,
      reason: 'error',
      message: wf.error
    });

    Bus.publish('audit.logged', {
      agent_id: this.id,
      action: 'workflow_failed',
      update_id: wf.updateId,
      workflow_id: workflowId,
      severity: 'error',
      message: 'Workflow failed: ' + wf.error
    });
  };

  /** Get workflow status */
  OrchestratorAgent.prototype.getWorkflow = function (workflowId) {
    return this.workflows[workflowId];
  };

  /** Update feed status helper */
  OrchestratorAgent.prototype._updateFeedStatus = function (updateId, status) {
    var updates = State.getByPath('regulatoryUpdates') || [];
    var u = updates.find(function(x) { return x.update_id === updateId; });
    if (u) {
      u.status = status;
      State.setState('regulatoryUpdates', updates);
    }
  };

  /** Get all workflows */
  OrchestratorAgent.prototype.getAllWorkflows = function () {
    return Object.values(this.workflows);
  };

  /** Replay a workflow with updated context */
  OrchestratorAgent.prototype.replayWorkflow = function (workflowId) {
    var original = this.workflows[workflowId];
    if (!original) return null;

    var update = JSON.parse(JSON.stringify(original.update));
    update.status = 'pending';

    Bus.publish('audit.logged', {
      agent_id: this.id,
      action: 'workflow_replay',
      update_id: original.updateId,
      workflow_id: workflowId,
      severity: 'info',
      message: 'Replaying workflow for update: ' + original.updateId
    });

    this.startWorkflow(update);
    return true;
  };

  window.AppCore.Agents.Orchestrator = new OrchestratorAgent();
})();
