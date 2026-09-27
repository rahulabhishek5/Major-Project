/**
 * UBS — Compliance Decision Agent, Risk Scoring Agent, Human Escalation Agent,
 *        Audit Agent, Notification Agent
 * (Combined for efficiency — each is a separate class)
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger, State = window.AppCore.StateManager;

  /* ═══════════════════════════════════════════════════════════
     COMPLIANCE DECISION AGENT
     ═══════════════════════════════════════════════════════════ */
  function DecisionAgent() { this.id = 'decision'; this.name = 'Compliance Decision Agent'; this._init(); }
  DecisionAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.decision', function (d) { self.process(d); });
  };
  DecisionAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    setTimeout(function () {
      var result = self._decide(u, data.classification, data.policies, data.impact);
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Decision: ' + result.action,
          inputs: { impact_level: data.impact ? data.impact.impact_level : 'N/A', policies_matched: data.policies ? data.policies.matched_policies.length : 0 },
          outputs: { action: result.action, action_items: result.action_items.length, timeline: result.timeline },
          reasoning: result.reasoning, confidence: result.confidence,
          status: result.action === 'COMPLY' ? 'success' : result.action === 'ESCALATE' ? 'warning' : result.action === 'DISMISS' ? 'skipped' : 'warning'
        });
      }
      Bus.publish('decision.made', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'decision', result: result });
      Bus.publish('audit.logged', { agent_id: self.id, action: 'decision', update_id: u.update_id, workflow_id: wf, severity: 'info', message: 'Decision: ' + result.action + ' — ' + result.reason });
    }, 400 + Math.random() * 200);
  };
  DecisionAgent.prototype._decide = function (u, classif, policies, impact) {
    var action, reason, timeline, actionItems = [];
    var impactLevel = impact ? impact.impact_level : 'LOW';
    var isAmbiguous = classif && classif.is_ambiguous;
    var hasGaps = policies && policies.gaps && policies.gaps.length > 0;
    var confidence = 0.85;

    if (isAmbiguous) {
      action = 'ESCALATE'; reason = 'Regulatory language contains significant ambiguity that requires human interpretation by legal/compliance subject matter experts.'; timeline = 'Within 5 business days';
      actionItems.push({ item: 'Route to Legal & Compliance team for interpretation', priority: 'high' });
      actionItems.push({ item: 'Request clarification from source authority if available', priority: 'medium' });
      confidence = 0.55;
    } else if (impactLevel === 'CRITICAL' || impactLevel === 'HIGH') {
      action = 'COMPLY'; reason = 'High-impact regulatory change requires mandatory compliance action across affected business lines.'; timeline = u.effective_date ? 'Before ' + u.effective_date : 'Within 90 days';
      if (impact && impact.changes_required) {
        impact.changes_required.forEach(function (c) { actionItems.push({ item: c.description, priority: c.priority, type: c.type }); });
      }
      if (hasGaps) actionItems.push({ item: 'Address identified policy gaps: ' + policies.gaps.map(function (g) { return g.description; }).join('; '), priority: 'high' });
      confidence = 0.88;
    } else if (impactLevel === 'MEDIUM') {
      action = 'COMPLY'; reason = 'Moderate-impact regulatory change requires planned compliance updates.'; timeline = u.effective_date ? 'Before ' + u.effective_date : 'Within 180 days';
      if (impact && impact.changes_required) {
        impact.changes_required.forEach(function (c) { actionItems.push({ item: c.description, priority: c.priority, type: c.type }); });
      }
      confidence = 0.82;
    } else {
      action = 'DEFER'; reason = 'Low-impact regulatory update. Can be addressed in the next scheduled policy review cycle.'; timeline = 'Next quarterly review';
      actionItems.push({ item: 'Include in next quarterly compliance review agenda', priority: 'low' });
      confidence = 0.9;
    }

    return {
      action: action, reason: reason, timeline: timeline, action_items: actionItems,
      confidence: confidence,
      requires_board_review: impactLevel === 'CRITICAL',
      requires_human_approval: action === 'ESCALATE' || impactLevel === 'CRITICAL',
      reasoning: 'Based on comprehensive analysis — impact level: ' + impactLevel + ', ambiguity: ' + (isAmbiguous ? 'YES' : 'NO') + ', policy gaps: ' + (hasGaps ? policies.gaps.length : 0) + ' — the decision is to ' + action + '. ' + reason + ' Timeline: ' + timeline + '. ' + actionItems.length + ' action items identified.'
    };
  };

  /* ═══════════════════════════════════════════════════════════
     RISK SCORING AGENT
     ═══════════════════════════════════════════════════════════ */
  function RiskAgent() { this.id = 'risk'; this.name = 'Risk Scoring Agent'; this._init(); }
  RiskAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.risk', function (d) { self.process(d); });
  };
  RiskAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    setTimeout(function () {
      var result = self._score(u, data.decision, data.impact);
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Risk scored: ' + result.category,
          inputs: { decision_action: data.decision ? data.decision.action : 'N/A', impact_score: data.impact ? data.impact.impact_score : 0 },
          outputs: { score: result.score, category: result.category, factors: result.factors },
          reasoning: result.reasoning, confidence: result.confidence, status: 'success'
        });
      }
      Bus.publish('risk.scored', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'risk', result: result });
      Bus.publish('audit.logged', { agent_id: self.id, action: 'risk_scoring', update_id: u.update_id, workflow_id: wf, severity: 'info', message: 'Risk Score: ' + result.score + '/100 (' + result.category + ')' });

      // Update risk distribution in state
      var stats = State.getByPath('stats') || {};
      stats.riskDistribution = stats.riskDistribution || { high: 0, medium: 0, low: 0 };
      if (result.score >= 70) stats.riskDistribution.high++;
      else if (result.score >= 40) stats.riskDistribution.medium++;
      else stats.riskDistribution.low++;
      State.setState('stats', stats);
    }, 250 + Math.random() * 100);
  };
  RiskAgent.prototype._score = function (u, decision, impact) {
    var score = 0;
    var factors = {};
    // Impact severity
    var impactScore = impact ? impact.impact_score : 30;
    factors.impact_severity = impactScore * 0.35;
    score += factors.impact_severity;
    // Urgency
    var urgency = 50;
    if (u.effective_date) {
      var daysUntil = (new Date(u.effective_date) - new Date()) / (1000 * 60 * 60 * 24);
      urgency = daysUntil < 30 ? 90 : daysUntil < 90 ? 70 : daysUntil < 180 ? 50 : 30;
    }
    factors.urgency = urgency * 0.25;
    score += factors.urgency;
    // Decision confidence (inverse)
    var decConfidence = decision ? decision.confidence : 0.5;
    factors.uncertainty = (1 - decConfidence) * 100 * 0.2;
    score += factors.uncertainty;
    // Penalty potential
    var text = (u.extracted_text || '').toLowerCase();
    var penaltyFactor = 0;
    if (text.indexOf('crore') !== -1) penaltyFactor = 80;
    else if (text.indexOf('million') !== -1) penaltyFactor = 70;
    else if (text.indexOf('penalty') !== -1) penaltyFactor = 50;
    factors.penalty_exposure = penaltyFactor * 0.2;
    score += factors.penalty_exposure;

    score = Math.max(5, Math.min(100, Math.round(score)));
    var category = H.getRiskLevel(score);
    var requiresEscalation = score > 80 || (decision && decision.action === 'ESCALATE');

    return {
      score: score, category: category, factors: factors, requiresEscalation: requiresEscalation,
      confidence: 0.88,
      reasoning: 'Composite risk score: ' + score + '/100 (' + category + '). Factors: Impact severity (' + factors.impact_severity.toFixed(1) + '), Urgency (' + factors.urgency.toFixed(1) + '), Uncertainty (' + factors.uncertainty.toFixed(1) + '), Penalty exposure (' + factors.penalty_exposure.toFixed(1) + '). ' + (requiresEscalation ? 'Score exceeds escalation threshold (80) — mandatory human review required.' : 'Score within auto-approval range.')
    };
  };

  /* ═══════════════════════════════════════════════════════════
     HUMAN ESCALATION AGENT
     ═══════════════════════════════════════════════════════════ */
  function EscalationAgent() { this.id = 'escalation'; this.name = 'Human Escalation Agent'; this._init(); }
  EscalationAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.escalation', function (d) { self.process(d); });
  };
  EscalationAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update;
    setTimeout(function () {
      var escalationId = H.generateId('ESC');
      var riskScore = data.risk ? data.risk.score : 50;
      var slaHours = riskScore >= 80 ? 4 : riskScore >= 60 ? 24 : 72;
      var reviewer = riskScore >= 80 ? 'Chief Compliance Officer' : riskScore >= 60 ? 'Senior Compliance Analyst' : 'Compliance Analyst';

      var escalation = {
        escalation_id: escalationId, workflow_id: wf, update_id: u.update_id,
        title: u.document_title || u.update_id,
        source: u.source_authority,
        risk_score: riskScore, risk_category: data.risk ? data.risk.category : 'MEDIUM',
        decision: data.decision, reason: data.decision ? data.decision.reason : 'Escalation required',
        assigned_reviewer: reviewer,
        sla_hours: slaHours,
        sla_deadline: new Date(Date.now() + slaHours * 3600000).toISOString(),
        created_at: new Date().toISOString(),
        status: 'pending',
        context: {
          jurisdiction: u.jurisdiction,
          business_lines: u.business_line_scope,
          impact: data.decision ? data.decision.action_items : [],
          regulatory_text_preview: (u.extracted_text || '').substring(0, 300) + '...'
        }
      };

      // Add to escalation queue
      var queue = State.getByPath('escalationQueue') || [];
      queue.push(escalation);
      State.setState('escalationQueue', queue);
      var stats = State.getByPath('stats') || {};
      stats.totalEscalated = (stats.totalEscalated || 0) + 1;
      State.setState('stats', stats);

      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Escalated to ' + reviewer,
          inputs: { risk_score: riskScore, decision: data.decision ? data.decision.action : 'N/A' },
          outputs: { escalation_id: escalationId, reviewer: reviewer, sla_hours: slaHours },
          reasoning: 'Risk score of ' + riskScore + ' triggered mandatory escalation to ' + reviewer + '. SLA: ' + slaHours + ' hours. The regulatory update requires human judgment due to: ' + (data.decision ? data.decision.reason : 'elevated risk score') + '. Awaiting human review before proceeding to notification phase.',
          confidence: 0.95, status: 'warning'
        });
      }

      Bus.publish('escalation.created', { escalation_id: escalationId, workflow_id: wf, update_id: u.update_id });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'escalation', result: escalation });
      Bus.publish('audit.logged', { agent_id: self.id, action: 'escalation_created', update_id: u.update_id, workflow_id: wf, severity: 'warning', message: 'Escalated to ' + reviewer + ' (SLA: ' + slaHours + 'h) — Risk: ' + riskScore + '/100' });
    }, 200);
  };

  /* ═══════════════════════════════════════════════════════════
     AUDIT & LOGGING AGENT
     ═══════════════════════════════════════════════════════════ */
  function AuditAgent() {
    this.id = 'audit'; this.name = 'Audit & Logging Agent'; this.logBuffer = [];
    this._init();
  }
  AuditAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('audit.logged', function (data) { self._log(data); });
  };
  AuditAgent.prototype._log = function (data) {
    var entry = {
      log_id: H.generateId('LOG'),
      timestamp: new Date().toISOString(),
      agent_id: data.agent_id || 'system',
      agent_name: this._agentName(data.agent_id),
      action: data.action || 'unknown',
      update_id: data.update_id || null,
      workflow_id: data.workflow_id || null,
      severity: data.severity || 'info',
      message: data.message || ''
    };
    this.logBuffer.push(entry);
    var log = State.getByPath('auditLog') || [];
    log.unshift(entry);
    if (log.length > 500) log = log.slice(0, 500);
    State.setState('auditLog', log);
  };
  AuditAgent.prototype._agentName = function (id) {
    var agents = (window.APP_DATA && window.APP_DATA.agentDefinitions) || [];
    var a = agents.find(function (x) { return x.id === id; });
    return a ? a.short_name : (id || 'System');
  };
  AuditAgent.prototype.exportLog = function () { return JSON.parse(JSON.stringify(this.logBuffer)); };

  /* ═══════════════════════════════════════════════════════════
     NOTIFICATION / TICKET AGENT
     ═══════════════════════════════════════════════════════════ */
  function NotificationAgent() { this.id = 'notification'; this.name = 'Notification & Ticket Agent'; this._init(); }
  NotificationAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.notification', function (d) { self.process(d); });
  };
  NotificationAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update;
    setTimeout(function () {
      var notifications = [];
      var decision = data.decision || {};
      var risk = data.risk || {};

      // JIRA ticket
      if (decision.action === 'COMPLY' || decision.action === 'ESCALATE') {
        notifications.push({
          type: 'jira_ticket',
          id: H.generateId('JIRA'),
          title: '[REG] ' + (u.document_title || u.update_id),
          priority: risk.score > 70 ? 'Critical' : risk.score > 40 ? 'High' : 'Medium',
          assignee: decision.action_items && decision.action_items[0] ? 'Compliance Team' : 'General',
          description: decision.reason,
          labels: [u.jurisdiction, risk.category || 'MEDIUM']
        });
      }

      // Email notification
      if (risk.score > 60) {
        notifications.push({
          type: 'email',
          to: 'compliance-team@ubs.com',
          subject: '[' + (risk.category || 'INFO') + '] New regulatory change: ' + (u.document_title || u.update_id),
          body: 'A new regulatory update requires attention. Risk score: ' + (risk.score || 'N/A') + '. Decision: ' + decision.action + '.'
        });
      }

      // Slack alert
      notifications.push({
        type: 'slack',
        channel: '#compliance-alerts',
        message: '📋 *' + decision.action + '* — ' + (u.document_title || u.update_id) + ' (Risk: ' + (risk.score || 'N/A') + ')'
      });

      var nList = State.getByPath('notifications') || [];
      notifications.forEach(function (n) { n.created_at = new Date().toISOString(); n.update_id = u.update_id; nList.push(n); });
      State.setState('notifications', nList);

      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Notifications sent',
          inputs: { decision: decision.action, risk: risk.score },
          outputs: { notifications_count: notifications.length, types: notifications.map(function (n) { return n.type; }) },
          reasoning: 'Generated ' + notifications.length + ' notification(s): ' + notifications.map(function (n) { return n.type; }).join(', ') + '. JIRA ticket created for compliance tracking. Stakeholders notified via appropriate channels based on risk severity.',
          confidence: 0.95, status: 'success'
        });
      }

      Bus.publish('notification.sent', { update_id: u.update_id, notifications: notifications });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'notification', result: { notifications: notifications } });
      Bus.publish('audit.logged', { agent_id: self.id, action: 'notifications_sent', update_id: u.update_id, workflow_id: wf, severity: 'info', message: 'Sent ' + notifications.length + ' notifications: ' + notifications.map(function (n) { return n.type; }).join(', ') });
    }, 300);
  };

  // Instantiate all
  window.AppCore.Agents.Decision = new DecisionAgent();
  window.AppCore.Agents.Risk = new RiskAgent();
  window.AppCore.Agents.Escalation = new EscalationAgent();
  window.AppCore.Agents.Audit = new AuditAgent();
  window.AppCore.Agents.Notification = new NotificationAgent();
})();
