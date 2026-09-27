/**
 * UBS Continuous Regulatory Change Manager
 * State Manager — Centralised, observable application state
 *
 * @file state.js
 * @description Provides a single source of truth for all application state.
 *   Supports dot-notation path access, path-level subscriptions that fire
 *   on changes, full state snapshots, and a change-history log for debugging.
 *
 * Attach to global namespace:  window.AppCore.StateManager
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Constants                                                          */
  /* ------------------------------------------------------------------ */

  /** Maximum number of state-change records kept for debugging. */
  var MAX_CHANGE_HISTORY = 500;

  /* ------------------------------------------------------------------ */
  /*  Default initial state                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Returns a fresh copy of the initial state tree.
   * Called on construction and on `resetState()`.
   * @returns {Object}
   */
  function createInitialState() {
    return {
      /** @type {string} Currently active view / route */
      currentView: 'dashboard',

      /** @type {Array<Object>} Raw incoming regulatory updates */
      regulatoryUpdates: [],

      /** @type {Array<Object>} Updates that have been fully processed */
      processedUpdates: [],

      /** @type {Object.<string, Object>} Active workflow instances keyed by ID */
      activeWorkflows: {},

      /** @type {Object.<string, Object>} Agent readiness / health keyed by agent ID */
      agentStatuses: {},

      /** @type {Array<Object>} Items awaiting human escalation review */
      escalationQueue: [],

      /** @type {Array<Object>} Immutable audit trail */
      auditLog: [],

      /** @type {Array<Object>} User-facing notification messages */
      notifications: [],

      /** @type {Array<Object>} Final compliance decisions */
      decisions: [],

      /** @type {Object.<string, Object>} Agent decision traces keyed by trace ID */
      traces: {},

      /** @type {Object} Aggregate statistics for the dashboard */
      stats: {
        totalProcessed: 0,
        totalPending: 0,
        totalEscalated: 0,
        avgProcessingTime: 0,
        complianceScore: 94.2,
        riskDistribution: { high: 0, medium: 0, low: 0 }
      },

      /** @type {Object} Filter selections for feed and audit views */
      filters: {
        feed: { jurisdiction: 'all', priority: 'all', status: 'all' },
        audit: { agent: 'all', severity: 'all', dateRange: 'all' }
      },

      /** @type {Object} Transient UI state */
      ui: {
        sidebarCollapsed: false,
        selectedUpdateId: null,
        selectedTraceId: null,
        selectedPolicyId: null,
        modalOpen: false,
        toasts: []
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /*  StateManager Class                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * @class StateManager
   * @classdesc Centralised state container with path-based subscriptions,
   *   dot-notation getters/setters, and change history.
   */
  function StateManager() {
    /** @private */
    this._state = createInitialState();

    /**
     * Map of dot-notation path → array of listener callbacks.
     * The special path `'*'` receives **all** changes.
     * @type {Object.<string, Array<Function>>}
     * @private
     */
    this._listeners = {};

    /**
     * Circular buffer of state mutation records.
     * @type {Array<{path: string, oldValue: *, newValue: *, timestamp: string}>}
     * @private
     */
    this._changeHistory = [];

    /**
     * Write-pointer for the circular change history.
     * @type {number}
     * @private
     */
    this._changeIndex = 0;

    /**
     * Whether the change history buffer has wrapped.
     * @type {boolean}
     * @private
     */
    this._changeWrapped = false;

    /**
     * When true, all mutations are logged to the console.
     * @type {boolean}
     */
    this.debugMode = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Internal helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Deep-clone a value using structured-clone-safe JSON round-trip.
   * Falls back to the value itself for primitives.
   * @private
   * @param {*} value
   * @returns {*}
   */
  function deepClone(value) {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (_e) {
      return value;
    }
  }

  /**
   * Resolve a dot-notation path against an object tree.
   * @private
   * @param {Object} obj
   * @param {string} path - e.g. `'stats.riskDistribution.high'`
   * @returns {*} The value at the path, or `undefined`.
   */
  function getValueByPath(obj, path) {
    if (!path) return obj;
    var segments = path.split('.');
    var current = obj;
    for (var i = 0; i < segments.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = current[segments[i]];
    }
    return current;
  }

  /**
   * Set a value at a dot-notation path, creating intermediate objects as
   * needed.  Returns the previous value.
   * @private
   * @param {Object} obj
   * @param {string} path
   * @param {*} value
   * @returns {*} Previous value at the path.
   */
  function setValueByPath(obj, path, value) {
    var segments = path.split('.');
    var current = obj;
    for (var i = 0; i < segments.length - 1; i++) {
      var seg = segments[i];
      if (current[seg] === undefined || current[seg] === null || typeof current[seg] !== 'object') {
        current[seg] = {};
      }
      current = current[seg];
    }
    var lastSeg = segments[segments.length - 1];
    var oldValue = current[lastSeg];
    current[lastSeg] = value;
    return oldValue;
  }

  /**
   * Record a mutation into the circular change-history buffer.
   * @private
   * @param {string} path
   * @param {*} oldValue
   * @param {*} newValue
   */
  StateManager.prototype._recordChange = function (path, oldValue, newValue) {
    var entry = {
      path: path,
      oldValue: deepClone(oldValue),
      newValue: deepClone(newValue),
      timestamp: new Date().toISOString()
    };

    if (this._changeHistory.length < MAX_CHANGE_HISTORY) {
      this._changeHistory.push(entry);
    } else {
      this._changeHistory[this._changeIndex] = entry;
      this._changeWrapped = true;
    }
    this._changeIndex = (this._changeIndex + 1) % MAX_CHANGE_HISTORY;
  };

  /**
   * Notify all listeners whose subscribed path is a prefix of (or equal to)
   * the mutated path, plus any wildcard (`'*'`) listeners.
   * @private
   * @param {string} changedPath
   * @param {*} newValue
   * @param {*} oldValue
   */
  StateManager.prototype._notifyListeners = function (changedPath, newValue, oldValue) {
    var patterns = Object.keys(this._listeners);
    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      var shouldNotify = false;

      if (pattern === '*') {
        shouldNotify = true;
      } else if (changedPath === pattern) {
        shouldNotify = true;
      } else if (changedPath.indexOf(pattern + '.') === 0) {
        // Listener subscribed to a parent path
        shouldNotify = true;
      } else if (pattern.indexOf(changedPath + '.') === 0) {
        // Listener subscribed to a child path — still notify because parent changed
        shouldNotify = true;
      }

      if (shouldNotify) {
        var callbacks = this._listeners[pattern];
        for (var j = 0; j < callbacks.length; j++) {
          try {
            callbacks[j]({
              path: changedPath,
              newValue: deepClone(newValue),
              oldValue: deepClone(oldValue),
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.error('[StateManager] Listener error for path "' + pattern + '":', err);
          }
        }
      }
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Return a deep-cloned snapshot of the full application state.
   * @returns {Object}
   */
  StateManager.prototype.getState = function () {
    return deepClone(this._state);
  };

  /**
   * Set a value at the given dot-notation path and notify subscribers.
   *
   * @param {string} path - Dot-notation path, e.g. `'stats.totalProcessed'`.
   * @param {*} value - The new value.
   * @returns {*} The previous value at the path.
   * @throws {Error} If path is empty or not a string.
   */
  StateManager.prototype.setState = function (path, value) {
    if (typeof path !== 'string' || !path) {
      throw new Error('[StateManager] setState: "path" must be a non-empty string.');
    }

    var oldValue = deepClone(getValueByPath(this._state, path));
    setValueByPath(this._state, path, value);
    var newValue = deepClone(value);

    // Skip notification if value hasn't actually changed (shallow compare)
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      return oldValue;
    }

    this._recordChange(path, oldValue, newValue);

    if (this.debugMode) {
      console.log('[StateManager] setState "' + path + '"', newValue);
    }

    this._notifyListeners(path, newValue, oldValue);

    // Also publish on EventBus if available
    if (window.AppCore && window.AppCore.EventBus && typeof window.AppCore.EventBus.publish === 'function') {
      window.AppCore.EventBus.publish('state.changed', { path: path, newValue: newValue, oldValue: oldValue });
    }

    return oldValue;
  };

  /**
   * Retrieve a deep-cloned value at a dot-notation path.
   *
   * @param {string} path
   * @returns {*}
   */
  StateManager.prototype.getByPath = function (path) {
    return deepClone(getValueByPath(this._state, path));
  };

  /**
   * Subscribe to changes at a specific path (or `'*'` for all changes).
   *
   * @param {string} path - Dot-notation path, or `'*'`.
   * @param {Function} callback - Receives `{path, newValue, oldValue, timestamp}`.
   * @returns {Function} An unsubscribe function — call it to stop listening.
   */
  StateManager.prototype.subscribe = function (path, callback) {
    if (typeof path !== 'string' || !path) {
      throw new Error('[StateManager] subscribe: "path" must be a non-empty string.');
    }
    if (typeof callback !== 'function') {
      throw new Error('[StateManager] subscribe: "callback" must be a function.');
    }

    if (!this._listeners[path]) {
      this._listeners[path] = [];
    }
    this._listeners[path].push(callback);

    // Return unsubscribe handle
    var listeners = this._listeners;
    return function unsubscribe() {
      var list = listeners[path];
      if (!list) return;
      var idx = list.indexOf(callback);
      if (idx !== -1) list.splice(idx, 1);
      if (list.length === 0) delete listeners[path];
    };
  };

  /**
   * Batch-update multiple paths at once, firing a single round of
   * notifications after all mutations are applied.
   *
   * @param {Object.<string, *>} updates - Map of path → value.
   */
  StateManager.prototype.batchUpdate = function (updates) {
    if (typeof updates !== 'object' || updates === null) {
      throw new Error('[StateManager] batchUpdate: "updates" must be a non-null object.');
    }

    var changes = [];
    var paths = Object.keys(updates);
    for (var i = 0; i < paths.length; i++) {
      var path = paths[i];
      var oldValue = deepClone(getValueByPath(this._state, path));
      setValueByPath(this._state, path, updates[path]);
      var newValue = deepClone(updates[path]);

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        this._recordChange(path, oldValue, newValue);
        changes.push({ path: path, newValue: newValue, oldValue: oldValue });
      }
    }

    if (this.debugMode && changes.length > 0) {
      console.log('[StateManager] batchUpdate — ' + changes.length + ' change(s)');
    }

    for (var j = 0; j < changes.length; j++) {
      this._notifyListeners(changes[j].path, changes[j].newValue, changes[j].oldValue);
    }
  };

  /**
   * Reset the state to its initial defaults and notify all listeners.
   */
  StateManager.prototype.resetState = function () {
    this._state = createInitialState();
    this._changeHistory = [];
    this._changeIndex = 0;
    this._changeWrapped = false;

    // Clear persistence
    try {
      localStorage.removeItem('ubs_regulatory_updates');
      localStorage.removeItem('ubs_processed_updates');
      localStorage.removeItem('ubs_escalation_queue');
      localStorage.removeItem('ubs_audit_log');
    } catch (_e) {}

    if (this.debugMode) {
      console.log('[StateManager] state reset to defaults');
    }

    // Notify wildcard listeners
    this._notifyListeners('*', this.getState(), null);
  };

  /**
   * Return the change history in chronological order.
   *
   * @param {string} [path] - Optional path filter.
   * @returns {Array<{path: string, oldValue: *, newValue: *, timestamp: string}>}
   */
  StateManager.prototype.getHistory = function (path) {
    var ordered;
    if (this._changeWrapped) {
      ordered = this._changeHistory.slice(this._changeIndex)
        .concat(this._changeHistory.slice(0, this._changeIndex));
    } else {
      ordered = this._changeHistory.slice();
    }

    if (typeof path === 'string' && path) {
      return ordered.filter(function (entry) {
        return entry.path === path || entry.path.indexOf(path + '.') === 0;
      });
    }
    return ordered;
  };

  /**
   * Convenience: push a value onto an array-typed state path.
   *
   * @param {string} path - Path to an array in state.
   * @param {*} item - Item to push.
   * @returns {number} New length of the array.
   * @throws {Error} If the value at path is not an array.
   */
  StateManager.prototype.pushTo = function (path, item) {
    var arr = getValueByPath(this._state, path);
    if (!Array.isArray(arr)) {
      throw new Error('[StateManager] pushTo: value at "' + path + '" is not an array.');
    }
    var oldArr = deepClone(arr);
    arr.push(item);
    this._recordChange(path, oldArr, deepClone(arr));
    this._notifyListeners(path, deepClone(arr), oldArr);
    return arr.length;
  };

  /**
   * Convenience: remove items from an array-typed state path by predicate.
   *
   * @param {string} path - Path to an array in state.
   * @param {Function} predicate - Items for which this returns `true` are removed.
   * @returns {Array} The removed items.
   */
  StateManager.prototype.removeFrom = function (path, predicate) {
    var arr = getValueByPath(this._state, path);
    if (!Array.isArray(arr)) {
      throw new Error('[StateManager] removeFrom: value at "' + path + '" is not an array.');
    }
    var oldArr = deepClone(arr);
    var removed = [];
    for (var i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i], i)) {
        removed.unshift(arr.splice(i, 1)[0]);
      }
    }
    if (removed.length > 0) {
      this._recordChange(path, oldArr, deepClone(arr));
      this._notifyListeners(path, deepClone(arr), oldArr);
    }
    return removed;
  };

  /**
   * Return the number of active path subscriptions.
   * @returns {number}
   */
  StateManager.prototype.getListenerCount = function () {
    var count = 0;
    var paths = Object.keys(this._listeners);
    for (var i = 0; i < paths.length; i++) {
      count += this._listeners[paths[i]].length;
    }
    return count;
  };

  /* ------------------------------------------------------------------ */
  /*  Attach to global namespace                                         */
  /* ------------------------------------------------------------------ */

  window.AppCore = window.AppCore || {};
  window.AppCore.StateManager = new StateManager();
  window.AppCore.StateManagerClass = StateManager;

})();
