/**
 * UBS — Regulation Classification Agent
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger;

  var CATEGORIES = {
    DATA_PRIVACY: { label: 'Data Privacy & Protection', keywords: ['personal data', 'consent', 'data principal', 'data fiduciary', 'privacy', 'dpdp', 'gdpr', 'data protection'] },
    LENDING: { label: 'Lending & Credit', keywords: ['lending', 'loan', 'credit', 'borrower', 'apr', 'interest rate', 'disbursement', 'kfs'] },
    AI_TECHNOLOGY: { label: 'AI & Technology Regulation', keywords: ['artificial intelligence', 'ai act', 'machine learning', 'algorithm', 'high-risk ai', 'automated decision'] },
    TAX: { label: 'Tax & Fiscal', keywords: ['tds', 'tax', 'income tax', 'section 194', 'cbdt', 'fiscal', 'e-commerce'] },
    KYC_AML: { label: 'KYC & AML', keywords: ['kyc', 'know your customer', 'anti-money laundering', 'aml', 'pmla', 'suspicious transaction'] },
    SECURITIES: { label: 'Securities & Markets', keywords: ['sebi', 'securities', 'mutual fund', 'market', 'trading', 'investment'] },
    LABOUR: { label: 'Labour & Employment', keywords: ['wages', 'labour', 'employee', 'gratuity', 'provident fund', 'working hours', 'overtime'] }
  };

  function ClassifierAgent() {
    this.id = 'classifier'; this.name = 'Regulation Classification Agent'; this._init();
  }

  ClassifierAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.classifier', function (d) { self.process(d); });
  };

  ClassifierAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    setTimeout(function () {
      var result = self._classify(u);
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Classified regulation',
          inputs: { jurisdiction: u.jurisdiction, source: u.source_authority },
          outputs: result,
          reasoning: result.reasoning, confidence: result.confidence,
          status: result.confidence >= 0.7 ? 'success' : 'warning'
        });
      }
      Bus.publish('regulatory.update.classified', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'classifier', result: result });
      Bus.publish('audit.logged', {
        agent_id: self.id, action: 'classification', update_id: u.update_id, workflow_id: wf, severity: 'info',
        message: 'Classified as ' + result.primary_category + ' | Urgency: ' + result.urgency_score + '/100 | Jurisdiction: ' + result.jurisdiction
      });
    }, 400 + Math.random() * 200);
  };

  ClassifierAgent.prototype._classify = function (u) {
    var text = (u.extracted_text || '').toLowerCase();
    var title = (u.document_title || '').toLowerCase();
    var combined = title + ' ' + text;

    // Score each category
    var scores = {};
    var topCategory = null, topScore = 0;
    Object.keys(CATEGORIES).forEach(function (key) {
      var cat = CATEGORIES[key];
      var score = 0;
      cat.keywords.forEach(function (kw) {
        var regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        var matches = combined.match(regex);
        score += matches ? matches.length : 0;
      });
      scores[key] = score;
      if (score > topScore) { topScore = score; topCategory = key; }
    });

    // Urgency scoring
    var urgency = 50;
    if (u.priority === 'high') urgency += 25;
    if (u.priority === 'low') urgency -= 20;
    if (u.effective_date) {
      var daysUntil = (new Date(u.effective_date) - new Date()) / (1000 * 60 * 60 * 24);
      if (daysUntil < 30) urgency += 20;
      else if (daysUntil < 90) urgency += 10;
      else if (daysUntil > 365) urgency -= 10;
    }
    if (combined.indexOf('penalty') !== -1 || combined.indexOf('penalt') !== -1) urgency += 10;
    urgency = Math.max(0, Math.min(100, urgency));

    // Multi-jurisdiction check
    var isMultiJurisdiction = u.jurisdiction !== 'India' || combined.indexOf('cross-border') !== -1 || combined.indexOf('third-country') !== -1;

    // Ambiguity check
    var ambiguityMarkers = ['may include', 'shall be determined', 'at a future date', 'from time to time', 'prudent interpretation'];
    var ambiguityCount = 0;
    ambiguityMarkers.forEach(function (m) { if (combined.indexOf(m) !== -1) ambiguityCount++; });
    var isAmbiguous = ambiguityCount >= 2;

    var confidence = topScore > 5 ? 0.9 : topScore > 2 ? 0.75 : topScore > 0 ? 0.55 : 0.3;
    if (isAmbiguous) confidence = Math.min(confidence, 0.6);

    return {
      primary_category: topCategory ? CATEGORIES[topCategory].label : 'Uncategorized',
      category_key: topCategory || 'UNKNOWN',
      category_scores: scores,
      urgency_score: urgency,
      jurisdiction: u.jurisdiction || 'Unknown',
      is_multi_jurisdiction: isMultiJurisdiction,
      is_ambiguous: isAmbiguous,
      ambiguity_count: ambiguityCount,
      business_lines: u.business_line_scope || [],
      source_type: u.source_type,
      confidence: confidence,
      reasoning: this._buildReasoning(u, topCategory, urgency, isMultiJurisdiction, isAmbiguous, confidence, topScore)
    };
  };

  ClassifierAgent.prototype._buildReasoning = function (u, cat, urgency, multiJuris, ambiguous, conf, score) {
    var parts = [];
    parts.push('Regulatory update "' + (u.document_title || u.update_id) + '" from ' + u.source_authority + ' has been classified as ' + (cat ? CATEGORIES[cat].label : 'Uncategorized') + ' with confidence ' + (conf * 100).toFixed(0) + '% (keyword match score: ' + score + ').');
    parts.push('Urgency assessment: ' + urgency + '/100' + (u.effective_date ? ' (effective date: ' + u.effective_date + ')' : ' (no effective date specified)') + '.');
    if (multiJuris) parts.push('⚠️ Multi-jurisdiction flag raised — this regulation may have cross-border implications requiring coordinated compliance across jurisdictions.');
    if (ambiguous) parts.push('⚠️ Ambiguity detected — regulatory language contains ' + 'multiple markers of interpretive uncertainty. Escalation to legal/compliance SMEs may be required for definitive interpretation.');
    if (u.business_line_scope && u.business_line_scope.length) parts.push('Applicable business lines: ' + u.business_line_scope.join(', ') + '.');
    return parts.join(' ');
  };

  window.AppCore.Agents.Classifier = new ClassifierAgent();
})();
