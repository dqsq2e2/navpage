import fs from 'fs/promises'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { CONFIG } from './utils.js'

const execAsync = promisify(exec)

// 磁盘I/O监控缓存
let diskIOCache = {
  lastRead: { readSectors: 0, writeSectors: 0, timestamp: 0 },
  currentRead: { readSectors: 0, writeSectors: 0, timestamp: 0 }
}

// 网络监控缓存
let networkCache = {
  lastRead: { rxBytes: 0, txBytes: 0, timestamp: 0 },
  currentRead: { rxBytes: 0, txBytes: 0, timestamp: 0 }
}

// 系统信息缓存
let systemCache = {
  lastUpdate: 0,
  data: null
}

// 获取内存信息
async function getHostMemInfo(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const filePath = path.join(hostRoot, "proc/meminfo")
    const meminfo = await fs.readFile(filePath, "utf8")
    
    const memTotal = parseInt(meminfo.match(/MemTotal:\s+(\d+)/)[1]) * 1024
    const memFree = parseInt(meminfo.match(/MemFree:\s+(\d+)/)[1]) * 1024
    const memAvailable = meminfo.match(/MemAvailable:\s+(\d+)/) ? 
      parseInt(meminfo.match(/MemAvailable:\s+(\d+)/)[1]) * 1024 : memFree
    const buffers = meminfo.match(/Buffers:\s+(\d+)/) ? 
      parseInt(meminfo.match(/Buffers:\s+(\d+)/)[1]) * 1024 : 0
    const cached = meminfo.match(/Cached:\s+(\d+)/) ? 
      parseInt(meminfo.match(/Cached:\s+(\d+)/)[1]) * 1024 : 0
    
    // 正确计算已使用内存：总内存 - 可用内存
    const memUsed = memTotal - memAvailable
    
    return {
      total: memTotal,
      used: memUsed,
      available: memAvailable,
      cached: cached,
      buffers: buffers
    }
  } catch (error) {
    console.error("Error reading memory information:", error)
    return null
  }
}

// 读取CPU信息
async function readHostCpuInfo(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const filePath = path.join(hostRoot, "proc/cpuinfo")
    const cpuinfo = await fs.readFile(filePath, "utf8")
    const cpus = cpuinfo.match(/processor/g) || []
    
    // 获取CPU型号
    const modelMatch = cpuinfo.match(/model name\s*:\s*(.+)/)
    let model = modelMatch ? modelMatch[1].trim() : 'Unknown CPU'
    
    // 简化CPU型号显示，去掉频率信息和多余的空格
    model = model
      .replace(/Intel\(R\)\s*/i, 'Intel ') // 简化Intel标识
      .replace(/\(R\)/g, '') // 移除所有(R)
      .replace(/\(TM\)/g, '') // 移除所有(TM)
      .replace(/CPU\s+/i, '') // 移除CPU字样
      .replace(/\s+/g, ' ') // 多个空格替换为单个空格
      .trim()
    
    // 保留完整的CPU型号，不再强制截断
    // 如果型号过长（超过60字符），才进行截断
    if (model.length > 60) {
      model = model.substring(0, 57) + '...'
    }
    
    return {
      cores: cpus.length,
      model: model
    }
  } catch (error) {
    console.error("Error reading CPU info:", error)
    return { cores: 1, model: 'Unknown CPU' }
  }
}

// 读取CPU使用情况
async function readHostCpuUsage(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const filePath = path.join(hostRoot, "proc/stat")
    const stat = await fs.readFile(filePath, "utf8")
    const lines = stat.split("\n")
    
    // 解析总CPU时间
    const cpuLine = lines[0]
    const cpuTimes = cpuLine.split(/\s+/).slice(1).map(Number)
    const totalTime = cpuTimes.reduce((a, b) => a + b, 0)
    const idleTime = cpuTimes[3] + cpuTimes[4] // idle + iowait
    
    // 解析每个核心的使用率
    const coreUsages = []
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('cpu') && line.match(/^cpu\d+/)) {
        const coreTimes = line.split(/\s+/).slice(1).map(Number)
        const coreTotal = coreTimes.reduce((a, b) => a + b, 0)
        const coreIdle = coreTimes[3] + coreTimes[4]
        coreUsages.push({ total: coreTotal, idle: coreIdle })
      }
    }
    
    return { 
      totalTime, 
      idleTime, 
      coreUsages,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error("Error reading CPU usage:", error)
    return { totalTime: 0, idleTime: 0, coreUsages: [], timestamp: Date.now() }
  }
}

