const mongoose = require('mongoose');
const { validate } = require('./User');

// ВОПРОС
const questionSchema = new mongoose.Schema({
    questionText: {
        type: 'String',
        required: true,
        trim: true,
    },
    options: {
        type : [String], // массив строк
        required: true,
        validate: [arrayMinLength, 'Вопрос должен содержать минимум 2 варианта ответа']
    },
    correctAnswerIndex: {
        type: Number,
        required: true,
        min: 0,
    }
});

function arrayMinLength(val) {
    return (val.length >= 2);
}

// КВИЗ ИЗ ВОПРОСОВ
const quizSchema = new mongoose.Schema({
    title: {
        type: 'String',
        required: true,
        trim: true,
    },
    description: {
        type: 'String',
        trim: true,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId, // айди создателя
        required: true,
        ref: 'User'
    },
    questions: [questionSchema], // массив вопросов
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('Quiz', quizSchema);