import { Card, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { useAuthStore } from '@/stores/auth-store';

const { Title, Text } = Typography;

export function LoginPage() {
  const { user, isLoading } = useAuthStore();

  // Redirect if already logged in
  if (!isLoading && user) {
    return <Navigate to="/chat" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="mb-2">
            🚗 AI Car Consultant
          </Title>
          <Text type="secondary">
            Войдите, чтобы начать подбор автомобиля
          </Text>
        </div>

        <LoginForm />
      </Card>
    </div>
  );
}
