import { Avatar } from 'antd';
import { RobotOutlined } from '@ant-design/icons';

export function TypingIndicator() {
  return (
    <div
      className="flex gap-3 mb-4 animate-fade-in"
      role="status"
      aria-label="Ассистент печатает"
    >
      <Avatar
        icon={<RobotOutlined />}
        className="bg-green-500 flex-shrink-0"
        size={40}
      />

      <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-1">
        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
        <span className="typing-dot w-2 h-2 bg-gray-400 rounded-full" />
      </div>
    </div>
  );
}
