import { useState, useMemo } from "react";
import "./App_NEW.css";
import "./styles/custom-charts.css";

// Components
import Header from "./components/layout/Header";
import Dashboard from "./components/dashboard/Dashboard";
import TradesPage from "./components/trades/TradesPage";
import AddTradeModal from "./components/modals/AddTradeModal";
import SettingsPage from "./components/settings/SettingsPage";
import CustomChartsPage from "./components/analysis/CustomChartsPage";

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
  DefaultValues,
  CustomChartScript
} from "./types";

// Hooks
import { useLocalStorage } from "./hooks/useLocalStorage";

// Utils
import { exportToCSV, importFromCSV } from "./utils/fileUtils";
import { validateCellValue, calculatePnL, determineExitReason, migrateLegacyTrades } from "./utils/tradeUtils";
import { getDefaultChartScripts } from "./utils/chartScriptUtils";

// Default configurations
import { defaultTradeFields, demoTrades } from "./data/defaults";

function App() {
  // State management
  const [activeTab, setActiveTab] = useState<ActiveTab>("Dashboard");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);  // Local storage hooks
  const [userTrades, setUserTrades] = useLocalStorage<Trade[]>('tradelog_trades', []);
  const [tradeFields, setTradeFields] = useLocalStorage<TradeField[]>('tradelog_fields', defaultTradeFields);
  const [customScripts, setCustomScripts] = useLocalStorage<CustomChartScript[]>('tradelog_custom_scripts', getDefaultChartScripts());
  const [filePath, setFilePath] = useLocalStorage<string>("tradelog_filepath", "tradelog.csv");
  const [destinationPath, setDestinationPath] = useLocalStorage<string>("tradelog_destination_path", "");  const [defaultValues, setDefaultValues] = useLocalStorage<DefaultValues>('tradelog_default_values', {
    qty: '100',
    entryPrice: '150.00',
    exitPrice: '155.00',
    stopLoss: '145.00',
    takeProfit: '160.00',
    fees: '2.50',
    status: 'Closed',
    strategy: 'Swing Trading',
    // Campi legacy
    price: '155.00',
    pnl: '500.00'
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
  const [errorCell, setErrorCell] = useState<ErrorCell | null>(null);
  // Combine demo trades with user trades and apply migration
  const allTrades = useMemo(() => {
    const trades = userTrades.length > 0 ? userTrades : demoTrades;
    return migrateLegacyTrades(trades);
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
    });    return filtered.sort((a: Trade, b: Trade) => {
      let aValue: string | number = a[sortField] ?? '';
      let bValue: string | number = b[sortField] ?? '';

      if (sortField === "date" || sortField === "entryDate" || sortField === "exitDate") {
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
  };  const handleAddTrade = (tradeData: NewTradeData) => {
    const newTrade: Trade = {
      id: Date.now(),
      entryDate: tradeData.entryDate || new Date().toISOString().split("T")[0],
      exitDate: tradeData.exitDate || undefined,
      symbol: tradeData.symbol || "",
      type: (tradeData.type as "Buy" | "Sell") || "Buy",
      qty: parseFloat(tradeData.qty || defaultValues.qty || "1"),
      entryPrice: parseFloat(tradeData.entryPrice || defaultValues.entryPrice || "100"),
      exitPrice: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : undefined,
      stopLoss: tradeData.stopLoss ? parseFloat(tradeData.stopLoss) : undefined,
      takeProfit: tradeData.takeProfit ? parseFloat(tradeData.takeProfit) : undefined,
      exitReason: tradeData.exitReason as "Stop Loss" | "Take Profit" | "Manual" | "Time" | "Partial" | undefined,
      pnl: 0, // Sarà calcolato automaticamente se il trade è chiuso
      fees: parseFloat(tradeData.fees || defaultValues.fees || "1"),
      strategy: tradeData.strategy || defaultValues.strategy || "Manual",
      status: (tradeData.status as "Open" | "Closed") || "Open",
      // Nuovi campi per tracking profit target
      hitProfitTarget: tradeData.hitProfitTarget === "true" || false,
      actualEntryPrice: tradeData.actualEntryPrice ? parseFloat(tradeData.actualEntryPrice) : undefined,
      actualExitPrice: tradeData.actualExitPrice ? parseFloat(tradeData.actualExitPrice) : undefined,
      // Campi legacy per compatibilità
      date: tradeData.exitDate || tradeData.entryDate || new Date().toISOString().split("T")[0],
      price: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : parseFloat(tradeData.entryPrice || defaultValues.entryPrice || "100"),
    };

    // Se il trade è chiuso e ha un exit price, calcola automaticamente il P&L
    if (newTrade.status === "Closed" && newTrade.exitPrice) {
      const calculatedPnL = calculatePnL(
        newTrade.type,
        newTrade.entryPrice,
        newTrade.exitPrice,
        newTrade.qty,
        newTrade.fees
      );
      newTrade.pnl = calculatedPnL;
      
      // Determina il motivo di uscita se non specificato
      if (!newTrade.exitReason) {        newTrade.exitReason = determineExitReason(
          newTrade.type,
          newTrade.exitPrice,
          newTrade.stopLoss,
          newTrade.takeProfit
        );
      }
    }

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
  };  const handleExport = async () => {
    await exportToCSV(allTrades, tradeFields, filePath, destinationPath, defaultValues);
    // Salvataggio silenzioso - nessun messaggio di conferma
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
      
      // Non salvare automaticamente, lascia che sia l'utente a decidere quando salvare
      return updatedTrades;
    });
  };
  const handleCellBlur = () => {
    setEditingCell(null);
    // Salva il file quando si esce dal campo (per le select e quando si clicca fuori)
    setTimeout(() => handleExport(), 100);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingCell(null);
      // Salva il file quando si preme Invio
      setTimeout(() => handleExport(), 100);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Settings handlers
  const selectDestinationFolder = async () => {
    if (window.electronAPI && window.electronAPI.selectFolder) {
      try {
        const result = await window.electronAPI.selectFolder();
        if (!result.canceled && result.filePaths.length > 0) {
          setDestinationPath(result.filePaths[0]);
        }
      } catch (error) {
        console.error('Error selecting folder:', error);
        alert('Errore nella selezione della cartella. Assicurati di usare la versione Electron dell\'app.');
      }
    } else {
      alert('La selezione cartella è disponibile solo nella versione desktop (Electron) dell\'applicazione.');
    }
  };
  // Render main content based on active tab
  const renderMainContent = () => {
    console.log('renderMainContent called with activeTab:', activeTab);
    
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
        console.log('Rendering Analysis tab');
        console.log('Trades available:', allTrades.length);
        console.log('Custom scripts available:', customScripts.length);        return (
          <CustomChartsPage
            trades={allTrades}
            customScripts={customScripts}
            onUpdateScripts={setCustomScripts}
          />
        );
        case "Settings":        return (
          <SettingsPage
            filePath={filePath}
            destinationPath={destinationPath}
            defaultValues={defaultValues}
            tradeFields={tradeFields}
            onFilePathChange={setFilePath}
            onDestinationPathChange={setDestinationPath}
            onDefaultValuesChange={setDefaultValues}
            onTradeFieldsUpdate={setTradeFields}
            onSelectDestinationFolder={selectDestinationFolder}
          />
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
