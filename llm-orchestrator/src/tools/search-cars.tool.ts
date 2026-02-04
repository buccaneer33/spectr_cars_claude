import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { formatSearchResultsForLLM, ERROR_MESSAGES } from '../prompts/templates';
import { SearchApiService } from '../services/search-api.service';
import { logger } from '../config/logger';

export const searchCarsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_cars',
    description:
      'Поиск автомобилей по заданным критериям в каталоге. Возвращает список подходящих моделей с характеристиками.',
    parameters: {
      type: 'object',
      properties: {
        budget_min: {
          type: 'number',
          description: 'Минимальный бюджет в рублях',
        },
        budget_max: {
          type: 'number',
          description: 'Максимальный бюджет в рублях',
        },
        body_type: {
          type: 'string',
          enum: [
            'sedan',
            'hatchback',
            'wagon',
            'suv',
            'crossover',
            'coupe',
            'convertible',
            'minivan',
            'pickup',
            'liftback',
          ],
          description: 'Тип кузова автомобиля',
        },
        fuel_type: {
          type: 'string',
          enum: ['petrol', 'diesel', 'hybrid', 'electric', 'gas', 'petrol_gas'],
          description: 'Тип топлива',
        },
        brand: {
          type: 'string',
          description: 'Бренд автомобиля (например: Toyota, BMW, Volkswagen)',
        },
        year_min: {
          type: 'number',
          description: 'Минимальный год выпуска',
        },
        year_max: {
          type: 'number',
          description: 'Максимальный год выпуска',
        },
        transmission: {
          type: 'string',
          enum: ['automatic', 'manual', 'robot', 'variator'],
          description: 'Тип коробки передач',
        },
        drive_type: {
          type: 'string',
          enum: ['fwd', 'rwd', 'awd', '4wd'],
          description: 'Тип привода (передний, задний, полный)',
        },
        limit: {
          type: 'number',
          description: 'Максимальное количество результатов (по умолчанию 10)',
        },
      },
      required: [],
    },
  },
};

export interface SearchCarsArgs {
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

export async function executeSearchCars(
  args: SearchCarsArgs,
  searchApiService: SearchApiService
): Promise<string> {
  try {
    logger.info('Executing search_cars', { args });

    const result = await searchApiService.searchCars({
      budgetMin: args.budget_min,
      budgetMax: args.budget_max,
      bodyType: args.body_type,
      fuelType: args.fuel_type,
      brand: args.brand,
      yearMin: args.year_min,
      yearMax: args.year_max,
      transmission: args.transmission,
      driveType: args.drive_type,
      limit: args.limit || 10,
    });

    return formatSearchResultsForLLM(result);
  } catch (error) {
    logger.error('Error executing search_cars:', error);
    return ERROR_MESSAGES.searchError;
  }
}
