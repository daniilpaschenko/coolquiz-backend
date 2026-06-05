const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const validateMiddleware = require('../middlewares/validateMiddleware');
const schemas = require('../validation/schemas');

const router = express.Router();

// защита от брутфорса
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 10,
    message: { message: 'Too many attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});

// РЕГИСТРАЦИЯ
router.post('/register', authLimiter, validateMiddleware(schemas.register), async (req, res, next) => {
    try {
        const { email, password, username } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: 'The user with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword, username });
        await newUser.save();

        res.status(201).json({ message: 'The user has been successfully registered' });
    } catch (e) {
        next(e); // передаём в errorHandler
    }
});

// ЛОГИН
router.post('/login', authLimiter, validateMiddleware(schemas.login), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) { // FIX: добавлен return, иначе выполнение шло дальше и падало
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { // FIX: добавлен return
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '3d' }
        );

        res.status(200).json({
            message: 'Successful login',
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
            }
        });
    } catch (e) {
        next(e);
    }
});

// ПОЛУЧЕНИЕ СВОЕГО ПРОФИЛЯ
router.get('/me', require('../middlewares/authMiddleware'), async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (e) {
        next(e);
    }
});

module.exports = router;