Создай production-ready веб-приложение на React 19 с TypeScript для AI-консультанта по подбору автомобилей.

Сгенерируй файлы в следующем порядке:
1. Сначала создай структуру проекта и package.json с ТОЧНЫМИ версиями зависимостей
2. Настрой конфигурацию (vite.config.ts, tsconfig.json, eslint, prettier)
3. Создай типы API контрактов (src/types/api.ts) - см. примеры ниже
4. Реализуй Axios клиент с interceptors (src/lib/api-client.ts)
5. Создай Zustand stores (src/stores/)
6. Реализуй features поочерёдно: auth → chat → profile → search
7. Настрой роутинг с protected routes
8. Создай UI компоненты с примерами использования React 19 фич

Технический стек:
- React 19 (useOptimistic, useActionState, Suspense)
- TypeScript 5.4+
- Vite 6+ с vite-tsconfig-paths
- Ant Design 5.x + Tailwind CSS
- React Router 7+
- Zustand для глобального состояния
- Axios + TanStack Query v5
- React Hook Form + Zod

Структура проекта (feature-based):
src/
├── features/
│   ├── auth/          # Логин, регистрация, protected routes
│   ├── chat/          # Чат-интерфейс, отправка сообщений
│   ├── profile/       # Личный кабинет, история, избранное
│   └── search/        # Отображение результатов, таблица сравнения
├── components/        # UI компоненты (Message, CarCard, ComparisonTable)
├── lib/               # API клиенты, утилиты
├── types/             # Типы TypeScript
└── stores/            # Zustand stores

Функциональные требования:

1. Авторизация:
   - Страницы /login и /register
   - Валидация форм через Zod
   - Сохранение JWT в HttpOnly cookie
   - ProtectedRoute для защиты /chat и /profile

2. Чат-интерфейс (/chat):
   - Header с информацией о пользователе и выходом
   - Список сообщений (пользователь справа, ассистент слева)
   - Поле ввода с поддержкой Enter для отправки
   - Индикатор "Ассистент печатает..."
   - Автоскролл к последнему сообщению
   - Кнопка очистки истории текущего чата

3. Отображение результатов:
   - Когда AI возвращает результат поиска, отображать сравнительную таблицу
   - Таблица должна показывать 1-3 модели с параметрами: цена, год, расход, стоимость владения
   - Кнопка "Сохранить в избранное" (только для авторизованных)

4. Личный кабинет (/profile):
   - Редактирование профиля (имя, email, аватар)
   - Вкладка "История поисков": список сессий чата с датами
   - Вкладка "Избранное": сохранённые результаты с возможностью удаления

## ПРИМЕРЫ КОДА (обязательно к реализации)

### 1. Типы API (src/types/api.ts):

```typescript
// Базовый формат всех API ответов
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
  };
  token: string;
}

// Chat
export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  finishedAt?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    isTyping?: boolean;
    comparisonTable?: CarComparison;
  };
}

export interface SendMessageRequest {
  content: string;
}

// Search Results
export interface CarModel {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  fuelType: string;
  bodyType: string;
  fuelConsumption: number;
  annualCost: number;
}

export interface CarComparison {
  models: CarModel[];
  criteria: string[];
}

export interface SearchResult {
  id: string;
  sessionId: string;
  searchQuerySummary: string;
  resultData: CarComparison;
  isSaved: boolean;
  createdAt: string;
}
```

### 2. Axios клиент (src/lib/api-client.ts):

```typescript
import axios from 'axios';
import type { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:80';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Для HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor для логирования
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }

    const errorMessage = error.response?.data?.error?.message || 'Произошла ошибка';
    return Promise.reject(new Error(errorMessage));
  }
);

// Типизированная обёртка для запросов
export async function apiRequest<T>(
  config: Parameters<typeof apiClient.request>[0]
): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config);

  if (!response.success) {
    throw new Error(response.error?.message || 'API Error');
  }

  return response.data as T;
}
```

### 3. API методы (src/lib/api.ts):

