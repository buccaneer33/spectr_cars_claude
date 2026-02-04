import OpenAI from 'openai';
import { config } from './env';

if (!config.llm.apiKey) {
  console.warn('⚠️  LLM_API_KEY not set!');
}

// DeepSeek uses OpenAI-compatible API
export const openai = new OpenAI({
  apiKey: config.llm.apiKey,
  baseURL: config.llm.baseUrl,
});

export const MODEL = config.llm.model;

// Log which provider is being used
console.log(`🤖 LLM Provider: ${config.llm.provider}`);
console.log(`   Model: ${config.llm.model}`);
console.log(`   Base URL: ${config.llm.baseUrl}`);
