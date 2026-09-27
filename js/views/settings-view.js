/**
 * UBS — Settings View
 */
(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Views = window.AppCore.Views || {};
  var State = window.AppCore.StateManager;

  window.AppCore.Views.settings = {
    render: function (container) {
      // Default settings if none exist
      var settings = State.getByPath('settings') || {
        riskThreshold: 75,
        confidenceThreshold: 80,
        autoApproveLowRisk: true,
        enableDrafterAgent: true,
        notificationEmails: 'compliance@ubs.example.com'
      };

      var html = '<div class="dashboard animate-slide-up" style="max-width: 800px; margin: 0 auto;">';
      html += '<div class="dashboard__header" style="margin-bottom:var(--sp-6)">';
      html += '<div><h2 class="dashboard__title">System Configuration</h2>';
      html += '<p class="dashboard__subtitle">Adjust AI Agent parameters and orchestration logic</p></div>';
      html += '</div>';

      // General Settings
      html += '<div class="card" style="margin-bottom:var(--sp-6)">';
      html += '<div class="card__header"><span class="card__title"><i data-lucide="sliders"></i> Orchestration Thresholds</span></div>';
      html += '<div class="dashboard-section__content" style="display:flex;flex-direction:column;gap:var(--sp-5);padding:24px;">';
      
      // Risk Threshold
      html += '<div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">Escalation Risk Threshold</label>';
      html += '<div style="display:flex;align-items:center;gap:12px">';
      html += '<input type="range" class="custom-range" id="setting-risk" min="1" max="100" value="' + settings.riskThreshold + '" style="flex:1" oninput="document.getElementById(\'risk-val\').innerText = this.value + \'/100\'">';
      html += '<span id="risk-val" class="badge badge--danger">' + settings.riskThreshold + '/100</span>';
      html += '</div>';
      html += '<p style="font-size:11px;color:var(--text-muted);margin-top:4px;margin-bottom:0">Updates scoring higher than this will bypass auto-resolution and be sent to the Escalation Queue.</p></div>';
      
      // Confidence Threshold
      html += '<div><label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">Minimum AI Confidence Score</label>';
      html += '<div style="display:flex;align-items:center;gap:12px">';
      html += '<input type="range" class="custom-range" id="setting-conf" min="50" max="100" value="' + settings.confidenceThreshold + '" style="flex:1" oninput="document.getElementById(\'conf-val\').innerText = this.value + \'%\'">';
      html += '<span id="conf-val" class="badge badge--primary">' + settings.confidenceThreshold + '%</span>';
      html += '</div>';
      html += '<p style="font-size:11px;color:var(--text-muted);margin-top:4px;margin-bottom:0">Drafter Agent will only propose policy edits if its confidence score exceeds this value.</p></div>';
      
      html += '</div></div>';

      // Feature Toggles
      html += '<div class="card" style="margin-bottom:var(--sp-6)">';
      html += '<div class="card__header"><span class="card__title"><i data-lucide="toggle-right"></i> Feature Toggles</span></div>';
      html += '<div class="dashboard-section__content" style="display:flex;flex-direction:column;gap:var(--sp-4);padding:24px;">';
      
      html += '<label style="display:flex;align-items:center;gap:12px;font-size:13px;cursor:pointer">';
      html += '<div class="custom-toggle"><input type="checkbox" id="setting-auto" ' + (settings.autoApproveLowRisk ? 'checked' : '') + '><span class="toggle-slider"></span></div>';
      html += '<span style="color:var(--text-primary);font-weight:500;">Auto-approve Low Risk Updates</span>';
      html += '</label>';

      html += '<label style="display:flex;align-items:center;gap:12px;font-size:13px;cursor:pointer">';
      html += '<div class="custom-toggle"><input type="checkbox" id="setting-drafter" ' + (settings.enableDrafterAgent ? 'checked' : '') + '><span class="toggle-slider"></span></div>';
      html += '<span style="color:var(--text-primary);font-weight:500;">Enable Drafter Agent for Policy Gap Remediation</span>';
      html += '</label>';
      
      html += '</div></div>';

      // Notifications
      html += '<div class="card" style="margin-bottom:var(--sp-6)">';
      html += '<div class="card__header"><span class="card__title"><i data-lucide="bell"></i> Notifications</span></div>';
      html += '<div class="dashboard-section__content" style="padding:24px;">';
      html += '<label style="display:block;font-size:13px;font-weight:600;margin-bottom:8px">Escalation Email Distribution List</label>';
      html += '<input type="text" class="form-input" id="setting-email" value="' + settings.notificationEmails + '" style="width:100%;max-width:400px">';
      html += '</div></div>';

      // Save Button
      html += '<div style="display:flex;justify-content:flex-end">';
      html += '<button class="btn btn--primary" onclick="window.AppCore.Views.settings.save()">';
      html += '<i data-lucide="save" style="width:14px;height:14px"></i> Save Configuration';
      html += '</button>';
      html += '</div>';

      html += '</div>';
      container.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    },

    save: function() {
      var newSettings = {
        riskThreshold: parseInt(document.getElementById('setting-risk').value, 10),
        confidenceThreshold: parseInt(document.getElementById('setting-conf').value, 10),
        autoApproveLowRisk: document.getElementById('setting-auto').checked,
        enableDrafterAgent: document.getElementById('setting-drafter').checked,
        notificationEmails: document.getElementById('setting-email').value
      };
      
      window.AppCore.StateManager.setByPath('settings', newSettings);
      window.AppCore.App.showToast('success', 'Settings Saved', 'System configuration has been updated successfully.');
    }
  };
})();
