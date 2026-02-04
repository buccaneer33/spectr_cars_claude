-- Инициализация баз данных для Cars AI Consultant
-- Этот скрипт выполняется автоматически при первом запуске PostgreSQL

-- Создаём отдельные базы данных для каждого сервиса
CREATE DATABASE users_db;
CREATE DATABASE search_db;
CREATE DATABASE chat_db;

-- Подключаемся к каждой БД и настраиваем расширения
\c users_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON DATABASE users_db IS 'User Service - аутентификация и профили пользователей';

\c search_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON DATABASE search_db IS 'Search Service - каталог автомобилей и поиск';

\c chat_db;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
COMMENT ON DATABASE chat_db IS 'Chat Service - диалоги с AI и результаты поиска';

-- Возвращаемся к базе postgres
\c postgres;

-- Выводим информацию о созданных базах
SELECT datname, pg_encoding_to_char(encoding), datcollate, datctype
FROM pg_database
WHERE datname IN ('users_db', 'search_db', 'chat_db');
