/* ═══════════════════════════════════════════════════════════
   COMPLIANCE CALENDAR & TIMELINE VIEW
   ═══════════════════════════════════════════════════════════ */
window.AppCore = window.AppCore || {};
window.AppCore.Views = window.AppCore.Views || {};

window.AppCore.Views.calendar = {
  currentYear: new Date().getFullYear(),
  currentMonthIndex: new Date().getMonth(),
  selectedDate: new Date().getDate(),
  viewMode: 'grid', // 'grid' or 'timeline'
  activeFilter: null,
  isModalOpen: false,
  modalDate: null,
  events: {},
  isLoaded: false,

  fetchEvents: function(container) {
    var self = this;
    fetch('/api/calendar')
      .then(res => res.json())
      .then(data => {
        self.events = {};
        data.forEach(function(ev) {
          // Parse date string securely avoiding timezone shift if it's YYYY-MM-DD
          var dateParts = ev.date.split('-');
          var yyyy = dateParts[0];
          var mm = dateParts[1];
          var day = parseInt(dateParts[2], 10);
          var monthKey = yyyy + '-' + mm;
          
          if (!self.events[monthKey]) self.events[monthKey] = {};
          self.events[monthKey][day] = {
            id: ev.id,
            title: ev.title,
            desc: ev.description,
            type: ev.type,
            status: ev.status,
            jurisdiction: ev.jurisdiction,
            assigned_to: ev.assigned_to,
            time: '12:00 PM', // Fallback, could extract from datetime if needed
            rawDate: ev.date
          };
        });
        self.isLoaded = true;
        if (container) self.render(container);
      })
      .catch(function(err) {
        console.error("Failed to load calendar events", err);
      });
  },

  render: function (container) {
    if (!this.isLoaded) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted);"><i data-lucide="loader-2" class="spin" style="width:24px;height:24px;"></i> Loading Calendar...</div>';
      if (window.lucide) window.lucide.createIcons();
      this.fetchEvents(container);
      return;
    }

    var self = this;
    var html = '<div class="calendar animate-slide-up" style="display:flex; flex-direction:column; gap:24px; padding:24px;">';
    
    var stats = this._getMonthlyStats();
    
    // Header with Toggle
    html += '<div class="view-header" style="display:flex; justify-content:space-between; align-items:flex-end; gap:20px;">';
    html += '<div style="display:flex; flex-direction:column; gap:12px;">';
    
    html += '<h1 style="font-size:24px; font-weight:600; color:var(--text); margin:0;">Compliance Calendar</h1>';
    
    // Stats Summary Mini-Dashboard
    html += '<div style="display:flex; align-items:center; gap:16px; font-size:13px; font-weight:800; color:var(--text-muted);">';
    html += '<span style="color:var(--text-secondary);">' + stats.total + ' Total Milestones</span>';
    html += '<span style="color:var(--danger);">' + stats.critical + ' Critical Remaining</span>';
    html += '<span style="color:var(--success);">' + stats.completedPercent + '% Completed</span>';
    html += '<span style="color:#f59e0b; background:rgba(245,158,11,0.1); padding:2px 8px; border-radius:12px; border:1px solid rgba(245,158,11,0.2);"><i data-lucide="flame" style="width:12px;height:12px;margin-right:4px;vertical-align:-2px;"></i>Highest Workload: ' + stats.busiestMonth + '</span>';
    html += '</div>';
    html += '</div>';
    
    // Action Buttons & View Toggle
    html += '<div style="display:flex; align-items:center; gap:12px;">';
    
    html += '<button id="btn-calendar-auto-extract" class="btn" style="padding:8px 16px; font-size:12px; border-radius:6px; background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.4); color:#c084fc; font-weight:700; box-shadow:0 0 10px rgba(168,85,247,0.2); transition:all 0.2s;" onclick="window.AppCore.Views.calendar.autoExtractDeadlines(this)"><i data-lucide="sparkles" style="width:14px;height:14px;margin-right:6px;"></i>AI Scan Deadlines</button>';
    html += '<button class="btn btn--ghost" style="padding:8px 16px; font-size:12px; border-radius:6px; border:1px solid var(--white-alpha-10);" onclick="window.AppCore.Views.calendar.exportToICS()"><i data-lucide="download" style="width:14px;height:14px;margin-right:6px;"></i>Export Schedule</button>';
    html += '<button class="btn btn--primary" style="padding:8px 16px; font-size:12px; border-radius:6px;" onclick="window.AppCore.Views.calendar.openModal()"><i data-lucide="plus" style="width:14px;height:14px;margin-right:6px;"></i>New Milestone</button>';
    
    html += '<div style="display:flex; background:var(--white-alpha-3); border:1px solid var(--white-alpha-8); padding:4px; border-radius:10px; gap:4px; margin-left:8px;">';
    html += '<button class="btn ' + (this.viewMode === 'grid' ? 'btn--primary' : 'btn--ghost') + '" style="padding:8px 16px; font-size:12px; border-radius:6px; height:auto;" onclick="window.AppCore.Views.calendar.toggleMode(\'grid\')"><i data-lucide="grid" style="width:14px;height:14px;margin-right:6px;"></i>Month Grid</button>';
    html += '<button class="btn ' + (this.viewMode === 'timeline' ? 'btn--primary' : 'btn--ghost') + '" style="padding:8px 16px; font-size:12px; border-radius:6px; height:auto;" onclick="window.AppCore.Views.calendar.toggleMode(\'timeline\')"><i data-lucide="list" style="width:14px;height:14px;margin-right:6px;"></i>Timeline List</button>';
    html += '</div>';
    
    html += '</div>';
    html += '</div>'; // End Header

    if (this.viewMode === 'grid') {
      html += this._renderMonthGrid();
    } else {
      html += this._renderTimelineList();
    }

    html += '</div>'; // End main calendar wrapper
    
    if (this.isModalOpen) {
      html += this._renderModal();
    }

    container.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();
  },

  toggleMode: function(mode) {
    this.viewMode = mode;
    this.render(document.getElementById('view-container'));
  },
  
  toggleFilter: function(type) {
    if (this.activeFilter === type) {
      this.activeFilter = null; // Turn off filter
    } else {
      this.activeFilter = type;
    }
    this.render(document.getElementById('view-container'));
  },

  openModal: function() {
    this.activeEditEvent = null;
    this.isModalOpen = true;
    this.render(document.getElementById('view-container'));
  },

  closeModal: function() {
    this.activeEditEvent = null;
    this.isModalOpen = false;
    this.render(document.getElementById('view-container'));
  },

  editEvent: function(id) {
    var target = null;
    var targetDay = null;
    var targetMonthKey = null;
    
    Object.keys(this.events).forEach(m => {
       Object.keys(this.events[m]).forEach(d => {
          if (this.events[m][d].id == id) {
              target = this.events[m][d];
              targetDay = d;
              targetMonthKey = m;
          }
       });
    });
    
    if (target) {
        this.activeEditEvent = target;
        this.activeEditEvent.day = targetDay;
        this.activeEditEvent.monthKey = targetMonthKey;
        this.isModalOpen = true;
        this.render(document.getElementById('view-container'));
    }
  },

  saveEvent: function(e) {
    e.preventDefault();
    var self = this;
    var dateVal = document.getElementById('new-event-date').value;
    var titleVal = document.getElementById('new-event-title').value;
    var descVal = document.getElementById('new-event-desc').value;
    var timeVal = document.getElementById('new-event-time').value;
    var typeVal = document.getElementById('new-event-type').value;
    var statusVal = document.getElementById('new-event-status') ? document.getElementById('new-event-status').value : 'Pending';
    var jurVal = document.getElementById('new-event-jurisdiction') ? document.getElementById('new-event-jurisdiction').value : 'Global';
    var assignVal = document.getElementById('new-event-assigned') ? document.getElementById('new-event-assigned').value : 'Compliance Team';
    var idVal = document.getElementById('new-event-id') ? document.getElementById('new-event-id').value : '';
    
    if (!dateVal || !titleVal) return;
    
    var payload = {
        title: titleVal,
        date: dateVal,
        type: typeVal,
        status: statusVal,
        description: descVal,
        jurisdiction: jurVal,
        assigned_to: assignVal
    };

    var method = idVal ? 'PUT' : 'POST';
    var url = idVal ? '/api/calendar/' + idVal : '/api/calendar';

    fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(r => r.json())
    .then(res => {
        // Jump to the month of the event
        var dateParts = dateVal.split('-');
        self.currentYear = parseInt(dateParts[0], 10);
        self.currentMonthIndex = parseInt(dateParts[1], 10) - 1;
        self.isModalOpen = false;
        
        // Refresh events from server
        self.fetchEvents(document.getElementById('view-container'));
    })
    .catch(err => console.error(err));
  },

  deleteEvent: function(id) {
    var self = this;
    if(!confirm('Are you sure you want to delete this event?')) return;
    fetch('/api/calendar/' + id, { method: 'DELETE' })
      .then(r => r.json())
      .then(res => {
          self.isModalOpen = false;
          self.fetchEvents(document.getElementById('view-container'));
      })
      .catch(err => console.error(err));
  },
  autoExtractDeadlines: function(btnElement) {
    if(!confirm('This will use AI to scan the latest regulatory updates and automatically populate the calendar with detected deadlines. Proceed?')) return;
    
    var originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<div class="loading-spinner" style="width:14px;height:14px;border-color:rgba(168,85,247,0.5);border-top-color:#c084fc;margin-right:6px;display:inline-block;vertical-align:middle;"></div> Scanning...';
    btnElement.disabled = true;

    var self = this;
    fetch('/api/calendar/auto-extract', {
        method: 'POST'
    })
    .then(r => r.json())
    .then(res => {
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
        if(res.error) {
            alert('AI Extraction Failed: ' + res.error);
        } else {
            alert(res.message);
            self.fetchEvents(document.getElementById('view-container'));
        }
    })
    .catch(err => {
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
        alert('Extraction error: ' + err.message);
    });
  },


  exportToICS: function() {
    var icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ComplianceCalendar//EN',
      'CALSCALE:GREGORIAN'
    ];
    
    var self = this;
    Object.keys(this.events).forEach(function(monthKey) {
      var monthEvents = self.events[monthKey];
      var year = monthKey.split('-')[0];
      var month = monthKey.split('-')[1];
      
      Object.keys(monthEvents).forEach(function(day) {
        var ev = monthEvents[day];
        var dStr = String(day).padStart(2, '0');
        var dateStamp = year + month + dStr;
        
        icsLines.push('BEGIN:VEVENT');
        icsLines.push('DTSTART;VALUE=DATE:' + dateStamp);
        icsLines.push('DTEND;VALUE=DATE:' + dateStamp);
        icsLines.push('SUMMARY:' + ev.title);
        icsLines.push('DESCRIPTION:' + ev.desc + ' @ ' + ev.time);
        icsLines.push('END:VEVENT');
      });
    });
    
    icsLines.push('END:VCALENDAR');
    var icsContent = icsLines.join('\\r\\n');
    var blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'compliance_schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  _getMonthlyStats: function() {
    var monthKey = this.currentYear + '-' + String(this.currentMonthIndex + 1).padStart(2, '0');
    var currentMonthEvents = this.events[monthKey] || {};
    
    var total = 0;
    var completed = 0;
    var critical = 0;
    
    Object.keys(currentMonthEvents).forEach(function(d) {
      var ev = currentMonthEvents[d];
      total++;
      if (ev.type === 'completed') completed++;
      if (ev.type === 'critical') critical++;
    });
    
    var completedPercent = total === 0 ? 0 : Math.round((completed / total) * 100);

    var busiestMonthStr = 'None';
    var maxEvents = 0;
    var self = this;
    Object.keys(this.events).forEach(function(mk) {
        var count = Object.keys(self.events[mk]).length;
        if (count > maxEvents) {
            maxEvents = count;
            var parts = mk.split('-');
            var date = new Date(parts[0], parseInt(parts[1])-1, 1);
            busiestMonthStr = date.toLocaleString('default', { month: 'short' }) + ' ' + parts[0] + ' (' + count + ' items)';
        }
    });

    return { total: total, critical: critical, completedPercent: completedPercent, busiestMonth: busiestMonthStr };
  },

  selectDate: function(day) {
    this.selectedDate = day;
    this.render(document.getElementById('view-container'));
  },

  prevMonth: function() {
    if (this.currentYear === 2026 && this.currentMonthIndex === 0) return; // Prevent before Jan 2026
    this.currentMonthIndex--;
    if (this.currentMonthIndex < 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    }
    this.selectedDate = 1;
    this.render(document.getElementById('view-container'));
  },

  setMonth: function(index) {
    this.currentMonthIndex = parseInt(index);
    this.selectedDate = 1;
    this.render(document.getElementById('view-container'));
  },

  nextMonth: function() {
    this.currentMonthIndex++;
    if (this.currentMonthIndex > 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    }
    this.selectedDate = 1;
    this.render(document.getElementById('view-container'));
  },

  _renderMonthGrid: function() {
    var self = this;
    
    // Dynamic Date Calculations
    var d = new Date(this.currentYear, this.currentMonthIndex, 1);
    var monthName = d.toLocaleString('default', { month: 'long' });
    var monthTitle = monthName + ' ' + this.currentYear;
    var startDay = d.getDay(); // 0 (Sun) to 6 (Sat)
    var daysInMonth = new Date(this.currentYear, this.currentMonthIndex + 1, 0).getDate();
    
    // Get events for current month
    var monthKey = this.currentYear + '-' + String(this.currentMonthIndex + 1).padStart(2, '0');
    var currentMonthEvents = this.events[monthKey] || {};

    var html = '<div style="display:grid; grid-template-columns: 1fr 360px; gap:24px; height:calc(100vh - 230px);">';
    
    // Left Grid Panel
    html += '<div class="glass-panel" style="padding:32px; display:flex; flex-direction:column; border:1px solid var(--white-alpha-8); box-shadow: 0 15px 40px var(--black-alpha-40); background:var(--bg-glass);">';
    html += '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:28px;">';
    
    html += '<div style="display:flex; align-items:center; gap:16px;">';
    html += '<button class="btn btn--icon btn--ghost" style="padding:6px; border-radius:8px;" onclick="window.AppCore.Views.calendar.prevMonth()"><i data-lucide="chevron-left" style="width:20px;height:20px;"></i></button>';
    
    var monthOptions = '';
    var monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthsList.forEach(function(m, idx) {
      var selected = idx === self.currentMonthIndex ? 'selected' : '';
      monthOptions += '<option value="' + idx + '" ' + selected + ' style="background:var(--bg-deep); color:var(--text-white);">' + m + ' ' + self.currentYear + '</option>';
    });
    
    html += '<div style="position:relative; display:flex; align-items:center; justify-content:center; min-width:140px;">';
    html += '<select onchange="window.AppCore.Views.calendar.setMonth(this.value)" style="appearance:none; -webkit-appearance:none; background:transparent; border:none; outline:none; font-size:20px; font-weight:900; color:var(--text-white); letter-spacing:0.5px; text-align:center; cursor:pointer; font-family:inherit; padding-right:20px; margin:0;">' + monthOptions + '</select>';
    html += '<i data-lucide="chevron-down" style="position:absolute; right:0; width:16px; height:16px; color:var(--text-muted); pointer-events:none;"></i>';
    html += '</div>';
    
    html += '<button class="btn btn--icon btn--ghost" style="padding:6px; border-radius:8px;" onclick="window.AppCore.Views.calendar.nextMonth()"><i data-lucide="chevron-right" style="width:20px;height:20px;"></i></button>';
    html += '</div>';

    var getFilterStyle = function(type, color) {
      if (self.activeFilter === type) return 'box-shadow: 0 0 15px ' + color + '; border-color: ' + color + '; background:var(--white-alpha-10); transform:scale(1.05);';
      if (self.activeFilter) return 'opacity:0.3; filter:grayscale(100%);';
      return '';
    };

    html += '<div style="display:flex; gap:16px; font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px;">';
    html += '<button onclick="window.AppCore.Views.calendar.toggleFilter(\'completed\')" style="display:flex; align-items:center; gap:6px; background:none; border:1px solid transparent; border-radius:12px; padding:4px 8px; cursor:pointer; color:inherit; transition:all 0.2s; outline:none; ' + getFilterStyle('completed', 'var(--success)') + '"><span style="width:8px;height:8px;background:var(--success);border-radius:50%;box-shadow:0 0 8px var(--success);"></span>Completed</button>';
    html += '<button onclick="window.AppCore.Views.calendar.toggleFilter(\'warning\')" style="display:flex; align-items:center; gap:6px; background:none; border:1px solid transparent; border-radius:12px; padding:4px 8px; cursor:pointer; color:inherit; transition:all 0.2s; outline:none; ' + getFilterStyle('warning', 'var(--warning)') + '"><span style="width:8px;height:8px;background:var(--warning);border-radius:50%;box-shadow:0 0 8px var(--warning);"></span>Review</button>';
    html += '<button onclick="window.AppCore.Views.calendar.toggleFilter(\'critical\')" style="display:flex; align-items:center; gap:6px; background:none; border:1px solid transparent; border-radius:12px; padding:4px 8px; cursor:pointer; color:inherit; transition:all 0.2s; outline:none; ' + getFilterStyle('critical', 'var(--danger)') + '"><span style="width:8px;height:8px;background:var(--danger);border-radius:50%;box-shadow:0 0 8px var(--danger);"></span>Critical</button>';
    html += '</div>';
    html += '</div>';

    // Calendar Days Grid Header
    html += '<div style="display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); text-align:center; font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:16px; border-bottom:1px solid var(--white-alpha-8); padding-bottom:12px;">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(function(day) {
      html += '<div style="color:rgba(255,255,255,0.6);">' + day + '</div>';
    });
    html += '</div>';

    // Dynamic grid rows to support 6 week months
    var totalCells = startDay + daysInMonth;
    var rowCount = Math.ceil(totalCells / 7);
    html += '<div style="display:grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-rows: repeat(' + Math.max(5, rowCount) + ', minmax(0, 1fr)); gap:12px; flex:1;">';
    
    // Empty padding days at start
    for (var pd = 0; pd < startDay; pd++) {
      html += '<div style="background:transparent;"></div>';
    }
    
    // Fill days of the month
    for (var i = 1; i <= daysInMonth; i++) {
      var isSelected = this.selectedDate === i;
      var ev = currentMonthEvents[i];
      
      var cellStyle = 'background:var(--white-alpha-3); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:14px; display:flex; flex-direction:column; cursor:pointer; position:relative; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); min-height:80px; box-shadow: 0 4px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05); backdrop-filter: blur(8px);';
      if (isSelected) {
        cellStyle = 'background:linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(15,23,42,0.95) 100%); border:1px solid rgba(56,189,248,0.5); border-radius:12px; padding:14px; display:flex; flex-direction:column; cursor:pointer; position:relative; transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1); min-height:80px; box-shadow: 0 12px 30px rgba(56,189,248,0.25), inset 0 1px 0 rgba(255,255,255,0.1); transform:scale(1.05); z-index:10; backdrop-filter: blur(12px);';
      }
      
      var hoverStyle = isSelected ? 'this.style.zIndex=\'50\'; ' : 'this.style.borderColor=\'var(--white-alpha-15)\'; this.style.transform=\'translateY(-2px)\'; this.style.boxShadow=\'0 5px 15px var(--black-alpha-30)\'; this.style.zIndex=\'50\'; ';
      var outStyle = isSelected ? 'this.style.zIndex=\'10\'; ' : 'this.style.borderColor=\'var(--white-alpha-4)\'; this.style.transform=\'none\'; this.style.boxShadow=\'none\'; this.style.zIndex=\'\'; ';

      if (ev) {
        hoverStyle += 'var tt = this.querySelector(\'.day-tooltip\'); if(tt) { tt.style.opacity = \'1\'; tt.style.transform = \'translateX(-50%) translateY(-5px)\'; }';
        outStyle += 'var tt = this.querySelector(\'.day-tooltip\'); if(tt) { tt.style.opacity = \'0\'; tt.style.transform = \'translateX(-50%) translateY(0)\'; }';
      }

      html += '<div style="' + cellStyle + '" onclick="window.AppCore.Views.calendar.selectDate(' + i + ')" onmouseover="' + hoverStyle + '" onmouseout="' + outStyle + '">';
      html += '<span style="font-size:13px; font-weight:800; color:' + (isSelected ? 'white' : 'var(--text-secondary)') + '; font-family:monospace; margin-bottom:8px;">' + i + '</span>';
      
      if (ev) {
        var isFilteredOut = self.activeFilter && ev.type !== self.activeFilter;
        var filterOpacity = isFilteredOut ? 'opacity:0.2; pointer-events:none; filter:grayscale(100%);' : '';
        
        var badgeClass = ev.type === 'completed' ? 'success' : ev.type === 'warning' ? 'warning' : 'danger';
        var dotColor = ev.type === 'completed' ? 'var(--success)' : ev.type === 'warning' ? 'var(--warning)' : 'var(--danger)';
        var badgeBg = ev.type === 'completed' ? 'rgba(16,185,129,0.1)' : ev.type === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
        html += '<div style="width:100%; display:flex; align-items:center; gap:6px; background:' + badgeBg + '; border: 1px solid ' + badgeBg.replace('0.1', '0.2') + '; padding:6px 8px; border-radius:6px; margin-top:auto; transition:all 0.3s; ' + filterOpacity + '">';
        html += '<div style="width:6px; height:6px; min-width:6px; background:' + dotColor + '; border-radius:50%; box-shadow:0 0 8px ' + dotColor + ';"></div>';
        html += '<div style="font-size:10px; font-weight:700; color:var(--text-white); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:left; letter-spacing:0.3px;">' + ev.title + '</div>';
        html += '</div>';
        
        html += '<div class="day-tooltip" style="position:absolute; bottom:calc(100% + 10px); left:50%; transform:translateX(-50%); width:240px; background:var(--bg-modal); border:1px solid var(--white-alpha-10); border-radius:12px; padding:16px; box-shadow:0 15px 40px var(--black-alpha-60); z-index:100; opacity:0; pointer-events:none; transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display:flex; flex-direction:column; gap:10px; cursor:default;">';
        html += '<div style="display:flex; justify-content:space-between; align-items:flex-start;">';
        html += '<span class="badge badge--' + badgeClass + '" style="font-size:9px; padding:4px 8px; box-shadow:0 0 10px var(--black-alpha-50);">' + ev.type.toUpperCase() + '</span>';
        html += '<span style="font-size:11px; color:var(--accent); font-weight:800; background:rgba(56,189,248,0.1); padding:2px 8px; border-radius:10px;">@ ' + ev.time + '</span>';
        html += '</div>';
        html += '<div style="font-size:14px; font-weight:900; color:var(--text-white); line-height:1.4;">' + ev.title + '</div>';
        html += '<div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">' + ev.desc + '</div>';
        html += '<div style="position:absolute; bottom:-6px; left:50%; transform:translateX(-50%) rotate(45deg); width:12px; height:12px; background:var(--bg-modal); border-right:1px solid var(--white-alpha-10); border-bottom:1px solid var(--white-alpha-10);"></div>';
        html += '</div>';
      }
      html += '</div>';
    }
    
    // Empty padding days at the end
    var remainingCells = (Math.max(5, rowCount) * 7) - totalCells;
    for (var j = 0; j < remainingCells; j++) {
      html += '<div style="background:transparent;"></div>';
    }
    
    html += '</div>'; // End Days Grid
    html += '</div>'; // End Left Grid Panel

    // Right Event Inspector Panel
    html += '<div class="glass-panel" style="padding:32px; display:flex; flex-direction:column; gap:28px; border:1px solid rgba(56, 189, 248, 0.2); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(56, 189, 248, 0.05); background:linear-gradient(145deg, rgba(56, 189, 248, 0.05) 0%, rgba(10, 15, 30, 0.6) 100%); backdrop-filter:blur(20px); overflow-y:auto;">';
    html += '<div style="display:flex; align-items:center; gap:12px; border-bottom:1px solid var(--white-alpha-5); padding-bottom:20px;">';
    html += '<div style="width:36px; height:36px; border-radius:10px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.2); display:flex; align-items:center; justify-content:center; color:var(--accent);"><i data-lucide="calendar-search" style="width:20px;height:20px;"></i></div>';
    html += '<h3 style="margin:0; font-size:16px; font-weight:900; color:var(--text-white); letter-spacing:0.5px; text-transform:uppercase;">Milestone Inspector</h3>';
    html += '</div>';
    
    var activeEvent = currentMonthEvents[this.selectedDate];
    if (activeEvent) {
      var badgeClass = activeEvent.type === 'completed' ? 'success' : activeEvent.type === 'warning' ? 'warning' : 'danger';
      var eventColor = activeEvent.type === 'completed' ? 'var(--success)' : activeEvent.type === 'warning' ? 'var(--warning)' : 'var(--danger)';
      
      html += '<div style="display:flex; flex-direction:column; gap:24px;">';
      
      // Target Date Block
      html += '<div style="background:var(--black-alpha-25); border:1px solid var(--white-alpha-4); border-radius:12px; padding:24px 20px; display:flex; flex-direction:column; align-items:center; text-align:center; box-shadow: inset 0 2px 10px var(--black-alpha-20);">';
      html += '<div style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:1.5px; margin-bottom:10px;">Target Date</div>';
      html += '<div style="font-size:18px; font-weight:900; color:var(--text-white); font-family:monospace; letter-spacing:0.5px;">' + monthName + ' ' + this.selectedDate + ', ' + this.currentYear + '</div>';
      html += '<div style="font-size:14px; font-weight:800; color:var(--accent); margin-top:6px; background:rgba(56,189,248,0.1); padding:4px 12px; border-radius:20px;">@ ' + activeEvent.time + '</div>';
      html += '</div>';

      // Event Details
      html += '<div style="display:flex; flex-direction:column; gap:16px;">';
      html += '<div style="display:flex; align-items:center; gap:8px;">';
      html += '<span class="badge badge--' + badgeClass + '" style="box-shadow: 0 0 15px rgba(' + (activeEvent.type==='completed'?'16,185,129':activeEvent.type==='warning'?'245,158,11':'239,68,68') + ',0.3); padding:6px 12px; font-size:10px;">' + activeEvent.type.toUpperCase() + '</span>';
      html += '</div>';
      html += '<h4 style="margin:0; font-size:20px; font-weight:900; color:var(--text-white); line-height:1.4; border-left:4px solid ' + eventColor + '; padding-left:16px;">' + activeEvent.title + '</h4>';
      html += '<p style="margin:0; font-size:14px; color:var(--text-secondary); line-height:1.8; padding-left:20px; border-left:1px dashed var(--white-alpha-10);">' + activeEvent.desc + '</p>';
      
      // Google Calendar Button
      var mStr = String(this.currentMonthIndex + 1).padStart(2, '0');
      var dStr = String(this.selectedDate).padStart(2, '0');
      var dateStamp = this.currentYear + mStr + dStr;
      var gcalUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(activeEvent.title) + '&dates=' + dateStamp + 'T090000Z/' + dateStamp + 'T100000Z&details=' + encodeURIComponent(activeEvent.desc);
      html += '<div style="display:flex; gap:12px; margin-top:8px;">';
      html += '<a href="' + gcalUrl + '" target="_blank" class="btn btn--secondary" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px; text-decoration:none; color:var(--text-primary); border-radius:8px;"><i data-lucide="calendar-plus" style="width:16px;height:16px;"></i> Google Calendar</a>';
      html += '<button type="button" class="btn btn--primary" style="flex:1; display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:8px;" onclick="window.AppCore.Views.calendar.editEvent(' + activeEvent.id + ')"><i data-lucide="edit-3" style="width:16px;height:16px;"></i> Edit Milestone</button>';
      html += '</div>';
      
      html += '</div>';
      
      html += '</div>';
    } else {
      html += '<div style="text-align:center; padding:60px 20px; color:var(--text-muted);">';
      html += '<div style="width:64px; height:64px; border-radius:50%; background:var(--white-alpha-3); display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;"><i data-lucide="calendar-check" style="width:32px;height:32px;color:var(--white-alpha-20);"></i></div>';
      html += '<div style="font-size:14px; font-weight:700; color:var(--text-secondary); margin-bottom:8px;">No Milestones</div>';
      html += '<div style="font-size:12px; line-height:1.6;">There are no compliance tasks or audits scheduled for ' + monthName + ' ' + this.selectedDate + ', ' + this.currentYear + '.</div>';
      html += '</div>';
    }

    html += '</div>'; // End Right Event Inspector Panel
    
    html += '</div>';
    return html;
  },

  _renderTimelineList: function() {
    var d = new Date(this.currentYear, this.currentMonthIndex, 1);
    var monthName = d.toLocaleString('default', { month: 'long' });
    var monthTitle = monthName + ' ' + this.currentYear;
    var monthKey = this.currentYear + '-' + String(this.currentMonthIndex + 1).padStart(2, '0');
    var currentMonthEvents = this.events[monthKey] || {};

    var html = '<div class="glass-panel" style="padding:40px; display:flex; flex-direction:column; gap:32px; max-width:950px; margin:0 auto; width:100%; border:1px solid var(--white-alpha-8); box-shadow: 0 20px 50px var(--black-alpha-50); background:linear-gradient(180deg, var(--bg-deep-70) 0%, var(--bg-modal) 100%);">';
    
    html += '<div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--white-alpha-6); padding-bottom:24px;">';
    html += '<div style="display:flex; align-items:center; gap:16px;">';
    html += '<div style="width:42px; height:42px; border-radius:12px; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); display:flex; align-items:center; justify-content:center; color:var(--accent);"><i data-lucide="git-commit" style="width:24px;height:24px;"></i></div>';
    html += '<h3 style="margin:0; font-size:20px; font-weight:900; color:var(--text-white); letter-spacing:0.5px; text-transform:uppercase;">Compliance Deadline Timeline</h3>';
    html += '</div>';

    html += '<div style="display:flex; align-items:center; gap:16px;">';
    html += '<button class="btn btn--icon btn--ghost" style="padding:6px; border-radius:8px;" onclick="window.AppCore.Views.calendar.prevMonth()"><i data-lucide="chevron-left" style="width:20px;height:20px;"></i></button>';
    
    var monthOptions = '';
    var monthsList = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var self = this;
    monthsList.forEach(function(m, idx) {
      var selected = idx === self.currentMonthIndex ? 'selected' : '';
      monthOptions += '<option value="' + idx + '" ' + selected + ' style="background:var(--bg-deep); color:var(--text-white);">' + m + ' ' + self.currentYear + '</option>';
    });
    
    html += '<div style="position:relative; display:flex; align-items:center; justify-content:center; min-width:140px;">';
    html += '<select onchange="window.AppCore.Views.calendar.setMonth(this.value)" style="appearance:none; -webkit-appearance:none; background:transparent; border:none; outline:none; font-size:18px; font-weight:800; color:var(--text-muted); letter-spacing:0.5px; text-align:center; cursor:pointer; font-family:inherit; padding-right:20px; margin:0;">' + monthOptions + '</select>';
    html += '<i data-lucide="chevron-down" style="position:absolute; right:0; width:16px; height:16px; color:var(--text-muted); pointer-events:none;"></i>';
    html += '</div>';

    html += '<button class="btn btn--icon btn--ghost" style="padding:6px; border-radius:8px;" onclick="window.AppCore.Views.calendar.nextMonth()"><i data-lucide="chevron-right" style="width:20px;height:20px;"></i></button>';
    html += '</div>';
    html += '</div>';
    
    html += '<div style="position:relative; padding-left:40px; border-left:2px solid var(--white-alpha-5); display:flex; flex-direction:column; gap:32px; margin-top:16px; margin-bottom:20px;">';
    
    var sortedDays = Object.keys(currentMonthEvents).map(Number).sort(function(a,b){return a-b;});
    
    if (sortedDays.length === 0) {
      html += '<div style="text-align:center; padding:40px 20px; color:var(--text-muted);">';
      html += '<div style="width:64px; height:64px; border-radius:50%; background:var(--white-alpha-3); display:flex; align-items:center; justify-content:center; margin:0 auto 20px auto;"><i data-lucide="calendar-check" style="width:32px;height:32px;color:var(--white-alpha-20);"></i></div>';
      html += '<div style="font-size:14px; font-weight:700;">No Milestones in ' + monthTitle + '</div>';
      html += '</div>';
    } else {
      var self = this;
      sortedDays.forEach(function(day) {
        var ev = currentMonthEvents[day];
        var isFilteredOut = self.activeFilter && ev.type !== self.activeFilter;
        var filterOpacity = isFilteredOut ? 'opacity:0.2; pointer-events:none; filter:grayscale(100%);' : '';
        
        var badgeClass = ev.type === 'completed' ? 'success' : ev.type === 'warning' ? 'warning' : 'danger';
        var dotColor = ev.type === 'completed' ? 'var(--success)' : ev.type === 'warning' ? 'var(--warning)' : 'var(--danger)';
        var rowBg = ev.type === 'critical' ? 'linear-gradient(90deg, rgba(239,68,68,0.08) 0%, var(--bg-deep-40) 100%)' : (ev.type === 'warning' ? 'linear-gradient(90deg, rgba(245,158,11,0.08) 0%, var(--bg-deep-40) 100%)' : 'linear-gradient(90deg, rgba(16,185,129,0.08) 0%, var(--bg-deep-40) 100%)');
        
        html += '<div style="position:relative; transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor:pointer; ' + filterOpacity + '" onmouseover="this.style.transform=\'translateX(8px)\';" onmouseout="this.style.transform=\'none\';" onclick="window.AppCore.Views.calendar.editEvent(' + ev.id + ')">';
        // Timeline bullet dot
        html += '<div style="position:absolute; left:-52px; top:8px; width:22px; height:22px; background:var(--bg-deep); border:4px solid ' + dotColor + '; border-radius:50%; box-shadow:0 0 15px ' + dotColor + '; z-index:2;"></div>';
        
        // Card content
        html += '<div style="background:' + rowBg + '; border:1px solid var(--white-alpha-5); border-left:3px solid ' + dotColor + '; border-radius:16px; padding:28px 32px; display:flex; justify-content:space-between; align-items:center; gap:24px; box-shadow:0 4px 20px var(--black-alpha-20);">';
        html += '<div style="flex:1;">';
        html += '<div style="display:flex; align-items:center; gap:16px; margin-bottom:12px;">';
        html += '<span class="badge badge--' + badgeClass + '" style="box-shadow:0 0 12px rgba(' + (ev.type==='completed'?'16,185,129':ev.type==='warning'?'245,158,11':'239,68,68') + ',0.2); padding:6px 12px;">' + ev.type.toUpperCase() + '</span>';
        html += '<span style="font-size:13px; font-weight:800; color:var(--text-muted); font-family:monospace; letter-spacing:0.5px; background:var(--black-alpha-20); padding:4px 10px; border-radius:6px;">' + monthName + ' ' + day + ', ' + self.currentYear + ' @ ' + ev.time + '</span>';
        html += '</div>';
        html += '<h4 style="margin:0 0 10px 0; font-size:18px; font-weight:900; color:var(--text-white);">' + ev.title + '</h4>';
        html += '<p style="margin:0; font-size:14px; color:var(--text-secondary); line-height:1.7; max-width:85%;">' + ev.desc + '</p>';
        html += '</div>';
        
        // Google Calendar Button
        var mStr = String(self.currentMonthIndex + 1).padStart(2, '0');
        var dStr = String(day).padStart(2, '0');
        var dateStamp = self.currentYear + mStr + dStr;
        var gcalUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(ev.title) + '&dates=' + dateStamp + 'T090000Z/' + dateStamp + 'T100000Z&details=' + encodeURIComponent(ev.desc);
        html += '<a href="' + gcalUrl + '" target="_blank" class="btn btn--ghost" style="flex-shrink:0; width:48px; height:48px; padding:0; display:flex; align-items:center; justify-content:center; border-radius:12px; border:1px solid var(--white-alpha-10); color:var(--text-white); text-decoration:none;" title="Add to Google Calendar"><i data-lucide="calendar-plus" style="width:20px;height:20px;"></i></a>';
        
        html += '</div>';
        
        html += '</div>';
      });
    }
    
    html += '</div>'; // End timeline wrap
    html += '</div>';
    return html;
  },

  _renderModal: function() {
    var isEdit = !!this.activeEditEvent;
    var ev = this.activeEditEvent || {};
    var modalTitle = isEdit ? 'Edit Milestone' : 'New Milestone';
    var modalDesc = isEdit ? 'Update details for this compliance milestone.' : 'Add a new deadline to the compliance calendar.';
    var defaultDate = isEdit && ev.rawDate ? ev.rawDate : '';

    var html = '<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:var(--black-alpha-70); z-index:9999; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(12px);">';
    html += '<div style="background:var(--bg-modal); border:1px solid var(--white-alpha-10); border-radius:16px; padding:32px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; box-shadow:0 25px 60px var(--bg-overlay); position:relative;">';
    
    html += '<button type="button" style="position:absolute; top:24px; right:24px; background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="window.AppCore.Views.calendar.closeModal()"><i data-lucide="x" style="width:24px;height:24px;"></i></button>';
    
    html += '<h2 style="margin:0 0 8px 0; font-size:24px; color:var(--text-white);">' + modalTitle + '</h2>';
    html += '<p style="color:var(--text-secondary); font-size:14px; margin:0 0 24px 0;">' + modalDesc + '</p>';
    
    html += '<form onsubmit="window.AppCore.Views.calendar.saveEvent(event)" style="display:flex; flex-direction:column; gap:20px;">';
    
    // Hidden ID input for edit mode
    html += '<input type="hidden" id="new-event-id" value="' + (ev.id || '') + '">';

    html += '<div style="display:flex; gap:16px;">';
    html += '<div style="flex:1;">';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Date</label>';
    html += '<input type="date" id="new-event-date" required style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;" value="' + defaultDate + '" min="2026-01-01">';
    html += '</div>';

    html += '<div style="flex:1;">';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Time</label>';
    html += '<input type="time" id="new-event-time" required style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;" value="12:00">';
    html += '</div>';
    html += '</div>';

    html += '<div>';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Title</label>';
    html += '<input type="text" id="new-event-title" required placeholder="e.g. Q3 Security Audit" style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;" value="' + (ev.title || '') + '">';
    html += '</div>';
    
    html += '<div style="display:flex; gap:16px;">';
    html += '<div style="flex:1;">';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Severity</label>';
    html += '<select id="new-event-type" style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;">';
    html += '<option value="completed" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.type==='completed'?'selected':'') + '>Completed</option>';
    html += '<option value="warning" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.type==='warning'?'selected':'') + '>Warning</option>';
    html += '<option value="critical" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.type==='critical'?'selected':'') + '>Critical</option>';
    html += '</select>';
    html += '</div>';
    
    html += '<div style="flex:1;">';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Status</label>';
    html += '<select id="new-event-status" style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;">';
    html += '<option value="Pending" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.status==='Pending'?'selected':'') + '>Pending</option>';
    html += '<option value="In Progress" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.status==='In Progress'?'selected':'') + '>In Progress</option>';
    html += '<option value="Overdue" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.status==='Overdue'?'selected':'') + '>Overdue</option>';
    html += '<option value="Completed" style="background:var(--bg-base); color:var(--text-white);" ' + (ev.status==='Completed'?'selected':'') + '>Completed</option>';
    html += '</select>';
    html += '</div>';
    html += '</div>';

    html += '<div style="display:flex; gap:16px;">';
    html += '<div style="flex:1;">';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Jurisdiction</label>';
    html += '<input type="text" id="new-event-jurisdiction" placeholder="e.g. US SEC, EU GDPR" style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;" value="' + (ev.jurisdiction || '') + '">';
    html += '</div>';

    html += '<div style="flex:1;">';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Assigned To</label>';
    html += '<input type="text" id="new-event-assigned" placeholder="e.g. Legal Team, Alex M." style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none;" value="' + (ev.assigned_to || '') + '">';
    html += '</div>';
    html += '</div>';

    html += '<div>';
    html += '<label style="display:block; font-size:12px; font-weight:800; color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">Description</label>';
    html += '<textarea id="new-event-desc" rows="3" placeholder="Brief details about this milestone..." style="width:100%; padding:12px; background:var(--black-alpha-20); border:1px solid var(--white-alpha-10); border-radius:8px; color:var(--text-white); font-family:inherit; font-size:14px; outline:none; resize:none;">' + (ev.desc || '') + '</textarea>';
    html += '</div>';

    html += '<div style="display:flex; justify-content:space-between; margin-top:8px;">';
    
    if (isEdit) {
      html += '<button type="button" class="btn btn--danger" style="padding:10px 20px; border-radius:8px; background:var(--danger-bg); color:var(--danger); border:1px solid var(--danger);" onclick="window.AppCore.Views.calendar.deleteEvent(' + ev.id + ')"><i data-lucide="trash" style="width:16px;height:16px;margin-right:6px;"></i>Delete</button>';
    } else {
      html += '<div></div>'; // Spacer
    }
    
    html += '<div style="display:flex; gap:12px;">';
    html += '<button type="button" class="btn btn--ghost" style="padding:10px 20px; border-radius:8px;" onclick="window.AppCore.Views.calendar.closeModal()">Cancel</button>';
    html += '<button type="submit" class="btn btn--primary" style="padding:10px 24px; border-radius:8px; font-weight:800;">' + (isEdit ? 'Save Changes' : 'Add Milestone') + '</button>';
    html += '</div>';
    html += '</div>';
    
    html += '</form>';
    
    html += '</div>';
    html += '</div>';
    return html;
  }
};

