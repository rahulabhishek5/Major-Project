/**
 * UBS Continuous Regulatory Change Manager
 * Helpers — General-purpose utility functions
 *
 * @file helpers.js
 * @description A collection of pure (or near-pure) utility functions used
 *   throughout the PolicyPilot — Enterprise Compliance Manager UI and agent layer.
 *
 * Attach to global namespace:  window.AppCore.Helpers
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Internal counter for unique ID generation                          */
  /* ------------------------------------------------------------------ */
  var _idCounter = 0;

  /* ================================================================== */
  /*  Date / Time                                                        */
  /* ================================================================== */

  /**
   * Format an ISO-8601 date string into a human-readable representation.
   *
   * Supported format tokens:
   *   YYYY — 4-digit year
   *   MM   — zero-padded month
   *   DD   — zero-padded day
   *   HH   — zero-padded hours (24 h)
   *   mm   — zero-padded minutes
   *   ss   — zero-padded seconds
   *   MMM  — abbreviated month name (Jan, Feb, …)
   *   MMMM — full month name
   *
   * @param {string|Date} isoString - ISO date string or Date object.
   * @param {string} [format='YYYY-MM-DD HH:mm'] - Format template.
   * @returns {string} Formatted date string, or `'—'` on invalid input.
   */
  function formatDate(isoString, format) {
    if (!isoString) return '—';

    var d;
    try {
      d = isoString instanceof Date ? isoString : new Date(isoString);
      if (isNaN(d.getTime())) return '—';
    } catch (_e) {
      return '—';
    }

    format = format || 'YYYY-MM-DD HH:mm';

    var months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    var monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };

    return format
      .replace('YYYY', d.getFullYear())
      .replace('MMMM', months[d.getMonth()])
      .replace('MMM', monthsShort[d.getMonth()])
      .replace('MM', pad(d.getMonth() + 1))
      .replace('DD', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()))
      .replace('ss', pad(d.getSeconds()));
  }

  /**
   * Return a human-friendly relative time string (e.g. "2 hours ago",
   * "just now", "in 3 days").
   *
   * @param {string|Date} isoString
   * @returns {string}
   */
  function formatRelativeTime(isoString) {
    if (!isoString) return '—';

    var d;
    try {
      d = isoString instanceof Date ? isoString : new Date(isoString);
      if (isNaN(d.getTime())) return '—';
    } catch (_e) {
      return '—';
    }

    var now = Date.now();
    var diffMs = now - d.getTime();
    var abs = Math.abs(diffMs);
    var isFuture = diffMs < 0;

    var seconds = Math.floor(abs / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    var weeks = Math.floor(days / 7);
    var months = Math.floor(days / 30);
    var years = Math.floor(days / 365);

    var label;
    if (seconds < 10) label = 'just now';
    else if (seconds < 60) label = seconds + ' seconds';
    else if (minutes === 1) label = '1 minute';
    else if (minutes < 60) label = minutes + ' minutes';
    else if (hours === 1) label = '1 hour';
    else if (hours < 24) label = hours + ' hours';
    else if (days === 1) label = '1 day';
    else if (days < 7) label = days + ' days';
    else if (weeks === 1) label = '1 week';
    else if (weeks < 5) label = weeks + ' weeks';
    else if (months === 1) label = '1 month';
    else if (months < 12) label = months + ' months';
    else if (years === 1) label = '1 year';
    else label = years + ' years';

    if (label === 'just now') return label;
    return isFuture ? 'in ' + label : label + ' ago';
  }

  /* ================================================================== */
  /*  ID Generation                                                      */
  /* ================================================================== */

  /**
   * Generate a unique ID with an optional prefix.
   *
   * @param {string} [prefix='ID'] - Short prefix, e.g. `'TRC'`, `'UPD'`, `'WF'`.
   * @returns {string} e.g. `'TRC-a1b2c3d4'`
   */
  function generateId(prefix) {
    prefix = prefix || 'ID';
    _idCounter += 1;
    var random = Math.random().toString(36).substring(2, 8);
    var timePart = Date.now().toString(36).slice(-4);
    return prefix + '-' + random + timePart;
  }

  /* ================================================================== */
  /*  Function utilities                                                 */
  /* ================================================================== */

  /**
   * Debounce a function — it will only execute after `ms` milliseconds
   * have elapsed since the last invocation.
   *
   * @param {Function} fn
   * @param {number} ms - Delay in milliseconds.
   * @returns {Function} Debounced function with a `.cancel()` method.
   */
  function debounce(fn, ms) {
    if (typeof fn !== 'function') throw new Error('[Helpers] debounce: first argument must be a function.');
    ms = typeof ms === 'number' ? ms : 250;

    var timer = null;

    var debounced = function () {
      var context = this;
      var args = arguments;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = null;
        fn.apply(context, args);
      }, ms);
    };

    debounced.cancel = function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    return debounced;
  }

  /**
   * Throttle a function — it will execute at most once every `ms` milliseconds.
   *
   * @param {Function} fn
   * @param {number} ms - Minimum interval in milliseconds.
   * @returns {Function} Throttled function.
   */
  function throttle(fn, ms) {
    if (typeof fn !== 'function') throw new Error('[Helpers] throttle: first argument must be a function.');
    ms = typeof ms === 'number' ? ms : 250;

    var lastCall = 0;
    var timer = null;

    return function () {
      var context = this;
      var args = arguments;
      var now = Date.now();
      var remaining = ms - (now - lastCall);

      if (remaining <= 0) {
        if (timer) { clearTimeout(timer); timer = null; }
        lastCall = now;
        fn.apply(context, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          lastCall = Date.now();
          timer = null;
          fn.apply(context, args);
        }, remaining);
      }
    };
  }

  /* ================================================================== */
  /*  Object / Data utilities                                            */
  /* ================================================================== */

  /**
   * Deep-clone a value using JSON round-trip.
   *
   * @param {*} obj
   * @returns {*}
   */
  function deepClone(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (_e) {
      // Fallback: shallow copy
      if (Array.isArray(obj)) return obj.slice();
      return Object.assign({}, obj);
    }
  }

  /**
   * Return a Promise that resolves after `ms` milliseconds.
   * Useful for simulating processing delays in agents.
   *
   * @param {number} ms
   * @returns {Promise<void>}
   */
  function sleep(ms) {
    ms = typeof ms === 'number' && ms > 0 ? ms : 0;
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /* ================================================================== */
  /*  Text utilities                                                     */
  /* ================================================================== */

  /**
   * Truncate text to a maximum length, appending an ellipsis if truncated.
   *
   * @param {string} text
   * @param {number} [maxLength=100]
   * @param {string} [suffix='…']
   * @returns {string}
   */
  function truncateText(text, maxLength, suffix) {
    if (typeof text !== 'string') return '';
    maxLength = typeof maxLength === 'number' ? maxLength : 100;
    suffix = typeof suffix === 'string' ? suffix : '…';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Highlight occurrences of `query` within `text` by wrapping them in
   * `<mark>` tags.  Case-insensitive.
   *
   * @param {string} text - The source text.
   * @param {string} query - The search query to highlight.
   * @returns {string} HTML string with matches wrapped in `<mark>`.
   */
  function highlightText(text, query) {
    if (typeof text !== 'string' || typeof query !== 'string' || !query) return text || '';

    // Escape regex special chars in query
    var escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var regex = new RegExp('(' + escaped + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * Compute a simple Jaccard similarity coefficient between two text strings
   * based on word-level bigrams.  Returns a value between 0 (no overlap)
   * and 1 (identical bigram sets).
   *
   * @param {string} text1
   * @param {string} text2
   * @returns {number} Similarity score 0–1.
   */
  function calculateSimilarity(text1, text2) {
    if (typeof text1 !== 'string' || typeof text2 !== 'string') return 0;
    if (!text1 && !text2) return 1;
    if (!text1 || !text2) return 0;

    function toBigrams(str) {
      var words = str.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      var bigrams = {};
      for (var i = 0; i < words.length - 1; i++) {
        var bi = words[i] + ' ' + words[i + 1];
        bigrams[bi] = (bigrams[bi] || 0) + 1;
      }
      // Also include unigrams for short texts
      for (var j = 0; j < words.length; j++) {
        bigrams['_u_' + words[j]] = (bigrams['_u_' + words[j]] || 0) + 1;
      }
      return bigrams;
    }

    var a = toBigrams(text1);
    var b = toBigrams(text2);

    var aKeys = Object.keys(a);
    var bKeys = Object.keys(b);
    var union = {};

    var intersection = 0;
    var i;

    for (i = 0; i < aKeys.length; i++) union[aKeys[i]] = true;
    for (i = 0; i < bKeys.length; i++) union[bKeys[i]] = true;

    var unionSize = Object.keys(union).length;
    if (unionSize === 0) return 0;

    for (i = 0; i < aKeys.length; i++) {
      if (b[aKeys[i]]) intersection += 1;
    }

    return +(intersection / unionSize).toFixed(4);
  }

  /* ================================================================== */
  /*  Risk / Confidence helpers                                          */
  /* ================================================================== */

  /**
   * Return a CSS colour string based on a numeric risk score (0–100).
   *
   * @param {number} score - Risk score 0–100.
   * @returns {string} CSS colour value.
   */
  function getRiskColor(score) {
    if (typeof score !== 'number' || isNaN(score)) return '#6b7280'; // grey
    if (score >= 80) return '#dc2626'; // red — CRITICAL
    if (score >= 60) return '#ea580c'; // orange — HIGH
    if (score >= 30) return '#f59e0b'; // amber — MEDIUM
    return '#22c55e';                  // green — LOW
  }

  /**
   * Map a numeric risk score (0–100) to a categorical label.
   *
   * @param {number} score
   * @returns {'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'}
   */
  function getRiskLevel(score) {
    if (typeof score !== 'number' || isNaN(score)) return 'LOW';
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 30) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Map a confidence value (0–1) to a human-readable label.
   *
   * @param {number} score - Confidence 0–1.
   * @returns {string}
   */
  function getConfidenceLabel(score) {
    if (typeof score !== 'number' || isNaN(score)) return 'Unknown';
    if (score >= 0.95) return 'Very High';
    if (score >= 0.80) return 'High';
    if (score >= 0.60) return 'Moderate';
    if (score >= 0.40) return 'Low';
    return 'Very Low';
  }

  /**
   * Return a CSS class suffix for confidence levels (for badge styling).
   *
   * @param {number} score - Confidence 0–1.
   * @returns {string}
   */
  function getConfidenceClass(score) {
    if (typeof score !== 'number' || isNaN(score)) return 'unknown';
    if (score >= 0.80) return 'high';
    if (score >= 0.60) return 'moderate';
    if (score >= 0.40) return 'low';
    return 'very-low';
  }

  /* ================================================================== */
  /*  Number formatting                                                  */
  /* ================================================================== */

  /**
   * Format a number with thousands separators and optional decimal places.
   *
   * @param {number} num
   * @param {number} [decimals] - Number of decimal places. If omitted,
   *   integers show none and floats show up to 2.
   * @returns {string}
   */
  function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';

    var decimals = arguments.length > 1 ? arguments[1] : undefined;

    if (decimals === undefined) {
      decimals = Number.isInteger(num) ? 0 : 2;
    }

    var fixed = num.toFixed(decimals);
    var parts = fixed.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  /* ================================================================== */
  /*  Security / Sanitisation                                            */
  /* ================================================================== */

  /**
   * Basic HTML sanitisation — strips `<script>`, event-handler attributes,
   * and other dangerous patterns.  **Not** a full XSS sanitiser; use a
   * library (e.g. DOMPurify) for untrusted third-party content.
   *
   * @param {string} str
   * @returns {string} Sanitised string.
   */
  function sanitizeHTML(str) {
    if (typeof str !== 'string') return '';

    return str
      // Remove <script> blocks
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      // Remove javascript: URLs
      .replace(/javascript\s*:/gi, '')
      // Remove data: URIs in href/src (could contain scripts)
      .replace(/(href|src)\s*=\s*["']?\s*data\s*:/gi, '$1="')
      // Remove <iframe>, <object>, <embed>, <form>
      .replace(/<\s*\/?\s*(iframe|object|embed|form)\b[^>]*>/gi, '')
      // Remove style expressions (IE)
      .replace(/expression\s*\(/gi, '')
      // Remove VBScript
      .replace(/vbscript\s*:/gi, '');
  }

  /* ================================================================== */
  /*  File / Download                                                    */
  /* ================================================================== */

  /**
   * Trigger a JSON file download in the browser.
   *
   * @param {*} data - Data to serialise as JSON.
   * @param {string} [filename='export.json']
   */
  function downloadJSON(data, filename) {
    filename = filename || 'export.json';
    if (!filename.endsWith('.json')) filename += '.json';

    var json = JSON.stringify(data, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  /* ================================================================== */
  /*  DOM / Animation                                                    */
  /* ================================================================== */

  /**
   * Animate a numeric counter on a DOM element from `from` to `to` over
   * `duration` milliseconds using `requestAnimationFrame`.
   *
   * @param {HTMLElement} element - The element whose `textContent` will be updated.
   * @param {number} from - Start value.
   * @param {number} to - End value.
   * @param {number} [duration=1000] - Animation duration in ms.
   * @param {Function} [formatter] - Optional formatter applied to the value
   *   at each frame; defaults to `formatNumber`.
   */
  function animateCounter(element, from, to, duration, formatter) {
    if (!element) return;
    duration = typeof duration === 'number' ? duration : 1000;
    formatter = typeof formatter === 'function' ? formatter : formatNumber;

    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);

      // Ease-out quad
      var eased = 1 - (1 - progress) * (1 - progress);
      var current = from + (to - from) * eased;

      element.textContent = formatter(Math.round(current));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = formatter(to);
      }
    }

    requestAnimationFrame(step);
  }

  /**
   * Create an SVG element with the given tag name and attributes.
   *
   * @param {string} tag - SVG element tag (e.g. `'circle'`, `'rect'`, `'path'`).
   * @param {Object.<string, string|number>} [attrs] - Attribute key-value pairs.
   * @returns {SVGElement}
   */
  function createSVGElement(tag, attrs) {
    var ns = 'http://www.w3.org/2000/svg';
    var el = document.createElementNS(ns, tag);

    if (attrs && typeof attrs === 'object') {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        el.setAttribute(keys[i], attrs[keys[i]]);
      }
    }

    return el;
  }

  /**
   * Create a standard DOM element with optional attributes and children.
   *
   * @param {string} tag
   * @param {Object.<string, string>} [attrs]
   * @param {Array<HTMLElement|string>} [children]
   * @returns {HTMLElement}
   */
  function createElement(tag, attrs, children) {
    var el = document.createElement(tag);

    if (attrs && typeof attrs === 'object') {
      var keys = Object.keys(attrs);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key === 'className') {
          el.className = attrs[key];
        } else if (key === 'textContent') {
          el.textContent = attrs[key];
        } else if (key === 'innerHTML') {
          el.innerHTML = sanitizeHTML(attrs[key]);
        } else if (key.indexOf('data-') === 0) {
          el.setAttribute(key, attrs[key]);
        } else {
          el.setAttribute(key, attrs[key]);
        }
      }
    }

    if (Array.isArray(children)) {
      for (var j = 0; j < children.length; j++) {
        var child = children[j];
        if (typeof child === 'string') {
          el.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
          el.appendChild(child);
        }
      }
    }

    return el;
  }

  /**
   * Get a CSS custom property value from the document root.
   *
   * @param {string} name - Variable name including `--` prefix.
   * @returns {string} Trimmed value.
   */
  function getCSSVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /**
   * Copy text to the clipboard using the modern Clipboard API, with a
   * fallback to `document.execCommand('copy')`.
   *
   * @param {string} text
   * @returns {Promise<boolean>} Resolves to `true` on success.
   */
  function copyToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).then(function () {
        return true;
      }).catch(function () {
        return fallbackCopy(text);
      });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  /** @private */
  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    var success = false;
    try { success = document.execCommand('copy'); } catch (_e) { /* ignore */ }
    document.body.removeChild(textarea);
    return success;
  }

  /* ================================================================== */
  /*  Status / badge helpers                                             */
  /* ================================================================== */

  /**
   * Map a workflow / trace status to a CSS colour.
   *
   * @param {string} status
   * @returns {string} CSS colour.
   */
  function getStatusColor(status) {
    var map = {
      completed: '#22c55e',
      success: '#22c55e',
      in_progress: '#3b82f6',
      pending: '#f59e0b',
      warning: '#f59e0b',
      failed: '#dc2626',
      error: '#dc2626',
      escalated: '#a855f7',
      skipped: '#6b7280'
    };
    return map[String(status).toLowerCase()] || '#6b7280';
  }

  /**
   * Map a jurisdiction code to a friendly display label.
   *
   * @param {string} code - e.g. `'US'`, `'EU'`, `'UK'`, `'CH'`.
   * @returns {string}
   */
  function getJurisdictionLabel(code) {
    var map = {
      US: 'United States',
      EU: 'European Union',
      UK: 'United Kingdom',
      CH: 'Switzerland',
      SG: 'Singapore',
      HK: 'Hong Kong',
      JP: 'Japan',
      AU: 'Australia',
      GLOBAL: 'Global'
    };
    return map[String(code).toUpperCase()] || code;
  }

  /* ================================================================== */
  /*  Export to global namespace                                          */
  /* ================================================================== */

  window.AppCore = window.AppCore || {};

  window.AppCore.Helpers = {
    // Date / Time
    formatDate: formatDate,
    formatRelativeTime: formatRelativeTime,

    // ID generation
    generateId: generateId,

    // Function utilities
    debounce: debounce,
    throttle: throttle,

    // Data utilities
    deepClone: deepClone,
    sleep: sleep,

    // Text utilities
    truncateText: truncateText,
    highlightText: highlightText,
    calculateSimilarity: calculateSimilarity,

    // Risk / Confidence
    getRiskColor: getRiskColor,
    getRiskLevel: getRiskLevel,
    getConfidenceLabel: getConfidenceLabel,
    getConfidenceClass: getConfidenceClass,

    // Number formatting
    formatNumber: formatNumber,

    // Security
    sanitizeHTML: sanitizeHTML,

    // File / Download
    downloadJSON: downloadJSON,

    // DOM / Animation
    animateCounter: animateCounter,
    createSVGElement: createSVGElement,
    createElement: createElement,
    getCSSVar: getCSSVar,
    copyToClipboard: copyToClipboard,

    // Status helpers
    getStatusColor: getStatusColor,
    getJurisdictionLabel: getJurisdictionLabel
  };

})();
