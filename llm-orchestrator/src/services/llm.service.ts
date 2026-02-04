import { openai, MODEL } from '../config/openai';
import { SYSTEM_PROMPT } from '../prompts/system';
import { ERROR_MESSAGES } from '../prompts/templates';
import { ALL_TOOLS, TOOL_EXECUTORS, ToolName } from '../tools';
import { ContextService } from './context.service';
import { SearchApiService } from './search-api.service';
import { UserApiService } from './user-api.service';
import { ChatApiService } from './chat-api.service';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { logger } from '../config/logger';

export interface ProcessMessageRequest {
  sessionId: string;
  userId?: string;
  message: string;
}

export interface ProcessMessageResponse {
  role: 'assistant';
  content: string;
  toolCalls?: {
    name: string;
    arguments: any;
    result: string;
  }[];
}

const MAX_ITERATIONS = 5;
const MODEL_CONFIG = {
  model: MODEL,
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

export class LLMService {
  private contextService: ContextService;
  private searchApi: SearchApiService;
  private userApi: UserApiService;
  private chatApi: ChatApiService;

  constructor() {
    this.contextService = new ContextService();
    this.searchApi = new SearchApiService();
    this.userApi = new UserApiService();
    this.chatApi = new ChatApiService();
  }

  async processMessage(
    req: ProcessMessageRequest
  ): Promise<ProcessMessageResponse> {
    const { sessionId, userId, message } = req;
    const toolCallsExecuted: ProcessMessageResponse['toolCalls'] = [];

    try {
      // 1. Get dialog history from Redis
      let messages: ChatCompletionMessageParam[] =
        await this.contextService.getHistory(sessionId);

      // 2. If first message, add system prompt
      if (messages.length === 0) {
        messages.push({
          role: 'system',
          content: SYSTEM_PROMPT,
        });
      }

      // 3. Add user message
      const userMessage: ChatCompletionMessageParam = {
        role: 'user',
        content: message,
      };
      messages.push(userMessage);
      await this.contextService.addMessage(sessionId, userMessage);

      // 4. Main processing loop (may have multiple iterations with tool calls)
      let iterations = 0;

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        logger.info(`LLM iteration ${iterations}`, { sessionId });

        // Call OpenAI API
        const response = await openai.chat.completions.create({
          ...MODEL_CONFIG,
          messages,
          tools: ALL_TOOLS,
          tool_choice: 'auto',
        });

        const assistantMessage = response.choices[0].message;

        // Add assistant response to history
        messages.push(assistantMessage as ChatCompletionMessageParam);
        await this.contextService.addMessage(
          sessionId,
          assistantMessage as ChatCompletionMessageParam
        );

        // Log token usage
        if (response.usage) {
          logger.info('Token usage', {
            sessionId,
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          });
        }

        // If no tool calls, this is the final response
        if (
          !assistantMessage.tool_calls ||
          assistantMessage.tool_calls.length === 0
        ) {
          return {
            role: 'assistant',
            content: assistantMessage.content || ERROR_MESSAGES.noResponse,
            toolCalls:
              toolCallsExecuted.length > 0 ? toolCallsExecuted : undefined,
          };
        }

        // 5. Execute tool calls
        logger.info(
          `Executing ${assistantMessage.tool_calls.length} tool calls`,
          { sessionId }
        );

        const toolMessages: ChatCompletionMessageParam[] = [];

        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name as ToolName;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          logger.info(`Calling tool: ${toolName}`, { sessionId, toolArgs });

          // Execute tool
          const executor = TOOL_EXECUTORS[toolName];
          let result: string;

          if (executor) {
            const service = this.getServiceForTool(toolName);
            result = await (executor as any)(toolArgs, service);
          } else {
            result = ERROR_MESSAGES.unknownTool(toolName);
          }

          logger.debug(`Tool result: ${result.substring(0, 200)}...`, {
            sessionId,
            toolName,
          });

          // Track executed tool calls
          toolCallsExecuted.push({
            name: toolName,
            arguments: toolArgs,
            result: result.substring(0, 500),
          });

          // Add tool result to messages
          const toolMessage: ChatCompletionMessageParam = {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: result,
          };

          toolMessages.push(toolMessage);
        }

        // Add all tool messages to history
        messages.push(...toolMessages);
        await this.contextService.addMessages(sessionId, toolMessages);

        // Continue loop - LLM may want to call more tools or give final response
      }

      // If reached MAX_ITERATIONS
      logger.warn('Reached MAX_ITERATIONS', { sessionId });
      return {
        role: 'assistant',
        content: ERROR_MESSAGES.processingError,
      };
    } catch (error: any) {
      logger.error('Error in LLM service:', { error, sessionId });

      // Handle OpenAI/DeepSeek API errors gracefully
      if (error?.status === 402) {
        return {
          role: 'assistant' as const,
          content: 'Извините, AI-сервис временно недоступен (недостаточно средств на балансе провайдера). Пожалуйста, обратитесь к администратору.',
        };
      }

      if (error?.status === 429) {
        return {
          role: 'assistant' as const,
          content: 'Слишком много запросов к AI-сервису. Пожалуйста, подождите немного и попробуйте снова.',
        };
      }

      if (error?.status === 401) {
        return {
          role: 'assistant' as const,
          content: 'Ошибка авторизации AI-сервиса. Пожалуйста, обратитесь к администратору.',
        };
      }

      // For any other LLM API error, return a friendly message
      if (error?.status && error?.status >= 400) {
        return {
          role: 'assistant' as const,
          content: 'Извините, произошла ошибка при обработке запроса. Попробуйте позже.',
        };
      }

      throw error;
    }
  }

  private getServiceForTool(toolName: ToolName): any {
    switch (toolName) {
      case 'search_cars':
      case 'compare_models':
        return this.searchApi;
      case 'get_user_preferences':
        return this.userApi;
      case 'save_search_result':
        return this.chatApi;
      default:
        return null;
    }
  }

  async clearContext(sessionId: string): Promise<void> {
    await this.contextService.clearHistory(sessionId);
  }

  async getContextLength(sessionId: string): Promise<number> {
    return this.contextService.getMessageCount(sessionId);
  }
}
