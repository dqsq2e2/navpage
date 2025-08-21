import React, { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import ServiceGrid from './components/ServiceGrid'
import SystemMonitor from './components/SystemMonitor'
import Login from './components/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { configService } from './utils/configService'
import './App.css'

// 主应用组件 (需要认证)
const MainApp: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const { logout } = useAuth()

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    // 初始化配置服务
    const initApp = async () => {
      try {
        console.log('App initialized successfully')
      } catch (error) {
        console.error('Failed to initialize app:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initApp()

    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#00d4ff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>服务器导航面板</div>
        <div style={{ fontSize: '1rem', opacity: 0.7 }}>正在加载...</div>
        <div style={{
          width: '200px',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          marginTop: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #0099cc)',
            borderRadius: '2px',
            animation: 'loading 1.5s ease-in-out infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="app">
      {/* 背景动画 */}
      <div className="background-animation">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      {/* 主内容区 */}
      <main className="main-content">
        {/* 顶部导航栏 - 分布在搜索栏两边 */}
        <div className="top-nav">
          <div className="nav-left">
            <div className="logo">
              <div className="logo-icon">🚀</div>
              <h1>服务器导航面板</h1>
            </div>
          </div>
          
          {/* 搜索栏居中 */}
          <div className="search-section">
            <SearchBar />
          </div>
          
          <div className="nav-right">
            <div className="time-display">
              <div className="date">
                {currentTime.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })}
              </div>
              <div className="time">
                {currentTime.toLocaleTimeString('zh-CN')}
              </div>
            </div>
            <button 
              className="logout-button"
              onClick={handleLogout}
              title="退出登录"
            >
              <span className="logout-icon">🚪</span>
              退出
            </button>
          </div>
        </div>

        {/* 内容网格 */}
        <div className="content-grid">
          {/* 服务面板 */}
          <section className="services-section">
            <h2 className="section-title">
              <span className="title-icon">🔧</span>
              服务导航
              <button
                onClick={() => window.location.href = '/settings.html'}
                className="settings-button"
                title="打开设置"
              >
                ⚙️
              </button>
            </h2>
            <ServiceGrid />
          </section>

          {/* 系统监控 */}
          <section className="monitor-section">
            <SystemMonitor />
          </section>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="footer">
        <div className="footer-content">
          <p>© 2025 服务器导航面板 | 科技驱动未来</p>
          <div className="status-indicator">
            <span className="status-dot animate-pulse"></span>
            系统运行正常
          </div>
        </div>
      </footer>
    </div>
  )
}

// 认证包装组件
const AuthenticatedApp: React.FC = () => {
  const { authState } = useAuth()

  // 显示加载状态
  if (authState.loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#00d4ff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>验证认证状态</div>
        <div style={{ fontSize: '1rem', opacity: 0.7 }}>请稍候...</div>
        <div style={{
          width: '200px',
          height: '4px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '2px',
          marginTop: '1rem',
          overflow: 'hidden'
        }}>
          <div style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, #00d4ff, #0099cc)',
            borderRadius: '2px',
            animation: 'loading 1.5s ease-in-out infinite'
          }}></div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    )
  }

  // 根据认证状态显示界面
  if (!authState.isAuthenticated) {
    return <Login />
  }

  return <MainApp />
}

// 主应用入口
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App 