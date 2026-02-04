import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { logger } from './config/logger';
import { getRedisClient } from './config/redis';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import llmRoutes from './routes/llm.routes';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// Health check
app.get('/health', async (_req, res) => {
  try {
    // Check Redis connection
    const redis = await getRedisClient();
    await redis.ping();

    res.json({
      status: 'ok',
      service: 'llm-orchestrator',
      timestamp: new Date().toISOString(),
      provider: config.llm.provider,
      model: config.llm.model,
      redis: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      service: 'llm-orchestrator',
      error: 'Redis connection failed',
    });
  }
});

// Readiness check
app.get('/ready', async (_req, res) => {
  const checks = {
    redis: false,
    llm: !!config.llm.apiKey,
  };

  try {
    const redis = await getRedisClient();
    await redis.ping();
    checks.redis = true;
  } catch {
    // Redis not ready
  }

  const allReady = Object.values(checks).every(Boolean);

  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    checks,
  });
});

// Routes
app.use('/api/llm', llmRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function start(): Promise<void> {
  try {
    // Connect to Redis
    await getRedisClient();
    logger.info('Redis connection established');

    // Validate LLM API key
    if (!config.llm.apiKey) {
      logger.warn('LLM_API_KEY is not set! LLM features will not work.');
    }

    const port = config.port;
    app.listen(port, () => {
      logger.info(`LLM Orchestrator running on port ${port}`);
      logger.info(`Provider: ${config.llm.provider}`);
      logger.info(`Model: ${config.llm.model}`);
      logger.info(`Base URL: ${config.llm.baseUrl}`);
      logger.info(`Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();

export default app;