```typescript
import { apiRequest } from './api-client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ChatSession,
  ChatMessage,
  SendMessageRequest,
  SearchResult,
} from '@/types/api';

export const authApi = {
  login: (data: LoginRequest) =>
    apiRequest<AuthResponse>({
      method: 'POST',
      url: '/api/auth/login',
      data,
    }),

  register: (data: RegisterRequest) =>
    apiRequest<AuthResponse>({
      method: 'POST',
      url: '/api/auth/register',
      data,
    }),

  logout: () =>
    apiRequest<void>({
      method: 'POST',
      url: '/api/auth/logout',
    }),
};

export const chatApi = {
  createSession: () =>
    apiRequest<ChatSession>({
      method: 'POST',
      url: '/api/chat/sessions',
    }),

  getSessions: () =>
    apiRequest<ChatSession[]>({
      method: 'GET',
      url: '/api/chat/sessions',
    }),

  getMessages: (sessionId: string) =>
    apiRequest<ChatMessage[]>({
      method: 'GET',
      url: `/api/chat/sessions/${sessionId}/messages`,
    }),

  sendMessage: (sessionId: string, data: SendMessageRequest) =>
    apiRequest<ChatMessage>({
      method: 'POST',
      url: `/api/chat/sessions/${sessionId}/messages`,
      data,
    }),
};

export const searchApi = {
  saveResult: (resultId: string) =>
    apiRequest<SearchResult>({
      method: 'POST',
      url: `/api/search-results/${resultId}/save`,
    }),

  getSavedResults: () =>
    apiRequest<SearchResult[]>({
      method: 'GET',
      url: '/api/search-results/saved',
    }),
};
```

### 4. Zustand Store для чата (src/stores/chat-store.ts):

```typescript
import { create } from 'zustand';
import type { ChatSession, ChatMessage } from '@/types/api';

interface ChatStore {
  currentSession: ChatSession | null;
  messages: ChatMessage[];
  isAssistantTyping: boolean;

  setCurrentSession: (session: ChatSession | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setIsAssistantTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  currentSession: null,
  messages: [],
  isAssistantTyping: false,

  setCurrentSession: (session) => set({ currentSession: session }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  setIsAssistantTyping: (isTyping) => set({ isAssistantTyping: isTyping }),
  clearMessages: () => set({ messages: [] }),
}));
```

### 5. React 19: useOptimistic для чата (src/features/chat/hooks/use-send-message.ts):

```typescript
import { useOptimistic } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '@/lib/api';
import { useChatStore } from '@/stores/chat-store';
import type { ChatMessage, SendMessageRequest } from '@/types/api';

export function useSendMessage(sessionId: string) {
  const { messages, addMessage, setIsAssistantTyping } = useChatStore();

  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (state: ChatMessage[], newMessage: ChatMessage) => [...state, newMessage]
  );

  const mutation = useMutation({
    mutationFn: (data: SendMessageRequest) =>
      chatApi.sendMessage(sessionId, data),

    onMutate: async (variables) => {
      // Оптимистично добавляем сообщение пользователя
      const optimisticUserMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: variables.content,
        createdAt: new Date().toISOString(),
      };

      addOptimisticMessage(optimisticUserMessage);
      setIsAssistantTyping(true);
    },

    onSuccess: (assistantMessage) => {
      addMessage(assistantMessage);
      setIsAssistantTyping(false);
    },

    onError: () => {
      setIsAssistantTyping(false);
    },
  });

  return {
    sendMessage: mutation.mutate,
    optimisticMessages,
    isLoading: mutation.isPending,
  };
}
```

### 6. React 19: useActionState для формы логина (src/features/auth/components/LoginForm.tsx):

```typescript
import { useActionState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authApi } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('Неверный формат email'),
  password: z.string().min(8, 'Минимум 8 символов'),
});

type LoginFormData = z.infer<typeof loginSchema>;

async function loginAction(prevState: any, formData: LoginFormData) {
  try {
    const response = await authApi.login(formData);
    return { success: true, user: response.user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка входа'
    };
  }
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit((data) => {
    formAction(data);
  });

  return (
    <form onSubmit={onSubmit}>
      <div>
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          disabled={isPending}
        />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input
          {...register('password')}
          type="password"
          placeholder="Пароль"
          disabled={isPending}
        />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      {state?.error && <div className="error">{state.error}</div>}

      <button type="submit" disabled={isPending}>
        {isPending ? 'Вход...' : 'Войти'}
      </button>
    </form>
  );
}
```

### 7. Protected Route (src/components/ProtectedRoute.tsx):

```typescript
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### 8. Environment Variables (.env.example):

```env
VITE_API_URL=http://localhost:80
VITE_APP_NAME=AI Car Consultant
```

## API Endpoints:

- POST   /api/auth/login
- POST   /api/auth/register
- POST   /api/auth/logout
- GET    /api/users/profile
- PUT    /api/users/profile
- POST   /api/chat/sessions
- GET    /api/chat/sessions
- GET    /api/chat/sessions/{id}/messages
- POST   /api/chat/sessions/{id}/messages
- DELETE /api/chat/sessions/{id}
- POST   /api/search-results/{id}/save
- GET    /api/search-results/saved
- DELETE /api/search-results/{id}

Обязательные фичи React 19:
- useOptimistic для отправки сообщений
- useActionState для форм
- Suspense для ленивой загрузки компонентов
- Error boundaries для обработки ошибок

Качество кода:
- Полная типизация TypeScript (strict mode)
- ESLint + Prettier + Husky pre-commit
- Мобильная адаптивность (Ant Design Grid)
- ARIA-атрибуты для доступности
- Скелетоны при загрузке
- Обработка ошибок через Error Boundaries
- Логирование в dev mode

## ВАЖНЫЕ ТЕХНИЧЕСКИЕ ДЕТАЛИ

### Package.json - актуальные версии:

**ВАЖНО:** `"type": "module"` указан в package.json.

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.1.1",
    "antd": "^5.22.0",
    "@ant-design/icons": "^5.5.1",
    "axios": "^1.7.7",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^5.0.2",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.8",
    "@hookform/resolvers": "^3.9.0",
    "dayjs": "^1.11.13",
    "clsx": "^2.1.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.0",
    "vite": "^6.0.0",
    "vite-tsconfig-paths": "^5.1.0",
    "tailwindcss": "^3.4.14",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.0",
    "prettier": "^3.3.0"
  }
}
```

