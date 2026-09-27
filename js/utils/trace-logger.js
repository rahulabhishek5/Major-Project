/**
 * UBS Continuous Regulatory Change Manager
 * Trace Logger — Full decision-trace recording for agent workflows
 *
 * @file trace-logger.js
 * @description Records every processing step that agents take while handling
 *   a regulatory update.  Each trace captures the complete decision chain:
 *   inputs, outputs, reasoning, confidence scores, timing, and status.
 *   Traces can be exported as JSON or replayed through the EventBus.
 *
 * Attach to global namespace:  window.AppCore.TraceLogger
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Constants                                                          */
  /* ------------------------------------------------------------------ */

  /** Valid trace-level statuses. */
  var TRACE_STATUSES = ['completed', 'failed', 'escalated', 'in_progress'];

  /** Valid step-level statuses. */
  var STEP_STATUSES = ['success', 'warning', 'error', 'skipped'];

  /** Maximum number of traces retained in memory (oldest are evicted). */
  var MAX_TRACES = 500;

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a short unique ID with an optional prefix.
   * @param {string} [prefix='TRC']
   * @returns {string}
   */
  function generateId(prefix) {
    prefix = prefix || 'TRC';
    var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var id = '';
    for (var i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + '-' + id;
  }

  /**
   * Deep-clone via JSON round-trip.
   * @param {*} val
   * @returns {*}
   */
  function deepClone(val) {
    if (val === null || val === undefined) return val;
    if (typeof val !== 'object') return val;
    try {
      return JSON.parse(JSON.stringify(val));
    } catch (_e) {
      return val;
    }
  }

  /* ------------------------------------------------------------------ */
  /*  TraceLogger Class                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * @class TraceLogger
   * @classdesc Records agent decision traces for regulatory-update processing.
   *
   * Usage flow:
   *   1. `startTrace(updateId, metadata)` → returns `traceId`
   *   2. For each agent action call `addStep(traceId, stepData)`
   *   3. Call `completeTrace(traceId, finalDecision)` or `failTrace(traceId, error)`
   *   4. Retrieve / export / replay with the query methods.
   */
  function TraceLogger() {
    /**
     * Map of traceId → trace object.
     * @type {Object.<string, Object>}
     * @private
     */
    this._traces = {};

    /**
     * Insertion-ordered list of trace IDs (for LRU eviction).
     * @type {string[]}
     * @private
     */
    this._traceOrder = [];

    /**
     * When true, lifecycle events are logged to the console.
     * @type {boolean}
     */
    this.debugMode = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Enforce the MAX_TRACES limit by removing the oldest trace(s).
   * @private
   */
  TraceLogger.prototype._evict = function () {
    while (this._traceOrder.length > MAX_TRACES) {
      var oldId = this._traceOrder.shift();
      delete this._traces[oldId];
    }
  };

  /**
   * Publish a trace-related event on the global EventBus if available.
   * @private
   * @param {string} event
   * @param {Object} data
   */
  TraceLogger.prototype._emitEvent = function (event, data) {
    if (window.AppCore && window.AppCore.EventBus && typeof window.AppCore.EventBus.publish === 'function') {
      window.AppCore.EventBus.publish(event, data);
    }
  };

  /**
   * Validate that a trace exists and optionally that it is still in progress.
   * @private
   * @param {string} traceId
   * @param {boolean} [mustBeInProgress=false]
   * @returns {Object} The trace object.
   * @throws {Error}
   */
  TraceLogger.prototype._getValidTrace = function (traceId, mustBeInProgress) {
    var trace = this._traces[traceId];
    if (!trace) {
      throw new Error('[TraceLogger] Trace not found: ' + traceId);
    }
    if (mustBeInProgress && trace.status !== 'in_progress') {
      throw new Error('[TraceLogger] Trace "' + traceId + '" is already ' + trace.status + '.');
    }
    return trace;
  };

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Begin a new decision trace.
   *
   * @param {string} updateId - The regulatory-update identifier this trace is for.
   * @param {Object} [metadata] - Additional metadata.
   * @param {Object} [metadata.agent_versions] - Map of agentId → version string.
   * @param {string} [metadata.triggered_by] - What started this workflow.
   * @param {string|null} [metadata.replay_of] - If this is a replay, the original traceId.
   * @returns {string} The generated trace ID.
   */
  TraceLogger.prototype.startTrace = function (updateId, metadata) {
    if (typeof updateId !== 'string' || !updateId) {
      throw new Error('[TraceLogger] startTrace: "updateId" must be a non-empty string.');
    }

    var traceId = generateId('TRC');
    metadata = metadata || {};

    var trace = {
      trace_id: traceId,
      update_id: updateId,
      started_at: new Date().toISOString(),
      completed_at: null,
      total_duration_ms: 0,
      status: 'in_progress',
      final_decision: null,
      steps: [],
      metadata: {
        agent_versions: metadata.agent_versions || {},
        triggered_by: metadata.triggered_by || 'system',
        replay_of: metadata.replay_of || null
      }
    };

    this._traces[traceId] = trace;
    this._traceOrder.push(traceId);
    this._evict();

    if (this.debugMode) {
      console.log('[TraceLogger] startTrace', traceId, 'for update', updateId);
    }

    // Sync to StateManager
    if (window.AppCore && window.AppCore.StateManager) {
      window.AppCore.StateManager.setState('traces.' + traceId, deepClone(trace));
    }

    this._emitEvent('audit.logged', {
      type: 'trace_started',
      traceId: traceId,
      updateId: updateId,
      timestamp: trace.started_at
    });

    return traceId;
  };

  /**
   * Add a processing step to an in-progress trace.
   *
   * @param {string} traceId
   * @param {Object} step
   * @param {string} step.agent_id      - Identifier of the agent.
   * @param {string} step.agent_name    - Human-readable agent name.
   * @param {string} step.action        - What the agent did (e.g. 'classify_update').
   * @param {number} [step.duration_ms=0] - How long the action took.
   * @param {Object} [step.inputs]       - Data the agent received.
   * @param {Object} [step.outputs]      - Data the agent produced.
   * @param {string} [step.reasoning]    - Detailed explanation of the decision.
   * @param {number} [step.confidence=1] - Confidence score 0–1.
   * @param {string} [step.status='success'] - 'success' | 'warning' | 'error' | 'skipped'.
   * @param {Object} [step.metadata]     - Any extra info.
   * @returns {Object} The normalised step object.
   */
  TraceLogger.prototype.addStep = function (traceId, step) {
    var trace = this._getValidTrace(traceId, true);

    if (!step || typeof step !== 'object') {
      throw new Error('[TraceLogger] addStep: "step" must be a non-null object.');
    }
    if (typeof step.agent_id !== 'string' || !step.agent_id) {
      throw new Error('[TraceLogger] addStep: "step.agent_id" is required.');
    }
    if (typeof step.action !== 'string' || !step.action) {
      throw new Error('[TraceLogger] addStep: "step.action" is required.');
    }

    // Validate step status
    var stepStatus = step.status || 'success';
    if (STEP_STATUSES.indexOf(stepStatus) === -1) {
      console.warn('[TraceLogger] Unknown step status "' + stepStatus + '", defaulting to "success".');
      stepStatus = 'success';
    }

    var normalised = {
      step_index: trace.steps.length,
      agent_id: step.agent_id,
      agent_name: step.agent_name || step.agent_id,
      action: step.action,
      timestamp: new Date().toISOString(),
      duration_ms: typeof step.duration_ms === 'number' ? step.duration_ms : 0,
      inputs: deepClone(step.inputs || {}),
      outputs: deepClone(step.outputs || {}),
      reasoning: step.reasoning || '',
      confidence: typeof step.confidence === 'number' ? Math.max(0, Math.min(1, step.confidence)) : 1,
      status: stepStatus,
      metadata: deepClone(step.metadata || {})
    };

    trace.steps.push(normalised);

    if (this.debugMode) {
      console.log('[TraceLogger] addStep', traceId, '#' + normalised.step_index,
        normalised.agent_name + '/' + normalised.action, '(' + normalised.status + ')');
    }

    // Sync to StateManager
    if (window.AppCore && window.AppCore.StateManager) {
      window.AppCore.StateManager.setState('traces.' + traceId + '.steps', deepClone(trace.steps));
    }

    this._emitEvent('workflow.step.completed', {
      traceId: traceId,
      updateId: trace.update_id,
      step: deepClone(normalised)
    });

    return normalised;
  };

  /**
   * Mark a trace as successfully completed.
   *
   * @param {string} traceId
   * @param {Object} finalDecision - The compliance / routing decision.
   * @param {string} [finalDecision.action]       - 'approve' | 'reject' | 'escalate' | etc.
   * @param {string} [finalDecision.rationale]    - Human-readable explanation.
   * @param {number} [finalDecision.risk_score]   - 0–100 risk score.
   * @param {string} [finalDecision.risk_level]   - 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'.
   * @param {number} [finalDecision.confidence]   - 0–1 overall confidence.
   * @returns {Object} The completed trace.
   */
  TraceLogger.prototype.completeTrace = function (traceId, finalDecision) {
    var trace = this._getValidTrace(traceId, true);

    trace.completed_at = new Date().toISOString();
    trace.total_duration_ms = new Date(trace.completed_at).getTime() -
      new Date(trace.started_at).getTime();
    trace.status = 'completed';
    trace.final_decision = deepClone(finalDecision || {});

    // Check if any step had an escalation-like output
    var hasEscalation = trace.steps.some(function (s) {
      return (s.outputs && s.outputs.escalate === true) ||
        (s.action && s.action.toLowerCase().indexOf('escalat') !== -1);
    });
    if (hasEscalation) {
      trace.status = 'escalated';
    }

    if (this.debugMode) {
      console.log('[TraceLogger] completeTrace', traceId, trace.status,
        trace.total_duration_ms + 'ms');
    }

    // Sync to StateManager
    if (window.AppCore && window.AppCore.StateManager) {
      window.AppCore.StateManager.setState('traces.' + traceId, deepClone(trace));
    }

    this._emitEvent('workflow.completed', {
      traceId: traceId,
      updateId: trace.update_id,
      status: trace.status,
      duration_ms: trace.total_duration_ms,
      decision: deepClone(trace.final_decision)
    });

    this._emitEvent('audit.logged', {
      type: 'trace_completed',
      traceId: traceId,
      updateId: trace.update_id,
      status: trace.status,
      timestamp: trace.completed_at
    });

    return deepClone(trace);
  };

  /**
   * Mark a trace as failed.
   *
   * @param {string} traceId
   * @param {Error|string|Object} error - Error information.
   * @returns {Object} The failed trace.
   */
  TraceLogger.prototype.failTrace = function (traceId, error) {
    var trace = this._getValidTrace(traceId, true);

    trace.completed_at = new Date().toISOString();
    trace.total_duration_ms = new Date(trace.completed_at).getTime() -
      new Date(trace.started_at).getTime();
    trace.status = 'failed';

    // Normalise error into the final_decision slot
    var errorInfo;
    if (error instanceof Error) {
      errorInfo = { error: error.message, stack: error.stack };
    } else if (typeof error === 'string') {
      errorInfo = { error: error };
    } else {
      errorInfo = deepClone(error) || { error: 'Unknown error' };
    }
    trace.final_decision = errorInfo;

    if (this.debugMode) {
      console.error('[TraceLogger] failTrace', traceId, errorInfo);
    }

    // Sync to StateManager
    if (window.AppCore && window.AppCore.StateManager) {
      window.AppCore.StateManager.setState('traces.' + traceId, deepClone(trace));
    }

    this._emitEvent('workflow.failed', {
      traceId: traceId,
      updateId: trace.update_id,
      error: deepClone(errorInfo),
      timestamp: trace.completed_at
    });

    this._emitEvent('audit.logged', {
      type: 'trace_failed',
      traceId: traceId,
      updateId: trace.update_id,
      error: deepClone(errorInfo),
      timestamp: trace.completed_at
    });

    return deepClone(trace);
  };

  /**
   * Retrieve a single trace by ID.
   *
   * @param {string} traceId
   * @returns {Object|null} Deep-cloned trace, or `null` if not found.
   */
  TraceLogger.prototype.getTrace = function (traceId) {
    var trace = this._traces[traceId];
    return trace ? deepClone(trace) : null;
  };

  /**
   * Return all traces, optionally filtered by status.
   *
   * @param {Object} [filters]
   * @param {string} [filters.status] - Filter by trace status.
   * @param {number} [filters.limit]  - Maximum number of results.
   * @returns {Array<Object>}
   */
  TraceLogger.prototype.getAllTraces = function (filters) {
    filters = filters || {};
    var self = this;
    var results = this._traceOrder.map(function (id) {
      return deepClone(self._traces[id]);
    }).filter(function (t) {
      return !!t;
    });

    if (filters.status) {
      results = results.filter(function (t) {
        return t.status === filters.status;
      });
    }

    if (typeof filters.limit === 'number' && filters.limit > 0) {
      results = results.slice(-filters.limit);
    }

    return results;
  };

  /**
   * Return all traces associated with a given regulatory update ID.
   *
   * @param {string} updateId
   * @returns {Array<Object>}
   */
  TraceLogger.prototype.getTracesByUpdate = function (updateId) {
    if (typeof updateId !== 'string' || !updateId) return [];

    var self = this;
    return this._traceOrder
      .map(function (id) { return self._traces[id]; })
      .filter(function (t) { return t && t.update_id === updateId; })
      .map(function (t) { return deepClone(t); });
  };

  /**
   * Export a trace as a downloadable JSON blob (triggers browser download).
   *
   * @param {string} traceId
   * @returns {string} The JSON string.
   */
  TraceLogger.prototype.exportTrace = function (traceId) {
    var trace = this._traces[traceId];
    if (!trace) {
      throw new Error('[TraceLogger] exportTrace: trace not found: ' + traceId);
    }

    var json = JSON.stringify(trace, null, 2);

    // Trigger download if in a browser environment
    if (typeof document !== 'undefined' && typeof Blob !== 'undefined') {
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'trace_' + traceId + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    return json;
  };

  /**
   * Replay a completed trace by re-emitting each step's events through
   * the EventBus with simulated delays.
   *
   * @param {string} traceId
   * @param {Object} [options]
   * @param {number} [options.speedFactor=1] - Replay speed multiplier (2 = 2× faster).
   * @returns {string} The new trace ID created for the replay.
   */
  TraceLogger.prototype.replayTrace = function (traceId, options) {
    var original = this._traces[traceId];
    if (!original) {
      throw new Error('[TraceLogger] replayTrace: trace not found: ' + traceId);
    }

    options = options || {};
    var speedFactor = options.speedFactor || 1;

    // Start a new trace that references the original
    var replayId = this.startTrace(original.update_id, {
      agent_versions: original.metadata.agent_versions,
      triggered_by: 'replay',
      replay_of: traceId
    });

    var self = this;
    var cumulativeDelay = 0;

    original.steps.forEach(function (step) {
      var delay = Math.max(1, Math.round(step.duration_ms / speedFactor));
      cumulativeDelay += delay;

      setTimeout(function () {
        try {
          self.addStep(replayId, {
            agent_id: step.agent_id,
            agent_name: step.agent_name,
            action: step.action,
            duration_ms: step.duration_ms,
            inputs: step.inputs,
            outputs: step.outputs,
            reasoning: '[REPLAY] ' + step.reasoning,
            confidence: step.confidence,
            status: step.status,
            metadata: Object.assign({}, step.metadata, { replayed_from: traceId })
          });
        } catch (err) {
          console.error('[TraceLogger] Replay step error:', err);
        }
      }, cumulativeDelay);
    });

    // Complete the replay trace after all steps
    setTimeout(function () {
      try {
        if (original.status === 'failed') {
          self.failTrace(replayId, original.final_decision);
        } else {
          self.completeTrace(replayId, original.final_decision);
        }
      } catch (err) {
        console.error('[TraceLogger] Replay completion error:', err);
      }
    }, cumulativeDelay + 50);

    if (this.debugMode) {
      console.log('[TraceLogger] replayTrace', traceId, '→', replayId,
        'total delay:', cumulativeDelay + 'ms');
    }

    return replayId;
  };

  /**
   * Get summary statistics across all stored traces.
   *
   * @returns {Object} Stats object with counts and averages.
   */
  TraceLogger.prototype.getStats = function () {
    var stats = {
      total: 0,
      completed: 0,
      failed: 0,
      escalated: 0,
      in_progress: 0,
      avgDuration_ms: 0,
      avgSteps: 0,
      avgConfidence: 0
    };

    var totalDuration = 0;
    var totalSteps = 0;
    var totalConfidence = 0;
    var completedCount = 0;

    var self = this;
    this._traceOrder.forEach(function (id) {
      var trace = self._traces[id];
      if (!trace) return;

      stats.total += 1;
      stats[trace.status] = (stats[trace.status] || 0) + 1;
      totalSteps += trace.steps.length;

      if (trace.status !== 'in_progress') {
        totalDuration += trace.total_duration_ms;
        completedCount += 1;

        // Average confidence from final step or decision
        if (trace.final_decision && typeof trace.final_decision.confidence === 'number') {
          totalConfidence += trace.final_decision.confidence;
        } else if (trace.steps.length > 0) {
          totalConfidence += trace.steps[trace.steps.length - 1].confidence;
        }
      }
    });

    if (completedCount > 0) {
      stats.avgDuration_ms = Math.round(totalDuration / completedCount);
      stats.avgConfidence = +(totalConfidence / completedCount).toFixed(3);
    }
    if (stats.total > 0) {
      stats.avgSteps = +(totalSteps / stats.total).toFixed(1);
    }

    return stats;
  };

  /**
   * Remove all traces from memory.
   */
  TraceLogger.prototype.clearAll = function () {
    this._traces = {};
    this._traceOrder = [];
    if (this.debugMode) {
      console.log('[TraceLogger] all traces cleared');
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Attach to global namespace                                         */
  /* ------------------------------------------------------------------ */

  window.AppCore = window.AppCore || {};
  window.AppCore.TraceLogger = new TraceLogger();
  window.AppCore.TraceLoggerClass = TraceLogger;

})();
