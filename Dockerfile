# 使用 Node.js 18 Alpine 基础镜像
FROM node:18-alpine as builder

# 设置工作目录
WORKDIR /app

# 配置 Alpine 镜像源并安装 Python 和构建工具（系统监控包需要）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache python3 make g++ curl py3-pip

# 先复制包文件以优化层缓存
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 生产环境镜像
FROM node:18-alpine

# 配置 Alpine 镜像源并安装系统工具
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories && \
    apk add --no-cache \
    curl \
    procps \
    htop \
    python3 \
    py3-pip \
    && rm -rf /var/cache/apk/*

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S navpage -u 1001

# 设置工作目录
WORKDIR /app

# 先复制包文件以优化生产安装缓存
COPY --from=builder /app/package*.json ./

# 仅安装生产依赖
RUN npm install --only=production

# 复制构建产物和配置文件
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/public ./public

# 创建数据目录
RUN mkdir -p /app/data && \
    chown -R navpage:nodejs /app

# 切换到非 root 用户
USER navpage

# 暴露端口
EXPOSE 5833 5834

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5834/api/health || exit 1

# 启动命令
CMD ["npm", "run", "start"] 