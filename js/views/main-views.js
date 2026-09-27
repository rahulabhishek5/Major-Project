/**
 * UBS — Dashboard View + Feed View + Topology View
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Views = window.AppCore.Views || {};
  var H = window.AppCore.Helpers, State = window.AppCore.StateManager, Bus = window.AppCore.EventBus;

  /* ═══════════════════════════════════════════════════════════
     DASHBOARD VIEW — Compliance Command Center
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.dashboard = {
    render: function (container) {
      var isRefresh = container.querySelector('.dashboard') !== null;
      var stats = State.getByPath('stats') || {};
      var updates = State.getByPath('regulatoryUpdates') || [];
      var policies = (window.APP_DATA && window.APP_DATA.policies) || [];
      var processedLog = State.getByPath('processedUpdates') || [];
      var escalationQueue = State.getByPath('escalationQueue') || [];
      var pending = updates.filter(function (u) { return u.status === 'pending'; }).length;
      var processed = updates.filter(function (u) { return u.status === 'processed' || u.status === 'completed' || u.status === 'escalated'; }).length;
      var activeEsc = escalationQueue.filter(function (e) { return e.status === 'pending'; }).length;
      var activePolicies = policies.filter(function(p) { return p.status === 'active'; }).length;

      var gaps = (window.APP_DATA && window.APP_DATA.gaps) || [];
      var openGaps = gaps.filter(function(g) { return g.status !== 'resolved'; }).length;
      var resolvedGaps = gaps.length - openGaps;
      
      var totalPolicies = policies.length || 1;
      var totalUpdates = updates.length || 1;
      
      var policyScore = (activePolicies / totalPolicies) * 100;
      var gapScore = gaps.length > 0 ? (resolvedGaps / gaps.length) * 100 : 100;
      var updateScore = (processed / totalUpdates) * 100;
      
      var overallScore = Math.round((policyScore + gapScore + updateScore) / 3) || 0;
      var scoreColor = overallScore >= 90 ? 'var(--success)' : overallScore >= 75 ? 'var(--warning)' : 'var(--danger)';

      var html = '<div class="dashboard">';

      // ──── Welcome Banner ────
      var bannerAnim = isRefresh ? '' : ' view-enter stagger-1';
      html += '<div class="dash-welcome' + bannerAnim + '">';
      
      // Top section: title + actions
      html += '<div class="dash-welcome__inner" style="align-items:flex-start;">';
      html += '<div class="dash-welcome__content">';
      html += '<div class="dash-welcome__greeting"><span class="dash-welcome__greeting-dot"></span> Compliance Command Center</div>';
      html += '<h2 class="dash-welcome__title">Regulatory Intelligence Dashboard</h2>';
      html += '<p class="dash-welcome__sub">Real-time monitoring across <strong>APAC</strong>, <strong>EU</strong>, and <strong>North America</strong>. Background monitoring is <span class="dash-welcome__live-dot"></span> <strong>Active</strong>.</p>';
      html += '</div>';
      
      html += '</div>';

      // Bottom stats bar
      html += '<div class="dash-welcome__stats-bar">';
      html += '<div class="dash-welcome__stat" onclick="window.AppCore.Views.feed.filters.status=\'processed\'; window.AppCore.Router.navigate(\'feed\')" style="cursor:pointer"><div class="dash-welcome__stat-value">' + processed + '</div><div class="dash-welcome__stat-label">Processed</div></div>';
      html += '<div class="dash-welcome__stat" onclick="window.AppCore.Views.feed.filters.status=\'pending\'; window.AppCore.Router.navigate(\'feed\')" style="cursor:pointer"><div class="dash-welcome__stat-value">' + pending + '</div><div class="dash-welcome__stat-label">Pending</div></div>';
      html += '<div class="dash-welcome__stat" onclick="window.AppCore.Router.navigate(\'escalation\')" style="cursor:pointer"><div class="dash-welcome__stat-value">' + activeEsc + '</div><div class="dash-welcome__stat-label">Escalations</div></div>';
      html += '<div class="dash-welcome__stat" onclick="window.AppCore.Router.navigate(\'policy\')" style="cursor:pointer"><div class="dash-welcome__stat-value">' + activePolicies + '/' + policies.length + '</div><div class="dash-welcome__stat-label">Active Policies</div></div>';
      html += '</div>';
      html += '</div>';

      // ──── KPI Row ────
      html += '<div class="dashboard__kpi-grid">';
      html += this._kpiCard('inbox', 'accent', processed, 'Regulations Processed', processed > 0 ? '+' + processed + ' total' : 'Awaiting data', 'up', 'view-enter stagger-1', 'feed:processed');
      html += this._kpiCard('hourglass', 'warning', pending, 'Pending Ingestion', pending > 0 ? pending + ' awaiting review' : 'All clear', pending > 3 ? 'down' : 'up', 'view-enter stagger-2', 'feed:pending');
      html += this._kpiCard('alert-triangle', 'info', activeEsc, 'Active Escalations', activeEsc > 0 ? 'Requires attention' : 'No open items', activeEsc > 0 ? 'down' : 'up', 'view-enter stagger-3', 'escalation');
      html += this._kpiCard('book-open', 'success', activePolicies + '/' + policies.length, 'Active Policies', activePolicies + ' of ' + policies.length + ' active', 'up', 'view-enter stagger-4', 'policy');
      html += '</div>';

      // ──── Main Grid (12 columns) ────
      html += '<div class="dashboard__main-grid">';

      // Row 1: AI Compliance Trend (span 8) + Compliance Score Widget (span 4)
      html += '<div class="card view-enter stagger-3 glass-panel" style="grid-column: span 8; margin-bottom: 0;">';
      html += '<div class="card__header"><span class="card__title"><i data-lucide="activity" style="width:16px;height:16px"></i> AI Compliance Trend</span></div>';
      html += '<div style="flex: 1; min-height: 250px; padding: 12px; position:relative; display:flex; align-items:center; justify-content:center;">';
      html += '<div style="width:100%; height:100%;"><canvas id="dash-trend-chart"></canvas></div>';
      html += '</div></div>';

      // Compliance Score Widget (span 4) — Premium Card
      var strokeDasharray = (overallScore * 2.827) + ', 282.7'; // 2 * PI * 45 = 282.7
      var scoreGradient = overallScore >= 90 ? '#10b981, #34d399' : overallScore >= 75 ? '#f59e0b, #fbbf24' : '#ef4444, #f87171';
      html += '<div class="card view-enter stagger-5 glass-panel" style="grid-column: span 4; padding:0; margin-bottom: 0; overflow:hidden;">';
      // Score header with gradient accent
      html += '  <div style="padding:20px 22px 16px; border-bottom:1px solid rgba(255,255,255,0.06); background:linear-gradient(135deg, rgba(' + (overallScore >= 90 ? '16,185,129' : overallScore >= 75 ? '245,158,11' : '239,68,68') + ',0.08), transparent);">';
      html += '    <div style="display:flex; align-items:center; gap:16px;">';
      html += '      <div style="position:relative; width:72px; height:72px; flex-shrink:0;">';
      html += '        <svg width="72" height="72" viewBox="0 0 100 100" style="transform:rotate(-90deg);">';
      html += '          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="7"></circle>';
      html += '          <circle cx="50" cy="50" r="42" fill="none" stroke="url(#scoreGrad)" stroke-width="7" stroke-dasharray="' + (overallScore * 2.639) + ', 263.9" stroke-linecap="round" style="transition: stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1); filter: drop-shadow(0 0 6px rgba(' + (overallScore >= 90 ? '16,185,129' : overallScore >= 75 ? '245,158,11' : '239,68,68') + ',0.4));"></circle>';
      html += '          <defs><linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="' + scoreGradient.split(',')[0].trim() + '"/><stop offset="100%" stop-color="' + scoreGradient.split(',')[1].trim() + '"/></linearGradient></defs>';
      html += '        </svg>';
      html += '        <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">';
      html += '          <span style="font-size:22px; font-weight:800; color:var(--text-primary); letter-spacing:-0.03em;">' + overallScore + '<span style="font-size:11px; color:var(--text-muted); font-weight:600;">%</span></span>';
      html += '        </div>';
      html += '      </div>';
      html += '      <div>';
      html += '        <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); margin-bottom:3px;">Compliance Health</div>';
      html += '        <div style="font-size:20px; font-weight:800; color:var(--text-primary); letter-spacing:-0.02em; line-height:1.2;">' + (overallScore >= 90 ? 'Excellent' : overallScore >= 75 ? 'Good Standing' : 'Needs Attention') + '</div>';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';
      // Score breakdowns with progress bars
      html += '  <div style="padding:14px 22px 18px; display:flex; flex-direction:column; gap:10px;">';
      var metrics = [
        { label: 'Policies', val: Math.round(policyScore), icon: 'shield-check' },
        { label: 'Gap Coverage', val: Math.round(gapScore), icon: 'search' },
        { label: 'Processing', val: Math.round(updateScore), icon: 'zap' }
      ];
      metrics.forEach(function(m) {
        var barColor = m.val >= 90 ? 'var(--success)' : m.val >= 70 ? 'var(--warning)' : 'var(--danger)';
        html += '<div>';
        html += '  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">';
        html += '    <span style="font-size:11.5px; font-weight:600; color:var(--text-secondary); display:flex; align-items:center; gap:5px;"><i data-lucide="' + m.icon + '" style="width:12px;height:12px;opacity:0.6;"></i>' + m.label + '</span>';
        html += '    <span style="font-size:12px; font-weight:700; color:' + barColor + ';">' + m.val + '%</span>';
        html += '  </div>';
        html += '  <div style="height:5px; background:rgba(255,255,255,0.06); border-radius:100px; overflow:hidden;">';
        html += '    <div style="height:100%; width:' + m.val + '%; background:' + barColor + '; border-radius:100px; transition: width 1s cubic-bezier(0.4,0,0.2,1);"></div>';
        html += '  </div>';
        html += '</div>';
      });
      html += '  </div>';
      html += '</div>';


      // Recent Regulations Timeline — with Day/Week/Month filter
      var regFilter = this.recentFilter || 'all';
      html += '<div class="card' + (isRefresh ? '' : ' view-enter stagger-4') + ' glass-panel" style="grid-column: span 8;">';
      html += '<div class="card__header" style="flex-wrap:wrap;gap:8px;">';
      html += '<span class="card__title"><i data-lucide="clock" style="width:16px;height:16px"></i> Recent Regulations</span>';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-left:auto;">';
      var filterBtns = [
        { key: 'day', label: 'Today' },
        { key: 'week', label: 'This Week' },
        { key: 'month', label: 'This Month' },
        { key: 'all', label: 'All' }
      ];
      filterBtns.forEach(function(f) {
        var activeStyle = regFilter === f.key
          ? 'background:var(--accent);color:white;border-color:var(--accent);'
          : '';
        html += '<button class="btn btn--ghost btn--sm" style="border-radius:100px;padding:0 12px;height:28px;font-size:11px;font-weight:700;' + activeStyle + '" onclick="window.AppCore.Views.dashboard.setRecentFilter(\'' + f.key + '\')">' + f.label + '</button>';
      });
      html += '<button class="btn btn--ghost btn--sm" onclick="window.AppCore.Router.navigate(\'feed\')" style="margin-left:4px;">View All →</button>';
      html += '</div></div>';

      // Filter updates by selected time range
      var now = new Date();
      var filteredUpdates = updates;
      if (regFilter !== 'all') {
        var cutoff = new Date();
        if (regFilter === 'day') { cutoff.setHours(0, 0, 0, 0); }
        else if (regFilter === 'week') { cutoff.setDate(now.getDate() - 7); }
        else if (regFilter === 'month') { cutoff.setMonth(now.getMonth() - 1); }

        filteredUpdates = updates.filter(function(u) {
          var dateStr = u.publication_timestamp || u.date || u.effective_date || '';
          if (!dateStr) return false;
          var d = new Date(dateStr);
          return !isNaN(d) && d >= cutoff;
        });
      }

      var recentUpdates = filteredUpdates.slice(0, 10);
      html += '<div class="dash-timeline">';
      if (recentUpdates.length === 0) {
        var emptyMsg = regFilter === 'day' ? 'No regulations updated today'
                     : regFilter === 'week' ? 'No regulations this week'
                     : regFilter === 'month' ? 'No regulations this month'
                     : 'No regulations ingested yet';
        html += '<div class="empty-state"><div class="empty-state__icon">📋</div><div class="empty-state__title">' + emptyMsg + '</div>';
        if (regFilter !== 'all') {
          html += '<div class="empty-state__text" style="margin-top:8px;"><button class="btn btn--ghost btn--sm" onclick="window.AppCore.Views.dashboard.setRecentFilter(\'all\')">Show all regulations</button></div>';
        }
        html += '</div>';
      } else {
        // Show count badge
        html += '<div style="padding:0 0 12px;font-size:12px;color:var(--text-muted);font-weight:600;">' + filteredUpdates.length + ' regulation' + (filteredUpdates.length !== 1 ? 's' : '') + ' found' + (regFilter !== 'all' ? ' (' + filterBtns.find(function(f){return f.key===regFilter;}).label + ')' : '') + '</div>';
        recentUpdates.forEach(function(u, i) {
          var statusColors = { pending: 'warning', processing: 'info', processed: 'success', escalated: 'danger' };
          var statusLabel = u.status || 'pending';
          // Format the date nicely
          var dateStr = u.publication_timestamp || u.date || u.effective_date || '';
          var displayDate = 'N/A';
          if (dateStr) {
            var d = new Date(dateStr);
            if (!isNaN(d)) {
              var todayStr = now.toDateString();
              if (d.toDateString() === todayStr) {
                displayDate = 'Today, ' + d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
              } else {
                displayDate = d.toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
              }
            }
          }
          html += '<div class="dash-timeline-item view-enter stagger-' + (i + 1) + '">';
          html += '<div class="dash-timeline-item__dot dash-timeline-item__dot--' + (statusColors[statusLabel] || 'neutral') + '"></div>';
          html += '<div class="dash-timeline-item__content">';
          html += '<div class="dash-timeline-item__title">' + H.sanitizeHTML(u.document_title || u.update_id) + '</div>';
          html += '<div class="dash-timeline-item__meta">';
          html += '<span class="badge badge--' + (statusColors[statusLabel] || 'neutral') + '">' + statusLabel + '</span>';
          html += '<span><i data-lucide="map-pin" style="width:11px;height:11px"></i> ' + (u.jurisdiction || 'Unknown') + '</span>';
          html += '<span><i data-lucide="calendar" style="width:11px;height:11px"></i> ' + displayDate + '</span>';
          html += '</div></div></div>';
        });
      }
      html += '</div></div>'; // end dash-timeline + card

      // Policy Breakdown Donut Chart — Premium Card
      html += '<div class="card view-enter stagger-5 glass-panel" style="grid-column: span 4; padding:0; overflow:hidden;">';
      html += '  <div class="card__header" style="padding:16px 20px; border-bottom:1px solid rgba(255,255,255,0.06);">';
      html += '    <span class="card__title" style="font-size:13px;"><i data-lucide="pie-chart" style="width:15px;height:15px"></i> Policy Status Breakdown</span>';
      html += '  </div>';
      html += '  <div style="flex: 1; min-height: 200px; padding: 16px; display:flex; justify-content:center; align-items:center; position:relative;">';
      html += '    <div style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;"><canvas id="dash-donut-chart"></canvas></div>';
      html += '  </div>';
      // Legend below chart
      html += '  <div style="padding: 0 20px 16px; display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">';
      var legendItems = [
        { label: 'Active', color: '#10b981', count: activePolicies },
        { label: 'Under Review', color: '#f59e0b', count: policies.filter(function(p){return p.status==="under_review";}).length },
        { label: 'Draft', color: '#ef4444', count: policies.filter(function(p){return p.status!=="active" && p.status!=="under_review";}).length }
      ];
      legendItems.forEach(function(item) {
        html += '<div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); font-weight:500;">';
        html += '  <span style="width:8px; height:8px; border-radius:50%; background:' + item.color + '; flex-shrink:0;"></span>';
        html += '  ' + item.label + ' <span style="font-weight:700; color:var(--text-primary);">' + item.count + '</span>';
        html += '</div>';
      });
      html += '  </div>';
      html += '</div>';

      // Row 3: Regional Compliance Overview (span 6) + Policy Health (span 6)
      html += '<div class="card view-enter stagger-6 glass-panel dash-region-card" style="grid-column: span 6;">';
      html += '<div class="card__header"><span class="card__title"><i data-lucide="globe" style="width:16px;height:16px"></i> Regional Compliance</span></div>';
      html += '<div class="dash-region-grid">';
      var regions = ['APAC', 'EU', 'North America'];
      regions.forEach(function(region) {
        var regUpdates = updates.filter(function(u) {
          var j = u.jurisdiction || '';
          if (region === 'North America' && (j.indexOf('US') > -1 || j === 'North America')) return true;
          if (region === 'EU' && (j.indexOf('EU') > -1 || j.indexOf('FCA') > -1 || j === 'EU')) return true;
          return j === region;
        });
        var regPolicies = policies.filter(function(p) { return p.region && p.region.indexOf(region) !== -1; });
        var regPending = regUpdates.filter(function(u) { return u.status === 'pending'; }).length;
        var healthPct = regPolicies.length > 0 ? Math.round((regPolicies.filter(function(p){return p.status==='active';}).length / regPolicies.length) * 100) : 100;
        var healthColor = healthPct >= 90 ? 'var(--success)' : healthPct >= 70 ? 'var(--warning)' : 'var(--danger)';

        html += '<div class="dash-region-tile">';
        html += '<div class="dash-region-tile__header"><span class="dash-region-tile__name">' + region + '</span><span class="dash-region-tile__health" style="color:' + healthColor + '">' + healthPct + '% Compliant</span></div>';
        html += '<div class="dash-region-tile__stats">';
        html += '<div class="dash-region-tile__stat"><span class="dash-region-tile__stat-val">' + regPolicies.length + '</span><span class="dash-region-tile__stat-lbl">Policies</span></div>';
        html += '<div class="dash-region-tile__stat"><span class="dash-region-tile__stat-val">' + regUpdates.length + '</span><span class="dash-region-tile__stat-lbl">Regs</span></div>';
        html += '<div class="dash-region-tile__stat"><span class="dash-region-tile__stat-val' + (regPending > 0 ? ' dash-pulse' : '') + '">' + regPending + '</span><span class="dash-region-tile__stat-lbl">Pending</span></div>';
        html += '</div>';
        html += '<div class="dash-region-tile__bar"><div class="dash-region-tile__bar-fill" style="width:' + healthPct + '%;background:' + healthColor + '"></div></div>';
        html += '</div>';
      });
      html += '</div></div>';

      // Policy Health Snapshot
      html += '<div class="card view-enter stagger-6 glass-panel" style="grid-column: span 6;">';
      html += '<div class="card__header"><span class="card__title"><i data-lucide="shield-check" style="width:16px;height:16px"></i> Policy Health</span>';
      html += '<button class="btn btn--ghost btn--sm" onclick="window.AppCore.Router.navigate(\'policy\')">Manage →</button></div>';
      html += '<div class="dash-policy-health">';
      policies.forEach(function(p) {
        var statusIcon = p.status === 'active' ? 'check-circle' : p.status === 'under_review' ? 'alert-circle' : 'x-circle';
        var statusColor = p.status === 'active' ? 'var(--success)' : p.status === 'under_review' ? 'var(--warning)' : 'var(--danger)';
        html += '<div class="dash-policy-row" style="cursor:pointer;" onclick="if(window.AppCore.Views.policy) { window.AppCore.Views.policy.selectedId = \'' + p.policy_id + '\'; } window.AppCore.Router.navigate(\'policy\');">';
        html += '<div class="dash-policy-row__icon" style="color:' + statusColor + '"><i data-lucide="' + statusIcon + '" style="width:16px;height:16px"></i></div>';
        html += '<div class="dash-policy-row__info">';
        html += '<div class="dash-policy-row__title">' + p.title + '</div>';
        html += '<div class="dash-policy-row__meta">v' + p.version + ' · ' + (p.region || []).join(', ') + '</div>';
        html += '</div>';
        html += '<span class="badge badge--' + (p.status === 'active' ? 'success' : p.status === 'under_review' ? 'warning' : 'danger') + '">' + p.status.replace('_', ' ') + '</span>';
        html += '</div>';
      });
      html += '</div></div>';


      // Note: No right column closing tag anymore
      html += '</div></div>'; // end main grid + dashboard

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Initialize Chart.js
      setTimeout(function() {
        if (!window.Chart) return;
        
        // 1. Line Chart (Trend)
        var trendCtx = document.getElementById('dash-trend-chart');
        if (trendCtx) {
          // Destroy existing chart if re-rendering
          if (window.AppCore.Views.dashboard.trendChart) window.AppCore.Views.dashboard.trendChart.destroy();
          window.AppCore.Views.dashboard.trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Compliance Health',
                data: [72, 78, 85, 82, 90, overallScore],
                borderColor: '#e11d48',
                backgroundColor: 'rgba(225,29,72,0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#e11d48',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#e11d48',
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { min: 50, max: 100, grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                x: { grid: { display: false, drawBorder: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
              }
            }
          });
        }
        
        // 2. Donut Chart (Status)
        var donutCtx = document.getElementById('dash-donut-chart');
        if (donutCtx) {
          if (window.AppCore.Views.dashboard.donutChart) window.AppCore.Views.dashboard.donutChart.destroy();
          var underReview = policies.filter(function(p) { return p.status === 'under_review'; }).length;
          var draft = policies.filter(function(p) { return p.status === 'draft' || p.status === 'deprecated'; }).length;
          window.AppCore.Views.dashboard.donutChart = new Chart(donutCtx, {
            type: 'doughnut',
            data: {
              labels: ['Active', 'Under Review', 'Draft/Deprecated'],
              datasets: [{
                data: [activePolicies, underReview, draft],
                backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              cutout: '75%',
              plugins: {
                legend: { position: 'right', labels: { color: 'rgba(255,255,255,0.7)', usePointStyle: true, boxWidth: 8 } }
              }
            }
          });
        }
      }, 50);

      // Removed memory leak here. Dashboard auto-refresh is handled centrally in app.js
    },
    _kpiCard: function (icon, colorClass, value, title, trendText, trendDir, extraClass, targetView) {
      var trendIcon = trendDir === 'up' ? 'trending-up' : 'trending-down';
      var bars = '';
      for(var i=0; i<8; i++) {
        var h = 30 + Math.random() * 70;
        var cls = (i === 7) ? 'sparkline__bar active ' + colorClass : 'sparkline__bar';
        bars += '<div class="' + cls + '" style="height:' + h + '%"></div>';
      }
      var clickAttr = '';
      if (targetView) {
        if (targetView.startsWith('feed:')) {
          var status = targetView.split(':')[1];
          clickAttr = ' onclick="window.AppCore.Views.feed.filters.status=\'' + status + '\'; window.AppCore.Router.navigate(\'feed\')" style="cursor:pointer" ';
        } else {
          clickAttr = ' onclick="window.AppCore.Router.navigate(\'' + targetView + '\')" style="cursor:pointer" ';
        }
      }
      return '<div class="kpi-card kpi-card--' + colorClass + ' ' + (extraClass || '') + '"' + clickAttr + '>' +
        '<div class="kpi-card__header"><span>' + title + '</span><div class="kpi-card__icon"><i data-lucide="' + icon + '"></i></div></div>' +
        '<div class="kpi-card__value">' + value + '</div>' +
        '<div class="kpi-card__footer">' +
          '<div class="kpi-card__trend kpi-card__trend--' + trendDir + '"><i data-lucide="' + trendIcon + '" style="width:14px;height:14px"></i> <span class="kpi-card__trend-text">' + trendText + '</span></div>' +
          '<div class="sparkline">' + bars + '</div>' +
        '</div>' +
        '</div>';
    },
    recentFilter: 'all',
    setRecentFilter: function(filter) {
      this.recentFilter = filter;
      var container = document.getElementById('view-container');
      if (container) this.render(container);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     REGULATORY FEED VIEW (PROFESSIONAL ENTERPRISE COMPLIANCE)
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.feed = {
    selectedId: null,
    searchQuery: '',
    filters: { jurisdiction: 'all', priority: 'all', businessLine: 'all', status: 'all' },
    render: function (container) {
      var self = this;
      var updates = State.getByPath('regulatoryUpdates') || [];

      // Extract unique business lines dynamically from data
      var allBusinessLines = [];
      updates.forEach(function (u) {
        if (u.business_line_scope) {
          u.business_line_scope.forEach(function (bl) {
            if (allBusinessLines.indexOf(bl) === -1) {
              allBusinessLines.push(bl);
            }
          });
        }
      });
      allBusinessLines.sort();

      // Extract unique jurisdictions dynamically
      var allJurisdictions = [];
      updates.forEach(function (u) {
        if (u.jurisdiction && allJurisdictions.indexOf(u.jurisdiction) === -1) {
          allJurisdictions.push(u.jurisdiction);
        }
      });
      allJurisdictions.sort();

      // Filter updates based on search, jurisdiction, priority, and business line
      var sq = (self.searchQuery || '').trim().toLowerCase();
      var filtered = updates.filter(function (u) {
        var matchJur = self.filters.jurisdiction === 'all' || u.jurisdiction === self.filters.jurisdiction;
        var matchPri = self.filters.priority === 'all' || u.priority === self.filters.priority;
        var matchBL = self.filters.businessLine === 'all' || (u.business_line_scope && u.business_line_scope.indexOf(self.filters.businessLine) !== -1);
        
        var uStatus = (u.status === 'completed' ? 'processed' : u.status); // normalize completed to processed for UI filter
        var matchStatus = self.filters.status === 'all' || uStatus === self.filters.status;

        var matchSearch = true;
        if (sq) {
          var titleMatch = (u.document_title || '').toLowerCase().indexOf(sq) !== -1;
          var authMatch = (u.source_authority || '').toLowerCase().indexOf(sq) !== -1;
          var idMatch = (u.update_id || '').toLowerCase().indexOf(sq) !== -1;
          matchSearch = titleMatch || authMatch || idMatch;
        }
        return matchJur && matchPri && matchBL && matchStatus && matchSearch;
      });

      filtered.sort(function(a, b) {
        return new Date(b.publication_timestamp).getTime() - new Date(a.publication_timestamp).getTime();
      });

      // Default selection to first item if none selected or selected item filtered out
      if (filtered.length > 0 && (!self.selectedId || !filtered.some(function(x) { return x.update_id === self.selectedId; }))) {
        self.selectedId = filtered[0].update_id;
      }

      var isRefresh = container.querySelector('.feed') !== null;
      var animClass = isRefresh ? '' : ' animate-slide-up';
      var html = '<div class="feed' + animClass + '">';

      // ── Command Bar (single-row) ──
      html += '<div class="feed__toolbar">';

      // Search segment
      html += '<div class="feed-search-seg">';
      html += '  <i data-lucide="search"></i>';
      html += '  <input type="text" class="feed-search-input" id="feed-search-input" placeholder="Search notices, agencies..." value="' + H.sanitizeHTML(self.searchQuery) + '">';
      html += '</div>';

      // Status segment
      html += '<div class="feed-filter-seg">';
      html += '<select class="feed-select" id="feed-filter-status">';
      html += '<option value="all"' + (self.filters.status === 'all' ? ' selected' : '') + '>All Statuses</option>';
      html += '<option value="pending"' + (self.filters.status === 'pending' ? ' selected' : '') + '>Pending</option>';
      html += '<option value="processed"' + (self.filters.status === 'processed' ? ' selected' : '') + '>Processed</option>';
      html += '</select>';
      html += '</div>';

      // Jurisdiction segment
      html += '<div class="feed-filter-seg">';
      html += '<select class="feed-select" id="feed-filter-jurisdiction">';
      html += '<option value="all"' + (self.filters.jurisdiction === 'all' ? ' selected' : '') + '>All Jurisdictions</option>';
      allJurisdictions.forEach(function(jur) {
        html += '<option value="' + jur + '"' + (self.filters.jurisdiction === jur ? ' selected' : '') + '>' + jur + '</option>';
      });
      html += '</select>';
      html += '</div>';

      // Priority segment
      html += '<div class="feed-filter-seg">';
      html += '<select class="feed-select" id="feed-filter-priority">';
      html += '<option value="all"' + (self.filters.priority === 'all' ? ' selected' : '') + '>All Priorities</option>';
      html += '<option value="high"' + (self.filters.priority === 'high' ? ' selected' : '') + '>High</option>';
      html += '<option value="medium"' + (self.filters.priority === 'medium' ? ' selected' : '') + '>Medium</option>';
      html += '<option value="low"' + (self.filters.priority === 'low' ? ' selected' : '') + '>Low</option>';
      html += '</select>';
      html += '</div>';

      // Business Line segment
      html += '<div class="feed-filter-seg">';
      html += '<select class="feed-select" id="feed-filter-business-line">';
      html += '<option value="all"' + (self.filters.businessLine === 'all' ? ' selected' : '') + '>All Lines</option>';
      allBusinessLines.forEach(function (bl) {
        html += '<option value="' + bl + '"' + (self.filters.businessLine === bl ? ' selected' : '') + '>' + bl + '</option>';
      });
      html += '</select>';
      html += '</div>';

      // Spacer
      html += '<div class="feed__toolbar-spacer"></div>';

      // Right actions
      html += '<div class="feed__toolbar-right">';
      html += '  <div class="feed-counter-pill"><span class="feed-counter-dot"></span> <span class="feed-counter-val">' + filtered.length + '</span> notices</div>';
      html += '  <button class="feed-btn-scan" id="btn-refresh-feed" title="Scan live regulatory RSS feeds"><i data-lucide="refresh-cw"></i> Scan</button>';
      html += '</div>';

      html += '</div>'; // /feed__toolbar

      html += '<div class="feed__layout">';

      // ── Left Column: Feed List ──
      html += '<div class="feed__list scroll-area" id="feed-list">';
      if (filtered.length === 0) {
        html += '<div style="padding:48px 24px; text-align:center; color:var(--text-muted); font-size:13.5px; background:rgba(255,255,255,0.02); border:1px dashed rgba(255,255,255,0.08); border-radius:12px;">';
        html += '  <i data-lucide="search-x" style="width:28px;height:28px;margin-bottom:8px;opacity:0.5;"></i>';
        html += '  <div>No regulatory notices match your search or filters.</div>';
        html += '</div>';
      } else {
        filtered.forEach(function (u) {
          var isActive = self.selectedId === u.update_id;
          var isCompleted = u.status === 'completed';
          var statusColor = isCompleted ? 'success' : 'warning';
          var statusLabel = isCompleted ? 'PROCESSED' : 'PENDING';
          var hasReview = !isCompleted;

          // Build the ID line (agency short name)
          var auth = (u.source_authority || '').toLowerCase();
          var agencyShort = u.source_authority || 'Regulatory Notice';
          if (auth.indexOf('fed') !== -1 || auth.indexOf('federal reserve') !== -1) {
            agencyShort = 'Federal Reserve';
          } else if (auth.indexOf('sec') !== -1 || auth.indexOf('securities') !== -1) {
            agencyShort = 'US SEC';
          } else if (auth.indexOf('cfpb') !== -1 || auth.indexOf('consumer') !== -1) {
            agencyShort = 'CFPB';
          } else if (auth.indexOf('meity') !== -1) {
            agencyShort = 'MeitY (India)';
          } else if (auth.indexOf('rbi') !== -1) {
            agencyShort = 'RBI';
          } else if (u.is_policy_update) {
            agencyShort = 'INTERNAL ALIGNMENT';
          }

          var borderStyle = hasReview ? 'border-left: 3px solid #f59e0b;' : '';
          if (u.is_policy_update) {
            borderStyle = 'border-left: 3px solid var(--success); background: rgba(16, 185, 129, 0.05);';
          }

          html += '<div class="feed-item' + (isActive ? ' active' : '') + '" data-id="' + u.update_id + '" style="' + borderStyle + '">';
          
          if (u.is_policy_update) {
            html += '<div class="feed-item__id" style="color:var(--success);"><i data-lucide="shield-check" style="width:14px;height:14px;display:inline-block;vertical-align:-2px;margin-right:4px;"></i>' + H.sanitizeHTML(agencyShort) + '</div>';
          } else {
            html += '<div class="feed-item__id">' + H.sanitizeHTML(agencyShort) + '</div>';
          }
          html += '<div class="feed-item__title">' + H.sanitizeHTML(u.document_title || 'Untitled Document') + '</div>';
          html += '<div class="feed-item__meta">';
          html += '<span class="badge badge--' + statusColor + '">' + statusLabel + '</span>';
          html += '<span>' + (u.jurisdiction || 'Global') + '</span>';
          html += '<span>' + (u.effective_date || (u.publication_timestamp ? H.formatDate(u.publication_timestamp) : 'Recent')) + '</span>';
          html += '</div></div>';
        });
      }
      html += '</div>'; // /feed__list

      // ── Right Column: Detail Panel ──
      html += '<div class="feed__detail scroll-area" id="feed-detail">';
      if (this.selectedId) {
        var u = updates.find(function (x) { return x.update_id === self.selectedId; });
        if (u) {
          html += this._renderDetail(u);
        }
      } else {
        html += '<div class="feed__detail-empty">';
        html += '  <div class="feed__empty-orb">';
        html += '    <div class="feed__empty-rings"></div>';
        html += '    <i data-lucide="inbox" style="width:32px;height:32px;color:var(--text-white);position:relative;z-index:2;"></i>';
        html += '  </div>';
        html += '  <div class="feed__empty-title">Select a Notice</div>';
        html += '  <div class="feed__empty-subtitle">Choose a regulatory circular or enforcement notice from the feed to view executive intelligence and policy impacts.</div>';
        html += '</div>';
      }
      html += '</div>'; // /feed__detail

      html += '</div>'; // /feed__layout
      html += '</div>'; // /feed

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Bind feed item clicks
      container.querySelectorAll('.feed-item').forEach(function (item) {
        item.addEventListener('click', function () {
          self.selectedId = item.dataset.id;
          self.render(container);
        });
      });

      // Bind search input
      var searchInput = container.querySelector('#feed-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', function() {
          self.searchQuery = searchInput.value;
          self.render(container);
          // Restore focus & cursor position
          var reInput = container.querySelector('#feed-search-input');
          if (reInput) {
            reInput.focus();
            reInput.setSelectionRange(reInput.value.length, reInput.value.length);
          }
        });
      }

      // Bind filters
      var statusSelect = container.querySelector('#feed-filter-status');
      var jurSelect = container.querySelector('#feed-filter-jurisdiction');
      var priSelect = container.querySelector('#feed-filter-priority');
      var blSelect = container.querySelector('#feed-filter-business-line');
      
      if (statusSelect) {
        statusSelect.addEventListener('change', function () {
          self.filters.status = statusSelect.value;
          self.render(container);
        });
      }
      
      if (jurSelect) {
        jurSelect.addEventListener('change', function () {
          self.filters.jurisdiction = jurSelect.value;
          self.render(container);
        });
      }
      if (priSelect) {
        priSelect.addEventListener('change', function () {
          self.filters.priority = priSelect.value;
          self.render(container);
        });
      }
      if (blSelect) {
        blSelect.addEventListener('change', function () {
          self.filters.businessLine = blSelect.value;
          self.render(container);
        });
      }

      // Refresh Feeds button
      var btnRefresh = container.querySelector('#btn-refresh-feed');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', function() {
          btnRefresh.disabled = true;
          btnRefresh.innerHTML = '<i data-lucide="loader-2" class="spin" style="width:13px;height:13px"></i> Scanning...';
          if (window.lucide) window.lucide.createIcons();

          // Simulate finding a new regulation and auto-updating an internal policy
          setTimeout(function() {
            var currentUpdates = State.getByPath('regulatoryUpdates') || [];
            
            // Generate a slightly older timestamp for the regulation, and newer for the policy update
            var now = Date.now();
            var regTime = new Date(now - 1000).toISOString();
            var polTime = new Date(now).toISOString();
            
            var newReg = {
              update_id: 'REG-2024-NEW-' + now,
              source_authority: 'Securities and Exchange Board of India (SEBI)',
              source_type: 'Master Circular',
              publication_timestamp: regTime,
              jurisdiction: 'APAC',
              document_title: 'Master Circular on ESG Disclosures and Supply Chain Reporting',
              extracted_text: 'All Top 1000 listed entities must immediately enforce mandatory Environmental, Social, and Governance (ESG) reporting requirements across their supply chains. Internal corporate governance policies must be updated to reflect strict carbon footprint transparency and third-party vendor audits.',
              business_line_scope: ['Corporate Governance', 'Risk Management'],
              status: 'completed',
              priority: 'high'
            };
            
            var policyUpdate = {
              update_id: 'POL-UPD-' + now,
              source_authority: 'Internal Policy Auto-Alignment',
              source_type: 'Policy Update',
              publication_timestamp: polTime,
              jurisdiction: 'Internal',
              document_title: 'Policy Repo Updated: POL-ESG-001 (Sustainability Guidelines)',
              extracted_text: 'Internal Policy POL-ESG-001 has been automatically updated and realigned to comply with the new SEBI Master Circular on ESG Disclosures. New clauses for mandatory carbon footprint disclosure and vendor audits have been injected. Version bumped to 2.1.',
              business_line_scope: ['Corporate Governance'],
              status: 'completed',
              priority: 'high',
              is_policy_update: true
            };
            
            // Check if already added to avoid duplicates if clicked multiple times
            if (!currentUpdates.some(function(u) { return u.document_title === newReg.document_title; })) {
              currentUpdates.push(newReg);
              currentUpdates.push(policyUpdate);
              State.setByPath('regulatoryUpdates', currentUpdates);
              
              // Also inject the actual policy into the Policy Repo!
              var currentPolicies = State.getByPath('policies') || [];
              if (!currentPolicies.some(function(p) { return p.policy_id === 'POL-ESG-001'; })) {
                currentPolicies.unshift({
                  policy_id: 'POL-ESG-001',
                  title: 'Sustainability Guidelines & ESG',
                  version: '2.1',
                  last_updated: new Date().toISOString().split('T')[0],
                  owner: 'Chief Sustainability Officer',
                  department: 'Corporate Governance',
                  region: ['APAC'],
                  status: 'under_review',
                  applicable_regulations: ['SEBI Master Circular on ESG Disclosures'],
                  summary: 'Governs corporate sustainability, ESG reporting, and supply chain transparency requirements.',
                  business_lines: ['Corporate Governance', 'Risk Management'],
                  review_cycle: 'Annual',
                  next_review_date: '2025-01-01',
                  sections: [
                    {
                      section_id: 'POL-ESG-001-S1',
                      title: '1. General Sustainability Principles',
                      content: 'The company is committed to sustainable operations and minimizing environmental impact.',
                      status: 'compliant'
                    },
                    {
                      section_id: 'POL-ESG-001-S2',
                      title: '2. Carbon Footprint Disclosure & Vendor Audits',
                      content: 'All top-tier supply chain vendors must undergo strict carbon footprint transparency audits as mandated by the latest SEBI Master Circular on ESG Disclosures. Vendors failing the audit will be subjected to remediation processes.',
                      status: 'added_by_ai'
                    }
                  ],
                  change_history: [
                    {
                      version: '1.2',
                      date: '2022-05-12',
                      regulatory_trigger: 'National Sustainability Framework',
                      reason: 'Initial ESG reporting adoption',
                      summary: 'Adopted basic sustainability metrics for internal operations.'
                    },
                    {
                      version: '1.5',
                      date: '2023-01-20',
                      regulatory_trigger: 'Green Energy Mandate',
                      reason: 'Energy consumption reporting',
                      summary: 'Added mandatory quarterly reporting on renewable energy usage.'
                    },
                    {
                      version: '2.0',
                      date: '2023-08-15',
                      regulatory_trigger: 'SEBI BRSR Core',
                      reason: 'Alignment with BRSR Core framework',
                      summary: 'Integrated BRSR Core metrics into supply chain evaluations.'
                    },
                    {
                      version: '2.1',
                      date: new Date().toISOString().split('T')[0],
                      regulatory_trigger: 'SEBI Master Circular on ESG Disclosures',
                      reason: 'Mandatory carbon footprint transparency',
                      summary: 'Injected new clauses for mandatory carbon footprint disclosure and vendor audits.'
                    }
                  ]
                });
                State.setByPath('policies', currentPolicies);
              }
            }
            
            window.AppCore.App.showToast('success', 'Regulatory Scan Complete', 'Scanned live feeds. New govt regulation found and internal policy auto-updated.');
            self.render(container);
          }, 1500);
        });
      }

      // AI Triage Predictor
      var btnAiTriage = container.querySelector('#btn-ai-triage');
      if (btnAiTriage) {
        btnAiTriage.addEventListener('click', function() {
          var alertId = this.dataset.id;
          var u = updates.find(function(x) { return x.update_id === alertId; });
          if (!u) return;
          
          var outContainer = document.getElementById('ai-triage-output');
          if (!outContainer) return;
          
          outContainer.style.display = 'block';
          outContainer.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text-muted);"><div class="loading-spinner" style="margin:0 auto 10px;width:22px;height:22px;"></div><div style="font-size:13px;font-weight:600;color:var(--text-primary);">Synthesizing Regulatory Impact & Case Precedents...</div></div>';
          btnAiTriage.disabled = true;
          
          fetch('/api/ai-triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ update: u })
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            btnAiTriage.disabled = false;
            if (data.error) throw new Error(data.error);
            var color = data.severity === 'Critical' ? '#ef4444' : (data.severity === 'High' ? '#f97316' : (data.severity === 'Medium' ? '#f59e0b' : '#10b981'));
            var resultHtml = '<div style="padding:22px;background:linear-gradient(145deg, rgba(99,102,241,0.06) 0%, rgba(15,23,42,0.95) 100%);border:1px solid rgba(168,85,247,0.4);border-radius:16px;margin-bottom:24px;box-shadow: 0 8px 32px rgba(0,0,0,0.3);backdrop-filter: blur(12px); animation: fadeInUp 0.5s ease-out;">';
            
            resultHtml += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);">';
            resultHtml += '  <div style="font-size:15px;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:10px;"><i data-lucide="brain-circuit" style="width:18px;height:18px;color:#c084fc;filter: drop-shadow(0 0 8px rgba(192,132,252,0.6));"></i> AI Triage Prediction</div>';
            resultHtml += '  <span style="font-size:12px;font-weight:800;color:'+color+';background:rgba(255,255,255,0.08);padding:5px 12px;border-radius:24px;border:1px solid '+color+';text-transform:uppercase;letter-spacing:0.05em;box-shadow: 0 0 10px '+color+'40;">' + H.sanitizeHTML(data.severity || 'High') + ' Urgency</span>';
            resultHtml += '</div>';

            resultHtml += '<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.08em;margin-bottom:8px;display:flex;align-items:center;gap:6px;"><i data-lucide="info" style="width:13px;height:13px;"></i> Reasoning & Precedent Synthesis</div>';
            resultHtml += '<div style="font-size:14px;color:#e2e8f0;line-height:1.7;margin-bottom:18px;font-weight:400;">' + H.sanitizeHTML(data.reasoning || '') + '</div>';

            if (data.similarCases && data.similarCases.length > 0) {
              resultHtml += '<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><i data-lucide="gavel" style="width:13px;height:13px;"></i> Historical Case Precedents</div>';
              data.similarCases.forEach(function(caseItem) {
                resultHtml += '<div style="margin-bottom:10px;background:rgba(255,255,255,0.02);padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);transition: all 0.2s ease;cursor:default;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\';this.style.borderColor=\'rgba(56,189,248,0.3)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.02)\';this.style.borderColor=\'rgba(255,255,255,0.08)\'">';
                resultHtml += '  <div style="font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:5px;">' + H.sanitizeHTML(caseItem.title) + '</div>';
                resultHtml += '  <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">' + H.sanitizeHTML(caseItem.resolution) + '</div>';
                resultHtml += '</div>';
              });
            }

            resultHtml += '</div>';
            outContainer.innerHTML = resultHtml;
            if (window.lucide) window.lucide.createIcons();
          })
          .catch(function(err) {
            btnAiTriage.disabled = false;
            outContainer.innerHTML = '<div style="padding:14px;color:#f87171;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.25);font-size:13px;"><i data-lucide="alert-triangle" style="width:15px;height:15px;vertical-align:middle;margin-right:6px;"></i> AI Triage Analysis Unavailable: ' + H.sanitizeHTML(err.message) + '</div>';
            if (window.lucide) window.lucide.createIcons();
          });
        });
      }
      // Policy Impact Matcher
      var btnPolicyImpact = container.querySelector('#btn-policy-impact');
      if (btnPolicyImpact) {
        btnPolicyImpact.addEventListener('click', function() {
          var alertId = this.dataset.id;
          var u = updates.find(function(x) { return x.update_id === alertId; });
          if (!u) return;
          
          var outContainer = document.getElementById('policy-impact-output');
          if (!outContainer) return;
          
          outContainer.style.display = 'block';
          outContainer.innerHTML = '<div style="padding:18px;text-align:center;color:var(--text-muted);"><div class="loading-spinner" style="margin:0 auto 10px;width:22px;height:22px;border-color:rgba(56,189,248,0.5);border-top-color:#38bdf8;"></div><div style="font-size:13px;font-weight:600;color:var(--text-primary);">Scanning Internal Policies for Impacts...</div></div>';
          btnPolicyImpact.disabled = true;
          
          fetch('/api/auto-match-policies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ update: u })
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            btnPolicyImpact.disabled = false;
            if (data.error) throw new Error(data.error);
            
            var resultHtml = '<div style="padding:22px;background:linear-gradient(145deg, rgba(14,165,233,0.06) 0%, rgba(15,23,42,0.95) 100%);border:1px solid rgba(56,189,248,0.4);border-radius:16px;margin-bottom:24px;box-shadow: 0 8px 32px rgba(0,0,0,0.3);backdrop-filter: blur(12px); animation: fadeInUp 0.5s ease-out;">';
            
            resultHtml += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,0.08);">';
            resultHtml += '  <div style="font-size:15px;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:10px;"><i data-lucide="scan" style="width:18px;height:18px;color:#38bdf8;filter: drop-shadow(0 0 8px rgba(56,189,248,0.6));"></i> Internal Policy Impact Scan</div>';
            
            if (data.matched_policies && data.matched_policies.length > 0) {
              resultHtml += '  <span style="font-size:12px;font-weight:800;color:#38bdf8;background:rgba(255,255,255,0.08);padding:5px 12px;border-radius:24px;border:1px solid #38bdf8;text-transform:uppercase;letter-spacing:0.05em;box-shadow: 0 0 10px rgba(56,189,248,0.4);">' + data.matched_policies.length + ' Policies Impacted</span>';
              resultHtml += '</div>';

              resultHtml += '<div style="font-size:11.5px;font-weight:800;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.08em;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><i data-lucide="shield-alert" style="width:13px;height:13px;"></i> Affected Policies</div>';
              data.matched_policies.forEach(function(match) {
                resultHtml += '<div style="margin-bottom:10px;background:rgba(255,255,255,0.02);padding:14px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);transition: all 0.2s ease;cursor:pointer;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\';this.style.borderColor=\'rgba(56,189,248,0.3)\'" onmouseout="this.style.background=\'rgba(255,255,255,0.02)\';this.style.borderColor=\'rgba(255,255,255,0.08)\'" onclick="window.AppCore.App.navigate(\'policy\'); window.AppCore.Views.policy.selectedId=\'' + match.policy_id + '\';">';
                resultHtml += '  <div style="font-size:13px;font-weight:700;color:#38bdf8;margin-bottom:5px;display:flex;align-items:center;justify-content:space-between;">' + H.sanitizeHTML(match.title || match.policy_id) + '<i data-lucide="arrow-right" style="width:14px;height:14px;color:rgba(255,255,255,0.3);"></i></div>';
                resultHtml += '  <div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">' + H.sanitizeHTML(match.reason) + '</div>';
                resultHtml += '</div>';
              });
            } else {
              resultHtml += '  <span style="font-size:12px;font-weight:800;color:#10b981;background:rgba(255,255,255,0.08);padding:5px 12px;border-radius:24px;border:1px solid #10b981;text-transform:uppercase;letter-spacing:0.05em;box-shadow: 0 0 10px rgba(16,185,129,0.4);">No Impact Found</span>';
              resultHtml += '</div>';
              resultHtml += '<div style="font-size:13.5px;color:#94a3b8;line-height:1.6;text-align:center;padding:20px 0;">This regulatory update does not appear to directly impact any of your currently active internal policies.</div>';
            }

            resultHtml += '</div>';
            outContainer.innerHTML = resultHtml;
            if (window.lucide) window.lucide.createIcons();
          })
          .catch(function(err) {
            btnPolicyImpact.disabled = false;
            outContainer.innerHTML = '<div style="padding:14px;color:#f87171;background:rgba(239,68,68,0.1);border-radius:8px;border:1px solid rgba(239,68,68,0.25);font-size:13px;"><i data-lucide="alert-triangle" style="width:15px;height:15px;vertical-align:middle;margin-right:6px;"></i> Policy Scan Unavailable: ' + H.sanitizeHTML(err.message) + '</div>';
            if (window.lucide) window.lucide.createIcons();
          });
        });
      }
    },

    _renderDetail: function (u) {
      var titleText = H.sanitizeHTML(u.document_title || u.update_id);
      var pri = (u.priority || 'medium').toLowerCase();
      var isCompleted = u.status === 'completed';

      var html = '<div class="feed__detail-header">';
      
      // Top meta breadcrumbs
      html += '<div class="feed-header-top">';
      html += '  <div class="feed-header-badges">';
      html += '    <span class="meta-badge meta-badge--authority"><i data-lucide="landmark" style="width:11px;height:11px"></i> ' + H.sanitizeHTML(u.source_authority || 'Regulatory Agency') + '</span>';
      html += '    <span class="meta-badge meta-badge--' + pri + '"><i data-lucide="alert-circle" style="width:11px;height:11px"></i> ' + pri.toUpperCase() + '</span>';
      html += '    <span class="meta-badge meta-badge--neutral"><i data-lucide="globe" style="width:11px;height:11px"></i> ' + H.sanitizeHTML(u.jurisdiction || 'Global') + '</span>';
      if (isCompleted) {
        html += '    <span class="meta-badge" style="background:rgba(16,185,129,0.14);color:#34d399;border:1px solid rgba(16,185,129,0.3);"><i data-lucide="check-circle-2" style="width:11px;height:11px"></i> Ingested & Analyzed</span>';
      } else {
        html += '    <span class="meta-badge" style="background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);"><span class="status-pulse-dot" style="width:5px;height:5px;"></span> Action Required</span>';
      }
      html += '  </div>';
      html += '</div>';

      // Title
      html += '<h2 class="feed__detail-title">' + titleText + '</h2>';

      // Actions toolbar
      html += '<div class="feed-header-actions">';
      html += '  <button id="btn-ai-triage" class="btn-ai-triage-trigger" data-id="' + u.update_id + '"><i data-lucide="brain-circuit" style="width:14px;height:14px;"></i> AI Triage & Impact Prediction</button>';
      html += '  <button id="btn-policy-impact" class="btn-ai-triage-trigger" data-id="' + u.update_id + '" style="margin-left:8px;background:rgba(56,189,248,0.1);border-color:rgba(56,189,248,0.3);"><i data-lucide="scan" style="width:14px;height:14px;"></i> Scan Internal Policies</button>';
      if (u.existing_internal_policy_refs && u.existing_internal_policy_refs.length > 0) {
        html += '  <button class="btn-remediate-policy" onclick="window.AppCore.App.navigate(\'policy\'); window.AppCore.Views.policy.selectedId=\'' + u.existing_internal_policy_refs[0] + '\';"><i data-lucide="shield-check" style="width:14px;height:14px;"></i> Inspect Affected Policy</button>';
      }
      if (u.source_url) {
        html += '  <a href="' + H.sanitizeHTML(u.source_url) + '" target="_blank" rel="noopener noreferrer" class="btn-source-link"><i data-lucide="external-link" style="width:13px;height:13px;"></i> Official Notice ↗</a>';
      }
      html += '</div>';

      html += '</div>'; // /feed__detail-header

      // ── Detail Body ──
      html += '<div class="feed__detail-body">';

      // 1. Executive Parameter Grid (Refined 4 Cards)
      var pubDate = u.publication_timestamp ? H.formatDate(u.publication_timestamp) : (u.effective_date || 'Recent');
      var effDate = u.effective_date || 'Immediate / Staggered';
      var busScope = (u.business_line_scope && u.business_line_scope.length > 0) ? u.business_line_scope.join(', ') : 'Enterprise Compliance';

      html += '<div class="reg-param-grid">';
      
      var paramCards = [
        { icon: 'landmark', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', border: 'rgba(56,189,248,0.2)', label: 'Regulatory Authority', value: H.sanitizeHTML(u.source_authority || 'Unknown') },
        { icon: 'hash', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', label: 'Notice ID / Docket', value: H.sanitizeHTML(u.update_id) },
        { icon: 'calendar', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', label: 'Published / Effective', value: pubDate },
        { icon: 'briefcase', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', label: 'Impacted Business Lines', value: H.sanitizeHTML(busScope) }
      ];
      paramCards.forEach(function(p) {
        html += '<div class="reg-param-card">';
        html += '  <div class="reg-param-icon" style="background:' + p.bg + '; border-color:' + p.border + '; color:' + p.color + ';"><i data-lucide="' + p.icon + '" style="width:16px;height:16px;"></i></div>';
        html += '  <div><div class="reg-param-label">' + p.label + '</div><div class="reg-param-value">' + p.value + '</div></div>';
        html += '</div>';
      });

      html += '</div>'; // /reg-param-grid

      // AI Triage Output Placeholder
      html += '<div id="ai-triage-output" style="display:none;margin-bottom:20px;"></div>';
      
      // Policy Impact Output Placeholder
      html += '<div id="policy-impact-output" style="display:none;margin-bottom:20px;"></div>';

      // 2. Executive Intelligence Brief (Hero Card)
      html += '<div class="reg-brief-card">';
      html += '  <div class="reg-brief-header">';
      html += '    <div class="reg-brief-title"><i data-lucide="file-check-2" style="width:18px;height:18px;color:#38bdf8;"></i> Executive Compliance Brief</div>';
      html += '  </div>';
      
      var summaryText = u.summary || 'This regulatory notification was ingested by PolicyPilot. Review the official text below to verify impacts against internal credit, risk, and wealth management compliance baselines.';
      html += '  <div class="reg-brief-text">' + H.sanitizeHTML(summaryText) + '</div>';

      // Strategic Impact Grid (Pros & Cons)
      var processedLog = State.getByPath('processedUpdates') || [];
      var pData = processedLog.find(function(pu) { return pu.update_id === u.update_id; });

      if (pData && pData.impact && (pData.impact.advantages || pData.impact.disadvantages)) {
        html += '<div class="reg-impact-grid">';
        
        if (pData.impact.advantages && pData.impact.advantages.length > 0) {
          html += '<div class="reg-impact-col reg-impact-col--pos">';
          html += '  <div class="reg-impact-col__title"><i data-lucide="check-circle" style="width:14px;height:14px"></i> Regulatory Clearances & Strategic Advantages</div>';
          html += '  <ul class="reg-impact-list">';
          pData.impact.advantages.forEach(function(adv) { html += '<li>' + H.sanitizeHTML(adv) + '</li>'; });
          html += '  </ul>';
          html += '</div>';
        }

        if (pData.impact.disadvantages && pData.impact.disadvantages.length > 0) {
          html += '<div class="reg-impact-col reg-impact-col--neg">';
          html += '  <div class="reg-impact-col__title"><i data-lucide="alert-triangle" style="width:14px;height:14px"></i> Compliance Directives & Risk Obligations</div>';
          html += '  <ul class="reg-impact-list">';
          pData.impact.disadvantages.forEach(function(dis) { html += '<li>' + H.sanitizeHTML(dis) + '</li>'; });
          html += '  </ul>';
          html += '</div>';
        }

        html += '</div>';
      }

      html += '</div>'; // /reg-brief-card

      // 3. Mapped Internal Policies & Remediation Status
      var allPolicies = State.getByPath('policies') || [];
      var mappedPolicyIds = u.existing_internal_policy_refs || [];
      var allDrafts = State.getByPath('policyDrafts') || {};
      var draftsForUpdate = allDrafts[u.update_id] || [];

      if (mappedPolicyIds.length > 0 || draftsForUpdate.length > 0) {
        html += '<div class="reg-policy-card">';
        html += '  <div class="reg-policy-header">';
        html += '    <div class="reg-policy-title"><i data-lucide="shield" style="width:16px;height:16px;color:#f59e0b;"></i> Associated Internal Policies (' + mappedPolicyIds.length + ')</div>';
        html += '    <span style="font-size:12px;color:var(--text-muted);">Cross-referenced with Bank Policy Repository</span>';
        html += '  </div>';

        mappedPolicyIds.forEach(function(polId) {
          var matchedPol = allPolicies.find(function(p) { return p.policy_id === polId; });
          var polTitle = matchedPol ? matchedPol.title : polId;
          var polDept = matchedPol ? matchedPol.department : 'Enterprise';
          var isUnderRev = matchedPol && matchedPol.status === 'under_review';

          html += '<div class="policy-link-item">';
          html += '  <div>';
          html += '    <div style="font-size:13.5px;font-weight:600;color:#f8fafc;display:flex;align-items:center;gap:8px;">';
          html += '      <span>' + H.sanitizeHTML(polTitle) + '</span>';
          if (isUnderRev) {
            html += '    <span class="policy-pill policy-pill--warning" style="padding:2px 7px;font-size:10px;"><span class="status-pulse-dot" style="width:5px;height:5px;"></span> Under Review</span>';
          }
          html += '    </div>';
          html += '    <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">Policy ID: ' + polId + ' • Department: ' + H.sanitizeHTML(polDept) + '</div>';
          html += '  </div>';
          html += '  <button class="btn btn--secondary btn--sm" style="font-size:12px;border-radius:6px;gap:6px;" onclick="window.AppCore.App.navigate(\'policy\'); window.AppCore.Views.policy.selectedId=\'' + polId + '\';">';
          html += '    <i data-lucide="arrow-right" style="width:13px;height:13px"></i> Open Policy';
          html += '  </button>';
          html += '</div>';
        });

        // If drafts exist, show Before vs After
        if (draftsForUpdate.length > 0) {
          html += '<div style="margin-top:16px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.06);">';
          html += '  <div style="font-size:12px;font-weight:700;color:#38bdf8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Proposed Policy Text Redlines</div>';
          draftsForUpdate.forEach(function(draft) {
            html += '<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:12px;margin-bottom:10px;">';
            html += '  <div style="font-size:12.5px;font-weight:600;color:#ffffff;margin-bottom:8px;">' + H.sanitizeHTML(draft.policy_title) + ' — ' + H.sanitizeHTML(draft.section) + '</div>';
            html += '  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
            html += '    <div style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-left:3px solid #ef4444;padding:10px;border-radius:6px;">';
            html += '      <div style="font-size:10px;font-weight:700;color:#f87171;text-transform:uppercase;margin-bottom:4px;">Previous Baseline</div>';
            html += '      <div style="font-size:12px;color:#fca5a5;line-height:1.5;">' + H.sanitizeHTML(draft.original_text || '(No prior clause)') + '</div>';
            html += '    </div>';
            html += '    <div style="background:rgba(16,185,129,0.06);border:1px solid rgba(16,185,129,0.2);border-left:3px solid #10b981;padding:10px;border-radius:6px;">';
            html += '      <div style="font-size:10px;font-weight:700;color:#34d399;text-transform:uppercase;margin-bottom:4px;">Proposed Remediated Text</div>';
            html += '      <div style="font-size:12px;color:#6ee7b7;line-height:1.5;">' + H.sanitizeHTML(draft.proposed_text || '') + '</div>';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
          });
          html += '</div>';
        }

        html += '</div>'; // /reg-policy-card
      }

      // 4. Official Regulatory Text Reader
      var cleanText = (u.extracted_text || '').trim();
      // Clean up common scraping junk like "Home News & Events Press Releases..."
      // The old regex [A-Za-z0-9,\s]+ was too greedy and consumed "For release at 11" before hitting the ":" in "11:00"
      cleanText = cleanText.replace(/^Home\s+News\s+&\s+Events\s+Press\s+Releases\s+Press\s+Release\s+[a-zA-Z]+\s+\d{1,2},\s+\d{4}\s*/i, '');
      if (!cleanText) cleanText = 'Official text pending transmission from regulatory portal.';

      html += '<div class="reg-reader-card">';
      html += '  <div class="reg-reader-header">';
      html += '    <div class="reg-reader-title"><i data-lucide="newspaper" style="width:15px;height:15px;color:#94a3b8;"></i> Official Publication & Gazette Text</div>';
      html += '    <button class="btn btn--ghost btn--sm" style="font-size:12px;gap:5px;border-radius:6px;" onclick="navigator.clipboard.writeText(document.getElementById(\'raw-bulletin-text\').innerText); window.AppCore.App.showToast(\'info\', \'Copied\', \'Regulatory bulletin text copied.\');"><i data-lucide="copy" style="width:12px;height:12px"></i> Copy Text</button>';
      html += '  </div>';
      html += '  <div id="raw-bulletin-text" class="reg-reader-content">' + H.sanitizeHTML(cleanText) + '</div>';
      html += '</div>';

      html += '</div>'; // /feed__detail-body

      // 5. Sticky Footer
      html += '<div class="feed__detail-actions">';
      html += '  <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-muted);">';
      if (isCompleted) {
        html += '    <span style="color:#34d399;font-weight:600;display:inline-flex;align-items:center;gap:6px;"><i data-lucide="check-circle-2" style="width:16px;height:16px;"></i> Ingested & Fully Remediated</span>';
      } else {
        html += '    <span style="color:#fbbf24;font-weight:600;display:inline-flex;align-items:center;gap:6px;"><span class="status-pulse-dot"></span> Ingestion Awaiting Sign-off</span>';
      }
      html += '  </div>';

      if (!isCompleted) {
        html += '  <button class="btn btn--primary" style="gap:6px;border-radius:6px;height:36px;padding:0 18px;font-size:13px;font-weight:600;" onclick="window.AppCore.App.processUpdate(\'' + u.update_id + '\')"><i data-lucide="play" style="width:14px;height:14px"></i> Ingest & Auto-Remediate</button>';
      } else {
        html += '  <button class="btn btn--secondary btn--sm" style="gap:6px;border-radius:6px;font-size:12px;" onclick="window.AppCore.App.processUpdate(\'' + u.update_id + '\')"><i data-lucide="rotate-cw" style="width:13px;height:13px"></i> Re-Analyze</button>';
      }
      html += '</div>';

      return html;
    }
  };

  /* ═══════════════════════════════════════════════════════════
     AGENT TOPOLOGY VIEW
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.topology = {
    selectedAgent: null,
    isSimulating: false,
    agentPositions: null,
    render: function (container) {
      var self = this;
      var agents = (window.APP_DATA && window.APP_DATA.agentDefinitions) || [];

      var html = '<div class="topology animate-slide-up" style="display:flex; gap:24px; height:calc(100vh - 160px);">';
      
      // Graph SVG Container
      html += '<div class="topology__container" id="topology-container" style="flex:1; height:100%; position:relative;">';
      html += '<svg id="topology-svg" class="topology__canvas" style="width:100%; height:100%;"></svg>';

      // Phase labels
      html += '<div class="topology__phase-labels">';
      ['Orchestration', 'Ingress', 'Investigation', 'Decision', 'Egress'].forEach(function (p) {
        html += '<span class="topology__phase-label">' + p + '</span>';
      });
      html += '</div>';

      // Legend
      html += '<div class="topology__legend">';
      html += '<div class="topology__legend-title">Status</div>';
      html += '<div class="topology__legend-items">';
      html += '<div class="topology__legend-item"><div class="topology__legend-dot" style="background:#10b981"></div>Online</div>';
      html += '<div class="topology__legend-item"><div class="topology__legend-dot" style="background:#f59e0b"></div>Degraded</div>';
      html += '<div class="topology__legend-item"><div class="topology__legend-dot" style="background:#ef4444"></div>Offline</div>';
      html += '</div></div>';

      // Detail sidebar
      html += '<div class="topology__detail" id="topology-detail"></div>';
      html += '</div>'; // End graph container

      // Simulation Control Panel
      html += '<div class="glass-panel" id="sim-console" style="width:380px; display:flex; flex-direction:column; padding:24px; gap:20px; border-radius:16px; border:1px solid var(--white-alpha-8); box-shadow: 0 15px 35px var(--black-alpha-30); background:var(--bg-glass); overflow-y:auto; flex-shrink:0;">';
      html += '<div style="display:flex; align-items:center; gap:8px;"><i data-lucide="play-circle" style="width:20px;height:20px;color:var(--accent);"></i><h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-white); letter-spacing:-0.01em;">Pipeline Simulation</h3></div>';
      html += '<div style="font-size:12px; color:var(--text-secondary); line-height:1.5;">Inject test regulations into the compliance pipeline to trigger visual agent packet routing.</div>';
      
      html += '<div>';
      html += '<label style="display:block; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Select Regulation Preset</label>';
      html += '<select class="select" id="sim-preset-select" style="width:100%; background:var(--black-alpha-25); border:1px solid var(--white-alpha-8); color:var(--text-white); padding:8px 12px; border-radius:8px;">';
      html += '<option value="dpdp">DPDP Act (Data Retention Mandate)</option>';
      html += '<option value="cyber">SEC Cyber Incident Report Standard</option>';
      html += '<option value="esg">EU ESG Corporate Disclosure</option>';
      html += '<option value="custom">Custom Injection...</option>';
      html += '</select>';
      html += '</div>';

      // Custom Inputs
      html += '<div id="sim-custom-inputs" style="display:none; flex-direction:column; gap:12px; background:var(--black-alpha-15); padding:16px; border-radius:10px; border:1px solid var(--white-alpha-4);">';
      html += '<div><label style="display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Title</label><input type="text" id="sim-custom-title" class="form-input" style="width:100%; background:var(--white-alpha-5); border:1px solid var(--white-alpha-8);" placeholder="e.g. RBI Lending Guidelines 2026"></div>';
      html += '<div><label style="display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Jurisdiction</label><input type="text" id="sim-custom-jurisdiction" class="form-input" style="width:100%; background:var(--white-alpha-5); border:1px solid var(--white-alpha-8);" placeholder="e.g. APAC"></div>';
      html += '<div><label style="display:block; font-size:9px; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">Summary</label><textarea id="sim-custom-summary" class="form-textarea" style="width:100%; background:var(--white-alpha-5); border:1px solid var(--white-alpha-8);" placeholder="Describe the regulation changes..."></textarea></div>';
      html += '</div>';

      html += '<button class="btn btn--primary" id="sim-run-btn" style="width:100%; justify-content:center; gap:8px;"><i data-lucide="play" style="width:16px;height:16px;"></i> Inject Regulation</button>';
      
      // Progress & Console logs
      html += '<div id="sim-console-run" style="display:none; flex-direction:column; flex:1; gap:12px; margin-top:8px;">';
      html += '<div style="border-top:1px solid var(--white-alpha-6); padding-top:16px;">';
      html += '<div style="display:flex; justify-content:space-between; font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:6px;"><span>Pipeline Progress</span><span id="sim-progress-pct">0%</span></div>';
      html += '<div class="app-loader__bar" style="width:100%; height:6px; margin:0;"><div class="app-loader__fill" id="sim-progress-fill" style="width:0%; animation:none;"></div></div>';
      html += '</div>';
      
      html += '<div style="flex:1; background:var(--black-alpha-50); border:1px solid var(--white-alpha-6); border-radius:10px; padding:16px; font-family:monospace; font-size:11px; color:#34d399; overflow-y:auto; max-height:220px;" id="sim-console-terminal">';
      html += '<div style="color:var(--text-muted);">[SYS] Terminal initialized. Awaiting pipeline injection.</div>';
      html += '</div>';
      html += '</div>'; // End Progress & Console

      html += '</div>'; // End Simulation Console
      html += '</div>'; // End main flex wrapper

      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Draw SVG topology
      setTimeout(function () { self._drawTopology(agents); }, 100);

      // Bind events
      var presetSelect = document.getElementById('sim-preset-select');
      var customInputs = document.getElementById('sim-custom-inputs');
      if (presetSelect && customInputs) {
        presetSelect.addEventListener('change', function() {
          customInputs.style.display = presetSelect.value === 'custom' ? 'flex' : 'none';
        });
      }

      var runBtn = document.getElementById('sim-run-btn');
      if (runBtn) {
        runBtn.addEventListener('click', function() {
          self.runSimulation();
        });
      }
    },
    _drawTopology: function (agents) {
      var svg = document.getElementById('topology-svg');
      if (!svg) return;
      var rect = svg.parentElement.getBoundingClientRect();
      var W = rect.width, H_val = rect.height;
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H_val);
      svg.innerHTML = '';

      // Position agents in phases
      var positions = {
        orchestrator: { x: W * 0.5, y: 60 },
        ingestion: { x: W * 0.2, y: 180 },
        parser: { x: W * 0.2, y: 300 },
        classifier: { x: W * 0.4, y: 400 },
        retriever: { x: W * 0.6, y: 400 },
        impact: { x: W * 0.5, y: 520 },
        decision: { x: W * 0.3, y: 640 },
        drafter: { x: W * 0.5, y: 640 },
        risk: { x: W * 0.7, y: 640 },
        escalation: { x: W * 0.9, y: 640 },
        audit: { x: W * 0.3, y: 760 },
        notification: { x: W * 0.6, y: 760 }
      };
      this.agentPositions = positions;

      // Draw connections
      var connections = [
        ['orchestrator', 'ingestion'], ['ingestion', 'parser'], ['parser', 'classifier'],
        ['orchestrator', 'retriever'], ['classifier', 'impact'], ['retriever', 'impact'],
        ['impact', 'decision'], ['decision', 'drafter'], ['drafter', 'risk'], ['decision', 'risk'], ['risk', 'escalation'],
        ['orchestrator', 'audit'], ['decision', 'notification'], ['escalation', 'notification']
      ];

      var self = this;
      connections.forEach(function (c) {
        var from = positions[c[0]], to = positions[c[1]];
        if (!from || !to) return;
        var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', from.x); line.setAttribute('y1', from.y);
        line.setAttribute('x2', to.x); line.setAttribute('y2', to.y);
        line.setAttribute('stroke', 'var(--white-alpha-10)');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        line.classList.add('topology__flow-line');
        svg.appendChild(line);
      });

      // Draw agent nodes
      agents.forEach(function (a) {
        var pos = positions[a.id];
        if (!pos) return;
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('agent-node');
        g.setAttribute('id', 'node-' + a.id);
        g.style.cursor = 'pointer';

        // Glow
        var glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        glow.setAttribute('cx', pos.x); glow.setAttribute('cy', pos.y); glow.setAttribute('r', '35');
        glow.setAttribute('fill', a.color || '#E60000'); glow.setAttribute('opacity', '0.15');
        glow.setAttribute('filter', 'url(#blur)');
        g.appendChild(glow);

        // Circle
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', '28');
        circle.setAttribute('fill', 'rgba(17,24,39,0.9)');
        circle.setAttribute('stroke', a.color || '#E60000'); circle.setAttribute('stroke-width', '2');
        circle.classList.add('agent-node__circle');
        g.appendChild(circle);

        // Status dot
        var statusColors = { online: '#10b981', degraded: '#f59e0b', offline: '#ef4444' };
        var sd = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        sd.setAttribute('cx', pos.x + 20); sd.setAttribute('cy', pos.y - 20); sd.setAttribute('r', '5');
        sd.setAttribute('fill', statusColors[a.status] || '#10b981');
        g.appendChild(sd);

        // Icon text
        var icon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        icon.setAttribute('x', pos.x); icon.setAttribute('y', pos.y + 6);
        icon.setAttribute('text-anchor', 'middle'); icon.setAttribute('font-size', '20');
        icon.textContent = a.icon;
        g.appendChild(icon);

        // Label
        var label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 50);
        label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', 'var(--text-muted)');
        label.setAttribute('font-size', '11'); label.setAttribute('font-weight', '500');
        label.textContent = a.short_name;
        g.appendChild(label);

        g.addEventListener('click', function () { self._showDetail(a); });
        svg.appendChild(g);
      });

      // SVG filter for glow
      var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.innerHTML = '<filter id="blur"><feGaussianBlur stdDeviation="8"/></filter>';
      svg.insertBefore(defs, svg.firstChild);
    },
    _showDetail: function (agent) {
      var panel = document.getElementById('topology-detail');
      if (!panel) return;
      panel.classList.add('open');

      var html = '<div class="topology__detail-header">';
      html += '<div><span style="font-size:24px;margin-right:8px">' + agent.icon + '</span><span style="font-size:18px;font-weight:700">' + agent.name + '</span></div>';
      html += '<button class="btn btn--ghost btn--icon" onclick="document.getElementById(\'topology-detail\').classList.remove(\'open\')">✕</button>';
      html += '</div>';

      html += '<div class="topology__detail-body">';
      html += '<div class="topology__detail-section"><div class="topology__detail-label">Purpose</div><div class="topology__detail-value">' + agent.purpose + '</div></div>';
      html += '<div class="topology__detail-section"><div class="topology__detail-label">Authority</div><div class="topology__detail-value">' + agent.authority + '</div></div>';
      html += '<div class="topology__detail-section"><div class="topology__detail-label">Phase</div><div class="topology__detail-value"><span class="badge badge--accent">' + agent.phase + '</span></div></div>';

      html += '<div class="topology__detail-section"><div class="topology__detail-label">Metrics</div>';
      html += '<div class="topology__detail-metrics">';
      html += '<div class="topology__metric"><div class="topology__metric-value">' + agent.metrics.processed_today + '</div><div class="topology__metric-label">Processed Today</div></div>';
      html += '<div class="topology__metric"><div class="topology__metric-value">' + agent.metrics.avg_latency_ms + 'ms</div><div class="topology__metric-label">Avg Latency</div></div>';
      html += '<div class="topology__metric"><div class="topology__metric-value">' + (agent.metrics.success_rate * 100).toFixed(1) + '%</div><div class="topology__metric-label">Success Rate</div></div>';
      html += '<div class="topology__metric"><div class="topology__metric-value">' + (agent.metrics.error_rate * 100).toFixed(2) + '%</div><div class="topology__metric-label">Error Rate</div></div>';
      html += '</div></div>';

      html += '<div class="topology__detail-section"><div class="topology__detail-label">Inputs</div>';
      agent.inputs.forEach(function (i) { html += '<div class="tag" style="margin:2px">' + i + '</div>'; });
      html += '</div>';

      html += '<div class="topology__detail-section"><div class="topology__detail-label">Outputs</div>';
      agent.outputs.forEach(function (o) { html += '<div class="tag tag--accent" style="margin:2px">' + o + '</div>'; });
      html += '</div>';
      html += '</div>';

      panel.innerHTML = html;
    },
    runSimulation: function() {
      if (this.isSimulating) return;
      var self = this;
      var preset = document.getElementById('sim-preset-select').value;
      var title = '', summary = '', jurisdiction = '', tags = [];
      
      if (preset === 'dpdp') {
        title = 'DPDP Audit Mandate (Digital Personal Data Protection)';
        jurisdiction = 'APAC';
        summary = 'Immediate compliance mandate requiring granular data processing consent and a 3-day data retention auditing report.';
        tags = ['Data Privacy', 'Auditing', 'DPDP'];
      } else if (preset === 'cyber') {
        title = 'SEC Cybersecurity Incident Disclosure Directive';
        jurisdiction = 'North America';
        summary = 'New directive demanding a 6-hour cybersecurity reporting cycle for unauthorized access to core financial ledger systems.';
        tags = ['Cybersecurity', 'Incident Report', 'SEC'];
      } else if (preset === 'esg') {
        title = 'EU Corporate Sustainability Reporting Directive (CSRD)';
        jurisdiction = 'EU';
        summary = 'Mandatory carbon accounting disclosure metrics required inside annual filings starting Q3.';
        tags = ['ESG', 'Disclosure', 'EU'];
      } else {
        title = document.getElementById('sim-custom-title').value.trim() || 'Custom Sandbox Regulation';
        jurisdiction = document.getElementById('sim-custom-jurisdiction').value.trim() || 'Global';
        summary = document.getElementById('sim-custom-summary').value.trim() || 'Custom simulated regulatory requirements.';
        tags = ['Custom', 'Sandbox'];
      }

      this.isSimulating = true;
      var runBtn = document.getElementById('sim-run-btn');
      if (runBtn) {
        runBtn.disabled = true;
        runBtn.innerHTML = '<span class="login-card__spinner" style="margin-right:8px; display:inline-block; border-color:var(--text-white); border-right-color:transparent;"></span> Simulating Ingestion...';
      }
      
      var consoleRun = document.getElementById('sim-console-run');
      if (consoleRun) consoleRun.style.display = 'flex';
      
      var terminal = document.getElementById('sim-console-terminal');
      if (terminal) terminal.innerHTML = '<div style="color:var(--text-muted);">[SYS] Pipeline injection sequence initiated.</div>';
      
      var progressFill = document.getElementById('sim-progress-fill');
      var progressPct = document.getElementById('sim-progress-pct');
      
      function updateProgress(pct) {
        if (progressFill) progressFill.style.width = pct + '%';
        if (progressPct) progressPct.textContent = pct + '%';
      }

      function logTerminal(msg, color) {
        if (!terminal) return;
        var style = color ? ' style="color:' + color + ';"' : '';
        var time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
        terminal.innerHTML += '<div' + style + '>[' + time + '] ' + msg + '</div>';
        terminal.scrollTop = terminal.scrollHeight;
      }

      function highlightNode(nodeId) {
        var node = document.getElementById('node-' + nodeId);
        if (node) {
          node.style.filter = 'brightness(1.5)';
          setTimeout(function() { node.style.filter = 'none'; }, 800);
        }
      }

      var svg = document.getElementById('topology-svg');
      function animateDot(fromNode, toNode, duration, callback) {
        var from = self.agentPositions[fromNode];
        var to = self.agentPositions[toNode];
        if (!from || !to || !svg) {
          if (callback) callback();
          return;
        }
        var start = performance.now();
        var dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('r', '6');
        dot.setAttribute('fill', 'var(--accent)');
        dot.setAttribute('filter', 'url(#blur)');
        svg.appendChild(dot);

        function tick(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var x = from.x + (to.x - from.x) * progress;
          var y = from.y + (to.y - from.y) * progress;
          dot.setAttribute('cx', x);
          dot.setAttribute('cy', y);
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            dot.remove();
            if (callback) callback();
          }
        }
        requestAnimationFrame(tick);
      }

      // Start pipeline steps
      logTerminal('INGRESS: Establishing pipeline connection to Webhook...', 'var(--info)');
      updateProgress(5);
      
      setTimeout(function() {
        logTerminal('INGRESS: Simulated payload received. Alert ID: RU-MOCK-' + Math.floor(1000 + Math.random()*9000));
        updateProgress(15);
        highlightNode('orchestrator');
        
        animateDot('orchestrator', 'ingestion', 800, function() {
          logTerminal('INGESTION: Ingesting text blocks and mapping schemas...');
          updateProgress(25);
          highlightNode('ingestion');
          
          animateDot('ingestion', 'parser', 800, function() {
            logTerminal('PARSER: Chunking raw text and generating vector database embeddings...');
            updateProgress(35);
            highlightNode('parser');
            
            animateDot('parser', 'classifier', 800, function() {
              logTerminal('CLASSIFIER: Document classified. Jurisdiction: ' + jurisdiction + ' | Tags: ' + tags.join(', '));
              updateProgress(45);
              highlightNode('classifier');
              
              animateDot('classifier', 'impact', 800, function() {
                logTerminal('IMPACT ANALYZER: Executing semantic search against Policy Repository...');
                highlightNode('impact');
                
                animateDot('retriever', 'impact', 800, function() {
                  logTerminal('RETRIEVER: Retrieved matching internal policy templates.');
                  logTerminal('IMPACT ANALYZER: Comparing clauses. Potential compliance gaps detected.', 'var(--warning)');
                  updateProgress(65);
                  highlightNode('retriever');
                  
                  animateDot('impact', 'decision', 800, function() {
                    logTerminal('DECISION ENGINE: Action computed: Escalating for review & drafting clause updates.', 'var(--warning)');
                    updateProgress(75);
                    highlightNode('decision');
                    
                    animateDot('decision', 'drafter', 800, function() {
                      logTerminal('DRAFTER: Auto-generating compliant policy patches using Lex AI model...');
                      highlightNode('drafter');
                      
                      animateDot('drafter', 'risk', 800, function() {
                        logTerminal('RISK ANALYZER: Evaluating generated drafts for organizational impact. Score: 0.12 (Low Risk).');
                        updateProgress(90);
                        highlightNode('risk');
                        
                        animateDot('risk', 'escalation', 800, function() {
                          logTerminal('ESCALATION: Manual compliance authorization record created.', 'var(--warning)');
                          highlightNode('escalation');
                          
                          animateDot('orchestrator', 'audit', 800, function() {
                            logTerminal('AUDIT TRAIL: Ingestion run logged successfully to immutable trace block.');
                            highlightNode('audit');
                            
                            animateDot('decision', 'notification', 800, function() {
                              // Trigger real update entry in app
                              var State = window.AppCore.StateManager;
                              var updates = State.getByPath('regulatoryUpdates') || [];
                              var newId = 'RU-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
                              var mockUpdate = {
                                update_id: newId,
                                source: 'Simulation Console',
                                publication_date: new Date().toISOString().split('T')[0],
                                jurisdiction: jurisdiction,
                                document_title: title,
                                summary: summary,
                                status: 'pending',
                                tags: tags
                              };
                              
                              updates.unshift(mockUpdate);
                              State.setState('regulatoryUpdates', updates);
                              
                              // Trigger real escalation if applicable
                              var escQueue = State.getByPath('escalationQueue') || [];
                              var newEscId = 'ESC-' + Math.floor(10000 + Math.random() * 90000);
                              var mockEsc = {
                                escalation_id: newEscId,
                                update_id: newId,
                                title: 'Manual Audit: ' + title,
                                source: 'Simulation Sandbox',
                                status: 'pending',
                                assigned_reviewer: 'Compliance Officer',
                                sla_deadline: new Date(Date.now() + 36 * 3600000).toISOString(),
                                description: 'Simulated compliance conflict. Verify policy changes.'
                              };
                              escQueue.unshift(mockEsc);
                              State.setState('escalationQueue', escQueue);

                              logTerminal('EGRESS: Ingestion sequence finalized.', 'var(--success)');
                              updateProgress(100);
                              highlightNode('notification');
                              
                              // Reset buttons
                              self.isSimulating = false;
                              if (runBtn) {
                                runBtn.disabled = false;
                                runBtn.innerHTML = '<i data-lucide="play" style="width:16px;height:16px;"></i> Inject Regulation';
                                if (window.lucide) window.lucide.createIcons();
                              }
                              window.AppCore.App.showToast('success', 'Simulation Finished', 'Mock update generated and loaded in feed!');
                            });
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      }, 1000);
    }
  };

  /* ═══════════════════════════════════════════════════════════
     AI COPILOT VIEW
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.copilot = {
    render: function (container) {
      var self = this;
      var html = '<div class="copilot-page view-enter stagger-1" style="height:calc(100vh - 140px); display:flex; gap:24px; padding:24px 32px;">';
      
      // LEFT SIDEBAR — Uses the app's CSS variable palette for consistency
      html += '<div id="copilot-sidebar" style="width:280px; flex-shrink:0; display:flex; flex-direction:column; gap:24px; background:var(--bg-glass); border-radius:var(--radius-lg); padding:24px; border:1px solid var(--border); box-shadow:var(--shadow-lg); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); z-index:10; transition:all 0.3s;">';
      
      // Logo & Title
      html += '<div style="display:flex; align-items:center; justify-content:space-between;">';
      html += '<div style="display:flex; align-items:center; gap:12px;">';
      html += '<div style="width:38px;height:38px;border-radius:var(--radius-md);background:var(--bg-glass-hover);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-sm);"><i data-lucide="bot" style="color:var(--text-primary);width:20px;height:20px;"></i></div>';
      html += '<span style="font-weight:800; font-size:18px; color:var(--text-primary); letter-spacing:-0.02em;">LEX AI</span>';
      html += '</div>';
      html += '<button id="copilot-sidebar-toggle" title="Collapse Menu" style="background:var(--bg-glass); border:1px solid var(--border); border-radius:var(--radius-sm); width:34px; height:34px; display:flex; align-items:center; justify-content:center; color:var(--text-muted); cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'var(--bg-glass-hover)\'; this.style.color=\'var(--text-primary)\'" onmouseout="this.style.background=\'var(--bg-glass)\'; this.style.color=\'var(--text-muted)\'"><i data-lucide="panel-left-close" style="width:16px;height:16px;"></i></button>';
      html += '</div>';
      
      // New Chat Button
      html += '<button id="copilot-page-new-chat" style="background:var(--bg-glass); border:1px solid var(--border); padding:13px 16px; border-radius:var(--radius-md); color:var(--text-primary); font-size:14px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:10px; cursor:pointer; box-shadow:var(--shadow-sm); transition:all 0.2s;" onmouseover="this.style.background=\'var(--bg-glass-hover)\'; this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.background=\'var(--bg-glass)\'; this.style.transform=\'translateY(0)\'">';
      html += '<i data-lucide="plus" style="width:18px;height:18px;"></i> New Chat';
      html += '</button>';
      
      // Recent Chats Section
      html += '<div style="flex:1; display:flex; flex-direction:column; overflow:hidden;">';
      html += '<div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:1.2px; padding:0 4px 12px 4px; border-bottom:1px solid var(--border); margin-bottom:8px;">Recent Chats</div>';
      html += '<div id="copilot-past-chats" class="scroll-area" style="display:flex; flex-direction:column; gap:4px; flex:1; overflow-y:auto; padding-bottom:20px; padding-right:4px;">';
      // Chats injected by renderPastChats()
      html += '</div>';
      html += '</div>';
      
      html += '</div>'; // End Sidebar
      
      // MAIN CHAT AREA
      html += '<div class="glass-panel" style="flex:1; display:flex; flex-direction:column; border-radius:24px; overflow:hidden; border:1px solid rgba(255,255,255,0.08); box-shadow:0 12px 40px rgba(0,0,0,0.5); position:relative; background: var(--bg-glass); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px);">';
      
      // Header
      html += '<div style="padding:16px 28px; display:flex; align-items:center; justify-content:space-between; z-index:10;">';
      
      // Left Group (Expand only)
      html += '<div style="display:flex; align-items:center; gap:12px;">';
      html += '<button id="copilot-page-expand" title="Open Sidebar" style="display:none; background:transparent; border:1px solid var(--white-alpha-8); color:var(--text-muted); cursor:pointer; width:36px; height:36px; border-radius:10px; align-items:center; justify-content:center; transition:all 0.2s; box-shadow:var(--shadow-sm);" onmouseover="this.style.background=\'var(--white-alpha-10)\';this.style.color=\'white\'" onmouseout="this.style.background=\'transparent\';this.style.color=\'var(--text-muted)\'"><i data-lucide="menu" style="width:18px;height:18px;"></i></button>';
      html += '<span id="copilot-header-title" style="display:none; font-weight:800; font-size:20px; background:linear-gradient(90deg, #f43f5e, #fb7185); -webkit-background-clip:text; -webkit-text-fill-color:transparent; letter-spacing:-0.02em; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2)); margin-left:4px;">LEX AI</span>';
      html += '</div>';
      
      // Empty right side
      html += '<div></div>';
      
      html += '</div>';
      
      // Message History Area
      html += '<div id="copilot-page-messages" class="scroll-area" style="flex:1; padding:20px 40px 160px 40px; display:flex; flex-direction:column; overflow-y:auto; align-items:center;">';
      
      // Empty State (Dribbble style)
      var userNameEl = document.getElementById('dropdown-user-name');
      var userName = userNameEl ? userNameEl.innerText : 'Admin User';
      var firstName = userName.split(' ')[0];
      html += '<div id="copilot-empty-state" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; width:100%; position:relative;">';
      html += '<div style="position:absolute; width:600px; height:600px; background:radial-gradient(circle, rgba(225,29,72,0.1) 0%, transparent 70%); top:50%; left:50%; transform:translate(-50%, -50%); border-radius:50%; pointer-events:none; z-index:0;"></div>';
      html += '<h1 style="font-size:42px; font-weight:800; background:linear-gradient(90deg, #f43f5e, #fb7185, #fda4af); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:12px; z-index:1; text-align:center;">Hello, ' + firstName + '</h1>';
      html += '<h2 style="font-size:28px; font-weight:400; color:var(--text-secondary); margin-top:0; margin-bottom:48px; z-index:1; text-align:center;">How can I help you today?</h2>';
      
      // 3 Cards Layout
      html += '<div id="copilot-page-suggestions" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; width:100%; max-width:700px;">';
      var suggCards = [
        { title: "What's Happen in 24 hours?", desc: "See what's been happening in the regulatory world over the last 24 hours", icon: "activity", color: "#e11d48" },
        { title: "Policy alignment check", desc: "See what's happening with internal policies vs new SEC rules", icon: "bar-chart-2", color: "#f59e0b" },
        { title: "Deep compliance research", desc: "See research from experts that we have simplified", icon: "book-open", color: "#0ea5e9" }
      ];
      suggCards.forEach(function(s) {
        html += '<div class="copilot-page-suggestion" style="background:var(--bg-glass); border:1px solid var(--border); padding:20px; border-radius:var(--radius-lg); cursor:pointer; transition:all 0.2s ease; position:relative; overflow:hidden;" onmouseover="this.style.background=\'var(--bg-glass-hover)\'; this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.background=\'var(--bg-glass)\'; this.style.transform=\'translateY(0)\'" onclick="window.AppCore.Views.copilot.handleSuggestion(\'' + s.title.replace(/'/g, "\\'") + '\')">';
        html += '<div style="position:absolute; top:0; left:0; right:0; height:40%; background:linear-gradient(180deg, ' + s.color + '33 0%, transparent 100%); opacity:0.5;"></div>';
        html += '<div style="width:28px; height:28px; background:' + s.color + '44; border-radius:8px; display:flex; align-items:center; justify-content:center; margin-bottom:12px; position:relative; z-index:1;"><i data-lucide="' + s.icon + '" style="width:16px;height:16px;color:' + s.color + ';"></i></div>';
        html += '<div style="font-size:13px; font-weight:700; color:var(--text-primary); margin-bottom:6px; position:relative; z-index:1;">' + s.title + '</div>';
        html += '<div style="font-size:11px; color:var(--text-muted); line-height:1.5; position:relative; z-index:1;">' + s.desc + '</div>';
        html += '</div>';
      });
      html += '</div>';
      
      html += '</div>'; // End Empty State
      html += '</div>'; // End Messages Area
      
      // Typing indicator overlay
      html += '<div id="copilot-page-typing" style="display:none; position:absolute; bottom:120px; left:50%; transform:translateX(-50%); background:var(--black-alpha-90); backdrop-filter:blur(10px); border:1px solid var(--white-alpha-10); padding:10px 20px; border-radius:30px; font-size:13px; color:var(--text-white); align-items:center; gap:10px; box-shadow:0 10px 25px var(--black-alpha-50); z-index:20;">';
      html += '<div class="typing-indicator" style="display:flex; gap:4px;"><span style="width:6px;height:6px;background:var(--accent);border-radius:50%;animation:bounce 1.4s infinite ease-in-out both;"></span><span style="width:6px;height:6px;background:var(--accent);border-radius:50%;animation:bounce 1.4s infinite ease-in-out both;animation-delay:0.2s;"></span><span style="width:6px;height:6px;background:var(--accent);border-radius:50%;animation:bounce 1.4s infinite ease-in-out both;animation-delay:0.4s;"></span></div>';
      html += '<span style="font-weight:600;">Lex is thinking...</span></div>';
      
      // Bottom Input Area
      html += '<div style="position:absolute; bottom:0; left:0; right:0; padding:40px 40px 30px 40px; display:flex; flex-direction:column; align-items:center; background:linear-gradient(0deg, var(--bg-body) 50%, transparent); pointer-events:none;">';
      
      html += '<form id="copilot-page-form" style="width:100%; max-width:850px; display:flex; align-items:center; background:var(--bg-glass); border:1px solid var(--border); padding:10px 16px; border-radius:32px; box-shadow:0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); pointer-events:auto;" onmouseover="this.style.background=\'var(--bg-glass-hover)\'; this.style.borderColor=\'var(--border)\'; this.style.transform=\'translateY(-2px)\';" onmouseout="this.style.background=\'var(--bg-glass)\'; this.style.borderColor=\'var(--border)\'; this.style.transform=\'translateY(0)\';">';
      // Optional mic icon
      html += '<button type="button" id="copilot-page-mic-btn" style="background:var(--white-alpha-3); border:1px solid transparent; width:44px; height:44px; border-radius:16px; color:var(--text-secondary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.background=\'var(--white-alpha-8)\'; this.style.color=\'var(--text-white)\'" onmouseout="this.style.background=\'var(--white-alpha-3)\'; this.style.color=\'var(--text-secondary)\'"><i data-lucide="mic" style="width:20px;height:20px;"></i></button>';
      html += '<input type="text" id="copilot-page-input" placeholder="Message Lex AI..." style="flex:1; background:transparent; border:none; font-size:15px; color:var(--text-primary); outline:none; padding:0 20px; font-weight:500;">';
      
      // Additional actions (Attachment, etc)
      html += '<button type="button" id="copilot-page-attach-btn" style="background:transparent; border:none; width:44px; height:44px; border-radius:16px; color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s;" onmouseover="this.style.color=\'var(--text-white)\'" onmouseout="this.style.color=\'var(--text-muted)\'"><i data-lucide="paperclip" style="width:20px;height:20px;"></i></button>';
      
      html += '<button type="submit" style="background:var(--white-alpha-8); border:1px solid rgba(255,255,255,0.1); width:48px; height:48px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:var(--shadow-sm);" onmouseover="this.style.background=\'var(--white-alpha-10)\'; this.style.transform=\'scale(1.05)\'; this.style.boxShadow=\'var(--shadow-md)\'" onmouseout="this.style.background=\'var(--white-alpha-8)\'; this.style.transform=\'scale(1)\'; this.style.boxShadow=\'var(--shadow-sm)\'"><i data-lucide="send" style="width:18px;height:18px;color:var(--text-primary); margin-left:2px; margin-top:2px;"></i></button>';
      html += '</form>';
      html += '<div style="font-size:11px; color:var(--text-muted); margin-top:16px; opacity:0.6; font-weight:500;">Lex AI can make mistakes. Consider verifying important information.</div>';
      
      html += '</div>'; // End Bottom Area
      
      html += '</div>'; // End Main Chat Area
      html += '</div>'; // end copilot page container
      
      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
      
      this.renderPastChats();
      this.renderMessages();
      this.bindEvents();
    },
    
    renderMessages: function() {
      var msgsContainer = document.getElementById('copilot-page-messages');
      if (!msgsContainer) return;
      msgsContainer.innerHTML = '';
      
      var messages = (window.AppCore.Copilot && window.AppCore.Copilot.messages) ? window.AppCore.Copilot.messages : [];
      
      var emptyState = document.getElementById('copilot-empty-state');
      if (messages.length > 0) {
        if (emptyState) emptyState.style.display = 'none';
      } else {
        if (emptyState) emptyState.style.display = 'flex';
      }
      
      messages.forEach(function(msg) {
        var isBot = msg.role === 'bot';
        var align = isBot ? 'flex-start' : 'flex-end';
        var label = isBot ? 'Lex AI' : 'You';
        
        // Premium bubbles style
        var color = isBot ? 'var(--bg-glass)' : 'linear-gradient(135deg, #e11d48, #be123c)';
        var border = isBot ? 'var(--border)' : 'transparent';
        var backdrop = isBot ? 'backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px);' : '';
        var borderRadius = isBot ? '20px 20px 20px 4px' : '20px 20px 4px 20px';
        var textColor = isBot ? 'var(--text-primary)' : '#ffffff';
        
        const msgDate = new Date(msg.timestamp);
        const now = new Date();
        const isToday = msgDate.getDate() === now.getDate() && msgDate.getMonth() === now.getMonth() && msgDate.getFullYear() === now.getFullYear();
        const dateOptions = { month: 'short', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit' };
        const timeStr = isToday ? msgDate.toLocaleTimeString([], timeOptions) : msgDate.toLocaleDateString([], dateOptions) + ', ' + msgDate.toLocaleTimeString([], timeOptions);
        
        let copyBtn = '';
        if (isBot) {
          const safeText = msg.text.replace(/"/g, '&quot;');
          copyBtn = '<span style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; margin-left:12px; padding:4px 8px; border-radius:6px; background:var(--white-alpha-5); border:1px solid var(--white-alpha-5); opacity:0; transition:all 0.2s; font-size:10px; font-weight:600;" onmouseover="this.style.background=\'var(--white-alpha-10)\'" onmouseout="this.style.background=\'var(--white-alpha-5)\'" class="msg-copy-btn" onclick="navigator.clipboard.writeText(this.dataset.text); const self=this; const old=self.innerHTML; self.innerHTML=\'<i data-lucide=\\\'check\\\' style=\\\'width:12px;height:12px;color:var(--success);\\\'></i> Copied!\'; if(window.lucide) window.lucide.createIcons(); setTimeout(()=>self.innerHTML=old, 2000);" data-text="' + safeText + '"><i data-lucide="copy" style="width:12px;height:12px;"></i> Copy</span>';
        }
        
        // Normalize text: undo any pre-converted <br> back to \n for consistent parsing
        var rawText = msg.text.replace(/<br\s*\/?>/gi, '\n').replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
        
        // Markdown Parsing (line-by-line for headings and bullets)
        var parsedLines = rawText.split('\n').map(function(line) {
          // Heading ### 
          if (/^###\s+(.*)/.test(line)) {
            return line.replace(/^###\s+(.*)/, '<div style="font-size:16px; font-weight:800; margin:16px 0 8px 0; color:var(--text-primary);">$1</div>');
          }
          // Bullet point * or - 
          if (/^[\*\-]\s+(.*)/.test(line)) {
            return line.replace(/^[\*\-]\s+(.*)/, '<div style="margin-left:12px; margin-bottom:6px; display:flex; gap:8px; align-items:flex-start;"><span style="color:var(--accent); font-weight:bold;">•</span><span>$1</span></div>');
          }
          // Empty line = spacing
          if (line.trim() === '') {
            return '<div style="height:8px;"></div>';
          }
          return line;
        });
        var parsedText = parsedLines.join('\n')
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text-primary);">$1</strong>')
          .replace(/\n/g, '<br>');
        
        var msgHtml = '<div style="display:flex; flex-direction:column; align-items:' + align + '; width:100%; max-width:850px; margin-bottom:24px; position:relative;" onmouseover="var cb = this.querySelector(\'.msg-copy-btn\'); if(cb) cb.style.opacity=1;" onmouseout="var cb = this.querySelector(\'.msg-copy-btn\'); if(cb) cb.style.opacity=0;">';
        
        msgHtml += '<div style="display:flex; align-items:flex-end; gap:12px; width:100%; flex-direction:' + (isBot ? 'row' : 'row-reverse') + ';">';
        
        // Avatar
        if (isBot) {
          msgHtml += '<div style="width:32px; height:32px; flex-shrink:0; border-radius:10px; background:linear-gradient(135deg, rgba(168,85,247,0.2), rgba(99,102,241,0.2)); border:1px solid rgba(168,85,247,0.3); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i data-lucide="bot" style="width:16px;height:16px;color:#d8b4fe;"></i></div>';
        } else {
          msgHtml += '<div style="width:32px; height:32px; flex-shrink:0; border-radius:10px; background:linear-gradient(135deg, rgba(225,29,72,0.2), rgba(159,18,57,0.2)); border:1px solid rgba(225,29,72,0.3); display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(0,0,0,0.2);"><i data-lucide="user" style="width:16px;height:16px;color:var(--accent);"></i></div>';
        }

        // Bubble
        msgHtml += '<div style="background:' + color + '; border:1px solid ' + border + '; ' + backdrop + ' padding:18px 24px; border-radius:' + borderRadius + '; font-size:15px; line-height:1.7; color:' + textColor + '; box-shadow:0 4px 15px rgba(0,0,0,0.1);">' + parsedText + '</div>';
        
        msgHtml += '</div>';
        
        // Time & Actions
        msgHtml += '<div style="font-size:11px; color:var(--text-muted); margin-top:8px; display:flex; align-items:center; margin-' + (isBot ? 'left' : 'right') + ':44px; font-weight:600; letter-spacing:0.5px;">' + timeStr + ' ' + copyBtn + '</div>';
        
        msgHtml += '</div>';
        msgsContainer.innerHTML += msgHtml;
      });
      
      msgsContainer.scrollTop = msgsContainer.scrollHeight;
      if (window.lucide) window.lucide.createIcons();
    },
    
    // ── Render past conversation list in the sidebar ──
    renderPastChats: function() {
      var listContainer = document.getElementById('copilot-past-chats');
      if (!listContainer) return;
      
      var sessions = JSON.parse(localStorage.getItem('lex_ai_sessions') || '[]');
      var activeId = localStorage.getItem('lex_ai_active_session') || '';
      
      sessions.sort(function(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      
      var html = '';
      
      if (sessions.length === 0) {
        html += '<div style="text-align:center; padding:30px 10px; color:var(--text-muted); font-size:12px;">';
        html += '<i data-lucide="inbox" style="width:28px;height:28px;margin:0 auto 10px;display:block;opacity:0.5;color:var(--text-muted);"></i>';
        html += 'No conversations yet.<br><span style="color:var(--text-secondary);">Start chatting with Lex!</span></div>';
      } else {
        var grouped = {};
        sessions.forEach(function(s) {
          var d = new Date(s.createdAt);
          var now = new Date();
          var label;
          if (d.toDateString() === now.toDateString()) {
            label = 'Today';
          } else {
            var yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
            if (d.toDateString() === yesterday.toDateString()) {
              label = 'Yesterday';
            } else {
              label = d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            }
          }
          if (!grouped[label]) grouped[label] = [];
          grouped[label].push(s);
        });
        
        var isFirstGroup = true;
        Object.keys(grouped).forEach(function(dateLabel) {
          html += '<div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:var(--text-muted); padding:10px 8px 6px; margin-top:' + (isFirstGroup ? '0' : '8px') + '; ' + (isFirstGroup ? '' : 'border-top:1px solid var(--border);') + '">' + dateLabel + '</div>';
          isFirstGroup = false;
          grouped[dateLabel].forEach(function(session) {
            var isActive = session.id === activeId;
            var preview = session.preview || 'New conversation';
            preview = preview.charAt(0).toUpperCase() + preview.slice(1);
            if (preview.length > 30) preview = preview.substring(0, 30) + '...';
            var timeStr = new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            var bgColor = isActive ? 'var(--bg-glass-hover)' : 'transparent';
            var borderColor = isActive ? 'var(--accent)' : 'transparent';
            var textColor = isActive ? 'var(--text-primary)' : 'var(--text-secondary)';
            
            html += '<div class="past-chat-item" data-session-id="' + session.id + '" style="padding:10px 12px; border-radius:var(--radius-sm); cursor:pointer; background:' + bgColor + '; border:1px solid ' + borderColor + '; transition:all 0.2s; display:flex; flex-direction:column; gap:4px;" onmouseover="this.style.background=\'var(--bg-glass-hover)\'" onmouseout="this.style.background=\'' + (isActive ? 'var(--bg-glass-hover)' : 'transparent') + '\'">';
            html += '<div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">';
            html += '<span style="font-size:13px; font-weight:' + (isActive ? '600' : '400') + '; color:' + textColor + '; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1;">' + preview + '</span>';
            html += '<button class="past-chat-delete" data-session-id="' + session.id + '" title="Delete" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; padding:4px; transition:all 0.2s; flex-shrink:0;" onmouseover="this.style.color=\'var(--danger)\'" onmouseout="this.style.color=\'var(--text-muted)\'"><i data-lucide="trash-2" style="width:13px;height:13px;"></i></button>';
            html += '</div>';
            html += '<span style="font-size:10px; color:var(--text-muted); font-weight:500;">' + timeStr + ' · ' + session.messageCount + ' msgs</span>';
            html += '</div>';
          });
        });
      }
      
      listContainer.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    },
    
    bindEvents: function() {
      var self = this;
      var form = document.getElementById('copilot-page-form');
      var input = document.getElementById('copilot-page-input');
      
      // ── Sidebar Toggle ──
      var toggleBtn = document.getElementById('copilot-sidebar-toggle');
      var expandBtn = document.getElementById('copilot-page-expand');
      var sidebar = document.getElementById('copilot-sidebar');
      var isCollapsed = false;
      
      var collapseSidebar = function() {
        if (sidebar && expandBtn) {
          isCollapsed = true;
          sidebar.style.width = '0px';
          sidebar.style.minWidth = '0px';
          sidebar.style.opacity = '0';
          sidebar.style.marginLeft = '-16px'; // Pull it completely out of the flex gap
          sidebar.style.pointerEvents = 'none'; // Prevent clicking invisible elements
          
          expandBtn.style.display = 'flex';
          var titleEl = document.getElementById('copilot-header-title');
          if (titleEl) titleEl.style.display = 'block';
          if (window.lucide) window.lucide.createIcons();
        }
      };
      
      var expandSidebar = function() {
        if (sidebar && expandBtn) {
          isCollapsed = false;
          sidebar.style.width = '260px';
          sidebar.style.minWidth = '';
          sidebar.style.opacity = '1';
          sidebar.style.marginLeft = '0';
          sidebar.style.pointerEvents = 'auto';
          
          expandBtn.style.display = 'none';
          var titleEl = document.getElementById('copilot-header-title');
          if (titleEl) titleEl.style.display = 'none';
          if (window.lucide) window.lucide.createIcons();
        }
      };
      
      if (toggleBtn) {
        toggleBtn.addEventListener('click', collapseSidebar);
      }
      if (expandBtn) {
        expandBtn.addEventListener('click', expandSidebar);
      }
      
      // ── New Chat Button ──
      var newChatBtn = document.getElementById('copilot-page-new-chat');
      if (newChatBtn) {
        newChatBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (window.AppCore.Copilot) {
            self._saveCurrentSession();
            
            var newId = 'session_' + Date.now();
            localStorage.setItem('lex_ai_active_session', newId);
            
            window.AppCore.Copilot.messages = [
              { role: 'bot', text: 'Hello! I am Lex, your AI compliance assistant. You can ask me about regulatory updates, internal policies, or the reasoning behind my decisions.', timestamp: new Date() }
            ];
            localStorage.setItem('lex_ai_history', JSON.stringify(window.AppCore.Copilot.messages));
            
            // Re-render widget chat
            if (typeof window.AppCore.Copilot._renderMessages === 'function') {
              window.AppCore.Copilot._renderMessages();
            }
            
            // Full re-render of the copilot page
            var viewContainer = document.getElementById('view-container');
            if (viewContainer) {
              self.render(viewContainer);
            }
          }
        });
      }
      
      // ── Past Chat Click (load a session) ──
      var pastChatsContainer = document.getElementById('copilot-past-chats');
      if (pastChatsContainer) {
        pastChatsContainer.addEventListener('click', function(e) {
          var deleteBtn = e.target.closest('.past-chat-delete');
          if (deleteBtn) {
            e.stopPropagation();
            var delId = deleteBtn.getAttribute('data-session-id');
            var sessions = JSON.parse(localStorage.getItem('lex_ai_sessions') || '[]');
            sessions = sessions.filter(function(s) { return s.id !== delId; });
            localStorage.setItem('lex_ai_sessions', JSON.stringify(sessions));
            localStorage.removeItem('lex_ai_session_' + delId);
            
            // Full re-render of the copilot page
            var viewContainer = document.getElementById('view-container');
            if (viewContainer) {
              self.render(viewContainer);
            }
            return;
          }
          
          var item = e.target.closest('.past-chat-item');
          if (item) {
            var sessionId = item.getAttribute('data-session-id');
            self._saveCurrentSession();
            
            var savedMsgs = localStorage.getItem('lex_ai_session_' + sessionId);
            if (savedMsgs) {
              window.AppCore.Copilot.messages = JSON.parse(savedMsgs);
              localStorage.setItem('lex_ai_history', savedMsgs);
              localStorage.setItem('lex_ai_active_session', sessionId);
              
              if (typeof window.AppCore.Copilot._renderMessages === 'function') {
                window.AppCore.Copilot._renderMessages();
              }
              
              // Full re-render of the copilot page
              var viewContainer = document.getElementById('view-container');
              if (viewContainer) {
                self.render(viewContainer);
              }
            }
          }
        });
      }
      
      if (!form || !input) return;
      
      var micBtn = document.getElementById('copilot-page-mic-btn');
      if (micBtn) {
        micBtn.addEventListener('click', function(e) {
          e.preventDefault();
          
          var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            if (window.AppCore.App && window.AppCore.App.showToast) {
              window.AppCore.App.showToast('error', 'Unsupported', 'Microphone dictation is not supported in this browser.');
            }
            return;
          }
          
          var recognition = new SpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          
          recognition.onstart = function() {
            if (window.AppCore.App && window.AppCore.App.showToast) {
              window.AppCore.App.showToast('info', 'Listening...', 'Please speak now.');
            }
            micBtn.style.color = '#ef4444'; // Red recording indicator
          };
          
          recognition.onresult = function(event) {
            var transcript = event.results[0][0].transcript;
            var inputEl = document.getElementById('copilot-page-input');
            if (inputEl) {
              inputEl.value = (inputEl.value + " " + transcript).trim();
              inputEl.focus();
              if (window.AppCore.App && window.AppCore.App.showToast) {
                window.AppCore.App.showToast('success', 'Dictation Complete', 'Audio transcribed successfully.');
              }
            }
          };
          
          recognition.onerror = function(event) {
            if (window.AppCore.App && window.AppCore.App.showToast) {
              window.AppCore.App.showToast('error', 'Microphone Error', 'Could not capture audio (' + event.error + ').');
            }
          };
          
          recognition.onend = function() {
            micBtn.style.color = 'var(--text-secondary)';
          };
          
          recognition.start();
        });
      }
      
      var attachBtn = document.getElementById('copilot-page-attach-btn');
      if (attachBtn) {
        attachBtn.addEventListener('click', function(e) {
          e.preventDefault();
          // Create a hidden file input and click it
          var fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = '.pdf,.doc,.docx,.txt';
          fileInput.style.display = 'none';
          document.body.appendChild(fileInput);
          
          fileInput.addEventListener('change', function(evt) {
            if (evt.target.files && evt.target.files.length > 0) {
              var file = evt.target.files[0];
              if (window.AppCore.App && window.AppCore.App.showToast) {
                window.AppCore.App.showToast('success', 'Document Attached', file.name + ' has been added to your message.');
              }
              var inputEl = document.getElementById('copilot-page-input');
              if (inputEl) {
                inputEl.value = (inputEl.value + " Please analyze the attached document: " + file.name).trim();
                inputEl.focus();
              }
            }
            document.body.removeChild(fileInput);
          });
          
          fileInput.click();
        });
      }
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        var val = input.value.trim();
        if (!val) return;
        input.value = '';
        
        if (!localStorage.getItem('lex_ai_active_session')) {
          localStorage.setItem('lex_ai_active_session', 'session_' + Date.now());
        }
        
        if (window.AppCore.Copilot) {
          window.AppCore.Copilot.sendMessage(val);
          if (typeof window.AppCore.Copilot._renderMessages === 'function') {
            window.AppCore.Copilot._renderMessages();
          }
          self.renderMessages();
          
          setTimeout(function() { self._saveCurrentSession(); self.renderPastChats(); }, 300);
          
          var typingDiv = document.getElementById('copilot-page-typing');
          if (typingDiv) typingDiv.style.display = 'flex';
        }
      });
    },
    
    _saveCurrentSession: function() {
      if (!window.AppCore.Copilot || !window.AppCore.Copilot.messages) return;
      var messages = window.AppCore.Copilot.messages;
      if (messages.length <= 1) return;
      
      var activeId = localStorage.getItem('lex_ai_active_session');
      if (!activeId) {
        activeId = 'session_' + Date.now();
        localStorage.setItem('lex_ai_active_session', activeId);
      }
      
      localStorage.setItem('lex_ai_session_' + activeId, JSON.stringify(messages));
      
      var sessions = JSON.parse(localStorage.getItem('lex_ai_sessions') || '[]');
      var existing = sessions.find(function(s) { return s.id === activeId; });
      
      var firstUserMsg = messages.find(function(m) { return m.role === 'user'; });
      var preview = firstUserMsg ? firstUserMsg.text.replace(/<[^>]*>/g, '') : 'New conversation';
      
      if (existing) {
        existing.preview = preview;
        existing.messageCount = messages.length;
        existing.updatedAt = new Date().toISOString();
      } else {
        sessions.push({
          id: activeId,
          createdAt: messages[0].timestamp || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          preview: preview,
          messageCount: messages.length
        });
      }
      
      localStorage.setItem('lex_ai_sessions', JSON.stringify(sessions));
    },
    
    handleSuggestion: function(text) {
      var input = document.getElementById('copilot-page-input');
      if (!input) return;
      input.value = text;
      var form = document.getElementById('copilot-page-form');
      if (form) {
        var event = new Event('submit', { cancelable: true });
        form.dispatchEvent(event);
      }
    }
  };
})();
