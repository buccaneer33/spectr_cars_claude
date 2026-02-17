import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',

  llm: {
    provider: process.env.LLM_PROVIDER || 'deepseek', // 'openai' | 'deepseek'
    apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
    model: process.env.LLM_MODEL || 'deepseek-chat',
    baseUrl: process.env.LLM_BASE_URL || 'https://api.deepseek.com',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379',
  },

  services: {
    search: process.env.SEARCH_SERVICE_URL || 'http://search-service:4002',
    user: process.env.USER_SERVICE_URL || 'http://user-service:4001',
    chat: process.env.CHAT_SERVICE_URL || 'http://chat-service:4003',
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};
