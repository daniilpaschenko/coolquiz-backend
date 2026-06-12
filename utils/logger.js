const winston = require('winston');

const { combine, timestamp, printf, colorize, errors } = winston.format;

// формат для консоли
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Формат для файла json
const fileFormat = combine(
    timestamp(),
    errors({ stack: true }), // логируем stack trace ошибок
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',

    transports: [
        // консоль — только в разработке
        new winston.transports.Console({
            format: combine(
                colorize(),
                timestamp({ format: 'HH:mm:ss' }),
                errors({ stack: true }),
                consoleFormat
            ),
            silent: process.env.NODE_ENV === 'production',
        }),

        // все логи info и выше
        new winston.transports.File({
            filename: 'logs/app.log',
            format: fileFormat,
        }),

        // только ошибки — отдельный файл
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: fileFormat,
        }),
    ],
});

module.exports = logger;