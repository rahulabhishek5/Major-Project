/**
 * UBS — OCR & Parsing Agent: extracts structured text from documents
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Agents = window.AppCore.Agents || {};
  var H = window.AppCore.Helpers, Bus = window.AppCore.EventBus, Trace = window.AppCore.TraceLogger;

  function ParserAgent() {
    this.id = 'parser'; this.name = 'OCR & Parsing Agent'; this._init();
  }

  ParserAgent.prototype._init = function () {
    var self = this;
    Bus.subscribe('agent.task.parser', function (d) { self.process(d); });
  };

  ParserAgent.prototype.process = function (data) {
    var self = this, wf = data.workflowId, u = data.update, start = Date.now();
    setTimeout(function () {
      var result = self._parse(u);
      var dur = Date.now() - start;
      var traces = Trace.getTracesByUpdate(u.update_id);
      var traceId = traces.length ? traces[traces.length - 1].trace_id : null;
      if (traceId) {
        Trace.addStep(traceId, {
          agent_id: self.id, agent_name: self.name,
          action: 'Document parsed',
          inputs: { format: u.document_format, text_length: (u.extracted_text || '').length },
          outputs: { confidence: result.confidence, word_count: result.word_count, sections_found: result.sections_found },
          reasoning: result.reasoning, confidence: result.confidence,
          status: result.confidence >= 0.7 ? 'success' : result.confidence >= 0.4 ? 'warning' : 'error'
        });
      }
      Bus.publish('regulatory.update.parsed', { update_id: u.update_id, result: result });
      Bus.publish('workflow.step.completed', { workflowId: wf, step: 'parser', result: result });
      Bus.publish('audit.logged', {
        agent_id: self.id, action: 'parsing', update_id: u.update_id, workflow_id: wf, severity: 'info',
        message: 'Parsed document: ' + result.word_count + ' words, confidence ' + (result.confidence * 100).toFixed(0) + '%'
      });
    }, 500 + Math.random() * 400);
  };

  ParserAgent.prototype._parse = function (u) {
    var text = u.extracted_text || '';
    var words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
    var confidence = u.extraction_confidence || (text.length > 200 ? 0.92 : text.length > 50 ? 0.7 : 0.3);
    var sections = text.split(/\n\n/).length;

    return {
      text: text,
      word_count: words.length,
      sections_found: sections,
      confidence: confidence,
      format: u.document_format || 'PDF',
      language: 'English',
      key_terms: this._extractKeyTerms(text),
      reasoning: confidence >= 0.7
        ? 'Document successfully parsed with high confidence (' + (confidence * 100).toFixed(0) + '%). Extracted ' + words.length + ' words across ' + sections + ' sections. Text quality is suitable for automated classification and analysis. Key regulatory terms have been identified for downstream processing.'
        : 'Document parsing completed with reduced confidence (' + (confidence * 100).toFixed(0) + '%). Text extraction quality may affect downstream analysis accuracy. ' + (u.extraction_errors ? 'Extraction issues: ' + u.extraction_errors.join('; ') : 'Consider manual verification of extracted content.')
    };
  };

  ParserAgent.prototype._extractKeyTerms = function (text) {
    var terms = ['compliance', 'regulation', 'penalty', 'consent', 'data protection', 'disclosure', 'breach', 'reporting', 'audit', 'risk', 'fiduciary', 'principal', 'processing', 'notification', 'assessment'];
    var lower = text.toLowerCase();
    return terms.filter(function (t) { return lower.indexOf(t) !== -1; });
  };

  window.AppCore.Agents.Parser = new ParserAgent();
})();
