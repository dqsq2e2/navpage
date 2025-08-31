import path from 'path'
import fs from 'fs/promises'
import crypto from 'crypto'
import { CONFIG } from './utils.js'

// 密钥数据文件路径
const KEYS_FILE = path.join(CONFIG.CONFIG_DIR, 'keys.json')

// 密钥数据结构
export class KeyManager {
  constructor() {
    this.keys = new Map() // keyHash -> { keyHash, createdAt, isAdmin, configPath }
    this.loaded = false
  }

  // 加载密钥数据
  async loadKeys() {
    try {
      const data = await fs.readFile(KEYS_FILE, 'utf8')
      const keysData = JSON.parse(data)
      
      this.keys.clear()
      for (const keyData of keysData.keys || []) {
        this.keys.set(keyData.keyHash, keyData)
      }
      
      this.loaded = true
    } catch (error) {
      // 文件不存在或无法读取，初始化空的密钥存储
      this.keys.clear()
      this.loaded = true
    }
  }

  // 保存密钥数据
  async saveKeys() {
    const keysData = {
      keys: Array.from(this.keys.values()),
      lastUpdated: new Date().toISOString()
    }
    
    await fs.writeFile(KEYS_FILE, JSON.stringify(keysData, null, 2))
  }

  // 生成密钥哈希
  generateKeyHash(key) {
    return crypto.createHash('sha256').update(key).digest('hex')
  }

  // 检查密钥是否存在
  async keyExists(key) {
    if (!this.loaded) await this.loadKeys()
    const keyHash = this.generateKeyHash(key)
    return this.keys.has(keyHash)
  }

  // 创建新密钥
  async createKey(key, keyName = null) {
    if (!this.loaded) await this.loadKeys()
    
    // 检查密钥是否已存在
    if (await this.keyExists(key)) {
      throw new Error('密钥已存在')
    }
    
    const keyHash = this.generateKeyHash(key)
    const isFirstKey = this.keys.size === 0
    
    const keyData = {
      keyHash,
      keyName: keyName, // 可选的密钥名称
      createdAt: new Date().toISOString(),
      isAdmin: isFirstKey, // 第一个密钥自动获得管理员权限
      configPath: `config_${keyHash.substring(0, 16)}.json` // 每个密钥对应独立的配置文件
    }
    
    this.keys.set(keyHash, keyData)
    await this.saveKeys()
    
    // 为新密钥创建独立的配置文件
    await this.initializeKeyConfig(keyHash)
    
    return keyData
  }

  // 验证密钥
  async validateKey(key) {
    if (!this.loaded) await this.loadKeys()
    const keyHash = this.generateKeyHash(key)
    return this.keys.get(keyHash) || null
  }

  // 删除密钥（仅管理员可操作，且不能删除自己）
  async deleteKey(keyToDelete, currentKey) {
    if (!this.loaded) await this.loadKeys()
    
    const currentKeyData = await this.validateKey(currentKey)
    if (!currentKeyData || !currentKeyData.isAdmin) {
      throw new Error('权限不足')
    }
    
    const keyHashToDelete = this.generateKeyHash(keyToDelete)
    const currentKeyHash = this.generateKeyHash(currentKey)
    
    if (keyHashToDelete === currentKeyHash) {
      throw new Error('不能删除自己的密钥')
    }
    
    const keyData = this.keys.get(keyHashToDelete)
    if (!keyData) {
      throw new Error('密钥不存在')
    }
    
    // 删除密钥对应的配置文件
    try {
      const configPath = path.join(CONFIG.CONFIG_DIR, keyData.configPath)
      await fs.unlink(configPath)
    } catch (error) {
      // 配置文件可能不存在，忽略错误
    }
    
    this.keys.delete(keyHashToDelete)
    await this.saveKeys()
    
    return keyData
  }

  // 通过keyId删除密钥（管理员专用）
  async deleteKeyById(keyId, currentKey) {
    if (!this.loaded) await this.loadKeys()
    
    const currentKeyData = await this.validateKey(currentKey)
    if (!currentKeyData || !currentKeyData.isAdmin) {
      throw new Error('权限不足')
    }
    
    // 验证keyId参数
    if (!keyId || keyId === 'null' || keyId === 'undefined') {
      throw new Error('无效的密钥ID')
    }
    
    // 查找匹配的密钥
    let keyDataToDelete = null
    for (const [keyHash, keyData] of this.keys.entries()) {
      if (keyData.keyHash && keyData.keyHash.substring(0, 16) === keyId) {
        keyDataToDelete = keyData
        break
      }
    }
    
    if (!keyDataToDelete) {
      throw new Error('密钥不存在')
    }
    
    const currentKeyHash = this.generateKeyHash(currentKey)
    if (keyDataToDelete.keyHash === currentKeyHash) {
      throw new Error('不能删除自己的密钥')
    }
    
    // 删除密钥对应的配置文件
    try {
      const configPath = path.join(CONFIG.CONFIG_DIR, keyDataToDelete.configPath)
      await fs.unlink(configPath)
    } catch (error) {
      // 配置文件可能不存在，忽略错误
    }
    
    this.keys.delete(keyDataToDelete.keyHash)
    await this.saveKeys()
    
    return keyDataToDelete
  }

  // 获取所有密钥信息（仅管理员可查看，隐藏密钥哈希）
  async getAllKeys(currentKey) {
    if (!this.loaded) await this.loadKeys()
    
    const currentKeyData = await this.validateKey(currentKey)
    if (!currentKeyData || !currentKeyData.isAdmin) {
      throw new Error('权限不足')
    }
    
    const keys = Array.from(this.keys.values()).map(keyData => {
      // 确保keyHash存在且有效
      if (!keyData.keyHash) {
        return null;
      }
      
      const keyId = keyData.keyHash.substring(0, 16);
      
      return {
        id: keyId, // 只显示部分哈希作为ID
        keyName: keyData.keyName, // 密钥名称
        createdAt: keyData.createdAt,
        isAdmin: keyData.isAdmin,
        isCurrent: keyData.keyHash === this.generateKeyHash(currentKey)
      };
    }).filter(key => key !== null); // 过滤掉无效的密钥
    
    return keys;
  }

  // 为密钥初始化配置文件
  async initializeKeyConfig(keyHash) {
    const keyData = this.keys.get(keyHash)
    if (!keyData) return
    
    const configPath = path.join(CONFIG.CONFIG_DIR, keyData.configPath)
    
    // 检查配置文件是否已存在
    try {
      await fs.access(configPath)
      return // 文件已存在，不需要初始化
    } catch {
      // 文件不存在，创建默认配置
    }
    
    const defaultConfig = {
      searchEngines: [],
      services: [],
      categories: [],
      searchHistory: [],
      settings: {
        theme: 'light',
        language: 'zh-CN'
      },
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }
    
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2))
  }

  // 获取密钥对应的配置文件路径
  async getKeyConfigPath(key) {
    const keyData = await this.validateKey(key)
    if (!keyData) return null
    
    return path.join(CONFIG.CONFIG_DIR, keyData.configPath)
  }

  // 检查系统是否已初始化（是否存在任何密钥）
  async isSystemInitialized() {
    if (!this.loaded) await this.loadKeys()
    return this.keys.size > 0
  }
}

// 全局密钥管理器实例
export const keyManager = new KeyManager() 