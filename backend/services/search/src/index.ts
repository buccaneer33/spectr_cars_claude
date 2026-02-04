import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, requestLogger } from '@cars/shared';
import searchRoutes from './routes/search.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(requestLogger);

app.use('/api/search', searchRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'search-service' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Search Service running on port ${PORT}`);
});
