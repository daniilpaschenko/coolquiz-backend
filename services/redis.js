const { createClient } = require('redis');

const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
});

client.on('error', (err) => console.error('❌ Redis error:', err));
client.on('connect', () => console.log('✅ Redis connected'));

async function connectRedis() {
    await client.connect();
}

// TTL константы (в секундах)
const TTL = {
    QUIZ_LIST: 5 * 60,  // список публичных квизов — 5 минут
    QUIZ_SINGLE: 10 * 60, // один квиз по id — 10 минут
    LEADERBOARD_QUIZ: 2 * 60, // лидерборд конкретного квиза — 2 минуты
    LEADERBOARD_GLOBAL: 3 * 60, // глобальный лидерборд — 3 минуты
};

// rkeys для кэширования в Redis
const Keys = {
    quizList: (page, limit, search, tag) => // список с учётом пагинации и фильтров
        `quizzes:list:p${page}:l${limit}:s${search || ''}:t${tag || ''}`,

    quiz: (id) => `quizzes:single:${id}`,

    leaderboardQuiz: (quizId) => `leaderboard:quiz:${quizId}`,
    leaderboardGlobal: () => `leaderboard:global`,

    quizListPattern: () => `quizzes:list:*`, // паттерн для удаления всех страниц списка сразу
};

// базовые функции для работы с Redis, оборачиваем в try/catch чтобы не падать при ошибках Redis и идти в MongoDB
async function get(key) {
    try {
        const raw = await client.get(key);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        console.error('Redis GET error:', e);
        return null; // при ошибке Redis — идём в MongoDB, не падаем
    }
}

async function set(key, value, ttlSeconds) {
    try {
        await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
    } catch (e) {
        console.error('Redis SET error:', e);
    }
}

async function del(...keys) {
    try {
        if (keys.length) await client.del(keys);
    } catch (e) {
        console.error('Redis DEL error:', e);
    }
}

// удаляет все ключи по glob-паттерну (например quizzes:list:*)
// используем SCAN чтобы не блокировать Redis на большой базе (в отличие от KEYS)
async function delByPattern(pattern) {
    try {
        let cursor = 0;
        do {
            const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 });
            cursor = reply.cursor;
            if (reply.keys.length) {
                await client.del(reply.keys);
            }
        } while (cursor !== 0);
    } catch (e) {
        console.error('Redis SCAN/DEL error:', e);
    }
}

module.exports = { connectRedis, get, set, del, delByPattern, Keys, TTL };