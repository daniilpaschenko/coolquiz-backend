const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');

// случайный hex-токен для email-ссылок
function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Access token (короткоживущий, 15 минут)
function generateAccessToken(userId) {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // 15 минут
    );
}

// Refresh token (долгоживущий, 30 дней, хранится в MongoDB)
async function generateRefreshToken(userId, req) {
    const token = generateSecureToken();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 дней

    await RefreshToken.create({
        user: userId,
        token,
        expiresAt,
        userAgent: req?.headers?.['user-agent'] || null,
        ip: req?.ip || null,
    });

    return token;
}

// выдать оба токена сразу
async function issueTokenPair(userId, req) {
    const accessToken = generateAccessToken(userId);
    const refreshToken = await generateRefreshToken(userId, req);
    return { accessToken, refreshToken };
}

module.exports = {
    generateSecureToken,
    generateAccessToken,
    generateRefreshToken,
    issueTokenPair,
};