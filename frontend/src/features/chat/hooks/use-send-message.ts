import { useOptimistic, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/stores/chat-store';
import { generateId } from '@/lib/utils';
import type { ChatMessage, SendMessageRequest } from '@/types/api';

export function useSendMessage(sessionId: string | undefined) {
  const queryClient = useQueryClient();
  const { messages, addMessage, setIsAssistantTyping, removeMessage } = useChatStore();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: ChatMessage[], newMessage: ChatMessage) => [...state, newMessage]
  );

  const mutation = useMutation({
    mutationFn: (data: SendMessageRequest) => {
      if (!sessionId) throw new Error('No session');
      return chatApi.sendMessage(sessionId, data);
    },

    onMutate: async (variables) => {
      // Optimistically add user message
      const optimisticUserMessage: ChatMessage = {
        id: `temp-${generateId()}`,
        role: 'user',
        content: variables.content,
        createdAt: new Date().toISOString(),
      };

      addOptimisticMessage(optimisticUserMessage);
      addMessage(optimisticUserMessage);
      setIsAssistantTyping(true);

      return { optimisticUserMessage };
    },

    onSuccess: (response) => {
      setIsAssistantTyping(false);

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.content,
        createdAt: new Date().toISOString(),
        metadata: {
          toolCalls: response.toolCalls,
        },
      };

      addMessage(assistantMessage);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    },

    onError: (_error, _variables, context) => {
      setIsAssistantTyping(false);

      // Remove optimistic message on error
      if (context?.optimisticUserMessage) {
        removeMessage(context.optimisticUserMessage.id);
      }
    },
  });

  const { mutate, isPending } = mutation;

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim() || !sessionId) return;
      mutate({ content: content.trim() });
    },
    [sessionId, mutate]
  );

  return {
    sendMessage,
    optimisticMessages,
    isLoading: isPending,
    error: mutation.error,
  };
}
