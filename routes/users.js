// public profiles

const express = require('express');
const User = require('../models/User');
const Attempt = require('../models/Attempt');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// СПИСОК ПОЛЬЗОВАТЕЛЕЙ
// GET /api/users?page=1&limit=20&search=abc
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // максимум 50

        const filter = {};
        if (search) filter.username = { $regex: search, $options: 'i' };

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('username avatarUrl createdAt')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            User.countDocuments(filter)
        ]);

        res.json({
            users,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (e) {
        next(e);
    }
});

// ПУБЛИЧНЫЙ ПРОФИЛЬ
// GET /api/users/:userId
router.get('/:userId', async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('username avatarUrl createdAt'); // только публичные поля, без email/password

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (e) {
        next(e);
    }
});

module.exports = router;