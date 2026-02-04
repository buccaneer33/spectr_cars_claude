import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Patterns for detecting prompt injection
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions?/i,
  /forget\s+(previous|everything|all)/i,
  /disregard\s+(previous|all)\s+instructions?/i,
  /you\s+are\s+now/i,
  /act\s+as/i,
  /pretend\s+(you|to\s+be)/i,
  /roleplay/i,
  /system\s*prompt/i,
  /your\s+instructions/i,
  /show\s+me\s+your\s+(prompt|instructions|rules)/i,
  /<\|im_start\|>/i,
  /<\|im_end\|>/i,
  /###\s*Instruction/i,
  /\[INST\]/i,
  /\[\/INST\]/i,
];

// Patterns for detecting profanity (basic list)
const PROFANITY_PATTERNS = [
  /\b(хуй|хуя|хер|пизд|ебал|еба[тл]|бля[тд]|сука|сучк|мудак|долбо[её]б|уёбк|уебк)\w*/gi,
  /\b(fuck|shit|bitch|asshole|cunt|dick)\w*/gi,
];

// Patterns for detecting SQL/NoSQL/JS injection
const CODE_INJECTION_PATTERNS = [
  /(\bSELECT\b.*\bFROM\b)|(\bDROP\b.*\bTABLE\b)|(\bINSERT\b.*\bINTO\b)/i,
  /(\$where|\$regex|\$gt|\$lt|\$ne)/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on(load|error|click|mouse)=/gi,
];

const MAX_MESSAGE_LENGTH = 2000;

export function sanitizeInput(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    next();
    return;
  }

  // 1. Check for prompt injection
  const hasInjection = INJECTION_PATTERNS.some((pattern) =>
    pattern.test(message)
  );

  if (hasInjection) {
    logger.warn(`Prompt injection attempt detected`, {
      messagePreview: message.substring(0, 50),
      sessionId: req.body.session_id,
    });

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content:
          'Я AI-консультант по подбору автомобилей. Могу помочь только с выбором машины. Какой автомобиль ты ищешь?',
      },
    });
    return;
  }

  // 2. Check for profanity
  const hasProfanity = PROFANITY_PATTERNS.some((pattern) =>
    pattern.test(message)
  );

  if (hasProfanity) {
    logger.warn(`Profanity detected`, {
      messagePreview: message.substring(0, 50),
      sessionId: req.body.session_id,
    });

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content:
          'Пожалуйста, давай общаться уважительно. Я здесь, чтобы помочь тебе выбрать автомобиль. Расскажи, какие у тебя требования к машине?',
      },
    });
    return;
  }

  // 3. Check for code injection
  const hasCodeInjection = CODE_INJECTION_PATTERNS.some((pattern) =>
    pattern.test(message)
  );

  if (hasCodeInjection) {
    logger.warn(`Code injection attempt detected`, {
      messagePreview: message.substring(0, 50),
      sessionId: req.body.session_id,
    });

    res.json({
      success: true,
      data: {
        role: 'assistant',
        content:
          'Обнаружена попытка выполнить код. Пожалуйста, задавай обычные вопросы о подборе автомобилей.',
      },
    });
    return;
  }

  // 4. Check message length
  if (message.length > MAX_MESSAGE_LENGTH) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MESSAGE_TOO_LONG',
        message: `Сообщение слишком длинное (максимум ${MAX_MESSAGE_LENGTH} символов)`,
      },
    });
    return;
  }

  // 5. Trim and normalize whitespace
  req.body.message = message.trim().replace(/\s+/g, ' ');

  next();
}
