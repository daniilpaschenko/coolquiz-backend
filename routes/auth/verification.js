// verify-email, resend-verification

const express = require('express');

const User = require('../../models/User');
const { emailLimiter } = require('../../middlewares/limiters');
const { generateSecureToken } = require('../../utils/tokens');
const { sendVerificationEmail } = require('../../utils/email');

const router = express.Router();

// ПОДТВЕРЖДЕНИЕ EMAIL
// GET /api/auth/verify-email?token=...
router.get('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const user = await User.findOne({
            emailVerifyToken: token,
            emailVerifyExpires: { $gt: new Date() }, // токен не просрочен
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification link' });
        }

        user.isEmailVerified = true;
        user.emailVerifyToken = null;
        user.emailVerifyExpires = null;
        await user.save();

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (e) {
        next(e);
    }
});

// ПОВТОРНАЯ ОТПРАВКА ПИСЬМА
// POST /api/auth/resend-verification
router.post('/resend-verification', emailLimiter, async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        // не раскрываем существование аккаунта — одинаковый ответ в любом случае
        if (!user || user.isEmailVerified) {
            return res.json({ message: 'If this email exists and is unverified, a new link has been sent.' });
        }

        const emailVerifyToken = generateSecureToken();
        user.emailVerifyToken = emailVerifyToken;
        user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await user.save();

        sendVerificationEmail(email, emailVerifyToken).catch(err =>
            console.error('Email send error:', err)
        );

        res.json({ message: 'If this email exists and is unverified, a new link has been sent.' });
    } catch (e) {
        next(e);
    }
});

module.exports = router;