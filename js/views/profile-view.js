/* ═══════════════════════════════════════════════════════════
   USER PROFILE VIEW
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.profile = {
  render: function (container) {
    var session = {};
    try {
      session = JSON.parse(localStorage.getItem('app_session')) || {};
    } catch(e) {}
    
    var name = session.name || 'Unknown User';
    var email = session.email || 'user@example.com';
    var company = session.company || 'Unknown Company';
    var sector = session.sector || 'Unknown Sector';
    var loginTime = session.loginTime ? new Date(session.loginTime).toLocaleString() : 'Just now';
    var systemId = 'USR-' + Math.random().toString(36).substr(2, 6).toUpperCase();

    var html = '<div style="max-width: 900px; margin: 0 auto; width: 100%; padding-top: 32px;">';
    
    html += '<div class="view-header view-enter">';
    html += '<h1 class="view-header__title">User Profile</h1>';
    html += '<p class="view-header__desc">Manage your account details and view active session information.</p>';
    html += '</div>';

    html += '<div class="view-enter stagger-1">';
    html += '<div class="glass-panel" style="padding: 0; width: 100%; display: flex; flex-direction: column; overflow: hidden; position: relative; border-radius: 20px; box-shadow: 0 24px 50px var(--black-alpha-50), inset 0 1px 1px var(--white-alpha-10); border: 1px solid var(--white-alpha-5);">';
    
    // Background gradient for the top half
    html += '<div style="position:absolute; top:0; left:0; right:0; height:180px; background:linear-gradient(180deg, rgba(225,29,72,0.12) 0%, transparent 100%);"></div>';

    // Header section with avatar
    html += '<div style="padding: 40px; display:flex; align-items:flex-start; gap:32px; border-bottom:1px solid var(--white-alpha-5); position:relative; z-index:1;">';
    
    // Futuristic Avatar
    html += '<div style="position:relative; padding: 4px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--bg-deep-80)); box-shadow: 0 0 30px rgba(225,29,72,0.3);">';
    html += '<div style="width:100px; height:100px; border-radius:50%; background:var(--bg-deep); border: 2px solid var(--white-alpha-10); display:flex; align-items:center; justify-content:center; font-size:40px; font-weight:900; color:var(--accent); text-transform:uppercase;">' + name.charAt(0) + '</div>';
    html += '<div style="position:absolute; bottom:4px; right:4px; width:20px; height:20px; background:var(--success); border:3px solid var(--bg-deep); border-radius:50%; box-shadow: 0 0 10px var(--success);"></div>';
    html += '</div>';

    html += '<div style="flex:1;">';
    html += '<div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">';
    html += '<h2 style="margin:0; font-size:32px; font-weight:900; color:var(--text-white); letter-spacing:-0.02em;">' + name + '</h2>';
    html += '<div style="background:rgba(225,29,72,0.1); border:1px solid rgba(225,29,72,0.3); color:var(--accent); font-family:monospace; font-size:11px; padding:4px 8px; border-radius:4px; font-weight:bold; letter-spacing:1px;">' + systemId + '</div>';
    html += '</div>';
    html += '<div style="font-size:15px; color:var(--text-secondary); margin-bottom: 24px;">' + email + '</div>';
    
    // Quick Stats Row
    html += '<div style="display:flex; gap:40px;">';
    html += '<div><div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Security Clearance</div><div style="font-size:16px; color:var(--text-white); font-weight:700;">Level 4 <span style="color:var(--accent);">Admin</span></div></div>';
    html += '<div><div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Account Status</div><div style="font-size:16px; color:var(--success); font-weight:700;">Verified</div></div>';
    html += '</div>';

    html += '</div>';
    html += '</div>'; // End Header

    // Bottom Details Grid
    html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap:32px; padding:40px; position:relative; z-index:1; background:var(--black-alpha-20);">';
    
    // Organization Card
    html += '<div style="position:relative; background:var(--bg-deep-60); border:1px solid var(--white-alpha-6); padding:28px 32px; border-radius:12px; box-shadow:inset 0 1px 1px var(--white-alpha-5); transition:transform 0.2s; cursor:default;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">';
    html += '<div style="position:absolute; top:0; left:0; bottom:0; width:3px; background:linear-gradient(180deg, var(--info), transparent); border-radius:3px 0 0 3px;"></div>';
    html += '<div style="font-size:11px; font-weight:800; color:var(--info); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:24px; display:flex; align-items:center; gap:8px;"><i data-lucide="building-2" style="width:14px;height:14px;"></i> Organization Details</div>';
    html += '<div style="margin-bottom:24px;">';
    html += '<div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Company Name</div>';
    html += '<div style="font-size:18px; color:var(--text-white); font-weight:700;">' + company + '</div>';
    html += '</div>';
    html += '<div>';
    html += '<div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Industry Sector</div>';
    html += '<div style="font-size:18px; color:var(--text-white); font-weight:700;">' + sector + '</div>';
    html += '</div>';
    html += '</div>';

    // Session Card
    html += '<div style="position:relative; background:var(--bg-deep-60); border:1px solid var(--white-alpha-6); padding:28px 32px; border-radius:12px; box-shadow:inset 0 1px 1px var(--white-alpha-5); transition:transform 0.2s; cursor:default;" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">';
    html += '<div style="position:absolute; top:0; left:0; bottom:0; width:3px; background:linear-gradient(180deg, var(--success), transparent); border-radius:3px 0 0 3px;"></div>';
    html += '<div style="font-size:11px; font-weight:800; color:var(--success); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:24px; display:flex; align-items:center; gap:8px;"><i data-lucide="shield-check" style="width:14px;height:14px;"></i> Security & Session</div>';
    html += '<div style="margin-bottom:24px;">';
    html += '<div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Session Status</div>';
    html += '<div style="font-size:15px; color:var(--success); font-weight:700; display:flex; align-items:center; gap:8px; font-family:monospace;"><span style="width:8px;height:8px;background:var(--success);border-radius:50%;display:inline-block;box-shadow:0 0 10px var(--success);"></span> SECURE_UPLINK_ACTIVE</div>';
    html += '</div>';
    html += '<div>';
    html += '<div style="font-size:10px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Last Login Time</div>';
    html += '<div style="font-size:15px; color:var(--text-white); font-weight:600; font-family:monospace;">' + loginTime + '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // End Grid

    html += '</div>'; // End Panel
    html += '</div>'; // End wrapper
    
    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  }
};
