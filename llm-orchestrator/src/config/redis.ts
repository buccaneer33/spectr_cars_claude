import { createClient, RedisClientType } from 'redis';
import { config } from './env';

let client: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (client) {
    return client;
  }

  client = createClient({ url: config.redis.url });

  client.on('error', (err) => console.error('Redis Error:', err));
  client.on('connect', () => console.log('✅ Redis connected'));

  await client.connect();
  return client;
}
