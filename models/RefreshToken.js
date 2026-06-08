const mongoose = require('mongoose');

// Refresh token хранится в базе — это позволяет отзывать токены
const refreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    userAgent: { // метаданные для безопасности
        type: String,
        default: null,
    },
    ip: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 0, // MongoDB автоматически удалит документ когда наступит expiresAt
    },
});

// TTL-индекс (MongoDB сам чистит просроченные токены)
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
refreshTokenSchema.index({ user: 1 });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);