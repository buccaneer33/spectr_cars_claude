"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.optionalAuth = optionalAuth;
exports.adminOnly = adminOnly;
const jwt_1 = require("../utils/jwt");
const response_1 = require("../utils/response");
function authMiddleware(req, res, next) {
    try {
        // Получаем токен из cookie или Authorization header
        const token = req.cookies?.token ||
            req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json((0, response_1.errorResponse)('UNAUTHORIZED', 'Token not provided'));
            return;
        }
        // Проверяем токен
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json((0, response_1.errorResponse)('UNAUTHORIZED', 'Invalid token'));
    }
}
function optionalAuth(req, res, next) {
    try {
        const token = req.cookies?.token ||
            req.headers.authorization?.replace('Bearer ', '');
        if (token) {
            const payload = (0, jwt_1.verifyToken)(token);
            req.user = payload;
        }
        next();
    }
    catch (error) {
        // Игнорируем ошибки - auth опциональный
        next();
    }
}
function adminOnly(req, res, next) {
    if (!req.user) {
        res.status(401).json((0, response_1.errorResponse)('UNAUTHORIZED', 'Not authenticated'));
        return;
    }
    if (req.user.role !== 'ADMIN') {
        res.status(403).json((0, response_1.errorResponse)('FORBIDDEN', 'Admin access required'));
        return;
    }
    next();
}
