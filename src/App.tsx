import { useState, useMemo, useEffect } from 'react'
import './App.css'

interface Trade {
  id: number
  date: string
  symbol: string
  type: 'Buy' | 'Sell'
  qty: number
  price: number
  pnl: number
  fees: number
  strategy: string
}

type SortField = 'date' | 'symbol' | 'type' | 'qty' | 'price' | 'pnl' | 'fees'
type SortDirection = 'asc' | 'desc'

interface FilterState {
  symbol: string
  type: string
  strategy: string
  dateFrom: string
  dateTo: string
  minPnL: string
  maxPnL: string
}

interface NewTradeData {
  symbol: string | null
  type: string | null
  qty: string | null
  price: string | null
  date: string | null
  strategy: string | null
  fees: string | null
}

interface TradeField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required: boolean
  placeholder?: string
  options?: string[]
  enabled: boolean
}

interface ChartConfig {
  id: string
  title: string
  type: 'line' | 'bar' | 'pie' | 'area'
  dataSource: 'pnl' | 'volume' | 'symbols' | 'strategies' | 'winRate'
  enabled: boolean
  position: number
}

const defaultChartConfigs: ChartConfig[] = [
  { id: 'equity_curve', title: 'Equity Curve', type: 'line', dataSource: 'pnl', enabled: true, position: 1 },
  { id: 'monthly_pnl', title: 'Monthly P&L', type: 'bar', dataSource: 'pnl', enabled: true, position: 2 },
  { id: 'symbol_distribution', title: 'Trades by Symbol', type: 'pie', dataSource: 'symbols', enabled: true, position: 3 },
  { id: 'strategy_performance', title: 'Strategy Performance', type: 'bar', dataSource: 'strategies', enabled: true, position: 4 },
  { id: 'win_rate_trend', title: 'Win Rate Over Time', type: 'area', dataSource: 'winRate', enabled: true, position: 5 },
  { id: 'volume_analysis', title: 'Trading Volume', type: 'line', dataSource: 'volume', enabled: true, position: 6 },
]

