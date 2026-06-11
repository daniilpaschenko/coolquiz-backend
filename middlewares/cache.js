const redis = require('../services/redis');

//  1. Строим ключ
//  2. Смотрим в Redis — если есть, возвращаем и выходим
//  3. Если нет — пускаем запрос дальше, перехватываем res.json(), кладём результат в кэш, отдаём клиенту

function cache(keyFn, ttl) {
    return async (req, res, next) => {
        const key = keyFn(req);

        const cached = await redis.get(key);
        if (cached !== null) {
            // X-Cache-Hit помогает при дебаге убедиться, что кэш работает
            res.setHeader('X-Cache-Hit', 'true');
            return res.json(cached);
        }

        // перехватываем res.json чтобы положить данные в кэш прозрачно для роута
        const originalJson = res.json.bind(res);
        res.json = async (data) => {
            // Кэшируем только успешные ответы
            if (res.statusCode >= 200 && res.statusCode < 300) {
                await redis.set(key, data, ttl);
            }
            res.json = originalJson; // восстанавливаем оригинал
            return originalJson(data);
        };
        next();
    };
}

module.exports = cache;