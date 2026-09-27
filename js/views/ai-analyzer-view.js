/* ═══════════════════════════════════════════════════════════
   AI ANALYZER - SIDE-BY-SIDE GAP ANALYSIS
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.aiAnalyzer = {
  render: function (container) {
    var html = '<div class="animate-fade-in" style="display:flex; flex-direction:column; height:100%; padding:24px; box-sizing:border-box; overflow:hidden;">';
    
    // Header
    html += '<div class="view-header" style="flex-shrink:0; margin-bottom:24px; display:flex; justify-content:space-between; align-items:flex-end;">';
    html += '<div>';
    html += '<h1 class="view-header__title" style="margin-bottom:8px;">AI Gap Analyzer</h1>';
    html += '<p class="view-header__desc" style="color:var(--text-secondary); margin:0;">Side-by-side comparative analysis of external regulations vs. internal policies.</p>';
    html += '</div>';
    html += '<div style="display:flex; gap:12px;">';
    html += '<button class="btn" style="display:flex; align-items:center; gap:8px;" onclick="if(window.AppCore.App) window.AppCore.App.showToast(\'success\', \'Addendum Applied\', \'Internal policy updated successfully\')"><i data-lucide="check-circle" style="width:16px;height:16px;"></i> Apply Addendum</button>';
    html += '</div>';
    html += '</div>';

    // Split View Container
    html += '<div style="display:grid; grid-template-columns:1fr 1fr; gap:24px; flex:1; overflow:hidden;">';
    
    // Left: Regulatory Source
    html += '<div class="glass-panel" style="display:flex; flex-direction:column; background:var(--bg-glass); border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.2);">';
    html += '<div style="padding:16px 20px; border-bottom:1px solid var(--border-light); background:var(--white-alpha-5); display:flex; justify-content:space-between; align-items:center;">';
    html += '<div style="font-weight:600; font-size:14px; color:var(--text-primary); display:flex; align-items:center; gap:8px;"><i data-lucide="file-text" style="width:16px;height:16px;color:var(--accent);"></i> SEC Final Rule 33-11216</div>';
    html += '<span class="status-badge status-badge--pending">Source</span>';
    html += '</div>';
    html += '<div class="scroll-area" style="padding:24px; flex:1; overflow-y:auto; font-size:14px; line-height:1.7; color:var(--text-secondary);">';
    html += '<h3 style="margin-top:0; color:var(--text-primary); font-size:18px;">Cybersecurity Risk Management, Strategy, Governance, and Incident Disclosure</h3>';
    html += '<p>The Securities and Exchange Commission (SEC) is adopting final rules requiring registrants to disclose material cybersecurity incidents they experience and to disclose on an annual basis material information regarding their cybersecurity risk management, strategy, and governance.</p>';
    html += '<p><strong>Specific Requirement:</strong> Registrants must disclose any cybersecurity incident they determine to be material and to describe the material aspects of the nature, scope, and timing of the incident, as well as the material impact or reasonably likely material impact of the incident on the registrant, including its financial condition and results of operations.</p>';
    html += '<p style="background:linear-gradient(90deg, rgba(225,29,72,0.1), rgba(225,29,72,0.05)); padding:12px 16px; border-left:4px solid var(--accent); border-radius:4px; color:var(--text-primary); box-shadow:0 2px 8px rgba(0,0,0,0.1);"><strong>Disclosure Deadline:</strong> Item 1.05 of Form 8-K requires disclosure of a material cybersecurity incident within four business days after a registrant determines that it has experienced a material cybersecurity incident.</p>';
    html += '</div>';
    html += '</div>';

    // Right: Internal Policy
    html += '<div class="glass-panel" style="display:flex; flex-direction:column; background:var(--bg-glass); border:1px solid var(--border); border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.2);">';
    html += '<div style="padding:16px 20px; border-bottom:1px solid var(--border-light); background:var(--white-alpha-5); display:flex; justify-content:space-between; align-items:center;">';
    html += '<div style="font-weight:600; font-size:14px; color:var(--text-primary); display:flex; align-items:center; gap:8px;"><i data-lucide="shield" style="width:16px;height:16px;color:var(--success);"></i> Global IT Security Policy v4.2</div>';
    html += '<span class="status-badge status-badge--warning">Analysis Target</span>';
    html += '</div>';
    html += '<div class="scroll-area" style="padding:24px; flex:1; overflow-y:auto; font-size:14px; line-height:1.7; color:var(--text-secondary);">';
    html += '<h3 style="margin-top:0; color:var(--text-primary); font-size:18px;">Section 8: Incident Response & Reporting</h3>';
    html += '<p>All suspected cybersecurity incidents must be reported immediately to the Global Security Operations Center (GSOC). The GSOC will conduct a preliminary investigation to ascertain the severity of the event.</p>';
    html += '<div style="text-decoration:line-through; opacity:0.5; margin-bottom:16px; padding:12px; background:var(--white-alpha-5); border-radius:6px; border-left:4px solid #64748b;">Upon confirmation of a severe breach, the executive committee must be notified, and an external public disclosure will be made in accordance with general quarterly reporting cycles or within 30 days of the internal conclusion of the incident investigation.</div>';
    html += '<div style="margin-top:24px; text-align:center;" id="ai-analyze-trigger-container">';
    html += '<button class="btn btn--primary" style="padding:12px 24px; font-size:14px; display:inline-flex; align-items:center; gap:8px;" onclick="window.AppCore.Views.aiAnalyzer.runAnalysis()">';
    html += '<i data-lucide="sparkles" style="width:16px;height:16px;"></i> Analyze Gap with Lex AI';
    html += '</button>';
    html += '</div>';

    html += '<div id="ai-addendum-box-container" style="display:none; margin-top:24px;"></div>';

    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>';
    container.innerHTML = html;
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  runAnalysis: async function() {
    var triggerContainer = document.getElementById('ai-analyze-trigger-container');
    var resultContainer = document.getElementById('ai-addendum-box-container');
    
    triggerContainer.innerHTML = '<div style="color:var(--text-secondary); display:flex; align-items:center; justify-content:center; gap:8px;"><i data-lucide="loader" class="spin" style="width:16px;height:16px;"></i> Lex AI is analyzing...</div>';
    if (window.lucide) window.lucide.createIcons();

    var regText = "The Securities and Exchange Commission (SEC) is adopting final rules requiring registrants to disclose material cybersecurity incidents they experience and to disclose on an annual basis material information regarding their cybersecurity risk management, strategy, and governance. Registrants must disclose any cybersecurity incident they determine to be material and to describe the material aspects of the nature, scope, and timing of the incident, as well as the material impact or reasonably likely material impact of the incident on the registrant, including its financial condition and results of operations. Item 1.05 of Form 8-K requires disclosure of a material cybersecurity incident within four business days after a registrant determines that it has experienced a material cybersecurity incident.";
    var polText = "Section 8: Incident Response & Reporting. All suspected cybersecurity incidents must be reported immediately to the Global Security Operations Center (GSOC). The GSOC will conduct a preliminary investigation to ascertain the severity of the event. Upon confirmation of a severe breach, the executive committee must be notified, and an external public disclosure will be made in accordance with general quarterly reporting cycles or within 30 days of the internal conclusion of the incident investigation.";

    try {
      const response = await fetch('/api/analyze-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regulatoryText: regText, policyText: polText })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Analysis failed");

      triggerContainer.style.display = 'none';
      resultContainer.style.display = 'block';

      var resHtml = '<div style="background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:16px; border-radius:8px; margin-bottom:16px; box-shadow:0 4px 12px rgba(0,0,0,0.1); position:relative; transition:all 0.3s;" id="ai-addendum-box">';
      resHtml += '<div style="position:absolute; top:-10px; right:16px; background:var(--success); color:#fff; font-size:10px; font-weight:800; padding:4px 10px; border-radius:100px; box-shadow:0 2px 8px rgba(16,185,129,0.4); text-transform:uppercase; letter-spacing:0.5px;" id="ai-addendum-badge"><i data-lucide="sparkles" style="width:10px;height:10px;display:inline-block;margin-right:4px;"></i>AI SUGGESTED ADDENDUM</div>';
      resHtml += '<p style="margin-top:0; color:var(--text-secondary); font-size:13px;"><strong>Summary:</strong> ' + data.gapSummary + '</p>';
      resHtml += '<p style="margin-top:8px; color:var(--text-primary);"><strong>Suggested Clause:</strong> ' + data.suggestedAddendum + '</p>';
      resHtml += '<div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px;" id="ai-addendum-actions">';
      resHtml += '<button class="btn btn--ghost btn--sm" style="color:var(--danger);" onclick="document.getElementById(\'ai-addendum-box\').style.display=\'none\'; if(window.AppCore.App) window.AppCore.App.showToast(\'info\', \'Rejected\', \'Suggested addendum dismissed\')">Reject</button>';
      resHtml += '<button class="btn btn--sm" style="background:var(--success); border-color:var(--success); box-shadow:0 2px 10px rgba(16,185,129,0.3);" onclick="var box = document.getElementById(\'ai-addendum-box\'); box.style.background=\'var(--white-alpha-5)\'; box.style.border=\'1px solid var(--border-light)\'; box.style.borderLeft=\'4px solid var(--success)\'; document.getElementById(\'ai-addendum-actions\').style.display=\'none\'; document.getElementById(\'ai-addendum-badge\').style.display=\'none\'; if(window.AppCore.App) window.AppCore.App.showToast(\'success\', \'Accepted\', \'Clause has been merged into policy\')"><i data-lucide="check" style="width:14px;height:14px;"></i> Accept Clause</button>';
      resHtml += '</div>';
      resHtml += '</div>';
      
      resultContainer.innerHTML = resHtml;
      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      triggerContainer.innerHTML = '<div style="color:var(--danger);">Error: ' + err.message + '</div>';
      var retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn--ghost btn--sm';
      retryBtn.innerText = 'Retry';
      retryBtn.onclick = window.AppCore.Views.aiAnalyzer.runAnalysis;
      triggerContainer.appendChild(retryBtn);
    }
  }
};
