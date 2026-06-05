const Joi = require('joi');

// переиспользуемая схема вопроса
const questionSchema = Joi.object({
    questionText: Joi.string().min(10).max(300).trim().required(),
    questionType: Joi.string().valid('multiple', 'open').default('multiple'),
    options: Joi.array().items(Joi.string().trim()),
    correctAnswerIndex: Joi.number().integer().min(0).when('questionType', {
        is: 'multiple',
        then: Joi.required()
    }),
    correctAnswerText: Joi.string().when('questionType', {
        is: 'open',
        then: Joi.required()
    }),
    imageUrl: Joi.string().uri().allow(null, ''),
    timeLimitSeconds: Joi.number().integer().min(5).max(900).allow(null)
});

const schemas = {
    // АВТОРИЗАЦИЯ
    register: Joi.object({
        username: Joi.string().min(5).max(16).trim().required()
            .messages({ 'string.min': 'The username must be at least 5 characters long' }),
        email: Joi.string().email().trim().lowercase().required(),
        password: Joi.string().min(6).required()
    }),

    login: Joi.object({
        email: Joi.string().email().trim().lowercase().required(),
        password: Joi.string().required()
    }),

    // СОЗДАНИЕ КВИЗА
    createQuiz: Joi.object({
        title: Joi.string().min(3).max(100).trim().required(),
        description: Joi.string().max(500).trim().allow(''),
        imageUrl: Joi.string().uri().allow(null, ''),
        isPublic: Joi.boolean().default(true),
        tags: Joi.array().items(Joi.string().trim()).max(10),
        defaultTimeLimitSeconds: Joi.number().integer().min(15).max(3600).allow(null),
        questions: Joi.array().items(questionSchema).min(1).required()
    }),

    // отдельная схема для редактирования — все поля опциональны
    updateQuiz: Joi.object({
        title: Joi.string().min(3).max(100).trim(),
        description: Joi.string().max(500).trim().allow(''),
        imageUrl: Joi.string().uri().allow(null, ''),
        isPublic: Joi.boolean(),
        tags: Joi.array().items(Joi.string().trim()).max(10),
        defaultTimeLimitSeconds: Joi.number().integer().min(15).max(3600).allow(null),
        questions: Joi.array().items(questionSchema).min(1)
    }),

    // ПОДАЧА ОТВЕТОВ
    submitAttempt: Joi.object({
        answers: Joi.array().items(
            Joi.object({
                questionIndex: Joi.number().integer().min(0).required(),
                selectedAnswerIndex: Joi.number().integer().min(0),
                answerText: Joi.string().max(1000).trim()
            })
        ).required(),
        timeSpent: Joi.number().integer().min(0).max(86400).allow(null)
    })
};

module.exports = schemas;