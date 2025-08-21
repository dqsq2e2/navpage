import React, { useState, useEffect, useRef } from 'react'
import { configService } from '../utils/configService'
import './SearchBar.css'

interface SearchEngine {
  name: string
  url: string
  icon: string
  iconUrl?: string
}

interface SearchSuggestion {
  text: string
  type: 'suggestion' | 'history' | 'url'
}

const defaultEngines: SearchEngine[] = [
  { name: '百度', url: 'https://www.baidu.com/s?wd={query}', icon: '🅱️' },
  { name: 'Bing', url: 'https://www.bing.com/search?q={query}', icon: '🇧' }
]

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('')
  const [selectedEngine, setSelectedEngine] = useState(0)
  const [engines, setEngines] = useState<SearchEngine[]>(defaultEngines)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 加载数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 加载搜索历史
        const history = await configService.getSearchHistory()
        setSearchHistory(history)
        
        // 加载搜索引擎
        const savedEngines = await configService.getSearchEngines()
        if (savedEngines.length > 0) {
          setEngines(savedEngines)
        } else {
          setEngines(defaultEngines)
          // 保存默认引擎到服务器
          await configService.saveSearchEngines(defaultEngines)
        }
      } catch (error) {
        console.error('Failed to initialize SearchBar data:', error)
        // 设置默认状态（不使用localStorage）
        setSearchHistory([])
        setEngines(defaultEngines)
      }
    }
    
    initializeData()
  }, [])

  // 监听搜索引擎变化，重置选中的引擎索引
  useEffect(() => {
    if (selectedEngine >= engines.length) {
      setSelectedEngine(0)
    }
  }, [engines, selectedEngine])

  // 监听localStorage变化，同步搜索引擎数据
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'searchEngines' && e.newValue) {
        try {
          const newEngines = JSON.parse(e.newValue)
          setEngines(newEngines)
        } catch (error) {
          console.error('Failed to parse search engines:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // 保存搜索历史
  const saveSearchHistory = async (newHistory: string[]) => {
    setSearchHistory(newHistory)
    try {
      await configService.saveSearchHistory(newHistory)
    } catch (error) {
      console.error('Failed to save search history:', error)
      // 降级到localStorage
      localStorage.setItem('searchHistory', JSON.stringify(newHistory))
    }
  }

  // 检测是否为URL
  const isURL = (text: string): boolean => {
    // URL正则表达式
    const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(:[0-9]{1,5})?(\/.*)?$/
    const ipPattern = /^(https?:\/\/)?((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(:[0-9]{1,5})?(\/.*)?$/
    const localhostPattern = /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:[0-9]{1,5})?(\/.*)?$/
    
    return urlPattern.test(text) || ipPattern.test(text) || localhostPattern.test(text)
  }

  // 格式化URL
  const formatURL = (url: string): string => {
    // 如果没有协议前缀，默认添加https://
    if (!/^https?:\/\//.test(url)) {
      // 对于localhost和IP地址，使用http://
      if (/^(localhost|127\.0\.0\.1|\d+\.\d+\.\d+\.\d+)/.test(url)) {
        return `http://${url}`
      }
      return `https://${url}`
    }
    return url
  }

  // 处理搜索
  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    const trimmedQuery = searchQuery.trim()
    
    // 检测是否为URL
    if (isURL(trimmedQuery)) {
      const formattedURL = formatURL(trimmedQuery)
      
      // 添加到搜索历史（作为URL访问记录）
      const newHistory = [trimmedQuery, ...searchHistory.filter(item => item !== trimmedQuery)].slice(0, 10)
      saveSearchHistory(newHistory)
      
      // 直接跳转到URL
      window.open(formattedURL, '_blank')
      setQuery('')
      setShowSuggestions(false)
      return
    }
    
    // 正常搜索流程
    const searchUrl = engines[selectedEngine].url.replace('{query}', encodeURIComponent(trimmedQuery))
    
    // 添加到搜索历史
    const newHistory = [trimmedQuery, ...searchHistory.filter(item => item !== trimmedQuery)].slice(0, 10)
    saveSearchHistory(newHistory)
    
    // 跳转到搜索结果
    window.open(searchUrl, '_blank')
    setQuery('')
    setShowSuggestions(false)
  }

  // 获取搜索建议
  const fetchSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    try {
      // 检测是否为URL
      if (isURL(searchQuery)) {
        const urlSuggestion = {
          text: searchQuery,
          type: 'url' as const
        }
        setSuggestions([urlSuggestion])
        return
      }

      // 历史记录建议
      const historyMatches = searchHistory
        .filter(item => item.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(text => ({ text, type: 'history' as const }))

      // 百度搜索建议 (使用JSONP)
      const script = document.createElement('script')
      const callbackName = `suggestion_${Date.now()}`
      
      window[callbackName] = (data: any) => {
        const baiduSuggestions = data.s ? data.s.slice(0, 5).map((text: string) => ({
          text,
          type: 'suggestion' as const
        })) : []
        
        setSuggestions([...historyMatches, ...baiduSuggestions])
        document.body.removeChild(script)
        delete window[callbackName]
      }
      
      script.src = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(searchQuery)}&cb=${callbackName}`
      script.onerror = () => {
        setSuggestions(historyMatches)
        document.body.removeChild(script)
        delete window[callbackName]
      }
      
      document.body.appendChild(script)
      
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      setSuggestions([])
    }
  }

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setShowSuggestions(true)
    
    if (value.trim()) {
      fetchSuggestions(value)
    } else {
      setSuggestions([])
    }
  }

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 点击建议
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    handleSearch(suggestion.text)
  }

  // 点击外部关闭建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="search-container" ref={searchRef}>
      <div className="unified-search-bar">
        {/* 搜索引擎标签（内嵌在输入框左侧） */}
        <button
          className="engine-tag"
          onClick={() => setSelectedEngine((prev) => (prev + 1) % engines.length)}
          title="切换搜索引擎"
        >
          <span className="engine-icon">
            {engines[selectedEngine].iconUrl ? (
              <img src={engines[selectedEngine].iconUrl} alt={engines[selectedEngine].name} />
            ) : (
              engines[selectedEngine].icon
            )}
          </span>
          <span className="engine-name">{engines[selectedEngine].name}</span>
        </button>

        {/* 搜索输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="搜索或直接输入网址..."
          className="search-input-unified"
        />

        {/* 搜索按钮（内嵌在输入框右侧） */}
        <button 
          onClick={() => handleSearch()} 
          className="search-button-unified"
          title="搜索"
        >
          🔍
        </button>
      </div>

      {/* 搜索建议 */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${suggestion.type}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-icon">
                {suggestion.type === 'history' ? '🕒' : suggestion.type === 'url' ? '🌐' : '🔍'}
              </span>
              <span className="suggestion-text">
                {suggestion.type === 'url' ? `直接访问: ${suggestion.text}` : suggestion.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBar 