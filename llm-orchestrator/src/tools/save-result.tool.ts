import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { ERROR_MESSAGES } from '../prompts/templates';
import { ChatApiService } from '../services/chat-api.service';
import { logger } from '../config/logger';

export const saveSearchResultTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'save_search_result',
    description:
      'Сохранить результат подбора автомобилей для пользователя. Используй после финального выбора.',
    parameters: {
      type: 'object',
      properties: {
        session_id: {
          type: 'string',
          description: 'ID текущей сессии чата',
        },
        summary: {
          type: 'string',
          description:
            'Краткое описание поиска (например: "Седан до 2 млн с автоматом")',
        },
        selected_model_ids: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'ID выбранных моделей для сохранения',
        },
      },
      required: ['session_id', 'summary', 'selected_model_ids'],
    },
  },
};

export interface SaveSearchResultArgs {
  session_id: string;
  summary: string;
  selected_model_ids: string[];
}

export async function executeSaveSearchResult(
  args: SaveSearchResultArgs,
  chatApiService: ChatApiService
): Promise<string> {
  try {
    logger.info('Executing save_search_result', {
      sessionId: args.session_id,
      summary: args.summary,
      modelIds: args.selected_model_ids,
    });

    await chatApiService.saveSearchResult(args.session_id, {
      summary: args.summary,
      modelIds: args.selected_model_ids,
    });

    return 'Результат подбора успешно сохранён! Ты можешь найти его в разделе "Избранное" в личном кабинете.';
  } catch (error) {
    logger.error('Error executing save_search_result:', error);
    return ERROR_MESSAGES.saveError;
  }
}
