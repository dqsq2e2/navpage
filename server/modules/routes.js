import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { getCachedSystemStats, getProcesses } from './system.js'
import { 
  authenticateUser, 
  requireAdmin,
  handleLogin, 
  handleCreateKey,
  handleLogout, 
  handleVerify,
  handleSystemStatus,
  handleGetAllKeys,
  handleDeleteKey
} from './auth.js'
import {
  handleGetConfig,
  handleSaveConfig,
  handleGetSearchEngines,
  handleSaveSearchEngines,
  handleGetServices,
  handleSaveServices,
  handleGetCategories,
  handleSaveCategories,
  handleGetSearchHistory,
  handleSaveSearchHistory,
  handleExportConfig,
  handleImportConfig,
  handleResetConfig
} from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function setupRoutes(app) {
  // 健康检查端点
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    })
  })

  // 系统状态检查（无需认证）
  app.get('/api/system/status', handleSystemStatus)

  // API路由：获取系统状态
  app.get('/api/system-stats', async (req, res) => {
    try {
      const stats = await getCachedSystemStats()
      if (stats) {
        res.json(stats)
      } else {
        res.status(500).json({ error: '无法获取系统信息' })
      }
    } catch (error) {
      console.error('API错误:', error)
      res.status(500).json({ error: '服务器内部错误' })
    }
  })

  // API路由：获取进程信息
  app.get('/api/processes', async (req, res) => {
    try {
      const topProcesses = await getProcesses()
      res.json(topProcesses)
    } catch (error) {
      console.error('获取进程信息失败:', error)
      res.status(500).json({ error: '无法获取进程信息' })
    }
  })

  // 认证API
  app.post('/api/auth/login', handleLogin)
  app.post('/api/auth/create-key', handleCreateKey)
  app.post('/api/auth/logout', authenticateUser, handleLogout)
  app.get('/api/auth/verify', authenticateUser, handleVerify)

  // 管理员API
  app.get('/api/admin/keys', authenticateUser, requireAdmin, handleGetAllKeys)
  app.delete('/api/admin/keys/:keyId', authenticateUser, requireAdmin, handleDeleteKey)

  // 配置管理 API（需要用户认证）
  app.get('/api/config', authenticateUser, handleGetConfig)
  app.post('/api/config', authenticateUser, handleSaveConfig)
  app.post('/api/config/reset', authenticateUser, handleResetConfig)

  // 单独的配置项API
  app.get('/api/config/search-engines', authenticateUser, handleGetSearchEngines)
  app.post('/api/config/search-engines', authenticateUser, handleSaveSearchEngines)

  app.get('/api/config/services', authenticateUser, handleGetServices)
  app.post('/api/config/services', authenticateUser, handleSaveServices)

  app.get('/api/config/categories', authenticateUser, handleGetCategories)
  app.post('/api/config/categories', authenticateUser, handleSaveCategories)

  app.get('/api/config/search-history', authenticateUser, handleGetSearchHistory)
  app.post('/api/config/search-history', authenticateUser, handleSaveSearchHistory)

  // 导出/导入API
  app.get('/api/config/export', authenticateUser, handleExportConfig)
  app.post('/api/config/import', authenticateUser, handleImportConfig)

  // 静态页面路由
  app.get('/auth', (req, res) => {
    const authPath = path.join(__dirname, '../../public/auth.html')
    res.sendFile(authPath)
  })

  app.get('/create-key', (req, res) => {
    const createKeyPath = path.join(__dirname, '../../public/create-key.html')
    res.sendFile(createKeyPath)
  })

  app.get('/admin/keys', authenticateUser, requireAdmin, (req, res) => {
    const adminKeysPath = path.join(__dirname, '../../public/admin-keys.html')
    res.sendFile(adminKeysPath)
  })

  // 设置页面路由 (需要认证)
  app.get('/settings.html', authenticateUser, (req, res) => {
    const settingsPath = path.join(__dirname, '../../public/settings.html')
    res.sendFile(settingsPath)
  })

  // 服务 public 目录中的静态文件
  const publicPath = path.join(__dirname, '../../public')
  app.use('/public', express.static(publicPath))

  // 在生产环境中服务静态文件 (在 API 路由之后)
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../../dist')
    app.use(express.static(distPath))
    
    // 处理 SPA 路由，所有非 API 和调试请求都返回 index.html
    app.get('*', (req, res) => {
      if (req.path === '/settings.html' || 
          req.path === '/auth' || req.path === '/create-key' || 
          req.path.startsWith('/admin/')) {
        return // 已在上面处理
      }
      res.sendFile(path.join(distPath, 'index.html'))
    })
  } else {
    // 开发环境也要服务静态文件
    app.use(express.static(path.join(__dirname, '../../')))
  }
} 