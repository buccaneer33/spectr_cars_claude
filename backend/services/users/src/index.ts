import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, requestLogger } from '@cars/shared';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', profileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

// Error handler (должен быть последним)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ User Service running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log(`   Database: ${process.env.DATABASE_URL?.split('@')[1]}`);
});
