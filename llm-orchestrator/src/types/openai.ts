import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionToolChoiceOption,
} from 'openai/resources/chat/completions';

export type { ChatCompletionMessageParam, ChatCompletionTool };

export interface LLMRequest {
  sessionId: string;
  userId?: string;
  message: string;
}

export interface LLMResponse {
  role: 'assistant';
  content: string;
  toolCalls?: ToolCallResult[];
}

export interface ToolCallResult {
  name: string;
  arguments: Record<string, unknown>;
  result: string;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export type ToolChoice = ChatCompletionToolChoiceOption;