### TanStack Query Setup (src/lib/query-client.ts):

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 минут
    },
  },
});
```

### Роутинг (src/App.tsx):

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ChatPage } from '@/features/chat/pages/ChatPage';
import { ProfilePage } from '@/features/profile/pages/ProfilePage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/chat" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
```

### Компонент сообщения чата (src/features/chat/components/Message.tsx):

```typescript
import { Card, Avatar } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import type { ChatMessage } from '@/types/api';
import { ComparisonTable } from './ComparisonTable';

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      role="article"
      aria-label={`${isUser ? 'Ваше' : 'Ассистент'} сообщение`}
    >
      <Avatar
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        className={isUser ? 'bg-blue-500' : 'bg-green-500'}
      />

      <Card
        className={`max-w-[70%] ${isUser ? 'bg-blue-50' : 'bg-gray-50'}`}
        bodyStyle={{ padding: '12px 16px' }}
      >
        <p className="mb-0 whitespace-pre-wrap">{message.content}</p>

        {message.metadata?.comparisonTable && (
          <ComparisonTable
            data={message.metadata.comparisonTable}
            className="mt-3"
          />
        )}
      </Card>
    </div>
  );
}
```

### Vite Config (vite.config.ts):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true,
      },
    },
  },
});
```

### TypeScript Config (tsconfig.json):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## КРИТИЧЕСКИ ВАЖНО:

1. **Все компоненты должны быть типизированы** - никаких `any`
2. **Используй React 19 фичи** - useOptimistic для чата, useActionState для форм
3. **TanStack Query для всех API запросов** - с правильной конфигурацией кэша
4. **Zustand только для UI state** - не дублируй серверное состояние
5. **Обязательна обработка loading/error состояний** во всех компонентах
6. **Accessibility** - ARIA атрибуты, keyboard navigation
7. **Мобильная адаптивность** - используй Ant Design Grid и Tailwind responsive классы
8. **npm install** - всегда использовать `npm install` вместо `npm ci`, так как package-lock.json может отсутствовать
9. **.dockerignore** - ОБЯЗАТЕЛЬНО создавать для исключения node_modules, dist и других ненужных файлов из Docker build context

## СТРУКТУРА ФАЙЛОВ features/chat:

```
features/chat/
├── components/
│   ├── Message.tsx              # Компонент одного сообщения
│   ├── MessageList.tsx          # Список сообщений с автоскроллом
│   ├── MessageInput.tsx         # Поле ввода сообщения
│   ├── ComparisonTable.tsx      # Таблица сравнения авто
│   └── TypingIndicator.tsx      # Индикатор печатает...
├── hooks/
│   ├── use-send-message.ts      # Hook с useOptimistic
│   ├── use-chat-messages.ts     # TanStack Query для загрузки сообщений
│   └── use-chat-session.ts      # Управление текущей сессией
├── pages/
│   └── ChatPage.tsx             # Главная страница чата
└── types.ts                     # Локальные типы для chat feature
```

## ПРИМЕР КОМПОНЕНТА ChatPage:

```typescript
import { Suspense } from 'react';
import { Layout, Button, Spin } from 'antd';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { useChatSession } from '../hooks/use-chat-session';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const { Header, Content, Footer } = Layout;

export function ChatPage() {
  const { session, isLoading } = useChatSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Layout className="h-screen">
      <Header className="bg-white border-b flex items-center justify-between px-6">
        <h1 className="text-xl font-semibold mb-0">AI Консультант</h1>
        <Button type="link" href="/profile">
          Профиль
        </Button>
      </Header>

      <Content className="flex flex-col overflow-hidden">
        <ErrorBoundary>
          <Suspense fallback={<Spin />}>
            <MessageList sessionId={session?.id} />
          </Suspense>
        </ErrorBoundary>
      </Content>

      <Footer className="bg-white border-t p-4">
        <MessageInput sessionId={session?.id} />
      </Footer>
    </Layout>
  );
}
```