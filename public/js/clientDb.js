// LocalStorage Client-Side Database Engine (Vercel/Netlify Stateless Fallback)
(function () {
  const isClientDbMode = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  if (!isClientDbMode) {
    console.log('Running on localhost. Using backend API server.');
    return;
  }

  console.log('Running on stateless public domain. Switched to LocalStorage Client-Side Database.');

  const DB_KEY = 'paystream_local_db';

  // --- Initial Database Mock Data (Replicates db.js) ---
  function initializeLocalDb() {
    const initialDb = {
      settings: {
        companyName: 'PayStream Solutions',
        overtimeRate: 150,
        currency: 'INR',
        currencySymbol: '₹'
      },
      employees: [
        {
          employee_id: 'EMP001',
          full_name: 'Sarah J. Chen',
          photo: 'assets/avatar_placeholder.png',
          position: 'Lead Software Engineer',
          department: 'Engineering',
          joining_date: '2024-01-15',
          monthly_salary: 95000,
          phone: '+91 98765 43210',
          email: 'sarah.chen@company.com',
          address: 'Flat 402, Sea Green Apartments, Bandra West, Mumbai',
          dob: '1992-08-24',
          gender: 'Female'
        },
        {
          employee_id: 'EMP002',
          full_name: 'Alex R. Thompson',
          photo: 'assets/avatar_placeholder.png',
          position: 'HR Manager',
          department: 'Human Resources',
          joining_date: '2024-03-10',
          monthly_salary: 75000,
          phone: '+91 98765 43211',
          email: 'alex.t@company.com',
          address: '12, Park Street, Kolkata',
          dob: '1989-11-15',
          gender: 'Male'
        },
        {
          employee_id: 'EMP003',
          full_name: 'Michael L. Davis',
          photo: 'assets/avatar_placeholder.png',
          position: 'Financial Analyst',
          department: 'Finance',
          joining_date: '2024-06-01',
          monthly_salary: 82000,
          phone: '+91 98765 43212',
          email: 'michael.d@company.com',
          address: 'Apartment 101, Prestige Heights, Bangalore',
          dob: '1994-04-05',
          gender: 'Male'
        },
        {
          employee_id: 'EMP004',
          full_name: 'Emily B. Chen',
          photo: 'assets/avatar_placeholder.png',
          position: 'UX Designer',
          department: 'Product Design',
          joining_date: '2025-02-18',
          monthly_salary: 68000,
          phone: '+91 98765 43213',
          email: 'emily.chen@company.com',
          address: 'Plot 45, Jubilee Hills, Hyderabad',
          dob: '1996-01-20',
          gender: 'Female'
        },
        {
          employee_id: 'EMP005',
          full_name: 'Marcus A. Vance',
          photo: 'assets/avatar_placeholder.png',
          position: 'Marketing Specialist',
          department: 'Marketing',
          joining_date: '2025-05-20',
          monthly_salary: 58000,
          phone: '+91 98765 43214',
          email: 'marcus.v@company.com',
          address: 'House 89, Sector 15, Noida',
          dob: '1991-05-18',
          gender: 'Male'
        }
      ],
      attendance: [],
      overtime: [],
      salaries: []
    };

    // Populate June 2026 attendance and overtime logs
    const employees = initialDb.employees;
    const startDay = 1;
    const endDay = 24;
    const year = 2026;
    const month = 5; // June

    let attendanceCounter = 1;
    let overtimeCounter = 1;

    for (let day = startDay; day <= endDay; day++) {
      const dateStr = `${year}-06-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(year, month, day);
      const dayOfWeek = dateObj.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      employees.forEach((emp) => {
        let status = 'Present';
        const rand = Math.random();

        if (rand < 0.05) {
          status = 'Absent';
        } else if (rand < 0.12) {
          status = 'Half Day';
        } else if (rand < 0.18) {
          status = 'Leave';
        }

        initialDb.attendance.push({
          attendance_id: `ATT${String(attendanceCounter++).padStart(4, '0')}`,
          employee_id: emp.employee_id,
          date: dateStr,
          status: status
        });

        if (status === 'Present' && Math.random() < 0.25) {
          const hours = Math.floor(Math.random() * 3) + 1;
          initialDb.overtime.push({
            overtime_id: `OT${String(overtimeCounter++).padStart(4, '0')}`,
            employee_id: emp.employee_id,
            date: dateStr,
            overtime_hours: hours
          });
        }
      });
    }

    // Pre-calculate salaries for May 2026
    let salaryCounter = 1;
    const mayDays = 21;
    employees.forEach((emp) => {
      const present_days = mayDays - (Math.random() > 0.7 ? 1 : 0) - (Math.random() > 0.8 ? 0.5 : 0);
      const overtime_hours = Math.floor(Math.random() * 15);
      
      const daily_salary = emp.monthly_salary / 30;
      const attendance_pay = present_days * daily_salary;
      const overtime_rate = initialDb.settings.overtimeRate;
      const overtime_pay = overtime_hours * overtime_rate;
      const final_salary = Math.round(attendance_pay + overtime_pay);

      initialDb.salaries.push({
        salary_id: `SAL${String(salaryCounter++).padStart(4, '0')}`,
        employee_id: emp.employee_id,
        month: '2026-05',
        present_days: present_days,
        overtime_hours: overtime_hours,
        final_salary: final_salary
      });
    });

    localStorage.setItem(DB_KEY, JSON.stringify(initialDb));
    return initialDb;
  }

  function readDb() {
    const data = localStorage.getItem(DB_KEY);
    if (!data) return initializeLocalDb();
    const parsed = JSON.parse(data);
    if (parsed.settings.currency !== 'INR') {
      parsed.settings.currency = 'INR';
      parsed.settings.currencySymbol = '₹';
      localStorage.setItem(DB_KEY, JSON.stringify(parsed));
    }
    return parsed;
  }

  function writeDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  // --- Productivity Score Calculation (Matches server.js) ---
  function calculateProductivity(empId, monthStr, db) {
    const allAttendance = db.attendance.filter(a => a.employee_id === empId && a.date.startsWith(monthStr));
    const allOvertime = db.overtime.filter(o => o.employee_id === empId && o.date.startsWith(monthStr));

    const monthAttendance = db.attendance.filter(a => a.date.startsWith(monthStr));
    const uniqueDates = [...new Set(monthAttendance.map(a => a.date))];
    const totalWorkingDays = uniqueDates.length || 20;

    let presentDays = 0;
    let absentDays = 0;
    let halfDays = 0;

    allAttendance.forEach(a => {
      if (a.status === 'Present') presentDays += 1;
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

  // --- Override Global apiCall ---
  window.apiCall = async function (endpoint, method = 'GET', body = null) {
    // Add brief network simulation delay (200ms) for professional look/feel
    await new Promise(resolve => setTimeout(resolve, 150));

    const db = readDb();
    const url = new URL(endpoint, window.location.origin);
    const pathname = url.pathname;

    // 1. POST /api/auth/login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const { username, password } = body;
      const validAccounts = {
        admin: { fullName: 'System Admin', role: 'admin' },
        hr: { fullName: 'HR Manager', role: 'hr' },
        supervisor: { fullName: 'Shift Supervisor', role: 'supervisor' },
        accountant: { fullName: 'Company Accountant', role: 'accountant' }
      };

      const user = validAccounts[username.toLowerCase()];
      if (user && (password === username + '123' || password === 'admin123' || (username === 'supervisor' && password === 'supervisor123'))) {
        return { success: true, user: { username, ...user } };
      }
      throw new Error('Invalid username or password');
    }

    // 2. GET /api/employees
    if (pathname === '/api/employees' && method === 'GET') {
      return db.employees;
    }

    // 3. POST /api/employees
    if (pathname === '/api/employees' && method === 'POST') {
      const ids = db.employees.map(e => parseInt(e.employee_id.replace('EMP', '')));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const newId = `EMP${String(maxId + 1).padStart(3, '0')}`;

      const newEmp = {
        employee_id: newId,
        full_name: body.full_name,
        photo: body.photo || 'assets/avatar_placeholder.png',
        position: body.position,
        department: body.department,
        joining_date: body.joining_date || new Date().toISOString().split('T')[0],
        monthly_salary: parseFloat(body.monthly_salary) || 0,
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        dob: body.dob || '',
        gender: body.gender || 'Male'
      };

      db.employees.push(newEmp);
      writeDb(db);
      return newEmp;
    }

    // 4. PUT /api/employees/:id
    if (pathname.startsWith('/api/employees/') && method === 'PUT') {
      const empId = pathname.split('/').pop();
      const index = db.employees.findIndex(e => e.employee_id === empId);
      if (index === -1) throw new Error('Employee not found');

      db.employees[index] = {
        ...db.employees[index],
        full_name: body.full_name,
        photo: body.photo || db.employees[index].photo,
        position: body.position,
        department: body.department,
        joining_date: body.joining_date,
        monthly_salary: parseFloat(body.monthly_salary) || 0,
        phone: body.phone || '',
        email: body.email || '',
        address: body.address || '',
        dob: body.dob || '',
        gender: body.gender || 'Male'
      };

      writeDb(db);
      return db.employees[index];
    }

    // 5. DELETE /api/employees/:id
    if (pathname.startsWith('/api/employees/') && method === 'DELETE') {
      const empId = pathname.split('/').pop();
      db.employees = db.employees.filter(e => e.employee_id !== empId);
      db.attendance = db.attendance.filter(a => a.employee_id !== empId);
      db.overtime = db.overtime.filter(o => o.employee_id !== empId);
      db.salaries = db.salaries.filter(s => s.employee_id !== empId);
      writeDb(db);
      return { success: true };
    }

    // 6. GET /api/attendance
    if (pathname === '/api/attendance' && method === 'GET') {
      const dateParam = url.searchParams.get('date');
      if (dateParam) {
        return db.attendance.filter(a => a.date === dateParam);
      }
      return db.attendance;
    }

    // 7. POST /api/attendance
    if (pathname === '/api/attendance' && method === 'POST') {
      const { employee_id, date, status } = body;
      const todayStr = '2026-06-24';
      if (date < todayStr) {
        throw new Error('Attendance records for past dates are locked and cannot be modified.');
      }
      
      const recordIndex = db.attendance.findIndex(
        a => a.employee_id === employee_id && a.date === date
      );

      let record;
      if (recordIndex !== -1) {
        db.attendance[recordIndex].status = status;
        record = db.attendance[recordIndex];
      } else {
        const ids = db.attendance.map(a => parseInt(a.attendance_id.replace('ATT', '')));
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        record = {
          attendance_id: `ATT${String(maxId + 1).padStart(4, '0')}`,
          employee_id,
          date,
          status
        };
        db.attendance.push(record);
      }
      writeDb(db);
      return record;
    }

    // 8. POST /api/attendance/bulk
    if (pathname === '/api/attendance/bulk' && method === 'POST') {
      const { date, records } = body;
      const todayStr = '2026-06-24';
      if (date < todayStr) {
        throw new Error('Attendance records for past dates are locked and cannot be modified.');
      }
      
      let ids = db.attendance.map(a => parseInt(a.attendance_id.replace('ATT', '')));
      let maxId = ids.length > 0 ? Math.max(...ids) : 0;

      records.forEach(rec => {
        const recordIndex = db.attendance.findIndex(
          a => a.employee_id === rec.employee_id && a.date === date
        );

        if (recordIndex !== -1) {
          db.attendance[recordIndex].status = rec.status;
        } else {
          maxId++;
          db.attendance.push({
            attendance_id: `ATT${String(maxId).padStart(4, '0')}`,
            employee_id: rec.employee_id,
            date,
            status: rec.status
          });
        }
      });

      writeDb(db);
      return { success: true };
    }

    // 9. GET /api/overtime
    if (pathname === '/api/overtime' && method === 'GET') {
      return db.overtime;
    }

    // 10. POST /api/overtime
    if (pathname === '/api/overtime' && method === 'POST') {
      const { employee_id, date, overtime_hours } = body;
      const recordIndex = db.overtime.findIndex(
        o => o.employee_id === employee_id && o.date === date
      );

      let record;
      if (recordIndex !== -1) {
        db.overtime[recordIndex].overtime_hours = parseFloat(overtime_hours);
        record = db.overtime[recordIndex];
      } else {
        const ids = db.overtime.map(o => parseInt(o.overtime_id.replace('OT', '')));
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        record = {
          overtime_id: `OT${String(maxId + 1).padStart(4, '0')}`,
          employee_id,
          date,
          overtime_hours: parseFloat(overtime_hours)
        };
        db.overtime.push(record);
      }
      writeDb(db);
      return record;
    }

    // 11. DELETE /api/overtime/:id
    if (pathname.startsWith('/api/overtime/') && method === 'DELETE') {
      const otId = pathname.split('/').pop();
      db.overtime = db.overtime.filter(o => o.overtime_id !== otId);
      writeDb(db);
      return { success: true };
    }

    // 12. GET /api/payroll/slips
    if (pathname === '/api/payroll/slips' && method === 'GET') {
      const monthParam = url.searchParams.get('month');
      if (monthParam) {
        return db.salaries.filter(s => s.month === monthParam);
      }
      return db.salaries;
    }

    // 13. POST /api/payroll/calculate
    if (pathname === '/api/payroll/calculate' && method === 'POST') {
      const { month } = body;
      const calculatedSalaries = [];
      let ids = db.salaries.map(s => parseInt(s.salary_id.replace('SAL', '')));
      let maxId = ids.length > 0 ? Math.max(...ids) : 0;

      db.employees.forEach(emp => {
        const empAttendance = db.attendance.filter(
          a => a.employee_id === emp.employee_id && a.date.startsWith(month)
        );

        let present_days = 0;
        empAttendance.forEach(a => {
          if (a.status === 'Present') present_days += 1;
          else if (a.status === 'Half Day') present_days += 0.5;
        });

        const empOvertime = db.overtime.filter(
          o => o.employee_id === emp.employee_id && o.date.startsWith(month)
        );

        let overtime_hours = 0;
        empOvertime.forEach(o => {
          overtime_hours += o.overtime_hours;
        });

        const daily_salary = emp.monthly_salary / 30;
        const attendance_pay = present_days * daily_salary;
        const overtime_pay = overtime_hours * db.settings.overtimeRate;
        const final_salary = Math.round(attendance_pay + overtime_pay);

        const recordIndex = db.salaries.findIndex(
          s => s.employee_id === emp.employee_id && s.month === month
        );

        let salaryRecord;
        if (recordIndex !== -1) {
          db.salaries[recordIndex].present_days = present_days;
          db.salaries[recordIndex].overtime_hours = overtime_hours;
          db.salaries[recordIndex].final_salary = final_salary;
          salaryRecord = db.salaries[recordIndex];
        } else {
          maxId++;
          salaryRecord = {
            salary_id: `SAL${String(maxId).padStart(4, '0')}`,
            employee_id: emp.employee_id,
            month,
            present_days,
            overtime_hours,
            final_salary
          };
          db.salaries.push(salaryRecord);
        }
        calculatedSalaries.push(salaryRecord);
      });

      writeDb(db);
      return { success: true, salaries: calculatedSalaries };
    }

    // 14. GET /api/settings
    if (pathname === '/api/settings' && method === 'GET') {
      return db.settings;
    }

    // 15. POST /api/settings
    if (pathname === '/api/settings' && method === 'POST') {
      db.settings = {
        ...db.settings,
        companyName: body.companyName || db.settings.companyName,
        overtimeRate: parseFloat(body.overtimeRate) || db.settings.overtimeRate,
        currency: body.currency || db.settings.currency,
        currencySymbol: body.currencySymbol || db.settings.currencySymbol
      };
      writeDb(db);
      return { success: true, settings: db.settings };
    }

    // 16. GET /api/analytics/dashboard
    if (pathname === '/api/analytics/dashboard' && method === 'GET') {
      const targetMonth = '2026-06';
      const todayStr = '2026-06-24'; // System today

      const totalEmployees = db.employees.length;

      const todayAttendance = db.attendance.filter(a => a.date === todayStr);
      const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
      const absentToday = todayAttendance.filter(a => a.status === 'Absent').length + (totalEmployees - todayAttendance.length);
      const leaveToday = todayAttendance.filter(a => a.status === 'Leave').length;

      let dailyExpenses = 0;
      db.employees.forEach(emp => {
        const att = todayAttendance.find(a => a.employee_id === emp.employee_id);
        let factor = 0;
        if (att) {
          if (att.status === 'Present') factor = 1;
          else if (att.status === 'Half Day') factor = 0.5;
        }
        const dailySalary = (emp.monthly_salary / 30) * factor;
        const otToday = db.overtime.filter(o => o.employee_id === emp.employee_id && o.date === todayStr);
        const otHours = otToday.reduce((sum, o) => sum + o.overtime_hours, 0);
        const otPay = otHours * db.settings.overtimeRate;
        dailyExpenses += (dailySalary + otPay);
      });

      let monthlyExpenses = 0;
      db.employees.forEach(emp => {
        const empAttendance = db.attendance.filter(a => a.employee_id === emp.employee_id && a.date.startsWith(targetMonth));
        let present_days = 0;
        empAttendance.forEach(a => {
          if (a.status === 'Present') present_days += 1;
          else if (a.status === 'Half Day') present_days += 0.5;
        });
        const empOvertime = db.overtime.filter(o => o.employee_id === emp.employee_id && o.date.startsWith(targetMonth));
        let overtime_hours = 0;
        empOvertime.forEach(o => {
          overtime_hours += o.overtime_hours;
        });
        const daily_salary = emp.monthly_salary / 30;
        const attendance_pay = present_days * daily_salary;
        const overtime_pay = overtime_hours * db.settings.overtimeRate;
        monthlyExpenses += Math.round(attendance_pay + overtime_pay);
      });

      const juneAttendance = db.attendance.filter(a => a.date.startsWith(targetMonth));
      const attStats = { Present: 0, Absent: 0, 'Half Day': 0, Leave: 0 };
      juneAttendance.forEach(a => {
        if (attStats[a.status] !== undefined) attStats[a.status]++;
      });

      const deptSalary = {};
      db.employees.forEach(emp => {
        if (!deptSalary[emp.department]) deptSalary[emp.department] = 0;
        deptSalary[emp.department] += emp.monthly_salary;
      });

      const overtimeDailyTrend = {};
      const juneOvertime = db.overtime.filter(o => o.date.startsWith(targetMonth));
      juneOvertime.forEach(o => {
        const day = parseInt(o.date.split('-')[2]);
        if (!overtimeDailyTrend[day]) overtimeDailyTrend[day] = 0;
        overtimeDailyTrend[day] += o.overtime_hours;
      });

      const employeeProductivity = db.employees.map(emp => {
        const prod = calculateProductivity(emp.employee_id, targetMonth, db);
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

      return {
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
      };
    }

    // 17. GET /api/analytics/top-performers
    if (pathname === '/api/analytics/top-performers' && method === 'GET') {
      const targetMonth = '2026-06';
      const rankings = db.employees.map(emp => {
        const prod = calculateProductivity(emp.employee_id, targetMonth, db);
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
      return rankings;
    }

    // Fallback error
    throw new Error('Not Found');
  };
})();
