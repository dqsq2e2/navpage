import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 配置常量
export const CONFIG = {
  HOST_MOUNT_POINT: process.env.HOST_MOUNT_POINT || '/',
  ADMIN_KEY: process.env.ADMIN_KEY || 'coolsjc',
  PORT: process.env.PORT || 5834,
  CONFIG_DIR: path.join(__dirname, '../data'),
  get CONFIG_FILE() {
    return path.join(this.CONFIG_DIR, 'config.json')
  }
}

// 确保配置目录存在
export async function ensureConfigDir() {
  try {
    await fs.access(CONFIG.CONFIG_DIR)
  } catch {
    await fs.mkdir(CONFIG.CONFIG_DIR, { recursive: true })
  }
}

// Cookie解析中间件
export function cookieParser(req, res, next) {
  const cookies = {}
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = decodeURIComponent(value)
      }
    })
  }
  req.cookies = cookies
  next()
}

// 错误处理中间件
export function errorHandler(err, req, res, next) {
  console.error('服务器错误:', err)
  res.status(500).json({ 
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
} 