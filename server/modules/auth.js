import crypto from 'crypto'
import { keyManager } from './keyManager.js'

// 认证会话存储 (生产环境建议使用Redis)
const sessions = new Map()

// 生成会话token
export function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

// 认证中间件
export function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.userToken
  
  if (!token) {
    return res.status(401).json({ error: '需要用户认证' })
  }
  
  const session = sessions.get(token)
  if (!session || Date.now() > session.expires) {
    if (session) sessions.delete(token)
    return res.status(401).json({ error: '会话已过期' })
  }
  
  // 延长会话时间
  session.expires = Date.now() + 24 * 60 * 60 * 1000 // 24小时
  
  // 将用户密钥信息添加到请求对象
  req.userKey = session.userKey
  req.keyData = session.keyData
  
  next()
}

// 管理员权限中间件
export function requireAdmin(req, res, next) {
  if (!req.keyData || !req.keyData.isAdmin) {
    return res.status(403).json({ error: '需要管理员权限' })
  }
  next()
}

// 登录处理
export async function handleLogin(req, res) {
  try {
    const { key } = req.body
    
    if (!key || !key.trim()) {
      return res.status(400).json({ error: '密钥不能为空' })
    }
    
    // 验证密钥
    const keyData = await keyManager.validateKey(key.trim())
    if (!keyData) {
      return res.status(401).json({ error: '密钥无效' })
    }
    
    const token = generateToken()
    const expires = Date.now() + 24 * 60 * 60 * 1000 // 24小时
    
    sessions.set(token, { 
      expires,
      userKey: key.trim(),
      keyData
    })
    
    // 设置cookie
    res.cookie('userToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24小时
      sameSite: 'lax',
      path: '/'
    })
    
    res.json({ 
      message: '认证成功',
      token,
      expires: new Date(expires).toISOString(),
      isAdmin: keyData.isAdmin,
      keyId: keyData.keyHash.substring(0, 16)
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: '登录失败' })
  }
}

// 创建密钥处理
export async function handleCreateKey(req, res) {
  try {
    const { key, keyName } = req.body
    
    if (!key || !key.trim()) {
      return res.status(400).json({ error: '密钥不能为空' })
    }
    
    if (key.trim().length < 6) {
      return res.status(400).json({ error: '密钥长度至少6个字符' })
    }
    
    // 验证密钥名称长度
    if (keyName && keyName.trim() && keyName.trim().length > 50) {
      return res.status(400).json({ error: '密钥名称不能超过50个字符' })
    }
    
    const keyData = await keyManager.createKey(key.trim(), keyName?.trim() || null)
    
    res.json({ 
      message: '密钥创建成功',
      isAdmin: keyData.isAdmin,
      keyId: keyData.keyHash.substring(0, 16)
    })
  } catch (error) {
    if (error.message === '密钥已存在') {
      return res.status(409).json({ error: '密钥已存在' })
    }
    
    console.error('Create key error:', error)
    res.status(500).json({ error: '创建密钥失败' })
  }
}

// 登出处理
export async function handleLogout(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.userToken
  
  if (token) {
    sessions.delete(token)
  }
  
  res.clearCookie('userToken')
  res.json({ message: '退出成功' })
}

// 验证认证状态
export async function handleVerify(req, res) {
  res.json({ 
    message: '认证有效', 
    authenticated: true,
    isAdmin: req.keyData.isAdmin,
    keyId: req.keyData.keyHash.substring(0, 16)
  })
}

// 检查系统初始化状态
export async function handleSystemStatus(req, res) {
  try {
    const isInitialized = await keyManager.isSystemInitialized()
    res.json({ 
      initialized: isInitialized,
      needsSetup: !isInitialized
    })
  } catch (error) {
    console.error('System status error:', error)
    res.status(500).json({ error: '获取系统状态失败' })
  }
}

// 获取所有密钥（管理员专用）
export async function handleGetAllKeys(req, res) {
  try {
    const keys = await keyManager.getAllKeys(req.userKey)
    res.json({ keys })
  } catch (error) {
    if (error.message === '权限不足') {
      return res.status(403).json({ error: '权限不足' })
    }
    
    console.error('Get keys error:', error)
    res.status(500).json({ error: '获取密钥列表失败' })
  }
}

// 删除密钥（管理员专用）
export async function handleDeleteKey(req, res) {
  try {
    const { keyId } = req.params
    
    if (!keyId) {
      return res.status(400).json({ error: '密钥ID不能为空' })
    }
    
    const deletedKey = await keyManager.deleteKeyById(keyId, req.userKey)
    
    res.json({ 
      message: '密钥删除成功',
      deletedKeyId: deletedKey.keyHash.substring(0, 16)
    })
  } catch (error) {
    if (error.message === '权限不足') {
      return res.status(403).json({ error: '权限不足' })
    }
    
    if (error.message === '密钥不存在') {
      return res.status(404).json({ error: '密钥不存在' })
    }
    
    if (error.message === '不能删除自己的密钥') {
      return res.status(400).json({ error: '不能删除自己的密钥' })
    }
    
    console.error('Delete key error:', error)
    res.status(500).json({ error: '删除密钥失败' })
  }
} 