/**
 * UBS — Impact Analysis Agent
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger;

  function ImpactAgent() { this.id = 'impact'; this.name = 'Impact Analysis Agent'; this._init(); }
  ImpactAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.impact', function (d) { self.process(d); });
  };

  ImpactAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    setTimeout(function () {
      var result = self._analyze(u, data.classification, data.policies);
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Impact analyzed',
          inputs: { classification: data.classification ? data.classification.primary_category : 'N/A', policies_matched: data.policies ? data.policies.matched_policies.length : 0 },
          outputs: { impact_level: result.impact_level, affected_systems: result.affected_systems.length, changes_required: result.changes_required.length },
          reasoning: result.reasoning, confidence: result.confidence,
          status: result.impact_level === 'HIGH' || result.impact_level === 'CRITICAL' ? 'warning' : 'success'
        });
      }
      Bus.publish('impact.analyzed', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'impact', result: result });
      Bus.publish('audit.logged', {
        agent_id: self.id, action: 'impact_analysis', update_id: u.update_id, workflow_id: wf, severity: 'info',
        message: 'Impact: ' + result.impact_level + ' | ' + result.affected_systems.length + ' systems affected | ' + result.changes_required.length + ' changes required'
      });
    }, 800 + Math.random() * 400);
  };

  ImpactAgent.prototype._analyze = function (u, classif, policies) {
    var text = (u.extracted_text || '').toLowerCase();
    var impactScore = 0;
    var affectedSystems = [], changesRequired = [], stakeholders = [];
    var advantages = [], disadvantages = [];

    // Score based on classification urgency
    if (classif) impactScore += classif.urgency_score * 0.3;

    // Policy gaps increase impact
    if (policies && policies.gaps) impactScore += policies.gaps.length * 15;

    // Penalty mentions increase impact
    if (text.indexOf('penalty') !== -1 || text.indexOf('penalt') !== -1) impactScore += 20;
    if (text.indexOf('crore') !== -1 || text.indexOf('million') !== -1) impactScore += 15;

    // Determine affected systems based on category
    var category = classif ? classif.category_key : '';
    if (category === 'DATA_PRIVACY' || text.indexOf('consent') !== -1) {
      affectedSystems.push('Customer Consent Management System', 'CRM Platform', 'Mobile Banking App', 'Internet Banking Portal', 'Data Warehouse');
      changesRequired.push({ type: 'system', description: 'Update consent collection workflows to support granular, purpose-specific permissions', priority: 'high', effort: 'medium' });
      changesRequired.push({ type: 'process', description: 'Implement consent withdrawal automation with 7-day SLA', priority: 'high', effort: 'high' });
      changesRequired.push({ type: 'policy', description: 'Update Data Privacy Policy to align with new consent requirements', priority: 'high', effort: 'low' });
      stakeholders.push('Data Protection Officer', 'Digital Banking Head', 'CTO', 'Legal Team');
      advantages.push('Enhanced customer trust through transparent data practices', 'Standardized cross-border data handling reducing long-term legal risks', 'Opportunity to clean and structure legacy data lakes');
      disadvantages.push('High initial cost for system refactoring', 'Potential increase in customer drop-off during onboarding due to complex consent screens', 'Strict 72-hour breach reporting limits margin for error');
      impactScore += 25;
    }
    if (category === 'LENDING' || text.indexOf('lending') !== -1) {
      affectedSystems.push('Loan Origination System', 'Digital Lending Platform', 'LSP Management Portal', 'Customer Communication Engine');
      changesRequired.push({ type: 'system', description: 'Update Key Fact Statement generation to include all-inclusive cost and standardized APR', priority: 'high', effort: 'medium' });
      changesRequired.push({ type: 'process', description: 'Implement 3-day cooling-off period enforcement across all digital lending channels', priority: 'high', effort: 'medium' });
      stakeholders.push('Digital Lending Head', 'Product Team', 'Compliance Officer');
      advantages.push('Fewer customer complaints due to transparent pricing', 'Better positioning against unregulated predatory lenders');
      disadvantages.push('Cooling-off period may negatively impact short-term revenue metrics', 'Increased overhead in managing third-party LSP compliance');
      impactScore += 20;
    }
    if (category === 'AI_TECHNOLOGY') {
      affectedSystems.push('Credit Scoring Engine', 'Fraud Detection System', 'Customer Segmentation AI', 'Risk Models Repository');
      changesRequired.push({ type: 'system', description: 'Conduct AI system inventory and classify by EU AI Act risk categories', priority: 'medium', effort: 'high' });
      changesRequired.push({ type: 'process', description: 'Implement fundamental rights impact assessment for high-risk AI systems', priority: 'medium', effort: 'high' });
      changesRequired.push({ type: 'governance', description: 'Establish AI model governance framework aligned with EU requirements', priority: 'medium', effort: 'high' });
      stakeholders.push('CTO', 'Chief Risk Officer', 'AI/ML Team Lead', 'EU Compliance Officer');
      advantages.push('Robust, bias-free credit models leading to fairer lending', 'Proactive alignment sets industry standard for ethical AI');
      disadvantages.push('Slower time-to-market for new ML models', 'High dependency on specialized external auditors for compliance verification');
      impactScore += 20;
    }
    if (category === 'TAX') {
      affectedSystems.push('Tax Computation Engine', 'TDS Module', 'Marketplace Platform');
      changesRequired.push({ type: 'policy', description: 'Clarify applicability of e-commerce operator definition to banking marketplace features', priority: 'medium', effort: 'low' });
      stakeholders.push('Tax Head', 'Legal Counsel', 'Digital Banking Head');
      advantages.push('Clearer tax liabilities prevent surprise audit penalties', 'Standardized reporting across all third-party seller transactions');
      disadvantages.push('Margin compression due to increased tax withholding overhead', 'Complexity in tracking cross-border digital sales');
      impactScore += 10;
    }
    if (affectedSystems.length === 0) {
      affectedSystems.push('General Compliance Framework');
      changesRequired.push({ type: 'review', description: 'Review regulatory update for potential applicability', priority: 'low', effort: 'low' });
      stakeholders.push('Compliance Officer');
      advantages.push('Maintains general regulatory alignment');
      disadvantages.push('Consumes compliance bandwidth for review');
    }

    impactScore = Math.max(10, Math.min(100, impactScore));
    var level = impactScore >= 80 ? 'CRITICAL' : impactScore >= 60 ? 'HIGH' : impactScore >= 35 ? 'MEDIUM' : 'LOW';
    var confidence = classif ? Math.min(classif.confidence, 0.9) : 0.6;
    if (classif && classif.is_ambiguous) confidence = Math.min(confidence, 0.55);

    return {
      impact_level: level,
      impact_score: impactScore,
      affected_systems: affectedSystems,
      changes_required: changesRequired,
      stakeholders: stakeholders,
      advantages: advantages,
      disadvantages: disadvantages,
      estimated_effort: changesRequired.filter(function (c) { return c.effort === 'high'; }).length > 1 ? 'High' : changesRequired.filter(function (c) { return c.effort === 'medium'; }).length > 0 ? 'Medium' : 'Low',
      confidence: confidence,
      reasoning: 'Impact assessment scored ' + impactScore + '/100 (' + level + '). ' +
        'Analysis considered: regulatory urgency (' + (classif ? classif.urgency_score : 'N/A') + '/100), ' +
        'policy gap count (' + (policies ? policies.gaps.length : 0) + '), ' +
        'penalty provisions (' + (text.indexOf('penalty') !== -1 ? 'present' : 'none') + '), ' +
        'and domain-specific system dependencies. ' +
        affectedSystems.length + ' systems identified as affected, requiring ' +
        changesRequired.length + ' distinct changes across system, process, and policy layers. ' +
        'Key stakeholders: ' + stakeholders.join(', ') + '.'
    };
  };

  window.AppCore.Agents.Impact = new ImpactAgent();
})();
