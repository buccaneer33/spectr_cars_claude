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
WORKDIR /app/services/users
COPY services/users/package*.json ./
RUN npm install

# Copy source code
COPY services/users/ ./

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

EXPOSE 4001

CMD ["npm", "start"]
