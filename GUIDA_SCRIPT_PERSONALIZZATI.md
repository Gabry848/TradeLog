# Guida alla Creazione di Script Personalizzati per Grafici

## Panoramica

La funzionalità degli script personalizzati ti permette di creare grafici personalizzati e analisi avanzate dei tuoi dati di trading. Puoi scrivere script JavaScript che analizzano i tuoi trade e generano visualizzazioni personalizzate.

## Come Accedere all'Editor

1. Naviga nella sezione **Analisi** dell'applicazione
2. Seleziona la tab **Grafici Personalizzati**
3. Clicca su **+ Nuovo Script** per creare un nuovo script
4. Oppure clicca su **Modifica** accanto a uno script esistente

## Struttura di uno Script

### Informazioni Base

Ogni script deve avere:

- **Nome**: Un nome descrittivo per identificare lo script
- **Descrizione**: Una breve descrizione di cosa fa il grafico
- **Tipo Grafico**: Il tipo di visualizzazione (Barre, Linea, Torta, Area, Dispersione)

### Parametri

Gli script possono avere parametri configurabili che permettono di personalizzare il comportamento:

- **Nome**: Il nome del parametro (verrà utilizzato nel codice)
- **Tipo**: Il tipo di dato (Testo, Numero, Boolean, Data, Selezione)
- **Valore Predefinito**: Il valore iniziale del parametro
- **Richiesto**: Se il parametro è obbligatorio
- **Descrizione**: Una spiegazione del parametro

## Codice JavaScript

### Funzione Principale

Ogni script deve contenere una funzione `generateChart()` che restituisce i dati del grafico:

```javascript
function generateChart() {
  // Il tuo codice qui
  
  return {
    labels: ['Label 1', 'Label 2', 'Label 3'],
    datasets: [{
      label: 'Nome del Dataset',
      data: [10, 20, 30],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }],
    title: 'Titolo del Grafico',
    xAxisLabel: 'Etichetta Asse X',
    yAxisLabel: 'Etichetta Asse Y'
  };
}
```

### Variabili Disponibili

Nel tuo script hai accesso a:

#### `trades`

Array di tutti i trade con le seguenti proprietà:

- `id`: ID univoco del trade
- `entryDate`: Data di entrata
- `exitDate`: Data di uscita (se presente)
- `symbol`: Simbolo del trade
- `type`: Tipo di trade ("Buy" o "Sell")
- `qty`: Quantità
- `entryPrice`: Prezzo di entrata
- `exitPrice`: Prezzo di uscita (se presente)
- `pnl`: Profitto/Perdita
- `fees`: Commissioni
- `strategy`: Strategia utilizzata
- `status`: Stato del trade ("Open" o "Closed")

#### `parameters`

Oggetto contenente i valori dei parametri definiti per lo script:

```javascript
// Se hai un parametro chiamato "showCumulative"
if (parameters.showCumulative) {
  // Logica per mostrare dati cumulativi
}
```

### Funzioni di Utilità

L'oggetto `utils` fornisce funzioni helper:

#### Formattazione

- `formatCurrency(value)`: Formatta un numero come valuta
- `formatDate(date)`: Formatta una data

#### Raggruppamento

- `groupByMonth(trades)`: Raggruppa i trade per mese
- `groupBySymbol(trades)`: Raggruppa i trade per simbolo
- `groupByStrategy(trades)`: Raggruppa i trade per strategia

#### Calcoli

- `calculateMetrics(trades)`: Calcola metriche avanzate di trading

## Esempi Pratici

### 1. P&L Mensile Semplice

```javascript
function generateChart() {
  // Filtra solo i trade chiusi
  const closedTrades = trades.filter(t => t.status === 'Closed');
  
  // Raggruppa per mese
  const monthlyGroups = groupByMonth(closedTrades);
  const months = Object.keys(monthlyGroups).sort();
  
  // Calcola il P&L mensile
  const data = months.map(month => {
    return monthlyGroups[month].reduce((sum, trade) => sum + trade.pnl, 0);
  });
  
  return {
    labels: months,
    datasets: [{
      label: 'P&L Mensile',
      data: data,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }],
    title: 'P&L Mensile',
    xAxisLabel: 'Mese',
    yAxisLabel: 'P&L (€)'
  };
}
```

