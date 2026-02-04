FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy and build shared module
COPY shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install
COPY shared/ ./
RUN npm run build

# Setup service
WORKDIR /app/services/search
COPY services/search/package*.json ./
RUN npm install

# Copy source code
COPY services/search/ ./

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

EXPOSE 4002

CMD ["npm", "start"]
