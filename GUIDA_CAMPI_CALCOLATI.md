# 🧮 Guida ai Campi Calcolati - TradeLog

## 🎯 Cosa Sono i Campi Calcolati

I **campi calcolati** permettono di creare campi che si aggiornano automaticamente in base ai valori di altri campi. Sono perfetti per:

- **Calcoli finanziari automatici** (capitale investito, percentuali, ratios)
- **Metriche di rischio** (risk/reward, Kelly percentage)
- **Analisi di portafoglio** (peso posizioni, diversificazione)

## 🚀 Come Utilizzare i Campi Calcolati

### 1. **Accesso Rapido - Campi Predefiniti**
1. Vai su **Settings** → **Gestione Campi Operazioni**
2. Clicca su **⚡ Aggiungi Rapidi**
3. Scegli una categoria:
   - **🧮 Campi Calcolati Base**: Capitale investito, size, percentuali
   - **📊 Analisi Portafoglio**: Settori, paesi, peso portafoglio
   - **⚠️ Gestione Rischio**: Risk/reward, Kelly percentage, confidence level

### 2. **Creazione Campo Calcolato Personalizzato**
1. Clicca **Aggiungi Campo**
2. Seleziona tipo **🧮 Calcolato**
3. Imposta:
   - **Nome**: Identificativo del campo
   - **Etichetta**: Nome visibile
   - **Valore Predefinito**: Valore base (opzionale)
   - **Formula**: L'espressione di calcolo

## 📐 Sintassi delle Formule

### **Riferimenti ai Campi**
Usa `{nome_campo}` per riferire altri campi:
```javascript
{capitale_totale} / 100 * {size}
```

### **Operatori Matematici**
- `+` Addizione
- `-` Sottrazione  
- `*` Moltiplicazione
- `/` Divisione
- `()` Parentesi per precedenza

### **Funzioni Matematiche**
- `Math.round()` - Arrotonda al numero intero
- `Math.floor()` - Arrotonda per difetto
- `Math.ceil()` - Arrotonda per eccesso
- `Math.abs()` - Valore assoluto
- `Math.min()` - Valore minimo
- `Math.max()` - Valore massimo

### **Operatori Condizionali**
```javascript
{campo} > 0 ? {calcolo_se_vero} : {calcolo_se_falso}
```

## 💡 Esempi Pratici

### **Capitale Investito**
```javascript
({capitale_totale} / 100) * {size}
```
*Calcola quanto capitale investire basato su percentuale di size*

### **Risk/Reward Ratio**
```javascript
{takeProfit} && {stopLoss} && {entryPrice} ? 
  Math.abs({takeProfit} - {entryPrice}) / Math.abs({entryPrice} - {stopLoss}) : 0
```
*Calcola il rapporto rischio/rendimento*

### **Percentuale di Profitto**
```javascript
{capitale_investito} > 0 ? ({pnl} / {capitale_investito}) * 100 : 0
```
*Calcola la percentuale di profitto sul capitale investito*

### **Peso nel Portafoglio**
```javascript
({qty} * {entryPrice} / {capitale_totale}) * 100
```
*Calcola che percentuale del portafoglio rappresenta questa posizione*

## 🔧 Caratteristiche Avanzate

### **Dipendenze Automatiche**
Il sistema rileva automaticamente da quali campi dipende una formula e li aggiorna nell'ordine corretto.

### **Validazione in Tempo Reale**
Le formule vengono validate mentre le scrivi, mostrando errori di sintassi.

### **Valori Predefiniti**
Puoi impostare valori predefiniti che vengono usati quando un campo è vuoto.

### **Integrazione Completa**
I campi calcolati funzionano in:
- Form di inserimento trade (solo lettura)
- Tabella trade (non modificabili)
- Export CSV (inclusi automaticamente)
- Grafici personalizzati

## ⚠️ Limitazioni e Best Practices

### **Limitazioni**
- Solo campi numerici possono essere usati nei calcoli
- Evita dipendenze circolari (A dipende da B, B dipende da A)
- Le formule sono valutate in modo sicuro (no codice arbitrario)

### **Best Practices**
1. **Nomi descriptivi**: Usa ID campo chiari (`capitale_investito` vs `ci`)
2. **Formule semplici**: Dividi calcoli complessi in più campi
3. **Gestisci divisioni per zero**: Usa condizioni `{campo} > 0 ? ... : 0`
4. **Testa le formule**: Aggiungi qualche trade di prova per verificare

## 🎭 Casi d'Uso Avanzati

### **Sistema di Position Sizing**
```javascript
// Campo: capitale_totale (numero, default: 10000)
// Campo: risk_per_trade (numero, default: 2)
// Campo: capitale_rischio (calcolato)
({capitale_totale} / 100) * {risk_per_trade}

// Campo: stop_distance (calcolato)
Math.abs({entryPrice} - {stopLoss})

// Campo: qty_suggerita (calcolata)
{stop_distance} > 0 ? Math.floor({capitale_rischio} / {stop_distance}) : 0
```

### **Analisi Performance**
```javascript
// Campo: roi_percentuale (calcolato)
{capitale_investito} > 0 ? ({pnl} / {capitale_investito}) * 100 : 0

// Campo: performance_rating (calcolato)
{roi_percentuale} > 10 ? 5 : 
{roi_percentuale} > 5 ? 4 : 
{roi_percentuale} > 0 ? 3 : 
{roi_percentuale} > -5 ? 2 : 1
```

### **Gestione Rischio Avanzata**
```javascript
// Campo: value_at_risk (calcolato)
({qty} * {entryPrice}) * 0.05  // VaR al 5%

// Campo: sharpe_approx (calcolato)
{risk_reward_ratio} > 0 ? {roi_percentuale} / {risk_reward_ratio} : 0
```

---

## 🎉 Vantaggi dei Campi Calcolati

✅ **Automatizzazione**: Calcoli istantanei senza errori manuali  
✅ **Coerenza**: Stesso metodo di calcolo per tutti i trade  
✅ **Efficienza**: Risparmio di tempo nell'inserimento dati  
✅ **Analisi**: Dati sempre aggiornati per decisioni informate  
✅ **Flessibilità**: Personalizzazione completa delle metriche  

**Inizia con i campi predefiniti e personalizza secondo le tue esigenze di trading!** 🚀
