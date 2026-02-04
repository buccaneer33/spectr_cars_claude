"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsController = void 0;
const chat_service_1 = require("../services/chat.service");
const shared_1 = require("@cars/shared");
const chatService = new chat_service_1.ChatService();
class SessionsController {
    async createSession(req, res, next) {
        try {
            const userId = req.user?.userId || null;
            const { title } = req.body;
            const session = await chatService.createSession(userId, title);
            res.status(201).json((0, shared_1.successResponse)(session));
        }
        catch (error) {
            next(error);
        }
    }
    async getSessions(req, res, next) {
        try {
            const userId = req.user.userId;
            const sessions = await chatService.getSessions(userId);
            res.status(200).json((0, shared_1.successResponse)(sessions));
        }
        catch (error) {
            next(error);
        }
    }
    async getSession(req, res, next) {
        try {
            const userId = req.user.userId;
            const { sessionId } = req.params;
            const session = await chatService.getSession(sessionId, userId);
            res.status(200).json((0, shared_1.successResponse)(session));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.SessionsController = SessionsController;
