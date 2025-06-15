import { useState, useMemo, useEffect } from "react";
import "./App.css";

// Dichiarazione per l'API Electron
declare global {
  interface Window {
    electronAPI?: {
      selectFolder: () => Promise<{ canceled: boolean; filePaths: string[] }>;
      saveFile: (data: string, filePath: string) => Promise<void>;
    };
  }
}

interface Trade {
  id: number;
  date: string;
  symbol: string;
  type: "Buy" | "Sell";
  qty: number;
  price: number;
  pnl: number;
  fees: number;
  strategy: string;
  [key: string]: string | number; // Per supportare campi dinamici
}

type SortField = "date" | "symbol" | "type" | "qty" | "price" | "pnl" | "fees";
type SortDirection = "asc" | "desc";

interface FilterState {
  symbol: string;
  type: string;
  strategy: string;
  dateFrom: string;
  dateTo: string;
  minPnL: string;
  maxPnL: string;
}

interface NewTradeData {
  symbol: string | null;
  type: string | null;
  qty: string | null;
  price: string | null;
  date: string | null;
  strategy: string | null;
  fees: string | null;
  pnl: string | null;
}

interface TradeField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  enabled: boolean;
}

interface ChartConfig {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "area";
  dataSource: "pnl" | "volume" | "symbols" | "strategies" | "winRate";
  enabled: boolean;
  position: number;
}

const defaultChartConfigs: ChartConfig[] = [
  {
    id: "equity_curve",
    title: "Equity Curve",
    type: "line",
    dataSource: "pnl",
    enabled: true,
    position: 1,
  },
  {
    id: "monthly_pnl",
    title: "Monthly P&L",
    type: "bar",
    dataSource: "pnl",
    enabled: true,
    position: 2,
  },
  {
    id: "symbol_distribution",
    title: "Trades by Symbol",
    type: "pie",
    dataSource: "symbols",
    enabled: true,
    position: 3,
  },
  {
    id: "strategy_performance",
    title: "Strategy Performance",
    type: "bar",
    dataSource: "strategies",
    enabled: true,
    position: 4,
  },
  {
    id: "win_rate_trend",
    title: "Win Rate Over Time",
    type: "area",
    dataSource: "winRate",
    enabled: true,
    position: 5,
  },
  {
    id: "volume_analysis",
    title: "Trading Volume",
    type: "line",
    dataSource: "volume",
    enabled: true,
    position: 6,
  },
];

const defaultTradeFields: TradeField[] = [
  {
    id: "symbol",
    label: "Symbol",
    type: "text",
    required: true,
    placeholder: "e.g. AAPL",
    enabled: true,
  },
  {
    id: "type",
    label: "Type",
    type: "select",
    required: true,
    options: ["Buy", "Sell"],
    enabled: true,
  },
  {
    id: "qty",
    label: "Quantity",
    type: "number",
    required: true,
    placeholder: "100",
    enabled: true,
  },
  {
    id: "price",
    label: "Price",
    type: "number",
    required: true,
    placeholder: "150.00",
    enabled: true,
  },
  { id: "date", label: "Date", type: "date", required: true, enabled: true },
  {
    id: "strategy",
    label: "Strategy",
    type: "text",
    required: false,
    placeholder: "e.g. Momentum",
    enabled: true,
  },
  {
    id: "fees",
    label: "Fees",
    type: "number",
    required: false,
    placeholder: "9.95",
    enabled: true,
  },
];

