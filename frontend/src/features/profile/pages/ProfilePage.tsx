import { Tabs, Card } from 'antd';
import { UserOutlined, HistoryOutlined, HeartOutlined } from '@ant-design/icons';
import { AppLayout, ErrorBoundary } from '@/components';
import { ProfileForm } from '../components/ProfileForm';
import { SearchHistory } from '../components/SearchHistory';
import { SavedResults } from '../components/SavedResults';

const tabItems = [
  {
    key: 'profile',
    label: (
      <span>
        <UserOutlined />
        Профиль
      </span>
    ),
    children: (
      <ErrorBoundary>
        <ProfileForm />
      </ErrorBoundary>
    ),
  },
  {
    key: 'history',
    label: (
      <span>
        <HistoryOutlined />
        История
      </span>
    ),
    children: (
      <ErrorBoundary>
        <SearchHistory />
      </ErrorBoundary>
    ),
  },
  {
    key: 'saved',
    label: (
      <span>
        <HeartOutlined />
        Избранное
      </span>
    ),
    children: (
      <ErrorBoundary>
        <SavedResults />
      </ErrorBoundary>
    ),
  },
];

export function ProfilePage() {
  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <Tabs
            defaultActiveKey="profile"
            items={tabItems}
            size="large"
          />
        </Card>
      </div>
    </AppLayout>
  );
}
