const express = require('express');
const Quiz = require('../models/Quiz');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();


// ПОЛУЧЕНИЕ ВСЕХ КВИЗОВ
router.get('/', async (req,res) => {
    try {
        const quizzes = await Quiz.find().populate('creator', 'username email');

        res.status(200).json(quizzes);
    } catch (e) {
        console.error(e);
        res.status(500).json({message: 'Не удалось загрузить квизы'});
    }
});


// ПОЛУЧЕНИЕ КВИЗОВ (СВОИХ)
router.get('/my', async (req,res) => {
    try {
        const myQuizzes = await Quiz.find({creator: req.user.id});

        res.status(200).json(myQuizzes);
    } catch (e) {
        console.error(e);
        
        res.status(500).json({message: 'Не удалось загрузить Ваши квизы'});
    }
});


// ПОЛУЧЕНИЕ КОНКРЕТНОГО КВИЗА ПО АЙДИ
router.get('/:id', async (req,res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('creator', 'username');

        if (!quiz) {
            return res.status(404).json({ message: 'Квиз не найден' });
        }

        res.status(200).json(quiz);
    } catch (e) {
        console.error(e);

        if (e.name == 'CastError') {
            return res.status(400).json({ message: 'Неверный формат id квиза' });
        }

        res.status(500).json({ message: 'Ошибка при загрузке квиза' });
    }
});


// ПОЛУЧЕНИЕ КВИЗОВ ДРУГОГО ПОЛЬЗОВАТЕЛЯ
router.get('/users/:userId', async (req,res) => {
    try {
        const userQuizzes = await Quiz.find({creator: req.params.userId}).populate('creator', 'username');

        res.status(200).json(userQuizzes);
    } catch (e) {
        console.error(e);

        if (e.name === 'CastError') {
            return res.status(400).json({ message: 'Неверный формат id пользователя' });
        }

        res.status(500).json({ message: 'Не удалось получить квизы этого пользователя' });
    }
});


// СОЗДАНИЕ КВИЗА
router.post('/', authMiddleware, async (req,res) => {
    try {
        const {title, description, questions} = req.body;
        
        if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Название квиза и массив вопросов обязательны' });
        }

        const newQuiz = new Quiz({
            title,
            description,
            creator: req.user.id,
            questions
        });

        await newQuiz.save();

        res.status(201).json(newQuiz);
    } catch (e) {
        console.error(e);

        if (e.name === 'ValidationError') {
            return res.status(400).json({ message: e.message });
        }

        res.status(500).json({ message: 'Не удалось создать квиз' });
    }
});


// УДАЛЕНИЕ КВИЗА (СВОЕГО)
router.delete('/:id', authMiddleware, async (req,res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) { // если нет квиза с таким айди
            return res.status(404).json({message: 'Квиз не найден'});
        }
        
        if (quiz.creator.toString() !== req.user.id) {
            return res.status(403).json({message: 'Вы не можете удалить чужой квиз'});
        }

        await quiz.deleteOne();

        res.status(200).json({ message: 'Квиз успешно удален' });
    } catch (e) {
        console.error(e);

        if (e.name == 'CastError') {
            res.status(400).json({ message: 'Неверный формат id квиза' });
        }

        res.status(500).json({ message: 'Ошибка при удалении квиза' });
    }
});


// РЕДАКТИРОВАНИЕ КВИЗА
router.patch('/:id', authMiddleware, async (req,res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) { // если нет квиза с таким айди
            return res.status(404).json({message: 'Квиз не найден'});
        }
        
        if (quiz.creator.toString() !== req.user.id) {
            return res.status(403).json({message: 'Вы не можете редактировать чужой квиз'});
        }

        // обновляем только нужные поля
        if (req.body.title) quiz.title = req.body.title;
        if (req.body.description !== undefined) quiz.description = req.body.description;
        if (req.body.questions) quiz.questions = req.body.questions;
        
        await quiz.save();

        res.status(200).json(quiz);
    } catch (e) {
        console.error(e);

        if (e.name === 'ValidationError') {
            return res.status(400).json({ message: e.message });
        }

        if (e.name === 'CastError') {
            return res.status(400).json({ message: 'Неверный формат id квиза' });
        }

        res.status(500).json({ message: 'Ошибка при изменении квиза' });
    }
});


module.exports = router;