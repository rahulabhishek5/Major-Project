/**
 * UBS — Policy Retrieval Agent (RAG): semantic matching of policies
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger;

  function RetrieverAgent() { this.id = 'retriever'; this.name = 'Policy Retrieval Agent (RAG)'; this._init(); }

  RetrieverAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.retriever', function (d) { self.process(d); });
  };

  RetrieverAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    setTimeout(function () {
      var result = self._retrieve(u);
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name, action: 'Policies retrieved',
          inputs: { policy_refs: u.existing_internal_policy_refs, business_lines: u.business_line_scope },
          outputs: { matched: result.matched_policies.length, gaps: result.gaps.length },
          reasoning: result.reasoning, confidence: result.confidence,
          status: result.matched_policies.length > 0 ? 'success' : 'warning'
        });
      }
      Bus.publish('policy.retrieved', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'retriever', result: result });
      Bus.publish('audit.logged', {
        agent_id: self.id, action: 'retrieval', update_id: u.update_id, workflow_id: wf, severity: 'info',
        message: 'Retrieved ' + result.matched_policies.length + ' matching policies, identified ' + result.gaps.length + ' gaps'
      });
    }, 500 + Math.random() * 300);
  };

  RetrieverAgent.prototype._retrieve = function (u) {
    var policies = (window.APP_DATA && window.APP_DATA.policies) || [];
    var controls = (window.APP_DATA && window.APP_DATA.controls) || [];
    var refs = u.existing_internal_policy_refs || [];
    var text = (u.extracted_text || '').toLowerCase();

    // Match by explicit references and region
    var matched = [];
    policies.forEach(function (p) {
      var score = 0, matchReason = [];
      
      // Regional filtering
      var regRegion = u.jurisdiction;
      var polRegion = p.region || [];
      if (regRegion && polRegion.length > 0 && polRegion.indexOf(regRegion) === -1) {
        return; // Skip policy, it does not apply to the regulation's region
      } else if (regRegion && polRegion.indexOf(regRegion) !== -1) {
        score += 0.2;
        matchReason.push('Regional Match (' + regRegion + ')');
      }

      if (refs.indexOf(p.policy_id) !== -1) { score += 0.5; matchReason.push('Explicitly referenced in regulatory update'); }
      // Semantic similarity simulation
      var pText = (p.summary + ' ' + p.title).toLowerCase();
      var sim = H.calculateSimilarity(text.substring(0, 500), pText);
      score += sim * 0.5;
      if (sim > 0.1) matchReason.push('Semantic similarity: ' + (sim * 100).toFixed(0) + '%');
      // Business line overlap
      var blOverlap = (u.business_line_scope || []).filter(function (bl) {
        return p.business_lines && (p.business_lines.indexOf(bl) !== -1 || p.business_lines.indexOf('All Business Lines') !== -1);
      });
      if (blOverlap.length > 0) { score += 0.15; matchReason.push('Business line overlap: ' + blOverlap.join(', ')); }

      if (score > 0.2) {
        matched.push({ policy_id: p.policy_id, title: p.title, version: p.version, status: p.status, relevance_score: Math.min(1, score), match_reasons: matchReason });
      }
    });
    matched.sort(function (a, b) { return b.relevance_score - a.relevance_score; });

    // Identify gaps
    var gaps = [];
    if (matched.length === 0) {
      gaps.push({ type: 'no_coverage', description: 'No existing internal policy covers this regulatory domain. A new policy may need to be drafted.', severity: 'high' });
    }
    matched.forEach(function (m) {
      var pol = policies.find(function (p) { return p.policy_id === m.policy_id; });
      if (pol && pol.status === 'under_review') {
        gaps.push({ type: 'outdated_policy', policy_id: m.policy_id, description: 'Policy "' + pol.title + '" is currently under review and may not reflect latest requirements.', severity: 'medium' });
      }
      if (pol) {
        var lastUpdated = new Date(pol.last_updated);
        var sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        if (lastUpdated < sixMonthsAgo) {
          gaps.push({ type: 'stale_policy', policy_id: m.policy_id, description: 'Policy "' + pol.title + '" was last updated ' + H.formatRelativeTime(pol.last_updated) + ' and may need refresh.', severity: 'low' });
        }
      }
    });

    // Match controls
    var matchedControls = [];
    controls.forEach(function (c) {
      var linked = (c.linked_policies || []).some(function (lp) { return refs.indexOf(lp) !== -1; });
      if (linked) matchedControls.push({ control_id: c.control_id, title: c.title, status: c.status, effectiveness: c.effectiveness });
    });

    var confidence = matched.length > 0 ? 0.85 + (matched[0].relevance_score * 0.1) : 0.4;
    return {
      matched_policies: matched,
      matched_controls: matchedControls,
      gaps: gaps,
      total_policies_searched: policies.length,
      confidence: Math.min(1, confidence),
      reasoning: this._buildReasoning(matched, gaps, matchedControls, policies.length)
    };
  };

  RetrieverAgent.prototype._buildReasoning = function (matched, gaps, controls, total) {
    var parts = [];
    parts.push('Searched ' + total + ' internal policies using a combination of explicit reference matching, semantic similarity analysis, and business line overlap scoring.');
    if (matched.length > 0) {
      parts.push('Found ' + matched.length + ' relevant policies. Top match: "' + matched[0].title + '" (relevance: ' + (matched[0].relevance_score * 100).toFixed(0) + '%).');
    } else {
      parts.push('⚠️ No matching internal policies found. This regulatory domain may represent a coverage gap requiring new policy development.');
    }
    if (controls.length > 0) parts.push('Identified ' + controls.length + ' linked controls that may require updates.');
    if (gaps.length > 0) parts.push('Detected ' + gaps.length + ' policy gap(s): ' + gaps.map(function (g) { return g.description; }).join('; '));
    return parts.join(' ');
  };

  window.AppCore.Agents.Retriever = new RetrieverAgent();
})();
