import { Suspense } from 'react';
import { Layout, Button, Spin, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { useChatSession } from '../hooks/use-chat-session';
import { AppLayout, ErrorBoundary } from '@/components';

const { Content, Footer } = Layout;

export function ChatPage() {
  const { session, isLoading, createNewSession } = useChatSession();

  return (
    <AppLayout>
      <Layout className="h-[calc(100vh-64px)] flex flex-col">
        {/* Sub-header */}
        <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
          <div>
            <span className="text-gray-500">Сессия: </span>
            <span className="font-medium">
              {session?.title || 'Новый диалог'}
            </span>
          </div>
          <Tooltip title="Начать новый диалог">
            <Button
              icon={<PlusOutlined />}
              onClick={createNewSession}
              disabled={isLoading}
            >
              Новый чат
            </Button>
          </Tooltip>
        </div>

        {/* Messages */}
        <Content className="flex-1 flex flex-col overflow-hidden bg-gray-50">
          <ErrorBoundary>
            <Suspense
              fallback={
                <div className="flex-1 flex items-center justify-center">
                  <Spin size="large" />
                </div>
              }
            >
              <MessageList sessionId={session?.id} />
            </Suspense>
          </ErrorBoundary>
        </Content>

        {/* Input */}
        <Footer className="bg-white border-t p-4">
          <MessageInput sessionId={session?.id} />
        </Footer>
      </Layout>
    </AppLayout>
  );
}
