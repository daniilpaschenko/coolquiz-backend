const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const schemas = require('../validation/schemas');

const router = express.Router();


// ПОЛУЧЕНИЕ ВСЕХ КВИЗОВ (ПУБЛИЧНЫХ) — с пагинацией и поиском
router.get('/', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, tag } = req.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

        const filter = { isPublic: true };
        if (search) filter.title = { $regex: search, $options: 'i' };
        if (tag) filter.tags = tag;

        const [quizzes, total] = await Promise.all([
            Quiz.find(filter)
                .populate('creator', 'username')
                .sort({ createdAt: -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .select('-questions.correctAnswerIndex -questions.correctAnswerText'), // не отдаём ответы в списке
            Quiz.countDocuments(filter)
        ]);

        res.status(200).json({
            quizzes,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (e) {
        next(e);
    }
});


// ПОЛУЧЕНИЕ СВОИХ КВИЗОВ
router.get('/my', authMiddleware, async (req, res, next) => {
    try {
        const myQuizzes = await Quiz.find({ creator: req.user.userId })
            .sort({ createdAt: -1 });

        res.status(200).json(myQuizzes);
    } catch (e) {
        next(e);
    }
});


// ПОЛУЧЕНИЕ КВИЗОВ ДРУГОГО ПОЛЬЗОВАТЕЛЯ
router.get('/users/:userId', async (req, res, next) => {
    try {
        const userQuizzes = await Quiz.find({ creator: req.params.userId, isPublic: true })
            .populate('creator', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(userQuizzes);
    } catch (e) {
        next(e);
    }
});


// ПОЛУЧЕНИЕ КОНКРЕТНОГО КВИЗА ПО ID
router.get('/:id', async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('creator', 'username');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz is not found' });
        }

        res.status(200).json(quiz);
    } catch (e) {
        next(e);
    }
});


// СОЗДАНИЕ КВИЗА
router.post('/', authMiddleware, validateMiddleware(schemas.createQuiz), async (req, res, next) => {
    try {
        const { title, description, questions, imageUrl, isPublic, tags, defaultTimeLimitSeconds } = req.body;

        const newQuiz = new Quiz({
            title,
            description,
            creator: req.user.userId,
            questions,
            imageUrl,
            isPublic: isPublic ?? true,
            tags: tags || [],
            defaultTimeLimitSeconds: defaultTimeLimitSeconds ?? null,
        });

        await newQuiz.save();
        await newQuiz.populate('creator', 'username');

        res.status(201).json(newQuiz);
    } catch (e) {
        next(e);
    }
});


// УДАЛЕНИЕ КВИЗА (СВОЕГО)
router.delete('/:id', authMiddleware, async (req, res, next) => {
    try {
        const quiz = await Quiz.findOneAndDelete({
            _id: req.params.id,
            creator: req.user.userId
        });

        if (!quiz) {
            return res.status(403).json({ message: 'Quiz not found or you do not have the rights' });
        }

        await Attempt.deleteMany({ quiz: req.params.id });

        res.status(200).json({ message: 'The quiz was successfully deleted' });
    } catch (e) {
        next(e);
    }
});


// РЕДАКТИРОВАНИЕ КВИЗА
router.put('/:id', authMiddleware, validateMiddleware(schemas.updateQuiz), async (req, res, next) => {
    try {
        const quiz = await Quiz.findOne({
            _id: req.params.id,
            creator: req.user.userId
        });

        if (!quiz) {
            return res.status(403).json({ message: 'Quiz not found or you do not have the rights' });
        }

        // обновляем только разрешённые поля, а не весь req.body
        const allowed = ['title', 'description', 'imageUrl', 'isPublic', 'tags', 'questions', 'defaultTimeLimitSeconds'];
        allowed.forEach(field => {
            if (req.body[field] !== undefined) {
                quiz[field] = req.body[field];
            }
        });

        await quiz.save();
        await quiz.populate('creator', 'username');

        res.json(quiz);
    } catch (e) {
        next(e);
    }
});


// ЛИДЕРБОРД КВИЗА
router.get('/:quizId/leaderboard', async (req, res, next) => {
    try {
        const top = await Attempt.find({ quiz: req.params.quizId })
            .sort({ score: -1, timeSpent: 1 }) // выше счёт → лучше; при равном — меньше времени
            .limit(10)
            .populate('user', 'username avatarUrl')
            .select('user score maxScore timeSpent completedAt');

        res.json(top);
    } catch (e) {
        next(e);
    }
});


module.exports = router;