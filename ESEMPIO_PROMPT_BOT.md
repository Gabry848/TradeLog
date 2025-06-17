# 🤖 Esempio Prompt e Risposta del Bot IA

## Prompt Utente
"Crea un grafico a barre del P&L mensile con possibilità di filtrare per strategia"

## Risposta Attesa del Bot

```json
{
  "title": "P&L Mensile per Strategia",
  "description": "Grafico a barre che mostra il profitto e perdita aggregato per ogni mese, con filtro opzionale per strategia. Include colori diversi per mesi positivi (verde) e negativi (rosso).",
  "chartType": "bar",
  "code": "function generateChart() {\n  // Filtra i trade in base alla strategia selezionata\n  let filteredTrades = trades.filter(t => t.status === 'Closed');\n  \n  if (parameters.strategy && parameters.strategy !== 'Tutte') {\n    filteredTrades = filteredTrades.filter(t => t.strategy === parameters.strategy);\n  }\n  \n  // Raggruppa per mese\n  const monthlyGroups = utils.groupByMonth(filteredTrades);\n  const months = Object.keys(monthlyGroups).sort();\n  \n  // Calcola P&L per ogni mese\n  const monthlyPnL = months.map(month => {\n    return monthlyGroups[month].reduce((sum, trade) => sum + trade.pnl, 0);\n  });\n  \n  // Colori dinamici: verde per profitto, rosso per perdita\n  const backgroundColors = monthlyPnL.map(pnl => \n    pnl >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'\n  );\n  \n  const borderColors = monthlyPnL.map(pnl => \n    pnl >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'\n  );\n  \n  return {\n    labels: months.map(month => utils.formatDate(month + '-01')),\n    datasets: [{\n      label: parameters.strategy && parameters.strategy !== 'Tutte' ? \n        `P&L - ${parameters.strategy}` : 'P&L Totale',\n      data: monthlyPnL,\n      backgroundColor: backgroundColors,\n      borderColor: borderColors,\n      borderWidth: 2,\n      borderRadius: 4,\n      borderSkipped: false\n    }],\n    title: `P&L Mensile${parameters.strategy && parameters.strategy !== 'Tutte' ? ` - ${parameters.strategy}` : ''}`,\n    xAxisLabel: 'Mese',\n    yAxisLabel: 'P&L (€)'\n  };\n}",
  "parameters": [
    {
      "id": "strategy",
      "name": "Strategia",
      "type": "select",
      "defaultValue": "Tutte",
      "required": false,
      "description": "Filtra i risultati per una strategia specifica",
      "options": ["Tutte", "Scalping", "Swing Trading", "Day Trading", "Position Trading"]
    }
  ]
}
```

✨ **Script "P&L Mensile per Strategia" generato con successo!**

Ho creato un grafico a barre moderno che:
- 📊 Mostra il P&L aggregato per ogni mese
- 🎨 Usa colori dinamici (verde per profitto, rosso per perdita)
- 🔍 Include un filtro per strategia
- 📅 Formatta automaticamente le date
- 💰 Mostra i valori in euro

Il grafico include anche:
- Bordi arrotondati per un look moderno
- Etichette degli assi personalizzate
- Titolo dinamico che cambia in base al filtro
- Gestione automatica dei trade chiusi

Vuoi che modifichi qualcosa o aggiungi altre funzionalità? 🚀

---

## Caratteristiche del Prompt Migliorato

### 🎯 Struttura JSON Rigorosa
- **title**: Nome breve e descrittivo
- **description**: Spiegazione dettagliata delle funzionalità
- **chartType**: Tipo di grafico con validazione
- **code**: Codice JavaScript completo e funzionante
- **parameters**: Array di parametri configurabili

### 🎨 Codice Moderno e Pulito
- Gestione errori e edge cases
- Colori dinamici e professionali
- Commenti esplicativi
- Utilizzo appropriato delle utility functions
- Styling moderno (border-radius, gradients)

### 🔧 Parametri Avanzati
- Tipo `select` con opzioni predefinite
- Valori di default sensibili
- Descrizioni chiare
- Validazione dei tipi

### 💡 Best Practices Implementate
- Filtri parametrici
- Formattazione automatica
- Colori semantici (verde/rosso)
- Titoli dinamici
- Gestione responsive

Questo formato garantisce risposte consistenti, professionali e immediatamente utilizzabili nell'applicazione TradeLog! 🚀
