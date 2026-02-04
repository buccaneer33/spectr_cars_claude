import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi, llmApi } from '@/lib/api';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage } from '@/types/api';

export function useChatMessages(sessionId: string | undefined) {
  const { messages, setMessages } = useChatStore();

  // Fetch existing messages
  const messagesQuery = useQuery({
    queryKey: ['chat-messages', sessionId],
    queryFn: () => (sessionId ? chatApi.getMessages(sessionId) : Promise.resolve([])),
    enabled: !!sessionId,
    staleTime: 0,
  });

  // Fetch welcome message
  const welcomeQuery = useQuery({
    queryKey: ['welcome-message'],
    queryFn: llmApi.getWelcome,
    staleTime: Infinity,
  });

  // Sync messages from server
  useEffect(() => {
    if (messagesQuery.data) {
      if (messagesQuery.data.length > 0) {
        setMessages(messagesQuery.data);
      } else if (welcomeQuery.data) {
        // Show welcome message for new sessions
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          role: 'assistant',
          content: welcomeQuery.data.content,
          createdAt: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    }
  }, [messagesQuery.data, welcomeQuery.data, setMessages]);

  return {
    messages,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
  };
}
