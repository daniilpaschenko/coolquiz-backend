const jwt = require("jsonwebtoken");

module.exports = (req,res,next) => {
    // получение заголовка авторизации от фронтенда
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Token is missing' });
    }

    // получаем токен, убравь Bearer
    const token = authHeader.split(' ')[1];

    try {
        // расшифровка токена
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        // сохранить данные для следующего рута
        req.user = {
            userId: decodedToken.userId,
            // можно добавить decodedToken.email и т.д.
        };

        next(); // передача управления следующему руту
    } catch (e) {
        console.error(e);
        
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token is expired',
                expired: true });
        }
        
        return res.status(401).json({ message: 'Token is wrong' });
    }
}