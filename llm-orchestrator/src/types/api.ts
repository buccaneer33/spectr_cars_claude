// API Response types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// Car types (matching backend/shared)

export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  bodyType: BodyType;
  fuelType: FuelType;
  transmission?: Transmission;
  driveType?: DriveType;
  engineVolumeL?: number;
  horsepower?: number;
  fuelConsumption?: number;
  insuranceCostPerYearRub?: number;
  annualTaxCostRub?: number;
  maintenanceCostPerYearRub?: number;
}

export type BodyType =
  | 'sedan'
  | 'hatchback'
  | 'wagon'
  | 'suv'
  | 'crossover'
  | 'coupe'
  | 'convertible'
  | 'minivan'
  | 'pickup'
  | 'liftback';

export type FuelType =
  | 'petrol'
  | 'diesel'
  | 'hybrid'
  | 'electric'
  | 'gas'
  | 'petrol_gas';

export type Transmission =
  | 'automatic'
  | 'manual'
  | 'robot'
  | 'variator';

export type DriveType =
  | 'fwd'
  | 'rwd'
  | 'awd'
  | '4wd';

// Search types

export interface SearchFilters {
  budgetMin?: number;
  budgetMax?: number;
  bodyType?: BodyType;
  fuelType?: FuelType;
  brand?: string;
  yearMin?: number;
  yearMax?: number;
  transmission?: Transmission;
  driveType?: DriveType;
}

export interface SearchResult {
  total: number;
  models: CarModel[];
  page?: number;
  limit?: number;
}

// User types

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  preferredBudgetMinRub?: number;
  preferredBudgetMaxRub?: number;
  preferredBodyType?: BodyType;
  preferredFuelType?: FuelType;
  city?: string;
}

// Chat types

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  id: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedSearchResult {
  id: string;
  sessionId: string;
  summary: string;
  modelIds: string[];
  createdAt: Date;
}
