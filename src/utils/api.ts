import { 
  LoginRequest, 
  LoginResponse,
  CreateKeyRequest,
  CreateKeyResponse,
  SystemStatusResponse
} from '../types/auth'

// 获取API基础URL (支持不定端口)
const getApiBaseUrl = (): string => {
  // 检测是否在Docker容器环境中
  const isDocker = window.location.port === '5833' || window.location.hostname !== 'localhost'
  
  if (isDocker) {
    // Docker环境：前端和后端在同一容器，使用相对路径
    return '/api'
  } else {
    // 开发环境：前端和后端分离，使用完整URL
    const currentHost = window.location.hostname
    const apiPort = '5834' // 后端固定端口
    return `http://${currentHost}:${apiPort}/api`
  }
}

// API客户端类
class ApiClient {
  private baseUrl: string
  private token?: string

  constructor() {
    this.baseUrl = getApiBaseUrl()
    this.token = this.getStoredToken()
  }

  // 获取存储的token
  private getStoredToken(): string | undefined {
    // 从cookie中获取token (支持不定端口)
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'adminToken') {
        return decodeURIComponent(value)
      }
    }
    return undefined
  }

  // 设置token
  setToken(token: string) {
    this.token = token
  }

  // 清除token
  clearToken() {
    this.token = undefined
  }

  // 通用请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      credentials: 'include', // 包含cookies
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '网络错误' }))
      throw new Error(error.error || '请求失败')
    }

    return response.json()
  }

  // 认证API
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    this.setToken(response.token)
    return response
  }

  async createKey(data: CreateKeyRequest): Promise<CreateKeyResponse> {
    return this.request<CreateKeyResponse>('/auth/create-key', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async logout(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    })
    
    this.clearToken()
    return response
  }

  async verifyAuth(): Promise<{ authenticated: boolean; message: string; isAdmin: boolean; keyId: string }> {
    return this.request<{ authenticated: boolean; message: string; isAdmin: boolean; keyId: string }>('/auth/verify')
  }

  async checkSystemStatus(): Promise<SystemStatusResponse> {
    return this.request<SystemStatusResponse>('/system/status')
  }

  // 配置API
  async getConfig(): Promise<any> {
    return this.request<any>('/config')
  }

  async saveConfig(config: any): Promise<{ message: string }> {
    return this.request<{ message: string }>('/config', {
      method: 'POST',
      body: JSON.stringify(config),
    })
  }

  async getSearchEngines(): Promise<any[]> {
    const response = await this.request<{ searchEngines: any[] }>('/config/search-engines')
    return response.searchEngines || []
  }

  async saveSearchEngines(engines: any[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/config/search-engines', {
      method: 'POST',
      body: JSON.stringify({ searchEngines: engines }),
    })
  }

  async getServices(): Promise<any[]> {
    const response = await this.request<{ services: any[] }>('/config/services')
    return response.services || []
  }

  async saveServices(services: any[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/config/services', {
      method: 'POST',
      body: JSON.stringify({ services }),
    })
  }

  async getCategories(): Promise<any[]> {
    const response = await this.request<{ categories: any[] }>('/config/categories')
    return response.categories || []
  }

  async saveCategories(categories: any[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/config/categories', {
      method: 'POST',
      body: JSON.stringify({ categories }),
    })
  }

  async getSearchHistory(): Promise<string[]> {
    const response = await this.request<{ searchHistory: string[] }>('/config/search-history')
    return response.searchHistory || []
  }

  async saveSearchHistory(history: string[]): Promise<{ message: string }> {
    return this.request<{ message: string }>('/config/search-history', {
      method: 'POST',
      body: JSON.stringify({ searchHistory: history }),
    })
  }
}

// 导出单例
export const apiClient = new ApiClient() 