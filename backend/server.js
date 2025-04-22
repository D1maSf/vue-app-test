require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Импорт конфигурации
const config = require('./config/app');
const pool = require('./config/database');

// Импорт middleware
const errorHandler = require('./middleware/error.middleware');
const auth = require('./middleware/auth.middleware');

// Импорт маршрутов
const articleRoutes = require('./routes/article.routes');
const authRoutes = require('./routes/auth.routes');

const app = express();

// Middleware
app.use(cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Маршруты
app.use('/api/auth', authRoutes(pool));
app.use('/api/articles', articleRoutes(pool));

// Обработка ошибок
app.use(errorHandler);

// Запуск сервера
app.listen(config.port, () => {
    console.log(`Сервер запущен на порту ${config.port}`);
});