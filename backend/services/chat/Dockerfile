FROM node:20-alpine

# Install openssl for Prisma and netcat for health checks
RUN apk add --no-cache openssl netcat-openbsd

WORKDIR /app

# Copy and build shared module
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install
COPY shared/ ./
RUN npm run build

# Setup service
WORKDIR /app/services/chat
COPY services/chat/package*.json ./
RUN npm install

# Copy source code
COPY services/chat/ ./

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Copy entrypoint script
COPY services/chat/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4003

ENTRYPOINT ["docker-entrypoint.sh"]
