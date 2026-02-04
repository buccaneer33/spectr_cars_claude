import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface SearchFilters {
  budgetMin?: number;
  budgetMax?: number;
  bodyType?: string;
  fuelType?: string;
  brand?: string;
  yearMin?: number;
  yearMax?: number;
  transmission?: string;
  driveType?: string;
  limit?: number;
}

export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  bodyType: string;
  fuelType: string;
  fuelConsumption?: number;
  engineVolumeL?: number;
  horsepower?: number;
  transmission?: string;
  driveType?: string;
  insuranceCostPerYearRub?: number;
  annualTaxCostRub?: number;
  maintenanceCostPerYearRub?: number;
}

export interface SearchResult {
  total: number;
  models: CarModel[];
}

export class SearchApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.services.search,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        logger.error('Search API error:', {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        throw error;
      }
    );
  }

  async searchCars(filters: SearchFilters): Promise<SearchResult> {
    try {
      const response = await this.client.post('/api/search/cars', {
        filters: {
          budget_min: filters.budgetMin,
          budget_max: filters.budgetMax,
          body_type: filters.bodyType,
          fuel_type: filters.fuelType,
          brand: filters.brand,
          year_min: filters.yearMin,
          year_max: filters.yearMax,
          transmission: filters.transmission,
          drive_type: filters.driveType,
        },
        limit: filters.limit || 10,
      });

      return response.data.data || { total: 0, models: [] };
    } catch (error) {
      logger.error('Error calling Search API:', error);
      throw error;
    }
  }

  async compareModels(modelIds: string[]): Promise<CarModel[]> {
    try {
      const response = await this.client.post('/api/search/compare', {
        model_ids: modelIds,
      });

      return response.data.data || [];
    } catch (error) {
      logger.error('Error calling Compare API:', error);
      throw error;
    }
  }

  async getCarById(id: string): Promise<CarModel | null> {
    try {
      const response = await this.client.get(`/api/search/cars/${id}`);
      return response.data.data || null;
    } catch (error) {
      logger.error('Error getting car by ID:', error);
      return null;
    }
  }
}
