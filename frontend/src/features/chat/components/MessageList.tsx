import { useEffect, useRef } from 'react';
import { Empty, Spin } from 'antd';
import { Message } from './Message';
import { TypingIndicator } from './TypingIndicator';
import { useChatStore } from '@/stores/chat-store';
import { useChatMessages } from '../hooks/use-chat-messages';

interface MessageListProps {
  sessionId: string | undefined;
}

export function MessageList({ sessionId }: MessageListProps) {
  const { isLoading } = useChatMessages(sessionId);
  const { messages, isAssistantTyping } = useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAssistantTyping]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spin size="large" tip="Загрузка сообщений..." />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Empty
          description="Начните диалог с AI-консультантом"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto p-4 md:p-6"
      role="log"
      aria-label="История сообщений"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isAssistantTyping && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
