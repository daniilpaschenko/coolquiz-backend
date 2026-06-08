// forgot-password, reset-password

const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');
const validateMiddleware = require('../../middlewares/validateMiddleware');
const { emailLimiter } = require('../../middlewares/limiters');
const schemas = require('../../validation/schemas');
const { generateSecureToken } = require('../../utils/tokens');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../../utils/email');

const router = express.Router();

// ЗАПРОС СБРОСА ПАРОЛЯ
// POST /api/auth/forgot-password
router.post('/forgot-password', emailLimiter, validateMiddleware(schemas.forgotPassword), async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });

        // одинаковый ответ в любом случае — не раскрываем существование аккаунта
        const genericResponse = {
            message: 'If an account with this email exists, a reset link has been sent.',
        };

        if (!user || !user.isEmailVerified) {
            return res.json(genericResponse);
        }

        const resetToken = generateSecureToken();
        user.passwordResetToken = resetToken;
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 час
        await user.save();

        sendPasswordResetEmail(email, resetToken).catch(err =>
            console.error('Email send error:', err)
        );

        res.json(genericResponse);
    } catch (e) {
        next(e);
    }
});

// УСТАНОВКА НОВОГО ПАРОЛЯ
// POST /api/auth/reset-password
router.post('/reset-password', validateMiddleware(schemas.resetPassword), async (req, res, next) => {
    try {
        const { token, password } = req.body;

        const user = await User.findOne({
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset link' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        // удаляем все refresh tokens (выход со всех устройств) — безопасность при смене пароля
        await RefreshToken.deleteMany({ user: user._id });

        // уведомляем пользователя об изменении пароля
        sendPasswordChangedEmail(user.email).catch(err =>
            console.error('Email send error:', err)
        );

        res.json({ message: 'Password has been reset successfully. Please log in.' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;