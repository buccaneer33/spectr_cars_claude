"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const shared_1 = require("@cars/shared");
const sessions_routes_1 = __importDefault(require("./routes/sessions.routes"));
const messages_routes_1 = __importDefault(require("./routes/messages.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4003;
app.use(express_1.default.json());
app.use((0, cors_1.default)({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(shared_1.requestLogger);
app.use('/api/chat/sessions', sessions_routes_1.default);
app.use('/api/chat', messages_routes_1.default);
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'chat-service' });
});
app.use(shared_1.errorHandler);
app.listen(PORT, () => {
    console.log(`✅ Chat Service running on port ${PORT}`);
});