// 获取CPU信息和使用率
async function getHostCpuInfo(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const cpuInfo = await readHostCpuInfo(hostRoot)
    const usage1 = await readHostCpuUsage(hostRoot)
    
    // 等待一小段时间再次读取，以计算使用率
    await new Promise((resolve) => setTimeout(resolve, 1000))
    const usage2 = await readHostCpuUsage(hostRoot)
    
    const totalDiff = usage2.totalTime - usage1.totalTime
    const idleDiff = usage2.idleTime - usage1.idleTime
    const usagePercent = totalDiff > 0 ? (1 - idleDiff / totalDiff) * 100 : 0
    
    // 计算每个核心的使用率
    const coreUsage = []
    for (let i = 0; i < usage1.coreUsages.length && i < usage2.coreUsages.length; i++) {
      const coreTotalDiff = usage2.coreUsages[i].total - usage1.coreUsages[i].total
      const coreIdleDiff = usage2.coreUsages[i].idle - usage1.coreUsages[i].idle
      const corePercent = coreTotalDiff > 0 ? (1 - coreIdleDiff / coreTotalDiff) * 100 : 0
      coreUsage.push(Math.max(0, Math.min(100, corePercent)))
    }
    
    // 使用实际检测到的核心数
    const actualCores = coreUsage.length > 0 ? coreUsage.length : cpuInfo.cores
    
    return {
      cores: actualCores,
      model: cpuInfo.model,
      usage: Math.max(0, Math.min(100, usagePercent)),
      coreUsage: coreUsage
    }
  } catch (error) {
    console.error("Error reading CPU information:", error)
    return {
      cores: 1,
      model: 'Unknown CPU',
      usage: 0,
      coreUsage: [0]
    }
  }
}

// 获取网络信息
async function getHostNetworkInfo(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const filePath = path.join(hostRoot, "proc/net/dev")
    const netdev = await fs.readFile(filePath, "utf8")
    const lines = netdev.split('\n').slice(2) // 跳过头部
    
    let totalRxBytes = 0
    let totalTxBytes = 0
    
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/)
        const interfaceName = parts[0].replace(':', '')
        
        // 跳过loopback接口
        if (interfaceName !== 'lo' && parts.length >= 10) {
          totalRxBytes += parseInt(parts[1]) || 0
          totalTxBytes += parseInt(parts[9]) || 0
        }
      }
    }
    
    const currentTime = Date.now()
    const currentRead = {
      rxBytes: totalRxBytes,
      txBytes: totalTxBytes,
      timestamp: currentTime
    }
    
    // 计算速度（基于与上次读取的差值）
    let rxSpeed = 0
    let txSpeed = 0
    
    if (networkCache.lastRead.timestamp > 0) {
      const timeDiff = (currentTime - networkCache.lastRead.timestamp) / 1000 // 秒
      if (timeDiff > 0) {
        const rxBytesDiff = currentRead.rxBytes - networkCache.lastRead.rxBytes
        const txBytesDiff = currentRead.txBytes - networkCache.lastRead.txBytes
        
        rxSpeed = Math.max(0, rxBytesDiff / timeDiff) // bytes/s
        txSpeed = Math.max(0, txBytesDiff / timeDiff) // bytes/s
      }
    }
    
    // 更新缓存
    networkCache.lastRead = networkCache.currentRead
    networkCache.currentRead = currentRead
    
    return {
      rx: rxSpeed,
      tx: txSpeed
    }
  } catch (error) {
    console.error("Error reading network information:", error)
    return {
      rx: 0,
      tx: 0
    }
  }
}

// 获取系统启动时间
export async function getHostBootTime(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const filePath = path.join(hostRoot, 'proc/stat')
    const statContent = await fs.readFile(filePath, 'utf8')
    
    // 查找btime行
    const btimeLine = statContent.split('\n').find(line => line.startsWith('btime'))
    if (!btimeLine) {
      throw new Error('未找到btime字段')
    }
    
    // 提取启动时间戳（Unix时间戳）
    const bootTimeSeconds = parseInt(btimeLine.split(' ')[1])
    return bootTimeSeconds * 1000 // 转换为毫秒
  } catch (error) {
    console.error('获取启动时间失败:', error.message)
    return null
  }
}

