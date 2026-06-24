const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'database.json');

// Read database from file
function readDb() {
  try {
    if (!fs.existsSync(dbPath)) {
      return initializeDb();
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, resetting to initial state', err);
    return initializeDb();
  }
}

// Write database to file
function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing database file', err);
  }
}

// Initialize database with rich mock data for demo
function initializeDb() {
  const initialDb = {
    users: [
      { username: 'admin', password: 'admin123', role: 'admin', fullName: 'System Admin' },
      { username: 'hr', password: 'hr123', role: 'hr', fullName: 'HR Manager' },
      { username: 'accountant', password: 'accountant123', role: 'accountant', fullName: 'Company Accountant' }
    ],
    settings: {
      companyName: 'PayStream Solutions',
      overtimeRate: 150,
      currency: 'USD',
      currencySymbol: '$'
    },
    employees: [
      {
        employee_id: 'EMP001',
        full_name: 'Sarah J. Chen',
        photo: '/assets/avatar_placeholder.png',
        position: 'Lead Software Engineer',
        department: 'Engineering',
        joining_date: '2024-01-15',
        monthly_salary: 95000
      },
      {
        employee_id: 'EMP002',
        full_name: 'Alex R. Thompson',
        photo: '/assets/avatar_placeholder.png',
        position: 'HR Manager',
        department: 'Human Resources',
        joining_date: '2024-03-10',
        monthly_salary: 75000
      },
      {
        employee_id: 'EMP003',
        full_name: 'Michael L. Davis',
        photo: '/assets/avatar_placeholder.png',
        position: 'Financial Analyst',
        department: 'Finance',
        joining_date: '2024-06-01',
        monthly_salary: 82000
      },
      {
        employee_id: 'EMP004',
        full_name: 'Emily B. Chen',
        photo: '/assets/avatar_placeholder.png',
        position: 'UX Designer',
        department: 'Product Design',
        joining_date: '2025-02-18',
        monthly_salary: 68000
      },
      {
        employee_id: 'EMP005',
        full_name: 'Marcus A. Vance',
        photo: '/assets/avatar_placeholder.png',
        position: 'Marketing Specialist',
        department: 'Marketing',
        joining_date: '2025-05-20',
        monthly_salary: 58000
      }
    ],
    attendance: [],
    overtime: [],
    salaries: []
  };

  // Generate realistic attendance and overtime for June 2026 (current demo month)
  // Let's generate from June 1st to June 24th, 2026
  const employees = initialDb.employees;
  const startDay = 1;
  const endDay = 24;
  const year = 2026;
  const month = 5; // 0-indexed (June)

  let attendanceCounter = 1;
  let overtimeCounter = 1;

  for (let day = startDay; day <= endDay; day++) {
    const dateStr = `${year}-06-${String(day).padStart(2, '0')}`;
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();

    // Skip weekends for default marking, or we can assume it's standard 5-day week
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    employees.forEach((emp) => {
      // Generate status
      let status = 'Present';
      const rand = Math.random();

      if (rand < 0.05) {
        status = 'Absent';
      } else if (rand < 0.12) {
        status = 'Half Day';
      }

      initialDb.attendance.push({
        attendance_id: `ATT${String(attendanceCounter++).padStart(4, '0')}`,
        employee_id: emp.employee_id,
        date: dateStr,
        status: status
      });

      // Generate overtime on some days
      if (status === 'Present' && Math.random() < 0.25) {
        const hours = Math.floor(Math.random() * 3) + 1; // 1 to 3 hours
        initialDb.overtime.push({
          overtime_id: `OT${String(overtimeCounter++).padStart(4, '0')}`,
          employee_id: emp.employee_id,
          date: dateStr,
          overtime_hours: hours
        });
      }
    });
  }

  // Pre-calculate salaries for May 2026 (completed month)
  // Let's generate completed data for May 2026
  let salaryCounter = 1;
  const mayDays = 21; // working days in May
  employees.forEach((emp) => {
    // Let's assume typical attendance for May
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

  // Write it
  fs.writeFileSync(dbPath, JSON.stringify(initialDb, null, 2), 'utf8');
  return initialDb;
}

// DB API exports
const db = {
  // --- Employees API ---
  employees: {
    getAll: () => {
      const data = readDb();
      return data.employees;
    },
    getById: (id) => {
      const data = readDb();
      return data.employees.find(e => e.employee_id === id) || null;
    },
    create: (employeeData) => {
      const data = readDb();
      // Generate ID
      const ids = data.employees.map(e => parseInt(e.employee_id.replace('EMP', '')));
      const maxId = ids.length > 0 ? Math.max(...ids) : 0;
      const newId = `EMP${String(maxId + 1).padStart(3, '0')}`;
      
      const newEmp = {
        employee_id: newId,
        full_name: employeeData.full_name,
        photo: employeeData.photo || '/assets/avatar_placeholder.png',
        position: employeeData.position,
        department: employeeData.department,
        joining_date: employeeData.joining_date || new Date().toISOString().split('T')[0],
        monthly_salary: parseFloat(employeeData.monthly_salary) || 0
      };

      data.employees.push(newEmp);
      writeDb(data);
      return newEmp;
    },
    update: (id, employeeData) => {
      const data = readDb();
      const index = data.employees.findIndex(e => e.employee_id === id);
      if (index === -1) return null;

      data.employees[index] = {
        ...data.employees[index],
        full_name: employeeData.full_name,
        photo: employeeData.photo || data.employees[index].photo,
        position: employeeData.position,
        department: employeeData.department,
        joining_date: employeeData.joining_date,
        monthly_salary: parseFloat(employeeData.monthly_salary) || 0
      };

      writeDb(data);
      return data.employees[index];
    },
    delete: (id) => {
      const data = readDb();
      const initialLength = data.employees.length;
      data.employees = data.employees.filter(e => e.employee_id !== id);
      
      // Cascading delete
      data.attendance = data.attendance.filter(a => a.employee_id !== id);
      data.overtime = data.overtime.filter(o => o.employee_id !== id);
      data.salaries = data.salaries.filter(s => s.employee_id !== id);

      writeDb(data);
      return data.employees.length < initialLength;
    }
  },

  // --- Attendance API ---
  attendance: {
    getAll: () => {
      const data = readDb();
      return data.attendance;
    },
    getByDate: (dateStr) => {
      const data = readDb();
      return data.attendance.filter(a => a.date === dateStr);
    },
    mark: (employeeId, dateStr, status) => {
      const data = readDb();
      
      // Validate employee
      if (!data.employees.some(e => e.employee_id === employeeId)) return null;

      const recordIndex = data.attendance.findIndex(
        a => a.employee_id === employeeId && a.date === dateStr
      );

      let record;
      if (recordIndex !== -1) {
        data.attendance[recordIndex].status = status;
        record = data.attendance[recordIndex];
      } else {
        const ids = data.attendance.map(a => parseInt(a.attendance_id.replace('ATT', '')));
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        const newId = `ATT${String(maxId + 1).padStart(4, '0')}`;
        
        record = {
          attendance_id: newId,
          employee_id: employeeId,
          date: dateStr,
          status: status
        };
        data.attendance.push(record);
      }

      writeDb(data);
      return record;
    },
    bulkMark: (dateStr, records) => {
      // records: [{ employee_id: '...', status: '...' }]
      const data = readDb();
      const updatedRecords = [];

      let ids = data.attendance.map(a => parseInt(a.attendance_id.replace('ATT', '')));
      let maxId = ids.length > 0 ? Math.max(...ids) : 0;

      records.forEach(rec => {
        const recordIndex = data.attendance.findIndex(
          a => a.employee_id === rec.employee_id && a.date === dateStr
        );

        if (recordIndex !== -1) {
          data.attendance[recordIndex].status = rec.status;
          updatedRecords.push(data.attendance[recordIndex]);
        } else {
          maxId++;
          const newId = `ATT${String(maxId).padStart(4, '0')}`;
          const newRec = {
            attendance_id: newId,
            employee_id: rec.employee_id,
            date: dateStr,
            status: rec.status
          };
          data.attendance.push(newRec);
          updatedRecords.push(newRec);
        }
      });

      writeDb(data);
      return updatedRecords;
    }
  },

  // --- Overtime API ---
  overtime: {
    getAll: () => {
      const data = readDb();
      return data.overtime;
    },
    add: (employeeId, dateStr, hours) => {
      const data = readDb();

      if (!data.employees.some(e => e.employee_id === employeeId)) return null;

      const recordIndex = data.overtime.findIndex(
        o => o.employee_id === employeeId && o.date === dateStr
      );

      let record;
      if (recordIndex !== -1) {
        data.overtime[recordIndex].overtime_hours = parseFloat(hours);
        record = data.overtime[recordIndex];
      } else {
        const ids = data.overtime.map(o => parseInt(o.overtime_id.replace('OT', '')));
        const maxId = ids.length > 0 ? Math.max(...ids) : 0;
        const newId = `OT${String(maxId + 1).padStart(4, '0')}`;

        record = {
          overtime_id: newId,
          employee_id: employeeId,
          date: dateStr,
          overtime_hours: parseFloat(hours)
        };
        data.overtime.push(record);
      }

      writeDb(data);
      return record;
    },
    delete: (id) => {
      const data = readDb();
      const initialLength = data.overtime.length;
      data.overtime = data.overtime.filter(o => o.overtime_id !== id);
      writeDb(data);
      return data.overtime.length < initialLength;
    }
  },

  // --- Salary & Payroll API ---
  salaries: {
    getAll: () => {
      const data = readDb();
      return data.salaries;
    },
    getByMonth: (monthStr) => {
      const data = readDb();
      return data.salaries.filter(s => s.month === monthStr);
    },
    calculateMonthly: (monthStr) => {
      // monthStr is like '2026-06'
      const data = readDb();
      const employees = data.employees;
      const attendance = data.attendance;
      const overtime = data.overtime;
      const settings = data.settings;

      const calculatedSalaries = [];
      let ids = data.salaries.map(s => parseInt(s.salary_id.replace('SAL', '')));
      let maxId = ids.length > 0 ? Math.max(...ids) : 0;

      employees.forEach(emp => {
        // Filter attendance for this month
        const empAttendance = attendance.filter(
          a => a.employee_id === emp.employee_id && a.date.startsWith(monthStr)
        );

        // Present days formula: Present = 1, Half Day = 0.5, Absent = 0
        let present_days = 0;
        empAttendance.forEach(a => {
          if (a.status === 'Present') present_days += 1;
          else if (a.status === 'Half Day') present_days += 0.5;
        });

        // Filter overtime for this month
        const empOvertime = overtime.filter(
          o => o.employee_id === emp.employee_id && o.date.startsWith(monthStr)
        );

        let overtime_hours = 0;
        empOvertime.forEach(o => {
          overtime_hours += o.overtime_hours;
        });

        // Salary calculations
        const daily_salary = emp.monthly_salary / 30;
        const attendance_pay = present_days * daily_salary;
        const overtime_rate = settings.overtimeRate;
        const overtime_pay = overtime_hours * overtime_rate;
        const final_salary = Math.round(attendance_pay + overtime_pay);

        // Check if salary record already exists
        const recordIndex = data.salaries.findIndex(
          s => s.employee_id === emp.employee_id && s.month === monthStr
        );

        let salaryRecord;
        if (recordIndex !== -1) {
          data.salaries[recordIndex].present_days = present_days;
          data.salaries[recordIndex].overtime_hours = overtime_hours;
          data.salaries[recordIndex].final_salary = final_salary;
          salaryRecord = data.salaries[recordIndex];
        } else {
          maxId++;
          salaryRecord = {
            salary_id: `SAL${String(maxId).padStart(4, '0')}`,
            employee_id: emp.employee_id,
            month: monthStr,
            present_days: present_days,
            overtime_hours: overtime_hours,
            final_salary: final_salary
          };
          data.salaries.push(salaryRecord);
        }

        calculatedSalaries.push(salaryRecord);
      });

      writeDb(data);
      return calculatedSalaries;
    }
  },

  // --- Auth API ---
  auth: {
    login: (username, password) => {
      const data = readDb();
      const user = data.users.find(
        u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
      );
      if (!user) return null;
      
      // Exclude password from return
      const { password: _, ...userSafe } = user;
      return userSafe;
    }
  },

  // --- Settings API ---
  settings: {
    get: () => {
      const data = readDb();
      return data.settings;
    },
    update: (settingsData) => {
      const data = readDb();
      data.settings = {
        ...data.settings,
        companyName: settingsData.companyName || data.settings.companyName,
        overtimeRate: parseFloat(settingsData.overtimeRate) || data.settings.overtimeRate,
        currency: settingsData.currency || data.settings.currency,
        currencySymbol: settingsData.currencySymbol || data.settings.currencySymbol
      };
      writeDb(data);
      return data.settings;
    }
  }
};

module.exports = db;
