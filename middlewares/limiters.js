const rateLimit = require('express-rate-limit');

// для логина/регистрации — 10 попыток за 15 минут
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// для email-запросов — 5 попыток за час
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 час
    max: 5,
    message: { message: 'Too many email requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// для подтверждения email — 10 попыток за 15 минут
const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10,
    message: { message: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { authLimiter, emailLimiter, verifyLimiter };