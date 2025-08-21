import { getSystemStats } from './system.js'

// WebSocket连接处理
export function setupWebSocket(io) {
  io.on('connection', (socket) => {
    console.log('客户端已连接:', socket.id)

    // 定时发送系统信息
    const interval = setInterval(async () => {
      const stats = await getSystemStats()
      if (stats) {
        socket.emit('system-stats', stats)
      }
    }, 3000)

    socket.on('disconnect', () => {
      console.log('客户端已断开:', socket.id)
      clearInterval(interval)
    })
  })
} 