const Joi = require('joi');

const schemas = {
    // АВТОРИЗАЦИЯ
    register: Joi.object({
        username: Joi.string().min(5).max(30).trim().required()
            .messages({ 'string.min': 'The username must be at least 5 characters long' }),
        email: Joi.string().email().trim().lowercase().required(),
        password: Joi.string().min(6).required()
    }),

    login: Joi.object({
        email: Joi.string().email().trim().lowercase().required(),
        password: Joi.string().required()
    }),

    // КВИЗ
    createQuiz: Joi.object({
        title: Joi.string().min(3).max(100).trim().required(),
        description: Joi.string().max(500).trim().allow(''),
        imageUrl: Joi.string().uri().allow(null, ''),
        isPublic: Joi.boolean().default(true),
        tags: Joi.array().items(Joi.string().trim()).max(10),
        questions: Joi.array().items(
            Joi.object({
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
                imageUrl: Joi.string().uri().allow(null, '')
            })
        ).min(1).required()
    })
};

module.exports = schemas;