"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFiltersSchema = void 0;
const zod_1 = require("zod");
exports.searchFiltersSchema = zod_1.z.object({
    budget_min: zod_1.z.string().transform(Number).optional(),
    budget_max: zod_1.z.string().transform(Number).optional(),
    brand: zod_1.z.string().optional(),
    body_type: zod_1.z.string().optional(),
    fuel_type: zod_1.z.string().optional(),
    year_min: zod_1.z.string().transform(Number).optional(),
    year_max: zod_1.z.string().transform(Number).optional(),
    limit: zod_1.z.string().transform(Number).default('20'),
    offset: zod_1.z.string().transform(Number).default('0'),
});
