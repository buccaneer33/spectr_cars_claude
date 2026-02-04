import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { validateQuery } from '@cars/shared';
import { searchFiltersSchema } from '../validators/search.validator';

const router = Router();
const searchController = new SearchController();

router.get('/cars', validateQuery(searchFiltersSchema), (req, res, next) =>
  searchController.searchCars(req, res, next)
);
router.get('/brands', (req, res, next) => searchController.getBrands(req, res, next));
router.get('/body-types', (req, res, next) => searchController.getBodyTypes(req, res, next));
router.get('/fuel-types', (req, res, next) => searchController.getFuelTypes(req, res, next));

export default router;