function App() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false);
  const [isChartConfigModalOpen, setIsChartConfigModalOpen] = useState(false);
  const [tradeFields, setTradeFields] =
    useState<TradeField[]>(defaultTradeFields);
  const [chartConfigs, setChartConfigs] =
    useState<ChartConfig[]>(defaultChartConfigs);  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const [filePath, setFilePath] = useState<string>("tradelog.csv");
  const [destinationPath, setDestinationPath] = useState<string>("");  const [editingCell, setEditingCell] = useState<{tradeId: number, fieldId: string} | null>(null);  const [savedCell, setSavedCell] = useState<{tradeId: number, fieldId: string} | null>(null);  const [errorCell, setErrorCell] = useState<{tradeId: number, fieldId: string, message: string} | null>(null);
  const [isImportPreviewModalOpen, setIsImportPreviewModalOpen] = useState(false);  const [previewTrades, setPreviewTrades] = useState<Trade[]>([]);
  const [defaultValues, setDefaultValues] = useState<{[key: string]: string}>({
    pnl: '0',
    qty: '1',
    price: '100',
    fees: '1'
  });
  const [filters, setFilters] = useState<FilterState>({
    symbol: "",
    type: "",
    strategy: "",
    dateFrom: "",
    dateTo: "",
    minPnL: "",
    maxPnL: "",
  }); // Carica i dati salvati all'avvio
  useEffect(() => {
    // Carica il percorso del file salvato
    const savedFilePath = localStorage.getItem("tradelog_filepath");
    if (savedFilePath) {
      setFilePath(savedFilePath);
    }    // Carica il percorso di destinazione salvato
    const savedDestinationPath = localStorage.getItem(
      "tradelog_destination_path"
    );
    if (savedDestinationPath) {
      setDestinationPath(savedDestinationPath);
    }

    // Carica i valori di default salvati
    const savedDefaultValues = localStorage.getItem('tradelog_default_values');
    if (savedDefaultValues) {
      try {
        setDefaultValues(JSON.parse(savedDefaultValues));
      } catch (e) {
        console.error('Error loading default values:', e);
      }
    }

    // Carica i trade salvati
    const savedTrades = localStorage.getItem("tradelog_trades");
    if (savedTrades) {
      try {
        const trades = JSON.parse(savedTrades);
        setUserTrades(trades);
      } catch (error) {
        console.error("Error loading saved trades:", error);
      }
    }
  }, []);

  // Combina i trade demo con quelli reali
  const allTrades = useMemo(() => {
    const demoTrades: Trade[] = [
      {
        id: 1,
        date: "2024-04-12",
        symbol: "AMZN",
        type: "Buy",
        qty: 10,
        price: 3200.0,
        pnl: 500.0,
        fees: 12.5,
        strategy: "Momentum",
      },
      {
        id: 2,
        date: "2024-04-11",
        symbol: "TSLA",
        type: "Sell",
        qty: 5,
        price: 190.0,
        pnl: -1550.0,
        fees: 8.75,
        strategy: "Scalping",
      },
      {
        id: 3,
        date: "2024-04-10",
        symbol: "AAPL",
        type: "Buy",
        qty: 15,
        price: 170.0,
        pnl: 375.0,
        fees: 15.3,
        strategy: "Swing",
      },
      {
        id: 4,
        date: "2024-04-09",
        symbol: "MSFT",
        type: "Sell",
        qty: 8,
        price: 405.0,
        pnl: -2800.0,
        fees: 16.2,
        strategy: "Mean Reversion",
      },
      {
        id: 5,
        date: "2024-04-08",
        symbol: "GOOGL",
        type: "Buy",
        qty: 12,
        price: 2600.0,
        pnl: 600.0,
        fees: 31.2,
        strategy: "Breakout",
      },
      {
        id: 6,
        date: "2024-04-05",
        symbol: "NVDA",
        type: "Buy",
        qty: 20,
        price: 850.0,
        pnl: 1200.0,
        fees: 17.0,
        strategy: "Momentum",
      },
      {
        id: 7,
        date: "2024-04-04",
        symbol: "META",
        type: "Sell",
        qty: 6,
        price: 480.0,
        pnl: -300.0,
        fees: 14.4,
        strategy: "Scalping",
      },
      {
        id: 8,
        date: "2024-04-03",
        symbol: "AMD",
        type: "Buy",
        qty: 25,
        price: 180.0,
        pnl: 750.0,
        fees: 22.5,
        strategy: "Swing",
      },
      {
        id: 9,
        date: "2024-04-02",
        symbol: "NFLX",
        type: "Sell",
        qty: 4,
        price: 420.0,
        pnl: 200.0,
        fees: 8.4,
        strategy: "Mean Reversion",
      },
      {
        id: 10,
        date: "2024-04-01",
        symbol: "CRM",
        type: "Buy",
        qty: 18,
        price: 250.0,
        pnl: -450.0,
        fees: 22.5,
        strategy: "Breakout",
      },
    ];

    // Se non ci sono trade utente, usa solo i demo. Altrimenti usa solo quelli reali
    return userTrades.length > 0 ? userTrades : demoTrades;
  }, [userTrades]);

  const filteredAndSortedTrades = useMemo(() => {
    const filtered = allTrades.filter((trade) => {
      if (
        filters.symbol &&
        !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())
      )
        return false;
      if (filters.type && trade.type !== filters.type) return false;
      if (
        filters.strategy &&
        !trade.strategy.toLowerCase().includes(filters.strategy.toLowerCase())
      )
        return false;
      if (filters.dateFrom && trade.date < filters.dateFrom) return false;
      if (filters.dateTo && trade.date > filters.dateTo) return false;
      if (filters.minPnL && trade.pnl < parseFloat(filters.minPnL))
        return false;
      if (filters.maxPnL && trade.pnl > parseFloat(filters.maxPnL))
        return false;
      return true;
    });

    return filtered.sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];

      if (sortField === "date") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [allTrades, filters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const clearFilters = () => {
    setFilters({
      symbol: "",
      type: "",
      strategy: "",
      dateFrom: "",
      dateTo: "",
      minPnL: "",
      maxPnL: "",
    });
  };

  const openAddTradeModal = () => {
    setIsAddTradeModalOpen(true);
  };
  const closeAddTradeModal = () => {
    setIsAddTradeModalOpen(false);
  };  const handleAddTrade = (tradeData: NewTradeData) => {
    // Crea un nuovo trade con i dati del form o valori di default
    const newTrade: Trade = {
      id: Date.now(),
      date: tradeData.date || new Date().toISOString().split("T")[0],
      symbol: tradeData.symbol || "",
      type: (tradeData.type as "Buy" | "Sell") || "Buy",
      qty: parseFloat(tradeData.qty || defaultValues.qty || "1"),
      price: parseFloat(tradeData.price || defaultValues.price || "100"),
      pnl: parseFloat(tradeData.pnl || defaultValues.pnl || "0"),
      fees: parseFloat(tradeData.fees || defaultValues.fees || "1"),
      strategy: tradeData.strategy || "Manual",
    };

    // Calcola P&L basico (simulazione)
    newTrade.pnl = (Math.random() - 0.5) * 1000; // Simulazione per demo    // Salva il trade
    saveTradeToStorage(newTrade);
    setIsAddTradeModalOpen(false);
  };
  // Funzioni per gestire la configurazione dei campi
  const updateField = (fieldId: string, updates: Partial<TradeField>) => {
    setTradeFields((fields) =>
      fields.map((field) =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    );
  };

  const openNewFieldModal = () => {
    setIsNewFieldModalOpen(true);
  };

  const closeNewFieldModal = () => {
    setIsNewFieldModalOpen(false);
  };

  const addNewField = (fieldData: Omit<TradeField, "id">) => {
    const newId = `custom_${Date.now()}`;
    const newField: TradeField = {
      id: newId,
      ...fieldData,
    };
    setTradeFields((fields) => [...fields, newField]);
    setIsNewFieldModalOpen(false);
  };

  const removeField = (fieldId: string) => {
    // Non permettere la rimozione dei campi core
    const coreFields = ["symbol", "type", "qty", "price", "date"];
    if (coreFields.includes(fieldId)) {
      alert("Cannot remove core fields");
      return;
    }
    setTradeFields((fields) => fields.filter((field) => field.id !== fieldId));
  };
  const resetFieldsToDefault = () => {
    setTradeFields([...defaultTradeFields]);
  };

  // Funzioni per l'analisi e i grafici
  const generateEquityCurveData = () => {
    let runningTotal = 0;
    return allTrades
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trade) => {
        runningTotal += trade.pnl;
        return {
          date: trade.date,
          value: runningTotal,
        };
      });
  };

  const generateMonthlyPnLData = () => {
    const monthlyData: { [key: string]: number } = {};
    allTrades.forEach((trade) => {
      const month = trade.date.substring(0, 7); // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + trade.pnl;
    });
    return Object.entries(monthlyData).map(([month, pnl]) => ({ month, pnl }));
  };

  const generateSymbolDistribution = () => {
    const symbolData: { [key: string]: number } = {};
    allTrades.forEach((trade) => {
      symbolData[trade.symbol] = (symbolData[trade.symbol] || 0) + 1;
    });
    return Object.entries(symbolData).map(([symbol, count]) => ({
      symbol,
      count,
    }));
  };

  const generateStrategyPerformance = () => {
    const strategyData: { [key: string]: { pnl: number; trades: number } } = {};
    allTrades.forEach((trade) => {
      if (!strategyData[trade.strategy]) {
        strategyData[trade.strategy] = { pnl: 0, trades: 0 };
      }
      strategyData[trade.strategy].pnl += trade.pnl;
      strategyData[trade.strategy].trades += 1;
    });
    return Object.entries(strategyData).map(([strategy, data]) => ({
      strategy,
      pnl: data.pnl,
      avgPnL: data.pnl / data.trades,
      trades: data.trades,
    }));
  };

  const generateWinRateData = () => {
    const monthlyWinRate: { [key: string]: { wins: number; total: number } } =
      {};
    allTrades.forEach((trade) => {
      const month = trade.date.substring(0, 7);
      if (!monthlyWinRate[month]) {
        monthlyWinRate[month] = { wins: 0, total: 0 };
      }
      monthlyWinRate[month].total += 1;
      if (trade.pnl > 0) monthlyWinRate[month].wins += 1;
    });
    return Object.entries(monthlyWinRate).map(([month, data]) => ({
      month,
      winRate: (data.wins / data.total) * 100,
    }));
  };

  const generateVolumeData = () => {
    const volumeData: { [key: string]: number } = {};
    allTrades.forEach((trade) => {
      const month = trade.date.substring(0, 7);
      volumeData[month] = (volumeData[month] || 0) + trade.qty * trade.price;
    });
    return Object.entries(volumeData).map(([month, volume]) => ({
      month,
      volume,
    }));
  };

  // Funzioni per gestire la configurazione dei grafici
  const updateChartConfig = (
    chartId: string,
    updates: Partial<ChartConfig>
  ) => {
    setChartConfigs((configs) =>
      configs.map((config) =>
        config.id === chartId ? { ...config, ...updates } : config
      )
    );
  };

  const addNewChart = (chartData: Omit<ChartConfig, "id" | "position">) => {
    const newId = `custom_${Date.now()}`;
    const newPosition = Math.max(...chartConfigs.map((c) => c.position)) + 1;
    const newChart: ChartConfig = {
      id: newId,
      position: newPosition,
      ...chartData,
    };
    setChartConfigs((configs) => [...configs, newChart]);
    setIsChartConfigModalOpen(false);
  };

  const removeChart = (chartId: string) => {
    setChartConfigs((configs) =>
      configs.filter((config) => config.id !== chartId)
    );
  };
  const openChartConfigModal = () => {
    setIsChartConfigModalOpen(true);
  };
  const closeChartConfigModal = () => {
    setIsChartConfigModalOpen(false);
  };
  // Funzione per aprire il dialogo di selezione cartella
  const selectDestinationFolder = async () => {
    // Verifica se siamo in un ambiente Electron
    if (window.electronAPI && window.electronAPI.selectFolder) {
      try {
        const result = await window.electronAPI.selectFolder();
        if (result && !result.canceled && result.filePaths.length > 0) {
          const selectedPath = result.filePaths[0];
          setDestinationPath(selectedPath);
          localStorage.setItem("tradelog_destination_path", selectedPath);
        }
      } catch (error) {
        console.error("Error selecting folder:", error);
        // Fallback al prompt se c'è un errore
        selectDestinationFolderFallback();
      }
    } else {
      // Fallback per browser web
      selectDestinationFolderFallback();
    }
  };
  const selectDestinationFolderFallback = () => {
    const newPath = prompt(
      "Inserisci il percorso della cartella di destinazione:\n(Es: C:\\Users\\Username\\Documents\\Trading)",
      destinationPath || ""
    );

    if (newPath !== null) {
      setDestinationPath(newPath);
      localStorage.setItem("tradelog_destination_path", newPath);
    }
  };

  // Funzione per costruire il percorso completo del file
  const getFullFilePath = () => {
    if (!destinationPath) return filePath;

    const separator = destinationPath.includes("/") ? "/" : "\\";
    const cleanDestination =
      destinationPath.endsWith("/") || destinationPath.endsWith("\\")
        ? destinationPath.slice(0, -1)
        : destinationPath;    return `${cleanDestination}${separator}${filePath}`;
  };  // Funzione per ottenere il valore di default per un campo
  const getDefaultValue = (fieldType: string, fieldId: string): string => {
    // Usa i valori di default configurabili se disponibili
    if (defaultValues[fieldId]) {
      return defaultValues[fieldId];
    }
    
    switch (fieldType) {
      case 'number':
        return '0'
      case 'date':
        return new Date().toISOString().split('T')[0]
      case 'text':
        if (fieldId === 'type') return 'Buy'
        if (fieldId === 'strategy') return 'Unknown'
        return ''
      default:
        return ''
    }
  }

  // Funzione per inizializzare tutti i campi di un trade con valori di default
  const initializeTradeFields = (trade: Trade): Trade => {
    const initializedTrade = { ...trade };
    
    // Assicurati che tutti i campi configurati abbiano un valore
    tradeFields.forEach(field => {
      if (initializedTrade[field.id] === undefined || initializedTrade[field.id] === null || initializedTrade[field.id] === '') {
        if (field.type === 'number') {
          initializedTrade[field.id] = parseFloat(getDefaultValue(field.type, field.id));
        } else {
          initializedTrade[field.id] = getDefaultValue(field.type, field.id);
        }
      }
    });
      return initializedTrade;  };

  // Funzione di validazione per i valori delle celle
  const validateCellValue = (fieldId: string, value: string, fieldType: string): string | null => {
    if (fieldType === 'number') {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return 'Must be a valid number';
      }
      if (fieldId === 'qty' && num < 0) {
        return 'Quantity cannot be negative';
      }
      if (fieldId === 'price' && num < 0) {
        return 'Price cannot be negative';
      }
    }
    
    if (fieldId === 'symbol' && value.trim().length === 0) {
      return 'Symbol is required';
    }
    
    if (fieldId === 'date' && fieldType === 'date') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return 'Must be a valid date';
      }
    }
    
    return null; // No error
  };

  // Funzioni per la modifica inline dei trade
  const handleCellClick = (tradeId: number, fieldId: string) => {
    if (fieldId !== 'id') { // Non permettere modifica dell'ID
      setEditingCell({ tradeId, fieldId });
    }
  };  const handleCellChange = (tradeId: number, fieldId: string, newValue: string) => {
    const field = tradeFields.find(f => f.id === fieldId);
    const validationError = validateCellValue(fieldId, newValue, field?.type || 'text');
    
    if (validationError) {
      setErrorCell({ tradeId, fieldId, message: validationError });
      setTimeout(() => setErrorCell(null), 3000);
      return;
    }
    
    // Pulisci eventuali errori precedenti
    setErrorCell(null);
    
    setUserTrades(prevTrades => {
      const updatedTrades = prevTrades.map(trade => {
        if (trade.id === tradeId) {
          let processedValue: string | number = newValue;
          
          // Converte il valore basato sul tipo di campo
          if (field?.type === 'number') {
            processedValue = parseFloat(newValue) || 0;
          }
          
          return { ...trade, [fieldId]: processedValue };
        }
        return trade;
      });
      
      // Salva automaticamente
      localStorage.setItem('tradelog_trades', JSON.stringify(updatedTrades));
      setTimeout(() => exportToCSV(), 100);
      
      // Mostra feedback di salvataggio
      setSavedCell({ tradeId, fieldId });
      setTimeout(() => setSavedCell(null), 2000);
      
      return updatedTrades;
    });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };
  // Funzione per renderizzare dinamicamente gli header della tabella
  const renderTableHeaders = () => {
    const enabledFields = tradeFields.filter(field => field.enabled);
    
    return (
      <>
        <style>
          {`:root { --column-count: ${enabledFields.length}; }`}
        </style>
        {enabledFields.map(field => (
          <div 
            key={field.id}
            onClick={() => handleSort(field.id as SortField)} 
            className="sortable"
          >
            {field.label} {sortField === field.id && (sortDirection === 'asc' ? '↑' : '↓')}
          </div>
        ))}
      </>
    );
  };// Funzione per renderizzare dinamicamente le celle di una riga
  const renderTableRow = (trade: Trade) => {
    return tradeFields
      .filter(field => field.enabled)
      .map(field => {        const value = trade[field.id] ?? getDefaultValue(field.type, field.id);
        const isEditing = editingCell?.tradeId === trade.id && editingCell?.fieldId === field.id;
        const isSaved = savedCell?.tradeId === trade.id && savedCell?.fieldId === field.id;
        const hasError = errorCell?.tradeId === trade.id && errorCell?.fieldId === field.id;
        
        const renderEditableCell = (content: React.ReactNode, fieldId: string) => (
          <div 
            key={field.id} 
            className={`editable-cell ${isEditing ? 'editing' : ''} ${isSaved ? 'saved' : ''} ${hasError ? 'error' : ''}`}
            onClick={() => handleCellClick(trade.id, fieldId)}
          >
            <div className="edit-hint">
              {hasError ? errorCell?.message : 'Click to edit'}
            </div>
            {isEditing ? (
              field.id === 'type' ? (
                <select
                  className="editable-select"
                  value={String(value)}
                  onChange={(e) => handleCellChange(trade.id, fieldId, e.target.value)}
                  onBlur={handleCellBlur}                  onKeyDown={(e) => handleCellKeyDown(e)}
                  autoFocus
                >
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                  className="editable-input"
                  value={String(value)}
                  onChange={(e) => handleCellChange(trade.id, fieldId, e.target.value)}
                  onBlur={handleCellBlur}
                  onKeyDown={(e) => handleCellKeyDown(e)}
                  autoFocus
                  step={field.type === 'number' ? '0.01' : undefined}
                />
              )
            ) : (
              content
            )}
          </div>
        );
        
        switch (field.id) {
          case 'id':
            return <div key={field.id} className="id-cell">{value}</div>
          case 'date':
            return renderEditableCell(formatDate(String(value)), field.id)
          case 'symbol':
            return renderEditableCell(<span className="symbol">{String(value)}</span>, field.id)
          case 'type':
            return renderEditableCell(
              <span className={`trade-type ${String(value).toLowerCase()}`}>
                {String(value)}
              </span>, 
              field.id
            )
          case 'qty':
            return renderEditableCell(Number(value).toLocaleString(), field.id)
          case 'price':
            return renderEditableCell(`$${Number(value).toFixed(2)}`, field.id)
          case 'fees':
            return renderEditableCell(`$${Number(value).toFixed(2)}`, field.id)
          case 'pnl': {
            const pnlValue = Number(value)
            return renderEditableCell(
              <span className={pnlValue >= 0 ? "positive" : "negative"}>
                {pnlValue >= 0 ? "+" : ""}${Math.abs(pnlValue).toFixed(2)}
              </span>,
              field.id
            )
          }
          case 'strategy':
            return renderEditableCell(<span className="strategy">{String(value)}</span>, field.id)
          default:
            if (field.type === 'number') {
              return renderEditableCell(Number(value).toFixed(2), field.id)
            }
            return renderEditableCell(String(value), field.id)
        }
      })
  }

  // Funzioni per gestire i dati CSV/Excel
  const exportToCSV = async () => {
    // Assicurati che il nome del file sia valido
    const fileName = filePath.toLowerCase().endsWith(".csv")
      ? filePath
      : filePath + ".csv";    // Genera header dinamicamente dai campi configurati
    const headers = tradeFields.filter(field => field.enabled).map(field => field.label);
    
    const csvContent = [
      headers.join(","),
      ...allTrades.map(trade => 
        tradeFields
          .filter(field => field.enabled)
          .map(field => {
            const value = trade[field.id] ?? getDefaultValue(field.type, field.id);
            return String(value);
          })
          .join(",")
      )
    ].join("\n");// Se siamo in Electron e abbiamo un percorso di destinazione, salva direttamente
    if (window.electronAPI && window.electronAPI.saveFile && destinationPath) {
      try {
        const fullPath = getFullFilePath();
        await window.electronAPI.saveFile(csvContent, fullPath);
        return { success: true, message: `File salvato in: ${fullPath}` };
      } catch (error) {
        console.error("Error saving file directly:", error);
        // Continua con il download normale
      }
    }

    // Fallback per browser web o se il salvataggio diretto fallisce
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true, message: `File scaricato: ${fileName}` };
  };

  // Export manuale con messaggio di conferma
  const exportToCSVManual = async () => {
    const result = await exportToCSV();
    if (result.success) {
      alert(
        `Export completato!\n${result.message}\n\nDati: ${allTrades.length} trade esportati`
      );    }
  };

  // Funzione per eseguire l'import effettivo
  const performImport = (newTrades: Trade[]) => {
    // Aggiunge i nuovi trade a quelli esistenti invece di sostituirli
    setUserTrades((prevTrades) => {
      // Se non ci sono trade reali (solo demo), inizia con una lista vuota
      const currentRealTrades = prevTrades.length > 0 ? prevTrades : [];

      // Trova l'ID più alto esistente per evitare conflitti
      const maxExistingId = Math.max(
        0,
        ...currentRealTrades.map((t) => t.id)
      );

      // Aggiorna gli ID dei trade importati per evitare duplicati
      const tradesWithNewIds = newTrades.map((trade, index) => ({
        ...trade,
        id: maxExistingId + index + 1,
      }));

      // Combina trade esistenti con quelli importati
      const combinedTrades = [...currentRealTrades, ...tradesWithNewIds];

      // Salva la lista completa nel localStorage
      localStorage.setItem(
        "tradelog_trades",
        JSON.stringify(combinedTrades)
      );

      return combinedTrades;
    });

    // Salva automaticamente nel file configurato (senza cambiare le impostazioni)
    setTimeout(() => exportToCSV(), 100);

    const currentCount = userTrades.length > 0 ? userTrades.length : 0;
    alert(
      `Successfully imported ${newTrades.length} trades! 
Total trades now: ${currentCount + newTrades.length}
Data saved to: ${getFullFilePath()}`
    );
  };

  const importFromCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n");      const newTrades: Trade[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        if (values.length >= 3 && values[0]) { // Minimo ID, symbol, type
          // Crea un trade con tutti i campi configurati
          const trade: Trade = {
            id: parseInt(values[0]) || Date.now() + i,
            date: values[1] || getDefaultValue('date', 'date'),
            symbol: values[2] || getDefaultValue('text', 'symbol'),
            type: (values[3] as 'Buy' | 'Sell') || getDefaultValue('text', 'type') as 'Buy' | 'Sell',            qty: parseFloat(values[4]) || parseFloat(getDefaultValue('number', 'qty')),
            price: parseFloat(values[5]) || parseFloat(getDefaultValue('number', 'price')),
            pnl: parseFloat(values[6]) || parseFloat(getDefaultValue('number', 'pnl')),
            fees: parseFloat(values[7]) || parseFloat(getDefaultValue('number', 'fees')),
            strategy: values[8] || getDefaultValue('text', 'strategy')
          };
          
          // Aggiungi campi personalizzati se configurati
          tradeFields.forEach((field, index) => {
            if (!['id', 'date', 'symbol', 'type', 'qty', 'price', 'pnl', 'fees', 'strategy'].includes(field.id)) {
              const csvIndex = 9 + index; // Dopo i campi base
              const fieldValue = values[csvIndex] || getDefaultValue(field.type, field.id);
              (trade as Record<string, string | number>)[field.id] = field.type === 'number' ? parseFloat(fieldValue) || 0 : fieldValue;
            }
          });          
          newTrades.push(initializeTradeFields(trade));
        }      }
      if (newTrades.length > 0) {
        // Mostra sempre il modal di preview per permettere la modifica prima dell'import
        setPreviewTrades(newTrades);
        setIsImportPreviewModalOpen(true);
      }
    };
    reader.readAsText(file);
    // Reset del valore dell'input per permettere di importare lo stesso file nuovamente    event.target.value = ''
  };

  const saveTradeToStorage = (trade: Trade) => {
    // Aggiorna lo stato locale
    setUserTrades((prevTrades) => {
      const updatedTrades = [...prevTrades, trade];
      // Salva anche nel localStorage
      localStorage.setItem("tradelog_trades", JSON.stringify(updatedTrades));
      return updatedTrades;
    });

    // Salva automaticamente nel file configurato
    setTimeout(() => exportToCSV(), 100);
  }; // Componente per renderizzare i grafici
  const renderChart = (config: ChartConfig) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any[] = [];
    let maxValue = 0;
    let minValue = 0;

    switch (config.dataSource) {
      case "pnl":
        if (config.type === "line" && config.id === "equity_curve") {
          data = generateEquityCurveData();
          maxValue = Math.max(...data.map((d) => d.value));
          minValue = Math.min(...data.map((d) => d.value));
        } else {
          data = generateMonthlyPnLData();
          maxValue = Math.max(...data.map((d) => d.pnl));
          minValue = Math.min(...data.map((d) => d.pnl));
        }
        break;
      case "symbols":
        data = generateSymbolDistribution();
        maxValue = Math.max(...data.map((d) => d.count));
        break;
      case "strategies":
        data = generateStrategyPerformance();
        maxValue = Math.max(...data.map((d) => d.pnl));
        minValue = Math.min(...data.map((d) => d.pnl));
        break;
      case "winRate":
        data = generateWinRateData();
        maxValue = 100;
        minValue = 0;
        break;
      case "volume":
        data = generateVolumeData();
        maxValue = Math.max(...data.map((d) => d.volume));
        break;
    }

    const chartHeight = 200;
    const chartWidth = 300;

    if (config.type === "line" || config.type === "area") {
      const points = data
        .map((item, index) => {
          const x = (index / (data.length - 1)) * chartWidth;
          const value =
            config.dataSource === "pnl" && config.id === "equity_curve"
              ? item.value
              : config.dataSource === "winRate"
              ? item.winRate
              : config.dataSource === "volume"
              ? item.volume
              : item.pnl;
          const y =
            chartHeight -
            ((value - minValue) / (maxValue - minValue)) * chartHeight;
          return `${x},${y}`;
        })
        .join(" ");

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          {config.type === "area" && (
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
      );
    }

    if (config.type === "bar") {
      const barWidth = (chartWidth / data.length) * 0.8;
      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          {data.map((item, index) => {
            const value =
              config.dataSource === "strategies"
                ? item.pnl
                : item.pnl || item.volume;
            const height =
              (Math.abs(value - minValue) / (maxValue - minValue)) *
              chartHeight;
            const x = (index / data.length) * chartWidth + barWidth * 0.1;
            const y =
              value >= 0
                ? chartHeight - height
                : chartHeight -
                  ((0 - minValue) / (maxValue - minValue)) * chartHeight;

            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={barWidth}
                height={height}
                fill={value >= 0 ? "#10b981" : "#ef4444"}
              />
            );
          })}
        </svg>
      );
    }

    if (config.type === "pie") {
      const total = data.reduce((sum, item) => sum + item.count, 0);
      let currentAngle = 0;
      const radius = 80;
      const centerX = chartWidth / 2;
      const centerY = chartHeight / 2;

      return (
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="chart-svg">
          {data.map((item, index) => {
            const angle = (item.count / total) * 360;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            currentAngle += angle;

            const x1 =
              centerX + radius * Math.cos(((startAngle - 90) * Math.PI) / 180);
            const y1 =
              centerY + radius * Math.sin(((startAngle - 90) * Math.PI) / 180);
            const x2 =
              centerX + radius * Math.cos(((endAngle - 90) * Math.PI) / 180);
            const y2 =
              centerY + radius * Math.sin(((endAngle - 90) * Math.PI) / 180);

            const largeArcFlag = angle > 180 ? 1 : 0;
            const colors = [
              "#646cff",
              "#10b981",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6",
              "#06b6d4",
            ];

            return (
              <path
                key={index}
                d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                fill={colors[index % colors.length]}
              />
            );
          })}
        </svg>
      );
    }

    return <div className="chart-placeholder">Chart type not supported</div>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Dashboard data calculation
  const recentTrades = allTrades.slice(0, 5).map((trade) => ({
    ...trade,
    date: formatDate(trade.date),
  }));

  const totalPnL = allTrades.reduce((sum, trade) => sum + trade.pnl, 0);
  const winningTrades = allTrades.filter((trade) => trade.pnl > 0).length;
  const winRate = (winningTrades / allTrades.length) * 100;
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="logo">
          <h1>TradeLog</h1>
        </div>
        <nav className="nav">
          {["Dashboard", "Trades", "Analysis", "Settings"].map((tab) => (
            <button
              key={tab}
              className={`nav-button ${activeTab === tab ? "active" : ""}`}
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
        {activeTab === "Dashboard" && (
          <>
            {/* Metrics Cards */}
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Total P&L</h3>
                <div
                  className={`metric-value ${
                    totalPnL >= 0 ? "positive" : "negative"
                  }`}
                >
                  {totalPnL >= 0 ? "+" : ""}
                  {totalPnL.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="metric-card">
                <h3>Win Rate</h3>
                <div className="metric-value">{winRate.toFixed(1)}%</div>
                <div className="chart-container">
                  <svg className="equity-chart" viewBox="0 0 200 60">
                    <polyline
                      points="10,50 30,45 50,40 70,35 90,30 110,25 130,20 150,15 170,10 190,5"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </svg>
                </div>{" "}
              </div>{" "}
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
                    <div className={trade.pnl >= 0 ? "positive" : "negative"}>
                      {trade.pnl >= 0 ? "+" : ""}
                      {trade.pnl.toFixed(1)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {activeTab === "Trades" && (
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
                    onChange={(e) =>
                      handleFilterChange("symbol", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
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
                    onChange={(e) =>
                      handleFilterChange("strategy", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>Date From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      handleFilterChange("dateFrom", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>Date To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      handleFilterChange("dateTo", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>Min P&L</label>
                  <input
                    type="number"
                    placeholder="-1000"
                    value={filters.minPnL}
                    onChange={(e) =>
                      handleFilterChange("minPnL", e.target.value)
                    }
                  />
                </div>
                <div className="filter-group">
                  <label>Max P&L</label>
                  <input
                    type="number"
                    placeholder="1000"
                    value={filters.maxPnL}
                    onChange={(e) =>
                      handleFilterChange("maxPnL", e.target.value)
                    }
                  />
                </div>
                <div className="filter-actions">
                  <button onClick={clearFilters} className="clear-filters-btn">
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>{" "}
            {/* Trades Table */}
            <div className="trades-section">
              <div className="trades-header">
                <h3>All Trades ({filteredAndSortedTrades.length})</h3>
                <div className="trades-actions">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={importFromCSV}
                    style={{ display: "none" }}
                    id="csv-import"
                  />
                  <label htmlFor="csv-import" className="import-btn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                    Import CSV
                  </label>
                  <button onClick={exportToCSVManual} className="export-btn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="12" y1="18" x2="12" y2="12"></line>
                      <line x1="9" y1="15" x2="12" y2="12"></line>
                      <line x1="15" y1="15" x2="12" y2="12"></line>
                    </svg>
                    Export CSV
                  </button>
                  <button onClick={openAddTradeModal} className="add-trade-btn">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Trade
                  </button>{" "}
                </div>
              </div>
                  <div className="trades-table-full">
                <div className="table-header-full">
                  {renderTableHeaders()}
                </div>                {filteredAndSortedTrades.map((trade) => (
                  <div key={trade.id} className="table-row-full">
                    {renderTableRow(trade)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}{" "}
        {activeTab === "Analysis" && (
          <div className="analysis-page">
            {/* Analysis Header */}
            <div className="analysis-header">
              <div className="analysis-title">
                <h3>Trading Analysis</h3>
                <p>Comprehensive analysis of your trading performance</p>
              </div>
              <div className="analysis-actions">
                <button
                  onClick={openChartConfigModal}
                  className="add-chart-btn"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
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
                <div
                  className={`metric-value ${
                    totalPnL >= 0 ? "positive" : "negative"
                  }`}
                >
                  {totalPnL >= 0 ? "+" : ""}
                  {totalPnL.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
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
                <div
                  className={`metric-value ${
                    totalPnL / allTrades.length >= 0 ? "positive" : "negative"
                  }`}
                >
                  {(totalPnL / allTrades.length).toFixed(2)}
                </div>
              </div>
            </div>
            {/* Charts Grid */}
            <div className="charts-grid">
              {chartConfigs
                .filter((config) => config.enabled)
                .sort((a, b) => a.position - b.position)
                .map((config) => (
                  <div key={config.id} className="chart-container">
                    <div className="chart-header">
                      <h4>{config.title}</h4>
                      <div className="chart-controls">
                        <button
                          onClick={() =>
                            updateChartConfig(config.id, { enabled: false })
                          }
                          className="chart-hide-btn"
                          title="Hide chart"
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                          </svg>
                        </button>
                        {!config.id.startsWith("equity_curve") &&
                          !config.id.startsWith("monthly_pnl") && (
                            <button
                              onClick={() => removeChart(config.id)}
                              className="chart-remove-btn"
                              title="Remove chart"
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          )}
                      </div>
                    </div>
                    <div className="chart-content">{renderChart(config)}</div>
                  </div>
                ))}
            </div>{" "}
            {/* Hidden Charts */}
            {chartConfigs.some((config) => !config.enabled) && (
              <div className="hidden-charts-section">
                <h4>Hidden Charts</h4>
                <div className="hidden-charts-list">
                  {chartConfigs
                    .filter((config) => !config.enabled)
                    .map((config) => (
                      <div key={config.id} className="hidden-chart-item">
                        <span>{config.title}</span>
                        <button
                          onClick={() =>
                            updateChartConfig(config.id, { enabled: true })
                          }
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
        )}{" "}
        {activeTab === "Settings" && (
          <div className="settings-page">
            {/* File Path Configuration */}
            <div className="settings-section">
              {" "}
              <h3>Data File Configuration</h3>
              <p>
                Set the file path where your trade data will be saved and
                exported.
              </p>{" "}
              <div className="help-box">
                <h4>💡 How it works:</h4>
                <ul>
                  <li>
                    <strong>Auto-save:</strong> Every new trade is automatically
                    saved to the configured file
                  </li>
                  <li>
                    <strong>Import CSV:</strong> Adds imported trades to
                    existing data (does not replace)
                  </li>
                  <li>
                    <strong>Export CSV:</strong> Always uses the file path
                    configured below
                  </li>
                  <li>
                    <strong>Web Browser:</strong> Files are downloaded to your
                    default download folder
                  </li>
                  <li>
                    <strong>Electron App:</strong> Files are saved directly to
                    the specified destination folder
                  </li>
                </ul>
              </div>
              <div className="file-path-config">
                <div className="form-group">
                  <label htmlFor="file-path">CSV File Name</label>
                  <input
                    type="text"
                    id="file-path"
                    value={filePath}
                    onChange={(e) => {
                      let newPath = e.target.value;
                      // Assicurati che il file abbia l'estensione .csv
                      if (newPath && !newPath.toLowerCase().endsWith(".csv")) {
                        newPath = newPath.replace(/\.[^/.]+$/, "") + ".csv";
                      }
                      setFilePath(newPath);
                      localStorage.setItem("tradelog_filepath", newPath);
                    }}
                    onBlur={(e) => {
                      // Validazione finale quando l'utente esce dal campo
                      let finalPath = e.target.value;
                      if (
                        finalPath &&
                        !finalPath.toLowerCase().endsWith(".csv")
                      ) {
                        finalPath = finalPath + ".csv";
                        setFilePath(finalPath);
                        localStorage.setItem("tradelog_filepath", finalPath);
                      }
                    }}
                    placeholder="e.g. my_trades.csv"
                    className="file-path-input"
                  />
                  <small>
                    Enter the name for your CSV file. File will be downloaded
                    when you export data.
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="destination-path">Destination Folder</label>
                  <div className="destination-path-group">
                    <input
                      type="text"
                      id="destination-path"
                      value={destinationPath}
                      onChange={(e) => {
                        setDestinationPath(e.target.value);
                        localStorage.setItem(
                          "tradelog_destination_path",
                          e.target.value
                        );
                      }}
                      placeholder="e.g. C:\Users\Username\Documents\Trading"
                      className="file-path-input"
                    />
                    <button
                      onClick={selectDestinationFolder}
                      className="browse-folder-btn"
                      title="Browse for folder"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      </svg>
                      Browse
                    </button>
                  </div>
                  <small>
                    Specify the folder where CSV files will be saved. Leave
                    empty to use default download folder.
                  </small>
                </div>

                <div className="file-info">
                  <div className="info-item">
                    <strong>Current file:</strong> {filePath}
                  </div>
                  <div className="info-item">
                    <strong>Destination:</strong>{" "}
                    {destinationPath || "Default download folder"}
                  </div>{" "}
                  <div className="info-item">
                    <strong>Full path:</strong> {getFullFilePath()}
                  </div>
                  <div className="info-item">
                    <strong>Storage:</strong> Data is saved locally in your
                    browser and exported to CSV
                  </div>
                </div>
              </div>            </div>

            {/* Default Values Configuration */}
            <div className="settings-section">
              <h3>Default Values Configuration</h3>
              <p>Set default values that will be used when importing data or creating new trades.</p>
              
              <div className="default-values-grid">
                <div className="form-group">
                  <label htmlFor="default-pnl">Default P&L</label>
                  <input
                    type="number"
                    id="default-pnl"
                    value={defaultValues.pnl || '0'}
                    onChange={(e) => {
                      const newDefaults = { ...defaultValues, pnl: e.target.value };
                      setDefaultValues(newDefaults);
                      localStorage.setItem('tradelog_default_values', JSON.stringify(newDefaults));
                    }}
                    step="0.01"
                    placeholder="0.00"
                  />
                  <small>Default profit/loss value for new trades</small>
                </div>

                <div className="form-group">
                  <label htmlFor="default-qty">Default Quantity</label>
                  <input
                    type="number"
                    id="default-qty"
                    value={defaultValues.qty || '1'}
                    onChange={(e) => {
                      const newDefaults = { ...defaultValues, qty: e.target.value };
                      setDefaultValues(newDefaults);
                      localStorage.setItem('tradelog_default_values', JSON.stringify(newDefaults));
                    }}
                    min="1"
                    placeholder="1"
                  />
                  <small>Default quantity for new trades</small>
                </div>

                <div className="form-group">
                  <label htmlFor="default-price">Default Price</label>
                  <input
                    type="number"
                    id="default-price"
                    value={defaultValues.price || '100'}
                    onChange={(e) => {
                      const newDefaults = { ...defaultValues, price: e.target.value };
                      setDefaultValues(newDefaults);
                      localStorage.setItem('tradelog_default_values', JSON.stringify(newDefaults));
                    }}
                    step="0.01"
                    min="0"
                    placeholder="100.00"
                  />
                  <small>Default price for new trades</small>
                </div>

                <div className="form-group">
                  <label htmlFor="default-fees">Default Fees</label>
                  <input
                    type="number"
                    id="default-fees"
                    value={defaultValues.fees || '1'}
                    onChange={(e) => {
                      const newDefaults = { ...defaultValues, fees: e.target.value };
                      setDefaultValues(newDefaults);
                      localStorage.setItem('tradelog_default_values', JSON.stringify(newDefaults));
                    }}
                    step="0.01"
                    min="0"
                    placeholder="1.00"
                  />
                  <small>Default fees for new trades</small>
                </div>
              </div>
            </div>

            {/* Trade Form Configuration */}
            <div className="settings-section">
              <h3>Trade Form Configuration</h3>
              <p>Customize the fields that appear when adding a new trade.</p>
              <div className="settings-actions">
                <button onClick={openNewFieldModal} className="add-field-btn">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Add Field
                </button>
                <button
                  onClick={resetFieldsToDefault}
                  className="reset-fields-btn"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  Reset to Default
                </button>
              </div>{" "}
              <div className="fields-list">
                {tradeFields.map((field) => (
                  <div key={field.id} className="field-config">
                    <div className="field-header">
                      <div className="field-info">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateField(field.id, { label: e.target.value })
                          }
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
                            onChange={(e) =>
                              updateField(field.id, {
                                enabled: e.target.checked,
                              })
                            }
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        {!["symbol", "type", "qty", "price", "date"].includes(
                          field.id
                        ) && (
                          <button
                            onClick={() => removeField(field.id)}
                            className="remove-field-btn"
                            title="Remove field"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
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
                          onChange={(e) =>
                            updateField(field.id, {
                              type: e.target.value as TradeField["type"],
                            })
                          }
                          disabled={[
                            "symbol",
                            "type",
                            "qty",
                            "price",
                            "date",
                          ].includes(field.id)}
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
                            onChange={(e) =>
                              updateField(field.id, {
                                required: e.target.checked,
                              })
                            }
                            disabled={[
                              "symbol",
                              "type",
                              "qty",
                              "price",
                              "date",
                            ].includes(field.id)}
                          />
                          Required
                        </label>
                      </div>

                      <div className="field-option">
                        <label>Placeholder:</label>
                        <input
                          type="text"
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateField(field.id, {
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Enter placeholder text"
                        />
                      </div>

                      {field.type === "select" && (
                        <div className="field-option">
                          <label>Options (comma separated):</label>
                          <input
                            type="text"
                            value={field.options?.join(", ") || ""}
                            onChange={(e) =>
                              updateField(field.id, {
                                options: e.target.value
                                  .split(",")
                                  .map((opt) => opt.trim())
                                  .filter(Boolean),
                              })
                            }
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
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>{" "}
            <form
              className="trade-form"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);                const tradeData: NewTradeData = {
                  symbol: formData.get("symbol") as string | null,
                  type: formData.get("type") as string | null,
                  qty: formData.get("qty") as string | null,
                  price: formData.get("price") as string | null,
                  date: formData.get("date") as string | null,
                  strategy: formData.get("strategy") as string | null,
                  fees: formData.get("fees") as string | null,
                  pnl: formData.get("pnl") as string | null,
                };
                handleAddTrade(tradeData);
              }}
            >
              <div className="form-grid">
                {tradeFields
                  .filter((field) => field.enabled)
                  .map((field) => (
                    <div key={field.id} className="form-group">
                      <label htmlFor={field.id}>
                        {field.label} {field.required && "*"}
                      </label>
                      {field.type === "select" ? (
                        <select
                          id={field.id}
                          name={field.id}
                          required={field.required}
                        >
                          <option value="">
                            Select {field.label.toLowerCase()}
                          </option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (                        <input
                          type={field.type}
                          id={field.id}
                          name={field.id}
                          placeholder={field.placeholder}
                          defaultValue={defaultValues[field.id] || ''}
                          required={field.required}
                          {...(field.type === "number"
                            ? {
                                step: field.id === "qty" ? "1" : "0.01",
                                ...(field.id === "qty" || field.id === "entryPrice" || field.id === "exitPrice" || field.id === "stopLoss" || field.id === "takeProfit" || field.id === "targetProfit" || field.id === "fees" || field.id === "actualEntryPrice" || field.id === "actualExitPrice" || field.id === "price"
                                  ? { min: "0" }
                                  : {}),
                              }
                            : {})}
                        />
                      )}
                    </div>
                  ))}
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  onClick={closeAddTradeModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Trade
                </button>
              </div>
            </form>{" "}
          </div>
        </div>
      )}

      {/* New Field Configuration Modal */}
      {isNewFieldModalOpen && (
        <div className="modal-overlay" onClick={closeNewFieldModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Field</h3>
              <button onClick={closeNewFieldModal} className="modal-close-btn">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form
              className="new-field-form"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const fieldData = {
                  label: formData.get("label") as string,
                  type: formData.get("type") as TradeField["type"],
                  required: formData.get("required") === "on",
                  placeholder: (formData.get("placeholder") as string) || "",
                  enabled: true,
                  ...(formData.get("type") === "select"
                    ? {
                        options: (formData.get("options") as string)
                          .split(",")
                          .map((opt) => opt.trim())
                          .filter(Boolean),
                      }
                    : {}),
                };
                addNewField(fieldData);
              }}
            >
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
                      const optionsGroup = document.getElementById(
                        "select-options-group"
                      );
                      if (optionsGroup) {
                        optionsGroup.style.display =
                          e.target.value === "select" ? "block" : "none";
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

              <div
                className="form-group conditional-options"
                id="select-options-group"
                style={{ display: "none" }}
              >
                <label htmlFor="new-field-options">
                  Select Options (comma separated)
                </label>
                <input
                  type="text"
                  id="new-field-options"
                  name="options"
                  placeholder="Option 1, Option 2, Option 3"
                />
                <small>Separate multiple options with commas</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={closeNewFieldModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Field
                </button>
              </div>
            </form>{" "}
          </div>
        </div>
      )}

      {/* Chart Configuration Modal */}
      {isChartConfigModalOpen && (
        <div className="modal-overlay" onClick={closeChartConfigModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Chart</h3>
              <button
                onClick={closeChartConfigModal}
                className="modal-close-btn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <form
              className="chart-config-form"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const chartData = {
                  title: formData.get("title") as string,
                  type: formData.get("type") as ChartConfig["type"],
                  dataSource: formData.get(
                    "dataSource"
                  ) as ChartConfig["dataSource"],
                  enabled: true,
                };
                addNewChart(chartData);
              }}
            >
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
                <button
                  type="button"
                  onClick={closeChartConfigModal}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add Chart
                </button>
              </div>
            </form>
          </div>        </div>
      )}

      {/* Import Preview Modal */}
      {isImportPreviewModalOpen && (
        <div className="modal-overlay">
          <div className="modal import-preview-modal">
            <div className="modal-header">
              <h2>Preview Import Data</h2>
              <button
                onClick={() => setIsImportPreviewModalOpen(false)}
                className="close-button"
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <p>Review and modify the data before importing:</p>
              
              <div className="preview-table-container">
                <div className="preview-table">
                  <div className="preview-table-header">
                    {tradeFields.filter(field => field.enabled).map(field => (
                      <div key={field.id} className="preview-header-cell">
                        {field.label}
                      </div>
                    ))}
                  </div>
                  
                  {previewTrades.map((trade, index) => (
                    <div key={index} className="preview-table-row">
                      {tradeFields.filter(field => field.enabled).map(field => (
                        <div key={field.id} className="preview-table-cell">
                          {field.id === 'type' ? (
                            <select
                              value={String(trade[field.id] || getDefaultValue(field.type, field.id))}
                              onChange={(e) => {
                                const updatedTrades = [...previewTrades];
                                updatedTrades[index] = { ...updatedTrades[index], [field.id]: e.target.value };
                                setPreviewTrades(updatedTrades);
                              }}
                              className="preview-input"
                            >
                              <option value="Buy">Buy</option>
                              <option value="Sell">Sell</option>
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              value={String(trade[field.id] || getDefaultValue(field.type, field.id))}
                              onChange={(e) => {
                                const updatedTrades = [...previewTrades];
                                let value: string | number = e.target.value;
                                if (field.type === 'number') {
                                  value = parseFloat(e.target.value) || 0;
                                }
                                updatedTrades[index] = { ...updatedTrades[index], [field.id]: value };
                                setPreviewTrades(updatedTrades);
                              }}
                              className="preview-input"
                              step={field.type === 'number' ? '0.01' : undefined}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="preview-actions">
                <button
                  onClick={() => setIsImportPreviewModalOpen(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    performImport(previewTrades);
                    setIsImportPreviewModalOpen(false);
                    setPreviewTrades([]);
                  }}
                  className="import-btn"
                >
                  Import {previewTrades.length} Trade{previewTrades.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
