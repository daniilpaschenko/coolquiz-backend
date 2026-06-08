// СОЕДИНЕНИЕ СУБМОДУЛЕЙ РОУТЕРА

const router = require('express').Router();

router.use('/', require('./session'));
router.use('/', require('./verification'));
router.use('/', require('./password'));

module.exports = router;