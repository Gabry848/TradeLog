import { useState, useMemo } from "react";
import "./App_NEW.css";

// Components
import Header from "./components/layout/Header";
import Dashboard from "./components/dashboard/Dashboard";
import TradesPage from "./components/trades/TradesPage";
import AddTradeModal from "./components/modals/AddTradeModal";

// Types
import { 
  Trade, 
  ActiveTab, 
  FilterState, 
  SortField, 
  SortDirection, 
  TradeField, 
  NewTradeData,
  EditingCell,
  ErrorCell,
  DefaultValues
} from "./types";

// Hooks
import { useLocalStorage } from "./hooks/useLocalStorage";

// Utils
import { exportToCSV, importFromCSV } from "./utils/fileUtils";
import { validateCellValue } from "./utils/tradeUtils";

// Default configurations
import { defaultTradeFields } from "./data/defaults";

function App() {
  // State management
  const [activeTab, setActiveTab] = useState<ActiveTab>("Dashboard");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
    // Local storage hooks
  const [userTrades, setUserTrades] = useLocalStorage<Trade[]>('tradelog_trades', []);
  const [tradeFields] = useLocalStorage<TradeField[]>('tradelog_fields', defaultTradeFields);
  const [filePath] = useLocalStorage<string>("tradelog_filepath", "tradelog.csv");
  const [destinationPath] = useLocalStorage<string>("tradelog_destination_path", "");
  const [defaultValues] = useLocalStorage<DefaultValues>('tradelog_default_values', {
    pnl: '0',
    qty: '1',
    price: '100',
    fees: '1'
  });

  // Filters and editing state
  const [filters, setFilters] = useState<FilterState>({
    symbol: "",
    type: "",
    strategy: "",
    dateFrom: "",
    dateTo: "",
    minPnL: "",
    maxPnL: "",
  });

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [savedCell, setSavedCell] = useState<EditingCell | null>(null);
  const [errorCell, setErrorCell] = useState<ErrorCell | null>(null);

  // Combine demo trades with user trades
  const allTrades = useMemo(() => {
    return userTrades;
  }, [userTrades]);
  // Filtered and sorted trades
  const filteredAndSortedTrades = useMemo(() => {
    const filtered = allTrades.filter((trade: Trade) => {
      if (filters.symbol && !trade.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
      if (filters.type && trade.type !== filters.type) return false;
      if (filters.strategy && !trade.strategy.toLowerCase().includes(filters.strategy.toLowerCase())) return false;
      if (filters.dateFrom && trade.date < filters.dateFrom) return false;
      if (filters.dateTo && trade.date > filters.dateTo) return false;
      if (filters.minPnL && trade.pnl < parseFloat(filters.minPnL)) return false;
      if (filters.maxPnL && trade.pnl > parseFloat(filters.maxPnL)) return false;
      return true;
    });

    return filtered.sort((a: Trade, b: Trade) => {
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

  // Event handlers
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

  const handleAddTrade = (tradeData: NewTradeData) => {
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
    newTrade.pnl = (Math.random() - 0.5) * 1000;

    // Salva il trade
    setUserTrades((prevTrades: Trade[]) => [...prevTrades, newTrade]);
    setIsAddTradeModalOpen(false);

    // Auto export
    setTimeout(() => handleExport(), 100);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const newTrades = importFromCSV(text, tradeFields, defaultValues);
      
      if (newTrades.length > 0) {
        // Aggiunge i nuovi trade a quelli esistenti
        setUserTrades((prevTrades: Trade[]) => {
          const currentRealTrades = prevTrades.length > 0 ? prevTrades : [];
          const maxExistingId = Math.max(0, ...currentRealTrades.map((t) => t.id));
          
          const tradesWithNewIds = newTrades.map((trade, index) => ({
            ...trade,
            id: maxExistingId + index + 1,
          }));

          return [...currentRealTrades, ...tradesWithNewIds];
        });

        setTimeout(() => handleExport(), 100);
        alert(`Successfully imported ${newTrades.length} trades!`);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExport = async () => {
    const result = await exportToCSV(allTrades, tradeFields, filePath, destinationPath, defaultValues);
    if (result.success) {
      alert(`Export completato!\n${result.message}\n\nDati: ${allTrades.length} trade esportati`);
    }
  };

  // Cell editing handlers
  const handleCellClick = (tradeId: number, fieldId: string) => {
    if (fieldId !== 'id') {
      setEditingCell({ tradeId, fieldId });
    }
  };

  const handleCellChange = (tradeId: number, fieldId: string, newValue: string) => {
    const field = tradeFields.find(f => f.id === fieldId);
    const validationError = validateCellValue(fieldId, newValue, field?.type || 'text');
    
    if (validationError) {
      setErrorCell({ tradeId, fieldId, message: validationError });
      setTimeout(() => setErrorCell(null), 3000);
      return;
    }
    
    setErrorCell(null);
    
    setUserTrades((prevTrades: Trade[]) => {
      const updatedTrades = prevTrades.map((trade: Trade) => {
        if (trade.id === tradeId) {
          let processedValue: string | number = newValue;
          
          if (field?.type === 'number') {
            processedValue = parseFloat(newValue) || 0;
          }
          
          return { ...trade, [fieldId]: processedValue } as Trade;
        }
        return trade;
      });
      
      setTimeout(() => handleExport(), 100);
      setSavedCell({ tradeId, fieldId });
      setTimeout(() => setSavedCell(null), 2000);
      
      return updatedTrades;
    });
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Render main content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case "Dashboard":
        return <Dashboard trades={allTrades} />;
      
      case "Trades":
        return (
          <TradesPage
            trades={filteredAndSortedTrades}
            tradeFields={tradeFields}
            defaultValues={defaultValues}
            filters={filters}
            sortField={sortField}
            sortDirection={sortDirection}
            editingCell={editingCell}
            savedCell={savedCell}
            errorCell={errorCell}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onSort={handleSort}
            onImport={handleImport}
            onExport={handleExport}
            onAddTrade={() => setIsAddTradeModalOpen(true)}
            onCellClick={handleCellClick}
            onCellChange={handleCellChange}
            onCellBlur={handleCellBlur}
            onCellKeyDown={handleCellKeyDown}
          />
        );
      
      case "Analysis":
        return (
          <div className="coming-soon">
            <h3>Analysis</h3>
            <p>Advanced analytics and charts coming soon!</p>
          </div>
        );
      
      case "Settings":
        return (
          <div className="coming-soon">
            <h3>Settings</h3>
            <p>Configuration options coming soon!</p>
          </div>
        );
      
      default:
        return <Dashboard trades={allTrades} />;
    }
  };

  return (
    <div className="app">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main">
        {renderMainContent()}
      </main>

      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        tradeFields={tradeFields}
        defaultValues={defaultValues}
        onClose={() => setIsAddTradeModalOpen(false)}
        onSubmit={handleAddTrade}
      />
    </div>
  );
}

export default App;
