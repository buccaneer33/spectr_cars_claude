"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessagesController = void 0;
const chat_service_1 = require("../services/chat.service");
const shared_1 = require("@cars/shared");
const chatService = new chat_service_1.ChatService();
class MessagesController {
    async sendMessage(req, res, next) {
        try {
            const userId = req.user?.userId || 'anonymous';
            const { sessionId } = req.params;
            const { content } = req.body;
            const result = await chatService.sendMessage(sessionId, userId, content);
            res.status(201).json((0, shared_1.successResponse)(result));
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MessagesController = MessagesController;
