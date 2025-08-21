import fs from 'fs/promises'
import { keyManager } from './keyManager.js'

// 基于用户密钥的配置存储辅助函数
export async function loadUserConfig(userKey) {
  try {
    const configPath = await keyManager.getKeyConfigPath(userKey)
    if (!configPath) {
      throw new Error('无效的用户密钥')
    }
    
    const data = await fs.readFile(configPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // 如果文件不存在或读取失败，返回默认配置
    return {
      searchEngines: [],
      searchHistory: [],
      services: [],
      categories: [],
      settings: {
        theme: 'light',
        language: 'zh-CN'
      },
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    }
  }
}

export async function saveUserConfig(userKey, config) {
  try {
    const configPath = await keyManager.getKeyConfigPath(userKey)
    if (!configPath) {
      throw new Error('无效的用户密钥')
    }
    
    config.lastUpdate = new Date().toISOString()
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8')
  } catch (error) {
    console.error('保存用户配置失败:', error)
    throw error
  }
}

// 配置API处理函数
export async function handleGetConfig(req, res) {
  try {
    const config = await loadUserConfig(req.userKey)
    res.json(config)
  } catch (error) {
    console.error('获取配置失败:', error)
    res.status(500).json({ error: '获取配置失败' })
  }
}

export async function handleSaveConfig(req, res) {
  try {
    const config = req.body
    
    // 验证配置格式
    if (!config || typeof config !== 'object') {
      return res.status(400).json({ error: '配置格式错误' })
    }
    
    await saveUserConfig(req.userKey, config)
    res.json({ message: '配置保存成功' })
  } catch (error) {
    console.error('保存配置失败:', error)
    res.status(500).json({ error: '保存配置失败' })
  }
}

// 搜索引擎配置
export async function handleGetSearchEngines(req, res) {
  try {
    const config = await loadUserConfig(req.userKey)
    res.json({ searchEngines: config.searchEngines || [] })
  } catch (error) {
    console.error('获取搜索引擎配置失败:', error)
    res.status(500).json({ error: '获取搜索引擎配置失败' })
  }
}

export async function handleSaveSearchEngines(req, res) {
  try {
    const { searchEngines } = req.body
    
    if (!Array.isArray(searchEngines)) {
      return res.status(400).json({ error: '搜索引擎配置格式错误' })
    }
    
    const config = await loadUserConfig(req.userKey)
    config.searchEngines = searchEngines
    await saveUserConfig(req.userKey, config)
    
    res.json({ message: '搜索引擎配置保存成功' })
  } catch (error) {
    console.error('保存搜索引擎配置失败:', error)
    res.status(500).json({ error: '保存搜索引擎配置失败' })
  }
}

// 服务配置
export async function handleGetServices(req, res) {
  try {
    const config = await loadUserConfig(req.userKey)
    res.json({ services: config.services || [] })
  } catch (error) {
    console.error('获取服务配置失败:', error)
    res.status(500).json({ error: '获取服务配置失败' })
  }
}

export async function handleSaveServices(req, res) {
  try {
    const { services } = req.body
    
    if (!Array.isArray(services)) {
      return res.status(400).json({ error: '服务配置格式错误' })
    }
    
    const config = await loadUserConfig(req.userKey)
    config.services = services
    await saveUserConfig(req.userKey, config)
    
    res.json({ message: '服务配置保存成功' })
  } catch (error) {
    console.error('保存服务配置失败:', error)
    res.status(500).json({ error: '保存服务配置失败' })
  }
}

// 分类配置
export async function handleGetCategories(req, res) {
  try {
    const config = await loadUserConfig(req.userKey)
    res.json({ categories: config.categories || [] })
  } catch (error) {
    console.error('获取分类配置失败:', error)
    res.status(500).json({ error: '获取分类配置失败' })
  }
}

export async function handleSaveCategories(req, res) {
  try {
    const { categories } = req.body
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: '分类配置格式错误' })
    }
    
    const config = await loadUserConfig(req.userKey)
    config.categories = categories
    await saveUserConfig(req.userKey, config)
    
    res.json({ message: '分类配置保存成功' })
  } catch (error) {
    console.error('保存分类配置失败:', error)
    res.status(500).json({ error: '保存分类配置失败' })
  }
}

// 搜索历史
export async function handleGetSearchHistory(req, res) {
  try {
    const config = await loadUserConfig(req.userKey)
    res.json({ searchHistory: config.searchHistory || [] })
  } catch (error) {
    console.error('获取搜索历史失败:', error)
    res.status(500).json({ error: '获取搜索历史失败' })
  }
}

export async function handleSaveSearchHistory(req, res) {
  try {
    const { searchHistory } = req.body
    
    if (!Array.isArray(searchHistory)) {
      return res.status(400).json({ error: '搜索历史格式错误' })
    }
    
    const config = await loadUserConfig(req.userKey)
    config.searchHistory = searchHistory
    await saveUserConfig(req.userKey, config)
    
    res.json({ message: '搜索历史保存成功' })
  } catch (error) {
    console.error('保存搜索历史失败:', error)
    res.status(500).json({ error: '保存搜索历史失败' })
  }
}

// 导出配置
export async function handleExportConfig(req, res) {
  try {
    const config = await loadUserConfig(req.userKey)
    
    // 设置响应头以触发下载
    const filename = `config_export_${new Date().toISOString().split('T')[0]}.json`
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/json')
    
    res.json(config)
  } catch (error) {
    console.error('导出配置失败:', error)
    res.status(500).json({ error: '导出配置失败' })
  }
}

// 导入配置
export async function handleImportConfig(req, res) {
  try {
    const importedConfig = req.body
    
    // 验证导入的配置格式
    if (!importedConfig || typeof importedConfig !== 'object') {
      return res.status(400).json({ error: '导入的配置格式错误' })
    }
    
    // 获取当前配置
    const currentConfig = await loadUserConfig(req.userKey)
    
    // 合并配置，保留当前配置的元数据
    const mergedConfig = {
      ...currentConfig,
      ...importedConfig,
      createdAt: currentConfig.createdAt, // 保留创建时间
      lastUpdate: new Date().toISOString() // 更新修改时间
    }
    
    await saveUserConfig(req.userKey, mergedConfig)
    
    res.json({ 
      message: '配置导入成功',
      importedAt: mergedConfig.lastUpdate
    })
  } catch (error) {
    console.error('导入配置失败:', error)
    res.status(500).json({ error: '导入配置失败' })
  }
}

// 重置配置
export async function handleResetConfig(req, res) {
  try {
    const defaultConfig = {
      searchEngines: [],
      searchHistory: [],
      services: [],
      categories: [],
      settings: {
        theme: 'light',
        language: 'zh-CN'
      },
      createdAt: new Date().toISOString(),
      lastUpdate: new Date().toISOString()
    }
    
    await saveUserConfig(req.userKey, defaultConfig)
    
    res.json({ 
      message: '配置重置成功',
      resetAt: defaultConfig.lastUpdate
    })
  } catch (error) {
    console.error('重置配置失败:', error)
    res.status(500).json({ error: '重置配置失败' })
  }
} 