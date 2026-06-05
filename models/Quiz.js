const mongoose = require('mongoose');

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
    timeLimitSeconds: {
        type: Number,
        default: null,
        validate: {
            validator: function (val) {
                if (val === null) return true;
                return val >= 5 && val <= 900;
            },
            message: 'The question time should be null or between 5 and 900 seconds (15 minutes)'
        }
    },
    options: {
        type: [String],
        default: null,
        validate: {
            validator: function (val) {
                return this.questionType === 'open' || (val && val.length >= 2);
            },
            message: 'The question must contain at least 2 answer options'
        }
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
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    defaultTimeLimitSeconds: {
        type: Number,
        default: null,
        validate: {
            validator: function (val) {
                if (val === null) return true;
                return val >= 15 && val <= 3600;
            },
            message: 'The quiz time should be null or between 15 and 3600 seconds (1 hour)'
        }
    },
    questions: [questionSchema],
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true,
    }],
}, { timestamps: true });

quizSchema.index({ title: 'text', tags: 'text' });

module.exports = mongoose.model('Quiz', quizSchema);