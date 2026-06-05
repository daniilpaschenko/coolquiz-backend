const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: [{
        questionIndex: { type: Number, required: true },
        selectedAnswerIndex: { type: Number },  // для multiple
        answerText: { type: String }, // для open
        isCorrect: { type: Boolean }
    }],
    score: {
        type: Number,
        default: 0,
        min: 0
    },
    maxScore: {
        type: Number,
        required: true,
        min: 1
    },
    timeSpent: {
        type: Number,
        default: null,
        // валидация — не отрицательное, не больше суток
        min: 0,
        max: 86400
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// индексы для быстрых запросов
attemptSchema.index({ user: 1, quiz: 1 });
attemptSchema.index({ quiz: 1, score: -1 }); // для лидерборда

module.exports = mongoose.model('Attempt', attemptSchema);