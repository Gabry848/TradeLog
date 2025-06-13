import { useState, useMemo } from 'react'
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

const allTrades: Trade[] = [
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

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filters, setFilters] = useState<FilterState>({
    symbol: '',
    type: '',
    strategy: '',
    dateFrom: '',
    dateTo: '',
    minPnL: '',
    maxPnL: ''
  })
  
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
      }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filters, sortField, sortDirection])

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
                </div>
              </div>
            </div>

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
            </div>

            {/* Trades Table */}
            <div className="trades-section">
              <div className="trades-header">
                <h3>All Trades ({filteredAndSortedTrades.length})</h3>
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
        )}

        {activeTab === 'Analysis' && (
          <div className="coming-soon">
            <h3>Analysis</h3>
            <p>Coming soon...</p>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="coming-soon">
            <h3>Settings</h3>
            <p>Coming soon...</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
