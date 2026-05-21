const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: {
        type: 'String',
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: 'String',
        required: true,
    },
    username: {
        type: 'String',
        required: true,
    },
    regDate: {
        type: Date,
        default: Date.now,
    }
})

module.exports = mongoose.model('User', userSchema);