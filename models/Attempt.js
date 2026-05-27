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
        selectedAnswerIndex: { type: Number }, // multiple
        answerText: { type: String }, // open
        isCorrect: { type: Boolean }
    }],
    score: {
        type: Number,
        default: 0
    },
    maxScore: {
        type: Number,
        required: true
    },
    timeSpent: { // в секундах
        type: Number,
        default: null
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// индексы для быстрых запросов
// 1 = по возрастанию, -1 = по убыванию
attemptSchema.index({ user: 1, quiz: 1 });
attemptSchema.index({ quiz: 1, score: -1 }); // для лидерборда

module.exports = mongoose.model('Attempt', attemptSchema);