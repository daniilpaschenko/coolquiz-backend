// register, login, refresh, logout, logout-all, me (профиль)

const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const validateMiddleware = require('../../middlewares/validateMiddleware');
const authMiddleware = require('../../middlewares/authMiddleware');
const { authLimiter } = require('../../middlewares/limiters');
const schemas = require('../../validation/schemas');
const { generateSecureToken, issueTokenPair } = require('../../utils/tokens');
const { sendVerificationEmail } = require('../../utils/email');

const router = express.Router();

// РЕГИСТРАЦИЯ
// POST /api/auth/register
router.post('/register', authLimiter, validateMiddleware(schemas.register), async (req, res, next) => {
    try {
        const { email, password, username } = req.body;

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) {
            const field = existing.email === email ? 'email' : 'username'; // почта или уникальное имя пользователя
            return res.status(400).json({ message: `This ${field} is already taken` });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const emailVerifyToken = generateSecureToken(); // из tokens.js
        const emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

        const newUser = new User({
            email,
            password: hashedPassword,
            username,
            emailVerifyToken,
            emailVerifyExpires,
        });
        await newUser.save();

        sendVerificationEmail(email, emailVerifyToken).catch(err =>
            console.error('Email send error:', err)
        );

        res.status(201).json({
            message: 'Registered successfully. Please check your email to verify your account.',
        });
    } catch (e) {
        next(e);
    }
});

// ЛОГИН
// POST /api/auth/login
router.post('/login', authLimiter, validateMiddleware(schemas.login), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in.',
                emailNotVerified: true,
            });
        }

        const { accessToken, refreshToken } = await issueTokenPair(user._id, req);

        res.status(200).json({
            message: 'Logged in successfully',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                avatarUrl: user.avatarUrl,
                isEmailVerified: user.isEmailVerified,
            },
        });
    } catch (e) {
        next(e);
    }
});

// ОБНОВЛЕНИЕ ACCESS TOKEN
// POST /api/auth/refresh
router.post('/refresh', validateMiddleware(schemas.refreshToken), async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        const stored = await RefreshToken.findOne({ token: refreshToken }).populate('user');

        if (!stored) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }

        if (stored.expiresAt < new Date()) {
            await stored.deleteOne();
            return res.status(401).json({ message: 'Refresh token expired, please log in again' });
        }

        // Ротация токена — старый удаляем, выдаём новую пару
        await stored.deleteOne();
        const { accessToken, refreshToken: newRefreshToken } = await issueTokenPair(stored.user._id, req);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (e) {
        next(e);
    }
});

// LOGOUT ОДНОГО УСТРОЙСТВА
// POST /api/auth/logout
router.post('/logout', async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // удаляем конкретный refresh token
            await RefreshToken.deleteOne({ token: refreshToken });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (e) {
        next(e);
    }
});

// LOGOUT ВЕЗДЕ
// POST /api/auth/logout-all  (требует access token)
router.post('/logout-all', authMiddleware, async (req, res, next) => {
    try {
        // удаляем все refresh tokens пользователя
        await RefreshToken.deleteMany({ user: req.user.userId });
        res.json({ message: 'Logged out from all devices' });
    } catch (e) {
        next(e);
    }
});

// ПРОФИЛЬ
// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password -emailVerifyToken -emailVerifyExpires -passwordResetToken -passwordResetExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (e) {
        next(e);
    }
});

module.exports = router;