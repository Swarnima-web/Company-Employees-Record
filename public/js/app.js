// State Management
const state = {
  user: null,
  activePage: 'dashboard',
  settings: {
    companyName: 'PayStream Solutions',
    overtimeRate: 150,
    currencySymbol: '$'
  }
};

// API Base Helper
window.apiCall = window.apiCall || async function apiCall(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body) options.body = JSON.stringify(body);
  
  try {
    const res = await fetch(endpoint, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Call failed for ${endpoint}:`, err);
    throw err;
  }
};

// Check Authentication on Page Load
function checkAuth() {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    state.user = JSON.parse(savedUser);
    setupSessionUI();
    return true;
  }
  showLoginPage();
  return false;
}

function setupSessionUI() {
  document.getElementById('login-container').classList.add('hidden');
  document.getElementById('app-container').classList.remove('hidden');
  
  // Set User Profile UI in Sidebar
  document.getElementById('user-display-name').textContent = state.user.fullName;
  const roleBadge = document.getElementById('user-display-role');
  roleBadge.textContent = state.user.role.toUpperCase();
  
  // Adjust permissions based on role
  if (state.user.role === 'accountant') {
    // Hide employee management options or mark them read-only if desired
  }
}

function showLoginPage() {
  document.getElementById('app-container').classList.add('hidden');
  document.getElementById('login-container').classList.remove('hidden');
}

// Router
const routes = {
  'dashboard': renderDashboard,
  'employees': renderEmployees,
  'attendance': renderAttendance,
  'overtime': renderOvertime,
  'payroll': renderPayroll,
  'salary-slip': renderSalarySlip,
  'reports': renderReports,
  'top-performers': renderTopPerformers,
  'settings': renderSettings
};

function navigate(pageId) {
  state.activePage = pageId;
  
  // Update sidebar active link
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Set Title
  const titleMap = {
    'dashboard': 'Enterprise Overview',
    'employees': 'Employee Directory',
    'attendance': 'Attendance Records',
    'overtime': 'Overtime Tracking',
    'payroll': 'Payroll Processing',
    'salary-slip': 'Payslip Generator',
    'reports': 'Reports & Analytics',
    'top-performers': 'Performance Leaderboard',
    'settings': 'System Settings'
  };
  document.getElementById('page-title').textContent = titleMap[pageId] || 'System';

  // Render View
  const renderFn = routes[pageId];
  if (renderFn) {
    const viewContainer = document.getElementById('view-content');
    viewContainer.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>`;
    renderFn(viewContainer);
  }
}

// Theme Management (Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  const themeToggle = document.getElementById('theme-toggle');
  const icon = themeToggle.querySelector('i');
  if (savedTheme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  const themeToggle = document.getElementById('theme-toggle');
  const icon = themeToggle.querySelector('i');
  if (newTheme === 'dark') {
    icon.className = 'fa-solid fa-sun';
  } else {
    icon.className = 'fa-solid fa-moon';
  }
}

// Sidebar Expansion/Collapse
function initSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle-btn');
  const expandBtn = document.getElementById('sidebar-expand-btn');

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  expandBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Automatically collapse sidebar on tablet screens, keep hidden on mobile
  if (window.innerWidth <= 1024 && window.innerWidth > 768) {
    sidebar.classList.add('collapsed');
  }
}

// Modals management
const Modals = {
  open: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => modal.classList.add('show'), 10);
    }
  },
  close: (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => modal.classList.add('hidden'), 250);
    }
  },
  closeAll: () => {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
      modal.classList.remove('show');
      setTimeout(() => modal.classList.add('hidden'), 250);
    });
  }
};

// ==========================================
// VIEW RENDERING FUNCTIONS
// ==========================================

// 1. Dashboard View
async function renderDashboard(container) {
  try {
    const data = await apiCall('/api/analytics/dashboard');
    const settings = await apiCall('/api/settings');
    state.settings = settings;

    container.innerHTML = `
      <div class="fade-in">
        <!-- Dashboard Banner -->
        <div class="banner-card" style="background-image: url('assets/dashboard_banner.png');">
          <div class="overlay"></div>
          <div class="banner-content">
            <h2>Welcome back, ${state.user.fullName}!</h2>
            <p>You are logged in as <strong>${state.user.role.toUpperCase()}</strong>. Here's a brief snapshot of your company payroll and attendance analytics today.</p>
          </div>
        </div>

        <!-- Stat Widgets Row -->
        <div class="grid-container">
          <div class="col-3 card stat-card cyan">
            <div class="stat-details">
              <h3>Total Employees</h3>
              <div class="stat-number animated-counter" data-target="${data.widgets.totalEmployees}">0</div>
            </div>
            <div class="stat-icon-box"><i class="fa-solid fa-users-viewfinder"></i></div>
          </div>
          <div class="col-3 card stat-card success">
            <div class="stat-details">
              <h3>Present Today</h3>
              <div class="stat-number animated-counter" data-target="${data.widgets.presentToday}">0</div>
            </div>
            <div class="stat-icon-box"><i class="fa-solid fa-user-check"></i></div>
          </div>
          <div class="col-3 card stat-card danger">
            <div class="stat-details">
              <h3>Absent Today</h3>
              <div class="stat-number animated-counter" data-target="${data.widgets.absentToday}">0</div>
            </div>
            <div class="stat-icon-box"><i class="fa-solid fa-user-slash"></i></div>
          </div>
          <div class="col-3 card stat-card warning">
            <div class="stat-details">
              <h3>Monthly Salary Expense</h3>
              <div class="stat-number animated-counter-currency" data-target="${data.widgets.monthlySalaryExpense}">0</div>
            </div>
            <div class="stat-icon-box"><i class="fa-solid fa-sack-dollar"></i></div>
          </div>
        </div>

        <div class="grid-container">
          <!-- Charts Section -->
          <div class="col-8 card">
            <div class="card-header">
              <h3 class="card-title">Salary Distribution by Department</h3>
            </div>
            <div class="chart-container">
              <canvas id="salaryDistChart"></canvas>
            </div>
          </div>
          <div class="col-4 card">
            <div class="card-header">
              <h3 class="card-title">Attendance Breakdown</h3>
            </div>
            <div class="chart-container">
              <canvas id="attendanceChart"></canvas>
            </div>
          </div>
        </div>

        <div class="grid-container">
          <!-- Overtime trend chart -->
          <div class="col-7 card">
            <div class="card-header">
              <h3 class="card-title">Overtime Hours Trend (June 2026)</h3>
            </div>
            <div class="chart-container">
              <canvas id="overtimeTrendChart"></canvas>
            </div>
          </div>

          <!-- Top 5 Employees -->
          <div class="col-5 card">
            <div class="card-header">
              <h3 class="card-title">Top 5 Employees (Productivity)</h3>
              <a href="#top-performers" class="badge badge-neutral" style="cursor: pointer;">View Leaderboard</a>
            </div>
            <div class="table-responsive">
              <table class="table-custom">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.topEmployees.map(emp => `
                    <tr>
                      <td>
                        <div class="table-avatar-cell">
                          <img src="${emp.photo}" class="table-avatar" alt="Avatar">
                          <div>
                            <div class="emp-name-bold">${emp.full_name}</div>
                            <div class="emp-id-sub">${emp.position}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge badge-success">${emp.productivityScore} / 100</span></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize counters
    animateCounters();
    
    // Render Charts
    UIComponents.charts.salaryDistribution('salaryDistChart', data.charts.salaryDistribution);
    UIComponents.charts.attendanceBreakdown('attendanceChart', data.charts.attendance);
    UIComponents.charts.overtimeTrends('overtimeTrendChart', data.charts.overtimeTrends);

  } catch (err) {
    container.innerHTML = `<div class="error-panel"><i class="fa-solid fa-circle-exclamation"></i> Error loading dashboard.</div>`;
  }
}

