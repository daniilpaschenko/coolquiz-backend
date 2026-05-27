const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const validateMiddleware = require('../middlewares/validateMiddleware');
const schemas = require('../validation/schemas');

const router = express.Router();

// РЕГИСТРАЦИЯ
router.post('/register', validateMiddleware(schemas.register), async (req,res) => {
    try {
        const {email, password, username} = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const applicant = await User.findOne({email});
        if (applicant) {
            return res.status(400).json({message: 'The user with this email already exists'})
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            password : hashedPassword,
            username
        })
        await newUser.save();

        res.status(201).json({message: 'The user has been successfully registered'});

    } catch(e) {
        console.error(e);
        res.status(500).json({message: 'Internal server error'});
    }
});

// ЛОГИН
router.post('/login', validateMiddleware(schemas.login), async (req,res) => {
    try {
        const {email, password} = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({email});
        if (!user) { // неверная почта
            res.status(400).json({message: 'Invalid username or password'})
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) { // неверный пароль
            res.status(400).json({message: 'Invalid username or password'})
        }
        
        const token = jwt.sign(
            { userId: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '3d' } // время может другое потом
        );

        res.status(200).json({
            message: 'Successful login',
            token,
            user: {
                email: user.email,
                username: user.username,
                id: user._id // автоматически создаётся от MongoDB
            }
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({message: 'Internal server error'});
    }
});

module.exports = router;