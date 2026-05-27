const mongoose = require('mongoose');
const { validate } = require('./User');

// ВОПРОС
const questionSchema = new mongoose.Schema({
    questionText: {
        type: String,
        required: true,
        trim: true,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    questionType: {
        type: String,
        enum: ['multiple', 'open'],
        default: 'multiple'
    },
    options: {
        type : [String], // массив строк
        default: null,
        validate: {validator: function(val) {
            return this.questionType == 'open' || val.length >= 2;
        },
        message: 'The question must contain at least 2 answer options'}
    },
    correctAnswerIndex: {
        type: Number,
        default: null,
        min: 0,
    },
    correctAnswerText: {
        type: String,
        default: null
    }
});

// КВИЗ ИЗ ВОПРОСОВ
const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    imageUrl: {
        type: String,
        default: null,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId, // айди создателя
        required: true,
        ref: 'User'
    },
    questions: [questionSchema], // массив вопросов
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String
    }],
}, { timestamps: true}
);

module.exports = mongoose.model('Quiz', quizSchema);