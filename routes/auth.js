const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User');

const router = express.Router();

// РЕГИСТРАЦИЯ
router.post('/register', async (req,res) => {
    try {
        const {email, password, username} = req.body;
        const applicant = await User.findOne({email});

        if (applicant) {
            return res.status(400).json({message: 'Пользователь с такой почтой уже существует'})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password : hashedPassword,
            username
        })

        await newUser.save();
        res.status(201).json({message: 'Пользователь успешно зарегистрирован'});

    } catch(e) {
        console.error(e);
        res.status(500).json({message: 'Что-то пошло не так на сервере'});
    }
});

// ЛОГИН
router.post('/login', async (req,res) => {
    try {
        const {email, password, username} = req.body;
        const user = await User.findOne({email});

        if (!user) { // неверная почта
            res.status(400).json({message: 'Неверный логин или пароль'})
        }

        const isMatch = bcrypt.compare(password, user.password);
        if (!isMatch) { // неверный пароль
            res.status(400).json({message: 'Неверный логин или пароль'})
        }
        
        res.status(200).json({
            message: 'Успешный вход',
            user: {
                email: user.email,
                username: user.username,
                id: user._id // автоматически создаётся от MongoDB
            }
        })

    } catch (e) {
        console.error(e);
        res.status(500).json({message: 'Что-то пошло не так на сервере'});
    }
})

module.exports = router;