const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Get Productivity Score
function calculateProductivity(empId, monthStr) {
  const allAttendance = db.attendance.getAll().filter(a => a.employee_id === empId && a.date.startsWith(monthStr));
  const allOvertime = db.overtime.getAll().filter(o => o.employee_id === empId && o.date.startsWith(monthStr));

  // Determine actual working days where attendance was marked in the month
  const monthAttendance = db.attendance.getAll().filter(a => a.date.startsWith(monthStr));
  const uniqueDates = [...new Set(monthAttendance.map(a => a.date))];
  const totalWorkingDays = uniqueDates.length || 20;

  let presentDays = 0;
  let absentDays = 0;
  let halfDays = 0;

  allAttendance.forEach(a => {
    if (a.status === 'Present' || a.status === 'Leave') presentDays += 1;
    else if (a.status === 'Half Day') {
      presentDays += 0.5;
      halfDays += 1;
    } else if (a.status === 'Absent') absentDays += 1;
  });

  let overtimeHours = 0;
  allOvertime.forEach(o => {
    overtimeHours += o.overtime_hours;
  });

  const attendancePercentage = totalWorkingDays > 0 ? (presentDays / totalWorkingDays) * 100 : 100;
  const overtimePoints = overtimeHours * 1.5;
  const leavePenalty = absentDays * 5;

  const score = Math.max(0, Math.min(100, attendancePercentage + overtimePoints - leavePenalty));

  return {
    score: Math.round(score * 10) / 10,
    presentDays,
    absentDays,
    halfDays,
    overtimeHours,
    attendancePercentage: Math.round(attendancePercentage * 10) / 10
  };
}

// --- API Routes ---

// Authentication Route
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = db.auth.login(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  res.json({ success: true, user });
});

