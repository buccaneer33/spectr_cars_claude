import { ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ToolDefinition {
  tool: ChatCompletionTool;
  execute: (args: Record<string, unknown>, service: unknown) => Promise<string>;
}

export interface ToolExecutionContext {
  sessionId: string;
  userId?: string;
}

export interface ToolRegistry {
  tools: ChatCompletionTool[];
  executors: Record<string, ToolExecutor>;
}

export type ToolExecutor = (
  args: Record<string, unknown>,
  service: unknown
) => Promise<string>;

// Tool argument types

export interface SearchCarsToolArgs {
  budget_min?: number;
  budget_max?: number;
  body_type?: string;
  fuel_type?: string;
  brand?: string;
  year_min?: number;
  year_max?: number;
  transmission?: string;
  drive_type?: string;
  limit?: number;
}

export interface CompareModelsToolArgs {
  model_ids: string[];
}

export interface GetUserPreferencesToolArgs {
  user_id: string;
}

export interface SaveSearchResultToolArgs {
  session_id: string;
  summary: string;
  selected_model_ids: string[];
}
