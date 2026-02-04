import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/search.service';
import { successResponse } from '@cars/shared';

const searchService = new SearchService();

export class SearchController {
  async searchCars(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query;
      const result = await searchService.searchCars(filters);
      res.status(200).json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getBrands(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await searchService.getBrands();
      res.status(200).json(successResponse(brands));
    } catch (error) {
      next(error);
    }
  }

  async getBodyTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bodyTypes = await searchService.getBodyTypes();
      res.status(200).json(successResponse(bodyTypes));
    } catch (error) {
      next(error);
    }
  }

  async getFuelTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fuelTypes = await searchService.getFuelTypes();
      res.status(200).json(successResponse(fuelTypes));
    } catch (error) {
      next(error);
    }
  }
}
