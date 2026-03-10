# 第一阶段：构建项目
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm install --legacy-peer-deps

# 复制所有源代码
COPY . .

# 构建项目
RUN npm run build

# 第二阶段：运行项目
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 创建logs目录
RUN mkdir -p logs

# 从构建阶段复制依赖和构建产物
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server.js ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/postcss.config.mjs ./

# 暴露端口
EXPOSE 3000

# 启动命令
ENTRYPOINT ["node", "server.js"]