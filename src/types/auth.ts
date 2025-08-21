export interface AuthState {
  isAuthenticated: boolean
  loading: boolean
  error?: string
  token?: string
  isAdmin?: boolean
  keyId?: string
}

export interface LoginRequest {
  key: string
}

export interface LoginResponse {
  message: string
  token: string
  expires: string
  isAdmin: boolean
  keyId: string
}

export interface CreateKeyRequest {
  key: string
  keyName?: string
}

export interface CreateKeyResponse {
  message: string
  isAdmin: boolean
  keyId: string
}

export interface SystemStatusResponse {
  initialized: boolean
  needsSetup: boolean
}

export interface AuthContextType {
  authState: AuthState
  login: (key: string) => Promise<boolean>
  createKey: (key: string) => Promise<boolean>
  logout: () => Promise<void>
  verifyAuth: () => Promise<boolean>
  checkSystemStatus: () => Promise<SystemStatusResponse | null>
} 