import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { createServer } from 'http'

// 导入功能模块
import { CONFIG, ensureConfigDir, cookieParser, errorHandler } from './modules/utils.js'
import { setupRoutes } from './modules/routes.js'
import { setupWebSocket } from './modules/websocket.js'

// 创建应用实例
const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5833",
    methods: ["GET", "POST"]
  }
})

// 中间件配置
app.use(cors({
  origin: true, // 允许所有域名（处理不定端口）
  credentials: true
}))
app.use(express.json())
app.use(cookieParser) // 使用模块化的cookie解析器

// 初始化配置目录
await ensureConfigDir()

// 设置路由
setupRoutes(app)

// 设置WebSocket
setupWebSocket(io)

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
server.listen(CONFIG.PORT, () => {
  console.log(`🚀 Server running on port ${CONFIG.PORT}`)
  console.log(`📊 System Monitor API: http://localhost:${CONFIG.PORT}/api/system-stats`)
  console.log(`🔍 Health Check: http://localhost:${CONFIG.PORT}/api/health`)
  console.log(`🔧 Settings Page: http://localhost:${CONFIG.PORT}/settings.html`)
})

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...')
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
})

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...')
  server.close(() => {
    console.log('服务器已关闭')
    process.exit(0)
  })
}) 