### 2. Equity Curve

```javascript
function generateChart() {
  // Filtra e ordina i trade chiusi per data
  const closedTrades = trades
    .filter(t => t.status === 'Closed')
    .sort((a, b) => new Date(a.exitDate || a.entryDate).getTime() - new Date(b.exitDate || b.entryDate).getTime());
  
  // Calcola l'equity curve
  let runningTotal = 0;
  const equityData = closedTrades.map((trade, index) => {
    runningTotal += trade.pnl;
    return runningTotal;
  });
  
  return {
    labels: closedTrades.map((trade, index) => `Trade ${index + 1}`),
    datasets: [{
      label: 'Equity',
      data: equityData,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderWidth: 2,
      fill: true
    }],
    title: 'Equity Curve',
    xAxisLabel: 'Trade',
    yAxisLabel: 'Equity (€)'
  };
}
```

### 3. Distribuzione per Simbolo (Grafico a Torta)

```javascript
function generateChart() {
  // Raggruppa per simbolo
  const symbolGroups = groupBySymbol(trades);
  const symbols = Object.keys(symbolGroups);
  
  // Conta i trade per simbolo
  const data = symbols.map(symbol => symbolGroups[symbol].length);
  
  return {
    labels: symbols,
    datasets: [{
      label: 'Numero di Trade',
      data: data,
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(34, 197, 94, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(139, 92, 246, 0.8)',
        'rgba(236, 72, 153, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#ffffff'
    }],
    title: 'Distribuzione Trade per Simbolo'
  };
}
```

### 4. P&L Settimanale (Grafico a Barre)

```javascript
function generateChart() {
  // Filtra solo i trade chiusi
  const closedTrades = trades.filter(t => t.status === 'Closed' && t.exitDate);

  if (closedTrades.length === 0) {
    return {
      labels: ['Nessun dato disponibile'],
      datasets: [{
        label: 'P&L Settimanale',
        data: [0],
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 1
      }],
      title: 'P&L Settimanale - Nessun Trade Chiuso',
      xAxisLabel: 'Settimana',
      yAxisLabel: 'P&L (€)'
    };
  }

  // Funzione per ottenere l'inizio della settimana (Lunedì)
  const getStartOfWeek = (dateString) => {
    const date = new Date(dateString + 'T00:00:00');
    const day = date.getDay();
    const daysToSubtract = day === 0 ? 6 : day - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - daysToSubtract);
    return monday.toISOString().split('T')[0];
  };

  // Raggruppa per settimana e calcola P&L
  const weeklyPnl = {};
  closedTrades.forEach(trade => {
    const weekStartDate = getStartOfWeek(trade.exitDate);
    if (!weeklyPnl[weekStartDate]) weeklyPnl[weekStartDate] = 0;
    weeklyPnl[weekStartDate] += trade.pnl;
  });

  const sortedWeeks = Object.keys(weeklyPnl).sort();
  const labels = sortedWeeks.map(week => {
    const date = new Date(week + 'T00:00:00');
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  });

  const pnlData = sortedWeeks.map(week => weeklyPnl[week]);
  
  // Colori basati sui valori positivi/negativi
  const backgroundColors = pnlData.map(value => 
    value >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
  );
  
  const borderColors = pnlData.map(value => 
    value >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
  );

  const positiveWeeks = pnlData.filter(value => value > 0).length;
  const totalWeeks = pnlData.length;

  return {
    labels: labels,
    datasets: [{
      label: 'P&L Settimanale',
      data: pnlData,
      backgroundColor: backgroundColors,
      borderColor: borderColors,
      borderWidth: 2
    }],
    title: `P&L Settimanale (${positiveWeeks}/${totalWeeks} settimane positive)`,
    xAxisLabel: 'Settimana (inizio Lunedì)',
    yAxisLabel: 'P&L (€)'
  };
}
```

### 5. Script con Parametri

