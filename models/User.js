const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    avatarUrl: {
        type: String,
        default: null
    },
    isEmailVerified: { // подтверждение email
        type: Boolean,
        default: false,
    },
    emailVerifyToken: {
        type: String,
        default: null,
    },
    emailVerifyExpires: {
        type: Date,
        default: null,
    },
    passwordResetToken: { // cброс пароля
        type: String,
        default: null,
    },
    passwordResetExpires: {
        type: Date,
        default: null,
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);