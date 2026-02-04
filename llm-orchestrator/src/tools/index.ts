import { ChatCompletionTool } from 'openai/resources/chat/completions';
import { searchCarsTool, executeSearchCars, SearchCarsArgs } from './search-cars.tool';
import { compareModelsTool, executeCompareModels, CompareModelsArgs } from './compare-models.tool';
import { getUserPreferencesTool, executeGetUserPreferences, GetUserPreferencesArgs } from './get-preferences.tool';
import { saveSearchResultTool, executeSaveSearchResult, SaveSearchResultArgs } from './save-result.tool';

export const ALL_TOOLS: ChatCompletionTool[] = [
  searchCarsTool,
  compareModelsTool,
  getUserPreferencesTool,
  saveSearchResultTool,
];

export type ToolArgs =
  | SearchCarsArgs
  | CompareModelsArgs
  | GetUserPreferencesArgs
  | SaveSearchResultArgs;

export const TOOL_EXECUTORS = {
  search_cars: executeSearchCars,
  compare_models: executeCompareModels,
  get_user_preferences: executeGetUserPreferences,
  save_search_result: executeSaveSearchResult,
} as const;

export type ToolName = keyof typeof TOOL_EXECUTORS;

export {
  searchCarsTool,
  executeSearchCars,
  compareModelsTool,
  executeCompareModels,
  getUserPreferencesTool,
  executeGetUserPreferences,
  saveSearchResultTool,
  executeSaveSearchResult,
};
