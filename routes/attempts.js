const express = require('express');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');
const schemas = require('../validation/schemas');
const redis = require('../services/redis');

const router = express.Router();


// ПОДАЧА ОТВЕТОВ
router.post('/quizzes/:quizId/submit', authMiddleware, validateMiddleware(schemas.submitAttempt), async (req, res, next) => {
    try {
        const { quizId } = req.params;
        const { answers, timeSpent } = req.body;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        let score = 0;
        const maxScore = quiz.questions.length;
        const processedAnswers = [];

        quiz.questions.forEach((question, index) => {
            const userAnswer = answers.find(a => a.questionIndex === index);

            let isCorrect = false;

            if (question.questionType === 'multiple' && userAnswer?.selectedAnswerIndex !== undefined) {
                isCorrect = userAnswer.selectedAnswerIndex === question.correctAnswerIndex;
            } else if (question.questionType === 'open' && userAnswer?.answerText) {
                isCorrect = userAnswer.answerText.trim().toLowerCase() ===
                    (question.correctAnswerText || '').trim().toLowerCase();
            }

            processedAnswers.push({
                questionIndex: index,
                selectedAnswerIndex: userAnswer?.selectedAnswerIndex,
                answerText: userAnswer?.answerText,
                isCorrect
            });

            if (isCorrect) score++;
        });

        const attempt = new Attempt({
            user: req.user.userId,
            quiz: quizId,
            answers: processedAnswers,
            score,
            maxScore,
            timeSpent: timeSpent ?? null
        });

        await attempt.save();

        await redis.del(
            redis.Keys.leaderboardQuiz(quizId),
            redis.Keys.leaderboardGlobal()
        );

        res.status(200).json({
            message: 'Attempt is saved',
            attemptId: attempt._id,
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
            timeSpent,
            // детальный разбор — какой ответ правильный
            breakdown: processedAnswers
        });
    } catch (e) {
        next(e);
    }
});


// РЕЗУЛЬТАТЫ КОНКРЕТНОГО КВИЗА ДЛЯ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
router.get('/quizzes/:quizId/results', authMiddleware, async (req, res, next) => {
    try {
        const attempts = await Attempt.find({
            user: req.user.userId,
            quiz: req.params.quizId
        }).sort({ completedAt: -1 });

        res.json(attempts);
    } catch (e) {
        next(e);
    }
});


// СТАТИСТИКА ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
router.get('/users/me/stats', authMiddleware, async (req, res, next) => {
    try {
        const stats = await Attempt.aggregate([
            { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(req.user.userId) } },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    totalScore: { $sum: '$score' },
                    totalMaxScore: { $sum: '$maxScore' },
                    totalTimeSpent: { $sum: '$timeSpent' },
                    avgPercentage: {
                        $avg: {
                            $multiply: [{ $divide: ['$score', '$maxScore'] }, 100]
                        }
                    }
                }
            }
        ]);

        const uniqueQuizzes = await Attempt.distinct('quiz', { user: req.user.userId });

        if (!stats.length) {
            return res.json({
                totalAttempts: 0,
                uniqueQuizzesTaken: 0,
                avgPercentage: 0,
                totalTimeSpent: 0,
            });
        }

        const s = stats[0];
        res.json({
            totalAttempts: s.totalAttempts,
            uniqueQuizzesTaken: uniqueQuizzes.length,
            avgPercentage: Math.round(s.avgPercentage),
            totalTimeSpent: s.totalTimeSpent ?? 0,
        });
    } catch (e) {
        next(e);
    }
});


module.exports = router;