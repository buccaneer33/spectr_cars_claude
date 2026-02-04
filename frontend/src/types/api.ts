// Base API response format
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Chat types
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  finishedAt?: string;
}

export interface ChatMessage {
  id: string;
  sessionId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    isTyping?: boolean;
    comparisonTable?: CarComparison;
    toolCalls?: ToolCall[];
  };
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  role: 'assistant';
  content: string;
  toolCalls?: ToolCall[];
}

// Car & Search types
export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  bodyType: string;
  transmission?: string;
  driveType?: string;
  engineVolumeL?: number;
  horsepower?: number;
  fuelConsumption?: number;
  insuranceCostPerYearRub?: number;
  annualTaxCostRub?: number;
  maintenanceCostPerYearRub?: number;
}

export interface CarComparison {
  models: CarModel[];
  criteria?: string[];
}

export interface SearchResult {
  id: string;
  sessionId: string;
  searchQuerySummary: string;
  resultData: CarComparison;
  isSaved: boolean;
  createdAt: string;
}

// Profile types
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  preferredBudgetMinRub?: number;
  preferredBudgetMaxRub?: number;
  preferredBodyType?: string;
  preferredFuelType?: string;
  city?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
  preferredBudgetMinRub?: number;
  preferredBudgetMaxRub?: number;
  preferredBodyType?: string;
  preferredFuelType?: string;
  city?: string;
}