// 获取系统运行时间
export async function getHostUptime(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const filePath = path.join(hostRoot, 'proc/uptime')
    const uptime = await fs.readFile(filePath, 'utf8')
    const uptimeSeconds = parseFloat(uptime.split(' ')[0])
    return uptimeSeconds
  } catch (error) {
    console.error('获取运行时间失败:', error.message)
    return null
  }
}

// 获取磁盘使用情况
export async function getHostDiskUsage(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const output = await execAsync(`df -P ${hostRoot}`)
    const lines = output.stdout.trim().split('\n')
    if (lines.length < 2) {
      throw new Error('df命令输出格式异常')
    }
    
    const data = lines[1].split(/\s+/)
    if (data.length < 6) {
      throw new Error('df命令输出数据不完整')
    }
    
    const [filesystem, totalBlocks, usedBlocks, availableBlocks, percentUsed, mounted] = data
    
    // 将1K块转换为字节
    const total = parseInt(totalBlocks) * 1024
    const used = parseInt(usedBlocks) * 1024
    
    return {
      total: Math.round((total / 1024 / 1024 / 1024) * 100) / 100, // GB
      used: Math.round((used / 1024 / 1024 / 1024) * 100) / 100   // GB
    }
  } catch (error) {
    console.error('获取宿主机磁盘使用情况失败:', error.message)
    return {
      total: 0,
      used: 0
    }
  }
}

// 获取磁盘I/O信息
export async function getHostDiskIO(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    // 读取宿主机的/proc/diskstats
    const diskStatsPath = path.join(hostRoot, 'proc/diskstats')
    const diskStatsContent = await fs.readFile(diskStatsPath, 'utf8')
    
    // 解析磁盘统计信息
    const lines = diskStatsContent.trim().split('\n')
    let totalReadSectors = 0
    let totalWriteSectors = 0
    
    for (const line of lines) {
      const fields = line.trim().split(/\s+/)
      if (fields.length >= 14) {
        // 只统计主要磁盘设备（非分区）
        const deviceName = fields[2]
        if (deviceName.match(/^(sd[a-z]|hd[a-z]|vd[a-z]|nvme\d+n\d+)$/)) {
          totalReadSectors += parseInt(fields[5]) || 0  // 读取扇区数
          totalWriteSectors += parseInt(fields[9]) || 0 // 写入扇区数
        }
      }
    }
    
    const currentTime = Date.now()
    const currentRead = {
      readSectors: totalReadSectors,
      writeSectors: totalWriteSectors,
      timestamp: currentTime
    }
    
    // 计算速度（基于与上次读取的差值）
    let readSpeed = 0
    let writeSpeed = 0
    
    if (diskIOCache.lastRead.timestamp > 0) {
      const timeDiff = (currentTime - diskIOCache.lastRead.timestamp) / 1000 // 秒
      if (timeDiff > 0) {
        const sectorSize = 512 // 字节
        const readSectorsDiff = currentRead.readSectors - diskIOCache.lastRead.readSectors
        const writeSectorsDiff = currentRead.writeSectors - diskIOCache.lastRead.writeSectors
        
        readSpeed = Math.round((readSectorsDiff * sectorSize / 1024 / timeDiff) * 100) / 100 // KB/s
        writeSpeed = Math.round((writeSectorsDiff * sectorSize / 1024 / timeDiff) * 100) / 100 // KB/s
      }
    }
    
    // 更新缓存
    diskIOCache.lastRead = diskIOCache.currentRead
    diskIOCache.currentRead = currentRead
    
    return {
      readSpeed: Math.max(0, readSpeed),
      writeSpeed: Math.max(0, writeSpeed)
    }
  } catch (error) {
    console.error('获取宿主机磁盘I/O信息失败:', error.message)
    return {
      readSpeed: 0,
      writeSpeed: 0
    }
  }
}

// 获取系统平台信息
async function getHostOSInfo(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    // 读取/etc/os-release获取系统信息
    const osReleasePath = path.join(hostRoot, 'etc/os-release')
    let platform = 'Linux'
    
    try {
      const osRelease = await fs.readFile(osReleasePath, 'utf8')
      const nameMatch = osRelease.match(/PRETTY_NAME="([^"]+)"/) || osRelease.match(/NAME="([^"]+)"/)
      if (nameMatch) {
        platform = nameMatch[1]
      }
    } catch (e) {
      // 如果读取失败，保持默认值
    }
    
    return { platform }
  } catch (error) {
    console.error('获取系统信息失败:', error)
    return { platform: 'Linux' }
  }
}

