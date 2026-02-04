import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { formatComparisonForLLM, ERROR_MESSAGES } from '../prompts/templates';
import { SearchApiService } from '../services/search-api.service';
import { logger } from '../config/logger';

export const compareModelsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'compare_models',
    description:
      'Детальное сравнение выбранных моделей автомобилей. Используй после search_cars для топ-3 вариантов.',
    parameters: {
      type: 'object',
      properties: {
        model_ids: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Массив ID моделей для сравнения (от 2 до 3 моделей)',
          minItems: 2,
          maxItems: 3,
        },
      },
      required: ['model_ids'],
    },
  },
};

export interface CompareModelsArgs {
  model_ids: string[];
}

export async function executeCompareModels(
  args: CompareModelsArgs,
  searchApiService: SearchApiService
): Promise<string> {
  try {
    logger.info('Executing compare_models', { modelIds: args.model_ids });

    const models = await searchApiService.compareModels(args.model_ids);

    return formatComparisonForLLM(models);
  } catch (error) {
    logger.error('Error executing compare_models:', error);
    return ERROR_MESSAGES.compareError;
  }
}
