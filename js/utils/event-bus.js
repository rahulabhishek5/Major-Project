/**
 * UBS Continuous Regulatory Change Manager
 * Event Bus — Pub/Sub communication backbone for agent orchestration
 *
 * @file event-bus.js
 * @description Provides a centralised publish/subscribe event bus that all
 *   agents and UI components use to communicate.  Supports wildcard
 *   subscriptions, priority ordering, event history with circular buffer,
 *   async (delayed) publishing, interceptors, and a debug mode.
 *
 * Attach to global namespace:  window.AppCore.EventBus
 *
 * Standard events:
 *   regulatory.update.received   — new regulatory text ingested
 *   regulatory.update.validated  — schema / sanity check passed
 *   regulatory.update.parsed     — NLP extraction complete
 *   regulatory.update.classified — jurisdiction + category assigned
 *   policy.retrieved             — internal policy document fetched
 *   impact.analyzed              — gap / impact analysis finished
 *   decision.made                — final compliance decision recorded
 *   risk.scored                  — risk score computed
 *   escalation.created           — item escalated to human reviewer
 *   escalation.resolved          — escalation closed
 *   audit.logged                 — audit trail entry written
 *   notification.sent            — UI or email notification dispatched
 *   agent.status.changed         — an agent's readiness changed
 *   workflow.step.completed      — one workflow step done
 *   workflow.completed           — entire workflow finished
 *   workflow.failed              — workflow terminated with error
 *   system.error                 — unrecoverable system-level error
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Constants                                                          */
  /* ------------------------------------------------------------------ */

  /** Maximum number of events retained in the circular history buffer. */
  var MAX_HISTORY = 1000;

  /** Catalogue of well-known events (for documentation / validation). */
  var STANDARD_EVENTS = [
    'regulatory.update.received',
    'regulatory.update.validated',
    'regulatory.update.parsed',
    'regulatory.update.classified',
    'policy.retrieved',
    'impact.analyzed',
    'decision.made',
    'risk.scored',
    'escalation.created',
    'escalation.resolved',
    'audit.logged',
    'notification.sent',
    'agent.status.changed',
    'workflow.step.completed',
    'workflow.completed',
    'workflow.failed',
    'system.error'
  ];

  /* ------------------------------------------------------------------ */
  /*  EventBus Class                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * @class EventBus
   * @classdesc A feature-rich publish/subscribe event bus for inter-agent and
   *   UI communication inside the PolicyPilot — Enterprise Compliance Manager.
   *
   * Features:
   *  - Named event channels with multiple subscribers
   *  - Priority-ordered callback execution (lower = first)
   *  - Wildcard subscriptions  (e.g. `'agent.*'` matches `'agent.status.changed'`)
   *  - Circular event history buffer (max 1 000 entries) for replay
   *  - Async publish with configurable delay
   *  - Interceptors that can transform or cancel events
   *  - Debug mode that logs every publish / subscribe to the console
   */
  function EventBus() {
    /**
     * Map of event name → sorted array of subscriber descriptors.
     * @type {Object.<string, Array<{callback: Function, priority: number, once: boolean, id: string}>>}
     * @private
     */
    this._subscribers = {};

    /**
     * Circular buffer of published events.
     * @type {Array<{event: string, data: *, timestamp: string, id: string}>}
     * @private
     */
    this._history = [];

    /**
     * Write-pointer for the circular history buffer.
     * @type {number}
     * @private
     */
    this._historyIndex = 0;

    /**
     * Whether the buffer has wrapped at least once.
     * @type {boolean}
     * @private
     */
    this._historyWrapped = false;

    /**
     * Array of interceptor functions.  Each receives `{event, data}` and
     * may return a modified copy, or `null` / `false` to cancel the event.
     * @type {Array<Function>}
     * @private
     */
    this._interceptors = [];

    /**
     * When `true`, every publish / subscribe action is logged to the console.
     * @type {boolean}
     */
    this.debugMode = false;

    /**
     * Monotonically increasing counter used to generate unique IDs.
     * @type {number}
     * @private
     */
    this._idCounter = 0;

    /**
     * Pending async timers so they can be cleared on `clear()`.
     * @type {Array<number>}
     * @private
     */
    this._pendingTimers = [];
  }

  /* ------------------------------------------------------------------ */
  /*  Private helpers                                                     */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a short unique ID.
   * @private
   * @returns {string}
   */
  EventBus.prototype._nextId = function () {
    this._idCounter += 1;
    return 'evt_' + this._idCounter + '_' + Date.now().toString(36);
  };

  /**
   * Test whether an event name matches a pattern that may contain wildcards.
   * The wildcard `*` matches exactly one segment; `**` or a trailing `.*`
   * matches one-or-more segments.
   *
   * Examples:
   *   _matchPattern('agent.*', 'agent.status.changed')  → true
   *   _matchPattern('regulatory.update.parsed', 'regulatory.update.parsed') → true
   *   _matchPattern('workflow.*', 'system.error') → false
   *
   * @private
   * @param {string} pattern - The subscription pattern.
   * @param {string} eventName - The concrete event name.
   * @returns {boolean}
   */
  EventBus.prototype._matchPattern = function (pattern, eventName) {
    if (pattern === eventName) return true;
    if (pattern === '*') return true;

    // Convert glob-style pattern to RegExp
    var regexStr = '^' + pattern
      .replace(/\./g, '\\.')          // escape dots
      .replace(/\*\*/g, '__.GLOBSTAR__')
      .replace(/\*/g, '[^.]+')        // single * = one segment
      .replace(/__\.GLOBSTAR__/g, '.+') // ** = one or more segments
      + '$';

    // Trailing .* should also match deeper nesting
    // e.g. 'agent.*' should match 'agent.status.changed'
    if (pattern.endsWith('.*')) {
      regexStr = '^' + pattern.slice(0, -2).replace(/\./g, '\\.') + '\\..+$';
    }

    return new RegExp(regexStr).test(eventName);
  };

  /**
   * Sort subscribers in-place by ascending priority.
   * @private
   * @param {string} event
   */
  EventBus.prototype._sortSubscribers = function (event) {
    if (this._subscribers[event]) {
      this._subscribers[event].sort(function (a, b) {
        return a.priority - b.priority;
      });
    }
  };

  /**
   * Push an entry into the circular history buffer.
   * @private
   * @param {string} event
   * @param {*} data
   */
  EventBus.prototype._recordHistory = function (event, data) {
    var entry = {
      id: this._nextId(),
      event: event,
      data: data,
      timestamp: new Date().toISOString()
    };

    if (this._history.length < MAX_HISTORY) {
      this._history.push(entry);
    } else {
      this._history[this._historyIndex] = entry;
      this._historyWrapped = true;
    }
    this._historyIndex = (this._historyIndex + 1) % MAX_HISTORY;
  };

  /**
   * Run all registered interceptors against an event.  Returns the
   * (possibly transformed) data, or `null` if any interceptor cancels it.
   * @private
   * @param {string} event
   * @param {*} data
   * @returns {*|null}
   */
  EventBus.prototype._runInterceptors = function (event, data) {
    var current = { event: event, data: data };
    for (var i = 0; i < this._interceptors.length; i++) {
      try {
        var result = this._interceptors[i](current);
        if (result === null || result === false) {
          if (this.debugMode) {
            console.warn('[EventBus] Event "' + event + '" cancelled by interceptor #' + i);
          }
          return null;
        }
        if (typeof result === 'object' && result !== null) {
          current = result;
        }
      } catch (err) {
        console.error('[EventBus] Interceptor #' + i + ' threw:', err);
      }
    }
    return current.data;
  };

  /**
   * Collect all matching subscriber descriptors for a given event,
   * including wildcard patterns.
   * @private
   * @param {string} event
   * @returns {Array<{callback: Function, priority: number, once: boolean, id: string, pattern: string}>}
   */
  EventBus.prototype._collectSubscribers = function (event) {
    var self = this;
    var matches = [];
    var patterns = Object.keys(this._subscribers);
    patterns.forEach(function (pattern) {
      if (self._matchPattern(pattern, event)) {
        self._subscribers[pattern].forEach(function (sub) {
          matches.push(Object.assign({}, sub, { pattern: pattern }));
        });
      }
    });
    matches.sort(function (a, b) { return a.priority - b.priority; });
    return matches;
  };

  /* ------------------------------------------------------------------ */
  /*  Public API                                                         */
  /* ------------------------------------------------------------------ */

  /**
   * Subscribe to an event (or wildcard pattern).
   *
   * @param {string} event - Event name or wildcard pattern (e.g. `'agent.*'`).
   * @param {Function} callback - Function to invoke when the event fires.
   *   Receives `(data, meta)` where meta = `{event, timestamp, id}`.
   * @param {Object}  [options]
   * @param {number}  [options.priority=10] - Lower values execute first.
   * @param {boolean} [options.once=false]  - Auto-unsubscribe after first call.
   * @returns {string} Subscription ID (can be used for targeted unsubscribe).
   */
  EventBus.prototype.subscribe = function (event, callback, options) {
    if (typeof event !== 'string' || !event) {
      throw new Error('[EventBus] subscribe: "event" must be a non-empty string.');
    }
    if (typeof callback !== 'function') {
      throw new Error('[EventBus] subscribe: "callback" must be a function.');
    }

    options = options || {};
    var priority = typeof options.priority === 'number' ? options.priority : 10;
    var once = !!options.once;
    var id = this._nextId();

    if (!this._subscribers[event]) {
      this._subscribers[event] = [];
    }

    this._subscribers[event].push({
      id: id,
      callback: callback,
      priority: priority,
      once: once
    });

    this._sortSubscribers(event);

    if (this.debugMode) {
      console.log('[EventBus] subscribe "' + event + '" priority=' + priority +
        ' once=' + once + ' id=' + id);
    }

    return id;
  };

  /**
   * Remove a subscriber.
   *
   * @param {string} event - The event pattern originally subscribed to.
   * @param {Function|string} callbackOrId - The original callback reference,
   *   or the subscription ID returned by `subscribe()`.
   * @returns {boolean} `true` if a subscriber was removed.
   */
  EventBus.prototype.unsubscribe = function (event, callbackOrId) {
    if (!this._subscribers[event]) return false;

    var list = this._subscribers[event];
    var removed = false;
    for (var i = list.length - 1; i >= 0; i--) {
      if (list[i].callback === callbackOrId || list[i].id === callbackOrId) {
        list.splice(i, 1);
        removed = true;
        break;                         // remove only the first match
      }
    }

    if (removed && list.length === 0) {
      delete this._subscribers[event];
    }

    if (this.debugMode && removed) {
      console.log('[EventBus] unsubscribe "' + event + '"');
    }

    return removed;
  };

  /**
   * Publish an event synchronously.
   *
   * @param {string} event - Concrete event name (no wildcards).
   * @param {*} [data] - Arbitrary payload.
   * @returns {number} Number of subscribers that were invoked.
   */
  EventBus.prototype.publish = function (event, data) {
    if (typeof event !== 'string' || !event) {
      throw new Error('[EventBus] publish: "event" must be a non-empty string.');
    }

    // Run interceptors
    var processedData = this._runInterceptors(event, data);
    if (processedData === null && data !== null && data !== undefined) {
      return 0;  // cancelled
    }
    // If interceptors returned null but original data was null/undefined, allow it
    if (processedData === null && (data === null || data === undefined)) {
      processedData = data;
    }

    // Record in history
    this._recordHistory(event, processedData);

    var meta = {
      event: event,
      timestamp: new Date().toISOString(),
      id: this._nextId()
    };

    if (this.debugMode) {
      console.log('[EventBus] publish "' + event + '"', processedData);
    }

    // Collect matching subscribers (including wildcards)
    var subs = this._collectSubscribers(event);
    var invoked = 0;
    var toRemove = [];

    for (var i = 0; i < subs.length; i++) {
      var sub = subs[i];
      try {
        sub.callback(processedData, meta);
        invoked += 1;
      } catch (err) {
        console.error('[EventBus] Subscriber error on "' + event + '":', err);
      }
      if (sub.once) {
        toRemove.push(sub);
      }
    }

    // Clean up once-listeners
    var self = this;
    toRemove.forEach(function (sub) {
      self.unsubscribe(sub.pattern, sub.id);
    });

    return invoked;
  };

  /**
   * Publish an event after a configurable delay.
   *
   * @param {string} event - Event name.
   * @param {*} [data] - Payload.
   * @param {number} [delayMs=0] - Milliseconds to wait before publishing.
   * @returns {number} Timer ID (can be cleared with `clearTimeout`).
   */
  EventBus.prototype.publishAsync = function (event, data, delayMs) {
    var self = this;
    delayMs = typeof delayMs === 'number' && delayMs > 0 ? delayMs : 0;

    var timerId = setTimeout(function () {
      self.publish(event, data);
      // Remove from pending list
      var idx = self._pendingTimers.indexOf(timerId);
      if (idx !== -1) self._pendingTimers.splice(idx, 1);
    }, delayMs);

    this._pendingTimers.push(timerId);
    return timerId;
  };

  /**
   * Retrieve the event history, optionally filtered by event name.
   *
   * @param {string} [event] - If provided, only entries matching this name
   *   (exact match, no wildcards) are returned.
   * @returns {Array<{id: string, event: string, data: *, timestamp: string}>}
   */
  EventBus.prototype.getHistory = function (event) {
    var ordered;
    if (this._historyWrapped) {
      // Reconstruct chronological order from the circular buffer
      ordered = this._history.slice(this._historyIndex)
        .concat(this._history.slice(0, this._historyIndex));
    } else {
      ordered = this._history.slice();
    }

    if (typeof event === 'string' && event) {
      return ordered.filter(function (entry) {
        return entry.event === event;
      });
    }
    return ordered;
  };

  /**
   * Remove all subscribers, clear history, and cancel pending async publishes.
   */
  EventBus.prototype.clear = function () {
    this._subscribers = {};
    this._history = [];
    this._historyIndex = 0;
    this._historyWrapped = false;
    this._interceptors = [];

    this._pendingTimers.forEach(function (id) { clearTimeout(id); });
    this._pendingTimers = [];

    if (this.debugMode) {
      console.log('[EventBus] cleared');
    }
  };

  /**
   * Return the number of subscribers for an exact event pattern.
   *
   * @param {string} event
   * @returns {number}
   */
  EventBus.prototype.getSubscriberCount = function (event) {
    if (!this._subscribers[event]) return 0;
    return this._subscribers[event].length;
  };

  /**
   * Register an interceptor.  Interceptors run **before** subscribers and
   * may transform event data or cancel the event entirely.
   *
   * @param {Function} fn - Receives `{event, data}`.  Return the (possibly
   *   modified) object to continue, or `null`/`false` to cancel.
   * @returns {Function} The same function (for easy removal).
   */
  EventBus.prototype.addInterceptor = function (fn) {
    if (typeof fn !== 'function') {
      throw new Error('[EventBus] addInterceptor: argument must be a function.');
    }
    this._interceptors.push(fn);
    return fn;
  };

  /**
   * Remove a previously registered interceptor.
   *
   * @param {Function} fn
   * @returns {boolean}
   */
  EventBus.prototype.removeInterceptor = function (fn) {
    var idx = this._interceptors.indexOf(fn);
    if (idx !== -1) {
      this._interceptors.splice(idx, 1);
      return true;
    }
    return false;
  };

  /**
   * Replay all historical events for a given event name by re-publishing them.
   *
   * @param {string} event - The event name to replay.
   * @returns {number} Number of events replayed.
   */
  EventBus.prototype.replay = function (event) {
    var history = this.getHistory(event);
    var self = this;
    history.forEach(function (entry) {
      self.publish(entry.event, entry.data);
    });
    return history.length;
  };

  /**
   * Return the list of well-known standard events.
   * @returns {string[]}
   */
  EventBus.prototype.getStandardEvents = function () {
    return STANDARD_EVENTS.slice();
  };

  /**
   * Check whether a given event name is in the standard catalogue.
   * @param {string} event
   * @returns {boolean}
   */
  EventBus.prototype.isStandardEvent = function (event) {
    return STANDARD_EVENTS.indexOf(event) !== -1;
  };

  /* ------------------------------------------------------------------ */
  /*  Attach to global namespace                                         */
  /* ------------------------------------------------------------------ */

  window.AppCore = window.AppCore || {};
  window.AppCore.EventBus = new EventBus();
  window.AppCore.EventBusClass = EventBus;   // expose constructor for tests

})();