// 获取系统信息
export async function getSystemStats() {
  try {
    const [
      cpuInfo,
      memInfo,
      networkInfo,
      osInfo,
      diskUsage,
      diskIO,
      bootTime,
      uptime
    ] = await Promise.all([
      getHostCpuInfo(),
      getHostMemInfo(),
      getHostNetworkInfo(),
      getHostOSInfo(),
      getHostDiskUsage(),
      getHostDiskIO(),
      getHostBootTime(),
      getHostUptime()
    ])

    if (!cpuInfo || !memInfo) {
      throw new Error('Failed to get basic system info')
    }

    return {
      cpu: {
        usage: cpuInfo.usage || 0,
        cores: cpuInfo.cores || 1,
        model: cpuInfo.model || 'Unknown',
        coreUsage: cpuInfo.coreUsage && cpuInfo.coreUsage.length > 0 ? 
          cpuInfo.coreUsage : new Array(cpuInfo.cores || 1).fill(0)
      },
      memory: {
        total: Math.round((memInfo.total / 1024 / 1024 / 1024) * 100) / 100,
        used: Math.round((memInfo.used / 1024 / 1024 / 1024) * 100) / 100,
        available: Math.round((memInfo.available / 1024 / 1024 / 1024) * 100) / 100,
        cached: Math.round((memInfo.cached / 1024 / 1024 / 1024) * 100) / 100,
        buffers: Math.round((memInfo.buffers / 1024 / 1024 / 1024) * 100) / 100
      },
      disk: {
        total: diskUsage.total || 0,
        used: diskUsage.used || 0,
        readSpeed: diskIO.readSpeed || 0,
        writeSpeed: diskIO.writeSpeed || 0
      },
      network: {
        rx: networkInfo.rx || 0,
        tx: networkInfo.tx || 0
      },
      system: {
        uptime: uptime || 0,
        platform: osInfo.platform || 'Linux',
        bootTime: bootTime
      }
    }
  } catch (error) {
    console.error('获取系统信息失败:', error)
    return null
  }
}

// 获取缓存的系统信息
export async function getCachedSystemStats() {
  const now = Date.now()
  
  // 如果缓存时间超过3秒，重新获取数据
  if (now - systemCache.lastUpdate > 3000) {
    const stats = await getSystemStats()
    if (stats) {
      systemCache = {
        lastUpdate: now,
        data: stats
      }
    }
  }

  return systemCache.data
}

// 获取进程信息（简化版，只返回前端需要的基本信息）
export async function getProcesses(hostRoot = CONFIG.HOST_MOUNT_POINT) {
  try {
    const procPath = path.join(hostRoot, 'proc')
    const procDirs = await fs.readdir(procPath)
    const processes = []
    
    for (const dir of procDirs) {
      // 只处理数字目录（进程ID）
      if (!/^\d+$/.test(dir)) continue
      
      try {
        const pidPath = path.join(procPath, dir)
        const commPath = path.join(pidPath, 'comm')
        const statusPath = path.join(pidPath, 'status')
        
        const [comm, status] = await Promise.all([
          fs.readFile(commPath, 'utf8').catch(() => 'unknown'),
          fs.readFile(statusPath, 'utf8').catch(() => '')
        ])
        
        const pid = parseInt(dir)
        const name = comm.trim()
        
        // 从status文件获取内存使用情况
        let memoryKB = 0
        const vmRSSMatch = status.match(/VmRSS:\s+(\d+)\s+kB/)
        if (vmRSSMatch) {
          memoryKB = parseInt(vmRSSMatch[1])
        }
        
        processes.push({
          pid: pid,
          name: name,
          cpu: 0, // CPU使用率需要计算差值，这里先设为0
          mem: Math.round((memoryKB / 1024) * 100) / 100, // MB
          command: name
        })
        
        // 限制数量，避免读取太多进程
        if (processes.length >= 50) break
        
      } catch (e) {
        // 进程可能在读取过程中消失，忽略错误
        continue
      }
    }
    
    // 按内存使用量排序，返回前10个
    const topProcesses = processes
      .sort((a, b) => b.mem - a.mem)
      .slice(0, 10)

    return topProcesses
  } catch (error) {
    console.error('获取进程信息失败:', error)
    return []
  }
} 