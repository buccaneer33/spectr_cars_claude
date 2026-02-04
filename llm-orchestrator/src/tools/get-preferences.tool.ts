import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { formatUserPreferences, ERROR_MESSAGES } from '../prompts/templates';
import { UserApiService } from '../services/user-api.service';
import { logger } from '../config/logger';

export const getUserPreferencesTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_user_preferences',
    description:
      'Получить сохранённые предпочтения пользователя (бюджет, тип кузова, тип топлива). Используй в начале диалога для персонализации.',
    parameters: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'ID пользователя',
        },
      },
      required: ['user_id'],
    },
  },
};

export interface GetUserPreferencesArgs {
  user_id: string;
}

export async function executeGetUserPreferences(
  args: GetUserPreferencesArgs,
  userApiService: UserApiService
): Promise<string> {
  try {
    logger.info('Executing get_user_preferences', { userId: args.user_id });

    const profile = await userApiService.getUserProfile(args.user_id);

    return formatUserPreferences(profile);
  } catch (error) {
    logger.error('Error executing get_user_preferences:', error);
    return ERROR_MESSAGES.preferencesError;
  }
}