// 2. Employees View
let employeeViewMode = 'grid'; // 'grid' or 'table'
async function renderEmployees(container) {
  try {
    const employees = await apiCall('/api/employees');
    const targetMonth = '2026-06';
    
    // Fetch productivity scores to display on profile cards
    const rankings = await apiCall('/api/analytics/top-performers');
    const scoreMap = {};
    rankings.forEach(r => {
      scoreMap[r.employee_id] = r.productivityScore;
    });

    const renderContents = () => {
      const searchVal = document.getElementById('emp-search').value.toLowerCase();
      const deptVal = document.getElementById('emp-dept-filter').value;

      const filtered = employees.filter(emp => {
        const matchesSearch = emp.full_name.toLowerCase().includes(searchVal) || 
                              emp.employee_id.toLowerCase().includes(searchVal) ||
                              emp.position.toLowerCase().includes(searchVal);
        const matchesDept = deptVal === '' || emp.department === deptVal;
        return matchesSearch && matchesDept;
      });

      const listDiv = document.getElementById('employee-list-container');
      
      if (filtered.length === 0) {
        listDiv.innerHTML = `
          <div class="empty-state-card col-12" style="text-align: center; padding: 40px;">
            <i class="fa-solid fa-users-slash" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <h3>No employees found</h3>
            <p>Try modifying your search queries or department filters.</p>
          </div>
        `;
        return;
      }

      if (employeeViewMode === 'grid') {
        listDiv.innerHTML = `
          <div class="employee-card-grid col-12">
            ${filtered.map(emp => `
              <div class="card profile-card">
                <div class="profile-card-header">
                  <button class="action-icon-btn edit-emp-btn" data-id="${emp.employee_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                  <button class="action-icon-btn delete delete-emp-btn" data-id="${emp.employee_id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <img src="${emp.photo}" alt="Avatar" class="profile-avatar">
                <h3>${emp.full_name}</h3>
                <p class="profile-position">${emp.position}</p>
                <div class="profile-details-list">
                  <div class="profile-detail-row">
                    <span>ID</span>
                    <span>${emp.employee_id}</span>
                  </div>
                  <div class="profile-detail-row">
                    <span>Department</span>
                    <span>${emp.department}</span>
                  </div>
                  <div class="profile-detail-row">
                    <span>Joining Date</span>
                    <span>${emp.joining_date}</span>
                  </div>
                  <div class="profile-detail-row">
                    <span>Monthly Salary</span>
                    <span>${state.settings.currencySymbol}${emp.monthly_salary.toLocaleString()}</span>
                  </div>
                  <div class="profile-detail-row">
                    <span>Productivity Index</span>
                    <span class="prod-score-badge">${scoreMap[emp.employee_id] || 100}</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        listDiv.innerHTML = `
          <div class="card col-12 table-responsive">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Joining Date</th>
                  <th>Salary</th>
                  <th>Productivity</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map(emp => `
                  <tr>
                    <td>
                      <div class="table-avatar-cell">
                        <img src="${emp.photo}" class="table-avatar" alt="Avatar">
                        <span class="emp-name-bold">${emp.full_name}</span>
                      </div>
                    </td>
                    <td><code>${emp.employee_id}</code></td>
                    <td>${emp.department}</td>
                    <td>${emp.joining_date}</td>
                    <td><strong>${state.settings.currencySymbol}${emp.monthly_salary.toLocaleString()}</strong></td>
                    <td><span class="badge badge-success">${scoreMap[emp.employee_id] || 100}</span></td>
                    <td style="text-align: right;">
                      <button class="action-icon-btn edit-emp-btn" data-id="${emp.employee_id}"><i class="fa-solid fa-pen-to-square"></i></button>
                      <button class="action-icon-btn delete delete-emp-btn" data-id="${emp.employee_id}"><i class="fa-solid fa-trash-can"></i></button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }

      // Add event listeners to newly generated buttons
      document.querySelectorAll('.edit-emp-btn').forEach(btn => {
        btn.addEventListener('click', () => openEmployeeForm(btn.getAttribute('data-id'), employees));
      });
      document.querySelectorAll('.delete-emp-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteEmployee(btn.getAttribute('data-id')));
      });
    };

    container.innerHTML = `
      <div class="fade-in">
        <!-- Controls panel -->
        <div class="controls-panel">
          <div class="search-input-wrapper">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="emp-search" placeholder="Search employees by name, ID or role...">
          </div>
          <select id="emp-dept-filter" class="form-group filter-dropdown" style="margin-bottom: 0;">
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
            <option value="Product Design">Product Design</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
          </select>
          <div class="btn-group">
            <button id="view-mode-grid" class="btn btn-outline btn-sm ${employeeViewMode === 'grid' ? 'active' : ''}"><i class="fa-solid fa-grip"></i></button>
            <button id="view-mode-table" class="btn btn-outline btn-sm ${employeeViewMode === 'table' ? 'active' : ''}"><i class="fa-solid fa-list"></i></button>
          </div>
          <button id="add-employee-btn" class="btn btn-primary"><i class="fa-solid fa-user-plus"></i> Add Employee</button>
        </div>

        <div class="grid-container" id="employee-list-container">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    // Set up filter actions
    document.getElementById('emp-search').addEventListener('input', renderContents);
    document.getElementById('emp-dept-filter').addEventListener('change', renderContents);
    
    document.getElementById('view-mode-grid').addEventListener('click', () => {
      employeeViewMode = 'grid';
      renderEmployees(container);
    });
    document.getElementById('view-mode-table').addEventListener('click', () => {
      employeeViewMode = 'table';
      renderEmployees(container);
    });

    document.getElementById('add-employee-btn').addEventListener('click', () => {
      openEmployeeForm();
    });

    renderContents();

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading employees directory.</div>`;
  }
}

