# 🤖 Agente IA per Script Personalizzati

## Panoramica

L'Agente IA è un assistente intelligente integrato nell'editor di script personalizzati che utilizza OpenRouter per aiutarti a creare grafici e analisi automaticamente. L'agente può comprendere le tue richieste in linguaggio naturale e generare codice JavaScript funzionante per i tuoi grafici.

## 🚀 Configurazione

### 1. Ottieni una API Key di OpenRouter

1. Visita [openrouter.ai](https://openrouter.ai)
2. Crea un account gratuito
3. Vai su [API Keys](https://openrouter.ai/keys)
4. Crea una nuova API Key
5. Copia la chiave generata

### 2. Configura l'API Key nell'applicazione

1. Apri l'editor di script personalizzati
2. Clicca sul pulsante "🤖 Assistant IA"
3. Inserisci la tua API Key nel campo dedicato
4. Clicca "Salva"

La chiave verrà salvata localmente nel tuo browser per utilizzi futuri.

## 💬 Come utilizzare l'Agente IA

### Aprire la Chat

- Clicca sul pulsante "🤖 Assistant IA" nell'header dell'editor
- La chat si aprirà in una finestra moderna e minimale sulla destra
- Puoi chiuderla cliccando la "X" o ricliccando il pulsante

### Esempi di Richieste

Puoi chiedere all'IA di creare vari tipi di grafici:

#### Grafici di Performance
```
"Crea un grafico a linee del P&L cumulativo nel tempo"
"Mostra l'equity curve dei miei trade"
"Fai un grafico della performance mensile"
```

#### Analisi di Distribuzione
```
"Crea un grafico a torta della distribuzione dei trade per simbolo"
"Mostra quanti trade ho fatto per ogni strategia"
"Analizza la distribuzione dei profit/loss"
```

#### Metriche Avanzate
```
"Crea un grafico del drawdown nel tempo"
"Mostra il win rate per ogni mese"
"Analizza la correlazione tra volume e P&L"
```

#### Comparazioni
```
"Confronta le performance delle diverse strategie"
"Mostra il P&L per simbolo in un grafico a barre"
"Crea un'analisi comparativa mensile"
```

### Funzionalità della Chat

- **🗑️ Pulisci chat**: Elimina la cronologia e ricomincia
- **⚙️ Impostazioni**: Modifica la tua API Key
- **✕ Chiudi**: Nascondi la finestra di chat

## 🛠️ Caratteristiche Tecniche

### Modello IA Utilizzato
- **Provider**: OpenRouter
- **Modello**: Claude 3.5 Sonnet (Anthropic)
- **Specializzazione**: Generazione di codice JavaScript per analisi trading

### Contesto Disponibile per l'IA
L'agente IA ha accesso a:
- Tutti i tuoi trade con tutti i campi disponibili
- Gli script personalizzati esistenti
- Funzioni di utilità integrate
- Cronologia della conversazione

### Variabili Disponibili negli Script
- `trades`: Array di tutti i trade
- `parameters`: Parametri configurabili dello script
- `utils`: Oggetto con funzioni di utilità

### Funzioni di Utilità
- `formatCurrency(value)`: Formatta valori come valuta
- `formatDate(date)`: Formatta date
- `groupByMonth(trades)`: Raggruppa trade per mese
- `groupBySymbol(trades)`: Raggruppa trade per simbolo
- `groupByStrategy(trades)`: Raggruppa trade per strategia
- `calculateMetrics(trades)`: Calcola metriche di performance

## 🎨 Design e UX

### Interfaccia Moderna
- Design minimale in sintonia con l'applicazione
- Tema scuro/chiaro adattivo
- Animazioni fluide e feedback visivo
- Layout responsivo

### Chat Intelligente
- Riconoscimento automatico del tipo di grafico richiesto
- Suggerimenti contestuali
- Gestione errori con messaggi chiari
- Indicatori di caricamento con animazioni

### Integrazione Seamless
- Apertura/chiusura fluida della chat
- Importazione automatica degli script generati
- Sincronizzazione con l'editor esistente

## 🔒 Privacy e Sicurezza

- **API Key**: Salvata solo localmente nel browser
- **Dati Trade**: Inviati solo per la generazione degli script
- **Privacy**: Nessun dato salvato sui server esterni
- **Controllo**: Puoi sempre rivedere il codice prima di salvarlo

## 🐛 Risoluzione Problemi

### Errori Comuni

#### "API Key non valida"
- Verifica di aver copiato correttamente la chiave
- Assicurati che la chiave non sia scaduta
- Riprova ad inserirla nelle impostazioni

#### "Limite di rate raggiunto"
- Aspetta qualche minuto prima di fare nuove richieste
- OpenRouter ha limiti di utilizzo gratuiti

#### "Errore di connessione"
- Verifica la tua connessione internet
- Controlla che OpenRouter sia accessibile

### Migliorare le Risposte dell'IA

1. **Sii specifico**: "Crea un grafico a barre del P&L mensile" invece di "fai un grafico"
2. **Includi dettagli**: Specifica colori, etichette, filtri desiderati
3. **Usa esempi**: "Come quello che hai fatto prima ma per le strategie"
4. **Iterazione**: Chiedi modifiche incrementali agli script generati

## 🔮 Funzionalità Future

- Supporto per più modelli IA
- Template di script predefiniti
- Esportazione automatica degli script
- Integrazione con più provider di IA
- Suggerimenti proattivi basati sui dati
- Analisi automatica delle performance

## 📝 Note per Sviluppatori

### Architettura
- `AIService`: Gestisce la comunicazione con OpenRouter
- `AIChat`: Componente React per l'interfaccia chat
- `ChartScriptEditor`: Editor principale con integrazione IA

### Personalizzazione
Puoi modificare facilmente:
- Il modello IA utilizzato
- I prompt di sistema
- Le funzioni di utilità disponibili
- L'interfaccia della chat

### Estendibilità
Il sistema è progettato per essere facilmente estendibile con:
- Nuovi provider di IA
- Funzionalità di chat avanzate
- Integrazione con altri strumenti di analisi
