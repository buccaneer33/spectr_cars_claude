import { Card, Avatar, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { ChatMessage } from '@/types/api';
import { ComparisonTable } from './ComparisonTable';
import { cn } from '@/lib/utils';

const { Text } = Typography;

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 mb-4 animate-fade-in',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
      role="article"
      aria-label={`${isUser ? 'Ваше' : 'Ассистент'} сообщение`}
    >
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={cn(
          'flex-shrink-0',
          isUser ? 'bg-blue-500' : 'bg-green-500'
        )}
        size={40}
      />

      <Card
        className={cn(
          'max-w-[75%]',
          isUser ? 'message-user' : 'message-assistant'
        )}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div className="whitespace-pre-wrap break-words">
          {message.content}
        </div>

        {message.metadata?.comparisonTable && (
          <ComparisonTable
            data={message.metadata.comparisonTable}
            className="mt-4"
          />
        )}

        <Text type="secondary" className="text-xs mt-2 block">
          {new Date(message.createdAt).toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </Card>
    </div>
  );
}
