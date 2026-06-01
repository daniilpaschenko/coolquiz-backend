const express = require('express');
const Attempt = require('../models/Attempt');
const Quiz = require('../models/Quiz');
const authMiddleware = require('../middlewares/authMiddleware');
const validateMiddleware = require('../middlewares/validateMiddleware');

const router = express.Router();

// ПОДАЧА ОТВЕТОВ
router.post('/quizzes/:quizId/submit', authMiddleware, async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers, timeSpent } = req.body; // answers = массив ответов пользователя

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({ message: 'Квиз не найден' });
        }

        let score = 0;
        const maxScore = quiz.questions.length;
        const processedAnswers = [];

        // проверка каждого ответа
        quiz.questions.forEach((question, index) => {
            const userAnswer = answers.find(a => a.questionIndex === index);

            let isCorrect = false;

            if (question.questionType === 'multiple' && userAnswer?.selectedAnswerIndex !== undefined) {
                isCorrect = userAnswer.selectedAnswerIndex === question.correctAnswerIndex;
            }
            else if (question.questionType === 'open' && userAnswer?.answerText) {
                // проверка ответа для открытых вопросов
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
            timeSpent
        });

        await attempt.save();

        res.status(200).json({
            message: 'Attempt is saved',
            attemptId: attempt._id,
            score,
            maxScore,
            percentage: Math.round((score / maxScore) * 100),
            timeSpent
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error saving result' });
    }
});

// Получить результаты конкретного квиза для текущего пользователя
router.get('/quizzes/:quizId/results', authMiddleware, async (req, res) => {
    try {
        const attempts = await Attempt.find({
            user: req.user.userId,
            quiz: req.params.quizId
        }).sort({ completedAt: -1 });

        res.json(attempts);
    } catch (e) {
        res.status(500).json({ message: 'Error getting result' });
    }
});

module.exports = router;