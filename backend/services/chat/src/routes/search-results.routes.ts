import { Router } from 'express';
import { SearchResultsController } from '../controllers/search-results.controller';
import { authMiddleware } from '@cars/shared';

const router = Router();
const searchResultsController = new SearchResultsController();

router.get('/saved', authMiddleware, (req, res, next) =>
  searchResultsController.getSavedResults(req, res, next)
);
router.post('/:resultId/save', authMiddleware, (req, res, next) =>
  searchResultsController.saveResult(req, res, next)
);
router.delete('/:resultId', authMiddleware, (req, res, next) =>
  searchResultsController.deleteResult(req, res, next)
);

export default router;