const defaultTradeFields: TradeField[] = [
  { id: 'symbol', label: 'Symbol', type: 'text', required: true, placeholder: 'e.g. AAPL', enabled: true },
  { id: 'type', label: 'Type', type: 'select', required: true, options: ['Buy', 'Sell'], enabled: true },
  { id: 'qty', label: 'Quantity', type: 'number', required: true, placeholder: '100', enabled: true },
  { id: 'price', label: 'Price', type: 'number', required: true, placeholder: '150.00', enabled: true },
  { id: 'date', label: 'Date', type: 'date', required: true, enabled: true },
  { id: 'strategy', label: 'Strategy', type: 'text', required: false, placeholder: 'e.g. Momentum', enabled: true },  { id: 'fees', label: 'Fees', type: 'number', required: false, placeholder: '9.95', enabled: true },
]

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false)
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false)
  const [isChartConfigModalOpen, setIsChartConfigModalOpen] = useState(false)
  const [tradeFields, setTradeFields] = useState<TradeField[]>(defaultTradeFields)
  const [chartConfigs, setChartConfigs] = useState<ChartConfig[]>(defaultChartConfigs)
  const [userTrades, setUserTrades] = useState<Trade[]>([])
  const [filePath, setFilePath] = useState<string>('tradelog.csv')
  const [filters, setFilters] = useState<FilterState>({
    symbol: '',
    type: '',
    strategy: '',
    dateFrom: '',
    dateTo: '',
    minPnL: '',
    maxPnL: ''
  })
  // Carica i dati salvati all'avvio
  useEffect(() => {
    // Carica il percorso del file salvato
    const savedFilePath = localStorage.getItem('tradelog_filepath')
    if (savedFilePath) {
      setFilePath(savedFilePath)
    }
    
    // Carica i trade salvati
    const savedTrades = localStorage.getItem('tradelog_trades')
    if (savedTrades) {
      try {
        const trades = JSON.parse(savedTrades)
        setUserTrades(trades)
      } catch (error) {
        console.error('Error loading saved trades:', error)
      }
    }
  }, [])

  // Combina i trade demo con quelli reali
  const allTrades = useMemo(() => {
    const demoTrades: Trade[] = [
      { id: 1, date: '2024-04-12', symbol: 'AMZN', type: 'Buy', qty: 10, price: 3200.0, pnl: 500.0, fees: 12.50, strategy: 'Momentum' },
      { id: 2, date: '2024-04-11', symbol: 'TSLA', type: 'Sell', qty: 5, price: 190.00, pnl: -1550.0, fees: 8.75, strategy: 'Scalping' },
      { id: 3, date: '2024-04-10', symbol: 'AAPL', type: 'Buy', qty: 15, price: 170.00, pnl: 375.0, fees: 15.30, strategy: 'Swing' },
      { id: 4, date: '2024-04-09', symbol: 'MSFT', type: 'Sell', qty: 8, price: 405.00, pnl: -2800.0, fees: 16.20, strategy: 'Mean Reversion' },
      { id: 5, date: '2024-04-08', symbol: 'GOOGL', type: 'Buy', qty: 12, price: 2600.00, pnl: 600.0, fees: 31.20, strategy: 'Breakout' },
      { id: 6, date: '2024-04-05', symbol: 'NVDA', type: 'Buy', qty: 20, price: 850.00, pnl: 1200.0, fees: 17.00, strategy: 'Momentum' },
      { id: 7, date: '2024-04-04', symbol: 'META', type: 'Sell', qty: 6, price: 480.00, pnl: -300.0, fees: 14.40, strategy: 'Scalping' },
      { id: 8, date: '2024-04-03', symbol: 'AMD', type: 'Buy', qty: 25, price: 180.00, pnl: 750.0, fees: 22.50, strategy: 'Swing' },
      { id: 9, date: '2024-04-02', symbol: 'NFLX', type: 'Sell', qty: 4, price: 420.00, pnl: 200.0, fees: 8.40, strategy: 'Mean Reversion' },
      { id: 10, date: '2024-04-01', symbol: 'CRM', type: 'Buy', qty: 18, price: 250.00, pnl: -450.0, fees: 22.50, strategy: 'Breakout' },
    ]
    
    // Se non ci sono trade utente, usa solo i demo. Altrimenti usa solo quelli reali
    return userTrades.length > 0 ? userTrades : demoTrades
  }, [userTrades])
  
  const filteredAndSortedTrades = useMemo(() => {
    const filtered = allTrades.filter(trade => {
      if (filters.symbol && !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false
      if (filters.type && trade.type !== filters.type) return false
      if (filters.strategy && !trade.strategy.toLowerCase().includes(filters.strategy.toLowerCase())) return false
      if (filters.dateFrom && trade.date < filters.dateFrom) return false
      if (filters.dateTo && trade.date > filters.dateTo) return false
      if (filters.minPnL && trade.pnl < parseFloat(filters.minPnL)) return false
      if (filters.maxPnL && trade.pnl > parseFloat(filters.maxPnL)) return false
      return true
    })

    return filtered.sort((a, b) => {
      let aValue: string | number = a[sortField]
      let bValue: string | number = b[sortField]
      
      if (sortField === 'date') {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [allTrades, filters, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }
  const clearFilters = () => {
    setFilters({
      symbol: '',
      type: '',
      strategy: '',
      dateFrom: '',
      dateTo: '',
      minPnL: '',
      maxPnL: ''
    })
  }

  const openAddTradeModal = () => {
    setIsAddTradeModalOpen(true)
  }
  const closeAddTradeModal = () => {
    setIsAddTradeModalOpen(false)
  }
  const handleAddTrade = (tradeData: NewTradeData) => {
    // Crea un nuovo trade con i dati del form
    const newTrade: Trade = {
      id: Date.now(),
      date: tradeData.date || new Date().toISOString().split('T')[0],
      symbol: tradeData.symbol || '',
      type: (tradeData.type as 'Buy' | 'Sell') || 'Buy',
      qty: parseFloat(tradeData.qty || '0'),
      price: parseFloat(tradeData.price || '0'),
      pnl: 0, // Calcolato automaticamente in base a logica di trading
      fees: parseFloat(tradeData.fees || '0'),
      strategy: tradeData.strategy || 'Manual'
    }
    
    // Calcola P&L basico (simulazione)
    newTrade.pnl = (Math.random() - 0.5) * 1000 // Simulazione per demo
    
    // Salva il trade
    saveTradeToStorage(newTrade)
    setIsAddTradeModalOpen(false)
    
    // Mostra notifica di successo
    alert(`Trade aggiunto e salvato nel file CSV! Symbol: ${newTrade.symbol}, P&L: ${newTrade.pnl.toFixed(2)}`)
  }
  // Funzioni per gestire la configurazione dei campi
  const updateField = (fieldId: string, updates: Partial<TradeField>) => {
    setTradeFields(fields => 
      fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    )
  }

  const openNewFieldModal = () => {
    setIsNewFieldModalOpen(true)
  }

  const closeNewFieldModal = () => {
    setIsNewFieldModalOpen(false)
  }

  const addNewField = (fieldData: Omit<TradeField, 'id'>) => {
    const newId = `custom_${Date.now()}`
    const newField: TradeField = {
      id: newId,
      ...fieldData
    }
    setTradeFields(fields => [...fields, newField])
    setIsNewFieldModalOpen(false)
  }

  const removeField = (fieldId: string) => {
    // Non permettere la rimozione dei campi core
    const coreFields = ['symbol', 'type', 'qty', 'price', 'date']
    if (coreFields.includes(fieldId)) {
      alert('Cannot remove core fields')
      return
    }
    setTradeFields(fields => fields.filter(field => field.id !== fieldId))
  }
  const resetFieldsToDefault = () => {
    setTradeFields([...defaultTradeFields])
  }

  // Funzioni per l'analisi e i grafici
  const generateEquityCurveData = () => {
    let runningTotal = 0
    return allTrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(trade => {
        runningTotal += trade.pnl
        return {
          date: trade.date,
          value: runningTotal
        }
      })
  }

  const generateMonthlyPnLData = () => {
    const monthlyData: { [key: string]: number } = {}
    allTrades.forEach(trade => {
      const month = trade.date.substring(0, 7) // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + trade.pnl
    })
    return Object.entries(monthlyData).map(([month, pnl]) => ({ month, pnl }))
  }

  const generateSymbolDistribution = () => {
    const symbolData: { [key: string]: number } = {}
    allTrades.forEach(trade => {
      symbolData[trade.symbol] = (symbolData[trade.symbol] || 0) + 1
    })
    return Object.entries(symbolData).map(([symbol, count]) => ({ symbol, count }))
  }

  const generateStrategyPerformance = () => {
    const strategyData: { [key: string]: { pnl: number, trades: number } } = {}
    allTrades.forEach(trade => {
      if (!strategyData[trade.strategy]) {
        strategyData[trade.strategy] = { pnl: 0, trades: 0 }
      }
      strategyData[trade.strategy].pnl += trade.pnl
      strategyData[trade.strategy].trades += 1
    })
    return Object.entries(strategyData).map(([strategy, data]) => ({ 
      strategy, 
      pnl: data.pnl, 
      avgPnL: data.pnl / data.trades,
      trades: data.trades 
    }))
  }

  const generateWinRateData = () => {
    const monthlyWinRate: { [key: string]: { wins: number, total: number } } = {}
    allTrades.forEach(trade => {
      const month = trade.date.substring(0, 7)
      if (!monthlyWinRate[month]) {
        monthlyWinRate[month] = { wins: 0, total: 0 }
      }
      monthlyWinRate[month].total += 1
      if (trade.pnl > 0) monthlyWinRate[month].wins += 1
    })
    return Object.entries(monthlyWinRate).map(([month, data]) => ({ 
      month, 
      winRate: (data.wins / data.total) * 100 
    }))
  }

  const generateVolumeData = () => {
    const volumeData: { [key: string]: number } = {}
    allTrades.forEach(trade => {
      const month = trade.date.substring(0, 7)
      volumeData[month] = (volumeData[month] || 0) + (trade.qty * trade.price)
    })
    return Object.entries(volumeData).map(([month, volume]) => ({ month, volume }))
  }

  // Funzioni per gestire la configurazione dei grafici
  const updateChartConfig = (chartId: string, updates: Partial<ChartConfig>) => {
    setChartConfigs(configs => 
      configs.map(config => 
        config.id === chartId ? { ...config, ...updates } : config
      )
    )
  }

  const addNewChart = (chartData: Omit<ChartConfig, 'id' | 'position'>) => {
    const newId = `custom_${Date.now()}`
    const newPosition = Math.max(...chartConfigs.map(c => c.position)) + 1
    const newChart: ChartConfig = {
      id: newId,
      position: newPosition,
      ...chartData
    }
    setChartConfigs(configs => [...configs, newChart])
    setIsChartConfigModalOpen(false)
  }

  const removeChart = (chartId: string) => {
    setChartConfigs(configs => configs.filter(config => config.id !== chartId))
  }
  const openChartConfigModal = () => {
    setIsChartConfigModalOpen(true)
  }

  const closeChartConfigModal = () => {
    setIsChartConfigModalOpen(false)
  }  // Funzioni per gestire i dati CSV/Excel
  const exportToCSV = () => {
    // Assicurati che il nome del file sia valido
    const fileName = filePath.toLowerCase().endsWith('.csv') ? filePath : filePath + '.csv'
    
    const headers = ['ID', 'Date', 'Symbol', 'Type', 'Quantity', 'Price', 'P&L', 'Fees', 'Strategy']
    const csvContent = [
      headers.join(','),
      ...allTrades.map(trade => [
        trade.id,
        trade.date,
        trade.symbol,
        trade.type,
        trade.qty,
        trade.price,
        trade.pnl,
        trade.fees,
        trade.strategy
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      
      const newTrades: Trade[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        if (values.length >= 9 && values[0]) {
          const trade: Trade = {
            id: parseInt(values[0]) || Date.now() + i,
            date: values[1],
            symbol: values[2],
            type: values[3] as 'Buy' | 'Sell',
            qty: parseFloat(values[4]) || 0,
            price: parseFloat(values[5]) || 0,
            pnl: parseFloat(values[6]) || 0,
            fees: parseFloat(values[7]) || 0,
            strategy: values[8] || 'Unknown'
          }
          newTrades.push(trade)
        }
      }
        if (newTrades.length > 0) {
        // Aggiorna lo stato con i nuovi trade
        setUserTrades(newTrades)
        // Salva anche nel localStorage
        localStorage.setItem('tradelog_trades', JSON.stringify(newTrades))
        alert(`Successfully imported ${newTrades.length} trades from CSV file!`)
      }
    }
    reader.readAsText(file)
    // Reset del valore dell'input per permettere di importare lo stesso file nuovamente
    event.target.value = ''
  }
  const saveTradeToStorage = (trade: Trade) => {
    // Aggiorna lo stato locale
    setUserTrades(prevTrades => {
      const updatedTrades = [...prevTrades, trade]
      // Salva anche nel localStorage
      localStorage.setItem('tradelog_trades', JSON.stringify(updatedTrades))
      return updatedTrades
    })
    
    // Esporta automaticamente ogni volta che si aggiunge un trade
    setTimeout(() => exportToCSV(), 100) // Piccolo delay per permettere l'aggiornamento dello stato
  }// Componente per renderizzare i grafici
  const renderChart = (config: ChartConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = []
    let maxValue = 0
    let minValue = 0

    switch (config.dataSource) {
      case 'pnl':
        if (config.type === 'line' && config.id === 'equity_curve') {
          data = generateEquityCurveData()
          maxValue = Math.max(...data.map(d => d.value))
          minValue = Math.min(...data.map(d => d.value))
        } else {
          data = generateMonthlyPnLData()
          maxValue = Math.max(...data.map(d => d.pnl))
          minValue = Math.min(...data.map(d => d.pnl))
        }
        break
      case 'symbols':
        data = generateSymbolDistribution()
        maxValue = Math.max(...data.map(d => d.count))
        break
      case 'strategies':
        data = generateStrategyPerformance()
        maxValue = Math.max(...data.map(d => d.pnl))
        minValue = Math.min(...data.map(d => d.pnl))
        break
      case 'winRate':
        data = generateWinRateData()
        maxValue = 100
        minValue = 0
        break
      case 'volume':
        data = generateVolumeData()
        maxValue = Math.max(...data.map(d => d.volume))
        break
    }

    const chartHeight = 200
    const chartWidth = 300

    if (config.type === 'line' || config.type === 'area') {
      const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * chartWidth
        const value = config.dataSource === 'pnl' && config.id === 'equity_curve' ? item.value :
                      config.dataSource === 'winRate' ? item.winRate :
                      config.dataSource === 'volume' ? item.volume : item.pnl
        const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight
        return `${x},${y}`
      }).join(' ')

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          {config.type === 'area' && (
            <path
              d={`M ${points} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
              fill="rgba(100, 108, 255, 0.2)"
            />
          )}
          <polyline
            points={points}
            fill="none"
            stroke="#646cff"
            strokeWidth="2"
          />
        </svg>
      )
    }

    if (config.type === 'bar') {
      const barWidth = chartWidth / data.length * 0.8
      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          {data.map((item, index) => {
            const value = config.dataSource === 'strategies' ? item.pnl : item.pnl || item.volume
            const height = Math.abs(value - minValue) / (maxValue - minValue) * chartHeight
            const x = (index / data.length) * chartWidth + barWidth * 0.1
            const y = value >= 0 ? chartHeight - height : chartHeight - ((0 - minValue) / (maxValue - minValue)) * chartHeight
            
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={value >= 0 ? "#10b981" : "#ef4444"}
              />
            )
          })}
        </svg>
      )
    }

    if (config.type === 'pie') {
      const total = data.reduce((sum, item) => sum + item.count, 0)
      let currentAngle = 0
      const radius = 80
      const centerX = chartWidth / 2
      const centerY = chartHeight / 2

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          {data.map((item, index) => {
            const angle = (item.count / total) * 360
            const startAngle = currentAngle
            const endAngle = currentAngle + angle
            currentAngle += angle

            const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180)
            const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180)
            const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180)
            const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180)

            const largeArcFlag = angle > 180 ? 1 : 0
            const colors = ['#646cff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

            return (
              <path
                key={index}
                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
              />
            )
          })}
        </svg>
      )
    }

    return <div className="chart-placeholder">Chart type not supported</div>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Dashboard data calculation
  const recentTrades = allTrades.slice(0, 5).map(trade => ({
    ...trade,
    date: formatDate(trade.date)
  }))
  
  const totalPnL = allTrades.reduce((sum, trade) => sum + trade.pnl, 0)
  const winningTrades = allTrades.filter(trade => trade.pnl > 0).length
  const winRate = (winningTrades / allTrades.length) * 100
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <h1>TradeLog</h1>
        </div>
        <nav className="nav">
          {['Dashboard', 'Trades', 'Analysis', 'Settings'].map((tab) => (
            <button
              key={tab}
              className={`nav-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="user-menu">
          <div className="user-avatar"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {activeTab === 'Dashboard' && (
          <>
            {/* Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Total P&L</h3>
                <div className={`metric-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-card">
                <h3>Win Rate</h3>
                <div className="metric-value">
                  {winRate.toFixed(1)}%
                </div>
                <div className="chart-container">
                  <svg className="equity-chart" viewBox="0 0 200 60">
                    <polyline
                      points="10,50 30,45 50,40 70,35 90,30 110,25 130,20 150,15 170,10 190,5"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </div>              </div>            </div>

            {/* Equity Curve */}
            <div className="equity-section">
              <h3>Equity Curve</h3>
              <div className="equity-chart-large">
                <svg viewBox="0 0 800 200">
                  <polyline
                    points="50,150 80,145 110,140 140,138 170,135 200,130 230,125 260,120 290,115 320,110 350,105 380,100 410,95 440,90 470,85 500,80 530,75 560,70 590,65 620,60 650,55 680,50 710,45 740,40 770,35"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Recent Trades */}
            <div className="trades-section">
              <h3>Recent Trades</h3>
              <div className="trades-table">
                <div className="table-header">
                  <div>Date</div>
                  <div>Symbol</div>
                  <div>Type</div>
                  <div>Qty</div>
                  <div>Price</div>
                  <div>P&L</div>
                </div>
                {recentTrades.map((trade, index) => (
                  <div key={index} className="table-row">
                    <div>{trade.date}</div>
                    <div>{trade.symbol}</div>
                    <div>{trade.type}</div>
                    <div>{trade.qty}</div>
                    <div>{trade.price.toFixed(2)}</div>
                    <div className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                      {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'Trades' && (
          <div className="trades-page">
            {/* Filters Section */}
            <div className="filters-section">
              <h3>Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Symbol</label>
                  <input
                    type="text"
                    placeholder="e.g. AAPL"
                    value={filters.symbol}
                    onChange={(e) => handleFilterChange('symbol', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="Buy">Buy</option>
                    <option value="Sell">Sell</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Strategy</label>
                  <input
                    type="text"
                    placeholder="e.g. Momentum"
                    value={filters.strategy}
                    onChange={(e) => handleFilterChange('strategy', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Min P&L</label>
                  <input
                    type="number"
                    placeholder="-1000"
                    value={filters.minPnL}
                    onChange={(e) => handleFilterChange('minPnL', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Max P&L</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPnL}
                    onChange={(e) => handleFilterChange('maxPnL', e.target.value)}
                  />
                </div>
                <div className="filter-actions">
                  <button onClick={clearFilters} className="clear-filters-btn">
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>            {/* Trades Table */}
            <div className="trades-section">
              <div className="trades-header">
                <h3>All Trades ({filteredAndSortedTrades.length})</h3>
                <div className="trades-actions">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={importFromCSV}
                    style={{ display: 'none' }}
                    id="csv-import"
                  />
                  <label htmlFor="csv-import" className="import-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    Import CSV
                  </label>
                  <button onClick={exportToCSV} className="export-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="12" y2="12"></line>
                      <line x1="15" y1="15" x2="12" y2="12"></line>
                    </svg>
                    Export CSV
                  </button>
                  <button onClick={openAddTradeModal} className="add-trade-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Trade
                  </button>
                </div>
              </div>
              <div className="trades-table-full">
                <div className="table-header-full">
                  <div onClick={() => handleSort('date')} className="sortable">
                    Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div onClick={() => handleSort('symbol')} className="sortable">
                    Symbol {sortField === 'symbol' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div onClick={() => handleSort('type')} className="sortable">
                    Type {sortField === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div onClick={() => handleSort('qty')} className="sortable">
                    Qty {sortField === 'qty' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div onClick={() => handleSort('price')} className="sortable">
                    Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div onClick={() => handleSort('fees')} className="sortable">
                    Fees {sortField === 'fees' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div onClick={() => handleSort('pnl')} className="sortable">
                    P&L {sortField === 'pnl' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </div>
                  <div>Strategy</div>
                </div>
                {filteredAndSortedTrades.map((trade) => (
                  <div key={trade.id} className="table-row-full">
                    <div>{formatDate(trade.date)}</div>
                    <div className="symbol">{trade.symbol}</div>
                    <div className={`trade-type ${trade.type.toLowerCase()}`}>
                      {trade.type}
                    </div>
                    <div>{trade.qty}</div>
                    <div>${trade.price.toFixed(2)}</div>
                    <div>${trade.fees.toFixed(2)}</div>
                    <div className={trade.pnl >= 0 ? 'positive' : 'negative'}>
                      {trade.pnl >= 0 ? '+' : ''}${Math.abs(trade.pnl).toFixed(2)}
                    </div>
                    <div className="strategy">{trade.strategy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}        {activeTab === 'Analysis' && (
          <div className="analysis-page">
            {/* Analysis Header */}
            <div className="analysis-header">
              <div className="analysis-title">
                <h3>Trading Analysis</h3>
                <p>Comprehensive analysis of your trading performance</p>
              </div>
              <div className="analysis-actions">
                <button onClick={openChartConfigModal} className="add-chart-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Chart
                </button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="analysis-metrics">
              <div className="metric-card">
                <h4>Total Return</h4>
                <div className={`metric-value ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
                  {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div className="metric-card">
                <h4>Win Rate</h4>
                <div className="metric-value">{winRate.toFixed(1)}%</div>
              </div>
              <div className="metric-card">
                <h4>Total Trades</h4>
                <div className="metric-value">{allTrades.length}</div>
              </div>
              <div className="metric-card">
                <h4>Avg P&L</h4>
                <div className={`metric-value ${(totalPnL / allTrades.length) >= 0 ? 'positive' : 'negative'}`}>
                  {(totalPnL / allTrades.length).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="charts-grid">
              {chartConfigs
                .filter(config => config.enabled)
                .sort((a, b) => a.position - b.position)
                .map(config => (
                  <div key={config.id} className="chart-container">
                    <div className="chart-header">
                      <h4>{config.title}</h4>
                      <div className="chart-controls">
                        <button
                          onClick={() => updateChartConfig(config.id, { enabled: false })}
                          className="chart-hide-btn"
                          title="Hide chart"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        </button>
                        {!config.id.startsWith('equity_curve') && !config.id.startsWith('monthly_pnl') && (
                          <button
                            onClick={() => removeChart(config.id)}
                            className="chart-remove-btn"
                            title="Remove chart"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="chart-content">
                      {renderChart(config)}
                    </div>
                  </div>
                ))}
            </div>            {/* Hidden Charts */}
            {chartConfigs.some(config => !config.enabled) && (
              <div className="hidden-charts-section">
                <h4>Hidden Charts</h4>
                <div className="hidden-charts-list">
                  {chartConfigs
                    .filter(config => !config.enabled)
                    .map(config => (
                      <div key={config.id} className="hidden-chart-item">
                        <span>{config.title}</span>
                        <button
                          onClick={() => updateChartConfig(config.id, { enabled: true })}
                          className="show-chart-btn"
                        >
                          Show
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}        {activeTab === 'Settings' && (
          <div className="settings-page">
            {/* File Path Configuration */}
            <div className="settings-section">
              <h3>Data File Configuration</h3>
              <p>Set the file path where your trade data will be saved and exported.</p>
              
              <div className="file-path-config">
                <div className="form-group">
                  <label htmlFor="file-path">CSV File Name</label>                  <input
                    type="text"
                    id="file-path"
                    value={filePath}
                    onChange={(e) => {
                      let newPath = e.target.value
                      // Assicurati che il file abbia l'estensione .csv
                      if (newPath && !newPath.toLowerCase().endsWith('.csv')) {
                        newPath = newPath.replace(/\.[^/.]+$/, '') + '.csv'
                      }
                      setFilePath(newPath)
                      localStorage.setItem('tradelog_filepath', newPath)
                    }}
                    onBlur={(e) => {
                      // Validazione finale quando l'utente esce dal campo
                      let finalPath = e.target.value
                      if (finalPath && !finalPath.toLowerCase().endsWith('.csv')) {
                        finalPath = finalPath + '.csv'
                        setFilePath(finalPath)
                        localStorage.setItem('tradelog_filepath', finalPath)
                      }
                    }}
                    placeholder="e.g. my_trades.csv"
                    className="file-path-input"
                  />
                  <small>Enter the name for your CSV file. File will be downloaded when you export data.</small>
                </div>
                
                <div className="file-info">
                  <div className="info-item">
                    <strong>Current file:</strong> {filePath}
                  </div>
                  <div className="info-item">
                    <strong>Storage:</strong> Data is saved locally in your browser and exported to CSV
                  </div>
                </div>
              </div>
            </div>

            {/* Trade Form Configuration */}
            <div className="settings-section">
              <h3>Trade Form Configuration</h3>
              <p>Customize the fields that appear when adding a new trade.</p>
                <div className="settings-actions">
                <button onClick={openNewFieldModal} className="add-field-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Field
                </button>
                <button onClick={resetFieldsToDefault} className="reset-fields-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  Reset to Default
                </button>
              </div>              <div className="fields-list">
                {tradeFields.map((field) => (
                  <div key={field.id} className="field-config">
                    <div className="field-header">
                      <div className="field-info">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="field-label-input"
                          placeholder="Field Label"
                        />
                        <span className="field-id">({field.id})</span>
                      </div>
                      <div className="field-controls">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={field.enabled}
                            onChange={(e) => updateField(field.id, { enabled: e.target.checked })}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        {!['symbol', 'type', 'qty', 'price', 'date'].includes(field.id) && (
                          <button
                            onClick={() => removeField(field.id)}
                            className="remove-field-btn"
                            title="Remove field"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="field-options">
                      <div className="field-option">
                        <label>Type:</label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value as TradeField['type'] })}
                          disabled={['symbol', 'type', 'qty', 'price', 'date'].includes(field.id)}
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="select">Select</option>
                        </select>
                      </div>
                      
                      <div className="field-option">
                        <label>
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateField(field.id, { required: e.target.checked })}
                            disabled={['symbol', 'type', 'qty', 'price', 'date'].includes(field.id)}
                          />
                          Required
                        </label>
                      </div>
                      
                      <div className="field-option">
                        <label>Placeholder:</label>
                        <input
                          type="text"
                          value={field.placeholder || ''}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          placeholder="Enter placeholder text"
                        />
                      </div>
                      
                      {field.type === 'select' && (
                        <div className="field-option">
                          <label>Options (comma separated):</label>
                          <input
                            type="text"
                            value={field.options?.join(', ') || ''}
                            onChange={(e) => updateField(field.id, { 
                              options: e.target.value.split(',').map(opt => opt.trim()).filter(Boolean)
                            })}
                            placeholder="Option 1, Option 2, Option 3"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Trade Modal */}
      {isAddTradeModalOpen && (
        <div className="modal-overlay" onClick={closeAddTradeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Trade</h3>
              <button onClick={closeAddTradeModal} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>            <form className="trade-form" onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const tradeData: NewTradeData = {
                symbol: formData.get('symbol') as string | null,
                type: formData.get('type') as string | null,
                qty: formData.get('qty') as string | null,
                price: formData.get('price') as string | null,
                date: formData.get('date') as string | null,
                strategy: formData.get('strategy') as string | null,
                fees: formData.get('fees') as string | null
              }
              handleAddTrade(tradeData)
            }}>
              <div className="form-grid">
                {tradeFields.filter(field => field.enabled).map((field) => (
                  <div key={field.id} className="form-group">
                    <label htmlFor={field.id}>
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'select' ? (
                      <select id={field.id} name={field.id} required={field.required}>
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        id={field.id}
                        name={field.id}
                        placeholder={field.placeholder}
                        required={field.required}
                        {...(field.type === 'number' ? { step: field.id === 'qty' ? '1' : '0.01', min: '0' } : {})}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button type="button" onClick={closeAddTradeModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Trade
                </button>
              </div>
            </form>          </div>
        </div>
      )}

      {/* New Field Configuration Modal */}
      {isNewFieldModalOpen && (
        <div className="modal-overlay" onClick={closeNewFieldModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Field</h3>
              <button onClick={closeNewFieldModal} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form className="new-field-form" onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const fieldData = {
                label: formData.get('label') as string,
                type: formData.get('type') as TradeField['type'],
                required: formData.get('required') === 'on',
                placeholder: formData.get('placeholder') as string || '',
                enabled: true,
                ...(formData.get('type') === 'select' ? {
                  options: (formData.get('options') as string).split(',').map(opt => opt.trim()).filter(Boolean)
                } : {})
              }
              addNewField(fieldData)
            }}>
              <div className="new-field-grid">
                <div className="form-group">
                  <label htmlFor="new-field-label">Field Label *</label>
                  <input
                    type="text"
                    id="new-field-label"
                    name="label"
                    placeholder="e.g. Stop Loss"
                    required
                  />
                </div>
                  <div className="form-group">
                  <label htmlFor="new-field-type">Field Type *</label>
                  <select 
                    id="new-field-type" 
                    name="type" 
                    required
                    onChange={(e) => {
                      const optionsGroup = document.getElementById('select-options-group')
                      if (optionsGroup) {
                        optionsGroup.style.display = e.target.value === 'select' ? 'block' : 'none'
                      }
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Select</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="new-field-placeholder">Placeholder</label>
                  <input
                    type="text"
                    id="new-field-placeholder"
                    name="placeholder"
                    placeholder="Enter placeholder text"
                  />
                </div>
                
                <div className="form-group checkbox-group">
                  <label>
                    <input type="checkbox" name="required" />
                    Required field
                  </label>
                </div>
              </div>
              
              <div className="form-group conditional-options" id="select-options-group" style={{display: 'none'}}>
                <label htmlFor="new-field-options">Select Options (comma separated)</label>
                <input
                  type="text"
                  id="new-field-options"
                  name="options"
                  placeholder="Option 1, Option 2, Option 3"
                />
                <small>Separate multiple options with commas</small>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeNewFieldModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Field
                </button>
              </div>
            </form>          </div>
        </div>
      )}

      {/* Chart Configuration Modal */}
      {isChartConfigModalOpen && (
        <div className="modal-overlay" onClick={closeChartConfigModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Chart</h3>
              <button onClick={closeChartConfigModal} className="modal-close-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form className="chart-config-form" onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target as HTMLFormElement)
              const chartData = {
                title: formData.get('title') as string,
                type: formData.get('type') as ChartConfig['type'],
                dataSource: formData.get('dataSource') as ChartConfig['dataSource'],
                enabled: true
              }
              addNewChart(chartData)
            }}>
              <div className="chart-config-grid">
                <div className="form-group">
                  <label htmlFor="chart-title">Chart Title *</label>
                  <input
                    type="text"
                    id="chart-title"
                    name="title"
                    placeholder="e.g. Custom Analysis"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="chart-type">Chart Type *</label>
                  <select id="chart-type" name="type" required>
                    <option value="line">Line Chart</option>
                    <option value="bar">Bar Chart</option>
                    <option value="area">Area Chart</option>
                    <option value="pie">Pie Chart</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="chart-datasource">Data Source *</label>
                  <select id="chart-datasource" name="dataSource" required>
                    <option value="pnl">P&L Data</option>
                    <option value="volume">Trading Volume</option>
                    <option value="symbols">Symbol Distribution</option>
                    <option value="strategies">Strategy Performance</option>
                    <option value="winRate">Win Rate Trend</option>
                  </select>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={closeChartConfigModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
