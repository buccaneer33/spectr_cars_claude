import { Card, Typography } from 'antd';
import { Navigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { useAuthStore } from '@/stores/auth-store';

const { Title, Text } = Typography;

export function RegisterPage() {
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
            🚗 Регистрация
          </Title>
          <Text type="secondary">
            Создайте аккаунт для подбора автомобиля
          </Text>
        </div>

        <RegisterForm />
      </Card>
    </div>
  );
}
