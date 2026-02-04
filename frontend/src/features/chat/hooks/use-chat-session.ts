import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/stores/chat-store';

export function useChatSession() {
  const queryClient = useQueryClient();
  const { currentSession, setCurrentSession, setMessages, reset } = useChatStore();

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: chatApi.createSession,
    onSuccess: (session) => {
      setCurrentSession(session);
      setMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  // Get sessions list
  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions,
    staleTime: 30 * 1000,
  });

  // Auto-create session if none exists
  useEffect(() => {
    if (!currentSession && !createSessionMutation.isPending && sessionsQuery.isSuccess) {
      const activeSessions = sessionsQuery.data?.filter((s) => s.status === 'active');
      if (activeSessions && activeSessions.length > 0) {
        // Use most recent active session
        setCurrentSession(activeSessions[0]);
      } else {
        // Create new session
        createSessionMutation.mutate();
      }
    }
  }, [currentSession, sessionsQuery.isSuccess, sessionsQuery.data]);

  const createNewSession = () => {
    reset();
    createSessionMutation.mutate();
  };

  return {
    session: currentSession,
    sessions: sessionsQuery.data || [],
    isLoading: createSessionMutation.isPending || sessionsQuery.isLoading,
    error: createSessionMutation.error || sessionsQuery.error,
    createNewSession,
  };
}
