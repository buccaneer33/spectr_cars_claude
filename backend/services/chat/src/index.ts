import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler, requestLogger } from '@cars/shared';
import sessionsRoutes from './routes/sessions.routes';
import messagesRoutes from './routes/messages.routes';
import searchResultsRoutes from './routes/search-results.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4003;

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(requestLogger);

app.use('/api/chat/sessions', sessionsRoutes);
app.use('/api/chat/sessions', messagesRoutes);
app.use('/api/chat/search-results', searchResultsRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'chat-service' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Chat Service running on port ${PORT}`);
});
