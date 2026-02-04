"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMClientService = void 0;
const axios_1 = __importDefault(require("axios"));
class LLMClientService {
    constructor() {
        this.baseUrl = process.env.LLM_ORCHESTRATOR_URL || 'http://localhost:8080';
    }
    async sendMessage(sessionId, message, context) {
        const response = await axios_1.default.post(`${this.baseUrl}/api/chat`, {
            sessionId,
            message,
            context,
        });
        return response.data;
    }
}
exports.LLMClientService = LLMClientService;
