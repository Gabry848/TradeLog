# TradeLog - Applicazione di Trading Journal

Un'applicazione moderna per il tracking e l'analisi delle operazioni di trading, costruita con React, TypeScript ed Electron.

## 🚀 Caratteristiche Principali

- **Dashboard Interattiva**: Visualizza metriche chiave come P&L totale, win rate e equity curve
- **Gestione Trade**: Aggiungi, modifica e visualizza i tuoi trade con editing inline
- **Import/Export CSV**: Importa dati da file CSV e esporta il tuo database
- **Filtri Avanzati**: Filtra i trade per simbolo, tipo, strategia, data e P&L
- **Responsive Design**: Interfaccia ottimizzata per desktop e mobile
- **Persistenza Dati**: Salvataggio automatico nel localStorage del browser

## 🏗️ Architettura Modulare

Il progetto è stato recentemente refactorizzato da un singolo file monolitico a una struttura modulare:

### Struttura del Progetto

```
src/
├── components/           # Componenti React riutilizzabili
│   ├── layout/          # Header, navigazione
│   ├── dashboard/       # Componenti dashboard
│   ├── trades/          # Gestione trade
│   └── modals/          # Modali e dialog
├── types/               # Definizioni TypeScript
├── hooks/               # Hook personalizzati
├── utils/               # Funzioni utility
├── data/                # Configurazioni e dati default
└── styles/              # CSS modulari
```

### Componenti Principali

- **Header**: Navigazione tra le sezioni
- **Dashboard**: Metriche e grafici overview
- **TradesPage**: Gestione completa dei trade
- **TradesTable**: Tabella con editing inline
- **AddTradeModal**: Form per nuovi trade

## 🛠️ Tecnologie Utilizzate

- **React 18** con Hooks
- **TypeScript** per type safety
- **Vite** come build tool
- **Electron** per l'app desktop
- **CSS Modules** per styling modulare

## 📦 Installazione e Avvio

### Prerequisiti
- Node.js (versione 16 o superiore)
- npm o yarn

### Installazione
```bash
git clone <repository-url>
cd TradeLog
npm install
```

### Sviluppo
```bash
# Avvia in modalità sviluppo web
npm run dev

# Avvia l'app Electron
npm run electron-dev
```

### Build
```bash
# Build per web
npm run build

# Build per Electron
npm run electron-pack
```

## 📊 Funzionalità Dettagliate

### Dashboard
- **Total P&L**: Profitto/perdita complessivo
- **Win Rate**: Percentuale di trade vincenti
- **Equity Curve**: Grafico dell'andamento del capitale
- **Recent Trades**: Ultimi 5 trade effettuati

### Gestione Trade
- **Aggiunta Trade**: Form con validazione per nuovi trade
- **Editing Inline**: Modifica diretta nelle celle della tabella
- **Filtri Avanzati**: Per simbolo, tipo, strategia, data, P&L
- **Ordinamento**: Clic sugli header per ordinare

### Import/Export
- **Import CSV**: Carica trade da file CSV esterni
- **Export CSV**: Salva tutti i trade in formato CSV
- **Auto-save**: Salvataggio automatico ad ogni modifica

## 🎨 Personalizzazione

### Campi Trade Personalizzabili
I campi dei trade sono completamente configurabili:
- Tipi supportati: text, number, date, select
- Validazione automatica
- Placeholder personalizzabili

### Temi e Stili
- Dark theme ottimizzato per sessioni prolungate
- Responsive design per tutti i dispositivi
- Animazioni smooth per feedback utente

## 🧪 Testing

```bash
# Esegui i test (da implementare)
npm test

# Test coverage
npm run test:coverage
```

## 📋 Roadmap

### Implementazioni Future
- [ ] Sezione Analysis completa con grafici avanzati
- [ ] Configurazioni Settings estese
- [ ] Export in formati multipli (Excel, JSON)
- [ ] Backup e sync cloud
- [ ] Plugin system per indicatori personalizzati
- [ ] Mobile app (React Native)

### Miglioramenti Tecnici
- [ ] Test unitari completi
- [ ] Performance optimization
- [ ] Accessibilità (WCAG compliance)
- [ ] Internazionalizzazione (i18n)

## 🤝 Contribuire

1. Fork del progetto
2. Crea un feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è licenziato sotto la licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 🙋‍♂️ Supporto

Per domande, bug report o richieste di feature, apri un issue su GitHub.

---

**TradeLog** - Migliora il tuo trading con dati e analisi accurate! 📈
