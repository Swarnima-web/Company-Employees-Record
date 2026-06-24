// Global UI Component Module
const UIComponents = {
  // --- Chart.js Rendering Wrappers ---
  charts: {
    salaryDistribution: (canvasId, data) => {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const labels = Object.keys(data);
      const values = Object.values(data);

      // Check if chart instance exists, if so destroy it to prevent overlay bugs
      if (window.salaryDistChartInstance) {
        window.salaryDistChartInstance.destroy();
      }

      window.salaryDistChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Monthly Salary Expense By Dept',
            data: values,
            backgroundColor: [
              'rgba(183, 110, 121, 0.75)',  // Primary Accent Rose Gold
              'rgba(212, 165, 165, 0.75)',  // Secondary Accent Soft Rose
              'rgba(16, 185, 129, 0.75)',   // Emerald Green
              'rgba(245, 158, 11, 0.75)',   // Warning Gold
              'rgba(239, 68, 68, 0.75)',    // Coral Red
              'rgba(113, 128, 150, 0.75)'   // Slate Neutral
            ],
            borderColor: [
              '#B76E79',
              '#D4A5A5',
              '#10B981',
              '#F59E0B',
              '#EF4444',
              '#718096'
            ],
            borderWidth: 1.5,
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y', // Horizontal bars
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { color: 'rgba(90, 110, 133, 0.8)', font: { family: 'Inter', weight: 600 } }
            },
            y: {
              grid: { display: false },
              ticks: { color: 'rgba(90, 110, 133, 0.8)', font: { family: 'Inter', weight: 600 } }
            }
          }
        }
      });
    },

    attendanceBreakdown: (canvasId, data) => {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      const labels = Object.keys(data);
      const values = Object.values(data);

      if (window.attendanceChartInstance) {
        window.attendanceChartInstance.destroy();
      }

      window.attendanceChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#10B981', // Present (Green)
              '#EF4444', // Absent (Red)
              '#F59E0B'  // Half Day (Gold)
            ],
            borderWidth: 2,
            borderColor: 'var(--bg-secondary)',
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: 'rgba(90, 110, 133, 0.8)',
                font: { family: 'Inter', weight: 600, size: 11 }
              }
            }
          },
          cutout: '65%'
        }
      });
    },

    overtimeTrends: (canvasId, data) => {
      const ctx = document.getElementById(canvasId);
      if (!ctx) return;

      // June 2026: 1 to 24 Days
      const days = Array.from({ length: 24 }, (_, i) => i + 1);
      const values = days.map(d => data[d] || 0);

      if (window.overtimeTrendChartInstance) {
        window.overtimeTrendChartInstance.destroy();
      }

      window.overtimeTrendChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: days.map(d => `June ${d}`),
          datasets: [{
            label: 'Total OT Hours Worked',
            data: values,
            borderColor: '#B76E79',
            backgroundColor: 'rgba(183, 110, 121, 0.1)',
            fill: true,
            tension: 0.35,
            borderWidth: 3,
            pointBackgroundColor: '#D4A5A5',
            pointBorderColor: '#FFFFFF',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: 'rgba(90, 110, 133, 0.8)', font: { family: 'Inter', size: 10 } }
            },
            y: {
              grid: { color: 'rgba(0,0,0,0.05)' },
              ticks: { color: 'rgba(90, 110, 133, 0.8)', font: { family: 'Inter', size: 10 } }
            }
          }
        }
      });
    }
  },

  // --- Attendance Interactive Calendar ---
  calendar: {
    render: (containerId, attendanceRecords, employees, currentDateStr, onDayClick, onMonthChange) => {
      const div = document.getElementById(containerId);
      if (!div) return;

      const dateParts = currentDateStr.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // 0-indexed month
      
      const targetDate = new Date(year, month, 1);
      const monthName = targetDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      const startPadding = targetDate.getDay(); // Sunday = 0, Monday = 1...
      const totalDays = new Date(year, month + 1, 0).getDate();

      let html = `
        <div class="calendar-wrapper fade-in">
          <div class="calendar-header">
            <h3 class="calendar-title">${monthName}</h3>
            <div class="calendar-nav-buttons" style="display: flex; gap: 8px; align-items: center; margin-left: 20px;">
              <button id="prev-month-btn" class="btn btn-outline btn-sm" title="Previous Month"><i class="fa-solid fa-chevron-left"></i></button>
              <button id="next-month-btn" class="btn btn-outline btn-sm" title="Next Month"><i class="fa-solid fa-chevron-right"></i></button>
            </div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600; margin-left: auto;">
              <i class="fa-solid fa-circle-info"></i> Click any day to mark/modify attendance sheets.
            </div>
          </div>
          <div class="calendar-body">
            <div class="calendar-weekdays">
              <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
            </div>
            <div class="calendar-grid">
      `;

      // Draw blank cells for start padding
      for (let i = 0; i < startPadding; i++) {
        html += `<div class="calendar-day empty"></div>`;
      }

      // Draw calendar days
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Find attendance info for this day
        const dayRecords = attendanceRecords.filter(r => r.date === dateStr);
        const presentCount = dayRecords.filter(r => r.status === 'Present').length;
        const halfDayCount = dayRecords.filter(r => r.status === 'Half Day').length;
        const absentCount = dayRecords.filter(r => r.status === 'Absent').length;

        // Is today?
        const systemTodayStr = new Date().toISOString().split('T')[0];
        const isTodayClass = dateStr === systemTodayStr ? 'today' : '';

        html += `
          <div class="calendar-day current-month ${isTodayClass}" data-date="${dateStr}" style="cursor: pointer;">
            <span class="calendar-day-num">${day}</span>
            <div class="calendar-day-content">
              ${presentCount > 0 ? `<div class="calendar-indicator present">${presentCount} Pres</div>` : ''}
              ${halfDayCount > 0 ? `<div class="calendar-indicator halfday">${halfDayCount} Half</div>` : ''}
              ${absentCount > 0 ? `<div class="calendar-indicator absent">${absentCount} Abs</div>` : ''}
            </div>
          </div>
        `;
      }

      // Fill ending days grid (7 column layout)
      const totalCells = startPadding + totalDays;
      const endPadding = (7 - (totalCells % 7)) % 7;
      for (let i = 0; i < endPadding; i++) {
        html += `<div class="calendar-day empty"></div>`;
      }

      html += `
            </div>
          </div>
        </div>
      `;

      div.innerHTML = html;

      // Add navigation event listeners
      document.getElementById('prev-month-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const prevDate = new Date(year, month - 1, 1);
        const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;
        if (onMonthChange) onMonthChange(prevMonthStr);
      });

      document.getElementById('next-month-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const nextDate = new Date(year, month + 1, 1);
        const nextMonthStr = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}-01`;
        if (onMonthChange) onMonthChange(nextMonthStr);
      });

      // Add day click event listeners
      div.querySelectorAll('.calendar-day.current-month').forEach(dayCell => {
        dayCell.addEventListener('click', () => {
          const date = dayCell.getAttribute('data-date');
          if (onDayClick) onDayClick(date);
        });
      });
    }
  },

  // --- Export Utilities ---
  exports: {
    csv: (tableId, filename = 'export') => {
      const table = document.getElementById(tableId);
      if (!table) return;

      let csvContent = '';
      const rows = table.querySelectorAll('tr');

      rows.forEach(row => {
        const cols = row.querySelectorAll('th, td');
        const rowContent = Array.from(cols).map(col => {
          // Clean text, replace quotes, wrap in quotes
          let text = col.innerText.replace(/"/g, '""');
          return `"${text}"`;
        }).join(',');
        
        csvContent += rowContent + '\r\n';
      });

      // Create download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};
