"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const shared_1 = require("@cars/shared");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// POST /api/auth/register
router.post('/register', (0, shared_1.validateBody)(auth_validator_1.registerSchema), (req, res, next) => authController.register(req, res, next));
// POST /api/auth/login
router.post('/login', (0, shared_1.validateBody)(auth_validator_1.loginSchema), (req, res, next) => authController.login(req, res, next));
// POST /api/auth/logout
router.post('/logout', (req, res, next) => authController.logout(req, res, next));
// GET /api/auth/me
router.get('/me', shared_1.authMiddleware, (req, res, next) => authController.getMe(req, res, next));
exports.default = router;
