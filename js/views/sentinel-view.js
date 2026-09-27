/* ═══════════════════════════════════════════════════════════
   THE SENTINEL - LIVE AUDIT STREAM
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.sentinel = {
  isStreaming: false,

  render: function(container) {
    var html = '<div class="sentinel-view animate-slide-up">';
    
    // Header
    html += '<div class="sentinel-header">';
    html += '<div class="sentinel-title"><i data-lucide="terminal" style="width:20px;height:20px;color:var(--accent)"></i> Sentinel Audit Stream</div>';
    html += '<div class="sentinel-status"><div class="status-dot"></div> Live Monitoring</div>';
    html += '</div>';

    // Terminal Output Area
    html += '<div class="sentinel-terminal" id="sentinel-terminal"></div>';
    
    html += '</div>';
    container.innerHTML = html;
    
    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.startStream();
  },

  appendLog: function(msg, type) {
    var term = document.getElementById('sentinel-terminal');
    if (!term) return;

    var timestamp = new Date().toISOString().split('T')[1].replace('Z', '');
    
    var el = document.createElement('div');
    el.className = 'log-entry';
    
    var timeSpan = '<span class="log-meta">[' + timestamp + ']</span>';
    var textSpan = '<span class="log-content ' + type + '">' + msg + '</span>';
    
    el.innerHTML = timeSpan + textSpan;
    term.appendChild(el);
    
    // Auto scroll to bottom
    term.scrollTop = term.scrollHeight;
  },

  startStream: function() {
    var self = this;
    if (this.isStreaming) {
        // If re-rendering, just print a resume message
        self.appendLog("SENTINEL NODE RESUMED. LISTENING FOR EVENTS...", "system");
        return;
    }
    this.isStreaming = true;

    // Initial system boot logs
    var bootLogs = [
      "INITIALIZING SENTINEL NODE...",
      "HOOKING INTO GLOBAL EVENT BUS...",
      "SYSTEM ONLINE. AWAITING LIVE EVENTS..."
    ];

    var delay = 0;
    bootLogs.forEach(function(msg, i) {
      setTimeout(function() {
        self.appendLog(msg, 'system');
      }, delay);
      delay += 800;
    });

    // Subscribe to EventBus for real-time logs
    if (window.AppCore.EventBus) {
      window.AppCore.EventBus.subscribe('system.log', function(data) {
          self.appendLog(data.msg, data.type || 'info');
      });
    } else {
        setTimeout(function() {
            self.appendLog("ERROR: EVENT BUS NOT FOUND.", "critical");
        }, delay + 1000);
    }
  }
};
