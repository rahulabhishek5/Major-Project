/* ═══════════════════════════════════════════════════════════
   AI POLICY GAP ANALYSIS VIEW - UPGRADED
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.gap = {
  activeModalGapId: null,
  gaps: [],
  isLoaded: false,
  activeFilter: 'all',
  selectedGaps: [],
  searchQuery: '',
  chartInstance: null,
  
  setFilter: function(filter) {
    this.activeFilter = this.activeFilter === filter ? 'all' : filter;
    this.selectedGaps = []; // reset selection on filter
    this.render(document.getElementById('view-container'));
  },

  handleSearch: function(query) {
    this.searchQuery = query.toLowerCase();
    this.render(document.getElementById('view-container'));
  },

  toggleSelection: function(gapId) {
    const idx = this.selectedGaps.indexOf(gapId);
    if (idx > -1) {
      this.selectedGaps.splice(idx, 1);
    } else {
      this.selectedGaps.push(gapId);
    }
    this.render(document.getElementById('view-container'));
  },

  toggleAll: function(visibleGapIds) {
    if (this.selectedGaps.length === visibleGapIds.length && visibleGapIds.length > 0) {
      this.selectedGaps = [];
    } else {
      this.selectedGaps = visibleGapIds.slice();
    }
    this.render(document.getElementById('view-container'));
  },
  
  fetchGaps: function() {
    var self = this;
    fetch('http://localhost:3000/api/gaps')
      .then(function(res) { return res.json(); })
      .then(function(gaps) {
        self.gaps = gaps;
        self.isLoaded = true;
        self.render(document.getElementById('view-container'));
      })
      .catch(function(err) {
        console.error("Failed to fetch gaps:", err);
        self.isLoaded = true;
        self.render(document.getElementById('view-container'));
      });
  },

  render: function (container) {
    var self = this;
    
    if (!this.isLoaded) {
      this.fetchGaps();
      container.innerHTML = '<div style="display:flex; justify-content:center; align-items:center; height:100%;"><div class="spinner"></div></div>';
      return;
    }
    
    var activeGaps = this.gaps.filter(function(g) { return g.status === 'pending'; });
    var resolvedGaps = this.gaps.filter(function(g) { return g.status === 'resolved'; });
    
    var healthScore = 100;
    activeGaps.forEach(function(g) {
      healthScore -= (g.severity === 'critical' ? 4 : 2);
    });
    healthScore = Math.max(0, healthScore);

    var html = '<div id="gap-export-wrapper" class="gap-analysis animate-slide-up" style="display:flex; flex-direction:column; gap:24px; padding:24px; max-width: 1200px; margin: 0 auto; width: 100%;">';
    
    // Header with Export Button
    html += '<div class="view-header" style="display:flex; justify-content:space-between; align-items:center;">';
    html += '<div>';
    html += '<h1 class="view-header__title">Gap Analysis & Remediation</h1>';
    html += '<p class="view-header__desc">Direct cross-reference mapping of internal policies against external regulatory changes.</p>';
    html += '</div>';
    html += '<div style="display:flex; gap: 12px;">';
    html += '<button class="btn btn--ghost" onclick="window.AppCore.Views.gap.exportToPDF()" style="display:flex; align-items:center; gap:8px;"><i data-lucide="download" style="width:16px;height:16px;"></i> Export Report</button>';
    html += '</div>';
    html += '</div>';

    // HUD Summary Row (with Chart)
    html += '<div style="display:grid; grid-template-columns: 280px 1fr 300px; gap:24px;">';
    
    // Health score circular meter
    var strokeDash = (2 * Math.PI * 54).toFixed(0);
    var strokeOffset = (strokeDash - (strokeDash * healthScore) / 100).toFixed(0);
    var scoreColor = healthScore >= 95 ? 'var(--success)' : healthScore >= 85 ? 'var(--warning)' : 'var(--danger)';
    
    html += '<div class="glass-panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:32px 24px; text-align:center; position:relative; overflow:hidden; background: var(--bg-glass-heavy); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-md), var(--shadow-glass);">';
    html += '<div style="position:relative; width:140px; height:140px; display:flex; align-items:center; justify-content:center; margin-bottom:16px;">';
    html += '<svg width="200" height="200" viewBox="0 0 200 200" style="transform: rotate(-90deg); position:absolute; top:-30px; left:-30px; overflow:visible;">';
    html += '<circle cx="100" cy="100" r="54" fill="none" stroke="var(--white-alpha-4)" stroke-width="8"></circle>';
    html += '<circle cx="100" cy="100" r="54" fill="none" stroke="' + scoreColor + '" stroke-width="8" stroke-dasharray="' + strokeDash + '" stroke-dashoffset="' + strokeOffset + '" style="transition: stroke-dashoffset 0.8s ease; stroke-linecap: round; filter: drop-shadow(0 0 12px ' + scoreColor + ');"></circle>';
    html += '</svg>';
    html += '<div style="font-size:32px; font-weight:900; color:var(--text-white); font-family:monospace; position:relative; z-index:1; text-shadow: 0 0 15px ' + scoreColor + ';">' + healthScore + '%</div>';
    html += '</div>';
    html += '<div style="font-size:12px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:1.5px;">Compliance Rating</div>';
    html += '</div>';

    // Gaps overview stats
    html += '<div class="glass-panel" style="padding:28px 32px; display:flex; flex-direction:column; justify-content:space-between; gap:20px; background: var(--bg-glass-heavy); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-md), var(--shadow-glass);">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--white-alpha-5); padding-bottom:16px;">';
    html += '<h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-white); display:flex; align-items:center; gap:8px;"><i data-lucide="bar-chart-2" style="width:16px;height:16px;color:var(--accent);"></i> Status Metrics</h3>';
    html += '<span class="badge badge--' + (activeGaps.length === 0 ? 'success' : 'warning') + '" style="box-shadow:0 0 10px rgba(245,158,11,0.2);">' + (activeGaps.length === 0 ? 'Fully Compliant' : activeGaps.length + ' Gaps Detected') + '</span>';
    html += '</div>';
    html += '<div style="display:flex; gap:16px;">';
    
    // Metric Card 1
    var critActive = this.activeFilter === 'critical' ? 'box-shadow:0 0 0 2px var(--danger), 0 8px 32px rgba(239,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.1); background:rgba(239,68,68,0.1);' : 'box-shadow:0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1); background:rgba(255, 255, 255, 0.05);';
    html += '<div onclick="window.AppCore.Views.gap.setFilter(\'critical\')" style="flex:1; cursor:pointer; backdrop-filter: blur(12px); border:1px solid rgba(255, 255, 255, 0.1); border-radius:var(--radius-lg); padding:24px; display:flex; flex-direction:column; align-items:center; text-align:center; transition:all 0.3s ease; ' + critActive + '" onmouseover="this.style.transform=\'translateY(-4px)\';" onmouseout="this.style.transform=\'none\';">';
    html += '<div style="width:40px; height:40px; border-radius:50%; background:rgba(239,68,68,0.1); display:flex; align-items:center; justify-content:center; margin-bottom:12px;"><i data-lucide="alert-triangle" style="width:20px;height:20px;color:var(--danger);"></i></div>';
    html += '<div style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; letter-spacing:1px;">Critical Risks</div>';
    html += '<div style="font-size:36px; font-weight:900; font-family:monospace; color:' + (activeGaps.some(function(g){return g.severity==='critical';}) ? 'var(--danger)' : 'white') + ';">' + activeGaps.filter(function(g){return g.severity==='critical';}).length + '</div>';
    html += '</div>';

    // Metric Card 2
    var highActive = this.activeFilter === 'high' ? 'box-shadow:0 0 0 2px var(--warning), 0 8px 32px rgba(245,158,11,0.2), inset 0 1px 0 rgba(255,255,255,0.1); background:rgba(245,158,11,0.1);' : 'box-shadow:0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1); background:rgba(255, 255, 255, 0.05);';
    html += '<div onclick="window.AppCore.Views.gap.setFilter(\'high\')" style="flex:1; cursor:pointer; backdrop-filter: blur(12px); border:1px solid rgba(255, 255, 255, 0.1); border-radius:var(--radius-lg); padding:24px; display:flex; flex-direction:column; align-items:center; text-align:center; transition:all 0.3s ease; ' + highActive + '" onmouseover="this.style.transform=\'translateY(-4px)\';" onmouseout="this.style.transform=\'none\';">';
    html += '<div style="width:40px; height:40px; border-radius:50%; background:rgba(245,158,11,0.1); display:flex; align-items:center; justify-content:center; margin-bottom:12px;"><i data-lucide="alert-circle" style="width:20px;height:20px;color:var(--warning);"></i></div>';
    html += '<div style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px; letter-spacing:1px;">High Risks</div>';
    html += '<div style="font-size:36px; font-weight:900; font-family:monospace; color:var(--text-white);">' + activeGaps.filter(function(g){return g.severity==='high';}).length + '</div>';
    html += '</div>';

    // Metric Card 3
    var resActive = this.activeFilter === 'resolved' ? 'box-shadow:0 0 0 2px var(--success), 0 8px 32px rgba(16,185,129,0.2), inset 0 1px 0 rgba(255,255,255,0.1); background:rgba(16,185,129,0.1);' : 'box-shadow:0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1); background:rgba(255, 255, 255, 0.05);';
    html += '<div onclick="window.AppCore.Views.gap.setFilter(\'resolved\')" style="flex:1; cursor:pointer; backdrop-filter: blur(12px); border:1px solid rgba(255, 255, 255, 0.1); border-radius:var(--radius-lg); padding:24px; display:flex; flex-direction:column; align-items:center; text-align:center; transition:all 0.3s ease; ' + resActive + '" onmouseover="this.style.transform=\'translateY(-4px)\';" onmouseout="this.style.transform=\'none\';">';
    html += '<div style="width:40px; height:40px; border-radius:50%; background:rgba(16,185,129,0.1); display:flex; align-items:center; justify-content:center; margin-bottom:12px;"><i data-lucide="check-circle-2" style="width:20px;height:20px;color:var(--success);"></i></div>';
    html += '<div style="font-size:11px; font-weight:800; color:var(--success); text-transform:uppercase; margin-bottom:4px; letter-spacing:1px;">Resolved Gaps</div>';
    html += '<div style="font-size:36px; font-weight:900; font-family:monospace; color:var(--success);">' + resolvedGaps.length + '</div>';
    html += '</div>';

    html += '</div>'; // End Metric Cards
    html += '</div>';

    // Chart.js Container
    html += '<div class="glass-panel" style="padding:24px; background: var(--bg-glass-heavy); border-radius: var(--radius-lg); border: 1px solid var(--border); box-shadow: var(--shadow-md), var(--shadow-glass); display:flex; flex-direction:column; align-items:center; justify-content:center;">';
    html += '<h3 style="margin:0 0 16px 0; font-size:14px; font-weight:700; color:var(--text-white); width:100%; text-align:center;">Severity Distribution</h3>';
    html += '<div style="position:relative; width:100%; height:160px;"><canvas id="gapSeverityChart"></canvas></div>';
    html += '</div>';

    html += '</div>'; // End HUD Summary Row
    
    // Determine which gaps to display
    var displayGaps = activeGaps;
    var listTitle = "Identified Compliance Gaps";
    if (this.activeFilter === 'critical') {
      displayGaps = activeGaps.filter(function(g) { return g.severity === 'critical'; });
      listTitle = "Critical Risks";
    } else if (this.activeFilter === 'high') {
      displayGaps = activeGaps.filter(function(g) { return g.severity === 'high'; });
      listTitle = "High Risks";
    } else if (this.activeFilter === 'resolved') {
      displayGaps = resolvedGaps;
      listTitle = "Resolved Gaps";
    }

    // Apply Search Query
    if (this.searchQuery) {
      displayGaps = displayGaps.filter(function(g) {
        return g.title.toLowerCase().includes(self.searchQuery) ||
               g.id.toLowerCase().includes(self.searchQuery) ||
               g.regulation_ref.toLowerCase().includes(self.searchQuery);
      });
      listTitle = `Search Results for "${this.searchQuery}"`;
    }

    const visibleGapIds = displayGaps.map(g => g.id);
    const allSelected = visibleGapIds.length > 0 && this.selectedGaps.length === visibleGapIds.length;

    // Gaps Table Section
    html += '<div class="glass-panel" style="padding:28px; display:flex; flex-direction:column; gap:20px; background:var(--bg-glass-heavy); border:1px solid var(--border); border-radius:var(--radius-lg); box-shadow: var(--shadow-lg), var(--shadow-glass);">';
    
    // List Toolbar
    html += '<div style="display:flex; justify-content:space-between; align-items:center;">';
    html += '<h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-white); display:flex; align-items:center; gap:8px;"><i data-lucide="shield-alert" style="width:16px;height:16px;color:var(--accent);"></i> ' + listTitle + '</h3>';
    html += '<div style="position:relative; width: 300px;">';
    html += '<i data-lucide="search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); width:16px; height:16px; color:var(--text-muted);"></i>';
    html += '<input type="text" placeholder="Search gaps by ID or title..." value="' + this.searchQuery + '" onkeyup="window.AppCore.Views.gap.handleSearch(this.value)" style="width:100%; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.1); border-radius:8px; padding:10px 12px 10px 36px; color:white; outline:none; font-size:13px; transition: border-color 0.2s;" onfocus="this.style.borderColor=\'var(--accent)\'" onblur="this.style.borderColor=\'rgba(255,255,255,0.1)\'">';
    html += '</div>';
    html += '</div>';
    
    // Bulk Action Bar (Floating inside table)
    if (this.selectedGaps.length > 0 && this.activeFilter !== 'resolved') {
      html += '<div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); padding:12px 20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; animation: fadeIn 0.3s ease;">';
      html += '<div style="font-size:14px; font-weight:600; color:var(--text-white);"><span style="color:var(--accent); font-weight:800;">' + this.selectedGaps.length + '</span> gaps selected</div>';
      html += '<button class="btn btn--success" onclick="window.AppCore.Views.gap.bulkResolve()" style="padding:8px 16px; font-size:13px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);"><i data-lucide="check-circle" style="width:16px;height:16px;margin-right:6px;"></i> Resolve Selected</button>';
      html += '</div>';
    }
    
    if (displayGaps.length === 0) {
      html += '<div style="text-align:center; padding:60px 40px; border:1px dashed var(--white-alpha-8); border-radius:12px; background:var(--white-alpha-1);">';
      if (this.activeFilter === 'all' && !this.searchQuery) {
        html += '<div style="font-size:32px; margin-bottom:12px;">🎉</div>';
        html += '<div style="font-size:16px; color:var(--text-white); font-weight:700; margin-bottom:6px;">All Gaps Resolved!</div>';
        html += '<div style="font-size:13px; color:var(--text-muted);">Your internal policies are fully aligned with the active regulatory stream.</div>';
      } else {
        html += '<div style="font-size:32px; margin-bottom:12px;">✨</div>';
        html += '<div style="font-size:16px; color:var(--text-white); font-weight:700; margin-bottom:6px;">No ' + listTitle + '</div>';
        html += '<div style="font-size:13px; color:var(--text-muted);">There are currently no gaps matching this filter or search query.</div>';
      }
      html += '</div>';
    } else {
      // Select All Toggle (only show if not in resolved filter)
      if (this.activeFilter !== 'resolved') {
        html += '<div style="display:flex; align-items:center; padding: 0 12px 12px 12px; border-bottom:1px solid rgba(255,255,255,0.05); cursor:pointer; width: max-content;" onclick="window.AppCore.Views.gap.toggleAll(' + JSON.stringify(visibleGapIds).replace(/"/g, '&quot;') + ')">';
        html += '<div style="width:18px; height:18px; border-radius:4px; border:2px solid ' + (allSelected ? 'var(--accent)' : 'rgba(255,255,255,0.3)') + '; background:' + (allSelected ? 'var(--accent)' : 'transparent') + '; display:flex; align-items:center; justify-content:center; margin-right:12px; transition:all 0.2s;">';
        if (allSelected) html += '<i data-lucide="check" style="width:12px; height:12px; color:white;"></i>';
        html += '</div>';
        html += '<span style="font-size:12px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">Select All</span>';
        html += '</div>';
      }

      html += '<div style="display:flex; flex-direction:column; gap:16px;">';
      displayGaps.forEach(function(g) {
        var isCrit = g.severity === 'critical';
        var badgeClass = isCrit ? 'danger' : 'warning';
        var rowBg = 'rgba(255, 255, 255, 0.05)';
        var borderColor = 'rgba(255, 255, 255, 0.1)';
        var shadowColor = 'rgba(0,0,0,0.3)';
        var isSelected = self.selectedGaps.includes(g.id);
        
        if (isSelected) {
          rowBg = 'rgba(99,102,241,0.05)';
          borderColor = 'rgba(99,102,241,0.3)';
        }
        
        html += '<div class="glass-panel" style="background:' + rowBg + '; backdrop-filter:blur(12px); border:1px solid ' + borderColor + '; border-radius:var(--radius-lg); padding:24px; display:flex; justify-content:space-between; align-items:flex-start; gap:24px; transition:all 0.3s ease; box-shadow:0 8px 30px ' + shadowColor + ', inset 0 1px 0 rgba(255,255,255,0.1);">';
        
        // Checkbox column
        if (self.activeFilter !== 'resolved') {
          html += '<div style="padding-top: 6px; cursor:pointer;" onclick="window.AppCore.Views.gap.toggleSelection(\'' + g.id + '\')">';
          html += '<div style="width:20px; height:20px; border-radius:6px; border:2px solid ' + (isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.3)') + '; background:' + (isSelected ? 'var(--accent)' : 'transparent') + '; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">';
          if (isSelected) html += '<i data-lucide="check" style="width:14px; height:14px; color:white;"></i>';
          html += '</div></div>';
        }

        html += '<div style="flex:1;">';
        html += '<div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">';
        html += '<span class="badge badge--' + badgeClass + '" style="padding:4px 10px; font-size:11px; font-weight:800; letter-spacing:1px;">' + g.severity.toUpperCase() + '</span>';
        html += '<span style="font-size:12px; font-weight:800; color:rgba(255,255,255,0.9); font-family:monospace; background:rgba(255,255,255,0.1); padding:4px 8px; border-radius:6px;">' + g.id + '</span>';
        html += '<span style="font-size:12px; font-weight:700; color:rgba(255,255,255,0.6);"><i data-lucide="clock" style="width:12px;height:12px;margin-right:4px;"></i>' + (new Date(g.created_at).toLocaleDateString()) + '</span>';
        html += '</div>';
        html += '<h4 style="margin:0 0 8px 0; font-size:18px; font-weight:700; color:#ffffff; line-height:1.4;">' + g.title + '</h4>';
        html += '<p style="margin:0 0 16px 0; font-size:14px; color:rgba(255,255,255,0.8); font-weight:400; line-height:1.6; max-width:92%;">' + g.description + '</p>';
        
        html += '<div style="display:flex; flex-wrap:wrap; gap:16px; font-size:12px; color:rgba(255,255,255,0.95); font-weight:600; background:rgba(0,0,0,0.2); padding:10px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">';
        html += '<span style="display:flex; align-items:center; gap:8px;"><i data-lucide="file-text" style="width:14px;height:14px;color:var(--accent);"></i> <span>' + g.policy_title + '</span> <span style="opacity:0.6">(' + g.policy_id + ')</span></span>';
        html += '<span style="width:1px; height:14px; background:rgba(255,255,255,0.2);"></span>';
        html += '<span style="display:flex; align-items:center; gap:8px;"><i data-lucide="scale" style="width:14px;height:14px;color:var(--accent);"></i> <span>' + g.regulation_ref + '</span></span>';
        html += '</div>';
        html += '</div>';
        
        html += '<div style="display:flex; flex-direction:column; gap:12px; min-width:160px; margin-top:8px;">';
        if (g.status !== 'resolved') {
          html += '<button class="btn btn--primary" style="padding:10px 16px; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:8px;" onclick="window.AppCore.Views.gap.openFixModal(\'' + g.id + '\')"><i data-lucide="cpu" style="width:16px;height:16px;"></i> Draft Fix</button>';
        }
        html += '<button class="btn btn--ghost" style="padding:10px 16px; font-size:13px; font-weight:600; border-radius:8px; background:rgba(255, 255, 255, 0.05);" onclick="window.AppCore.Views.gap.openFixModal(\'' + g.id + '\')">Details</button>';
        html += '</div>';
        
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>'; // End Gaps Table Section

    // Render Modal Backdrop/Dialog if modal is open
    if (this.activeModalGapId) {
      var mg = this.gaps.find(function(x){return x.id === self.activeModalGapId;});
      if (mg) {
        html += '<div id="gap-modal-overlay" style="position:fixed; top:0; left:0; right:0; bottom:0; background:var(--bg-overlay); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:10000; padding:40px;">';
        html += '<div class="glass-panel" style="width:100%; max-width:850px; border-radius:16px; display:flex; flex-direction:column; overflow:hidden; border:1px solid var(--white-alpha-8); box-shadow:0 25px 50px var(--black-alpha-50); background:var(--bg-modal);">';
        
        // Modal Header
        html += '<div style="padding:24px 32px; border-bottom:1px solid var(--white-alpha-6); display:flex; justify-content:space-between; align-items:center; background:linear-gradient(90deg, rgba(225,29,72,0.05) 0%, transparent 100%);">';
        html += '<div>';
        html += '<div style="font-size:11px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Lex AI Policy Draft Fix</div>';
        html += '<h3 style="margin:0; font-size:18px; font-weight:800; color:var(--text-white);">' + mg.title + '</h3>';
        html += '</div>';
        html += '<button class="btn btn--ghost btn--icon" onclick="window.AppCore.Views.gap.closeFixModal()">✕</button>';
        html += '</div>';

        // Modal Content
        html += '<div style="padding:32px; display:flex; flex-direction:column; gap:20px; overflow-y:auto; max-height:calc(100vh - 250px);">';
        html += '<div style="font-size:13px; color:var(--text-secondary); line-height:1.6;">Lex has automatically analyzed the regulatory target <strong style="color:var(--text-white);">' + mg.regulation_ref + '</strong> and drafted a replacement clause for your internal policy <strong style="color:var(--text-white);">' + mg.policy_title + ' (' + mg.policy_id + ')</strong>.</div>';
        
        html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">';
        
        // Original Clause
        html += '<div>';
        html += '<div style="font-size:10px; color:var(--text-muted); font-weight:700; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Current Policy Clause</div>';
        html += '<div style="background:var(--black-alpha-30); border:1px solid var(--white-alpha-5); padding:16px; border-radius:8px; font-size:12px; line-height:1.6; color:var(--text-secondary); text-decoration:line-through; opacity:0.6; white-space:pre-wrap;">' + mg.original_text + '</div>';
        html += '</div>';

        // Proposed Clause
        var diffText = mg.proposed_text.replace(/(Annual Percentage Rate \(APR\)|3-day cooling-off period|SEC directives|6 hours)/g, '<strong style="color:var(--success); background:rgba(16,185,129,0.1); padding:2px 4px; border-radius:4px;">$1</strong>');
        html += '<div>';
        html += '<div style="font-size:10px; color:var(--success); font-weight:700; text-transform:uppercase; margin-bottom:6px; letter-spacing:0.5px;">Proposed AI Patch Clause</div>';
        html += '<div style="background:rgba(16,185,129,0.02); border:1px solid rgba(16,185,129,0.2); padding:16px; border-radius:8px; font-size:12px; line-height:1.6; color:var(--text-white); white-space:pre-wrap;">' + diffText + '</div>';
        html += '</div>';

        html += '</div>';
        html += '</div>';

        // Modal Footer
        html += '<div style="padding:20px 32px; border-top:1px solid var(--white-alpha-6); display:flex; justify-content:flex-end; gap:12px; background:var(--black-alpha-20);">';
        html += '<button class="btn btn--ghost" onclick="window.AppCore.Views.gap.closeFixModal()">Cancel</button>';
        
        if (mg.status !== 'resolved') {
          html += '<button class="btn btn--success" onclick="window.AppCore.Views.gap.applyPolicyPatch(\'' + mg.id + '\')" style="display:flex; align-items:center; gap:8px; box-shadow:0 4px 15px rgba(16,185,129,0.3);"><i data-lucide="check-circle" style="width:16px;height:16px;"></i> Approve & Patch Policy</button>';
        } else {
          html += '<button class="btn btn--ghost" disabled style="display:flex; align-items:center; gap:8px; opacity:0.5;"><i data-lucide="check" style="width:16px;height:16px;"></i> Resolved</button>';
        }
        
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }
    }

    html += '</div>'; // End main page wrapper
    
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    // Render Chart
    this.renderChart(activeGaps, resolvedGaps);
  },

  renderChart: function(activeGaps, resolvedGaps) {
    var ctx = document.getElementById('gapSeverityChart');
    if (!ctx) return;
    
    var crit = activeGaps.filter(function(g) { return g.severity === 'critical'; }).length;
    var high = activeGaps.filter(function(g) { return g.severity === 'high'; }).length;
    var res = resolvedGaps.length;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Resolved'],
        datasets: [{
          data: [crit, high, res],
          backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            theme: 'dark',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { family: 'Inter', size: 13 },
            bodyFont: { family: 'Inter', size: 13 },
            padding: 12,
            cornerRadius: 8,
            displayColors: true
          }
        }
      }
    });
  },

  bulkResolve: function() {
    if (!this.selectedGaps.length) return;
    
    var self = this;
    var promises = this.selectedGaps.map(function(id) {
      return fetch('http://localhost:3000/api/gaps/' + id + '/resolve', { method: 'PUT' });
    });
    
    Promise.all(promises)
      .then(function() {
        var State = window.AppCore.StateManager;
        var auditTrail = State.getByPath('auditTrail') || [];
        auditTrail.unshift({
          id: 'AUD-' + Math.floor(100000 + Math.random()*900000),
          timestamp: new Date().toISOString(),
          action: 'BULK_REMEDIATION',
          user: JSON.parse(localStorage.getItem('app_session') || '{}').name || 'Compliance Officer',
          details: 'Bulk resolved ' + self.selectedGaps.length + ' compliance gaps.'
        });
        State.setState('auditTrail', auditTrail);
        
        window.AppCore.App.showToast('success', 'Bulk Action Complete', 'Successfully resolved ' + self.selectedGaps.length + ' gaps.');
        self.selectedGaps = [];
        self.fetchGaps();
      })
      .catch(function(err) {
        console.error('Bulk resolve error:', err);
        window.AppCore.App.showToast('error', 'Action Failed', 'Failed to bulk resolve some gaps.');
      });
  },

  exportToPDF: function() {
    var element = document.getElementById('gap-export-wrapper');
    if (!element) return;
    window.AppCore.App.showToast('info', 'Generating PDF...', 'Please wait while your report is generated.');
    
    var opt = {
      margin:       1,
      filename:     'Gap_Analysis_Report_' + new Date().toISOString().split('T')[0] + '.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    html2pdf().set(opt).from(element).save().then(function() {
      window.AppCore.App.showToast('success', 'Export Complete', 'PDF report has been downloaded.');
    });
  },

  openFixModal: function(gapId) {
    this.activeModalGapId = gapId;
    this.render(document.getElementById('view-container'));
  },

  closeFixModal: function() {
    this.activeModalGapId = null;
    this.render(document.getElementById('view-container'));
  },

  applyPolicyPatch: function(gapId) {
    var self = this;
    var gap = this.gaps.find(function(x){return x.id === gapId;});
    if (!gap) return;

    fetch('http://localhost:3000/api/gaps/' + gapId + '/resolve', {
      method: 'PUT'
    })
    .then(function(res) {
      if (!res.ok) throw new Error('Network response was not ok');
      return res.json();
    })
    .then(function(data) {
      // Log to Audit Trail
      var State = window.AppCore.StateManager;
      var auditTrail = State.getByPath('auditTrail') || [];
      auditTrail.unshift({
        id: 'AUD-' + Math.floor(100000 + Math.random()*900000),
        timestamp: new Date().toISOString(),
        action: 'POLICY_AUTO_PATCH',
        user: JSON.parse(localStorage.getItem('app_session') || '{}').name || 'Compliance Engine',
        details: 'Lex AI applied patch ' + gapId + ' on policy ' + gap.policy_id + ' (Updated to v2.5).'
      });
      State.setState('auditTrail', auditTrail);

      window.AppCore.App.showToast('success', 'Policy Patched', 'Policy ' + gap.policy_id + ' updated successfully via Lex AI Draft.');

      self.activeModalGapId = null;
      self.fetchGaps();
    })
    .catch(function(err) {
      console.error('Error resolving gap:', err);
      window.AppCore.App.showToast('error', 'Patch Failed', 'Failed to resolve policy gap.');
    });
  }
};

