# Отчёт по лабораторной работе №2

**Тема:** Изучение HTTP-методов и их применения для реализации CRUD-операций. Создание REST-подобного API с хранением данных в памяти сервера.

**Выполнил:** Ванян Давид Егорович  
**Группа:** ПИЖ-б-о-25-2  
**Вариант:** 8 («Сотрудники» )

---

## Цель работы

Освоить обработку различных HTTP-методов (GET, POST, PUT, PATCH, DELETE) в Express. Научиться реализовывать CRUD-операции над коллекцией объектов, хранящейся в памяти сервера, а также возвращать корректные HTTP-коды ответов (200, 201, 204, 400, 404, 500).

---

## Теоретическое обоснование

CRUD — это четыре базовые операции над данными: Create, Read, Update, Delete. В REST им соответствуют HTTP-методы: POST (создание), GET (чтение), PUT и PATCH (обновление), DELETE (удаление).

GET запрашивает данные, тело отсутствует, безопасен. POST создаёт ресурс, тело содержит данные. PUT полностью заменяет ресурс. PATCH обновляет только переданные поля. DELETE удаляет ресурс.

Основные коды: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 404 Not Found, 500 Internal Server Error.

Данные хранятся в памяти сервера в массиве. Это просто, но данные теряются при перезапуске.

---

## Индивидуальное задание (Вариант 8 — Сотрудники)

**Сущность:** Сотрудники (employees)  
**Базовые поля:** id, name, position  
**Дополнительные поля:** salary, department

**Требования продвинутого уровня:**
- Всё из базового и среднего уровня.
- Частичное обновление (PATCH).
- Массовые операции: удаление всех, создание нескольких.
- Дополнительные эндпоинты: статистика, связанные сотрудники.
- Логирование в файл access.log.
- Глобальный обработчик ошибок (500).
- Валидация типов.

### Скриншоты тестирования эндпоинтов

**GET All Items** — получить всех сотрудников (200 OK)
![GET All Items](./md_screen/Снимок%20экрана%202026-10-06%20012416.png)

**GET Stats** — статистика по сотрудникам (200 OK)
![GET Stats](./md_screen/Снимок%20экрана%202026-10-06%20012343.png)

**GET Item by ID** — получить одного сотрудника (200 OK)
![GET Item by ID](./md_screen/Снимок%20экрана%202026-10-06%20012433.png)

**GET Related** — связанные сотрудники (200 OK)
![GET Related](./md_screen/Снимок%20экрана%202026-10-06%20012444.png)

**POST Create Item** — создать сотрудника (201 Created)
![POST Create Item](./md_screen/Снимок%20экрана%202026-10-06%20012452.png)

**POST Bulk** — массовое создание (201 Created)
![POST Bulk](./md_screen/Снимок%20экрана%202026-10-06%20012502.png)

**PUT Update Item** — полное обновление (200 OK)
![PUT Update Item](./md_screen/Снимок%20экрана%202026-10-06%20012510.png)

**PATCH Update Item** — частичное обновление (200 OK)
![PATCH Update Item](./md_screen/Снимок%20экрана%202026-10-06%20012519.png)

**DELETE Item by ID** — удалить одного (204 No Content)
![DELETE Item by ID](./md_screen/Снимок%20экрана%202026-10-06%20012611.png)

**DELETE All Items** — удалить всех (204 No Content)
![DELETE All Items](./md_screen/Снимок%20экрана%202026-10-06%20012624.png)

**GET Nonexistent Item** — 404 Not Found
![GET Nonexistent Item](./md_screen/Снимок%20экрана%202026-10-06%20012634.png)

**POST Invalid Data** — 400 Bad Request
![POST Invalid Data](./md_screen/Снимок%20экрана%202026-10-06%20012642.png)

**Логирование в файл access.log**
![Логирование в файл access.log](./md_screen/Снимок%20экрана%202026-10-06%20012656.png)

**Код сервера** — app.js

```
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
```

---

## Ответы на контрольные вопросы (продвинутый уровень)

**1. Как реализовать частичное обновление (PATCH)?**

