"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const profile_controller_1 = require("../controllers/profile.controller");
const shared_1 = require("@cars/shared");
const auth_validator_1 = require("../validators/auth.validator");
const router = (0, express_1.Router)();
const profileController = new profile_controller_1.ProfileController();
// GET /api/users/profile
router.get('/profile', shared_1.authMiddleware, (req, res, next) => profileController.getProfile(req, res, next));
// PUT /api/users/profile
router.put('/profile', shared_1.authMiddleware, (0, shared_1.validateBody)(auth_validator_1.updateProfileSchema), (req, res, next) => profileController.updateProfile(req, res, next));
exports.default = router;
