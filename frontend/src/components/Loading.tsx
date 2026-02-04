import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = 'default',
  tip = 'Загрузка...',
  fullScreen = false,
}: LoadingProps) {
  const content = (
    <Spin
      indicator={<LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />}
      tip={tip}
      size={size}
    />
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}
