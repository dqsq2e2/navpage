import { apiClient } from './api'

export class ConfigService {
  private static instance: ConfigService

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService()
    }
    return ConfigService.instance
  }

  // 搜索引擎管理
  async getSearchEngines(): Promise<any[]> {
    try {
      return await apiClient.getSearchEngines()
    } catch (error) {
      console.error('Failed to get search engines from API:', error)
      // 返回默认搜索引擎而不是localStorage
      return [
        { name: '百度', url: 'https://www.baidu.com/s?wd={query}', icon: '🔍', iconUrl: '' },
        { name: 'Bing', url: 'https://www.bing.com/search?q={query}', icon: '🔎', iconUrl: '' }
      ]
    }
  }

  async saveSearchEngines(engines: any[]): Promise<void> {
    try {
      await apiClient.saveSearchEngines(engines)
    } catch (error) {
      console.error('Failed to save search engines to API:', error)
      throw error
    }
  }

  // 服务管理
  async getServices(): Promise<any[]> {
    try {
      return await apiClient.getServices()
    } catch (error) {
      console.error('Failed to get services from API:', error)
      return []
    }
  }

  async saveServices(services: any[]): Promise<void> {
    try {
      await apiClient.saveServices(services)
    } catch (error) {
      console.error('Failed to save services to API:', error)
      throw error
    }
  }

  // 分类管理
  async getCategories(): Promise<any[]> {
    try {
      return await apiClient.getCategories()
    } catch (error) {
      console.error('Failed to get categories from API:', error)
      // 返回默认分类而不是localStorage
      return [
        { name: '开发工具', icon: '🔧', color: '#00d4ff' },
        { name: '系统管理', icon: '⚙️', color: '#ff6b35' },
        { name: '监控工具', icon: '📊', color: '#00ff88' },
        { name: '存储服务', icon: '💾', color: '#9b59b6' },
        { name: '媒体服务', icon: '🎬', color: '#e74c3c' },
        { name: '其他', icon: '📦', color: '#95a5a6' }
      ]
    }
  }

  async saveCategories(categories: any[]): Promise<void> {
    try {
      await apiClient.saveCategories(categories)
    } catch (error) {
      console.error('Failed to save categories to API:', error)
      throw error
    }
  }

  // 搜索历史管理（保留localStorage作为临时缓存）
  async getSearchHistory(): Promise<string[]> {
    try {
      return await apiClient.getSearchHistory()
    } catch (error) {
      console.warn('Failed to get search history from API, using localStorage cache:', error)
      const saved = localStorage.getItem('searchHistory')
      return saved ? JSON.parse(saved) : []
    }
  }

  async saveSearchHistory(history: string[]): Promise<void> {
    try {
      await apiClient.saveSearchHistory(history)
    } catch (error) {
      console.warn('Failed to save search history to API, caching locally:', error)
      localStorage.setItem('searchHistory', JSON.stringify(history))
    }
  }

  // 完整配置管理
  async getFullConfig(): Promise<any> {
    try {
      return await apiClient.getConfig()
    } catch (error) {
      console.error('Failed to get full config from API:', error)
      // 返回默认配置而不是localStorage
      const [searchEngines, services, categories, searchHistory] = await Promise.all([
        this.getSearchEngines(),
        this.getServices(), 
        this.getCategories(),
        this.getSearchHistory()
      ])

      return {
        searchEngines,
        services,
        categories,
        searchHistory,
        lastUpdate: new Date().toISOString()
      }
    }
  }

  async saveFullConfig(config: any): Promise<void> {
    try {
      await apiClient.saveConfig(config)
    } catch (error) {
      console.error('Failed to save full config to API:', error)
      throw error
    }
  }

  // 清除本地缓存（仅搜索历史）
  async clearLocalCache(): Promise<void> {
    localStorage.removeItem('searchHistory')
    console.log('Local cache cleared')
  }
}

// 导出单例
export const configService = ConfigService.getInstance() 