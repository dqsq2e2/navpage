# NavPage - 现代导航面板

一个现代化的服务器应用导航面板，集成服务管理、智能搜索功能和综合系统监控。采用未来科技风格设计，具有实时数据可视化功能。

## ✨ 功能特色

### 🔧 服务导航
- 添加和管理网络应用服务器地址
- 支持自定义图标、描述和分类
- 实时服务状态监控
- 卡片式显示和分类筛选
- 类似 [Homepage](https://github.com/gethomepage/homepage) 的功能

### 🔍 智能搜索
- 多搜索引擎支持（百度、必应、自定义引擎）
- 搜索建议和历史记录
- 一键搜索引擎切换
- 支持自定义搜索URL
- 直接搜索结果导航

### 📊 系统监控
- **CPU监控**：使用率、核心数、型号、单核负载
- **内存监控**：使用率、缓存、交换分区状态
- **磁盘监控**：使用率、实时读写速度、IOPS
- **系统信息**：运行时间、平台、负载平均值
- **网络流量**：实时发送/接收统计

### 🔐 认证与安全
- 基于密钥的认证系统
- 管理员角色管理
- 安全API访问控制
- 会话管理

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装
```bash
npm install
```

### 开发
```bash
# 启动开发服务器（前端+后端）
npm run dev

# 或分别启动
npm run client  # 前端开发服务器（端口3000）
npm run server  # 后端服务器（端口5000）
```

### 生产构建
```bash
npm run build
```

## 🐳 Docker 部署

### 方法一：直接拉取镜像（推荐）

使用预构建的远程镜像，无需本地构建：

#### 使用 Docker Compose
创建 `docker-compose.yml` 文件：
```yaml
services:
  navpage:
    image: crpi-36bectlts4f4dtww.cn-shenzhen.personal.cr.aliyuncs.com/navpage/navpage:latest
    container_name: navpage-app
    restart: unless-stopped
    ports:
      - "5833:5834"  # 主应用端口
    environment:
      - NODE_ENV=production
      - PORT=5834
    volumes:
      - navpage-data:/app/server/data
      - navpage-logs:/app/logs
      # 系统监控需要的挂载点
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    privileged: true  # 获取系统信息需要特权
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5834/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - navpage-network

volumes:
  navpage-data:
    driver: local
  navpage-logs:
    driver: local

networks:
  navpage-network:
    driver: bridge
```

然后运行：
```bash
docker-compose up -d
```

#### 直接使用 Docker 命令
```bash
# 拉取并运行预构建镜像
docker run -d \
  --name navpage-app \
  --restart unless-stopped \
  -p 5833:5834 \
  -e NODE_ENV=production \
  -e PORT=5834 \
  -v navpage-data:/app/server/data \
  -v navpage-logs:/app/logs \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /:/rootfs:ro \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  --privileged \
  crpi-36bectlts4f4dtww.cn-shenzhen.personal.cr.aliyuncs.com/navpage/navpage:latest
```

### 方法二：本地构建

#### 使用 Docker Compose（本地构建）
```bash
docker-compose up -d
```

#### 手动 Docker 运行
```bash
# 构建镜像
docker build -t navpage .

# 运行并启用系统监控功能
docker run -d \
  --name navpage-app \
  --restart unless-stopped \
  -p 5833:5834 \
  -e NODE_ENV=production \
  -e PORT=5834 \
  -v navpage-data:/app/server/data \
  -v /proc:/host/proc:ro \
  -v /sys:/host/sys:ro \
  -v /:/rootfs:ro \
  navpage
```

### 环境变量
```bash
NODE_ENV=production        # 环境模式
PORT=5834                 # 后端端口
HOST_MOUNT_POINT=/rootfs  # 监控用主机文件系统挂载点
```

### 镜像信息
- **镜像地址**：`crpi-36bectlts4f4dtww.cn-shenzhen.personal.cr.aliyuncs.com/navpage/navpage:latest`
- **镜像大小**：约 150MB（压缩后）
- **架构支持**：linux/amd64
- **更新频率**：跟随主分支更新

### 端口说明
- **5833**：外部访问端口（可自定义）
- **5834**：容器内应用端口（固定）

## 📁 项目结构

```
navpage/
├── src/                    # 前端源码
│   ├── components/         # React 组件
│   │   ├── Login.tsx       # 登录组件
│   │   ├── SearchBar.tsx   # 搜索栏组件
│   │   ├── ServiceGrid.tsx # 服务网格组件
│   │   └── SystemMonitor.tsx # 系统监控组件
│   ├── contexts/           # React 上下文
│   ├── utils/             # 工具函数
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 应用入口点
├── server/                # 后端源码
│   ├── modules/           # 服务器模块
│   │   ├── auth.js        # 认证逻辑
│   │   ├── config.js      # 配置管理
│   │   ├── system.js      # 系统监控
│   │   ├── routes.js      # API 路由
│   │   └── websocket.js   # WebSocket 处理
│   └── index.js           # Express 服务器
├── public/                # 静态资源
└── *.html                 # 静态页面（认证、设置、管理）
```

## 🎨 设计特色

### 科技风格界面
- 深色主题和现代美学
- 玻璃拟态效果
- 霓虹灯光和动画
- 响应式设计
- 现代UI组件

### 交互体验
- 流畅的动画过渡
- 实时数据更新
- 悬停效果和状态指示器
- 移动端友好设计

## 🔧 配置说明

### 搜索引擎
默认支持的搜索引擎：
- 百度：`https://www.baidu.com/s?wd={query}`
- 必应：`https://www.bing.com/search?q={query}`
- 自定义示例：`https://example.com/search?q={query}`

您可以通过界面添加自定义搜索引擎，使用 `{query}` 作为查询占位符。

### 服务配置
服务信息存储在服务器数据库中，包括：
- 服务名称和URL
- 图标和描述
- 分类和主题颜色
- 状态监控

### 系统监控
后端使用 `systeminformation` 包获取真实系统数据：
- 自动检测操作系统类型
- 实时系统指标更新
- WebSocket连接实现实时数据流

## 📡 API 接口

### 系统状态
```
GET /api/system-stats
```
返回综合系统监控数据

### 进程信息
```
GET /api/processes
```
返回CPU占用前10的进程

### 健康检查
```
GET /api/health
```
返回服务器状态和运行时间

### 认证
```
POST /api/auth/login
POST /api/auth/create-key
GET /api/auth/verify
POST /api/auth/logout
```

### 配置管理
```
GET /api/config
POST /api/config
GET /api/config/export
POST /api/config/import
```

## 🔐 安全考虑

- 服务状态检查使用 `no-cors` 模式避免跨域问题
- 搜索历史仅本地存储
- 后端API包含错误处理和输入验证
- 支持HTTPS部署
- 基于密钥的认证系统
- 管理员角色分离

## 🚀 部署说明

### 部署方式选择

#### 方法一：直接拉取镜像（推荐）
- ✅ **快速部署**：无需本地构建，直接拉取预构建镜像
- ✅ **节省资源**：不占用本地构建时间和存储空间
- ✅ **版本稳定**：使用经过测试的稳定版本
- ⚠️ **网络依赖**：需要能够访问阿里云容器镜像服务

#### 方法二：本地构建
- ✅ **完全控制**：可以修改源码并构建自定义版本
- ✅ **离线部署**：不依赖外部镜像仓库
- ⚠️ **构建时间**：需要花费时间进行本地构建
- ⚠️ **资源占用**：需要额外的构建环境和存储空间

### Docker中的系统监控
要在Docker容器中启用完整的系统监控：

1. **挂载主机文件系统（只读）**：
   ```bash
   -v /proc:/host/proc:ro
   -v /sys:/host/sys:ro
   -v /:/rootfs:ro
   -v /var/run/docker.sock:/var/run/docker.sock:ro  # 可选：Docker容器监控
   ```

2. **设置环境变量**：
   ```bash
   -e HOST_MOUNT_POINT=/rootfs
   ```

3. **特权模式**：
   ```bash
   --privileged  # 或者使用更精细的权限控制
   ```

4. **安全性**：始终对主机目录使用只读挂载（`:ro`）

### 支持的监控指标
- ✅ CPU使用率和核心数
- ✅ 内存使用率（总计、已用、可用、缓存）
- ✅ 磁盘使用率（总计、已用、可用空间）
- ✅ 磁盘I/O速度（读写速度、IOPS）
- ✅ 网络流量统计
- ✅ 系统运行时间和负载平均值

## 🤝 贡献

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Homepage](https://github.com/gethomepage/homepage) - 设计灵感
- [阿里云开发者社区文章](https://developer.aliyun.com/article/1629334) - 系统信息收集实现参考
- [React](https://reactjs.org/) - 前端框架
- [Express](https://expressjs.com/) - 后端框架
- [Socket.IO](https://socket.io/) - 实时通信 