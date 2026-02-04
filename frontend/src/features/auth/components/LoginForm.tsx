import { useActionState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(6, 'Минимум 6 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginState {
  success: boolean;
  error?: string;
}

export function LoginForm() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function loginAction(
    _prevState: LoginState | null,
    _formData: FormData
  ): Promise<LoginState> {
    try {
      const values = getValues();
      const response = await authApi.login(values);
      login(response.user, response.token);
      navigate('/chat');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка входа',
      };
    }
  }

  const [state, formAction, isPending] = useActionState(loginAction, null);

  const onSubmit = handleSubmit(() => {
    const formData = new FormData();
    formAction(formData);
  });

  return (
    <Form layout="vertical" onFinish={onSubmit} className="w-full max-w-sm">
      {state?.error && (
        <Alert
          message={state.error}
          type="error"
          showIcon
          className="mb-4"
          closable
        />
      )}

      <Form.Item
        label="Email"
        validateStatus={errors.email ? 'error' : ''}
        help={errors.email?.message}
      >
        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<MailOutlined />}
              placeholder="email@example.com"
              size="large"
              disabled={isPending}
              autoComplete="email"
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Пароль"
        validateStatus={errors.password ? 'error' : ''}
        help={errors.password?.message}
      >
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              prefix={<LockOutlined />}
              placeholder="Введите пароль"
              size="large"
              disabled={isPending}
              autoComplete="current-password"
            />
          )}
        />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={isPending}
        >
          Войти
        </Button>
      </Form.Item>

      <div className="text-center">
        <span className="text-gray-500">Нет аккаунта? </span>
        <Link to="/register" className="text-primary-600">
          Зарегистрироваться
        </Link>
      </div>
    </Form>
  );
}