```javascript
function generateChart() {
  // Filtra trade in base al parametro minimo
  const minTradesThreshold = parameters.minTrades || 1;
  
  const symbolGroups = groupBySymbol(trades);
  const symbols = Object.keys(symbolGroups).filter(symbol => 
    symbolGroups[symbol].length >= minTradesThreshold
  );
  
  // Calcola metriche in base al tipo richiesto
  const dataType = parameters.dataType || 'count';
  let data, label;
  
  if (dataType === 'pnl') {
    data = symbols.map(symbol => 
      symbolGroups[symbol].reduce((sum, trade) => sum + trade.pnl, 0)
    );
    label = 'P&L Totale';
  } else {
    data = symbols.map(symbol => symbolGroups[symbol].length);
    label = 'Numero di Trade';
  }
  
  return {
    labels: symbols,
    datasets: [{
      label: label,
      data: data,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }],
    title: `${label} per Simbolo`,
    xAxisLabel: 'Simbolo',
    yAxisLabel: label
  };
}
```

## Caratteristiche dello Script P&L Settimanale

Lo script che ho creato include diverse caratteristiche avanzate:

### Gestione Intelligente delle Date
- **Settimana che inizia il Lunedì**: Lo script calcola correttamente l'inizio di ogni settimana
- **Gestione fuso orario**: Aggiunge `T00:00:00` per evitare problemi di interpretazione delle date
- **Formattazione italiana**: Le date vengono mostrate nel formato DD/MM/YYYY

### Visualizzazione Avanzata
- **Colori dinamici**: Verde per settimane positive, rosso per settimane negative
- **Statistiche nel titolo**: Mostra il rapporto settimane positive/totali
- **Gestione casi vuoti**: Comportamento appropriato quando non ci sono dati

### Robustezza
- **Filtraggio sicuro**: Considera solo trade chiusi con data di uscita
- **Ordinamento cronologico**: Le settimane sono sempre mostrate in ordine temporale
- **Calcoli precisi**: Somma accurata del P&L per ogni settimana

## Come Utilizzare lo Script

1. **Accedi all'Editor**: Vai in Analisi → Grafici Personalizzati → + Nuovo Script
2. **Configura le informazioni base**:
   - **Nome**: "P&L Settimanale"
   - **Descrizione**: "Analisi del profitto/perdita raggruppato per settimana"
   - **Tipo Grafico**: "Barre"
3. **Incolla il codice**: Copia il codice dello script nell'editor
4. **Salva e visualizza**: Il grafico verrà generato automaticamente

## Personalizzazioni Possibili

Puoi facilmente modificare lo script per adattarlo alle tue esigenze:

### Cambiare l'Inizio della Settimana
```javascript
// Per far iniziare la settimana la Domenica
const daysToSubtract = day; // Invece di: day === 0 ? 6 : day - 1
```

### Aggiungere Filtri Temporali
```javascript
// Filtra solo gli ultimi 3 mesi
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

const closedTrades = trades.filter(t => 
  t.status === 'Closed' && 
  t.exitDate && 
  new Date(t.exitDate) >= threeMonthsAgo
);
```

### Personalizzare i Colori
```javascript
// Usa una palette di colori personalizzata
const backgroundColors = pnlData.map(value => {
  if (value > 1000) return 'rgba(34, 197, 94, 0.9)'; // Verde intenso per grandi guadagni
  if (value > 0) return 'rgba(34, 197, 94, 0.6)';    // Verde normale
  if (value > -500) return 'rgba(239, 68, 68, 0.6)'; // Rosso normale
  return 'rgba(239, 68, 68, 0.9)';                   // Rosso intenso per grandi perdite
});
```

## Struttura del Risultato

Il metodo `generateChart()` deve restituire un oggetto con questa struttura:

```javascript
{
  labels: string[],           // Etichette per l'asse X
  datasets: [{
    label: string,            // Nome del dataset
    data: number[],           // Dati numerici
    backgroundColor: string | string[], // Colore di sfondo
    borderColor: string,      // Colore del bordo
    borderWidth: number,      // Spessore del bordo
    fill: boolean            // Solo per grafici a linea/area
  }],
  title: string,             // Titolo del grafico (opzionale)
  xAxisLabel: string,        // Etichetta asse X (opzionale)
  yAxisLabel: string         // Etichetta asse Y (opzionale)
}
```

## Tipi di Grafico

### Barre (`bar`)

Ideale per: Confronti di valori, P&L mensile, conteggi per categoria

- Supporta colori diversi per valori positivi/negativi
- Buono per dati categorici

### Linea (`line`)

Ideale per: Trend temporali, equity curve, performance nel tempo

