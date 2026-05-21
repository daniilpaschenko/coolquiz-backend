require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');

const app = express();
app.use(express.json()); // для json в запросах
const PORT = process.env.PORT || 3000;

app.use('/api/auth', authRoutes);

const mongoUri = process.env.MONGO_URI; // строка подключения к MongoDB
mongoose.connect(mongoUri)
    .then(() => console.log('🚀 Успешно подключились к облачной MongoDB CoolQuiz!'))
    .catch(err => console.error('❌ Ошибка подключения к базе:', err));

// запуск сервера на прослушивание порта
app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
});