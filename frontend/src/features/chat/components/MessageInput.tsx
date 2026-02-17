import { useState, useCallback, type KeyboardEvent } from 'react';
import { Input, Button, Space } from 'antd';
import { SendOutlined, ClearOutlined } from '@ant-design/icons';
import { useSendMessage } from '../hooks/use-send-message';
import { useChatStore } from '@/stores/chat-store';

const { TextArea } = Input;

interface MessageInputProps {
  sessionId: string | undefined;
}

export function MessageInput({ sessionId }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, isLoading } = useSendMessage(sessionId);
  const { isAssistantTyping, clearMessages } = useChatStore();

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading || isAssistantTyping) return;

    sendMessage(`${inputValue}`);
    setInputValue('');
  }, [inputValue, isLoading, isAssistantTyping, sendMessage]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    clearMessages();
  };

  const isDisabled = isLoading || isAssistantTyping || !sessionId;

  return (
    <div className="max-w-4xl mx-auto w-full">
      <Space.Compact className="w-full" size="large">
        <TextArea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isAssistantTyping
              ? 'Ассистент печатает...'
              : 'Напишите сообщение... (Enter для отправки)'
          }
          disabled={isDisabled}
          autoSize={{ minRows: 1, maxRows: 4 }}
          className="flex-1"
          aria-label="Поле ввода сообщения"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={isLoading}
          disabled={!inputValue.trim() || isDisabled}
          aria-label="Отправить сообщение"
        >
          <span className="hidden md:inline">Отправить</span>
        </Button>
        <Button
          icon={<ClearOutlined />}
          onClick={handleClear}
          disabled={isDisabled}
          title="Очистить историю"
          aria-label="Очистить историю чата"
        />
      </Space.Compact>

      <div className="text-xs text-gray-400 mt-2 text-center">
        Shift+Enter для переноса строки
      </div>
    </div>
  );
}
