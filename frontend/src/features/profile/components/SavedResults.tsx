import { Card, Empty, Spin, Button, Tag, Popconfirm, message } from 'antd';
import { DeleteOutlined, CarOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import { formatDateTime, formatPrice } from '@/lib/utils';
import type { SearchResult } from '@/types/api';

export function SavedResults() {
  const queryClient = useQueryClient();

  const resultsQuery = useQuery({
    queryKey: ['saved-results'],
    queryFn: searchApi.getSavedResults,
  });

  const deleteMutation = useMutation({
    mutationFn: searchApi.deleteResult,
    onSuccess: () => {
      message.success('Результат удалён');
      queryClient.invalidateQueries({ queryKey: ['saved-results'] });
    },
    onError: () => {
      message.error('Ошибка удаления');
    },
  });

  if (resultsQuery.isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  if (!resultsQuery.data || resultsQuery.data.length === 0) {
    return (
      <Empty
        description="Нет сохранённых результатов"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" href="/chat">
          Начать поиск
        </Button>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {resultsQuery.data.map((result: SearchResult) => (
        <Card
          key={result.id}
          title={
            <div className="flex items-center gap-2">
              <CarOutlined />
              <span className="truncate">{result.searchQuerySummary}</span>
            </div>
          }
          extra={
            <Popconfirm
              title="Удалить результат?"
              onConfirm={() => deleteMutation.mutate(result.id)}
              okText="Да"
              cancelText="Нет"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deleteMutation.isPending}
              />
            </Popconfirm>
          }
          size="small"
        >
          <div className="space-y-2">
            {result.resultData.models.slice(0, 3).map((model) => (
              <div
                key={model.id}
                className="flex justify-between items-center text-sm"
              >
                <span>
                  {model.brand} {model.model}
                </span>
                <Tag color="green">{formatPrice(model.price)}</Tag>
              </div>
            ))}

            {result.resultData.models.length > 3 && (
              <div className="text-gray-400 text-xs">
                и ещё {result.resultData.models.length - 3}...
              </div>
            )}
          </div>

          <div className="text-gray-400 text-xs mt-3">
            {formatDateTime(result.createdAt)}
          </div>
        </Card>
      ))}
    </div>
  );
}
