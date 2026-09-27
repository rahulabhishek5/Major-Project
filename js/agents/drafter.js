/**
 * UBS — Automated Policy Drafting Agent
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger;

  function DrafterAgent() {
    this.id = 'drafter';
    this.name = 'Automated Policy Drafting Agent';
    this._init();
  }

  DrafterAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.drafter', function (d) { self.process(d); });
  };

  DrafterAgent.prototype.process = async function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    try {
      var result = await self._draft(u, data.policies, data.decision);
      
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Drafted Policy Edits',
          inputs: { 
            decision: data.decision ? data.decision.action : 'N/A', 
            policy_gaps: data.policies && data.policies.gaps ? data.policies.gaps.length : 0 
          },
          outputs: { 
            drafted_edits: result.proposed_edits.length, 
            affected_policies: result.proposed_edits.map(function(e) { return e.policy_id; }) 
          },
          reasoning: result.reasoning, confidence: result.confidence, status: 'success'
        });
      }
      
      Bus.publish('policy.drafted', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'drafter', result: result });
      Bus.publish('audit.logged', { 
        agent_id: self.id, action: 'policy_drafting', update_id: u.update_id, workflow_id: wf, severity: 'info', 
        message: 'Drafted ' + result.proposed_edits.length + ' proposed policy edits' 
      });
    } catch (err) {
        console.error('[DrafterAgent] Error during drafting:', err);
        Bus.publish('workflow.step.completed', { workflowId: wf, step: 'drafter', result: { error: err.message, proposed_edits: [] } });
    }
  };

  DrafterAgent.prototype._draft = async function (u, policies, decision) {
    var proposedEdits = [];
    var confidence = 0.85;
    
    if (policies && policies.matched_policies && policies.matched_policies.length > 0) {
      var targetPolicy = policies.matched_policies[0];
      
      // Call the real backend AI remediation endpoint
      try {
          const response = await fetch('/api/auto-remediate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ update: u, policy_id: targetPolicy.policy_id })
          });
          
          if (!response.ok) {
              throw new Error('Backend remediation failed with status ' + response.status);
          }
          
          const result = await response.json();
          
          if (result.edits && result.edits.length > 0) {
              // Map backend result to frontend structure
              proposedEdits = result.edits.map(edit => ({
                  policy_id: targetPolicy.policy_id,
                  policy_title: targetPolicy.title,
                  original_text: edit.original_text,
                  proposed_text: edit.proposed_text,
                  section_title: edit.section_title,
                  diff_type: edit.original_text ? 'modify' : 'add'
              }));
              confidence = result.confidence || 0.85;
          }
      } catch (err) {
          console.error('[DrafterAgent] Failed to fetch auto-remediation:', err);
          // Fallback to empty edits if backend fails
          proposedEdits = [];
      }
    }

    // Save proposed edits to state so the view can access them
    var allDrafts = window.AppCore.StateManager.getByPath('policyDrafts') || {};
    allDrafts[u.update_id] = proposedEdits;
    window.AppCore.StateManager.setState('policyDrafts', allDrafts);

    return {
      proposed_edits: proposedEdits,
      confidence: confidence,
      reasoning: 'Drafting agent successfully formulated ' + proposedEdits.length + ' proposed policy redlines using real AI auto-remediation via Groq. Edits are staged for human review.'
    };
  };

  window.AppCore.Agents.Drafter = new DrafterAgent();
})();
