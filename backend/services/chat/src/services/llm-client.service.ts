import axios from 'axios';

export class LLMClientService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.LLM_ORCHESTRATOR_URL || 'http://llm-orchestrator:8080';
  }

  async sendMessage(sessionId: string, userId: string | null, message: string) {
    const response = await axios.post(`${this.baseUrl}/api/llm/process`, {
      session_id: sessionId,
      user_id: userId || undefined,
      message,
    });
    console.log('llm response: ', response.data);
    return response.data;
  }
}
