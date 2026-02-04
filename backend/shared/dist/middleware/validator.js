"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const zod_1 = require("zod");
const response_1 = require("../utils/response");
function validateBody(schema) {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                res.status(400).json((0, response_1.errorResponse)('VALIDATION_ERROR', messages.join(', ')));
                return;
            }
            next(error);
        }
    };
}
function validateQuery(schema) {
    return (req, res, next) => {
        try {
            req.query = schema.parse(req.query);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                res.status(400).json((0, response_1.errorResponse)('VALIDATION_ERROR', messages.join(', ')));
                return;
            }
            next(error);
        }
    };
}
function validateParams(schema) {
    return (req, res, next) => {
        try {
            req.params = schema.parse(req.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
                res.status(400).json((0, response_1.errorResponse)('VALIDATION_ERROR', messages.join(', ')));
                return;
            }
            next(error);
        }
    };
}
//# sourceMappingURL=validator.js.map