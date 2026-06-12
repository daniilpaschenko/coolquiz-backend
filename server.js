require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { connectRedis } = require('./services/redis');

const authRoutes = require('./routes/auth/index');
const quizRoutes = require('./routes/quizzes');
const attemptRoutes = require('./routes/attempts');
const imageRoutes = require('./routes/images');
const usersRoutes = require('./routes/users');
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

// HTTP-логирование каждого запроса
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const ms = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        logger[level]({ method: req.method, url: req.originalUrl, status: res.statusCode, ms });
    });
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', usersRoutes);
app.use(errorHandler);

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri)
    .then(async () => {
        logger.info('🚀 Successfully connected to the CoolQuiz cloud MongoDB!');
        await connectRedis();
        app.listen(PORT, () => {
            logger.info(`The server is running: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        logger.error('❌ Error connecting to the database:', err);
        process.exit(1);
    });

process.on('unhandledRejection', (err) => {
    logger.error('An unhandled error:', err);
    process.exit(1);
});