import { useActionState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Минимум 2 символа'),
    email: z.string().email('Неверный формат email'),
    password: z.string().min(6, 'Минимум 6 символов'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterState {
  success: boolean;
  error?: string;
}

export function RegisterForm() {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function registerAction(
    _prevState: RegisterState | null,
    _formData: FormData
  ): Promise<RegisterState> {
    try {
      const { confirmPassword, ...values } = getValues();
      const response = await authApi.register(values);
      login(response.user, response.token);
      navigate('/chat');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка регистрации',
      };
    }
  }

  const [state, formAction, isPending] = useActionState(registerAction, null);

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
        label="Имя"
        validateStatus={errors.name ? 'error' : ''}
        help={errors.name?.message}
      >
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              prefix={<UserOutlined />}
              placeholder="Ваше имя"
              size="large"
              disabled={isPending}
              autoComplete="name"
            />
          )}
        />
      </Form.Item>

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
              placeholder="Минимум 6 символов"
              size="large"
              disabled={isPending}
              autoComplete="new-password"
            />
          )}
        />
      </Form.Item>

      <Form.Item
        label="Подтвердите пароль"
        validateStatus={errors.confirmPassword ? 'error' : ''}
        help={errors.confirmPassword?.message}
      >
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <Input.Password
              {...field}
              prefix={<LockOutlined />}
              placeholder="Повторите пароль"
              size="large"
              disabled={isPending}
              autoComplete="new-password"
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
          Зарегистрироваться
        </Button>
      </Form.Item>

      <div className="text-center">
        <span className="text-gray-500">Уже есть аккаунт? </span>
        <Link to="/login" className="text-primary-600">
          Войти
        </Link>
      </div>
    </Form>
  );
}
