"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const search_service_1 = require("../services/search.service");
const shared_1 = require("@cars/shared");
const searchService = new search_service_1.SearchService();
class SearchController {
    async searchCars(req, res, next) {
        try {
            const filters = req.query;
            const result = await searchService.searchCars(filters);
            res.status(200).json((0, shared_1.successResponse)(result));
        }
        catch (error) {
            next(error);
        }
    }
    async getBrands(req, res, next) {
        try {
            const brands = await searchService.getBrands();
            res.status(200).json((0, shared_1.successResponse)(brands));
        }
        catch (error) {
            next(error);
        }
    }
    async getBodyTypes(req, res, next) {
        try {
            const bodyTypes = await searchService.getBodyTypes();
            res.status(200).json((0, shared_1.successResponse)(bodyTypes));
        }
        catch (error) {
            next(error);
        }
    }
    async getFuelTypes(req, res, next) {
        try {
            const fuelTypes = await searchService.getFuelTypes();
            res.status(200).json((0, shared_1.successResponse)(fuelTypes));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SearchController = SearchController;
