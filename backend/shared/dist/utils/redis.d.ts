import { RedisClientType } from 'redis';
export declare function getRedisClient(): Promise<RedisClientType>;
export declare function cacheGet(key: string): Promise<string | null>;
export declare function cacheSet(key: string, value: string, expirySeconds?: number): Promise<void>;
export declare function cacheDel(key: string): Promise<void>;
//# sourceMappingURL=redis.d.ts.map