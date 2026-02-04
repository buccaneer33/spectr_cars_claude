import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client) {
    return client;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  client = createClient({
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

export async function cacheGet(key: string): Promise<string | null> {
  const redis = await getRedisClient();
  return redis.get(key);
}

export async function cacheSet(
  key: string,
  value: string,
  expirySeconds?: number
): Promise<void> {
  const redis = await getRedisClient();
  if (expirySeconds) {
    await redis.setEx(key, expirySeconds, value);
  } else {
    await redis.set(key, value);
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.del(key);
}
