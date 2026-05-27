const express = require('express');
const Quiz = require('../models/Quiz');

const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();


// ПОЛУЧЕНИЕ ВСЕХ КВИЗОВ (ПУБЛИЧНЫХ)
router.get('/', async (req,res) => {
    try {
        const quizzes = await Quiz.find({ isPublic: true }).populate('creator', 'username email')
        .sort({ createdAt: -1 });

        res.status(200).json(quizzes);
    } catch (e) {
        console.error(e);
        res.status(500).json({message: 'Failed to upload quizzes'});
    }
});


// ПОЛУЧЕНИЕ КВИЗОВ (СВОИХ)
router.get('/my', authMiddleware, async (req,res) => {
    try {
        const myQuizzes = await Quiz.find({creator: req.user.userId})
        .sort({ createdAt: -1 });

        res.status(200).json(myQuizzes);
    } catch (e) {
        console.error(e);
        
        res.status(500).json({message: 'Failed to upload your quizzes'});
    }
});


// ПОЛУЧЕНИЕ КОНКРЕТНОГО КВИЗА ПО АЙДИ
router.get('/:id', async (req,res) => {
    try {
        const quiz = await Quiz.findById(req.params.id).populate('creator', 'username');

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz is not found' });
        }

        res.status(200).json(quiz);
    } catch (e) {
        console.error(e);

        if (e.name == 'CastError') {
            return res.status(400).json({ message: 'Invalid quiz id format' });
        }

        res.status(500).json({ message: 'Internal server error' });
    }
});


// ПОЛУЧЕНИЕ КВИЗОВ ДРУГОГО ПОЛЬЗОВАТЕЛЯ
router.get('/users/:userId', async (req,res) => {
    try {
        const userQuizzes = await Quiz.find({creator: req.params.userId, isPublic: true})
        .populate('creator', 'username').sort({ createdAt: -1 });

        res.status(200).json(userQuizzes);
    } catch (e) {
        console.error(e);

        if (e.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid user id format' });
        }

        res.status(500).json({ message: 'Failed to retrieve quizzes' });
    }
});


// СОЗДАНИЕ КВИЗА
router.post('/', authMiddleware, async (req,res) => {
    try {
        const {title, description, questions, imageUrl, isPublic, tags} = req.body;
        
        if (!title || !questions || !Array.isArray(questions) || questions.length == 0) {
            return res.status(400).json({ message: 'The name of the quiz and the list of questions are required' });
        }

        const newQuiz = new Quiz({
            title,
            description,
            creator: req.user.userId,
            questions,
            imageUrl,
            isPublic: isPublic ?? true,
            tags: tags || [],
        });

        await newQuiz.save();
        await newQuiz.populate('creator', 'username');

        res.status(201).json(newQuiz);
    } catch (e) {
        console.error(e);

        if (e.name === 'ValidationError') {
            return res.status(400).json({ message: e.message });
        }

        res.status(500).json({ message: 'Failed to create a quiz' });
    }
});


// УДАЛЕНИЕ КВИЗА (СВОЕГО)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findOneAndDelete({ 
            _id: req.params.id, 
            creator: req.user.userId 
        });

        if (!quiz) {
            return res.status(403).json({ message: 'Quiz not found or you do not have the rights' });
        }

        res.status(200).json({ message: 'The quiz was successfully deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete the quiz' });
    }
});


// РЕДАКТИРОВАНИЕ КВИЗА
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const quiz = await Quiz.findOne({ 
            _id: req.params.id, 
            creator: req.user.userId 
        });

        if (!quiz) {
            return res.status(403).json({ message: 'Quiz not found or you do not have the rights' });
        }

        Object.assign(quiz, req.body);
        await quiz.save();
        await quiz.populate('creator', 'username');

        res.json(quiz);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error when editing the quiz' });
    }
});


module.exports = router;