# NavPage - 现代导航面板

一个现代化的服务器应用导航面板，集成服务管理、智能搜索功能和综合系统监控。采用未来科技风格设计，具有实时数据可视化功能。

## 📸 主页预览

![NavPage主页界面](https://image.sjcnas.xyz/i/2025/08/21/pjd0ns.png)

*NavPage主页界面展示 - 包含搜索功能、服务网格布局和系统监控面板*

## ✨ 前端界面功能

### 🏠 主界面展示
- **顶部导航**：Logo标识 + 居中搜索栏 + 实时时间显示 + 退出登录
- **服务导航区**：网格式服务卡片展示，支持分类筛选和设置入口
- **系统监控面板**：实时显示CPU、内存、网络、磁盘等系统状态
- **科技风格**：未来科技主题，流畅动画效果，响应式设计

### 🔍 搜索功能界面
- **搜索引擎选择**：下拉选择不同搜索引擎（默认百度、Bing）
- **智能输入提示**：基于搜索历史的自动建议
- **URL识别跳转**：自动识别URL格式并直接访问
- **搜索历史记录**：显示最近搜索内容，支持快速重搜
- **键盘快捷键**：支持回车搜索、方向键选择建议

### 🔧 服务导航展示
- **服务卡片**：显示服务名称、描述、状态指示器
- **分类筛选**：顶部分类标签，点击筛选不同类型服务
- **状态显示**：在线(绿)、离线(红)、维护(橙)状态指示
- **分页浏览**：每页12个服务，底部分页导航
- **快速访问**：点击卡片直接跳转到服务地址

### 📊 系统监控界面
- **CPU仪表盘**：圆形进度条显示总体使用率，可展开查看各核心
- **内存状态条**：可视化内存使用情况，显示已用/缓存/可用
- **网络流量图**：实时显示上传下载速度数值
- **磁盘信息**：显示读写速度和存储空间使用百分比
- **系统运行时间**：显示启动时间和累计运行时长

### ⚙️ 设置管理页面
- **搜索引擎管理**：添加自定义搜索引擎，调整顺序，删除引擎
- **分类管理**：创建服务分类，设置图标emoji和主题颜色
- **应用服务管理**：添加新服务，编辑服务信息，删除服务
- **配置导入导出**：JSON格式配置文件的备份和恢复
- **历史记录清理**：一键清除搜索历史记录

### 🔐 认证登录页面
- **密钥输入界面**：简洁的密钥输入框，支持显示/隐藏切换
- **登录状态反馈**：实时显示登录进度和结果信息
- **系统状态提示**：显示系统是否需要初始化设置
- **新密钥创建**：提供创建新访问密钥的入口链接
- **自动跳转**：登录成功后自动跳转到主界面

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
    image: crpi-36bectlts4f4dtww.cn-shenzhen.personal.cr.aliyuncs.com/dqsq2e2/navpage:latest
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
  crpi-36bectlts4f4dtww.cn-shenzhen.personal.cr.aliyuncs.com/dqsq2e2/navpage:latest
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
- **镜像地址**：`crpi-36bectlts4f4dtww.cn-shenzhen.personal.cr.aliyuncs.com/dqsq2e2/navpage:latest`
- **镜像大小**：约 150MB（压缩后）
- **架构支持**：linux/amd64
- **更新频率**：跟随主分支更新

### 端口说明
- **5833**：外部访问端口（可自定义）
- **5834**：容器内应用端口（固定）

## 📁 项目结构

```
navpage/
├── src/                        # React前端源码
│   ├── components/             # 前端组件 + 样式
│   │   ├── Login.tsx           # 登录页面组件
│   │   ├── Login.css           # 登录页面样式
│   │   ├── SearchBar.tsx       # 搜索栏组件
│   │   ├── SearchBar.css       # 搜索栏样式
│   │   ├── ServiceGrid.tsx     # 服务网格组件
│   │   ├── ServiceGrid.css     # 服务网格样式
│   │   ├── SystemMonitor.tsx   # 系统监控组件
│   │   └── SystemMonitor.css   # 系统监控样式
│   ├── contexts/               # React上下文
│   │   └── AuthContext.tsx     # 认证状态管理
│   ├── utils/                  # 工具函数
│   │   ├── api.ts             # API请求封装
│   │   └── configService.ts   # 配置服务
│   ├── types/                  # TypeScript类型定义
│   │   └── auth.ts            # 认证相关类型
│   ├── App.tsx                # 主应用组件
│   ├── App.css               # 全局应用样式
│   ├── main.tsx              # React应用入口
│   └── index.css             # 全局基础样式
├── server/                     # Node.js后端源码
│   ├── modules/               # 后端模块
│   │   ├── auth.js           # 用户认证逻辑
│   │   ├── config.js         # 配置文件管理
│   │   ├── keyManager.js     # 密钥管理系统
│   │   ├── routes.js         # API路由定义
│   │   ├── system.js         # 系统监控数据
│   │   ├── utils.js          # 通用工具函数
│   │   └── websocket.js      # WebSocket实时通信
│   └── index.js              # Express服务器入口
├── public/                     # 静态资源文件
│   ├── auth.html             # 用户认证页面
│   ├── settings.html         # 系统设置页面
│   ├── admin-keys.html       # 密钥管理页面
│   ├── create-key.html       # 创建密钥页面
│   └── logo.png              # 项目Logo图标
├── index.html                  # Vite构建入口HTML
├── package.json               # 项目依赖配置
├── vite.config.js            # Vite构建配置
├── tsconfig.json             # TypeScript配置
├── tsconfig.node.json        # Node.js TypeScript配置
├── Dockerfile                # Docker镜像构建
├── docker-compose.yml        # Docker Compose配置
├── .dockerignore             # Docker忽略文件
├── LICENSE                   # 开源许可证
└── README.md                 # 项目说明文档
```

## 🎨 前端界面设计

### 视觉风格
- **未来科技主题**：深色背景 + 蓝色霓虹光效
- **玻璃拟态设计**：半透明卡片 + 毛玻璃模糊效果
- **动态粒子背景**：浮动粒子动画营造科技氛围
- **渐变色彩**：蓝色主调配合橙色、绿色点缀
- **现代图标**：Emoji图标 + 自定义图标URL支持

### 用户交互体验
- **实时数据展示**：系统监控数据3秒自动更新
- **流畅动画效果**：卡片悬停、按钮点击、页面切换动画
- **智能搜索体验**：输入建议、历史记录、URL识别
- **响应式适配**：完美支持桌面端和移动端访问
- **直观状态反馈**：登录进度、操作结果、系统状态提示

### 界面布局特点
- **顶部导航栏**：Logo + 搜索栏 + 时间 + 用户操作
- **网格式服务展示**：12个服务/页，分类筛选，分页浏览
- **仪表盘式监控**：圆形进度条，彩色状态条，数值显示
- **设置管理界面**：标签页式管理，表单化配置

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
系统监控功能通过直接读取Linux系统文件实现：
- **数据来源**：直接读取 `/proc` 文件系统获取真实系统数据
- **实时更新**：WebSocket连接，每3秒推送最新数据
- **容器支持**：通过挂载主机目录实现容器内监控主机系统
- **多指标监控**：CPU、内存、磁盘、网络、进程等全方位监控
- **缓存机制**：系统信息缓存，减少文件读取开销

## 📡 API 接口

### 前端界面使用的接口

#### 系统监控数据
```bash
GET /api/system-stats      # 获取CPU、内存、磁盘、网络等实时数据
WebSocket连接              # 实时推送系统监控数据更新
```

#### 用户认证流程
```bash
POST /api/auth/login       # 密钥登录验证
GET  /api/system/status    # 检查系统初始化状态
GET  /api/auth/verify      # 验证用户登录状态
POST /api/auth/logout      # 用户登出
```

#### 服务导航管理
```bash
GET  /api/config/services     # 获取服务列表（前端ServiceGrid组件）
POST /api/config/services     # 保存服务配置
GET  /api/config/categories   # 获取分类列表（前端分类筛选）
POST /api/config/categories   # 保存分类配置
```

#### 搜索功能支持
```bash
GET  /api/config/engines      # 获取搜索引擎列表（前端SearchBar组件）
POST /api/config/engines      # 保存搜索引擎配置
GET  /api/config/history      # 获取搜索历史记录
POST /api/config/history      # 保存搜索历史
```



## ⚡ 技术特点

### 前端架构
- **React 18** + **TypeScript**：现代化前端开发
- **Vite构建**：快速开发服务器和优化构建
- **组件化设计**：可复用的React组件架构
- **响应式布局**：支持桌面端和移动端
- **实时通信**：Socket.IO客户端实时数据更新

### 后端架构
- **Express.js**：轻量级Node.js服务器框架
- **ES模块**：现代JavaScript模块系统
- **文件系统监控**：直接读取Linux `/proc` 文件系统
- **WebSocket服务**：Socket.IO服务端推送实时数据
- **RESTful API**：标准化API接口设计

### 系统监控实现
- **无依赖监控**：不依赖第三方系统信息库
- **原生文件读取**：直接解析 `/proc/meminfo`、`/proc/stat`、`/proc/net/dev` 等
- **容器化友好**：通过挂载主机目录实现容器内监控
- **性能优化**：数据缓存机制，减少重复文件读取

## 🔐 安全考虑

- **密钥认证**：自定义密钥系统，支持管理员权限
- **会话管理**：HTTP-only Cookie + Token双重验证
- **数据安全**：密钥哈希存储，不保存明文密钥
- **API保护**：所有配置API均需要用户认证
- **容器安全**：特权模式仅用于系统监控，数据目录独立挂载

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
- [React 18](https://reactjs.org/) - 前端框架
- [TypeScript](https://www.typescriptlang.org/) - 类型安全
- [Vite](https://vitejs.dev/) - 前端构建工具
- [Express.js](https://expressjs.com/) - 后端框架
- [Socket.IO](https://socket.io/) - 实时WebSocket通信 
