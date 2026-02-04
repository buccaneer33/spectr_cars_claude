import { PrismaClient } from '@prisma/client';
import { AppError } from '@cars/shared';
import { LLMClientService } from './llm-client.service';

const prisma = new PrismaClient();

export class ChatService {
  private llmClient = new LLMClientService();

  async createSession(userId: string | null, title?: string) {
    return prisma.chatSession.create({
      data: {
        userId,
        title: title || 'Новый диалог',
        status: 'active',
      },
    });
  }

  async getSessions(userId: string) {
    return prisma.chatSession.findMany({
      where: { userId, status: { not: 'archived' } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
    }

    return session;
  }

  async getMessages(sessionId: string, userId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
    }

    return prisma.chatMessage.findMany({
      where: { chatSessionId: sessionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });
  }

  async clearMessages(sessionId: string, userId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
    }

    await prisma.chatMessage.deleteMany({
      where: { chatSessionId: sessionId },
    });
  }

  async saveSearchResult(resultId: string, userId: string) {
    const result = await prisma.searchResult.findFirst({
      where: { id: resultId, userId },
    });

    if (!result) {
      throw new AppError(404, 'RESULT_NOT_FOUND', 'Search result not found');
    }

    return prisma.searchResult.update({
      where: { id: resultId },
      data: { isSaved: true },
    });
  }

  async getSavedResults(userId: string) {
    return prisma.searchResult.findMany({
      where: { userId, isSaved: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteSearchResult(resultId: string, userId: string) {
    const result = await prisma.searchResult.findFirst({
      where: { id: resultId, userId },
    });

    if (!result) {
      throw new AppError(404, 'RESULT_NOT_FOUND', 'Search result not found');
    }

    await prisma.searchResult.delete({
      where: { id: resultId },
    });
  }

  async sendMessage(sessionId: string, userId: string, content: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new AppError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
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
    let assistantContent = 'Извините, произошла ошибка при обработке запроса. Попробуйте позже.';
    let assistantMetadata: any = undefined;

    try {
      const llmResponse = await this.llmClient.sendMessage(
        sessionId,
        userId,
        content
      );

      // LLM Orchestrator возвращает { success, data: { role, content, toolCalls? } }
      const llmData = llmResponse.data;
      assistantContent = llmData.content;
      assistantMetadata = llmData.toolCalls ? { toolCalls: llmData.toolCalls } : undefined;
    } catch (error: any) {
      // Если LLM Orchestrator вернул ошибку с JSON body, извлекаем сообщение
      if (error?.response?.data?.error?.message) {
        assistantContent = error.response.data.error.message;
      }
    }

    // Сохраняем ответ ассистента
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        chatSessionId: sessionId,
        role: 'assistant',
        content: assistantContent,
        metadata: assistantMetadata,
      },
    });

    return { userMessage, assistantMessage };
  }
}
