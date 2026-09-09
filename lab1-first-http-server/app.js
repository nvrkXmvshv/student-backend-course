const express = require('express');
const app = express();
const port = 3000;

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next(); 
});


app.get('/', (req, res) => {
    res.send('Добро пожаловать на сервер!');
});


app.get('/api/posts', (req, res) => {
    const posts = [
        { id: 1, title: 'Первый пост', content: 'Содержимое первого поста' },
        { id: 2, title: 'Второй пост', content: 'Содержимое второго поста' },
        { id: 3, title: 'Третий пост', content: 'Содержимое третьего поста' }
    ];
    res.json(posts);
});

app.get('/api/comments', (req, res) => {
    const comments = [
        { id: 1, postId: 1, text: 'Комментарий к первому посту' },
        { id: 2, postId: 2, text: 'Комментарий ко второму посту' },
        { id: 3, postId: 1, text: 'Ещё один комментарий к первому посту' }
    ];
    res.json(comments);
});


app.get('/api/posts/:id', (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const posts = [
        { id: 1, title: 'Первый пост', content: 'Содержимое первого поста' },
        { id: 2, title: 'Второй пост', content: 'Содержимое второго поста' },
        { id: 3, title: 'Третий пост', content: 'Содержимое третьего поста' }
    ];
    const post = posts.find(p => p.id === postId);
    if (post) {
        res.json(post);
    } else {
        res.status(404).json({ error: 'Пост не найден' });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});


app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});