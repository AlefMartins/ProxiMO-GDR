// backend/src/config/redis.js
const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || '',
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  console.log('Redis conectado com sucesso');
});

redisClient.on('error', (err) => {
  console.error('Erro na conexão com Redis:', err);
});

module.exports = redisClient;
