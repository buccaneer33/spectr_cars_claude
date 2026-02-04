import { Table, Tag, Button, message } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import type { CarComparison, CarModel } from '@/types/api';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ComparisonTableProps {
  data: CarComparison;
  className?: string;
}

const bodyTypeLabels: Record<string, string> = {
  sedan: 'Седан',
  hatchback: 'Хэтчбек',
  wagon: 'Универсал',
  suv: 'Внедорожник',
  crossover: 'Кроссовер',
  coupe: 'Купе',
  convertible: 'Кабриолет',
  minivan: 'Минивэн',
  pickup: 'Пикап',
  liftback: 'Лифтбэк',
};

const fuelTypeLabels: Record<string, string> = {
  petrol: 'Бензин',
  diesel: 'Дизель',
  hybrid: 'Гибрид',
  electric: 'Электро',
  gas: 'Газ',
  petrol_gas: 'Бензин/Газ',
};

export function ComparisonTable({ data, className }: ComparisonTableProps) {
  const handleSave = (model: CarModel) => {
    message.success(`${model.brand} ${model.model} добавлен в избранное`);
  };

  const columns = [
    {
      title: 'Модель',
      key: 'model',
      render: (_: unknown, record: CarModel) => (
        <div>
          <div className="font-semibold">
            {record.brand} {record.model}
          </div>
          <div className="text-gray-500 text-sm">{record.year} г.</div>
        </div>
      ),
    },
    {
      title: 'Цена',
      key: 'price',
      render: (_: unknown, record: CarModel) => (
        <span className="font-semibold text-green-600">
          {formatPrice(record.price)}
        </span>
      ),
    },
    {
      title: 'Кузов',
      key: 'bodyType',
      render: (_: unknown, record: CarModel) => (
        <Tag color="blue">
          {bodyTypeLabels[record.bodyType] || record.bodyType}
        </Tag>
      ),
    },
    {
      title: 'Топливо',
      key: 'fuelType',
      render: (_: unknown, record: CarModel) => (
        <Tag color="orange">
          {fuelTypeLabels[record.fuelType] || record.fuelType}
        </Tag>
      ),
    },
    {
      title: 'Расход',
      key: 'fuelConsumption',
      render: (_: unknown, record: CarModel) =>
        record.fuelConsumption ? `${record.fuelConsumption} л/100км` : '-',
    },
    {
      title: 'Стоимость/год',
      key: 'annualCost',
      render: (_: unknown, record: CarModel) => {
        const annualCost =
          (record.insuranceCostPerYearRub || 0) +
          (record.annualTaxCostRub || 0) +
          (record.maintenanceCostPerYearRub || 0);
        return annualCost > 0 ? formatPrice(annualCost) : '-';
      },
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: CarModel) => (
        <Button
          type="text"
          icon={<HeartOutlined />}
          onClick={() => handleSave(record)}
          aria-label={`Сохранить ${record.brand} ${record.model}`}
        />
      ),
    },
  ];

  return (
    <div className={cn('overflow-x-auto', className)}>
      <Table
        dataSource={data.models}
        columns={columns}
        rowKey="id"
        pagination={false}
        size="small"
        scroll={{ x: 600 }}
        bordered
      />
    </div>
  );
}
