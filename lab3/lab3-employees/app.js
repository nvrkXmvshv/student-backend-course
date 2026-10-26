const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.use((req, res, next) => {
    const time = new Date().toISOString();
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[${time}] ${req.method} ${req.url} | IP: ${ip}`);
    next();
});

let employees = [
    { id: 1, name: 'Иван Иванов', position: 'Разработчик', department: 'IT', salary: 80000 },
    { id: 2, name: 'Мария Петрова', position: 'Менеджер', department: 'Sales', salary: 60000 },
    { id: 3, name: 'Алексей Смирнов', position: 'Разработчик', department: 'IT', salary: 95000 },
    { id: 4, name: 'Елена Кузнецова', position: 'Директор', department: 'Management', salary: 150000 },
    { id: 5, name: 'Дмитрий Попов', position: 'Менеджер', department: 'Sales', salary: 55000 }
];


app.get('/employees/stats', (req, res) => {
    if (employees.length === 0) return res.json({ error: 'Нет данных' });
    
    const totalSalary = employees.reduce((sum, e) => sum + e.salary, 0);
    const avgSalary = totalSalary / employees.length;
    
    const byDepartment = {};
    employees.forEach(e => {
        if (!byDepartment[e.department]) byDepartment[e.department] = [];
        byDepartment[e.department].push(e.salary);
    });
    
    const deptStats = {};
    for (const dept in byDepartment) {
        const salaries = byDepartment[dept];
        deptStats[dept] = {
            count: salaries.length,
            avg_salary: salaries.reduce((a, b) => a + b, 0) / salaries.length
        };
    }

    res.json({
        total_employees: employees.length,
        overall_avg_salary: avgSalary,
        by_department: deptStats
    });
});

app.get('/employees/search', (req, res) => {
    let result = [...employees];

    const search = req.query.search;
    if (search) {
        result = result.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
    }

    const filterDept = req.query.filter_dept;
    if (filterDept) {
        result = result.filter(e => e.department.toLowerCase() === filterDept.toLowerCase());
    }
    
    const filterSalary = req.query.filter_salary;
    if (filterSalary) {
        result = result.filter(e => e.salary >= parseInt(filterSalary));
    }

    const sort = req.query.sort;
    const order = req.query.order || 'asc';
    const allowedSortFields = ['id', 'name', 'salary'];

    if (sort) {
        if (!allowedSortFields.includes(sort)) {
            return res.status(400).json({ error: `sort должен быть одним из: ${allowedSortFields.join(', ')}` });
        }
        if (!['asc', 'desc'].includes(order)) {
            return res.status(400).json({ error: 'order должен быть asc или desc' });
        }
        result.sort((a, b) => {
            if (typeof a[sort] === 'string') {
                return order === 'desc' ? a[sort].localeCompare(b[sort]) * -1 : a[sort].localeCompare(b[sort]);
            }
            return order === 'desc' ? b[sort] - a[sort] : a[sort] - b[sort];
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (page < 1) return res.status(400).json({ error: 'page должен быть >= 1' });
    if (limit < 1 || limit > 100) return res.status(400).json({ error: 'limit должен быть от 1 до 100' });

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginated = result.slice(start, end);

    res.json({
        count: result.length,
        page,
        limit,
        totalPages: Math.ceil(result.length / limit),
        employees: paginated
    });
});



app.get('/employees', (req, res) => {
    res.json({ count: employees.length, employees });
});


app.get('/employees/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'ID должен быть числом' });
    
    const employee = employees.find(e => e.id === id);
    if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' });
    
    res.json(employee);
});

app.get('/employees/:id/tasks', (req, res) => {
    const id = parseInt(req.params.id);
    const employee = employees.find(e => e.id === id);
    if (!employee) return res.status(404).json({ error: 'Сотрудник не найден' });
    
    res.json({
        employee: employee.name,
        tasks: [
            { id: 1, title: 'Написать код' },
            { id: 2, title: 'Пройти код-ревью' }
        ]
    });
});

app.get('/departments/:dept/employees', (req, res) => {
    const dept = req.params.dept;
    const filtered = employees.filter(e => e.department.toLowerCase() === dept.toLowerCase());
    res.json({ department: dept, count: filtered.length, employees: filtered });
});

app.get('/departments/:dept/employees/:empId', (req, res) => {
    const { dept, empId } = req.params;
    const id = parseInt(empId);
    const employee = employees.find(e => e.id === id && e.department.toLowerCase() === dept.toLowerCase());
    
    if (!employee) {
        return res.status(404).json({ error: `Сотрудник с ID=${empId} не найден в отделе ${dept}` });
    }
    res.json({ department: dept, employee });
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});


app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});