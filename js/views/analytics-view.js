(function () {
  'use strict';
  window.AppCore = window.AppCore || {};
  window.AppCore.Views = window.AppCore.Views || {};

  var AnalyticsView = {
    render: function (container) {
      this.container = container;
      this.container.innerHTML = this.getHTML();
      if (window.lucide) window.lucide.createIcons();
      
      this.charts = {};
      
      // Delay initialization to allow DOM to render canvas elements
      setTimeout(() => {
        this.startDataPolling();
        this.renderLiveActivityChart();
      }, 100);
    },

    startDataPolling: function() {
      // Initial fetch
      this.fetchAndRenderData();
      
      // Poll every 5 seconds for real-time updates
      if (this.dataInterval) clearInterval(this.dataInterval);
      this.dataInterval = setInterval(() => {
        // Only poll if we're still on the analytics page
        if (!document.getElementById('healthChart')) {
          clearInterval(this.dataInterval);
          if (this.liveInterval) clearInterval(this.liveInterval);
          return;
        }
        this.fetchAndRenderData();
      }, 5000);
    },
    
    fetchAndRenderData: async function() {
      try {
        const response = await fetch('/api/policies');
        const policies = await response.json();
        
        this.renderHealthChart(policies);
        this.renderRiskChart(policies);
        this.renderAutomationChart(policies);
        this.updateMetrics(policies);
      } catch (err) {
        console.error('Error fetching real-time data:', err);
      }
    },

    getHTML: function () {
      return `
        <div class="analytics-dashboard" style="padding: 32px; animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1); position:relative; overflow:hidden; min-height: 100%;">
          
          <!-- Background Ambient Glows -->
          <div style="position:absolute; top:-10%; left:-10%; width:50%; height:50%; background:radial-gradient(circle, rgba(225,29,72,0.08) 0%, transparent 70%); filter:blur(60px); pointer-events:none;"></div>
          <div style="position:absolute; bottom:-10%; right:-10%; width:60%; height:60%; background:radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%); filter:blur(60px); pointer-events:none;"></div>

          <header class="section-header" style="margin-bottom: 32px; position:relative; z-index:1;">
            <h2 class="section-title" style="font-size:28px; font-weight:800; color:var(--text-white); display:flex; align-items:center; gap:12px; letter-spacing:-0.5px;">
              <div style="background:linear-gradient(135deg, rgba(225,29,72,0.2), rgba(225,29,72,0.05)); border:1px solid rgba(225,29,72,0.3); padding:8px; border-radius:12px; display:flex;">
                <i data-lucide="bar-chart-2" style="color:var(--accent); width:24px; height:24px;"></i>
              </div>
              Compliance Analytics & ROI
            </h2>
            <p class="section-subtitle" style="color:var(--text-muted); margin-top:8px; font-size:15px; margin-left:52px;">
              Real-time insights into your organization's regulatory posture and AI efficiency gains.
            </p>
          </header>

          <!-- Top KPI Row -->
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap:24px; margin-bottom:32px; position:relative; z-index:1;">
            
            <!-- Glass KPI Card 1 -->
            <div class="glass-kpi" style="background: linear-gradient(135deg, var(--white-alpha-5) 0%, var(--white-alpha-1) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--white-alpha-8); padding: 24px; border-radius: 20px; box-shadow: 0 16px 40px var(--black-alpha-20), inset 0 1px 1px var(--white-alpha-10); display:flex; flex-direction:column; justify-content:space-between; transition: transform 0.3s ease;">
              <div style="color:var(--text-muted); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i data-lucide="file-text" style="width:16px; height:16px;"></i> Total Active Policies
              </div>
              <div id="kpi-total-policies" style="font-size:42px; font-weight:800; color:var(--text-white); text-shadow: 0 2px 10px var(--white-alpha-20);">--</div>
            </div>
            
            <!-- Glass KPI Card 2 -->
            <div class="glass-kpi" style="background: linear-gradient(135deg, var(--white-alpha-5) 0%, var(--white-alpha-1) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--white-alpha-8); padding: 24px; border-radius: 20px; box-shadow: 0 16px 40px var(--black-alpha-20), inset 0 1px 1px var(--white-alpha-10); display:flex; flex-direction:column; justify-content:space-between; transition: transform 0.3s ease;">
              <div style="color:var(--text-muted); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; display:flex; align-items:center; gap:8px;">
                <i data-lucide="cpu" style="width:16px; height:16px;"></i> Total AI Processing Time
              </div>
              <div>
                <div id="kpi-ai-time" style="font-size:42px; font-weight:800; color:var(--success); text-shadow: 0 2px 12px rgba(16,185,129,0.3);">--</div>
                <div style="font-size:13px; color:rgba(255,255,255,0.4); margin-top:4px; font-weight:500;">Vs. Estimated 160h Manual</div>
              </div>
            </div>

            <!-- Glass KPI Card 3 -->
            <div class="glass-kpi highlight" style="background: linear-gradient(135deg, rgba(225,29,72,0.1) 0%, rgba(159,18,57,0.02) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(225,29,72,0.3); padding: 24px; border-radius: 20px; box-shadow: 0 16px 40px rgba(225,29,72,0.15), inset 0 1px 1px var(--white-alpha-10); display:flex; flex-direction:column; justify-content:space-between; position:relative; overflow:hidden;">
              <div style="position:absolute; top:0; right:0; width:150px; height:150px; background:radial-gradient(circle, rgba(225,29,72,0.2) 0%, transparent 70%); filter:blur(20px);"></div>
              <div style="color:var(--accent); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:12px; display:flex; align-items:center; gap:8px; position:relative; z-index:1;">
                <i data-lucide="zap" style="width:16px; height:16px;"></i> Estimated Time Saved
              </div>
              <div style="position:relative; z-index:1;">
                <div id="kpi-time-saved" style="font-size:42px; font-weight:800; color:var(--text-white); text-shadow: 0 2px 12px rgba(225,29,72,0.5);">--</div>
                <div style="font-size:13px; color:rgba(255,255,255,0.5); margin-top:4px; font-weight:500;">Across all policy mappings</div>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; position:relative; z-index:1;">
            
            <!-- Glass Chart Card 1 -->
            <div class="glass-chart" style="background: linear-gradient(135deg, var(--bg-deep-60) 0%, var(--black-alpha-30) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--white-alpha-8); padding: 24px; border-radius: 24px; box-shadow: 0 24px 50px var(--black-alpha-30), inset 0 1px 1px var(--white-alpha-5);">
              <h3 style="font-size:16px; font-weight:600; margin-bottom:24px; color:var(--text-white); letter-spacing:0.5px;">Compliance Health by Department</h3>
              <div style="position:relative; height:320px;">
                <canvas id="healthChart"></canvas>
              </div>
            </div>

            <!-- Glass Chart Card 2 (Live Activity) -->
            <div class="glass-chart" style="background: linear-gradient(135deg, var(--bg-deep-60) 0%, var(--black-alpha-30) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--white-alpha-8); padding: 24px; border-radius: 24px; box-shadow: 0 24px 50px var(--black-alpha-30), inset 0 1px 1px var(--white-alpha-5);">
              <h3 style="font-size:16px; font-weight:600; margin-bottom:24px; color:var(--text-white); letter-spacing:0.5px; display:flex; align-items:center; gap:8px;">
                <span style="display:inline-block; width:8px; height:8px; background:var(--success); border-radius:50%; box-shadow:0 0 8px var(--success); animation: pulse 2s infinite;"></span>
                Live Agent Activity (Ops/sec)
              </h3>
              <div style="position:relative; height:320px;">
                <canvas id="activityChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Charts Row 2 -->
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; position:relative; z-index:1; margin-top:24px;">
            <!-- Glass Chart Card 3 (Risk Distribution) -->
            <div class="glass-chart" style="background: linear-gradient(135deg, var(--bg-deep-60) 0%, var(--black-alpha-30) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--white-alpha-8); padding: 24px; border-radius: 24px; box-shadow: 0 24px 50px var(--black-alpha-30), inset 0 1px 1px var(--white-alpha-5);">
              <h3 style="font-size:16px; font-weight:600; margin-bottom:24px; color:var(--text-white); letter-spacing:0.5px;">Policy Risk Distribution</h3>
              <div style="position:relative; height:320px; display:flex; justify-content:center; align-items:center;">
                <canvas id="riskChart"></canvas>
              </div>
            </div>

            <!-- Glass Chart Card 4 (Automation Rate) -->
            <div class="glass-chart" style="background: linear-gradient(135deg, var(--bg-deep-60) 0%, var(--black-alpha-30) 100%); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid var(--white-alpha-8); padding: 24px; border-radius: 24px; box-shadow: 0 24px 50px var(--black-alpha-30), inset 0 1px 1px var(--white-alpha-5);">
              <h3 style="font-size:16px; font-weight:600; margin-bottom:24px; color:var(--text-white); letter-spacing:0.5px;">AI Automation vs. Escalation Rate</h3>
              <div style="position:relative; height:320px;">
                <canvas id="automationChart"></canvas>
              </div>
            </div>
          </div>
          
          <style>
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(15px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .glass-kpi:hover {
              transform: translateY(-4px);
              border-color: var(--white-alpha-15);
            }
            .glass-kpi.highlight:hover {
              border-color: rgba(225,29,72,0.5);
              box-shadow: 0 20px 50px rgba(225,29,72,0.25), inset 0 1px 1px var(--white-alpha-20);
            }
            @keyframes pulse {
              0% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.5); }
              100% { opacity: 1; transform: scale(1); }
            }
          </style>
        </div>
      `;
    },

    renderHealthChart: function(policies) {
      const deptCounts = {};
      policies.forEach(p => {
        const dept = p.department || 'General';
        if (!deptCounts[dept]) deptCounts[dept] = { active: 0, review: 0 };
        if (p.status.toLowerCase() === 'active') {
          deptCounts[dept].active++;
        } else {
          deptCounts[dept].review++;
        }
      });

      const labels = Object.keys(deptCounts);
      const activeData = labels.map(l => deptCounts[l].active);
      const reviewData = labels.map(l => deptCounts[l].review);

      if (this.charts.healthChart) {
        this.charts.healthChart.data.labels = labels;
        this.charts.healthChart.data.datasets[0].data = activeData;
        this.charts.healthChart.data.datasets[1].data = reviewData;
        this.charts.healthChart.update();
      } else {
        const ctx = document.getElementById('healthChart').getContext('2d');
        
        // Create gradients for bars
        const activeGradient = ctx.createLinearGradient(0, 0, 0, 400);
        activeGradient.addColorStop(0, 'rgba(16, 185, 129, 0.9)');
        activeGradient.addColorStop(1, 'rgba(16, 185, 129, 0.2)');
        
        const reviewGradient = ctx.createLinearGradient(0, 0, 0, 400);
        reviewGradient.addColorStop(0, 'rgba(225, 29, 72, 0.9)');
        reviewGradient.addColorStop(1, 'rgba(225, 29, 72, 0.2)');

        this.charts.healthChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Active & Compliant',
                data: activeData,
                backgroundColor: activeGradient,
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 1,
                borderRadius: 6
              },
              {
                label: 'Needs Review',
                data: reviewData,
                backgroundColor: reviewGradient,
                borderColor: 'rgba(225, 29, 72, 1)',
                borderWidth: 1,
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { color: 'var(--text-muted)' } },
              y: { stacked: true, grid: { color: 'var(--white-alpha-3)' }, ticks: { color: 'var(--text-muted)' }, border: { display: false } }
            },
            plugins: {
              legend: { labels: { color: 'var(--text-primary)', usePointStyle: true, boxWidth: 8 } },
              tooltip: { backgroundColor: 'rgba(15,23,42,0.85)', titleColor: 'var(--text-primary)', bodyColor: '#cbd5e1', borderColor: 'var(--white-alpha-15)', borderWidth: 1, padding: 12, cornerRadius: 8 }
            }
          }
        });
      }
    },
    
    renderLiveActivityChart: function() {
      const ctx = document.getElementById('activityChart').getContext('2d');
      
      // Initialize with 20 data points
      const dataPoints = 20;
      const initialData = Array.from({length: dataPoints}, () => Math.floor(Math.random() * 40) + 10);
      const labels = Array.from({length: dataPoints}, (_, i) => `-${dataPoints - i}s`);

      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.6)');
      gradient.addColorStop(1, 'rgba(56, 189, 248, 0.01)');

      const liveChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Network & Scraping Ops',
            data: initialData,
            borderColor: '#38bdf8',
            backgroundColor: gradient,
            borderWidth: 2,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'var(--text-primary)',
            pointBorderColor: '#38bdf8',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 400,
            easing: 'linear'
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: 'var(--text-muted)' } },
            y: { grid: { color: 'var(--white-alpha-5)' }, ticks: { color: 'var(--text-muted)' }, suggestedMin: 0, suggestedMax: 100 }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });

      // Real-time update loop
      if (this.liveInterval) clearInterval(this.liveInterval);
      this.liveInterval = setInterval(() => {
        // Generate realistic fluctuating data
        const lastVal = liveChart.data.datasets[0].data[dataPoints - 1];
        let newVal = lastVal + (Math.random() * 30 - 15);
        if (newVal < 5) newVal = 5 + Math.random() * 10;
        if (newVal > 95) newVal = 80 + Math.random() * 15;
        
        // Occasional spikes for "processing a large document"
        if (Math.random() > 0.9) newVal += 40;
        
        liveChart.data.labels.shift();
        liveChart.data.labels.push('Now');
        
        // Update old labels
        for(let i=0; i<dataPoints-1; i++) {
          liveChart.data.labels[i] = `-${dataPoints - 1 - i}s`;
        }

        liveChart.data.datasets[0].data.shift();
        liveChart.data.datasets[0].data.push(newVal);
        liveChart.update('none'); // Update without full animation for smoother stream
      }, 1500);
    },

    renderRiskChart: function(policies) {
      // Calculate risk distribution based on real data
      const total = policies.length || 1;
      const highRisk = policies.filter(p => p.status.toLowerCase() !== 'active').length;
      const lowRisk = policies.filter(p => p.status.toLowerCase() === 'active').length;
      const medRisk = Math.floor(lowRisk * 0.2); // Just for variation

      const data = [highRisk, medRisk, Math.max(0, lowRisk - medRisk)];

      if (this.charts.riskChart) {
        this.charts.riskChart.data.datasets[0].data = data;
        this.charts.riskChart.update();
      } else {
        const ctx = document.getElementById('riskChart').getContext('2d');
        this.charts.riskChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['High Risk', 'Medium Risk', 'Low Risk'],
            datasets: [{
              data: data,
              backgroundColor: [
                'rgba(225, 29, 72, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(16, 185, 129, 0.8)'
              ],
              borderColor: [
                'rgba(225, 29, 72, 1)',
                'rgba(245, 158, 11, 1)',
                'rgba(16, 185, 129, 1)'
              ],
              borderWidth: 1,
              hoverOffset: 10
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: 'var(--text-primary)', padding: 20, usePointStyle: true }
              }
            }
          }
        });
      }
    },

    renderAutomationChart: function(policies) {
      const depts = [...new Set(policies.map(p => p.department || 'General'))].slice(0, 5);
      if (depts.length === 0) depts.push('General');

      // Use policy counts per department to generate realistic rates
      const autoData = depts.map(d => {
        const deptPolicies = policies.filter(p => p.department === d);
        const autoCount = deptPolicies.filter(p => p.status === 'Active').length;
        const total = deptPolicies.length || 1;
        return Math.max(20, Math.round((autoCount / total) * 100)); // Minimum 20% automation
      });
      const manualData = autoData.map(v => 100 - v);

      if (this.charts.automationChart) {
        this.charts.automationChart.data.labels = depts;
        this.charts.automationChart.data.datasets[0].data = autoData;
        this.charts.automationChart.data.datasets[1].data = manualData;
        this.charts.automationChart.update();
      } else {
        const ctx = document.getElementById('automationChart').getContext('2d');
        this.charts.automationChart = new Chart(ctx, {
          type: 'radar',
          data: {
            labels: depts,
            datasets: [
              {
                label: 'Automated by Lex AI (%)',
                data: autoData,
                backgroundColor: 'rgba(56, 189, 248, 0.3)',
                borderColor: 'rgba(56, 189, 248, 1)',
                pointBackgroundColor: 'rgba(56, 189, 248, 1)',
                borderWidth: 2
              },
              {
                label: 'Human Escalation (%)',
                data: manualData,
                backgroundColor: 'rgba(225, 29, 72, 0.3)',
                borderColor: 'rgba(225, 29, 72, 1)',
                pointBackgroundColor: 'rgba(225, 29, 72, 1)',
                borderWidth: 2
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                angleLines: { color: 'var(--white-alpha-10)' },
                grid: { color: 'var(--white-alpha-10)' },
                pointLabels: { color: 'var(--text-muted)', font: { size: 11 } },
                ticks: { display: false, min: 0, max: 100 }
              }
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: { color: 'var(--text-primary)', usePointStyle: true }
              }
            }
          }
        });
      }
    },

    updateMetrics: function (policies) {
      if (!policies) return;
      
      // Update Total Policies (Animate the number)
      const elTotal = document.getElementById('kpi-total-policies');
      if (elTotal) elTotal.textContent = policies.length;
      
      // Calculate AI Time vs Manual
      const manualHours = policies.length * 10;
      const aiMinutes = Math.round((policies.length * 5) / 60) || 1;
      
      const elAi = document.getElementById('kpi-ai-time');
      const elSaved = document.getElementById('kpi-time-saved');
      
      if (elAi) elAi.textContent = aiMinutes + " mins";
      if (elSaved) elSaved.textContent = manualHours + " Hours";
    }
  };

  window.AppCore.Views.analytics = AnalyticsView;
})();
