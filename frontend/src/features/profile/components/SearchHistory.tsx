import { Table, Empty, Spin, Button, Tag } from 'antd';
import { MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import type { ChatSession } from '@/types/api';

const statusLabels: Record<string, { text: string; color: string }> = {
  active: { text: 'Активна', color: 'green' },
  completed: { text: 'Завершена', color: 'blue' },
  archived: { text: 'В архиве', color: 'default' },
};

export function SearchHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: chatApi.getSessions,
  });

  const deleteMutation = useMutation({
    mutationFn: chatApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });

  const handleOpen = (sessionId: string) => {
    navigate('/chat', { state: { sessionId } });
  };

  const columns = [
    {
      title: 'Название',
      dataIndex: 'title',
      key: 'title',
      render: (title: string) => title || 'Без названия',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = statusLabels[status] || statusLabels.active;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: ChatSession) => (
        <div className="flex gap-2">
          <Button
            type="text"
            icon={<MessageOutlined />}
            onClick={() => handleOpen(record.id)}
            title="Открыть"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteMutation.mutate(record.id)}
            loading={deleteMutation.isPending}
            title="Удалить"
          />
        </div>
      ),
    },
  ];

  if (sessionsQuery.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!sessionsQuery.data || sessionsQuery.data.length === 0) {
    return (
      <Empty
        description="История поисков пуста"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <Table
      dataSource={sessionsQuery.data}
      columns={columns}
      rowKey="id"
      pagination={{ pageSize: 10 }}
    />
  );
}
