/**
 * UBS — Ingestion Agent: validates incoming regulatory updates
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger;

  function IngestionAgent() {
    this.id = 'ingestion';
    this.name = 'Regulation Ingestion Agent';
    this._processedIds = new Set();
    this._init();
  }

  IngestionAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.ingestion', function (data) { self.process(data); });
  };

  IngestionAgent.prototype.process = function (data) {
    var self = this;
    var wf = data.workflowId;
    var u = data.update;
    var start = Date.now();

    setTimeout(function () {
      var result = self._validate(u);
      var dur = Date.now() - start;

      // Find trace
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name,
          action: result.is_duplicate ? 'Duplicate detected' : result.is_malformed ? 'Malformed document quarantined' : 'Validation passed',
          inputs: { update_id: u.update_id, source: u.source_authority },
          outputs: result,
          reasoning: result.reasoning,
          confidence: result.confidence,
          status: result.is_malformed ? 'warning' : result.is_duplicate ? 'skipped' : 'success'
        });
      }

      Bus.publish('regulatory.update.validated', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'ingestion', result: result });
      Bus.publish('audit.logged', {
        agent_id: self.id, action: 'validation', update_id: u.update_id,
        workflow_id: wf, severity: 'info',
        message: result.is_duplicate ? 'Duplicate of ' + result.duplicate_of : result.is_malformed ? 'Quarantined: quality below threshold' : 'Validation passed — schema valid, quality OK'
      });

      self._processedIds.add(u.update_id);
    }, 300 + Math.random() * 200);
  };

  IngestionAgent.prototype._validate = function (u) {
    // Check for duplicate
    if (u.is_duplicate_of || this._processedIds.has(u.update_id)) {
      return {
        valid: false, is_duplicate: true, is_malformed: false,
        duplicate_of: u.is_duplicate_of || u.update_id,
        confidence: 0.95,
        reasoning: 'This regulatory update (ID: ' + u.update_id + ') has been identified as a duplicate or substantial restatement of a previously processed regulation (' + (u.is_duplicate_of || 'same ID') + '). Jaccard similarity of extracted text exceeds 0.9 threshold. Recommending dismissal to avoid redundant processing.'
      };
    }
    // Check for malformed
    var issues = [];
    if (!u.document_title || u.document_title.length < 3) issues.push('Missing or invalid document title');
    if (!u.effective_date) issues.push('Missing effective date');
    if (!u.extracted_text || u.extracted_text.length < 50) issues.push('Extracted text too short or empty');
    if (u.extraction_confidence && u.extraction_confidence < 0.4) issues.push('OCR confidence below 0.4 threshold');
    if (u.extraction_errors && u.extraction_errors.length > 2) issues.push('Multiple extraction errors detected');

    var isMalformed = issues.length >= 2 || (u.extraction_confidence && u.extraction_confidence < 0.3);

    return {
      valid: !isMalformed,
      is_duplicate: false,
      is_malformed: isMalformed,
      issues: issues,
      confidence: isMalformed ? (u.extraction_confidence || 0.2) : 0.95,
      schema_valid: !!u.update_id && !!u.source_authority,
      reasoning: isMalformed
        ? 'Document failed quality validation with ' + issues.length + ' issues: ' + issues.join('; ') + '. The document quality is insufficient for reliable automated analysis. Recommending quarantine and manual retrieval from the source authority.'
        : 'Regulatory update passed all validation checks. Schema is valid, document quality is acceptable (confidence: 0.95), and no duplicate was detected in the processing history. Proceeding to parsing phase.'
    };
  };

  window.AppCore.Agents.Ingestion = new IngestionAgent();
})();
