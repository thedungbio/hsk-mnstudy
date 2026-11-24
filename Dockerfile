# Dockerfile triển khai sản xuất HSKMaster AI
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Cài đặt và build Frontend React
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# 2. Cài đặt Backend Server
COPY server/package*.json ./server/
RUN cd server && npm install --omit=dev

COPY server/ ./server/
COPY package*.json ./

# Cổng ứng dụng
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

# Khởi chạy server Express (đã tích hợp phục vụ frontend SPA)
CMD ["node", "server/server.js"]