- Opzione `fill: true` per effetto area
- Perfetto per dati continui

### Torta (`pie`)

Ideale per: Distribuzioni, percentuali, composizione del portafoglio

- Mostra proporzioni relative
- Limitato a un dataset

### Area (`area`)

Ideale per: Trend cumulativi, volumi, dati impilati

- Simile al grafico a linea ma con riempimento
- Buono per mostrare accumuli

### Dispersione (`scatter`)

Ideale per: Correlazioni, analisi rischio/rendimento

- Mostra relazioni tra due variabili
- Utile per analisi statistiche

## Colori Predefiniti

Puoi utilizzare questi colori per i tuoi grafici:

```javascript
// Colori base
'rgba(239, 68, 68, 0.8)'   // Rosso
'rgba(34, 197, 94, 0.8)'   // Verde
'rgba(59, 130, 246, 0.8)'  // Blu
'rgba(245, 158, 11, 0.8)'  // Arancione
'rgba(139, 92, 246, 0.8)'  // Viola
'rgba(236, 72, 153, 0.8)'  // Rosa

// Per grafici P&L
const color = value >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
```

## Debugging e Test

### Console Log

Usa `console.log()` per debug:

```javascript
function generateChart() {
  console.log('Total trades:', trades.length);
  console.log('Parameters:', parameters);
  
  // Il tuo codice...
}
```

### Validazione

L'editor valida automaticamente:

- Presenza della funzione `generateChart()`
- Sintassi JavaScript corretta
- Struttura del risultato

### Errori Comuni

1. **Manca la funzione generateChart()**

   ```javascript
   // ❌ Sbagliato
   const data = [1, 2, 3];
   
   // ✅ Corretto
   function generateChart() {
     return { labels: [], datasets: [] };
   }
   ```

2. **Risultato malformato**

   ```javascript
   // ❌ Sbagliato
   return [1, 2, 3];
   
   // ✅ Corretto
   return {
     labels: ['A', 'B', 'C'],
     datasets: [{ label: 'Test', data: [1, 2, 3] }]
   };
   ```

3. **Errore nei filtri**

   ```javascript
   // ❌ Sbagliato - può causare errori se exitDate è undefined
   const sortedTrades = trades.sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate));
   
   // ✅ Corretto
   const sortedTrades = trades
     .filter(t => t.exitDate)
     .sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime());
   ```

## Best Practices

1. **Filtra sempre i dati appropriati**

   ```javascript
   // Per analisi P&L, usa solo trade chiusi
   const closedTrades = trades.filter(t => t.status === 'Closed');
   ```

2. **Gestisci i casi vuoti**

   ```javascript
   if (trades.length === 0) {
     return {
       labels: ['Nessun dato'],
       datasets: [{ label: 'Vuoto', data: [0] }],
       title: 'Nessun trade disponibile'
     };
   }
   ```

3. **Usa parametri per flessibilità**

   ```javascript
   const period = parameters.period || 'month';
   const groupFunction = period === 'month' ? groupByMonth : groupBySymbol;
   ```

4. **Formatta i dati per leggibilità**

   ```javascript
   const labels = months.map(month => formatDate(month + '-01'));
   ```

5. **Usa nomi descrittivi**

   ```javascript
   // ❌ Generico
   const data = trades.map(t => t.pnl);
   
   // ✅ Descrittivo
   const monthlyPnLData = months.map(month => calculateMonthlyPnL(month));
   ```

## Salvataggio e Gestione

- Gli script vengono salvati automaticamente nel localStorage
- Puoi modificare, duplicare o eliminare script esistenti
- Gli script possono essere attivati/disattivati tramite il toggle "Enabled"
- Ogni script ha un timestamp di creazione e ultima modifica

## Risoluzione dei Problemi

Se uno script non funziona:

1. **Controlla la console del browser** per errori JavaScript
2. **Verifica la sintassi** utilizzando il validatore integrato
3. **Testa con dati semplificati** prima di aggiungere logica complessa
4. **Usa console.log()** per tracciare l'esecuzione
5. **Verifica che tutti i parametri** siano accessibili e del tipo corretto

Seguendo questa guida, sarai in grado di creare grafici personalizzati potenti e flessibili per analizzare i tuoi dati di trading in modo approfondito.