// Employees CRUD API
app.get('/api/employees', (req, res) => {
  try {
    const employees = db.employees.getAll();
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/employees/:id', (req, res) => {
  const employee = db.employees.getById(req.params.id);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  res.json(employee);
});

app.post('/api/employees', (req, res) => {
  const { full_name, position, department, joining_date, monthly_salary, photo } = req.body;
  if (!full_name || !position || !department || !monthly_salary) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const newEmp = db.employees.create({
    full_name,
    position,
    department,
    joining_date,
    monthly_salary,
    photo
  });

  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', (req, res) => {
  const { full_name, position, department, joining_date, monthly_salary, photo } = req.body;
  const updatedEmp = db.employees.update(req.params.id, {
    full_name,
    position,
    department,
    joining_date,
    monthly_salary,
    photo
  });

  if (!updatedEmp) return res.status(404).json({ error: 'Employee not found' });
  res.json(updatedEmp);
});

app.delete('/api/employees/:id', (req, res) => {
  const deleted = db.employees.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Employee not found' });
  res.json({ success: true, message: 'Employee deleted successfully' });
});

// Attendance API
app.get('/api/attendance', (req, res) => {
  const { date } = req.query;
  if (date) {
    return res.json(db.attendance.getByDate(date));
  }
  res.json(db.attendance.getAll());
});

app.post('/api/attendance', (req, res) => {
  const { employee_id, date, status } = req.body;
  if (!employee_id || !date || !status) {
    return res.status(400).json({ error: 'Missing employee_id, date, or status' });
  }

  const record = db.attendance.mark(employee_id, date, status);
  if (!record) return res.status(404).json({ error: 'Employee not found' });
  res.json(record);
});

app.post('/api/attendance/bulk', (req, res) => {
  const { date, records } = req.body;
  if (!date || !records || !Array.isArray(records)) {
    return res.status(400).json({ error: 'Missing date or records list' });
  }

  const updatedRecords = db.attendance.bulkMark(date, records);
  res.json({ success: true, count: updatedRecords.length, records: updatedRecords });
});

// Overtime API
app.get('/api/overtime', (req, res) => {
  res.json(db.overtime.getAll());
});

app.post('/api/overtime', (req, res) => {
  const { employee_id, date, overtime_hours } = req.body;
  if (!employee_id || !date || overtime_hours === undefined) {
    return res.status(400).json({ error: 'Missing employee_id, date, or overtime_hours' });
  }

  const record = db.overtime.add(employee_id, date, overtime_hours);
  if (!record) return res.status(404).json({ error: 'Employee not found' });
  res.json(record);
});

app.delete('/api/overtime/:id', (req, res) => {
  const deleted = db.overtime.delete(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Overtime record not found' });
  res.json({ success: true, message: 'Overtime record deleted' });
});

// Payroll & Salary API
app.get('/api/payroll/slips', (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.json(db.salaries.getAll());
  }
  res.json(db.salaries.getByMonth(month));
});

app.post('/api/payroll/calculate', (req, res) => {
  const { month } = req.body;
  if (!month) {
    return res.status(400).json({ error: 'Month (YYYY-MM) is required' });
  }

  const generatedSalaries = db.salaries.calculateMonthly(month);
  res.json({ success: true, count: generatedSalaries.length, salaries: generatedSalaries });
});

// Settings API
app.get('/api/settings', (req, res) => {
  res.json(db.settings.get());
});

app.post('/api/settings', (req, res) => {
  const updatedSettings = db.settings.update(req.body);
  res.json({ success: true, settings: updatedSettings });
});

// Analytics & Dashboard API
app.get('/api/analytics/dashboard', (req, res) => {
  const employees = db.employees.getAll();
  const attendance = db.attendance.getAll();
  const overtime = db.overtime.getAll();
  const salaries = db.salaries.getAll();
  const settings = db.settings.get();

  const todayStr = '2026-06-24'; // System today
  const targetMonth = '2026-06';
  
  const totalEmployees = employees.length;

  const todayAttendance = attendance.filter(a => a.date === todayStr);
  const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
  const absentToday = todayAttendance.filter(a => a.status === 'Absent').length + (totalEmployees - todayAttendance.length);
  const leaveToday = todayAttendance.filter(a => a.status === 'Leave').length;

  let dailyExpenses = 0;
  employees.forEach(emp => {
    const att = todayAttendance.find(a => a.employee_id === emp.employee_id);
    let factor = 0;
    if (att) {
      if (att.status === 'Present' || att.status === 'Leave') factor = 1;
      else if (att.status === 'Half Day') factor = 0.5;
    }
    const dailySalary = (emp.monthly_salary / 30) * factor;
    const otToday = overtime.filter(o => o.employee_id === emp.employee_id && o.date === todayStr);
    const otHours = otToday.reduce((sum, o) => sum + o.overtime_hours, 0);
    const otPay = otHours * settings.overtimeRate;
    dailyExpenses += (dailySalary + otPay);
  });

  let monthlyExpenses = 0;
  employees.forEach(emp => {
    const empAttendance = attendance.filter(a => a.employee_id === emp.employee_id && a.date.startsWith(targetMonth));
    let present_days = 0;
    empAttendance.forEach(a => {
      if (a.status === 'Present' || a.status === 'Leave') present_days += 1;
      else if (a.status === 'Half Day') present_days += 0.5;
    });
    const empOvertime = overtime.filter(o => o.employee_id === emp.employee_id && o.date.startsWith(targetMonth));
    let overtime_hours = 0;
    empOvertime.forEach(o => {
      overtime_hours += o.overtime_hours;
    });
    const daily_salary = emp.monthly_salary / 30;
    const attendance_pay = present_days * daily_salary;
    const overtime_pay = overtime_hours * settings.overtimeRate;
    monthlyExpenses += Math.round(attendance_pay + overtime_pay);
  });

  const juneAttendance = attendance.filter(a => a.date.startsWith(targetMonth));
  const attStats = { Present: 0, Absent: 0, 'Half Day': 0, Leave: 0 };
  juneAttendance.forEach(a => {
    if (attStats[a.status] !== undefined) attStats[a.status]++;
  });

  const deptSalary = {};
  employees.forEach(emp => {
    if (!deptSalary[emp.department]) deptSalary[emp.department] = 0;
    deptSalary[emp.department] += emp.monthly_salary;
  });

  const overtimeDailyTrend = {};
  const juneOvertime = overtime.filter(o => o.date.startsWith(targetMonth));
  juneOvertime.forEach(o => {
    const day = parseInt(o.date.split('-')[2]);
    if (!overtimeDailyTrend[day]) overtimeDailyTrend[day] = 0;
    overtimeDailyTrend[day] += o.overtime_hours;
  });

  const employeeProductivity = employees.map(emp => {
    const prod = calculateProductivity(emp.employee_id, targetMonth);
    return {
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      department: emp.department,
      position: emp.position,
      photo: emp.photo,
      productivityScore: prod.score,
      attendanceRate: prod.attendancePercentage,
      overtimeHours: prod.overtimeHours
    };
  });

  const top5Employees = [...employeeProductivity]
    .sort((a, b) => b.productivityScore - a.productivityScore)
    .slice(0, 5);

  res.json({
    widgets: {
      totalEmployees,
      presentToday,
      absentToday,
      leaveToday,
      dailyExpenses: Math.round(dailyExpenses),
      monthlyExpenses: Math.round(monthlyExpenses)
    },
    charts: {
      attendance: attStats,
      salaryDistribution: deptSalary,
      overtimeTrends: overtimeDailyTrend
    },
    topEmployees: top5Employees
  });
});

app.get('/api/analytics/top-performers', (req, res) => {
  const employees = db.employees.getAll();
  const targetMonth = '2026-06';
  
  const rankings = employees.map(emp => {
    const prod = calculateProductivity(emp.employee_id, targetMonth);
    return {
      employee_id: emp.employee_id,
      full_name: emp.full_name,
      department: emp.department,
      position: emp.position,
      photo: emp.photo,
      monthly_salary: emp.monthly_salary,
      productivityScore: prod.score,
      presentDays: prod.presentDays,
      absentDays: prod.absentDays,
      halfDays: prod.halfDays,
      overtimeHours: prod.overtimeHours,
      attendanceRate: prod.attendancePercentage
    };
  });

  rankings.sort((a, b) => b.productivityScore - a.productivityScore);
  res.json(rankings);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