// 3. Attendance View
let attendanceViewMode = 'calendar'; // 'calendar' or 'list'
let selectedAttendanceDate = new Date().toISOString().split('T')[0];
async function renderAttendance(container) {
  try {
    const employees = await apiCall('/api/employees');
    const dateAtt = await apiCall(`/api/attendance?date=${selectedAttendanceDate}`);
    const allAttendance = await apiCall('/api/attendance');

    const renderContents = () => {
      const displayContainer = document.getElementById('attendance-display-container');
      
      if (attendanceViewMode === 'calendar') {
        displayContainer.innerHTML = `<div class="col-12" id="attendance-calendar-div"></div>`;
        UIComponents.calendar.render(
          'attendance-calendar-div', 
          allAttendance, 
          employees, 
          selectedAttendanceDate, 
          (dateStr) => {
            selectedAttendanceDate = dateStr;
            attendanceViewMode = 'list';
            renderAttendance(container);
          },
          (newMonthStr) => {
            selectedAttendanceDate = newMonthStr;
            renderAttendance(container);
          }
        );
      } else {
        // Render List view with bulk marking features
        displayContainer.innerHTML = `
          <div class="card col-12">
            <div class="card-header">
              <h3 class="card-title">Mark Records for: <code>${selectedAttendanceDate}</code></h3>
              <div class="header-actions">
                <button id="bulk-mark-btn" class="btn btn-primary btn-sm"><i class="fa-solid fa-floppy-disk"></i> Save Bulk Marking</button>
              </div>
            </div>
            <div class="table-responsive">
              <table class="table-custom">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>ID</th>
                    <th>Status Marking</th>
                  </tr>
                </thead>
                <tbody>
                  ${employees.map(emp => {
                    const record = dateAtt.find(a => a.employee_id === emp.employee_id);
                    const currentStatus = record ? record.status : 'Present';
                    return `
                      <tr>
                        <td>
                          <div class="table-avatar-cell">
                            <img src="${emp.photo}" class="table-avatar" alt="Avatar">
                            <span class="emp-name-bold">${emp.full_name}</span>
                          </div>
                        </td>
                        <td><code>${emp.employee_id}</code></td>
                        <td>
                          <div class="radio-group-container" style="margin-top: 0;" data-employee="${emp.employee_id}">
                            <label class="radio-box present btn-sm">
                              <input type="radio" name="status-${emp.employee_id}" value="Present" ${currentStatus === 'Present' ? 'checked' : ''}>
                              <span class="radio-label"><i class="fa-solid fa-circle-check"></i> Present</span>
                            </label>
                            <label class="radio-box halfday btn-sm">
                              <input type="radio" name="status-${emp.employee_id}" value="Half Day" ${currentStatus === 'Half Day' ? 'checked' : ''}>
                              <span class="radio-label"><i class="fa-solid fa-circle-pause"></i> Half Day</span>
                            </label>
                            <label class="radio-box absent btn-sm">
                              <input type="radio" name="status-${emp.employee_id}" value="Absent" ${currentStatus === 'Absent' ? 'checked' : ''}>
                              <span class="radio-label"><i class="fa-solid fa-circle-xmark"></i> Absent</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;

        document.getElementById('bulk-mark-btn').addEventListener('click', saveBulkAttendance);
      }
    };

    container.innerHTML = `
      <div class="fade-in">
        <div class="controls-panel">
          <div class="form-group" style="margin-bottom: 0;">
            <label for="att-date-picker">Attendance Date</label>
            <input type="date" id="att-date-picker" value="${selectedAttendanceDate}" style="margin-bottom: 0;">
          </div>
          <div class="btn-group" style="margin-left: auto;">
            <button id="att-mode-calendar" class="btn btn-outline ${attendanceViewMode === 'calendar' ? 'active' : ''}"><i class="fa-solid fa-calendar-days"></i> Calendar</button>
            <button id="att-mode-list" class="btn btn-outline ${attendanceViewMode === 'list' ? 'active' : ''}"><i class="fa-solid fa-list-check"></i> Daily Sheet</button>
          </div>
          <button id="mark-attendance-btn" class="btn btn-primary"><i class="fa-solid fa-check-double"></i> Mark Single</button>
        </div>

        <div class="grid-container" id="attendance-display-container">
          <!-- Dynamic Content -->
        </div>
      </div>
    `;

    document.getElementById('att-date-picker').addEventListener('change', (e) => {
      selectedAttendanceDate = e.target.value;
      attendanceViewMode = 'list'; // Switch to list view on date change
      renderAttendance(container);
    });

    document.getElementById('att-mode-calendar').addEventListener('click', () => {
      attendanceViewMode = 'calendar';
      renderAttendance(container);
    });
    document.getElementById('att-mode-list').addEventListener('click', () => {
      attendanceViewMode = 'list';
      renderAttendance(container);
    });

    document.getElementById('mark-attendance-btn').addEventListener('click', () => {
      openAttendanceModal(employees);
    });

    renderContents();

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading attendance logs.</div>`;
  }
}

// 4. Overtime View
let selectedOvertimeMonth = '2026-06';
async function renderOvertime(container) {
  try {
    const employees = await apiCall('/api/employees');
    const overtimeRecords = await apiCall('/api/overtime');
    
    const monthlyFiltered = overtimeRecords.filter(o => o.date.startsWith(selectedOvertimeMonth));
    
    // Group totals by employee
    const otSummary = {};
    employees.forEach(e => {
      otSummary[e.employee_id] = { name: e.full_name, dept: e.department, avatar: e.photo, hours: 0, count: 0 };
    });
    monthlyFiltered.forEach(rec => {
      if (otSummary[rec.employee_id]) {
        otSummary[rec.employee_id].hours += rec.overtime_hours;
        otSummary[rec.employee_id].count += 1;
      }
    });

    container.innerHTML = `
      <div class="fade-in">
        <div class="controls-panel">
          <div class="form-group" style="margin-bottom: 0;">
            <label for="ot-month-picker">Filter Month</label>
            <input type="month" id="ot-month-picker" value="${selectedOvertimeMonth}">
          </div>
          <button id="add-overtime-btn" class="btn btn-primary" style="margin-left: auto;"><i class="fa-solid fa-plus"></i> Add Overtime</button>
        </div>

        <div class="grid-container">
          <!-- Summary Table -->
          <div class="col-8 card">
            <div class="card-header">
              <h3 class="card-title">Monthly Overtime Hours Summary</h3>
            </div>
            <div class="table-responsive">
              <table class="table-custom">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Days Logged</th>
                    <th>Total OT Hours</th>
                    <th>Calculated Pay Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.keys(otSummary).map(empId => {
                    const row = otSummary[empId];
                    const payBonus = row.hours * state.settings.overtimeRate;
                    return `
                      <tr>
                        <td>
                          <div class="table-avatar-cell">
                            <img src="${row.avatar}" class="table-avatar" alt="Avatar">
                            <span class="emp-name-bold">${row.name}</span>
                          </div>
                        </td>
                        <td>${row.dept}</td>
                        <td>${row.count} days</td>
                        <td><strong>${row.hours} hrs</strong></td>
                        <td><span class="badge badge-success">${state.settings.currencySymbol}${payBonus.toLocaleString()}</span></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- History Feed -->
          <div class="col-4 card" style="display: flex; flex-direction: column;">
            <div class="card-header">
              <h3 class="card-title">Recent Logs (Month)</h3>
            </div>
            <div style="flex: 1; overflow-y: auto; max-height: 400px; display: flex; flex-direction: column; gap: 12px;">
              ${monthlyFiltered.length === 0 ? `
                <div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
                  No overtime hours recorded.
                </div>
              ` : monthlyFiltered.map(rec => {
                const emp = employees.find(e => e.employee_id === rec.employee_id);
                return `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-primary); border-radius: var(--border-radius-sm); border-left: 3px solid var(--warning-color);">
                    <div>
                      <div class="emp-name-bold" style="font-size: 0.85rem;">${emp ? emp.full_name : 'Unknown'}</div>
                      <div style="font-size: 0.75rem; color: var(--text-secondary);">${rec.date} • ${rec.overtime_hours} hrs</div>
                    </div>
                    <button class="action-icon-btn delete delete-ot-btn" data-id="${rec.overtime_id}"><i class="fa-solid fa-trash-can"></i></button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('ot-month-picker').addEventListener('change', (e) => {
      selectedOvertimeMonth = e.target.value;
      renderOvertime(container);
    });

    document.getElementById('add-overtime-btn').addEventListener('click', () => {
      openOvertimeModal(employees);
    });

    document.querySelectorAll('.delete-ot-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteOvertime(btn.getAttribute('data-id')));
    });

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading overtime tracker.</div>`;
  }
}

// 5. Payroll View
let selectedPayrollMonth = '2026-06';
async function renderPayroll(container) {
  try {
    const employees = await apiCall('/api/employees');
    const settings = await apiCall('/api/settings');
    state.settings = settings;

    // Fetch computed salaries for this month
    let salaries = await apiCall(`/api/payroll/slips?month=${selectedPayrollMonth}`);
    const hasCalculated = salaries.length > 0;

    container.innerHTML = `
      <div class="fade-in">
        <div class="controls-panel">
          <div class="form-group" style="margin-bottom: 0;">
            <label for="payroll-month-picker">Payroll Month</label>
            <input type="month" id="payroll-month-picker" value="${selectedPayrollMonth}">
          </div>
          <button id="calculate-payroll-btn" class="btn btn-cyan" style="margin-left: auto;">
            <i class="fa-solid fa-calculator"></i> Calculate Monthly Payroll
          </button>
        </div>

        <div class="grid-container">
          <div class="col-12 card">
            <div class="card-header">
              <h3 class="card-title">Salary Breakdown Sheet</h3>
              <div>
                ${hasCalculated ? `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Processed</span>` : `<span class="badge badge-warning"><i class="fa-solid fa-circle-exclamation"></i> Pending Calculation</span>`}
              </div>
            </div>

            ${!hasCalculated ? `
              <div style="text-align: center; padding: 50px 0;">
                <i class="fa-solid fa-wallet" style="font-size: 3.5rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
                <h3>No payroll data calculated yet for ${selectedPayrollMonth}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 20px;">Click the button above to automatically process attendance, overtime rates, and base salaries for all active employees.</p>
              </div>
            ` : `
              <div class="table-responsive">
                <table class="table-custom">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Monthly Base</th>
                      <th>Present Days</th>
                      <th>Attendance Salary</th>
                      <th>Overtime Hours</th>
                      <th>Overtime Pay</th>
                      <th>Net final Salary</th>
                      <th style="text-align: right;">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${salaries.map(sal => {
                      const emp = employees.find(e => e.employee_id === sal.employee_id);
                      if (!emp) return '';
                      const baseSalary = emp.monthly_salary;
                      const dailyRate = baseSalary / 30;
                      const attendanceSalary = Math.round(sal.present_days * dailyRate);
                      const overtimePay = sal.overtime_hours * settings.overtimeRate;
                      
                      return `
                        <tr>
                          <td>
                            <div class="table-avatar-cell">
                              <img src="${emp.photo}" class="table-avatar" alt="Avatar">
                              <div>
                                <span class="emp-name-bold">${emp.full_name}</span>
                                <div class="emp-id-sub">${emp.position}</div>
                              </div>
                            </div>
                          </td>
                          <td>${settings.currencySymbol}${baseSalary.toLocaleString()}</td>
                          <td>${sal.present_days} days</td>
                          <td>${settings.currencySymbol}${attendanceSalary.toLocaleString()}</td>
                          <td>${sal.overtime_hours} hrs</td>
                          <td>${settings.currencySymbol}${overtimePay.toLocaleString()}</td>
                          <td><strong>${settings.currencySymbol}${sal.final_salary.toLocaleString()}</strong></td>
                          <td style="text-align: right;">
                            <a href="#salary-slip" class="btn btn-outline btn-sm view-slip-link" data-id="${sal.salary_id}">
                              <i class="fa-solid fa-receipt"></i> Slip
                            </a>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    document.getElementById('payroll-month-picker').addEventListener('change', (e) => {
      selectedPayrollMonth = e.target.value;
      renderPayroll(container);
    });

    document.getElementById('calculate-payroll-btn').addEventListener('click', async () => {
      try {
        await apiCall('/api/payroll/calculate', 'POST', { month: selectedPayrollMonth });
        alert(`Payroll calculations complete for ${selectedPayrollMonth}!`);
        renderPayroll(container);
      } catch (err) {
        alert('Failed to calculate payroll: ' + err.message);
      }
    });

    // Make view slip link redirect to salary-slip view with state
    document.querySelectorAll('.view-slip-link').forEach(link => {
      link.addEventListener('click', (e) => {
        state.selectedSalarySlipId = link.getAttribute('data-id');
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading payroll database.</div>`;
  }
}

// 6. Salary Slip Generator View
async function renderSalarySlip(container) {
  try {
    const employees = await apiCall('/api/employees');
    const settings = await apiCall('/api/settings');
    const allSalaries = await apiCall('/api/payroll/slips');

    let currentSlip = null;
    if (state.selectedSalarySlipId) {
      currentSlip = allSalaries.find(s => s.salary_id === state.selectedSalarySlipId);
    } else if (allSalaries.length > 0) {
      currentSlip = allSalaries[0];
    }

    const renderSlip = () => {
      const slipDetailsDiv = document.getElementById('slip-details-pane');
      if (!currentSlip) {
        slipDetailsDiv.innerHTML = `
          <div class="card" style="text-align: center; padding: 50px 0;">
            <i class="fa-solid fa-file-excel" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
            <h3>No salary slips available</h3>
            <p>Please go to the <strong>Payroll</strong> tab and calculate payroll first.</p>
          </div>
        `;
        return;
      }

      const emp = employees.find(e => e.employee_id === currentSlip.employee_id);
      if (!emp) return;

      const baseSalary = emp.monthly_salary;
      const dailyRate = baseSalary / 30;
      const attPay = Math.round(currentSlip.present_days * dailyRate);
      const otPay = currentSlip.overtime_hours * settings.overtimeRate;
      
      const leaveDays = Math.max(0, 30 - currentSlip.present_days);
      const leaveDeduction = Math.round(leaveDays * dailyRate);

      slipDetailsDiv.innerHTML = `
        <div class="card" style="border: none; padding: 0;">
          <div style="display: flex; gap: 10px; margin-bottom: 20px; justify-content: flex-end;">
            <button id="print-slip-btn" class="btn btn-outline"><i class="fa-solid fa-print"></i> Print Payslip</button>
            <button id="export-pdf-btn" class="btn btn-primary"><i class="fa-solid fa-file-pdf"></i> Download PDF</button>
          </div>

          <div class="slip-document-card" id="printable-payslip">
            <div class="slip-doc-header">
              <div class="slip-company-branding">
                <h2>${settings.companyName}</h2>
                <p>Corporate Salary Statement</p>
              </div>
              <div class="slip-doc-title">
                <h3>PAYSLIP</h3>
                <p>Month: ${currentSlip.month}</p>
              </div>
            </div>

            <div class="slip-info-grid">
              <div class="slip-info-column">
                <table>
                  <tr><td>Employee ID</td><td>: ${emp.employee_id}</td></tr>
                  <tr><td>Full Name</td><td>: ${emp.full_name}</td></tr>
                  <tr><td>Job Title</td><td>: ${emp.position}</td></tr>
                  <tr><td>Department</td><td>: ${emp.department}</td></tr>
                </table>
              </div>
              <div class="slip-info-column">
                <table>
                  <tr><td>Payslip Ref No</td><td>: ${currentSlip.salary_id}</td></tr>
                  <tr><td>Joining Date</td><td>: ${emp.joining_date}</td></tr>
                  <tr><td>Statement Date</td><td>: June 24, 2026</td></tr>
                  <tr><td>Overtime Rate</td><td>: ${settings.currencySymbol}${settings.overtimeRate}/hr</td></tr>
                </table>
              </div>
            </div>

            <table class="slip-breakdown-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right;">Earnings</th>
                  <th style="text-align: right;">Deductions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Base Monthly Salary</td>
                  <td style="text-align: right;">${settings.currencySymbol}${baseSalary.toLocaleString()}</td>
                  <td style="text-align: right;">-</td>
                </tr>
                <tr>
                  <td>Attendance Earnings (${currentSlip.present_days} / 30 days worked)</td>
                  <td style="text-align: right;">${settings.currencySymbol}${attPay.toLocaleString()}</td>
                  <td style="text-align: right;">-</td>
                </tr>
                <tr>
                  <td>Overtime Bonus (${currentSlip.overtime_hours} hrs logged)</td>
                  <td style="text-align: right;">${settings.currencySymbol}${otPay.toLocaleString()}</td>
                  <td style="text-align: right;">-</td>
                </tr>
                <tr>
                  <td>Unworked Leaves Deduction (${leaveDays} days absent)</td>
                  <td style="text-align: right;">-</td>
                  <td style="text-align: right; color: var(--danger-color);">${settings.currencySymbol}${leaveDeduction.toLocaleString()}</td>
                </tr>
                <tr class="total-row">
                  <td>Net Pay (Net Salary Distributed)</td>
                  <td colspan="2" style="text-align: right; font-size: 1.1rem; color: var(--accent-blue);">
                    ${settings.currencySymbol}${currentSlip.final_salary.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="slip-info-grid" style="margin-top: 50px;">
              <div style="text-align: center;">
                <div style="border-top: 1px solid #A0AEC0; width: 180px; margin: 0 auto 6px; padding-top: 4px; font-size: 0.8rem; font-weight: 600;">Employee Signature</div>
              </div>
              <div style="text-align: center;">
                <div style="border-top: 1px solid #A0AEC0; width: 180px; margin: 0 auto 6px; padding-top: 4px; font-size: 0.8rem; font-weight: 600;">HR Director Signature</div>
              </div>
            </div>

            <div class="slip-footer-notes">
              This is a computer generated payslip statement and does not require an official stamp. For queries, contact Accounts.
            </div>
          </div>
        </div>
      `;

      // Print Handler
      document.getElementById('print-slip-btn').addEventListener('click', () => {
        window.print();
      });
      document.getElementById('export-pdf-btn').addEventListener('click', () => {
        window.print(); // Easy mock print is best
      });
    };

    container.innerHTML = `
      <div class="fade-in salary-slip-view-container">
        <!-- Sidebar slip picker -->
        <div class="slip-selector-sidebar card">
          <div class="card-header">
            <h3 class="card-title">Select Payroll Slip</h3>
          </div>
          <div class="slip-list-items" id="slip-sidebar-list">
            <!-- Populated dynamically -->
          </div>
        </div>

        <!-- Payslip pane -->
        <div class="slip-workspace" id="slip-details-pane">
          <!-- Populated dynamically -->
        </div>
      </div>
    `;

    // Populate Sidebar
    const sidebarList = document.getElementById('slip-sidebar-list');
    if (allSalaries.length === 0) {
      sidebarList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 20px;">No slips generated.</div>`;
    } else {
      sidebarList.innerHTML = allSalaries.map(sal => {
        const emp = employees.find(e => e.employee_id === sal.employee_id);
        const isActive = currentSlip && currentSlip.salary_id === sal.salary_id;
        return `
          <div class="slip-list-card ${isActive ? 'active' : ''}" data-id="${sal.salary_id}">
            <div>
              <div class="emp-name-bold" style="font-size: 0.85rem;">${emp ? emp.full_name : 'Unknown'}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${sal.month} • Ref: ${sal.salary_id}</div>
            </div>
            <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-blue);">
              ${settings.currencySymbol}${sal.final_salary.toLocaleString()}
            </div>
          </div>
        `;
      }).join('');

      document.querySelectorAll('.slip-list-card').forEach(card => {
        card.addEventListener('click', () => {
          state.selectedSalarySlipId = card.getAttribute('data-id');
          renderSalarySlip(container);
        });
      });
    }

    renderSlip();

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading Payslip generator.</div>`;
  }
}

// 7. Reports & Analytics View
let selectedReportMonth = '2026-06';
async function renderReports(container) {
  try {
    const employees = await apiCall('/api/employees');
    const dbData = await apiCall('/api/analytics/dashboard');

    container.innerHTML = `
      <div class="fade-in">
        <div class="controls-panel">
          <div class="form-group" style="margin-bottom: 0;">
            <label for="report-month-picker">Billing Month</label>
            <input type="month" id="report-month-picker" value="${selectedReportMonth}">
          </div>
          <button id="export-csv-reports-btn" class="btn btn-outline" style="margin-left: auto;">
            <i class="fa-solid fa-file-csv"></i> Export CSV Report
          </button>
          <button id="print-full-report-btn" class="btn btn-primary">
            <i class="fa-solid fa-print"></i> Print Statement
          </button>
        </div>

        <div class="grid-container">
          <div class="col-6 card">
            <div class="card-header">
              <h3 class="card-title">Employee Attendance Allocation</h3>
            </div>
            <div class="chart-container">
              <canvas id="reportAttendanceBreakdownChart"></canvas>
            </div>
          </div>

          <div class="col-6 card">
            <div class="card-header">
              <h3 class="card-title">Salary Distribution (Dept)</h3>
            </div>
            <div class="chart-container">
              <canvas id="reportSalaryDistChart"></canvas>
            </div>
          </div>
        </div>

        <div class="grid-container">
          <div class="col-12 card">
            <div class="card-header">
              <h3 class="card-title">Monthly Enterprise Summary Report</h3>
            </div>
            <div class="table-responsive">
              <table class="table-custom" id="summary-report-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Job Role</th>
                    <th>Department</th>
                    <th>Attendance Index</th>
                    <th>OT Hours logged</th>
                    <th>Salary Budget</th>
                  </tr>
                </thead>
                <tbody>
                  ${dbData.topEmployees.map(emp => `
                    <tr>
                      <td><code>${emp.employee_id}</code></td>
                      <td><strong>${emp.full_name}</strong></td>
                      <td>${emp.position}</td>
                      <td>${emp.department}</td>
                      <td>${emp.attendanceRate}%</td>
                      <td>${emp.overtimeHours} hrs</td>
                      <td>${state.settings.currencySymbol}${emp.productivityScore * 100}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('report-month-picker').addEventListener('change', (e) => {
      selectedReportMonth = e.target.value;
      renderReports(container);
    });

    document.getElementById('export-csv-reports-btn').addEventListener('click', () => {
      UIComponents.exports.csv('summary-report-table', `Payroll_Report_${selectedReportMonth}`);
    });

    document.getElementById('print-full-report-btn').addEventListener('click', () => {
      window.print();
    });

    // Render Charts
    UIComponents.charts.attendanceBreakdown('reportAttendanceBreakdownChart', dbData.charts.attendance);
    UIComponents.charts.salaryDistribution('reportSalaryDistChart', dbData.charts.salaryDistribution);

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading analytics dashboard.</div>`;
  }
}

// 8. Top Performers View
async function renderTopPerformers(container) {
  try {
    const rankings = await apiCall('/api/analytics/top-performers');
    
    // Top 3 Podium
    const first = rankings[0] || null;
    const second = rankings[1] || null;
    const third = rankings[2] || null;
    
    const rest = rankings.slice(3);

    container.innerHTML = `
      <div class="fade-in">
        <!-- Podium Banner Graphic -->
        <div class="banner-card" style="background-image: url('assets/top_performer_banner.png'); margin-bottom: 24px;">
          <div class="overlay" style="background: linear-gradient(100deg, rgba(10,25,47,0.92) 0%, rgba(10,25,47,0.6) 100%);"></div>
          <div class="banner-content" style="max-width: 80%;">
            <h2>Top Performers Ranking</h2>
            <p>Our algorithm ranks corporate performance indicators monthly. Rankings are based on attendance check-ins, logged overtime, and absence deductibles.</p>
          </div>
        </div>

        <!-- Podium Section -->
        <div class="podium-section">
          <!-- 2nd Place -->
          ${second ? `
            <div class="podium-place second">
              <div class="podium-avatar-wrapper">
                <img src="${second.photo}" class="podium-avatar" alt="Silver Avatar">
              </div>
              <div class="podium-emp-name">${second.full_name}</div>
              <div class="podium-pedestal">
                <div class="podium-rank-num">2</div>
                <div class="podium-score">${second.productivityScore} pts</div>
              </div>
            </div>
          ` : ''}

          <!-- 1st Place -->
          ${first ? `
            <div class="podium-place first">
              <div class="podium-avatar-wrapper">
                <i class="fa-solid fa-crown podium-crown"></i>
                <img src="${first.photo}" class="podium-avatar" alt="Gold Avatar">
              </div>
              <div class="podium-emp-name">${first.full_name}</div>
              <div class="podium-pedestal">
                <div class="podium-rank-num">1</div>
                <div class="podium-score">${first.productivityScore} pts</div>
              </div>
            </div>
          ` : ''}

          <!-- 3rd Place -->
          ${third ? `
            <div class="podium-place third">
              <div class="podium-avatar-wrapper">
                <img src="${third.photo}" class="podium-avatar" alt="Bronze Avatar">
              </div>
              <div class="podium-emp-name">${third.full_name}</div>
              <div class="podium-pedestal">
                <div class="podium-rank-num">3</div>
                <div class="podium-score">${third.productivityScore} pts</div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Complete Leaderboard Grid -->
        <div class="grid-container">
          <div class="col-12 card">
            <div class="card-header">
              <h3 class="card-title">Corporate Leaderboard Listings</h3>
            </div>
            <div class="table-responsive">
              <table class="table-custom">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Present Days</th>
                    <th>Absence Deductions</th>
                    <th>OT Hours logged</th>
                    <th>Final Score Index</th>
                  </tr>
                </thead>
                <tbody>
                  ${rankings.map((emp, idx) => `
                    <tr>
                      <td><strong>#${idx + 1}</strong></td>
                      <td>
                        <div class="table-avatar-cell">
                          <img src="${emp.photo}" class="table-avatar" alt="Avatar">
                          <div>
                            <span class="emp-name-bold">${emp.full_name}</span>
                            <div class="emp-id-sub">${emp.position}</div>
                          </div>
                        </div>
                      </td>
                      <td>${emp.department}</td>
                      <td>${emp.presentDays} / 30</td>
                      <td><span class="badge badge-danger">${emp.absentDays} days</span></td>
                      <td>${emp.overtimeHours} hrs</td>
                      <td>
                        <span class="badge badge-success" style="font-size: 0.85rem; padding: 6px 12px;">
                          ${emp.productivityScore}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading leaderboard metrics.</div>`;
  }
}

// 9. Settings View
async function renderSettings(container) {
  try {
    const settings = await apiCall('/api/settings');
    state.settings = settings;

    container.innerHTML = `
      <div class="fade-in grid-container">
        <!-- Settings Card -->
        <div class="col-6 card">
          <div class="card-header">
            <h3 class="card-title">Enterprise System Parameters</h3>
          </div>
          <form id="settings-form">
            <div class="form-group">
              <label for="settings-company-name">Company Branding Name</label>
              <input type="text" id="settings-company-name" value="${settings.companyName}" required>
            </div>
            
            <div class="form-group">
              <label for="settings-ot-rate">Global Overtime Hourly Rate (${settings.currencySymbol})</label>
              <input type="number" id="settings-ot-rate" value="${settings.overtimeRate}" min="1" required>
            </div>

            <div class="form-group">
              <label for="settings-currency">System Currency</label>
              <select id="settings-currency" required>
                <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>USD ($ - US Dollar)</option>
                <option value="EUR" ${settings.currency === 'EUR' ? 'selected' : ''}>EUR (€ - Euro)</option>
                <option value="GBP" ${settings.currency === 'GBP' ? 'selected' : ''}>GBP (£ - Pound Sterling)</option>
                <option value="INR" ${settings.currency === 'INR' ? 'selected' : ''}>INR (₹ - Indian Rupee)</option>
              </select>
            </div>

            <div class="form-group">
              <label for="settings-currency-symbol">Currency Symbol</label>
              <input type="text" id="settings-currency-symbol" value="${settings.currencySymbol}" maxlength="3" required>
            </div>

            <div style="margin-top: 24px;">
              <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save System Config</button>
            </div>
          </form>
        </div>

        <div class="col-6 card">
          <div class="card-header">
            <h3 class="card-title">System Information</h3>
          </div>
          <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <img src="assets/logo.png" style="width: 60px;" alt="System Logo">
              <div>
                <h4 style="font-weight: 800; font-size: 1.1rem; color: var(--text-primary);">PayStream Enterprise Suite</h4>
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Production Version 1.0.0 (Mac Release)</p>
              </div>
            </div>

            <div style="font-size: 0.8rem; line-height: 1.6; color: var(--text-secondary); background: var(--bg-primary); padding: 15px; border-radius: var(--border-radius-md);">
              <strong>Admin Audit Log:</strong><br>
              • Database Connected: JSON File-backed engine<br>
              • Port Listening: HTTP Staging Port 3000<br>
              • Encryption Suite: Built-in TLS and basic credentials verification<br>
              • Environment: Production Web Environment
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('settings-form').addEventListener('submit', saveSettings);

  } catch (err) {
    container.innerHTML = `<div class="error-panel">Error loading settings console.</div>`;
  }
}

// ==========================================
// ACTIONS & DATA MANIPULATION HANDLERS
// ==========================================

// Login Submitter
async function handleLogin(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const errorDiv = document.getElementById('login-error');

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const data = await apiCall('/api/auth/login', 'POST', { username, password });
    if (data.success) {
      state.user = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      setupSessionUI();
      navigate('dashboard');
    }
  } catch (err) {
    errorDiv.classList.remove('hidden');
    errorDiv.textContent = err.message || 'Invalid Credentials.';
  }
}

// Save Settings Form
async function saveSettings(e) {
  e.preventDefault();
  const companyName = document.getElementById('settings-company-name').value;
  const overtimeRate = document.getElementById('settings-ot-rate').value;
  const currency = document.getElementById('settings-currency').value;
  const currencySymbol = document.getElementById('settings-currency-symbol').value;

  try {
    await apiCall('/api/settings', 'POST', { companyName, overtimeRate, currency, currencySymbol });
    alert('System settings updated successfully!');
    navigate('settings');
  } catch (err) {
    alert('Failed to update settings: ' + err.message);
  }
}

// Open Employee Form Add/Edit Modal
function openEmployeeForm(employeeId = null, employeesList = []) {
  const form = document.getElementById('employee-form');
  const title = document.getElementById('employee-modal-title');
  
  form.reset();
  
  if (employeeId) {
    const emp = employeesList.find(e => e.employee_id === employeeId);
    if (emp) {
      title.textContent = 'Edit Employee Profile';
      document.getElementById('emp-form-id').value = emp.employee_id;
      document.getElementById('emp-full-name').value = emp.full_name;
      document.getElementById('emp-photo').value = emp.photo;
      document.getElementById('emp-position').value = emp.position;
      document.getElementById('emp-department').value = emp.department;
      document.getElementById('emp-joining-date').value = emp.joining_date;
      document.getElementById('emp-monthly-salary').value = emp.monthly_salary;
    }
  } else {
    title.textContent = 'Add New Employee';
    document.getElementById('emp-form-id').value = '';
    // Set default joining date to today
    document.getElementById('emp-joining-date').value = new Date().toISOString().split('T')[0];
  }
  
  Modals.open('employee-modal');
}

// Submit Employee Info (Add or Edit)
async function submitEmployeeForm(e) {
  e.preventDefault();
  const id = document.getElementById('emp-form-id').value;
  const full_name = document.getElementById('emp-full-name').value;
  const photo = document.getElementById('emp-photo').value;
  const position = document.getElementById('emp-position').value;
  const department = document.getElementById('emp-department').value;
  const joining_date = document.getElementById('emp-joining-date').value;
  const monthly_salary = parseFloat(document.getElementById('emp-monthly-salary').value);

  const payload = { full_name, photo, position, department, joining_date, monthly_salary };

  try {
    if (id) {
      await apiCall(`/api/employees/${id}`, 'PUT', payload);
      alert('Employee profile updated!');
    } else {
      await apiCall('/api/employees', 'POST', payload);
      alert('New employee added successfully!');
    }
    Modals.close('employee-modal');
    navigate('employees');
  } catch (err) {
    alert('Error saving employee: ' + err.message);
  }
}

// Delete Employee
async function deleteEmployee(id) {
  if (!confirm(`Are you sure you want to delete employee ${id}? This deletes all related payroll and attendance logs.`)) return;

  try {
    await apiCall(`/api/employees/${id}`, 'DELETE');
    alert('Employee deleted.');
    navigate('employees');
  } catch (err) {
    alert('Error deleting employee: ' + err.message);
  }
}

// Open Attendance Modal
function openAttendanceModal(employees) {
  const select = document.getElementById('att-employee-select');
  select.innerHTML = employees.map(e => `<option value="${e.employee_id}">${e.full_name} (${e.employee_id})</option>`).join('');
  document.getElementById('att-date').value = new Date().toISOString().split('T')[0];
  Modals.open('attendance-modal');
}

// Save Single Attendance Log
async function submitAttendanceForm(e) {
  e.preventDefault();
  const employee_id = document.getElementById('att-employee-select').value;
  const date = document.getElementById('att-date').value;
  const status = document.querySelector('input[name="att-status"]:checked').value;

  try {
    await apiCall('/api/attendance', 'POST', { employee_id, date, status });
    Modals.close('attendance-modal');
    selectedAttendanceDate = date;
    attendanceViewMode = 'list';
    navigate('attendance');
  } catch (err) {
    alert('Failed to mark attendance: ' + err.message);
  }
}

// Save Daily Bulk Attendance Records
async function saveBulkAttendance() {
  const records = [];
  document.querySelectorAll('.radio-group-container[data-employee]').forEach(container => {
    const employee_id = container.getAttribute('data-employee');
    const status = container.querySelector(`input[name="status-${employee_id}"]:checked`).value;
    records.push({ employee_id, status });
  });

  try {
    await apiCall('/api/attendance/bulk', 'POST', { date: selectedAttendanceDate, records });
    alert(`Bulk attendance saved for ${selectedAttendanceDate}!`);
    attendanceViewMode = 'calendar';
    navigate('attendance');
  } catch (err) {
    alert('Failed to save bulk attendance: ' + err.message);
  }
}

// Open Overtime logging modal
function openOvertimeModal(employees) {
  const select = document.getElementById('ot-employee-select');
  select.innerHTML = employees.map(e => `<option value="${e.employee_id}">${e.full_name} (${e.employee_id})</option>`).join('');
  document.getElementById('ot-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('ot-hours').value = 1;
  Modals.open('overtime-modal');
}

// Log Overtime Submitter
async function submitOvertimeForm(e) {
  e.preventDefault();
  const employee_id = document.getElementById('ot-employee-select').value;
  const date = document.getElementById('ot-date').value;
  const overtime_hours = parseFloat(document.getElementById('ot-hours').value);

  try {
    await apiCall('/api/overtime', 'POST', { employee_id, date, overtime_hours });
    Modals.close('overtime-modal');
    selectedOvertimeMonth = date.substring(0, 7);
    navigate('overtime');
  } catch (err) {
    alert('Failed to log overtime hours: ' + err.message);
  }
}

// Delete Overtime record
async function deleteOvertime(id) {
  if (!confirm('Are you sure you want to delete this overtime log?')) return;
  try {
    await apiCall(`/api/overtime/${id}`, 'DELETE');
    navigate('overtime');
  } catch (err) {
    alert('Failed to delete log: ' + err.message);
  }
}

// Animated Counters helper
function animateCounters() {
  const counters = document.querySelectorAll('.animated-counter');
  counters.forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const increment = target / 20; // 20 steps
    let current = 0;
    
    const update = () => {
      current += increment;
      if (current >= target) {
        counter.textContent = Math.round(target);
      } else {
        counter.textContent = Math.round(current);
        setTimeout(update, 20);
      }
    };
    update();
  });

  const currencyCounters = document.querySelectorAll('.animated-counter-currency');
  currencyCounters.forEach(counter => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const increment = target / 20;
    let current = 0;
    
    const update = () => {
      current += increment;
      if (current >= target) {
        counter.textContent = state.settings.currencySymbol + Math.round(target).toLocaleString();
      } else {
        counter.textContent = state.settings.currencySymbol + Math.round(current).toLocaleString();
        setTimeout(update, 20);
      }
    };
    update();
  });
}

// ==========================================
// INITIALIZATION ON DOCUMENT READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSidebar();
  
  // Bind standard layout elements
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user');
    showLoginPage();
  });

  // Intercept Form Submit events
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('employee-form').addEventListener('submit', submitEmployeeForm);
  document.getElementById('attendance-form').addEventListener('submit', submitAttendanceForm);
  document.getElementById('overtime-form').addEventListener('submit', submitOvertimeForm);

  // Close modals clicking close btn or backdrop cancel
  document.querySelectorAll('.modal-close-btn, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', Modals.closeAll);
  });

  // Bind sidebar menu clicks
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = item.getAttribute('data-page');
      window.location.hash = pageId;
      
      // Auto-close sidebar on mobile after navigating
      if (window.innerWidth <= 768) {
        document.getElementById('app-sidebar').classList.remove('collapsed');
      }
    });
  });

  // Close sidebar clicking outside on mobile
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('app-sidebar');
      const expandBtn = document.getElementById('sidebar-expand-btn');
      
      if (sidebar.classList.contains('collapsed') && 
          !sidebar.contains(e.target) && 
          !expandBtn.contains(e.target) && 
          !e.target.closest('#sidebar-expand-btn')) {
        sidebar.classList.remove('collapsed');
      }
    }
  });

  // Hash Navigation Handler (Router trigger)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    const validPages = Object.keys(routes);
    if (validPages.includes(hash)) {
      navigate(hash);
    } else {
      navigate('dashboard');
    }
  });

  // Core boot trigger
  if (checkAuth()) {
    const hash = window.location.hash.replace('#', '');
    if (Object.keys(routes).includes(hash)) {
      navigate(hash);
    } else {
      navigate('dashboard');
    }
  }
});
