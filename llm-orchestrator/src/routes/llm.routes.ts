import { Router } from 'express';
import { LLMController } from '../controllers/llm.controller';
import { sanitizeInput } from '../middleware/sanitizer';
import { rateLimiter } from '../middleware/rate-limiter';
import { validate, processMessageSchema, clearContextSchema } from '../middleware/validator';

const router = Router();
const llmController = new LLMController();

/**
 * POST /api/llm/process
 * Process a user message through the LLM
 *
 * Body:
 * - session_id: UUID - Chat session ID
 * - user_id?: UUID - Optional user ID for personalization
 * - message: string - User message
 *
 * Response:
 * - role: 'assistant'
 * - content: string - AI response
 * - toolCalls?: array - List of tools that were called
 */
router.post(
  '/process',
  rateLimiter,
  validate(processMessageSchema),
  sanitizeInput,
  llmController.processMessage
);

/**
 * DELETE /api/llm/context/:session_id
 * Clear the conversation context for a session
 *
 * Params:
 * - session_id: UUID - Chat session ID
 */
router.delete(
  '/context/:session_id',
  validate(clearContextSchema),
  llmController.clearContext
);

/**
 * GET /api/llm/welcome
 * Get the welcome message for new conversations
 */
router.get('/welcome', llmController.getWelcomeMessage);

/**
 * GET /api/llm/context/:session_id/length
 * Get the number of messages in the context
 */
router.get(
  '/context/:session_id/length',
  validate(clearContextSchema),
  llmController.getContextLength
);

export default router;
