import { Form, Input, Button, Select, InputNumber, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api';
import type { UpdateProfileRequest } from '@/types/api';

const bodyTypeOptions = [
  { value: 'sedan', label: 'Седан' },
  { value: 'hatchback', label: 'Хэтчбек' },
  { value: 'wagon', label: 'Универсал' },
  { value: 'suv', label: 'Внедорожник' },
  { value: 'crossover', label: 'Кроссовер' },
  { value: 'coupe', label: 'Купе' },
  { value: 'minivan', label: 'Минивэн' },
  { value: 'pickup', label: 'Пикап' },
];

const fuelTypeOptions = [
  { value: 'petrol', label: 'Бензин' },
  { value: 'diesel', label: 'Дизель' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'electric', label: 'Электро' },
  { value: 'gas', label: 'Газ' },
];

export function ProfileForm() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => {
      message.success('Профиль сохранён');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Ошибка сохранения');
    },
  });

  const handleSubmit = (values: UpdateProfileRequest) => {
    updateMutation.mutate(values);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  const profile = profileQuery.data;

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={profile}
      onFinish={handleSubmit}
      className="max-w-lg"
    >
      <Form.Item
        name="name"
        label="Имя"
        rules={[{ required: true, message: 'Введите имя' }]}
      >
        <Input placeholder="Ваше имя" />
      </Form.Item>

      <div className="grid grid-cols-2 gap-4">
        <Form.Item
          name="preferredBudgetMinRub"
          label="Минимальный бюджет"
        >
          <InputNumber<number>
            placeholder="от"
            className="w-full"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
            }
            parser={(value) => Number(value!.replace(/\s/g, ''))}
            min={0}
            addonAfter="₽"
          />
        </Form.Item>

        <Form.Item
          name="preferredBudgetMaxRub"
          label="Максимальный бюджет"
        >
          <InputNumber<number>
            placeholder="до"
            className="w-full"
            formatter={(value) =>
              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
            }
            parser={(value) => Number(value!.replace(/\s/g, ''))}
            min={0}
            addonAfter="₽"
          />
        </Form.Item>
      </div>

      <Form.Item name="preferredBodyType" label="Предпочитаемый кузов">
        <Select
          placeholder="Выберите тип кузова"
          options={bodyTypeOptions}
          allowClear
        />
      </Form.Item>

      <Form.Item name="preferredFuelType" label="Предпочитаемое топливо">
        <Select
          placeholder="Выберите тип топлива"
          options={fuelTypeOptions}
          allowClear
        />
      </Form.Item>

      <Form.Item name="city" label="Город">
        <Input placeholder="Ваш город" />
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={updateMutation.isPending}
        >
          Сохранить
        </Button>
      </Form.Item>
    </Form>
  );
}
