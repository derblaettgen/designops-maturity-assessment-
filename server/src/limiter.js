const rateLimit = require('express-rate-limit');

const readLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: 'Too many requests' },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many requests' },
});

module.exports = { readLimiter, writeLimiter };
