/**
 * UBS — Router & App Controller (combined)
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  
  window.AppCore.config = {
    apiUrl: 'http://localhost:3000/api'
  };
  
  window.AppCore.State = {
    currentView: 'dashboard',
    policies: [],
    settings: { theme: 'dark' }
  };

  // Live Audit Stream Logger
  window.AppCore.log = function(msg, type) {
    if (window.AppCore.EventBus) {
      window.AppCore.EventBus.publish('system.log', { msg: msg, type: type || 'info' });
    }
  };

  var routes = {
    dashboard: { title: 'Compliance Dashboard', icon: '📊' },
    feed: { title: 'Regulatory Feed', icon: '📰' },
    policy: { title: 'Policy Repository', icon: '📁' },
    analyzer: { title: 'Lex AI Analyzer', icon: 'bot' },
    aiAnalyzer: { title: 'AI Gap Analyzer', icon: '🔍' },
    escalation: { title: 'Escalation Queue', icon: '🚨' },
    copilot: { title: 'Lex Copilot', icon: '🤖' },
    audit: { title: 'Audit Trail', icon: '📝' },
    profile: { title: 'User Profile', icon: '👤' },
    gap: { title: 'Gap Analysis', icon: '🔍' },
    sentinel: { title: 'Live Audit Stream', icon: 'terminal' },
    calendar: { title: 'Compliance Calendar', icon: '📅' },
    impactScanner: { title: 'Impact Scanner', icon: '🎯' },
    settings: { title: 'System Configuration', icon: '⚙️' }
  };

  function Router() {
    this.currentView = null;
    this._init();
  }

  Router.prototype._init = function () {
    var self = this;
    window.addEventListener('hashchange', function () { self._onHashChange(); });
    // Handle initial load
    this._onHashChange();
  };

  Router.prototype._onHashChange = function () {
    var hash = window.location.hash.replace('#', '') || 'dashboard';
    if (routes[hash]) {
      if (window.location.hash.replace('#', '') !== hash) {
        window.location.hash = hash;
      } else {
        this._render(hash);
      }
    }
  };

  Router.prototype.navigate = function (view) {
    if (!routes[view]) return;
    if (window.location.hash.replace('#', '') !== view) {
      window.location.hash = view;
    } else {
      this._render(view);
    }
  };

  Router.prototype._render = function (view) {
    var container = document.getElementById('view-container');
    if (!container) return;
    
    // Guard against rendering the same view if it's already active and populated
    if (this.currentView === view && container.innerHTML !== '') {
      return;
    }
    
    this.currentView = view;

    // Update sidebar active state
    document.querySelectorAll('.nav__item').forEach(function (item) {
      item.classList.toggle('active', item.dataset.view === view);
    });

    // Update topbar
    var topTitle = document.getElementById('topbar-title');
    var topView = document.getElementById('topbar-view');
    if (topTitle) topTitle.textContent = routes[view].title;
    if (topView) topView.textContent = routes[view].title;

    // Render view
    if (window.AppCore.Views && window.AppCore.Views[view]) {
      // Re-trigger animation
      container.classList.remove('view-enter');
      void container.offsetWidth; // Force reflow
      container.classList.add('view-enter');
      
      container.innerHTML = '';
      window.AppCore.Views[view].render(container);
      
      if (window.AppCore.log) {
        window.AppCore.log("[SYS_ROUTING] User navigated to " + routes[view].title, "system");
      }
    }

    // Update state
    if (window.AppCore.StateManager) {
      window.AppCore.StateManager.setState('currentView', view);
    }
  };

  window.AppCore.Router = new Router();

  /* ─── App Controller ────────────────────────────────────── */
  function App() {
    this._initialized = false;
  }

  App.prototype.init = function () {
    if (this._initialized) return;
    this._initialized = true;
    
    var self = this;
    var State = window.AppCore.StateManager;
    
    // Initialize Theme
    this.initTheme();

    // Initialization delegates to _continueInit
    self._continueInit(State);
  };

  App.prototype._continueInit = function (State) {

    // Load mock data into state, preferring localStorage if available
    var State = window.AppCore.StateManager;

    // Multi-tenant data segregation simulation
    try {
      var session = JSON.parse(localStorage.getItem('app_session'));
      if (session && session.sector && window.APP_DATA) {
        if (window.APP_DATA.policies) {
          window.APP_DATA.policies.forEach(function(p) {
            p.title = p.title.replace(/Firm|Global/gi, session.company);
          });
        }
        if (window.APP_DATA.regulatoryUpdates) {
          window.APP_DATA.regulatoryUpdates.forEach(function(u) {
            u.title = u.title.replace(/Financial|Banking/gi, session.sector);
            u.description = u.description.replace(/financial institutions/gi, session.sector.toLowerCase() + ' organizations');
            u.jurisdiction = session.sector + ' Authority';
          });
        }
      }
    } catch(e) {}
    // Fetch real-time data from backend APIs
    Promise.all([
      fetch('http://localhost:3000/api/policies').then(res => res.json()).catch(() => []),
      fetch('http://localhost:3000/api/gaps').then(res => res.json()).catch(() => []),
      fetch('http://localhost:3000/api/calendar').then(res => res.json()).catch(() => []),
      fetch('http://localhost:3000/api/live-feed').then(res => res.json()).catch(() => [])
    ]).then(function(results) {
      var policies = results[0];
      var gaps = results[1];
      var calendar = results[2];
      var updates = results[3] || [];

      window.APP_DATA = window.APP_DATA || {};
      window.APP_DATA.policies = policies;
      window.APP_DATA.gaps = gaps;
      window.APP_DATA.calendar_events = calendar;

      var savedProcessed = JSON.parse(localStorage.getItem('ubs_processed_updates')) || [];
      var savedUpdates = JSON.parse(localStorage.getItem('ubs_regulatory_updates')) || [];
      
      updates.forEach(function(u) {
         u.id = u.id || u.update_id || ('update-' + Math.random());
         if (savedProcessed.find(function(p) { return p.update_id === u.id; })) {
             u.status = 'completed';
         } else if (savedUpdates.find(function(s) { return s.update_id === u.id && s.status !== 'pending'; })) {
             var existing = savedUpdates.find(function(s) { return s.update_id === u.id; });
             u.status = existing.status;
         } else {
             u.status = 'pending';
             u.update_id = u.id; // align ids
         }
      });

      State.setState('policies', policies);
      State.setState('gaps', gaps);
      State.setState('calendar_events', calendar);
      State.setState('regulatoryUpdates', updates);
      State.setState('stats.totalPending', updates.filter(function (u) { return u.status === 'pending'; }).length);
      
      self.updateFeedBadge();
      self.updateNotifBadge();
      
      // Re-render UI now that data is loaded
      if (document.querySelector('.dashboard')) Bus.publish('nav:dashboard');
      else if (document.querySelector('.policy-repository')) Bus.publish('nav:policy_repository');
      else if (document.querySelector('.feed-view')) Bus.publish('nav:regulatory_feed');
    });

    var savedProcessed = localStorage.getItem('ubs_processed_updates');
    var savedEscalations = localStorage.getItem('ubs_escalation_queue');
    var savedAuditLog = localStorage.getItem('ubs_audit_log');

    if (savedProcessed) {
      State.setState('processedUpdates', JSON.parse(savedProcessed));
    }
    if (savedEscalations) {
      State.setState('escalationQueue', JSON.parse(savedEscalations));
    }
    if (savedAuditLog) {
      State.setState('auditLog', JSON.parse(savedAuditLog));
    }

    this.updateFeedBadge();
    this.updateNotifBadge();

    // Persist key state paths to localStorage on change
    State.subscribe('regulatoryUpdates', function (data) {
      localStorage.setItem('ubs_regulatory_updates', JSON.stringify(data.newValue));
    });
    State.subscribe('processedUpdates', function (data) {
      localStorage.setItem('ubs_processed_updates', JSON.stringify(data.newValue));
    });
    State.subscribe('escalationQueue', function (data) {
      localStorage.setItem('ubs_escalation_queue', JSON.stringify(data.newValue));
    });
    State.subscribe('auditLog', function (data) {
      localStorage.setItem('ubs_audit_log', JSON.stringify(data.newValue));
    });

    // Initialize agent statuses from definitions
    if (window.APP_DATA && window.APP_DATA.agentDefinitions) {
      var statuses = {};
      window.APP_DATA.agentDefinitions.forEach(function (a) {
        statuses[a.id] = { status: a.status, metrics: a.metrics };
      });
      State.setState('agentStatuses', statuses);
    }

    // Set up sidebar toggle
    var toggle = document.getElementById('sidebar-toggle');
    var sidebar = document.getElementById('sidebar');
    if (toggle && sidebar) {
      toggle.addEventListener('click', function () {
        sidebar.classList.toggle('collapsed');
        State.setState('ui.sidebarCollapsed', sidebar.classList.contains('collapsed'));
      });
    }

    document.addEventListener('click', function(e) {
      var bellWrapper = document.getElementById('notif-bell-wrapper');
      var dropdown = document.getElementById('notif-dropdown');
      if (dropdown && bellWrapper && !bellWrapper.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    // Set up nav clicks
    document.querySelectorAll('.nav__item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var view = item.dataset.view;
        if (view) window.AppCore.Router.navigate(view);
      });
    });

    // Subscribe to workflow events for toast notifications
    var Bus = window.AppCore.EventBus;
    Bus.subscribe('workflow.completed', function (data) {
      window.AppCore.App.showToast('success', 'Workflow Complete', 'Processed: ' + data.update_id + ' — ' + data.decision.action);
      window.AppCore.App.updateFeedBadge();
      
      // Auto-refresh the current view if we're on a relevant page to show synced statuses
      var currentView = window.AppCore.Router.currentView;
      var container = document.getElementById('view-container');
      if (container && (currentView === 'feed' || currentView === 'policy')) {
        window.AppCore.Views[currentView].render(container);
      }
    });
    Bus.subscribe('workflow.failed', function (data) {
      window.AppCore.App.showToast('error', 'Workflow Failed', data.message || 'Update: ' + data.update_id);
      window.AppCore.App.updateFeedBadge();
    });
    Bus.subscribe('escalation.created', function (data) {
      window.AppCore.App.showToast('warning', 'Escalation Created', 'Update ' + data.update_id + ' requires human review');
      window.AppCore.App.updateFeedBadge();
    });

    var dashRenderTimer;
    function debounceDashboardRender() {
      if (window.AppCore.Router.currentView === 'dashboard') {
        clearTimeout(dashRenderTimer);
        dashRenderTimer = setTimeout(function() {
          var container = document.getElementById('view-container');
          if (container && window.AppCore.Router.currentView === 'dashboard') {
            window.AppCore.Views.dashboard.render(container);
            if (window.lucide) window.lucide.createIcons();
          }
        }, 50);
      }
    }

    Bus.subscribe('audit.logged', function () {
      debounceDashboardRender();
    });

    // Auto-refresh feed view and badge when updates change status
    var feedRenderTimer;
    State.subscribe('regulatoryUpdates', function () {
      // Update nav badge
      window.AppCore.App.updateFeedBadge();

      // Re-render view if active
      if (window.AppCore.Router.currentView === 'feed') {
        clearTimeout(feedRenderTimer);
        feedRenderTimer = setTimeout(function() {
          var container = document.getElementById('view-container');
          if (container && window.AppCore.Router.currentView === 'feed') {
            window.AppCore.Views.feed.render(container);
            var feedEl = container.querySelector('.feed');
            if (feedEl) feedEl.style.animation = 'none';
            if (window.lucide) window.lucide.createIcons();
          }
        }, 50);
      } else {
        debounceDashboardRender();
      }
    });

    var policyRenderTimer;
    State.subscribe('policies', function () {
      if (window.AppCore.Router.currentView === 'policy') {
        clearTimeout(policyRenderTimer);
        policyRenderTimer = setTimeout(function() {
          var container = document.getElementById('view-container');
          if (container && window.AppCore.Router.currentView === 'policy') {
            window.AppCore.Views.policy.render(container);
            if (window.lucide) window.lucide.createIcons();
          }
        }, 50);
      }
    });

    // Auto-refresh escalation view and badge when queue changes
    var escRenderTimer;
    State.subscribe('escalationQueue', function () {
      // Update nav badge
      var badge = document.querySelector('.nav__item[data-view="escalation"] .nav__badge');
      if (badge) {
        var count = (State.getByPath('escalationQueue') || []).filter(function (e) { return e.status === 'pending'; }).length;
        badge.textContent = count;
        badge.style.display = count > 0 ? '' : 'none';
      }

      // Re-render view if active
      if (window.AppCore.Router.currentView === 'escalation') {
        clearTimeout(escRenderTimer);
        escRenderTimer = setTimeout(function() {
          var container = document.getElementById('view-container');
          if (container && window.AppCore.Router.currentView === 'escalation') {
            window.AppCore.Views.escalation.render(container);
            var escEl = container.querySelector('.escalation');
            if (escEl) escEl.style.animation = 'none';
            if (window.lucide) window.lucide.createIcons();
          }
        }, 50);
      } else {
        debounceDashboardRender();
      }
    });

    // Start background polling for new regulations
    this.startPolling();

    // Navigate to initial view
    var hash = window.location.hash.replace('#', '') || 'policy';
    window.AppCore.Router.navigate(hash);
  };

  /** Theme Switching Logic */
  App.prototype.initTheme = function() {
    // Theme locked to dark mode. Removed theme switching logic.
  };

  App.prototype.toggleTheme = function() {
    // Disabled
  };

  App.prototype.updateThemeIcon = function(theme) {
    // Disabled
  };

