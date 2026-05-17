const router = require('express').Router();
const rateLimit = require("express-rate-limit");
const { register, login, me } = require('./auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, me);

module.exports = router;


