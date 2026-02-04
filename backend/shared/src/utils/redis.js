"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisClient = getRedisClient;
exports.cacheGet = cacheGet;
exports.cacheSet = cacheSet;
exports.cacheDel = cacheDel;
const redis_1 = require("redis");
let client = null;
async function getRedisClient() {
    if (client) {
        return client;
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    client = (0, redis_1.createClient)({
        url: redisUrl,
    });
    client.on('error', (err) => {
        console.error('Redis Client Error:', err);
    });
    client.on('connect', () => {
        console.log('✅ Connected to Redis');
    });
    await client.connect();
    return client;
}
async function cacheGet(key) {
    const redis = await getRedisClient();
    return redis.get(key);
}
async function cacheSet(key, value, expirySeconds) {
    const redis = await getRedisClient();
    if (expirySeconds) {
        await redis.setEx(key, expirySeconds, value);
    }
    else {
        await redis.set(key, value);
    }
}
async function cacheDel(key) {
    const redis = await getRedisClient();
    await redis.del(key);
}
