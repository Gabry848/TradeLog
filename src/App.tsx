import { useState, useMemo, useEffect, useCallback } from "react";
import "./App.css";
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
  CustomChartScript,
} from "./types";

// Hooks
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useGlobalFolder } from "./hooks/useFolderPicker";
import { usePersistentStorage } from "./hooks/usePersistentStorage";

// Utils
import {
  exportToCSV,
  importFromCSV,
  loadTradesFromFile,
  saveTradesDirectly,
} from "./utils/fileUtils";
import {
  validateCellValue,
  determineExitReason,
  migrateLegacyTrades,
} from "./utils/tradeUtils";
import { getDefaultChartScripts } from "./utils/chartScriptUtils";
import { calculateAllFields } from "./utils/calculatedFields";

// Default configurations
import { defaultTradeFields } from "./data/defaults";

function App() {
  // State management
  const [activeTab, setActiveTab] = useState<ActiveTab>("Dashboard");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  // Hooks per gestione globale cartella
  const { globalFolder, updateGlobalFolder } = useGlobalFolder();
  // Local storage hooks - solo per configurazioni, non per i trade
  const [userTrades, setUserTrades] = useState<Trade[]>([]);
  const tradeFieldsResult = usePersistentStorage<TradeField[]>(
    "tradelog_fields",
    defaultTradeFields
  );
  const customScriptsResult = usePersistentStorage<CustomChartScript[]>(
    "tradelog_custom_scripts",
    getDefaultChartScripts()
  );
  const filePathResult = usePersistentStorage<string>(
    "tradelog_filepath",
    "tradelog.csv"
  );

  // Usa il vecchio localStorage per destinationPath dato che ora è gestito dalla cartella globale
  const [destinationPath, setDestinationPath] = useLocalStorage<string>(
    "tradelog_destination_path",
    ""
  );
  // Estrai i valori dai risultati
  const tradeFields = tradeFieldsResult.value;
  const customScripts = customScriptsResult.value;
  const filePath = filePathResult.value;

  // Funzioni wrapper per gestire le chiamate async
  const setTradeFields = async (
    fields: TradeField[] | ((prev: TradeField[]) => TradeField[])
  ) => {
    await tradeFieldsResult.setValue(fields);
  };

  const setCustomScripts = async (
    scripts:
      | CustomChartScript[]
      | ((prev: CustomChartScript[]) => CustomChartScript[])
  ) => {
    await customScriptsResult.setValue(scripts);
  };

  const setFilePath = async (path: string | ((prev: string) => string)) => {
    await filePathResult.setValue(path);
  };

  // Filters and editing stated
  const [filters, setFilters] = useState<FilterState>({
    symbol: "",
    type: "",
    strategy: "",
    dateFrom: "",
    dateTo: "",
    minPnL: "",
    maxPnL: "",
  });  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [errorCell, setErrorCell] = useState<ErrorCell | null>(null);

  // Memoized computed values
  const memoizedFilters = useMemo(() => filters, [filters]);
  const memoizedTradeFields = useMemo(() => tradeFields, [tradeFields]);

  // Utilizza solo i trade dell'utente, senza trade demo
  const allTrades = useMemo(() => {
    return migrateLegacyTrades(userTrades);
  }, [userTrades]);
  // Filtered and sorted trades
  const filteredAndSortedTrades = useMemo(() => {
    const filtered = allTrades.filter((trade: Trade) => {
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
    return filtered.sort((a: Trade, b: Trade) => {
      let aValue: string | number | boolean = a[sortField] ?? "";
      let bValue: string | number | boolean = b[sortField] ?? "";

      if (
        sortField === "date" ||
        sortField === "entryDate" ||
        sortField === "exitDate"
      ) {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }

      // Gestisci i valori booleani
      if (typeof aValue === "boolean" || typeof bValue === "boolean") {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = (bValue as string).toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [allTrades, filters, sortField, sortDirection]);  // Memoized event handlers
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField, sortDirection]);

  // Funzione per ricaricare i trade dal file
  const reloadTrades = useCallback(async () => {
    try {
      const loadedTrades = await loadTradesFromFile(
        filePath,
        destinationPath,
        tradeFields
      );
      setUserTrades(loadedTrades);
    } catch (error) {
      console.error("Errore nel ricaricamento dei trade:", error);
    }
  }, [filePath, destinationPath, tradeFields]);

  // Gestisce il cambio di tab e ricarica i dati se necessario
  const handleTabChange = useCallback(async (newTab: ActiveTab) => {
    setActiveTab(newTab);

    // Ricarica i dati quando si va su Dashboard, Trades o Analysis
    if (
      newTab === "Dashboard" ||
      newTab === "Trades" ||
      newTab === "Analysis"
    ) {
      await reloadTrades();
    }
  }, [reloadTrades]);

  const handleFilterChange = useCallback((field: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      symbol: "",
      type: "",
      strategy: "",
      dateFrom: "",
      dateTo: "",
      minPnL: "",
      maxPnL: "",
    });
  }, []);  const handleAddTrade = useCallback((tradeData: NewTradeData) => {
    // Crea il trade base con i dati del form
    let newTrade: Trade = {
      id: Date.now(),
      entryDate: tradeData.entryDate || new Date().toISOString().split("T")[0],
      exitDate: tradeData.exitDate || undefined,
      symbol: tradeData.symbol || "",
      type: (tradeData.type as "Buy" | "Sell") || "Buy",
      qty: parseFloat(tradeData.qty || "1"),
      entryPrice: parseFloat(tradeData.entryPrice || "0"),
      exitPrice: tradeData.exitPrice
        ? parseFloat(tradeData.exitPrice)
        : undefined,
      stopLoss: tradeData.stopLoss ? parseFloat(tradeData.stopLoss) : undefined,
      takeProfit: tradeData.takeProfit
        ? parseFloat(tradeData.takeProfit)
        : undefined,
      targetProfit: tradeData.targetProfit
        ? parseFloat(tradeData.targetProfit)
        : undefined,
      maxLoss: tradeData.maxLoss ? parseFloat(tradeData.maxLoss) : undefined,
      exitReason: tradeData.exitReason as
        | "Stop Loss"
        | "Take Profit"
        | "Manual"
        | "Time"
        | "Partial"
        | undefined,
      pnl: parseFloat(tradeData.pnl || "0"), // P&L impostato dall'utente
      fees: parseFloat(tradeData.fees || "0"),
      strategy: tradeData.strategy || "",
      status: (tradeData.status as "Open" | "Closed") || "Open",
      // Nuovi campi per tracking profit target
      hitProfitTarget: tradeData.hitProfitTarget === "true" || false,
      actualEntryPrice: tradeData.actualEntryPrice
        ? parseFloat(tradeData.actualEntryPrice)
        : undefined,
      actualExitPrice: tradeData.actualExitPrice
        ? parseFloat(tradeData.actualExitPrice)
        : undefined,
      // Campi legacy per compatibilità
      date:
        tradeData.exitDate ||
        tradeData.entryDate ||
        new Date().toISOString().split("T")[0],
      price: tradeData.exitPrice
        ? parseFloat(tradeData.exitPrice)
        : parseFloat(tradeData.entryPrice || "0"),
    };

    // Aggiungi i campi personalizzati dal form
    Object.keys(tradeData).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(newTrade, key)) {
        const value = (tradeData as unknown as Record<string, string | null>)[
          key
        ];
        if (value !== null) {
          const field = tradeFields.find((f) => f.id === key);
          if (field?.type === "number") {
            (newTrade as Record<string, unknown>)[key] = parseFloat(value) || 0;
          } else {
            (newTrade as Record<string, unknown>)[key] = value;
          }
        }
      }
    });

    // Calcola i campi calcolati
    newTrade = calculateAllFields(newTrade, tradeFields) as Trade;

    // Se il trade è chiuso, determina automaticamente il motivo di uscita se non specificato
    if (
      newTrade.status === "Closed" &&
      !newTrade.exitReason &&
      newTrade.exitPrice
    ) {
      newTrade.exitReason = determineExitReason(
        newTrade.type,
        newTrade.exitPrice,
        newTrade.stopLoss,
        newTrade.takeProfit
      );
    } // Salva il trade direttamente nel file configurato
    setUserTrades((prevTrades: Trade[]) => [...prevTrades, newTrade]);
    setIsAddTradeModalOpen(false);

    // Il salvataggio automatico avviene tramite useEffect, non è necessario ricaricare
  }, [tradeFields]);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const newTrades = importFromCSV(text, tradeFields);

      if (newTrades.length > 0) {
        // Aggiunge i nuovi trade a quelli esistenti
        setUserTrades((prevTrades: Trade[]) => {
          const currentRealTrades = prevTrades.length > 0 ? prevTrades : [];
          const maxExistingId = Math.max(
            0,
            ...currentRealTrades.map((t) => t.id)
          );

          const tradesWithNewIds = newTrades.map((trade, index) => ({
            ...trade,
            id: maxExistingId + index + 1,
          }));
          return [...currentRealTrades, ...tradesWithNewIds];
        });

        // Il salvataggio automatico avviene tramite useEffect, non è necessario ricaricare
        alert(`Successfully imported ${newTrades.length} trades!`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }, [tradeFields]);

  const handleExport = useCallback(async () => {
    await exportToCSV(allTrades, tradeFields, filePath, destinationPath);
    // Salvataggio silenzioso - nessun messaggio di conferma
  }, [allTrades, tradeFields, filePath, destinationPath]);
  // Cell editing handlers
  const handleCellClick = useCallback((tradeId: number, fieldId: string) => {
    if (fieldId !== "id") {
      setEditingCell({ tradeId, fieldId });
    }
  }, []);

  const handleCellChange = useCallback((
    tradeId: number,
    fieldId: string,
    newValue: string
  ) => {
    const field = tradeFields.find((f) => f.id === fieldId);

    // Impedisci la modifica di campi calcolati
    if (field?.type === "calculated") {
      return;
    }

    const validationError = validateCellValue(
      fieldId,
      newValue,
      field?.type || "text"
    );

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

          if (field?.type === "number") {
            processedValue = parseFloat(newValue) || 0;
          }

          let updatedTrade = { ...trade, [fieldId]: processedValue } as Trade;

          // Ricalcola i campi calcolati se necessario
          updatedTrade = calculateAllFields(updatedTrade, tradeFields) as Trade;

          return updatedTrade;
        }
        return trade;
      });

      // Il salvataggio automatico avviene tramite useEffect
      return updatedTrades;
    });
  }, [tradeFields]);

  const handleCellBlur = useCallback(async () => {
    setEditingCell(null);
    // Il salvataggio automatico avviene tramite useEffect, non ricaricariamo per evitare lampeggiamenti
  }, []);

  const handleCellKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setEditingCell(null);
      // Il salvataggio automatico avviene tramite useEffect, non ricaricariamo per evitare lampeggiamenti
    } else if (e.key === "Escape") {
      setEditingCell(null);
    }
  }, []);  // Funzione wrapper per setDestinationPath che aggiorna anche la cartella globale
  const handleDestinationPathChange = useCallback((path: string) => {
    setDestinationPath(path);
    updateGlobalFolder(path);
  }, [setDestinationPath, updateGlobalFolder]);

  // Memoized handlers for modals
  const handleOpenAddTradeModal = useCallback(() => {
    setIsAddTradeModalOpen(true);
  }, []);

  const handleCloseAddTradeModal = useCallback(() => {
    setIsAddTradeModalOpen(false);
  }, []);
  const renderMainContent = () => {
    console.log("renderMainConten called with activeTab:", activeTab);

    switch (activeTab) {
      case "Dashboard":
        return <Dashboard trades={allTrades} />;

      case "Trades":        return (
          <TradesPage
            trades={filteredAndSortedTrades}
            tradeFields={memoizedTradeFields}
            filters={memoizedFilters}
            sortField={sortField}
            sortDirection={sortDirection}
            editingCell={editingCell}
            errorCell={errorCell}
            onFilterChange={handleFilterChange}
            onClearFilters={clearFilters}
            onSort={handleSort}
            onImport={handleImport}
            onExport={handleExport}
            onAddTrade={handleOpenAddTradeModal}
            onCellClick={handleCellClick}
            onCellChange={handleCellChange}
            onCellBlur={handleCellBlur}
            onCellKeyDown={handleCellKeyDown}
          />
        );

      case "Analysis":
        console.log("Rendering Analysis tab");
        console.log("Trades available:", allTrades.length);
        console.log("Custom scripts available:", customScripts.length);
        return (
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
            tradeFields={memoizedTradeFields}
            onFilePathChange={setFilePath}
            onDestinationPathChange={handleDestinationPathChange}
            onTradeFieldsUpdate={setTradeFields}
          />
        );

      default:
        return <Dashboard trades={allTrades} />;
    }  }; 
  
  // Carica i trade dal file al primo avvio (ottimizzato per evitare re-render inutili)
  useEffect(() => {
    const loadTrades = async () => {
      try {
        const loadedTrades = await loadTradesFromFile(
          filePath,
          destinationPath,
          tradeFields
        );
        if (loadedTrades.length > 0) {
          setUserTrades(loadedTrades);
        } else {
          // Se non ci sono trade nel file, l'applicazione inizia vuota
          console.log(
            "Nessun trade trovato nel file, iniziando con lista vuota"
          );
        }
      } catch (error) {
        console.error("Errore nel caricamento dei trade:", error);
      }
    };
    loadTrades();
    // Rimuoviamo tradeFields dalle dipendenze per evitare ricaricamenti inutili
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, destinationPath]);

  // Sincronizza la cartella globale con destinationPath
  useEffect(() => {
    if (globalFolder && globalFolder !== destinationPath) {
      setDestinationPath(globalFolder);
    } else if (!globalFolder && destinationPath) {
      updateGlobalFolder(destinationPath);
    }
  }, [globalFolder, destinationPath, setDestinationPath, updateGlobalFolder]);
  // Salva automaticamente quando cambiano i trade (ottimizzato con debounce logico)
  useEffect(() => {
    if (userTrades.length > 0) {
      const timeoutId = setTimeout(() => {
        saveTradesDirectly(userTrades, tradeFields, filePath, destinationPath);
      }, 500); // Debounce di 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [userTrades, filePath, destinationPath, tradeFields]);


  return (
    <div className="app">
      <Header activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="main">{renderMainContent()}</main>      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        tradeFields={memoizedTradeFields}
        onClose={handleCloseAddTradeModal}
        onSubmit={handleAddTrade}
      />
    </div>
  );
}

export default App;
