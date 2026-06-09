const express = require('express');
const Quiz = require('../models/Quiz');
const Attempt = require('../models/Attempt');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const schemas = require('../validation/schemas');

const router = express.Router();

// поля с правильными ответами — скрываем везде, где не нужно
const HIDE_ANSWERS = '-questions.correctAnswerIndex -questions.correctAnswerText';


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
                .select(HIDE_ANSWERS), // прячем правильные ответы в общем списке квизов
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
        // для своих квизов ответы показываем (нужны при редактировании)
        const myQuizzes = await Quiz.find({ creator: req.user.userId })
            .sort({ createdAt: -1 });

        res.status(200).json(myQuizzes);
    } catch (e) {
        next(e);
    }
});


// ГЛОБАЛЬНЫЙ ЛИДЕРБОРД — топ пользователей по среднему проценту
// GET /api/quizzes/leaderboard
router.get('/leaderboard', async (req, res, next) => {
    try {
        const top = await Attempt.aggregate([ // группируем по пользователю, считаем средний процент и общее количество попыток
            {
                $group: {
                    _id: '$user',
                    totalAttempts: { $sum: 1 },
                    avgPercentage: {
                        $avg: {
                            $multiply: [{ $divide: ['$score', '$maxScore'] }, 100]
                        }
                    },
                    totalScore: { $sum: '$score' },
                    totalMaxScore: { $sum: '$maxScore' },
                }
            },
            { $sort: { avgPercentage: -1, totalAttempts: -1 } },
            { $limit: 30 }, // топ 30 пользователей
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' }, // превращаем массив из одного элемента в объект
            {
                $project: { // формируем итоговый вид для фронта
                    _id: 0,
                    userId: '$_id',
                    username: '$user.username',
                    avatarUrl: '$user.avatarUrl',
                    totalAttempts: 1,
                    avgPercentage: { $round: ['$avgPercentage', 1] },
                    totalScore: 1,
                    totalMaxScore: 1,
                }
            }
        ]);

        res.json(top);
    } catch (e) {
        next(e);
    }
});


// ПОЛУЧЕНИЕ КВИЗОВ ДРУГОГО ПОЛЬЗОВАТЕЛЯ
router.get('/users/:userId', async (req, res, next) => {
    try {
        const userQuizzes = await Quiz.find({ creator: req.params.userId, isPublic: true })
            .populate('creator', 'username')
            .sort({ createdAt: -1 })
            .select(HIDE_ANSWERS); // ответы скрываем и здесь

        res.status(200).json(userQuizzes);
    } catch (e) {
        next(e);
    }
});


// ПОЛУЧЕНИЕ КОНКРЕТНОГО КВИЗА ПО ID
router.get('/:id', async (req, res, next) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate('creator', 'username')
            .select(HIDE_ANSWERS); // прячем правильные ответы при получении конкретного квиза (они нужны только при попытке)

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


// ЛИДЕРБОРД КОНКРЕТНОГО КВИЗА
router.get('/:quizId/leaderboard', async (req, res, next) => {
    try {
        const top = await Attempt.find({ quiz: req.params.quizId })
            .sort({ score: -1, timeSpent: 1 })
            .limit(10) // топ 10 попыток
            .populate('user', 'username avatarUrl')
            .select('user score maxScore timeSpent completedAt'); // показываем имя, аватар, очки, время и дату (но не правильные ответы)

        res.json(top);
    } catch (e) {
        next(e);
    }
});


module.exports = router;