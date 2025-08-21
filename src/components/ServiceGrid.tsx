import React, { useState, useEffect } from 'react'
import { configService } from '../utils/configService'
import './ServiceGrid.css'

interface Service {
  id: string
  name: string
  url: string
  icon: string
  iconUrl?: string
  description: string
  category: string
  status: 'online' | 'offline' | 'maintenance'
  color?: string
}

interface Category {
  name: string
  icon: string
  color: string
}

const ServiceGrid: React.FC = () => {
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [categoryData, setCategoryData] = useState<Category[]>([])
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['全部'])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(12)

  // 加载数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 加载服务数据
        const savedServices = await configService.getServices()
        setServices(savedServices)
        
        // 加载分类数据
        const savedCategories = await configService.getCategories()
        if (savedCategories.length > 0) {
          setCategoryData(savedCategories)
          const categoryNames = ['全部', ...savedCategories.map((cat: any) => cat.name)]
          setCategories(categoryNames)
        } else {
          // 默认分类
          const defaultCategories = [
            { name: '开发工具', icon: '🔧', color: '#00d4ff' },
            { name: '系统管理', icon: '⚙️', color: '#ff6b35' },
            { name: '监控工具', icon: '📊', color: '#00ff88' },
            { name: '存储服务', icon: '💾', color: '#9b59b6' },
            { name: '媒体服务', icon: '🎬', color: '#e74c3c' },
            { name: '其他', icon: '📦', color: '#95a5a6' }
          ]
          setCategoryData(defaultCategories)
          setCategories(['全部', '开发工具', '系统管理', '监控工具', '存储服务', '媒体服务', '其他'])
          // 保存默认分类到服务器
          await configService.saveCategories(defaultCategories)
        }
      } catch (error) {
        console.error('Failed to initialize ServiceGrid data:', error)
        // 设置默认状态（不使用localStorage）
        setServices([])
        
        // 使用默认分类
        const defaultCategories = [
          { name: '开发工具', icon: '🔧', color: '#00d4ff' },
          { name: '系统管理', icon: '⚙️', color: '#ff6b35' },
          { name: '监控工具', icon: '📊', color: '#00ff88' },
          { name: '存储服务', icon: '💾', color: '#9b59b6' },
          { name: '媒体服务', icon: '🎬', color: '#e74c3c' },
          { name: '其他', icon: '📦', color: '#95a5a6' }
        ]
        setCategoryData(defaultCategories)
        setCategories(['全部', '开发工具', '系统管理', '监控工具', '存储服务', '媒体服务', '其他'])
      }
    }
    
    initializeData()
  }, [])

  // 更新可见分类（只显示有应用的分类）
  useEffect(() => {
    if (services.length === 0) {
      setVisibleCategories(['全部'])
      return
    }
    
    // 获取有应用的分类
    const usedCategories = Array.from(new Set(services.map(service => service.category)))
    const visible = ['全部', ...usedCategories]
    setVisibleCategories(visible)
    
    // 如果当前选中的分类不再可见，切换到"全部"
    if (!visible.includes(selectedCategory)) {
      setSelectedCategory('全部')
    }
  }, [services, selectedCategory])

  // 筛选服务
  useEffect(() => {
    const filtered = selectedCategory === '全部' 
      ? services 
      : services.filter(service => service.category === selectedCategory)
    setFilteredServices(filtered)
    setCurrentPage(1)
  }, [services, selectedCategory])

  // 分页逻辑
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentServices = filteredServices.slice(startIndex, endIndex)



  // 获取分类颜色
  const getCategoryColor = (categoryName: string): string => {
    const category = categoryData.find(cat => cat.name === categoryName)
    return category?.color || '#95a5a6'
  }

  // 将十六进制颜色转换为RGB
  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (result) {
      const r = parseInt(result[1], 16)
      const g = parseInt(result[2], 16)
      const b = parseInt(result[3], 16)
      return `${r}, ${g}, ${b}`
    }
    return '149, 165, 166' // 默认灰色的RGB值
  }



  return (
    <div className="service-grid-container">
      {/* 分类过滤器 */}
      <div className="category-filter">
        <div className="category-tabs">
          {visibleCategories.map(category => (
            <button
              key={category}
              className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
              {category !== '全部' && (
                <span className="count">
                  {services.filter(s => s.category === category).length}
                </span>
              )}
            </button>
          ))}
        </div>
        

      </div>

      {/* 服务网格 */}
      <div className="services-grid">
        {currentServices.map(service => {
          const categoryColor = getCategoryColor(service.category)
          return (
            <div
              key={service.id}
              className={`service-card glass ${service.status}`}
              style={{ 
                '--card-color': categoryColor,
                '--card-color-rgb': hexToRgb(categoryColor)
              } as React.CSSProperties}
              onClick={() => window.open(service.url, '_blank')}
            >
            <div className="service-icon">
              {service.iconUrl ? (
                <img src={service.iconUrl} alt={service.name} />
              ) : (
                <div className="icon-placeholder">
                  {service.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            <div className="service-content">
              <h3 className="service-name" title={service.description}>
                {service.name}
              </h3>
              <span className="service-category" style={{color: categoryColor}}>
                {service.category}
              </span>
            </div>
          </div>
          )
        })}

        {currentServices.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>暂无服务</h3>
            <p>点击右上角的 ⚙️ 进入设置页面添加新服务</p>
          </div>
        )}
      </div>

      {/* 分页导航 */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ‹ 上一页
          </button>
          
          <div className="pagination-info">
            <span className="current-page">{currentPage}</span>
            <span className="page-separator">/</span>
            <span className="total-pages">{totalPages}</span>
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            下一页 ›
          </button>
        </div>
      )}
    </div>
  )
}

export default ServiceGrid 