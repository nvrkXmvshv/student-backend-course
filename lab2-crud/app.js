const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());

const logStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });

app.use((req, res, next) => {
    const logLine = `[${new Date().toISOString()}] ${req.method} ${req.url}\n`;
    console.log(logLine.trim());
    logStream.write(logLine);
    next();
});

let employees = [
    { id: 1, name: 'Иван Иванов', position: 'Разработчик', salary: 100000, department: 'IT' },
    { id: 2, name: 'Петр Петров', position: 'Менеджер', salary: 80000, department: 'Sales' },
    { id: 3, name: 'Анна Сидорова', position: 'Дизайнер', salary: 90000, department: 'IT' },
    { id: 4, name: 'Мария Кузнецова', position: 'Бухгалтер', salary: 70000, department: 'Finance' }
];

let nextId = 5;

function validateEmployee(data, isPartial = false) {
    const errors = [];

    if (!isPartial || data.name !== undefined) {
        if (!data.name || typeof data.name !== 'string') {
            errors.push('Поле name обязательно и должно быть строкой');
        }
    }
    if (!isPartial || data.position !== undefined) {
        if (!data.position || typeof data.position !== 'string') {
            errors.push('Поле position обязательно и должно быть строкой');
        }
    }
    if (data.salary !== undefined && (typeof data.salary !== 'number' || data.salary < 0)) {
        errors.push('Поле salary должно быть положительным числом');
    }
    if (data.department !== undefined && typeof data.department !== 'string') {
        errors.push('Поле department должно быть строкой');
    }

    return errors;
}


app.get('/items', (req, res) => {
    let result = [...employees];
    const { search, sort, order, page, limit } = req.query;

    if (search) {
        result = result.filter(e =>
            e.name.toLowerCase().includes(search.toLowerCase())
        );
    }

    if (sort) {
        const sortOrder = order === 'desc' ? -1 : 1;
        result.sort((a, b) => {
            if (a[sort] < b[sort]) return -1 * sortOrder;
            if (a[sort] > b[sort]) return 1 * sortOrder;
            return 0;
        });
    }

    const total = result.length;
    if (page && limit) {
        const p = parseInt(page);
        const l = parseInt(limit);
        const start = (p - 1) * l;
        result = result.slice(start, start + l);
    }

    res.json({
        count: result.length,
        total: total,
        items: result
    });
});

app.get('/items/stats', (req, res) => {
    if (employees.length === 0) {
        return res.json({ count: 0, avgSalary: 0, byDepartment: {} });
    }

    const avgSalary = employees.reduce((sum, e) => sum + e.salary, 0) / employees.length;

    const byDepartment = {};
    employees.forEach(e => {
        byDepartment[e.department] = (byDepartment[e.department] || 0) + 1;
    });

    res.json({
        count: employees.length,
        avgSalary: Math.round(avgSalary),
        byDepartment: byDepartment
    });
});

app.get('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const employee = employees.find(e => e.id === id);
    if (!employee) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    res.json(employee);
});

app.get('/items/:id/related', (req, res) => {
    const id = parseInt(req.params.id);
    const employee = employees.find(e => e.id === id);
    if (!employee) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    const related = employees.filter(e => e.department === employee.department && e.id !== id);
    res.json({
        employee: employee.name,
        department: employee.department,
        related: related
    });
});

app.post('/items', (req, res) => {
    const errors = validateEmployee(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const { name, position, salary, department } = req.body;
    const newEmployee = {
        id: nextId++,
        name,
        position,
        salary: salary || 0,
        department: department || 'Unknown'
    };
    employees.push(newEmployee);
    res.status(201).json(newEmployee);
});

app.post('/items/bulk', (req, res) => {
    if (!Array.isArray(req.body)) {
        return res.status(400).json({ error: 'Ожидается массив сотрудников' });
    }

    const created = [];
    const errors = [];

    req.body.forEach((data, index) => {
        const errs = validateEmployee(data);
        if (errs.length > 0) {
            errors.push({ index, errors: errs });
        } else {
            const newEmployee = {
                id: nextId++,
                name: data.name,
                position: data.position,
                salary: data.salary || 0,
                department: data.department || 'Unknown'
            };
            employees.push(newEmployee);
            created.push(newEmployee);
        }
    });

    if (created.length === 0) {
        return res.status(400).json({ errors });
    }

    res.status(201).json({
        message: `Создано ${created.length} сотрудников`,
        created,
        errors: errors.length > 0 ? errors : undefined
    });
});


app.put('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const errors = validateEmployee(req.body);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const { name, position, salary, department } = req.body;
    employees[index] = {
        id,
        name,
        position,
        salary: salary !== undefined ? salary : 0,
        department: department || 'Unknown'
    };
    res.json(employees[index]);
});


app.patch('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
    }

    const errors = validateEmployee(req.body, true);
    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    const { name, position, salary, department } = req.body;
    employees[index] = {
        ...employees[index],
        ...(name !== undefined && { name }),
        ...(position !== undefined && { position }),
        ...(salary !== undefined && { salary }),
        ...(department !== undefined && { department })
    };
    res.json(employees[index]);
});


app.delete('/items/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = employees.findIndex(e => e.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Сотрудник не найден' });
    }
    employees.splice(index, 1);
    res.status(204).send();
});


app.delete('/items', (req, res) => {
    employees = [];
    nextId = 1;
    res.status(204).send();
});


app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

app.use((err, req, res, next) => {
    console.error('Ошибка:', err.message);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});