App.prototype.toggleNotifications = function() {
  var dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;
  var isOpen = dropdown.style.display !== 'none';
  dropdown.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) this.renderNotifications();
};

App.prototype.renderNotifications = function() {
  var dropdown = document.getElementById('notif-dropdown');
  if (!dropdown) return;
  var State = window.AppCore.StateManager;
  var updates = State.getByPath('regulatoryUpdates') || [];
  var escalations = State.getByPath('escalationQueue') || [];
  var gaps = (window.APP_DATA && window.APP_DATA.gaps) || [];
  
  var items = [];
  // Pending regulations
  updates.filter(function(u) { return u.status === 'pending'; }).slice(0, 5).forEach(function(u) {
    items.push({ icon: '📋', bg: 'rgba(234,179,8,0.15)', title: 'New regulation: ' + (u.document_title || u.update_id).substring(0, 60), time: u.date || 'Recent', view: 'feed' });
  });
  // Pending escalations
  escalations.filter(function(e) { return e.status === 'pending'; }).slice(0, 3).forEach(function(e) {
    items.push({ icon: '⚠️', bg: 'rgba(239,68,68,0.15)', title: 'Escalation: ' + (e.title || e.update_id || 'Pending review'), time: 'Requires attention', view: 'escalation' });
  });
  // Open gaps
  gaps.filter(function(g) { return g.status !== 'resolved'; }).slice(0, 3).forEach(function(g) {
    items.push({ icon: '🔍', bg: 'rgba(59,130,246,0.15)', title: 'Gap: ' + (g.title || g.id), time: g.severity + ' severity', view: 'gaps' });
  });
  
  var html = '<div class="notif-dropdown__header"><span>Compliance Alerts (' + items.length + ')</span>';
  if (items.length > 0) html += '<button class="btn btn--ghost btn--sm" style="font-size:11px; padding: 4px 8px; height: 26px;" onclick="window.AppCore.App.dismissNotifications()">Mark all read</button>';
  html += '</div>';
  
  if (items.length === 0) {
    html += '<div class="notif-empty"><div style="font-size:24px;margin-bottom:8px;">🎉</div>All caught up! No pending alerts.</div>';
  } else {
    items.forEach(function(item) {
      html += '<div class="notif-item" onclick="document.getElementById(\'notif-dropdown\').style.display=\'none\'; window.AppCore.Router.navigate(\'' + item.view + '\');">';
      html += '<div class="notif-item__icon" style="background:' + item.bg + '">' + item.icon + '</div>';
      html += '<div class="notif-item__content"><div class="notif-item__title">' + item.title + '</div><div class="notif-item__time">' + item.time + '</div></div>';
      html += '</div>';
    });
  }
  
  dropdown.innerHTML = html;
};

