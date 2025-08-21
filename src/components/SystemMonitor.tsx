import React, { useState, useEffect } from 'react'
import './SystemMonitor.css'

interface SystemStats {
  cpu: {
    usage: number | null
    cores: number | null
    model: string | null
    coreUsage: (number | null)[]
  }
  memory: {
    total: number | null
    used: number | null
    available: number | null
    cached: number | null
    buffers: number | null
  }
  network: {
    rx: number | null
    tx: number | null
  }
  disk: {
    readSpeed: number | null
    writeSpeed: number | null
    total: number | null
    used: number | null
  }
  system?: {
    uptime: number | null
    platform: string | null
    bootTime: number | null
    startupTime?: string | null
  }
}

const SystemMonitor: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    cpu: {
      usage: 0,
      cores: 4,
      model: '获取中...',
      coreUsage: [0, 0, 0, 0]
    },
    memory: {
      total: 8,
      used: 3.5,
      available: 4.5,
      cached: 1.2,
      buffers: 0.3
    },
    network: {
      rx: 0,
      tx: 0
    },
    disk: {
      readSpeed: 0,
      writeSpeed: 0,
      total: 256,
      used: 128
    }
  })

  const [isConnected, setIsConnected] = useState(false)
  const [wsConnectionAttempts, setWsConnectionAttempts] = useState(0)
  
  // 系统启动时间和运行时间状态
  const [systemUptime, setSystemUptime] = useState<number>(0)
  const [startupTime, setStartupTime] = useState<Date | null>(null)



  const [isMemoryDetailsCollapsed, setIsMemoryDetailsCollapsed] = useState(true)
  const [isCpuDetailsCollapsed, setIsCpuDetailsCollapsed] = useState(true)

  // 模拟实时数据更新
  useEffect(() => {
    let interval: any

    const updateStats = () => {
      try {
        setStats((prevStats: SystemStats) => ({
          ...prevStats,
          cpu: {
            ...prevStats.cpu,
            usage: Math.random() * 15 + 1,
            coreUsage: (prevStats.cpu.coreUsage || []).map(() => Math.random() * 20)
          },
          memory: {
            ...prevStats.memory,
            used: (prevStats.memory.total || 8) * (0.3 + Math.random() * 0.2),
            cached: (prevStats.memory.total || 8) * (0.1 + Math.random() * 0.1)
          },
          network: {
            rx: Math.random() * 1000,
            tx: Math.random() * 500
          },
          disk: {
            readSpeed: Math.random() * 50 + 10,
            writeSpeed: Math.random() * 30 + 5,
            total: 500,
            used: 250 + Math.random() * 50
          }
        }))
      } catch (error) {
        console.error('更新统计数据失败:', error)
      }
    }

    // 尝试连接后端API
    const connectToAPI = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

        const response = await fetch('/api/system-stats', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          if (data && typeof data === 'object') {
            setStats(data)
            setIsConnected(true)
            
            // 更新系统启动时间和运行时间
            if (data.system && data.system.uptime) {
              setSystemUptime(data.system.uptime)
              // 使用后端提供的启动时间，如果没有则计算
              if (data.system.bootTime) {
                setStartupTime(new Date(data.system.bootTime))
              } else {
                // 计算启动时间（备用方案）
                const now = new Date()
                const startup = new Date(now.getTime() - data.system.uptime * 1000)
                setStartupTime(startup)
              }
            }
            return
          }
        }
        
        throw new Error(`API 响应错误: ${response.status}`)
      } catch (error) {
        console.warn('API 连接失败，使用模拟数据:', error)
        setIsConnected(false)
        updateStats() // 使用模拟数据
      }
    }

    // 延迟启动，避免初始化时阻塞
    const startMonitoring = () => {
      connectToAPI()
      interval = setInterval(() => {
        if (isConnected) {
          connectToAPI()
        } else {
          updateStats()
        }
      }, 3000)
    }

    // 延迟100ms启动监控
    const startTimeout = setTimeout(startMonitoring, 100)

    // 更新系统运行时间（每秒递增）
    const uptimeTimer = setInterval(() => {
      setSystemUptime(prev => prev + 1)
    }, 1000)

    return () => {
      clearTimeout(startTimeout)
      if (interval) {
        clearInterval(interval)
      }
      clearInterval(uptimeTimer)
    }
  }, [isConnected])

  // 安全的数字格式化
  const safeToFixed = (value: number | null | undefined, decimals: number = 1): string => {
    const num = value || 0
    return num.toFixed(decimals)
  }

  // 安全的百分比计算
  const safePercentage = (used: number | null | undefined, total: number | null | undefined): number => {
    if (!used || !total || total === 0) return 0
    return (used / total) * 100
  }

  // 安全的数值处理
  const safeValue = (value: number | null | undefined, defaultValue: number = 0): number => {
    return value !== null && value !== undefined ? value : defaultValue
  }

  // 格式化字节数
  const formatBytes = (bytes: number | null | undefined): string => {
    const value = safeValue(bytes)
    if (value === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(value) / Math.log(k))
    return parseFloat((value / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // 格式化时间
  const formatUptime = (seconds: number | null | undefined): string => {
    const value = safeValue(seconds)
    const days = Math.floor(value / 86400)
    const hours = Math.floor((value % 86400) / 3600)
    const minutes = Math.floor((value % 3600) / 60)
    const secs = Math.floor(value % 60)
    return `${days}天${hours}小时${minutes}分钟${secs}秒`
  }

  // 获取使用率颜色
  const getUsageColor = (percentage: number): string => {
    const safe = safeValue(percentage)
    if (safe < 50) return '#4caf50'
    if (safe < 80) return '#ff9800'
    return '#f44336'
  }

  // 安全获取CPU使用率
  const cpuUsage = safeValue(stats.cpu.usage)
  
  // 内存计算：后端已经正确计算了使用量，直接使用
  const memoryTotal = safeValue(stats.memory.total, 0)
  const memoryCached = safeValue(stats.memory.cached, 0)
  const memoryUsedActual = safeValue(stats.memory.used, 0) // 后端已计算正确的使用量
  
  const memoryUsagePercent = safePercentage(memoryUsedActual, memoryTotal)
  const memoryCachePercent = safePercentage(memoryCached, memoryTotal)
  const memoryAvailable = safeValue(stats.memory.available, memoryTotal - memoryUsedActual)

  return (
    <div className="system-monitor">
      {/* 系统监控标题和运行信息 */}
      <div className="monitor-header">
        <div className="header-left">
          <h2 className="monitor-title">📊 系统监控</h2>
          <div className="connection-status">
            <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
              {isConnected ? '🟢' : '🔴'}
            </span>
            <span className="status-text">
              {isConnected ? '实时监控' : '模拟数据'}
            </span>
          </div>
        </div>
        
        <div className="header-right">
          <div className="system-info">
            <div className="system-info-item">
              <span className="info-label">启动时间</span>
              <span className="info-value">
                {startupTime ? startupTime.toLocaleString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : '获取中...'}
              </span>
            </div>
            <div className="system-info-item">
              <span className="info-label">运行时间</span>
              <span className="info-value">{formatUptime(systemUptime)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CPU 监控 */}
      <div className="monitor-card glass">
        <div className="card-header">
          <h3>💻 CPU 使用率</h3>
          <span className="usage-badge" style={{ color: getUsageColor(cpuUsage) }}>
            {safeToFixed(cpuUsage)}%
          </span>
        </div>
        
        <div className="card-content">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ 
                width: `${cpuUsage}%`,
                backgroundColor: getUsageColor(cpuUsage)
              }}
            />
          </div>

          <div className="cpu-details">
            <div className="cpu-details-header" onClick={() => setIsCpuDetailsCollapsed(!isCpuDetailsCollapsed)}>
              <h4>详细信息</h4>
              <span className={`collapse-icon ${isCpuDetailsCollapsed ? 'collapsed' : ''}`}>
                {isCpuDetailsCollapsed ? '▶' : '▼'}
              </span>
            </div>
            {!isCpuDetailsCollapsed && (
              <div className="cpu-details-content">
                <div className="cpu-info">
                  <div className="info-item">
                    <span className="label">核心数:</span>
                    <span className="value">{safeValue(stats.cpu.cores, 0)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">型号:</span>
                    <span className="value cpu-model">{stats.cpu.model || '未知'}</span>
                  </div>
                </div>

                <div className="core-usage-section">
                  <h5>核心负载</h5>
                  <div className="cores-grid">
                    {(stats.cpu.coreUsage || []).map((usage, index) => {
                      const safeUsage = safeValue(usage)
                      return (
                        <div key={index} className="core-item">
                          <div className="core-label">核心 {index + 1}:</div>
                          <div className="core-usage-bar">
                            <div 
                              className="core-fill"
                              style={{ 
                                width: `${safeUsage}%`,
                                backgroundColor: getUsageColor(safeUsage)
                              }}
                            />
                          </div>
                          <div className="core-value">{safeToFixed(safeUsage)}%</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 内存监控 */}
      <div className="monitor-card glass">
        <div className="card-header">
          <h3>⚡ 内存使用率</h3>
          <span className="usage-badge" style={{ color: getUsageColor(memoryUsagePercent) }}>
            {safeToFixed(memoryUsagePercent)}%
          </span>
        </div>
        
        <div className="card-content">
          {/* 分层内存进度条 */}
          <div className="memory-progress-container">
            <div className="memory-progress-bar">
              {/* 已使用内存 (绿色) */}
              <div 
                className="memory-progress-fill memory-used"
                style={{ 
                  width: `${memoryUsagePercent}%`
                }}
              />
              {/* 缓存内存 (黄色) */}
              <div 
                className="memory-progress-fill memory-cached"
                style={{ 
                  width: `${memoryCachePercent}%`,
                  left: `${memoryUsagePercent}%`
                }}
              />
            </div>
          </div>

          <div className="memory-details">
            <div className="memory-details-header" onClick={() => setIsMemoryDetailsCollapsed(!isMemoryDetailsCollapsed)}>
              <div className="memory-legend">
                <span className="legend-item"><span className="legend-color memory-used"></span>已用</span>
                <span className="legend-item"><span className="legend-color memory-cached"></span>缓存</span>
                <span className="legend-item"><span className="legend-color memory-available"></span>可用</span>
              </div>
              <span className={`collapse-icon ${isMemoryDetailsCollapsed ? 'collapsed' : ''}`}>
                {isMemoryDetailsCollapsed ? '▶' : '▼'}
              </span>
            </div>
            {!isMemoryDetailsCollapsed && (
              <div className="memory-items-grid">
                <div className="memory-item">
                  <span className="label">已用:</span>
                  <span className="value">{safeToFixed(memoryUsedActual, 2)} GB</span>
                </div>
                <div className="memory-item">
                  <span className="label">缓存:</span>
                  <span className="value">{safeToFixed(memoryCached, 2)} GB</span>
                </div>
                <div className="memory-item">
                  <span className="label">总计:</span>
                  <span className="value">{safeToFixed(memoryTotal, 2)} GB</span>
                </div>
                <div className="memory-item">
                  <span className="label">可用:</span>
                  <span className="value">{safeToFixed(memoryAvailable, 2)} GB</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* I/O信息监控 */}
      <div className="monitor-card glass">
        <div className="card-header">
          <h3>📈 数据传输</h3>
        </div>
        
        <div className="card-content">
          <div className="io-stats-container">
            <div className="io-section">
              <h4>🌐 网络流量</h4>
              <div className="network-stats">
                <div className="network-item">
                  <span className="label">接受:</span>
                  <span className="value">{formatBytes(stats.network.rx)}/s</span>
                </div>
                <div className="network-item">
                  <span className="label">发送:</span>
                  <span className="value">{formatBytes(stats.network.tx)}/s</span>
                </div>
              </div>
            </div>
            
            <div className="io-section">
              <h4>💾 磁盘 I/O</h4>
              <div className="disk-stats">
                <div className="disk-item">
                  <span className="label">读取:</span>
                  <span className="value">{formatBytes((stats.disk?.readSpeed || 0) * 1024)}/s</span>
                </div>
                <div className="disk-item">
                  <span className="label">写入:</span>
                  <span className="value">{formatBytes((stats.disk?.writeSpeed || 0) * 1024)}/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemMonitor 