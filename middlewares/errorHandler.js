const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
    logger.error({
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    });

    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: 'Invalid id format' });
    }
    // Duplicate key (например, email уже занят)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message: `This ${field} is already taken` });
    }

    res.status(500).json({ message: 'Internal server error' });
};