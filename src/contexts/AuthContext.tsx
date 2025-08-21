import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '../utils/api'
import type { AuthState, AuthContextType, SystemStatusResponse } from '../types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    loading: true,
    error: undefined
  })

  // 验证现有认证状态
  const verifyAuth = async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: undefined }))
      
      const response = await apiClient.verifyAuth()
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isAdmin: response.isAdmin,
        keyId: response.keyId,
        loading: false
      }))
      
      return true
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        loading: false,
        error: error instanceof Error ? error.message : '认证验证失败'
      }))
      
      return false
    }
  }

  // 登录
  const login = async (key: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: undefined }))
      
      const response = await apiClient.login({ key })
      
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        token: response.token,
        isAdmin: response.isAdmin,
        keyId: response.keyId,
        loading: false
      }))
      
      return true
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        loading: false,
        error: error instanceof Error ? error.message : '登录失败'
      }))
      
      return false
    }
  }

  // 创建密钥
  const createKey = async (key: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: undefined }))
      
      const response = await apiClient.createKey({ key })
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: undefined
      }))
      
      return true
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : '创建密钥失败'
      }))
      
      return false
    }
  }

  // 检查系统状态
  const checkSystemStatus = async (): Promise<SystemStatusResponse | null> => {
    try {
      return await apiClient.checkSystemStatus()
    } catch (error) {
      console.error('检查系统状态失败:', error)
      return null
    }
  }

  // 退出登录
  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setAuthState({
        isAuthenticated: false,
        loading: false,
        error: undefined
      })
    }
  }

  // 组件挂载时验证认证状态
  useEffect(() => {
    verifyAuth()
  }, [])

  const value: AuthContextType = {
    authState,
    login,
    createKey,
    logout,
    verifyAuth,
    checkSystemStatus
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 