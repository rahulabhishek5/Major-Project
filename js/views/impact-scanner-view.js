/* ═══════════════════════════════════════════════════════════
   AI IMPACT SCANNER VIEW
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.impactScanner = {
  isLoaded: false,
  regulations: [],
  policies: [],
  selectedRegs: [],
  selectedPols: [],
  matrixData: null,
  isScanning: false,
  
  fetchData: function(container) {
    var self = this;
    
    // Fetch recent regulations (limit 15)
    var p1 = fetch('/api/live-feed?page=1&limit=15').then(r => r.json());
    // Fetch all policies
    var p2 = fetch('/api/policies').then(r => r.json());

    Promise.all([p1, p2])
      .then(function(results) {
        self.regulations = Array.isArray(results[0]) ? results[0] : (results[0].data || []);
        self.policies = results[1] || [];
        self.isLoaded = true;
        if (container) self.render(container);
      })
      .catch(function(err) {
        console.error("Failed to load data for scanner", err);
      });
  },

  toggleReg: function(id) {
    var idx = this.selectedRegs.indexOf(id);
    if (idx > -1) {
      this.selectedRegs.splice(idx, 1);
    } else {
      if (this.selectedRegs.length >= 3) {
        alert("For performance, please select a maximum of 3 regulations at a time.");
        return;
      }
      this.selectedRegs.push(id);
    }
    
    var rs = document.getElementById('regs-scroll-area');
    var ps = document.getElementById('pols-scroll-area');
    var rst = rs ? rs.scrollTop : 0;
    var pst = ps ? ps.scrollTop : 0;
    
    this.render(document.getElementById('view-container'));
    
    var nrs = document.getElementById('regs-scroll-area');
    var nps = document.getElementById('pols-scroll-area');
    if (nrs) nrs.scrollTop = rst;
    if (nps) nps.scrollTop = pst;
  },

  togglePol: function(id) {
    var idx = this.selectedPols.indexOf(id);
    if (idx > -1) {
      this.selectedPols.splice(idx, 1);
    } else {
      if (this.selectedPols.length >= 3) {
        alert("For performance, please select a maximum of 3 policies at a time.");
        return;
      }
      this.selectedPols.push(id);
    }
    
    var rs = document.getElementById('regs-scroll-area');
    var ps = document.getElementById('pols-scroll-area');
    var rst = rs ? rs.scrollTop : 0;
    var pst = ps ? ps.scrollTop : 0;
    
    this.render(document.getElementById('view-container'));
    
    var nrs = document.getElementById('regs-scroll-area');
    var nps = document.getElementById('pols-scroll-area');
    if (nrs) nrs.scrollTop = rst;
    if (nps) nps.scrollTop = pst;
  },

  generateMatrix: function() {
    if (this.selectedRegs.length === 0 || this.selectedPols.length === 0) {
      alert("Please select at least 1 regulation and 1 policy.");
      return;
    }

    this.isScanning = true;
    this.render(document.getElementById('view-container'));

    var self = this;
    var selectedRegulationObjects = this.selectedRegs.map(id => self.regulations.find(r => r.update_id === id)).filter(Boolean);

    fetch('/api/impact-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            regulations: selectedRegulationObjects,
            policyIds: this.selectedPols
        })
    })
    .then(r => r.json())
    .then(res => {
        self.isScanning = false;
        if (res.error) {
            alert('Generation Failed: ' + res.error);
        } else {
            self.matrixData = res.matrix;
        }
        self.render(document.getElementById('view-container'));
    })
    .catch(err => {
        self.isScanning = false;
        alert('Error: ' + err.message);
        self.render(document.getElementById('view-container'));
    });
  },

  resetMatrix: function() {
    this.matrixData = null;
    this.render(document.getElementById('view-container'));
  },

  render: function (container) {
    if (!this.isLoaded) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);"><i data-lucide="loader-2" class="spin" style="width:24px;height:24px;"></i> Initializing Scanner...</div>';
      if (window.lucide) window.lucide.createIcons();
      this.fetchData(container);
      return;
    }

    var self = this;
    var html = '<div class="scanner-view animate-slide-up" style="display:flex; flex-direction:column; gap:24px; padding:24px; height:100%; box-sizing:border-box;">';
    
    // Header
    html += '<div style="display:flex; justify-content:space-between; align-items:flex-end; gap:20px; flex-shrink:0;">';
    html += '<div style="display:flex; flex-direction:column; gap:8px;">';
    html += '<h1 style="font-size:24px; font-weight:600; color:var(--text); margin:0; display:flex; align-items:center; gap:8px;"><i data-lucide="radar" style="color:var(--accent);"></i> Cross-Reference Impact Scanner</h1>';
    html += '<p style="margin:0; color:var(--text-muted); font-size:14px;">Select regulations and policies to generate an AI-powered multi-dimensional impact matrix.</p>';
    html += '</div>';
    
    var canScan = this.selectedRegs.length > 0 && this.selectedPols.length > 0;
    var btnText = this.isScanning ? '<i data-lucide="loader-2" class="spin" style="width:14px;height:14px;margin-right:6px;"></i>Generating...' : '<i data-lucide="zap" style="width:14px;height:14px;margin-right:6px;"></i>Generate Matrix';
    
    html += '<div style="display:flex; gap:12px;">';
    if (this.matrixData) {
        html += '<button class="btn btn--ghost" onclick="window.AppCore.Views.impactScanner.resetMatrix()"><i data-lucide="refresh-cw" style="width:14px;height:14px;margin-right:6px;"></i>Clear Results</button>';
    }
    html += '<button class="btn ' + (canScan ? 'btn--primary' : 'btn--ghost') + '" style="padding:10px 20px; border-radius:8px; font-weight:600; transition:all 0.3s ease;" ' + (!canScan || this.isScanning ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : 'onclick="window.AppCore.Views.impactScanner.generateMatrix()"') + '>' + btnText + '</button>';
    html += '</div>';
    
    html += '</div>'; // End Header

    // --- MAIN SPLIT VIEW ---
    html += '<div style="display:flex; flex:1; gap:24px; min-height:0;">'; // min-height:0 allows children to scroll

    // LEFT PANEL: SELECTION UI
    html += '<div style="flex:0 0 380px; display:flex; flex-direction:column; gap:16px;">';
    
    // Regulations Box
    html += '<div style="flex:1; background:var(--white-alpha-3); border:1px solid var(--white-alpha-8); border-radius:12px; display:flex; flex-direction:column; overflow:hidden; backdrop-filter:blur(10px);">';
    html += '<div style="padding:16px; border-bottom:1px solid var(--white-alpha-8); font-weight:600; color:var(--text-secondary); display:flex; justify-content:space-between; align-items:center;">';
    html += '<span style="display:flex; align-items:center; gap:8px;"><i data-lucide="scale" style="width:16px;height:16px;color:var(--text-muted);"></i> Regulations</span>';
    html += '<span style="font-size:12px; background:var(--accent-alpha-20); color:var(--accent); padding:2px 8px; border-radius:10px; font-weight:700;">' + self.selectedRegs.length + '/3</span>';
    html += '</div>';
    html += '<div id="regs-scroll-area" class="scroll-area" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">';
    
    self.regulations.forEach(function(reg) {
        var isSel = self.selectedRegs.includes(reg.update_id);
        var cardStyle = 'background:var(--bg-card); border:1px solid ' + (isSel ? 'var(--accent)' : 'var(--border)') + '; border-radius:8px; padding:12px; cursor:pointer; transition:all 0.2s ease; position:relative; overflow:hidden;';
        if (isSel) cardStyle += ' background:rgba(56,189,248,0.05); box-shadow: 0 4px 15px rgba(56,189,248,0.15); transform:translateY(-1px);';
        
        html += '<div style="' + cardStyle + '" onclick="window.AppCore.Views.impactScanner.toggleReg(\'' + reg.update_id + '\')" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'' + (isSel ? 'var(--accent)' : 'var(--border)') + '\'">';
        if (isSel) html += '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--accent); box-shadow: 0 0 10px var(--accent);"></div>';
        
        html += '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:600; font-size:13px; color:var(--text); margin-bottom:4px; line-height:1.4;">' + reg.document_title + '</div>';
        html += '<div style="font-size:11px; color:var(--text-muted);">' + reg.source_authority + ' • ' + (new Date(reg.publication_timestamp || reg.date).toLocaleDateString()) + '</div>';
        html += '</div>';
        
        html += '<div style="width:18px; height:18px; flex-shrink:0; border-radius:4px; border:2px solid ' + (isSel ? 'var(--accent)' : 'var(--white-alpha-20)') + '; display:flex; align-items:center; justify-content:center; background:' + (isSel ? 'var(--accent)' : 'transparent') + '; transition:all 0.2s ease;">';
        if (isSel) html += '<i data-lucide="check" style="width:12px; height:12px; color:#fff;"></i>';
        html += '</div>';
        html += '</div>'; // End Flex
        html += '</div>'; // End Card
    });
    html += '</div></div>';

    // Policies Box
    html += '<div style="flex:1; background:var(--white-alpha-3); border:1px solid var(--white-alpha-8); border-radius:12px; display:flex; flex-direction:column; overflow:hidden; backdrop-filter:blur(10px);">';
    html += '<div style="padding:16px; border-bottom:1px solid var(--white-alpha-8); font-weight:600; color:var(--text-secondary); display:flex; justify-content:space-between; align-items:center;">';
    html += '<span style="display:flex; align-items:center; gap:8px;"><i data-lucide="file-text" style="width:16px;height:16px;color:var(--text-muted);"></i> Internal Policies</span>';
    html += '<span style="font-size:12px; background:var(--accent-alpha-20); color:var(--accent); padding:2px 8px; border-radius:10px; font-weight:700;">' + self.selectedPols.length + '/3</span>';
    html += '</div>';
    html += '<div id="pols-scroll-area" class="scroll-area" style="flex:1; overflow-y:auto; padding:12px; display:flex; flex-direction:column; gap:8px;">';
    
    self.policies.forEach(function(pol) {
        var isSel = self.selectedPols.includes(pol.id);
        var cardStyle = 'background:var(--bg-card); border:1px solid ' + (isSel ? 'var(--accent)' : 'var(--border)') + '; border-radius:8px; padding:12px; cursor:pointer; transition:all 0.2s ease; position:relative; overflow:hidden;';
        if (isSel) cardStyle += ' background:rgba(56,189,248,0.05); box-shadow: 0 4px 15px rgba(56,189,248,0.15); transform:translateY(-1px);';
        
        html += '<div style="' + cardStyle + '" onclick="window.AppCore.Views.impactScanner.togglePol(\'' + pol.id + '\')" onmouseover="this.style.borderColor=\'var(--accent)\'" onmouseout="this.style.borderColor=\'' + (isSel ? 'var(--accent)' : 'var(--border)') + '\'">';
        if (isSel) html += '<div style="position:absolute; top:0; left:0; width:4px; height:100%; background:var(--accent); box-shadow: 0 0 10px var(--accent);"></div>';
        
        html += '<div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px;">';
        html += '<div style="flex:1;">';
        html += '<div style="font-weight:600; font-size:13px; color:var(--text); margin-bottom:4px; line-height:1.4;">' + pol.title + '</div>';
        html += '<div style="font-size:11px; color:var(--text-muted);">' + pol.category + ' • v' + pol.version + '</div>';
        html += '</div>';
        
        html += '<div style="width:18px; height:18px; flex-shrink:0; border-radius:4px; border:2px solid ' + (isSel ? 'var(--accent)' : 'var(--white-alpha-20)') + '; display:flex; align-items:center; justify-content:center; background:' + (isSel ? 'var(--accent)' : 'transparent') + '; transition:all 0.2s ease;">';
        if (isSel) html += '<i data-lucide="check" style="width:12px; height:12px; color:#fff;"></i>';
        html += '</div>';
        html += '</div>'; // End Flex
        html += '</div>'; // End Card
    });
    html += '</div></div>';

    html += '</div>'; // End Left Panel

    // RIGHT PANEL: RESULTS AREA
    html += '<div style="flex:1; background:var(--white-alpha-3); border:1px solid var(--white-alpha-8); border-radius:12px; display:flex; flex-direction:column; overflow:hidden; backdrop-filter:blur(10px); position:relative;">';
    
    if (this.isScanning) {
        // Loading State
        html += '<div class="animate-fade" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; text-align:center;">';
        html += '<div style="position:relative; width:80px; height:80px; margin-bottom:24px;">';
        html += '<div style="position:absolute; inset:0; border-radius:50%; border:2px solid var(--accent-alpha-20); border-top-color:var(--accent); animation:spin 1s linear infinite;"></div>';
        html += '<div style="position:absolute; inset:10px; border-radius:50%; border:2px solid var(--accent-alpha-20); border-bottom-color:var(--accent); animation:spin 1.5s linear infinite reverse;"></div>';
        html += '<i data-lucide="brain" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:32px; height:32px; color:var(--accent); filter:drop-shadow(0 0 8px var(--accent));"></i>';
        html += '</div>';
        html += '<h3 style="font-size:20px; font-weight:600; color:var(--text); margin:0 0 8px 0;">AI Analyzing Impact</h3>';
        html += '<p style="color:var(--text-muted); font-size:14px; max-width:300px; line-height:1.5;">Cross-referencing selected regulations against internal policies...</p>';
        html += '</div>';
    } 
    else if (this.matrixData) {
        // Matrix Results State (Policy Impact Cards)
        html += '<div style="padding:20px; border-bottom:1px solid var(--white-alpha-8); background:rgba(0,0,0,0.2); display:flex; justify-content:space-between; align-items:center;">';
        html += '<h2 style="font-size:16px; font-weight:600; color:var(--text); margin:0; display:flex; align-items:center; gap:8px;"><i data-lucide="file-check-2" style="color:var(--success);"></i> Analysis Complete</h2>';
        html += '<div style="font-size:12px; color:var(--text-muted); background:var(--white-alpha-5); padding:4px 10px; border-radius:12px;">' + self.matrixData.length + ' Policies Analyzed</div>';
        html += '</div>';
        
        html += '<div class="scroll-area animate-slide-up" style="flex:1; overflow-y:auto; padding:24px; display:flex; flex-direction:column; gap:20px;">';
        
        self.matrixData.forEach(function(row) {
            var pol = self.policies.find(p => p.id === row.policy_id);
            
            html += '<div style="background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; box-shadow:var(--shadow-sm); transition:transform 0.2s ease;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'translateY(0)\'">';
            
            // Policy Header
            html += '<div style="padding:16px 20px; border-bottom:1px solid var(--border); background:rgba(255,255,255,0.02); display:flex; justify-content:space-between; align-items:center;">';
            html += '<div>';
            html += '<div style="font-weight:600; font-size:15px; color:var(--text); margin-bottom:4px;">' + (pol ? pol.title : row.policy_id) + '</div>';
            if (pol) html += '<div style="font-size:12px; color:var(--text-muted);"><i data-lucide="tag" style="width:12px;height:12px;display:inline-block;margin-right:4px;"></i>' + pol.category + '</div>';
            html += '</div>';
            html += '<button class="btn btn--ghost" style="padding:6px 12px; font-size:12px;"><i data-lucide="external-link" style="width:12px;height:12px;margin-right:6px;"></i>View Policy</button>';
            html += '</div>';
            
            // Impacts List
            html += '<div style="padding:0 20px;">';
            
            row.impacts.forEach(function(impact, idx) {
                var reg = self.regulations.find(r => r.update_id === impact.regulation_id);
                var isLast = idx === row.impacts.length - 1;
                
                var sevColor = impact.severity === 'high' ? 'var(--danger)' : impact.severity === 'medium' ? 'var(--warning)' : 'var(--success)';
                var sevBg = impact.severity === 'high' ? 'var(--danger-bg)' : impact.severity === 'medium' ? 'var(--warning-bg)' : 'var(--success-bg)';
                
                html += '<div style="padding:16px 0; border-bottom:' + (isLast ? 'none' : '1px solid var(--border)') + '; display:flex; gap:16px;">';
                
                // Severity Badge
                html += '<div style="width:80px; flex-shrink:0;">';
                html += '<div style="display:inline-flex; align-items:center; justify-content:center; width:100%; padding:4px 0; border-radius:6px; font-size:11px; font-weight:800; text-transform:uppercase; color:' + sevColor + '; background:' + sevBg + ';">' + impact.severity + '</div>';
                html += '</div>';
                
                // Impact Details
                html += '<div style="flex:1;">';
                html += '<div style="font-size:13px; font-weight:600; color:var(--text-secondary); margin-bottom:6px;">' + (reg ? reg.document_title : impact.regulation_id) + '</div>';
                html += '<div style="font-size:14px; color:var(--text); line-height:1.6;">' + impact.summary + '</div>';
                html += '</div>';
                
                html += '</div>';
            });
            
            html += '</div>'; // End Impacts List
            html += '</div>'; // End Policy Card
        });
        
        html += '</div>'; // End Scroll Area
    } 
    else {
        // Empty State
        html += '<div class="animate-fade" style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; text-align:center; color:var(--text-muted);">';
        html += '<div style="width:64px; height:64px; border-radius:16px; background:var(--white-alpha-5); display:flex; align-items:center; justify-content:center; margin-bottom:20px; box-shadow:inset 0 2px 10px rgba(255,255,255,0.05);">';
        html += '<i data-lucide="mouse-pointer-click" style="width:32px; height:32px; color:var(--text-secondary); opacity:0.7;"></i>';
        html += '</div>';
        html += '<h3 style="font-size:18px; font-weight:500; color:var(--text-secondary); margin:0 0 12px 0;">Awaiting Selection</h3>';
        html += '<p style="font-size:14px; max-width:320px; line-height:1.5; margin:0;">Select up to 3 Regulations and 3 Internal Policies from the left panel, then click <strong>Generate Matrix</strong> to analyze their cross-impact.</p>';
        html += '</div>';
    }
    
    html += '</div>'; // End Right Panel

    html += '</div>'; // End Main Split View

    html += '</div>'; // End scanner-view wrapper

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }
};
