const jwt = require("jsonwebtoken");

module.exports = (req,res,next) => {
    // получение заголовка авторизации от фронтенда
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Нет авторизации: токен отсутствует' });
    }

    // получаем токен, убравь Bearer
    const token = authHeader.split(' ')[1];

    try {
        // расшифровка токена
        const decodedToken = jwt.verify(token, procces.env.JWT_SECRET);

        // сохранить данные для следующего рута
        req.user = decodedToken;

        next(); // передача управления следующему руту
    } catch (e) {
        console.error(e);
        
        return res.status(401).json({ message: 'Нет авторизации: неверный или просроченный токен' });
    }
}