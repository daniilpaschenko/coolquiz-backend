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
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/users', usersRoutes);
app.use(errorHandler);

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri)
    .then(() => {
        console.log('🚀 Successfully connected to the CoolQuiz cloud MongoDB!');
        await connectRedis();
        app.listen(PORT, () => {
            console.log(`The server is running: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('❌ Error connecting to the database:', err);
        process.exit(1);
    });

process.on('unhandledRejection', (err) => {
    console.error('An unhandled error:', err);
    process.exit(1);
});