"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const client_1 = require("@prisma/client");
const shared_1 = require("@cars/shared");
const llm_client_service_1 = require("./llm-client.service");
const prisma = new client_1.PrismaClient();
class ChatService {
    constructor() {
        this.llmClient = new llm_client_service_1.LLMClientService();
    }
    async createSession(userId, title) {
        return prisma.chatSession.create({
            data: {
                userId,
                title: title || 'Новый диалог',
                status: 'active',
            },
        });
    }
    async getSessions(userId) {
        return prisma.chatSession.findMany({
            where: { userId, status: { not: 'archived' } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getSession(sessionId, userId) {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                messages: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!session) {
            throw new shared_1.AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
        }
        return session;
    }
    async sendMessage(sessionId, userId, content) {
        const session = await prisma.chatSession.findFirst({
            where: { id: sessionId, userId },
        });
        if (!session) {
            throw new shared_1.AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
        }
        // Сохраняем сообщение пользователя
        const userMessage = await prisma.chatMessage.create({
            data: {
                chatSessionId: sessionId,
                role: 'user',
                content,
            },
        });
        // Получаем ответ от LLM Orchestrator
        const llmResponse = await this.llmClient.sendMessage(sessionId, content, session.contextSummary);
        // Сохраняем ответ ассистента
        const assistantMessage = await prisma.chatMessage.create({
            data: {
                chatSessionId: sessionId,
                role: 'assistant',
                content: llmResponse.message,
                metadata: llmResponse.metadata,
            },
        });
        return { userMessage, assistantMessage };
    }
}
exports.ChatService = ChatService;
