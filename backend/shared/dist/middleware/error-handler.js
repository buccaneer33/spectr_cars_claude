"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const response_1 = require("../utils/response");
class AppError extends Error {
    constructor(statusCode, code, message) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
    if (err instanceof AppError) {
        res.status(err.statusCode).json((0, response_1.errorResponse)(err.code, err.message));
        return;
    }
    // Prisma errors
    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(400).json((0, response_1.errorResponse)('DATABASE_ERROR', 'Database operation failed'));
        return;
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(401).json((0, response_1.errorResponse)('UNAUTHORIZED', 'Invalid or expired token'));
        return;
    }
    // Validation errors
    if (err.name === 'ZodError') {
        res.status(400).json((0, response_1.errorResponse)('VALIDATION_ERROR', err.message));
        return;
    }
    // Default error
    res.status(500).json((0, response_1.errorResponse)('INTERNAL_ERROR', 'Internal server error'));
}
//# sourceMappingURL=error-handler.js.map