PATCH-запрос отличается от PUT тем, что обновляет только те поля, которые были переданы в теле запроса. Остальные поля сохраняют свои прежние значения. В Express это реализуется путём слияния существующего объекта с новыми данными с помощью оператора spread. Если поле не передано в запросе, оно остаётся неизменным. Это позволяет избежать случайной перезаписи данных, которые клиент не собирался менять.

**2. Как реализовать массовое удаление элементов?**

Массовое удаление реализуется через отдельный эндпоинт DELETE /items, который очищает весь массив данных. Важно объявить этот маршрут до DELETE /items/:id, иначе Express воспримет пустой путь как параметр :id и обработчик не сработает. При успешном удалении возвращается статус 204 No Content, так как тело ответа не требуется.

**3. Как реализовать массовое создание элементов?**

Массовое создание реализуется через эндпоинт POST /items/bulk, который принимает массив объектов. Сервер проверяет, что тело запроса является массивом, затем валидирует каждый элемент. Корректные записи добавляются в хранилище, некорректные — пропускаются с записью ошибок. В ответе возвращается список созданных объектов и список ошибок, если они были. Если ни один элемент не прошёл валидацию, возвращается 400 Bad Request.

**4. Как реализовать глобальный обработчик ошибок?**

Глобальный обработчик ошибок в Express — это middleware с четырьмя аргументами: err, req, res, next. Он объявляется после всех маршрутов. Если в любом маршруте возникнет необработанное исключение, Express передаст управление этому обработчику. Он логирует ошибку в консоль и возвращает клиенту статус 500 с сообщением о внутренней ошибке сервера. Это позволяет избежать падения приложения и централизованно обрабатывать все непредвиденные ситуации.

**5. Как логировать запросы в файл?**

Логирование реализуется через middleware, который записывает информацию о каждом запросе в файл access.log. С помощью модуля fs создаётся поток записи в файл с флагом 'a' (добавление в конец). Middleware формирует строку с датой, методом и URL запроса, выводит её в консоль и записывает в файл. Затем вызов next() передаёт управление следующему middleware. Такой подход позволяет сохранять историю всех обращений к серверу для последующего анализа.

---

## Вывод

В ходе выполнения лабораторной работы я освоил обработку HTTP-методов (GET, POST, PUT, PATCH, DELETE) в Express и научился реализовывать CRUD-операции над коллекцией объектов, хранящейся в памяти сервера.

**Что было сделано:**
Реализован REST-подобный API для сущности «Сотрудники» (вариант 8). Написаны эндпоинты для всех CRUD-операций с корректными HTTP-кодами. Добавлена валидация входных данных. Реализованы поиск, сортировка и пагинация через query-параметры. Добавлены дополнительные эндпоинты: статистика и связанные сотрудники. Реализованы массовые операции: создание нескольких сотрудников и удаление всех. Настроено логирование всех запросов в файл access.log. Добавлен глобальный обработчик ошибок. Написаны автоматические тесты в Postman для всех эндпоинтов.

**Что нового узнал:**
Разница между PUT (полное обновление) и PATCH (частичное обновление). Принципы работы middleware в Express. Использование query-параметров для фильтрации, сортировки и пагинации. Применение оператора spread для частичного обновления объектов. Организация логирования в файл через модуль fs.

**С какими трудностями столкнулся:**
Настройка переменных окружения в Postman. Правильный порядок объявления маршрутов. Понимание разницы между res.json(), res.send() и res.status(204).send().

---

## Список использованных источников

1. Express — Routing. URL: https://expressjs.com/en/guide/routing.html
2. Express — Request и Response. URL: https://expressjs.com/en/4x/api.html
3. HTTP-методы (MDN). URL: https://developer.mozilla.org/ru/docs/Web/HTTP/Methods
4. Коды состояния HTTP (MDN). URL: https://developer.mozilla.org/ru/docs/Web/HTTP/Status
5. REST API Tutorial. URL: https://restfulapi.net/
6. Postman Learning Center. URL: https://learning.postman.com/
7. Thunder Client. URL: https://www.thunderclient.com/