App.prototype.dismissNotifications = function() {
  localStorage.setItem('ubs_notifs_dismissed_total', localStorage.getItem('ubs_notifs_last_total') || '0');
  var badge = document.getElementById('notif-badge');
  if (badge) badge.style.display = 'none';
  var dropdown = document.getElementById('notif-dropdown');
  if (dropdown) dropdown.style.display = 'none';
};

App.prototype.updateNotifBadge = function() {
  var badge = document.getElementById('notif-badge');
  if (!badge) return;
  var State = window.AppCore.StateManager;
  var pending = (State.getByPath('regulatoryUpdates') || []).filter(function(u) { return u.status === 'pending'; }).length;
  var escalations = (State.getByPath('escalationQueue') || []).filter(function(e) { return e.status === 'pending'; }).length;
  var gaps = ((window.APP_DATA && window.APP_DATA.gaps) || []).filter(function(g) { return g.status !== 'resolved'; }).length;
  var total = pending + escalations + gaps;
  
  localStorage.setItem('ubs_notifs_last_total', String(total));
  var dismissedTotal = localStorage.getItem('ubs_notifs_dismissed_total');
  
  if (dismissedTotal && dismissedTotal === String(total)) {
    badge.style.display = 'none';
    return;
  }
  
  if (total > 0) {
    badge.textContent = total > 99 ? '99+' : total;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
};

  /** Start automated polling of regulatory feeds */
  App.prototype.startPolling = function () {
    var self = this;
    // Check every 30 seconds
    setInterval(function () {
      fetch('http://localhost:3000/api/live-feed')
        .then(function(res) { return res.json(); })
        .then(function(updates) {
           var savedProcessed = JSON.parse(localStorage.getItem('ubs_processed_updates')) || [];
           var savedUpdates = JSON.parse(localStorage.getItem('ubs_regulatory_updates')) || [];
           var State = window.AppCore.StateManager;
           
           var hasNew = false;

           updates.forEach(function(u) {
              if (savedProcessed.find(function(p) { return p.update_id === u.update_id; })) {
                  u.status = 'completed';
              } else if (savedUpdates.find(function(s) { return s.update_id === u.update_id && s.status !== 'pending'; })) {
                  var existing = savedUpdates.find(function(s) { return s.update_id === u.update_id; });
                  u.status = existing.status;
              } else {
                  // It's genuinely new!
                  if (!savedUpdates.find(function(s) { return s.update_id === u.update_id; })) {
                      hasNew = true;
                  }
              }
           });

           // Always update state to overwrite any corrupted/polluted cached text
           State.setState('regulatoryUpdates', updates);
           State.setState('stats.totalPending', updates.filter(function (u) { return u.status === 'pending'; }).length);
           self.updateFeedBadge();
         self.updateNotifBadge();
           
           if (hasNew) {
               // Auto-process the new pending ones
               var pending = updates.filter(function (u) { return u.status === 'pending'; });
               pending.forEach(function(p) {
                   self.processUpdate(p.update_id);
               });
           }
        })
        .catch(function(err) {
            console.error("Polling error:", err);
        });
    }, 30000);
  };

  App.prototype.showToast = function (type, title, message) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var icons = { success: '<i data-lucide="check-circle" style="color:#10b981"></i>', error: '<i data-lucide="x-circle" style="color:#ef4444"></i>', warning: '<i data-lucide="alert-triangle" style="color:#f59e0b"></i>', info: '<i data-lucide="info" style="color:#3b82f6"></i>' };
    var toast = document.createElement('div');
    toast.className = 'toast toast--' + type;
    toast.innerHTML =
      '<span class="toast__icon">' + (icons[type] || '<i data-lucide="info"></i>') + '</span>' +
      '<div class="toast__content">' +
        '<div class="toast__title">' + title + '</div>' +
        '<div class="toast__message">' + message + '</div>' +
      '</div>' +
      '<span class="toast__close" onclick="this.parentElement.classList.add(\'removing\'); setTimeout(function(){this.parentElement.remove()}.bind(this),300)">✕</span>';

    container.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('removing');
      setTimeout(function () { toast.remove(); }, 300);
    }, 5000);
    
    if (window.lucide) window.lucide.createIcons();
  };

  /** Process a single regulatory update through the pipeline */
  App.prototype.processUpdate = function (updateId) {
    var updates = window.AppCore.StateManager.getByPath('regulatoryUpdates') || [];
    var update = updates.find(function (u) { return u.update_id === updateId; });
    if (!update) return;

    update.status = 'processing';
    window.AppCore.StateManager.setState('regulatoryUpdates', updates);
    this.updateFeedBadge();
    this.updateNotifBadge();
    window.AppCore.EventBus.publish('regulatory.update.received', update);
    this.showToast('info', 'Processing Started', 'Analyzing: ' + (update.document_title || updateId));
  };

  /** Process all pending updates */
  App.prototype.processAllUpdates = function () {
    var self = this;
    var updates = window.AppCore.StateManager.getByPath('regulatoryUpdates') || [];
    var pending = updates.filter(function (u) { return u.status === 'pending'; });
    var delay = 0;
    pending.forEach(function (u) {
      setTimeout(function () { self.processUpdate(u.update_id); }, delay);
      delay += 2000; // Stagger processing
    });
  };

  /** Resolve an escalation */
  App.prototype.resolveEscalation = function (escalationId, action, comment) {
    var queue = window.AppCore.StateManager.getByPath('escalationQueue') || [];
    var esc = queue.find(function (e) { return e.escalation_id === escalationId; });
    if (!esc) return;

    esc.status = 'resolved';
    esc.resolved_at = new Date().toISOString();
    esc.resolution = { action: action, comment: comment, reviewer: esc.assigned_reviewer };
    window.AppCore.StateManager.setState('escalationQueue', queue);

    window.AppCore.EventBus.publish('escalation.resolved', {
      escalationId: escalationId,
      workflowId: esc.workflow_id,
      feedback: {
        action: action, comment: comment, reviewer: esc.assigned_reviewer,
        resolved_at: esc.resolved_at
      }
    });

    this.showToast('success', 'Escalation Resolved', action + ': ' + esc.title);
  };

  /** Simulate a Live Incoming Regulatory Update */
  App.prototype.simulateUpdate = function () {
    var State = window.AppCore.StateManager;
    var updates = State.getByPath('regulatoryUpdates') || [];
    
    var newId = 'RU-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    var regions = ['APAC', 'EU', 'North America'];
    var randomRegion = regions[Math.floor(Math.random() * regions.length)];
    var mockUpdate = {
      update_id: newId,
      source: ' automated_poll ',
      publication_date: new Date().toISOString().split('T')[0],
      jurisdiction: randomRegion,
      document_title: 'Live Injection: Cybersecurity Incident Reporting Framework (' + randomRegion + ')',
      summary: 'Immediate mandatory 6-hour reporting window for critical infrastructure cyber incidents affecting financial data systems in ' + randomRegion + '.',
      status: 'pending',
      tags: ['Cybersecurity', 'Reporting', 'Mandatory']
    };
    
    updates.unshift(mockUpdate);
    State.setState('regulatoryUpdates', updates);
    
    // Update badge immediately
    var badge = document.getElementById('feed-badge');
    if (badge) {
      badge.textContent = updates.filter(function(u){ return u.status === 'pending'; }).length;
    }
    
    // Refresh current view if it is feed
    if (window.AppCore.Router.currentView === 'feed') {
      window.AppCore.Router.navigate('feed');
    }
    
    this.showToast('info', 'Webhook Triggered', 'New regulatory data received via simulated API stream.');
    
    // Auto-process it after 2 seconds
    var self = this;
    setTimeout(function() {
      self.processUpdate(newId);
      self.updateFeedBadge();
    }, 2000);
  };

  /** Generate Executive Compliance Report (PDF format via html2pdf) */
  App.prototype.generateReport = function () {
    var dashboardElement = document.querySelector('.dashboard__main-grid');
    if (!dashboardElement) {
      this.showToast('error', 'Report Error', 'Please navigate to the dashboard to generate a report.');
      return;
    }
    
    if (typeof html2pdf === 'undefined') {
      this.showToast('error', 'Report Error', 'html2pdf library is not loaded.');
      return;
    }

    this.showToast('info', 'Generating Report', 'Creating a PDF snapshot of your dashboard...');

    var opt = {
      margin:       10,
      filename:     'Compliance-Dashboard-Report.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(dashboardElement).save().then(() => {
      this.showToast('success', 'Report Generated', 'PDF has been downloaded.');
    }).catch(err => {
      console.error("PDF generation error:", err);
      this.showToast('error', 'Report Error', 'Failed to generate PDF.');
    });
  };

  App.prototype.handleGlobalSearch = function (query) {
    var resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;
    
    query = (query || '').trim().toLowerCase();
    if (!query) {
      resultsContainer.style.display = 'none';
      return;
    }

    var policies = (window.APP_DATA && window.APP_DATA.policies) || [];
    var State = window.AppCore.StateManager;
    var updates = State.getByPath('regulatoryUpdates') || [];
    
    var matchingPolicies = policies.filter(function(p) {
      return (p.title || '').toLowerCase().indexOf(query) !== -1 || (p.policy_id || '').toLowerCase().indexOf(query) !== -1;
    }).slice(0, 5);

    var matchingUpdates = updates.filter(function(u) {
      return (u.document_title || u.update_id || '').toLowerCase().indexOf(query) !== -1 || (u.summary || '').toLowerCase().indexOf(query) !== -1;
    }).slice(0, 5);

    if (matchingPolicies.length === 0 && matchingUpdates.length === 0) {
      resultsContainer.innerHTML = '<div style="padding:8px;font-size:13px;color:var(--text-muted);text-align:center;">No exact matches</div>';
    } else {
      var html = '';
      if (matchingPolicies.length > 0) {
        html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);padding:4px 8px;margin-top:4px;">Policies</div>';
        matchingPolicies.forEach(function(p) {
          html += '<div onclick="window.AppCore.Router.navigate(\'policy\'); setTimeout(()=> { var si = document.querySelector(\'#view-container .search-bar__input\'); if(si) { si.value = \'' + p.policy_id + '\'; si.dispatchEvent(new Event(\'input\')); } }, 100);" style="padding:8px; border-radius:6px; cursor:pointer; font-size:13px; color:var(--text-primary); transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="shield" style="width:14px;height:14px;vertical-align:middle;margin-right:8px;color:var(--accent);"></i>' + p.title + ' <span style="color:var(--text-muted);font-size:11px;">(' + p.policy_id + ')</span></div>';
        });
      }
      if (matchingUpdates.length > 0) {
        html += '<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--text-muted);padding:4px 8px;margin-top:8px;">Regulatory Updates</div>';
        matchingUpdates.forEach(function(u) {
          html += '<div onclick="window.AppCore.Router.navigate(\'feed\');" style="padding:8px; border-radius:6px; cursor:pointer; font-size:13px; color:var(--text-primary); transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="file-text" style="width:14px;height:14px;vertical-align:middle;margin-right:8px;color:var(--warning);"></i>' + (u.document_title || u.update_id) + '</div>';
        });
      }
      resultsContainer.innerHTML = html;
    }

    // Append Semantic Search Button
    var H = window.AppCore.Helpers;
    var sanitizedQuery = H ? H.sanitizeHTML(query) : query;
    resultsContainer.innerHTML += '<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.1);padding-top:8px;"><button onclick="window.AppCore.App.handleSemanticSearch(event, \''+sanitizedQuery.replace(/'/g, "\\'")+'\')" class="btn btn--ghost" style="width:100%;justify-content:center;font-size:12px;color:var(--accent);"><i data-lucide="sparkles" style="width:14px;height:14px;margin-right:6px;"></i>Ask AI (Semantic Search)</button></div>';
    
    resultsContainer.style.display = 'flex';
    if (window.lucide) window.lucide.createIcons();
  };

  App.prototype.handleSemanticSearch = function (event, query) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    var resultsContainer = document.getElementById('global-search-results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '<div style="padding:16px;text-align:center;color:var(--accent);"><div class="loading-spinner" style="margin:0 auto 12px;width:24px;height:24px;border-color:var(--accent);border-right-color:transparent;"></div><div style="font-size:13px;font-weight:500;">AI scanning knowledge base for semantic matches...</div></div>';
    
    // We only send a limited set of policies to avoid huge payloads
    var policies = ((window.APP_DATA && window.APP_DATA.policies) || []).map(function(p) {
      return { id: p.policy_id, title: p.title, summary: p.summary };
    });

    fetch('/api/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query, policies: policies })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.error) throw new Error(data.error);
      if (!data.results || data.results.length === 0) {
        resultsContainer.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No semantic matches found.</div>';
        return;
      }
      
      var html = '<div style="font-size:10px;font-weight:700;text-transform:uppercase;color:var(--accent);padding:4px 8px;margin-bottom:4px;">✨ AI Semantic Results</div>';
      data.results.forEach(function(res) {
        html += '<div onclick="window.AppCore.Router.navigate(\'policy\'); setTimeout(()=> { var si = document.querySelector(\'#view-container .search-bar__input\'); if(si) { si.value = \'' + res.id + '\'; si.dispatchEvent(new Event(\'input\')); } }, 100);" style="padding:8px; border-radius:6px; cursor:pointer; font-size:13px; color:var(--text-primary); transition:background 0.2s; margin-bottom:4px;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<div style="font-weight:600;margin-bottom:2px;">' + H.sanitizeHTML(res.title) + '</div>';
        html += '<div style="font-size:11px;color:var(--text-secondary);">' + H.sanitizeHTML(res.reason) + '</div>';
        html += '</div>';
      });
      
      resultsContainer.innerHTML = html;
    })
    .catch(function(err) {
      resultsContainer.innerHTML = '<div style="padding:16px;color:var(--danger);font-size:13px;text-align:center;">AI Search Failed: ' + H.sanitizeHTML(err.message) + '</div>';
    });
  };

  /** Failsafe sidebar feed badge updater */
  App.prototype.updateFeedBadge = function () {
    var badge = document.getElementById('feed-badge');
    if (badge) {
      var State = window.AppCore.StateManager;
      var count = (State.getByPath('regulatoryUpdates') || []).filter(function (u) { return u.status === 'pending'; }).length;
      badge.textContent = count;
      badge.style.display = count > 0 ? '' : 'none';
    }
  };

  window.AppCore.App = new App();
  window.AppCore.App.updateFeedBadge = App.prototype.updateFeedBadge;
  
  // Global Keyboard Shortcuts
  document.addEventListener('keydown', function(e) {
    // Cmd+K or Ctrl+K for Global Search -> Lex AI
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      var searchInput = document.getElementById('global-search-input');
      if (searchInput) {
        searchInput.focus();
      }
    }
  });
})();
