/**
 * UBS — Trace View + Policy View + Escalation View + Audit View
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Views = window.AppCore.Views || {};
  var H = window.AppCore.Helpers, State = window.AppCore.StateManager, Trace = window.AppCore.TraceLogger;

  /* ═══════════════════════════════════════════════════════════
     DECISION TRACE VIEW
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.trace = {
    selectedTraceId: null,
    render: function (container) {
      var self = this;
      var allTraces = Trace.getAllTraces();
      var agents = (window.APP_DATA && window.APP_DATA.agentDefinitions) || [];

      var html = '<div class="trace animate-slide-up">';

      if (allTraces.length === 0) {
        html += '<div class="card"><div class="empty-state"><div class="empty-state__icon">🔍</div>';
        html += '<div class="empty-state__title">No Decision Traces Yet</div>';
        html += '<div class="empty-state__text">Process regulatory updates from the Feed to generate decision traces showing the complete agent pipeline.</div>';
        html += '<button class="btn btn--primary" style="margin-top:16px" onclick="window.AppCore.Router.navigate(\'feed\')">Go to Regulatory Feed</button>';
        html += '</div></div></div>';
        container.innerHTML = html;
        return;
      }

      html += '<div class="trace__layout">';

      // Trace selector
      html += '<div class="trace__selector scroll-area">';
      html += '<div class="trace__selector-title">Decision Traces (' + allTraces.length + ')</div>';
      allTraces.forEach(function (t) {
        var isActive = self.selectedTraceId === t.trace_id;
        var statusBadge = t.status === 'completed' ? 'success' : t.status === 'failed' ? 'danger' : t.status === 'escalated' ? 'warning' : 'info';
        html += '<div class="trace-item' + (isActive ? ' active' : '') + '" data-trace="' + t.trace_id + '">';
        html += '<div class="trace-item__id">' + t.trace_id + '</div>';
        html += '<div class="trace-item__title">' + t.update_id + '</div>';
        html += '<div class="trace-item__meta">';
        html += '<span class="badge badge--' + statusBadge + '">' + t.status + '</span>';
        html += '<span>' + t.steps.length + ' steps</span>';
        if (t.total_duration_ms) html += '<span>' + t.total_duration_ms + 'ms</span>';
        html += '</div></div>';
      });
      html += '</div>';

      // Timeline panel
      html += '<div class="trace__timeline scroll-area" id="trace-timeline">';
      if (this.selectedTraceId) {
        var trace = Trace.getTrace(this.selectedTraceId);
        if (trace) html += this._renderTrace(trace, agents);
      } else if (allTraces.length > 0) {
        this.selectedTraceId = allTraces[0].trace_id;
        html += this._renderTrace(allTraces[0], agents);
      } else {
        html += '<div class="empty-state"><div class="empty-state__icon"><i data-lucide="mouse-pointer-click"></i></div><div class="empty-state__title">Select a trace</div></div>';
      }
      html += '</div>';
      html += '</div></div>';
      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      // Bind events
      container.querySelectorAll('.trace-item').forEach(function (item) {
        item.addEventListener('click', function () {
          self.selectedTraceId = item.dataset.trace;
          self.render(container);
        });
      });
      container.querySelectorAll('.trace-step__header').forEach(function (hdr) {
        hdr.addEventListener('click', function () {
          hdr.closest('.trace-step__card').classList.toggle('expanded');
        });
      });
    },
    _renderTrace: function (trace, agents) {
      var html = '<div class="trace__header">';
      html += '<div><h3 style="margin:0;font-size:18px">Trace: ' + trace.trace_id + '</h3>';
      html += '<div style="color:var(--text-muted);font-size:13px;margin-top:4px">Update: ' + trace.update_id + '</div></div>';
      html += '<div style="display:flex;gap:8px">';
      html += '<button class="btn btn--secondary btn--sm" onclick="window.AppCore.Helpers.downloadJSON(window.AppCore.TraceLogger.getTrace(\'' + trace.trace_id + '\'),\'' + trace.trace_id + '.json\')"><i data-lucide="download"></i> Export JSON</button>';
      html += '</div></div>';

      // Summary cards
      html += '<div class="trace__summary">';
      html += '<div class="trace__summary-card"><div class="trace__summary-value">' + trace.steps.length + '</div><div class="trace__summary-label">Steps</div></div>';
      html += '<div class="trace__summary-card"><div class="trace__summary-value">' + (trace.total_duration_ms || '—') + 'ms</div><div class="trace__summary-label">Duration</div></div>';
      var finalDec = trace.final_decision ? trace.final_decision.action : '—';
      html += '<div class="trace__summary-card"><div class="trace__summary-value" style="font-size:14px">' + finalDec + '</div><div class="trace__summary-label">Decision</div></div>';
      var avgConf = trace.steps.length ? (trace.steps.reduce(function (s, st) { return s + (st.confidence || 0); }, 0) / trace.steps.length * 100).toFixed(0) : '—';
      html += '<div class="trace__summary-card"><div class="trace__summary-value">' + avgConf + '%</div><div class="trace__summary-label">Avg Confidence</div></div>';
      html += '</div>';

      // Steps timeline
      trace.steps.forEach(function (step, i) {
        var agent = agents.find(function (a) { return a.id === step.agent_id; });
        html += '<div class="trace-step">';
        html += '<div class="trace-step__dot trace-step__dot--' + (step.status || 'success') + '">' + (i + 1) + '</div>';
        html += '<div class="trace-step__card">';

        // Header
        html += '<div class="trace-step__header">';
        html += '<div class="trace-step__agent"><span class="trace-step__agent-icon"><i data-lucide="' + (agent ? agent.icon : 'bot') + '"></i></span>';
        html += '<span class="trace-step__agent-name">' + (step.agent_name || step.agent_id) + '</span>';
        html += '<span class="trace-step__action">' + H.sanitizeHTML(step.action || '') + '</span></div>';
        html += '<div class="trace-step__right">';
        if (step.confidence !== undefined) {
          var confColor = step.confidence >= 0.8 ? 'var(--success)' : step.confidence >= 0.6 ? 'var(--warning)' : 'var(--danger)';
          html += '<span style="font-size:11px;color:' + confColor + ';font-weight:600">' + (step.confidence * 100).toFixed(0) + '%</span>';
        }
        if (step.duration_ms) html += '<span class="trace-step__duration">' + step.duration_ms + 'ms</span>';
        html += '<span class="trace-step__expand"><i data-lucide="chevron-down"></i></span>';
        html += '</div></div>';

        // Detail (collapsed)
        html += '<div class="trace-step__detail"><div class="trace-step__detail-content">';
        if (step.reasoning) {
          html += '<div class="trace-step__reasoning">' + H.sanitizeHTML(step.reasoning) + '</div>';
        }
        html += '<div class="trace-step__io-grid">';
        html += '<div><div class="trace-step__io-title">Inputs</div><div class="json-viewer">' + self._formatJSON(step.inputs) + '</div></div>';
        html += '<div><div class="trace-step__io-title">Outputs</div><div class="json-viewer">' + self._formatJSON(step.outputs) + '</div></div>';
        html += '</div></div></div>';

        html += '</div></div>';
      });

      return html;
    },
    _formatJSON: function (obj) {
      if (!obj) return '<span class="json-null">null</span>';
      try {
        var str = JSON.stringify(obj, null, 2);
        return str.replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
          .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
          .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
          .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
          .replace(/: (null)/g, ': <span class="json-null">$1</span>');
      } catch (e) { return String(obj); }
    }
  };

  /* ═══════════════════════════════════════════════════════════
     POLICY REPOSITORY VIEW
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.policy = {
    selectedId: null,
    searchQuery: '',
    deptFilter: 'all',
    statusFilter: 'all',
    diffMode: false,
    remediationLogs: {},

    setSearch: function(query) {
      this.searchQuery = query.toLowerCase();
      var container = document.getElementById('view-container');
      if (container) this.render(container);
      var input = document.getElementById('policy-search-input');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    },
    setDeptFilter: function(dept) {
      this.deptFilter = dept;
      var container = document.getElementById('view-container');
      if (container) this.render(container);
    },
    setStatusFilter: function(status) {
      this.statusFilter = status;
      var container = document.getElementById('view-container');
      if (container) this.render(container);
    },
    toggleDiffView: function() {
      this.diffMode = !this.diffMode;
      var container = document.getElementById('view-container');
      if (container) this.render(container);
    },
    approvePolicy: function(policyId) {
      var self = this;
      fetch('/api/policies/' + encodeURIComponent(policyId) + '/approve', {
        method: 'POST'
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.error) {
          window.AppCore.App.showToast('error', 'Approval Failed', data.error);
          return;
        }
        var State = window.AppCore.StateManager;
        var policies = State.getByPath('policies') || [];
        var pol = policies.find(function(p) { return p.policy_id === policyId; });
        if (pol) {
          pol.status = 'active';
          if (pol.sections) {
            pol.sections.forEach(function(s) { s.status = 'compliant'; });
          }
        }
        State.setState('policies', policies);
        if (window.APP_DATA && window.APP_DATA.policies) {
          var appPol = window.APP_DATA.policies.find(function(p) { return p.policy_id === policyId; });
          if (appPol) {
            appPol.status = 'active';
            if (appPol.sections) appPol.sections.forEach(function(s) { s.status = 'compliant'; });
          }
        }
        
        self.diffMode = false;
        if (window.AppCore.App.updateNotifBadge) window.AppCore.App.updateNotifBadge();
        window.AppCore.App.showToast('success', 'Policy Published & Active', policyId + ' has been approved and published to active production baseline.');
        
        var container = document.getElementById('view-container');
        if (container) self.render(container);
      })
      .catch(function(err) {
        console.error(err);
        window.AppCore.App.showToast('error', 'Error', 'Failed to approve policy.');
      });
    },
    addManualClause: function(policyId) {
      var self = this;
      var State = window.AppCore.StateManager;
      var policies = State.getByPath('policies') || [];
      var pol = policies.find(function(p) { return p.policy_id === policyId; });
      if (!pol) return;
      
      if (!pol.sections) pol.sections = [];
      pol.sections.push({
        title: 'New Manual Addendum',
        content: 'Enter your clause text here...',
        text: 'Enter your clause text here...',
        status: 'needs_review'
      });
      pol.status = 'under_review';
      
      fetch('/api/policies/' + encodeURIComponent(policyId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: pol.status,
          sections: pol.sections
        })
      })
      .then(function() {
        window.AppCore.App.showToast('info', 'Manual Clause Added', 'New clause appended. You can now edit its contents.');
        var container = document.getElementById('view-container');
        if (container) self.render(container);
        
        // Auto-scroll and auto-open editor for the new clause
        setTimeout(function() {
          var containerEl = document.querySelector('.policy__detail');
          if (containerEl) {
            containerEl.scrollTo({ top: containerEl.scrollHeight, behavior: 'smooth' });
          }
          
          var newSecIndex = pol.sections.length - 1;
          var newSecId = pol.policy_id.replace(/[^a-zA-Z0-9]/g, '') + '-' + newSecIndex;
          var editorEl = document.getElementById('editor-' + newSecId);
          var viewEl = document.getElementById('view-' + newSecId);
          if (editorEl && viewEl) {
            editorEl.style.display = 'block';
            viewEl.style.display = 'none';
          }
        }, 100);
      });
    },
    revertPolicy: function(policyId) {
      if (!confirm('Are you sure you want to discard AI amendments and revert this policy to its clean baseline?')) return;
      var self = this;
      fetch('/api/policies/' + encodeURIComponent(policyId) + '/revert', {
        method: 'POST'
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        fetch('/api/policies')
          .then(function(r) { return r.json(); })
          .then(function(pols) {
            window.AppCore.StateManager.setState('policies', pols);
            if (window.APP_DATA) window.APP_DATA.policies = pols;
            self.diffMode = false;
            window.AppCore.App.showToast('info', 'Policy Reverted', 'AI amendments discarded. Restored clean baseline.');
            var container = document.getElementById('view-container');
            if (container) self.render(container);
          });
      })
      .catch(function(err) {
        console.error(err);
        window.AppCore.App.showToast('error', 'Error', 'Failed to revert policy.');
      });
    },
    acceptSection: function(policyId, secIndex) {
      var self = this;
      var State = window.AppCore.StateManager;
      var policies = State.getByPath('policies') || [];
      var pol = policies.find(function(p) { return p.policy_id === policyId; });
      if (!pol || !pol.sections || !pol.sections[secIndex]) return;
      
      pol.sections[secIndex].status = 'compliant';
      var hasReview = pol.sections.some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
      if (!hasReview) pol.status = 'active';

      fetch('/api/policies/' + encodeURIComponent(policyId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: pol.status,
          sections: pol.sections
        })
      })
      .then(function() {
        window.AppCore.App.showToast('success', 'Section Approved', 'Section marked compliant and signed off.');
        var container = document.getElementById('view-container');
        if (container) self.render(container);
      });
    },
    discardSection: function(policyId, secIndex) {
      if (!confirm('Discard and remove this drafted section?')) return;
      var self = this;
      var State = window.AppCore.StateManager;
      var policies = State.getByPath('policies') || [];
      var pol = policies.find(function(p) { return p.policy_id === policyId; });
      if (!pol || !pol.sections) return;
      
      pol.sections.splice(secIndex, 1);
      var hasReview = pol.sections.some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
      if (!hasReview) pol.status = 'active';

      fetch('/api/policies/' + encodeURIComponent(policyId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: pol.status,
          sections: pol.sections
        })
      })
      .then(function() {
        window.AppCore.App.showToast('info', 'Section Discarded', 'Drafted section removed.');
        var container = document.getElementById('view-container');
        if (container) self.render(container);
      });
    },
    saveSectionEdit: function(policyId, secIndex, textareaId, secId) {
      var self = this;
      var textarea = document.getElementById(textareaId);
      var titleInput = document.getElementById('title-' + secId);
      if (!textarea) return;
      var newText = textarea.value;
      var newTitle = titleInput ? titleInput.value : null;
      
      var State = window.AppCore.StateManager;
      var policies = State.getByPath('policies') || [];
      var pol = policies.find(function(p) { return p.policy_id === policyId; });
      if (!pol || !pol.sections || !pol.sections[secIndex]) return;
      
      pol.sections[secIndex].text = newText;
      pol.sections[secIndex].content = newText;
      if (newTitle) pol.sections[secIndex].title = newTitle;
      pol.sections[secIndex].status = 'compliant';
      
      var hasReview = pol.sections.some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
      if (!hasReview) pol.status = 'active';

      fetch('/api/policies/' + encodeURIComponent(policyId), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: pol.status,
          sections: pol.sections
        })
      })
      .then(function() {
        window.AppCore.App.showToast('success', 'Changes Saved & Approved', 'Section updated and marked compliant in database.');
        var container = document.getElementById('view-container');
        if (container) self.render(container);
      });
    },
    handleFileUpload: function(event) {
      var file = event.target.files[0];
      if (!file) return;
      var dropzone = document.getElementById('policy-dropzone');
      if (dropzone) dropzone.style.display = 'flex';
      
      var formData = new FormData();
      formData.append('document', file);
      
      fetch('/api/upload-policy', {
        method: 'POST',
        body: formData
      })
      .then(res => res.json())
      .then(data => {
        if (dropzone) dropzone.style.display = 'none';
        if (data.error) {
          window.AppCore.App.showToast('error', 'Upload Failed', data.error);
        } else if (data.success && data.policy) {
          window.AppCore.App.showToast('success', 'Policy Added', 'Successfully parsed and added ' + data.policy.title);
          if (!window.APP_DATA.policies) window.APP_DATA.policies = [];
          window.APP_DATA.policies.push(data.policy);
          window.AppCore.Router.navigate('policy');
        }
      })
      .catch(err => {
        if (dropzone) dropzone.style.display = 'none';
        window.AppCore.App.showToast('error', 'Upload Error', 'Failed to process document.');
        console.error(err);
      });
    },
    render: function(container) { return this._renderPolicyRepository(container); },
    _renderPolicyRepository: function (container) {
      console.log("Rendering Policy Repository");
      var self = this;
      
      var policies = window.AppCore.StateManager.getByPath('policies') || [];
      var allDepts = Array.from(new Set(policies.map(function (p) { return p.department; })));

      var underReviewCount = policies.filter(function(p) {
        return p.status === 'under_review' || (p.sections || []).some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
      }).length;
      var activeCount = policies.filter(function(p) { return p.status === 'active'; }).length;

      var allPolicies = policies;
      var filteredPolicies = allPolicies;
      if (this.searchQuery) {
        var sq = this.searchQuery;
        filteredPolicies = filteredPolicies.filter(function(p) {
          return (p.title || '').toLowerCase().indexOf(sq) !== -1 || (p.policy_id || '').toLowerCase().indexOf(sq) !== -1;
        });
      }
      if (this.deptFilter && this.deptFilter !== 'all') {
        var df = this.deptFilter;
        filteredPolicies = filteredPolicies.filter(function(p) {
          return (p.department || '').toLowerCase() === df.toLowerCase();
        });
      }
      if (this.statusFilter === 'under_review') {
        filteredPolicies = filteredPolicies.filter(function(p) {
          return p.status === 'under_review' || (p.sections || []).some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
        });
      } else if (this.statusFilter === 'active') {
        filteredPolicies = filteredPolicies.filter(function(p) {
          return p.status === 'active' && !(p.sections || []).some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
        });
      }

      var html = '<div class="policy animate-slide-up">';
      html += '<div class="policy__layout">';

      // --- Left Column: List Panel ---
      html += '<div class="policy__list-panel scroll-area">';
      
      // Filter bar HTML
      html += '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">';
      html += '  <div style="position:relative;width:100%;">';
      html += '    <i data-lucide="search" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);width:16px;height:16px;color:var(--text-muted);"></i>';
      html += '    <input id="policy-search-input" type="text" placeholder="Search policies..." value="' + H.sanitizeHTML(self.searchQuery) + '" oninput="window.AppCore.Views.policy.setSearch(this.value)" style="width:100%;height:38px;padding:0 14px 0 40px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-family:inherit;font-size:13px;outline:none;">';
      html += '  </div>';
      
      // Status Filter Pills
      html += '  <div class="policy-status-filter">';
      html += '    <button class="policy-status-tab ' + (self.statusFilter === 'all' ? 'active' : '') + '" onclick="window.AppCore.Views.policy.setStatusFilter(\'all\')">All (' + policies.length + ')</button>';
      html += '    <button class="policy-status-tab policy-status-tab--warning ' + (self.statusFilter === 'under_review' ? 'active' : '') + '" onclick="window.AppCore.Views.policy.setStatusFilter(\'under_review\')">⚠️ Review (' + underReviewCount + ')</button>';
      html += '    <button class="policy-status-tab ' + (self.statusFilter === 'active' ? 'active' : '') + '" onclick="window.AppCore.Views.policy.setStatusFilter(\'active\')">✓ Active (' + activeCount + ')</button>';
      html += '  </div>';

      html += '  <div style="display:flex;gap:12px;align-items:center;width:100%;">';
      html += '    <select onchange="window.AppCore.Views.policy.setDeptFilter(this.value)" style="flex:1;height:38px;padding:0 36px 0 14px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:var(--radius-sm);color:var(--text-primary);font-family:inherit;font-size:13px;outline:none;appearance:none;-webkit-appearance:none;min-width:0;">';
      html += '      <option value="all"' + (self.deptFilter === 'all' ? ' selected' : '') + '>All Departments</option>';
      allDepts.forEach(function (dept) {
        var isSel = self.deptFilter === dept;
        html += '      <option value="' + dept.replace(/'/g, "\\'") + '"' + (isSel ? ' selected' : '') + '>' + dept + '</option>';
      });
      html += '    </select>';
      
      html += '    <input type="file" id="policy-pdf-upload" accept="application/pdf" style="display:none" onchange="window.AppCore.Views.policy.handleFileUpload(event)">';
      html += '    <button class="btn btn--secondary" id="btn-upload-pdf" onclick="document.getElementById(\'policy-pdf-upload\').click()" style="padding:0 !important; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;" title="Upload PDF Policy"><i data-lucide="upload" style="width:16px;height:16px;"></i></button>';
      html += '    <button class="btn btn--primary" id="btn-new-policy" style="padding:0 !important; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0;" title="Log New Policy"><i data-lucide="plus" style="width:16px;height:16px;"></i></button>';
      html += '  </div>';
      html += '</div>';
      
      // Dropzone
      html += '<div id="policy-dropzone" style="display:none; flex-direction:column; align-items:center; justify-content:center; padding:40px; border:2px dashed var(--accent); border-radius:12px; background:rgba(225,29,72,0.05); color:var(--text-primary); transition:all 0.3s; margin-bottom:16px;">';
      html += '<i data-lucide="file-text" style="width:32px;height:32px;color:var(--accent);margin-bottom:12px;"></i>';
      html += '<div style="font-size:14px;font-weight:600;">Processing PDF Document...</div>';
      html += '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">Extracting text and running AI analysis</div>';
      html += '</div>';
      
      // Policy Items
      if (filteredPolicies.length === 0) {
        html += '<div style="padding:40px; text-align:center; color:var(--text-muted); font-size:14px; background:rgba(255,255,255,0.01); border:1px dashed var(--border); border-radius:12px;">No matching policies found</div>';
      } else {
        filteredPolicies.forEach(function (p) {
          var isActive = self.selectedId === p.policy_id;
          var hasReview = p.status === 'under_review' || (p.sections || []).some(function(s) { return s.status === 'needs_review' || s.status === 'added_by_ai'; });
          var statusColor = hasReview ? 'warning' : 'success';
          var statusLabel = hasReview ? 'UNDER REVIEW' : 'ACTIVE';
          
          html += '<div class="policy-item' + (isActive ? ' active' : '') + '" data-id="' + p.policy_id + '" style="display:block; width:100%;' + (hasReview ? 'border-left: 3px solid #f59e0b;' : '') + '">';
          html += '<div class="policy-item__id">' + p.policy_id + '</div>';
          html += '<div class="policy-item__title">' + p.title + '</div>';
          html += '<div class="policy-item__meta">';
          html += '<span class="badge badge--' + statusColor + '">' + statusLabel + '</span>';
          html += '<span>v' + p.version + '</span>';
          html += '<span>' + p.department + '</span>';
          html += '</div></div>';
        });
      }
      
      html += '</div>'; // /policy__list-panel

      // --- Right Column: Detail Panel ---
      html += '<div class="policy__detail scroll-area">';
      if (this.selectedId === 'new') {
        html += this._renderNewPolicyForm();
      } else if (this.selectedId) {
        var pol = policies.find(function (x) { return x.policy_id === self.selectedId; });
        if (pol) html += this._renderPolicy(pol);
      } else {
        html += '<div class="feed__detail-empty"><div class="feed__empty-orb"><div class="feed__empty-rings"></div><i data-lucide="book-open" style="width:32px;height:32px;color:var(--text-white);position:relative;z-index:2;"></i></div><div class="feed__empty-title">Awaiting Selection</div><div class="feed__empty-subtitle">Select a policy to view metadata, review tracked changes, and approve drafts.</div></div>';
      }
      html += '</div>'; // /policy__detail
      
      html += '</div>'; // /policy__layout
      html += '</div>'; // /policy
      
      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();

      container.querySelectorAll('.policy-item').forEach(function (item) {
        item.addEventListener('click', function () {
          self.selectedId = item.dataset.id;
          self.render(container);
        });
      });

      var btnNew = container.querySelector('#btn-new-policy');
      if (btnNew) {
        btnNew.addEventListener('click', function() {
          self.selectedId = 'new';
          self.render(container);
        });
      }
    },
    _renderNewPolicyForm: function() {
      var html = '<div class="policy__detail-header">';
      html += '<div class="policy__detail-title">Log New Internal Policy</div>';
      html += '</div>';
      html += '<div style="padding:var(--sp-6)">';
      
      html += '<div style="margin-bottom:16px;">';
      html += '<label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;">Policy Title</label>';
      html += '<input type="text" id="new-pol-title" class="form-input" style="width:100%;" placeholder="e.g. Employee Data Handling Policy">';
      html += '</div>';

      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">';
      html += '<div>';
      html += '<label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;">Department</label>';
      html += '<input type="text" id="new-pol-dept" class="form-input" style="width:100%;" placeholder="e.g. Compliance">';
      html += '</div>';
      html += '<div>';
      html += '<label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;">Policy ID (Optional)</label>';
      html += '<input type="text" id="new-pol-id" class="form-input" style="width:100%;" placeholder="e.g. POL-EMP-001">';
      html += '</div>';
      html += '</div>';

      html += '<div style="margin-bottom:20px;">';
      html += '<label style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px;font-weight:600;text-transform:uppercase;">Initial Policy Text</label>';
      html += '<textarea id="new-pol-content" class="form-input" style="width:100%;min-height:160px;font-family:inherit;padding:12px;" placeholder="Paste standard operating procedures, guidelines, or requirements..."></textarea>';
      html += '</div>';

      html += '<button class="btn btn--primary" onclick="window.AppCore.Views.policy.saveNewPolicy()"><i data-lucide="check" style="width:16px;height:16px;"></i> Create & Activate Policy</button>';
      html += '</div>';
      return html;
    },
    saveNewPolicy: function() {
      var self = this;
      var title = document.getElementById('new-pol-title').value || 'Untitled Policy';
      var dept = document.getElementById('new-pol-dept').value || 'General';
      var id = document.getElementById('new-pol-id').value || ('POL-GEN-' + Math.floor(Math.random()*1000));
      var content = document.getElementById('new-pol-content').value || '';
      
      var newPol = {
        policy_id: id,
        title: title,
        department: dept,
        status: 'active',
        version: '1.0',
        summary: 'New policy added manually.',
        sections: [{ id: id + '-1', title: '1. Overview', text: content, status: 'compliant' }]
      };
      
      fetch('/api/policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newPol)
      })
      .then(res => res.json())
      .then(data => {
          if (!window.APP_DATA.policies) window.APP_DATA.policies = [];
          window.APP_DATA.policies.unshift(newPol);
          
          window.AppCore.App.showToast('success', 'Policy Added', 'New policy ' + id + ' logged successfully.');
          self.selectedId = id;
          var container = document.getElementById('view-container');
          if (container) self.render(container);
      })
      .catch(err => console.error("Error saving policy:", err));
    },
    _renderPolicy: function (p) {
      var self = this;
      var isUnderReview = p.status === 'under_review' || (p.sections || []).some(function(s) { 
        return s.status === 'needs_review' || s.status === 'added_by_ai'; 
      });
      var reviewSectionsCount = (p.sections || []).filter(function(s) {
        return s.status === 'needs_review' || s.status === 'added_by_ai';
      }).length;

      var html = '<div class="policy__detail-header">';
      html += '  <div class="policy-header-meta-row">';
      html += '    <div class="policy-meta-badges">';
      html += '      <span class="policy-pill policy-pill--id"><i data-lucide="shield" style="width:12px;height:12px"></i> ' + H.sanitizeHTML(p.policy_id) + '</span>';
      html += '      <span class="policy-pill policy-pill--dept"><i data-lucide="building-2" style="width:12px;height:12px"></i> ' + H.sanitizeHTML(p.department || 'Enterprise') + '</span>';
      html += '      <span class="policy-pill policy-pill--version">v' + p.version + '</span>';
      if (isUnderReview) {
        html += '    <span class="policy-pill policy-pill--warning"><span class="status-pulse-dot"></span> Under Review</span>';
      } else {
        html += '    <span class="policy-pill policy-pill--success"><i data-lucide="check-circle" style="width:12px;height:12px"></i> Active Baseline</span>';
      }
      html += '    </div>';
      html += '  </div>';
      html += '  <h1 class="policy__detail-title">' + H.sanitizeHTML(p.title) + '</h1>';
      html += '</div>';

      html += '<div class="policy__detail-body">';

      // --- Under Review Banner (Enterprise Action Card) ---
      if (isUnderReview) {
        html += '<div class="policy-review-banner">';
        html += '  <div class="policy-review-banner__top">';
        html += '    <div class="review-status-tag"><i data-lucide="alert-triangle" style="width:13px;height:13px;"></i> Compliance Action Required</div>';
        html += '    <div class="review-version-tag"><i data-lucide="git-branch" style="width:13px;height:13px"></i> Version ' + p.version + ' (Pending Sign-off)</div>';
        html += '  </div>';
        html += '  <div class="policy-review-title">Automated Regulatory Amendments Pending Sign-Off</div>';
        html += '  <div class="policy-review-desc">';
        html += '    This policy was automatically updated to integrate compliance requirements from recent government regulatory changes. ' + (reviewSectionsCount > 0 ? '<strong>' + reviewSectionsCount + ' drafted clause' + (reviewSectionsCount > 1 ? 's' : '') + '</strong> require review and approval.' : 'All clauses have drafted amendments.') + ' Review the diff comparison, fine-tune wording if necessary, or click <strong>Approve & Publish Policy</strong> to activate.';
        html += '  </div>';
        html += '  <div class="policy-review-actions">';
        html += '    <button class="btn btn-review-approve" onclick="window.AppCore.Views.policy.approvePolicy(\'' + p.policy_id + '\')">';
        html += '      <i data-lucide="check-circle-2" style="width:15px;height:15px;"></i> Approve & Publish Policy';
        html += '    </button>';
        html += '    <button class="btn btn-review-diff" onclick="window.AppCore.Views.policy.toggleDiffView()">';
        html += '      <i data-lucide="git-pull-request" style="width:15px;height:15px;"></i> ' + (self.diffMode ? 'Hide Track Changes' : 'View Track Changes & Diff');
        html += '    </button>';
        html += '    <button class="btn btn-review-revert" onclick="window.AppCore.Views.policy.revertPolicy(\'' + p.policy_id + '\')">';
        html += '      <i data-lucide="rotate-ccw" style="width:14px;height:14px;"></i> Discard AI Amendments';
        html += '    </button>';
        html += '  </div>';
        html += '</div>';
      }

      // --- Track Changes / Diff View Panel ---
      if (self.diffMode) {
        var changeHistory = p.change_history || [];
        var baselineVer = '1.0';
        try {
          var vNum = parseFloat(p.version);
          if (vNum > 1.0) baselineVer = (vNum - 0.2).toFixed(1);
        } catch(e) {}

        html += '<div class="policy-diff-card animate-slide-up">';
        html += '  <div class="policy-diff-card__header">';
        html += '    <div style="display:flex;align-items:center;gap:12px;">';
        html += '      <div class="diff-icon-box"><i data-lucide="git-pull-request" style="width:16px;height:16px;color:#38bdf8;"></i></div>';
        html += '      <div>';
        html += '        <div style="font-size:15px;font-weight:700;color:#ffffff;line-height:1.2;">Tracked Regulatory Changes & Amendments</div>';
        html += '        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Audit trail of proposed changes against baseline</div>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div style="display:flex;align-items:center;gap:10px;">';
        html += '      <span class="diff-version-pill"><i data-lucide="git-commit" style="width:12px;height:12px"></i> Baseline v' + baselineVer + ' ➔ In-Review v' + p.version + '</span>';
        html += '      <button class="btn btn--ghost btn--sm" onclick="window.AppCore.Views.policy.toggleDiffView()" style="border-radius:6px;"><i data-lucide="x" style="width:14px;height:14px;"></i> Close Diff</button>';
        html += '    </div>';
        html += '  </div>';

        if (changeHistory.length > 0) {
          changeHistory.forEach(function(ch) {
            html += '<div class="diff-item animate-slide-up" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(56,189,248,0.2); box-shadow: 0 8px 24px rgba(0,0,0,0.3);">';
            html += '  <div class="diff-item__title" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 12px;">';
            html += '    <span style="font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:8px;"><i data-lucide="history" style="width:14px;height:14px;color:#38bdf8;"></i> ' + H.sanitizeHTML(ch.reason || 'Regulatory Amendment') + '</span>';
            html += '    <span style="font-size:11px;color:var(--text-muted);background:rgba(255,255,255,0.05);padding:4px 8px;border-radius:12px;">' + (ch.date || 'Recent') + '</span>';
            html += '  </div>';
            html += '  <div class="diff-grid">';
            html += '    <div class="diff-box diff-del" style="background: rgba(239, 68, 68, 0.05); backdrop-filter: blur(4px);">';
            html += '      <div class="diff-label diff-label--del"><i data-lucide="minus-circle" style="width:12px;height:12px;"></i> Baseline / Previous Text</div>';
            html += '      <div>' + (ch.original_text && ch.original_text.trim() ? H.sanitizeHTML(ch.original_text) : '<em style="opacity:0.6;">(No previous text — newly introduced regulatory clause)</em>') + '</div>';
            html += '    </div>';
            html += '    <div class="diff-box diff-add" style="background: rgba(16, 185, 129, 0.05); backdrop-filter: blur(4px);">';
            html += '      <div class="diff-label diff-label--add"><i data-lucide="plus-circle" style="width:12px;height:12px;"></i> Proposed Remediated Text (In Review)</div>';
            html += '      <div>' + H.sanitizeHTML(ch.new_text || '') + '</div>';
            html += '    </div>';
            html += '  </div>';
            html += '</div>';
          });
        } else {
          // Render diff for sections needing review
          var hasReviewItems = false;
          (p.sections || []).forEach(function(s, idx) {
            if (s.status === 'needs_review' || s.status === 'added_by_ai') {
              hasReviewItems = true;
              var secId = p.policy_id.replace(/[^a-zA-Z0-9]/g, '') + '-' + idx;
              html += '<div class="diff-item animate-slide-up" style="background: rgba(15,23,42,0.6); backdrop-filter: blur(12px); border: 1px solid rgba(56,189,248,0.3); box-shadow: 0 8px 24px rgba(0,0,0,0.3);">';
              html += '  <div class="diff-item__title" style="border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 10px; margin-bottom: 12px;">';
              html += '    <span style="font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:8px;"><i data-lucide="file-text" style="width:14px;height:14px;color:#38bdf8;"></i> ' + H.sanitizeHTML(s.title) + '</span>';
              html += '    <span class="section-review-tag" style="background: rgba(251,191,36,0.15); border: 1px solid rgba(251,191,36,0.3); color:#fbbf24;"><span class="status-pulse-dot"></span> Pending Sign-off</span>';
              html += '  </div>';
              html += '  <div class="diff-grid">';
              html += '    <div class="diff-box diff-del" style="background: rgba(239, 68, 68, 0.05); backdrop-filter: blur(4px);">';
              html += '      <div class="diff-label diff-label--del"><i data-lucide="minus-circle" style="width:12px;height:12px;"></i> Baseline Version</div>';
              html += '      <div><em style="opacity:0.6;">(Clause not present in previous clean baseline)</em></div>';
              html += '    </div>';
              html += '    <div class="diff-box diff-add" style="background: rgba(16, 185, 129, 0.05); backdrop-filter: blur(4px);">';
              html += '      <div class="diff-label diff-label--add"><i data-lucide="plus-circle" style="width:12px;height:12px;"></i> Added by Regulatory AI Engine</div>';
              html += '      <div>' + H.sanitizeHTML(s.text || s.content || '') + '</div>';
              html += '    </div>';
              html += '  </div>';
              html += '  <div style="display:flex; justify-content:flex-end; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.05);">';
              html += '    <button class="btn btn-sec-action btn-sec-edit" onclick="document.getElementById(\'editor-' + secId + '\').style.display=\'block\'; document.getElementById(\'view-' + secId + '\').style.display=\'none\'; window.scrollTo({top: document.getElementById(\'editor-' + secId + '\').offsetTop - 100, behavior: \'smooth\'});" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);"><i data-lucide="edit-3" style="width:12px;height:12px"></i> Edit & Fix</button>';
              html += '    <button class="btn btn-sec-action btn-sec-discard" onclick="window.AppCore.Views.policy.discardSection(\'' + p.policy_id + '\', ' + idx + ')" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#fca5a5;"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Discard</button>';
              html += '    <button class="btn btn-sec-action btn-sec-accept" onclick="window.AppCore.Views.policy.acceptSection(\'' + p.policy_id + '\', ' + idx + ')" style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); color:#6ee7b7;"><i data-lucide="check" style="width:12px;height:12px"></i> Accept Clause</button>';
              html += '  </div>';
              html += '</div>';
            }
          });
          if (!hasReviewItems) {
            html += '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px dashed rgba(255,255,255,0.1);">No pending amendments recorded for this policy.</div>';
          }
        }
        html += '</div>';
      }

      // Metadata Grid
      html += '<div class="policy__detail-info-grid">';
      [['Owner', p.owner || 'Compliance Officer'], ['Department', p.department || 'Enterprise'], ['Last Updated', p.last_updated || 'Today'],
       ['Review Cycle', p.review_cycle || 'Annual'], ['Next Review', p.next_review_date || 'Upcoming'], ['Policy ID', p.policy_id]].forEach(function (f) {
        html += '<div class="policy-meta-card">';
        html += '  <div class="policy-meta-card__label">' + f[0] + '</div>';
        html += '  <div class="policy-meta-card__value">' + H.sanitizeHTML(f[1]) + '</div>';
        html += '</div>';
      });
      html += '</div>';

      // Summary
      html += '<div style="margin-bottom:24px">';
      html += '  <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.06em;margin-bottom:8px">Policy Summary & Scope</div>';
      html += '  <div style="font-size:14px;color:var(--text-secondary);line-height:1.65;background:rgba(255,255,255,0.015);padding:14px 16px;border-radius:8px;border:1px solid rgba(255,255,255,0.05);">' + H.sanitizeHTML(p.summary || '') + '</div>';
      html += '</div>';

      // Policy Sections
      html += '<div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;">';
      html += '  <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.06em;">Policy Clauses & Addendums (' + (p.sections ? p.sections.length : 0) + ')</div>';
      html += '  <div style="display:flex; align-items:center; gap:12px;">';
      if (isUnderReview) {
        html += '  <span style="font-size:11px;color:#fbbf24;font-weight:600;display:inline-flex;align-items:center;gap:5px;"><span class="status-pulse-dot"></span> ' + reviewSectionsCount + ' clause' + (reviewSectionsCount > 1 ? 's' : '') + ' awaiting sign-off</span>';
      }
      html += '    <button class="btn btn--secondary btn--sm" onclick="window.AppCore.Views.policy.addManualClause(\'' + p.policy_id + '\')" style="padding:4px 10px; font-size:11px;"><i data-lucide="plus" style="width:12px;height:12px"></i> Add Manual Clause</button>';
      html += '  </div>';
      html += '</div>';

      if (p.sections) {
        p.sections.forEach(function (s, idx) {
          var secId = p.policy_id.replace(/[^a-zA-Z0-9]/g, '') + '-' + idx;
          var isSecReview = s.status === 'needs_review' || s.status === 'added_by_ai';

          html += '<div class="policy__section' + (isSecReview ? ' policy__section--review' : '') + '">';
          
          // Header with Edit & Review Actions
          html += '<div class="policy__section-header">';
          html += '  <div class="policy__section-title-wrap">';
          html += '    <div class="policy__section-title' + (isSecReview ? ' policy__section-title--review' : '') + '" style="margin-bottom:0;border:none;padding:0;">' + H.sanitizeHTML(s.title) + '</div>';
          if (isSecReview) {
            html += '    <span class="section-review-tag"><i data-lucide="alert-circle" style="width:11px;height:11px"></i> Requires Sign-off</span>';
          }
          html += '  </div>';

          html += '  <div class="section-action-buttons">';
          html += '    <button class="btn btn-sec-action btn-sec-edit" onclick="document.getElementById(\'editor-' + secId + '\').style.display=\'block\'; document.getElementById(\'view-' + secId + '\').style.display=\'none\';"><i data-lucide="edit-3" style="width:12px;height:12px"></i> ' + (isSecReview ? 'Edit & Fix' : 'Edit') + '</button>';
          if (isSecReview) {
            html += '    <button class="btn btn-sec-action btn-sec-accept" onclick="window.AppCore.Views.policy.acceptSection(\'' + p.policy_id + '\', ' + idx + ')"><i data-lucide="check" style="width:12px;height:12px"></i> Accept Clause</button>';
            html += '    <button class="btn btn-sec-action btn-sec-discard" onclick="window.AppCore.Views.policy.discardSection(\'' + p.policy_id + '\', ' + idx + ')"><i data-lucide="trash-2" style="width:12px;height:12px"></i> Discard</button>';
          }
          html += '  </div>';
          html += '</div>';

          // View Mode
          html += '<div id="view-' + secId + '" class="policy__section-content" style="color:var(--text-primary);padding-top:4px;">' + H.sanitizeHTML(s.text || s.content || '') + '</div>';

          // Edit Mode
          html += '<div id="editor-' + secId + '" style="display:none;margin-top:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.1); background:rgba(15,23,42,0.6); backdrop-filter:blur(10px); overflow:hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">';
          
          // Title Input
          html += '  <div style="padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05);">';
          html += '    <input type="text" id="title-' + secId + '" value="' + H.sanitizeHTML(s.title) + '" style="width:100%; background:transparent; border:none; color:var(--text-primary); font-size:14px; font-weight:700; outline:none;" placeholder="Clause Title..." />';
          html += '  </div>';

          // Toolbar
          html += '  <div style="display:flex; gap:6px; padding:8px 12px; background:rgba(255,255,255,0.04); border-bottom:1px solid rgba(255,255,255,0.05); align-items:center;">';
          html += '    <button title="Bold" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="bold" style="width:14px;height:14px"></i></button>';
          html += '    <button title="Italic" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="italic" style="width:14px;height:14px"></i></button>';
          html += '    <button title="Underline" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="underline" style="width:14px;height:14px"></i></button>';
          html += '    <div style="width:1px;height:16px;background:rgba(255,255,255,0.1);margin:0 4px;"></div>';
          html += '    <button title="Bullet List" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="list" style="width:14px;height:14px"></i></button>';
          html += '    <button title="Numbered List" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="list-ordered" style="width:14px;height:14px"></i></button>';
          html += '    <div style="width:1px;height:16px;background:rgba(255,255,255,0.1);margin:0 4px;"></div>';
          html += '    <button title="Link" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;padding:6px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.1)\'" onmouseout="this.style.background=\'transparent\'"><i data-lucide="link" style="width:14px;height:14px"></i></button>';
          html += '    <div style="flex:1"></div>';
          html += '    <button title="AI Assistant: Polish Text" style="background:rgba(56, 189, 248, 0.1);border:1px solid rgba(56, 189, 248, 0.3);color:#38bdf8;cursor:pointer;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;transition:all 0.2s;" onmouseover="this.style.background=\'rgba(56, 189, 248, 0.2)\'" onmouseout="this.style.background=\'rgba(56, 189, 248, 0.1)\'"><i data-lucide="sparkles" style="width:12px;height:12px"></i> AI Polish</button>';
          html += '  </div>';

          // Textarea
          html += '  <textarea id="textarea-' + secId + '" style="width:100%;min-height:180px;background:transparent;color:var(--text-primary);border:none;padding:16px;font-family:\'Inter\', sans-serif;font-size:13px;line-height:1.7;outline:none;resize:vertical;box-sizing:border-box;">' + (s.text || s.content || '') + '</textarea>';
          
          // Footer
          html += '  <div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;background:rgba(0,0,0,0.15);border-top:1px solid rgba(255,255,255,0.05);">';
          html += '    <button class="btn btn--ghost btn--sm" style="border-radius:6px;" onclick="document.getElementById(\'editor-' + secId + '\').style.display=\'none\'; document.getElementById(\'view-' + secId + '\').style.display=\'block\';">Cancel</button>';
          html += '    <button class="btn btn--primary btn--sm" style="border-radius:6px;background:#059669;border-color:#10b981;" onclick="window.AppCore.Views.policy.saveSectionEdit(\'' + p.policy_id + '\', ' + idx + ', \'textarea-' + secId + '\', \'' + secId + '\')"><i data-lucide="save" style="width:13px;height:13px"></i> Save & Mark Compliant</button>';
          html += '  </div>';
          html += '</div>';
          
          html += '</div>';
        });
      }

      // Applicable regulations
      html += '<div style="margin-top:20px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">Applicable Regulations</div>';
      (p.applicable_regulations || []).forEach(function (r) { html += '<span class="tag" style="margin:2px">' + H.sanitizeHTML(r) + '</span>'; });
      html += '</div>';

      // Business lines
      html += '<div style="margin-top:12px"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px">Business Lines</div>';
      (p.business_lines || []).forEach(function (b) { html += '<span class="tag tag--accent" style="margin:2px">' + H.sanitizeHTML(b) + '</span>'; });
      html += '</div>';

      // Version History Timeline
      html += '<div style="margin-top:40px; padding-top:24px; border-top:1px solid rgba(255,255,255,0.05);">';
      html += '  <div style="font-size:12px;font-weight:800;text-transform:uppercase;color:var(--text-muted);letter-spacing:0.06em;margin-bottom:20px;display:flex;align-items:center;gap:8px;"><i data-lucide="git-commit" style="width:14px;height:14px"></i> Version History & Regulatory Timeline</div>';
      
      html += '  <div class="policy-timeline" style="position:relative; padding-left:20px; margin-left:8px; border-left:2px solid rgba(255,255,255,0.1); display:flex; flex-direction:column; gap:24px;">';
      
      var hist = p.change_history || [];
      // Display the most recent 4 updates based on date
      var timelineItems = hist.slice().sort(function(a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); }).slice(0, 4);

      if (timelineItems.length > 0) {
        timelineItems.forEach(function(item) {
          var versionDisplay = item.version ? 'Version ' + item.version : 'Pending Update';
          var triggerDisplay = item.regulatory_trigger || 'Regulatory Alignment';
          var summaryDisplay = item.summary || item.reason || 'Policy was automatically updated and flagged for review based on new regulations.';
          
          html += '    <div style="position:relative;">';
          html += '      <div style="position:absolute; left:-25px; top:6px; width:10px; height:10px; border-radius:50%; background:var(--accent); border:2px solid #0f172a; box-shadow: 0 0 8px var(--accent);"></div>';
          html += '      <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">';
          html += '        <span style="font-size:14px; font-weight:700; color:#f8fafc;">' + versionDisplay + '</span>';
          html += '        <span style="font-size:11px; font-weight:600; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:3px 10px; border-radius:12px;">' + (item.date || 'Recent') + '</span>';
          html += '      </div>';
          html += '      <div style="font-size:12px; color:#38bdf8; font-weight:600; margin-bottom:8px; display:flex; align-items:center; gap:6px;"><i data-lucide="scale" style="width:12px;height:12px;"></i> ' + triggerDisplay + '</div>';
          html += '      <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:8px; border:1px solid rgba(255,255,255,0.05);">' + summaryDisplay + '</div>';
          html += '    </div>';
        });
      }

      // Original Baseline
      html += '    <div style="position:relative;">';
      html += '      <div style="position:absolute; left:-25px; top:4px; width:10px; height:10px; border-radius:50%; background:var(--text-muted); border:2px solid #0f172a;"></div>';
      html += '      <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">';
      html += '        <span style="font-size:13px; font-weight:700; color:var(--text-muted);">Baseline (v1.0)</span>';
      html += '      </div>';
      html += '      <div style="font-size:13px; color:var(--text-secondary); line-height:1.5;">Original internal policy established. <a href="#" style="color:#38bdf8; text-decoration:none; margin-left:8px; font-weight:500;" onclick="var el = document.getElementById(\'baseline-text-' + p.policy_id + '\'); el.style.display = el.style.display === \'none\' ? \'block\' : \'none\'; this.innerHTML = el.style.display === \'none\' ? \'View Original Text &rarr;\' : \'Hide Original Text &uarr;\'; return false;">View Original Text &rarr;</a></div>';
      
      var baselineText = p.sections.map(function(s) { 
        return '<div style="margin-bottom:12px;"><strong>' + H.sanitizeHTML(s.title) + '</strong><br/>' + H.sanitizeHTML(s.content) + '</div>'; 
      }).join('');
      
      html += '      <div id="baseline-text-' + p.policy_id + '" style="display:none; margin-top:12px; font-size:13px; color:var(--text-secondary); line-height:1.6; background:rgba(255,255,255,0.02); padding:16px; border-radius:8px; border:1px solid rgba(255,255,255,0.05); max-height:300px; overflow-y:auto; box-shadow:inset 0 2px 10px rgba(0,0,0,0.2);">';
      html += '        <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:12px;letter-spacing:0.05em;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">Original Policy Text (v1.0 Baseline Approximation)</div>';
      html += '        ' + baselineText;
      html += '      </div>';
      html += '    </div>';

      html += '  </div>';
      html += '</div>';

      html += '</div>';
      return html;
    }
  };

  /* ═══════════════════════════════════════════════════════════
     ESCALATION QUEUE VIEW
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.escalation = {
    render: function (container) {
      var queue = State.getByPath('escalationQueue') || [];
      var pending = queue.filter(function (e) { return e.status === 'pending'; });
      var resolved = queue.filter(function (e) { return e.status === 'resolved'; });

      var html = '<div class="escalation animate-slide-up">';
      html += '<div class="escalation__header">';
      html += '<div class="escalation__stats">';
      html += '<div class="escalation__stat"><span class="escalation__stat-value" style="color:var(--warning)">' + pending.length + '</span> Pending</div>';
      html += '<div class="escalation__stat"><span class="escalation__stat-value" style="color:var(--success)">' + resolved.length + '</span> Resolved</div>';
      html += '</div></div>';

      if (queue.length === 0) {
        html += '<div class="card"><div class="empty-state"><div class="empty-state__icon"><i data-lucide="check-circle" style="width:48px;height:48px;color:var(--success)"></i></div>';
        html += '<div class="empty-state__title">No Escalations</div>';
        html += '<div class="empty-state__text">Process regulatory updates to see escalations appear here.</div></div></div>';
      } else {
        html += '<div class="escalation__list">';
        queue.forEach(function (esc) {
          var isPending = esc.status === 'pending';
          var slaMs = new Date(esc.sla_deadline) - Date.now();
          var slaHrs = Math.max(0, (slaMs / 3600000)).toFixed(1);
          var slaClass = slaMs < 0 ? 'critical' : slaMs < 3600000 ? 'warning' : 'ok';

          html += '<div class="escalation-card">';
          html += '<div class="escalation-card__header">';
          html += '<div class="escalation-card__title-group">';
          html += '<div class="escalation-card__title">' + H.sanitizeHTML(esc.title || esc.update_id) + '</div>';
          html += '<div class="escalation-card__subtitle">' + esc.escalation_id + ' • ' + (esc.source || 'Unknown Source') + '</div>';
          html += '</div>';
          html += '<div class="escalation-card__sla escalation-card__sla--' + slaClass + '">';
          html += '<span class="escalation-card__sla-icon"><i data-lucide="clock" style="width:14px;height:14px"></i></span>';
          html += '<span class="escalation-card__sla-time">' + (slaMs < 0 ? 'OVERDUE' : slaHrs + 'h remaining') + '</span>';
          html += '</div>';
          html += '<span class="badge badge--' + (isPending ? 'warning' : 'success') + '">' + esc.status + '</span>';
          html += '</div>';

          html += '<div class="escalation-card__body">';
          html += '<div class="escalation-card__details">';
          html += '<div class="escalation-card__detail-item"><div class="escalation-card__detail-label">Risk Score</div><div class="escalation-card__detail-value" style="color:' + H.getRiskColor(esc.risk_score) + '">' + esc.risk_score + '/100 (' + (esc.risk_category || 'N/A') + ')</div></div>';
          html += '<div class="escalation-card__detail-item"><div class="escalation-card__detail-label">Assigned To</div><div class="escalation-card__detail-value">' + esc.assigned_reviewer + '</div></div>';
          html += '<div class="escalation-card__detail-item"><div class="escalation-card__detail-label">Created</div><div class="escalation-card__detail-value">' + H.formatRelativeTime(esc.created_at) + '</div></div>';
          html += '</div>';

          if (esc.reason) {
            html += '<div class="escalation-card__reasoning"><div class="escalation-card__reasoning-title">Escalation Reason</div>';
            html += '<div class="escalation-card__reasoning-text">' + H.sanitizeHTML(esc.reason) + '</div></div>';
          }

          if (esc.resolution) {
            html += '<div style="padding:12px;background:var(--success-bg);border-radius:8px;border:1px solid var(--success-border)">';
            html += '<div style="font-size:12px;font-weight:600;color:var(--success)">Resolution: ' + esc.resolution.action + '</div>';
            html += '<div style="font-size:13px;color:var(--text-secondary);margin-top:4px">' + H.sanitizeHTML(esc.resolution.comment || '') + '</div>';
            html += '</div>';
          }
          html += '</div>';

          if (isPending) {
            html += '<div class="escalation-card__footer">';
            html += '<input class="input escalation-card__comment" placeholder="Add review comment..." id="comment-' + esc.escalation_id + '">';
            html += '<div class="escalation-card__actions">';
            html += '<button class="btn btn--success btn--sm" onclick="window.AppCore.App.resolveEscalation(\'' + esc.escalation_id + '\',\'APPROVED\',document.getElementById(\'comment-' + esc.escalation_id + '\').value)"><i data-lucide="check" style="width:14px;height:14px"></i> Approve</button>';
            html += '<button class="btn btn--danger btn--sm" onclick="window.AppCore.App.resolveEscalation(\'' + esc.escalation_id + '\',\'REJECTED\',document.getElementById(\'comment-' + esc.escalation_id + '\').value)"><i data-lucide="x" style="width:14px;height:14px"></i> Reject</button>';
            html += '<button class="btn btn--secondary btn--sm" onclick="window.AppCore.App.resolveEscalation(\'' + esc.escalation_id + '\',\'MODIFIED\',document.getElementById(\'comment-' + esc.escalation_id + '\').value)"><i data-lucide="edit-2" style="width:14px;height:14px"></i> Modify</button>';
            html += '</div></div>';
          }
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
      container.innerHTML = html;
    }
  };

  /* ═══════════════════════════════════════════════════════════
     AUDIT TRAIL VIEW
     ═══════════════════════════════════════════════════════════ */
  window.AppCore.Views.audit = {
    filter: 'all',
    render: function (container) {
      var self = this;
      var log = State.getByPath('auditLog') || [];
      var agents = (window.APP_DATA && window.APP_DATA.agentDefinitions) || [];
      var filtered = this.filter === 'all' ? log : log.filter(function (e) { return e.agent_id === self.filter; });

      var html = '<div class="audit animate-slide-up">';
      html += '<div class="audit__header">';
      html += '<h2 style="margin:0;font-size:20px;font-weight:700">Audit Trail</h2>';
      html += '<div style="display:flex;gap:8px">';
      html += '<button class="btn btn--secondary btn--sm" onclick="window.AppCore.App.generateReport()"><i data-lucide="file-text" style="width:14px;height:14px"></i> Generate Report</button>';
      html += '<button class="btn btn--secondary btn--sm" onclick="window.AppCore.Helpers.downloadJSON(window.AppCore.StateManager.getByPath(\'auditLog\'),\'audit-log.json\')"><i data-lucide="download" style="width:14px;height:14px"></i> Export JSON</button>';
      html += '</div></div>';

      // Stats
      html += '<div class="audit__stats-bar">';
      html += '<div class="audit__stat"><span class="audit__stat-value">' + log.length + '</span><span class="audit__stat-label"> total entries</span></div>';
      var errors = log.filter(function (e) { return e.severity === 'error'; }).length;
      html += '<div class="audit__stat"><span class="audit__stat-value" style="color:var(--danger)">' + errors + '</span><span class="audit__stat-label"> errors</span></div>';
      var warnings = log.filter(function (e) { return e.severity === 'warning'; }).length;
      html += '<div class="audit__stat"><span class="audit__stat-value" style="color:var(--warning)">' + warnings + '</span><span class="audit__stat-label"> warnings</span></div>';
      html += '</div>';

      // Agent filter chips
      html += '<div class="audit__filters">';
      html += '<span class="audit__filter-chip' + (this.filter === 'all' ? ' active' : '') + '" data-filter="all">All Agents</span>';
      agents.forEach(function (a) {
        html += '<span class="audit__filter-chip' + (self.filter === a.id ? ' active' : '') + '" data-filter="' + a.id + '"><i data-lucide="' + (a.icon || 'bot') + '" style="width:14px;height:14px"></i> ' + a.short_name + '</span>';
      });
      html += '</div>';

      if (filtered.length === 0) {
        html += '<div class="card"><div class="empty-state"><div class="empty-state__icon"><i data-lucide="file-text" style="width:48px;height:48px;color:var(--text-muted)"></i></div>';
        html += '<div class="empty-state__title">No Audit Entries</div>';
        html += '<div class="empty-state__text">Process regulatory updates to generate audit trail entries.</div></div></div>';
      } else {
        html += '<div class="audit__table-wrapper">';
        html += '<div class="audit__table-header"><span>Timestamp</span><span>Agent</span><span>Message</span><span>Update ID</span><span>Severity</span></div>';
        filtered.slice(0, 100).forEach(function (entry) {
          var agent = agents.find(function (a) { return a.id === entry.agent_id; });
          var sevColor = entry.severity === 'error' ? 'danger' : entry.severity === 'warning' ? 'warning' : 'info';
          html += '<div class="audit-entry">';
          html += '<span class="audit-entry__timestamp">' + H.formatDate(entry.timestamp, 'time') + '</span>';
          html += '<span class="audit-entry__agent"><span class="audit-entry__agent-icon"><i data-lucide="' + (agent ? agent.icon : 'bot') + '"></i></span><span class="audit-entry__agent-name">' + (agent ? agent.short_name : entry.agent_id) + '</span></span>';
          html += '<span class="audit-entry__message">' + H.sanitizeHTML(entry.message) + '</span>';
          html += '<span class="audit-entry__update-id">' + (entry.update_id || '—') + '</span>';
          html += '<span><span class="badge badge--' + sevColor + '">' + entry.severity + '</span></span>';
          html += '</div>';
        });
        html += '</div>';
      }
      html += '</div>';
      container.innerHTML = html;

      // Bind filter clicks
      container.querySelectorAll('.audit__filter-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          self.filter = chip.dataset.filter;
          self.render(container);
        });
      });
    }
  };
})();
