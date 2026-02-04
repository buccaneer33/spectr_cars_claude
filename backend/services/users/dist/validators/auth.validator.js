"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    name: zod_1.z.string().min(1, 'Name is required'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    preferredBudgetMinRub: zod_1.z.number().positive().optional(),
    preferredBudgetMaxRub: zod_1.z.number().positive().optional(),
    preferredBodyTypeId: zod_1.z.string().optional(),
    preferredFuelTypeId: zod_1.z.string().optional(),
    cityId: zod_1.z.string().optional(),
});
