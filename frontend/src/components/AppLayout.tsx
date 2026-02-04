import { Layout, Button, Dropdown, Avatar, Space } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MessageOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import type { MenuProps } from 'antd';

const { Header, Content } = Layout;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors
    } finally {
      logout();
      navigate('/login');
    }
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Профиль',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white border-b flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-8">
          <Link to="/chat" className="text-xl font-bold text-primary-600 no-underline">
            🚗 AI Car Consultant
          </Link>

          <nav className="hidden md:flex gap-4">
            <Link to="/chat">
              <Button
                type={location.pathname === '/chat' ? 'primary' : 'text'}
                icon={<MessageOutlined />}
              >
                Чат
              </Button>
            </Link>
            <Link to="/profile">
              <Button
                type={location.pathname === '/profile' ? 'primary' : 'text'}
                icon={<HistoryOutlined />}
              >
                История
              </Button>
            </Link>
          </nav>
        </div>

        {user && (
          <Dropdown menu={{ items: menuItems }} placement="bottomRight">
            <Space className="cursor-pointer">
              <Avatar
                src={user.avatarUrl}
                icon={!user.avatarUrl && <UserOutlined />}
                className="bg-primary-500"
              />
              <span className="hidden md:inline text-gray-700">{user.name}</span>
            </Space>
          </Dropdown>
        )}
      </Header>

      <Content className="flex-1">{children}</Content>
    </Layout>
  );
}
