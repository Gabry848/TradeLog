# 🎯 Valori Predefiniti per Campi - TradeLog

## 🌟 Cosa Sono i Valori Predefiniti

I **valori predefiniti** permettono di pre-compilare automaticamente i campi quando inserisci un nuovo trade, risparmiando tempo e assicurando coerenza nei dati.

## 📋 Tipi di Campo Supportati

### 🔢 **Campi Numerici**
- **Impostazione**: Inserisci un numero (es: `10000`, `2.5`)
- **Utilizzo**: Perfetto per capitale, percentuali, commissioni predefinite
- **Esempio**: Campo "Capitale Totale" con valore predefinito `10000`

### 📝 **Campi Testo**
- **Impostazione**: Inserisci testo (es: `"Manual"`, `"Analisi tecnica"`)
- **Utilizzo**: Ideale per strategie ricorrenti, note standard
- **Esempio**: Campo "Strategia" con valore predefinito `"Breakout"`

### 📅 **Campi Data**
- **Impostazione**: Seleziona una data (es: `2025-06-16`)
- **Utilizzo**: Utile per date di riferimento, scadenze
- **Esempio**: Campo "Data Analisi" con valore predefinito data odierna

### 📋 **Campi Selezione**
- **Impostazione**: Scegli una delle opzioni disponibili
- **Utilizzo**: Perfetto per valori ricorrenti (settori, paesi, livelli)
- **Esempio**: Campo "Settore" con valore predefinito `"Tecnologia"`

### 🧮 **Campi Calcolati**
- **Impostazione**: Valore numerico di fallback quando i calcoli falliscono
- **Utilizzo**: Valore utilizzato se la formula non può essere calcolata
- **Esempio**: Campo "Risk/Reward" con valore predefinito `0`

## 🚀 Come Impostare Valori Predefiniti

### **Durante la Creazione di un Campo**
1. Vai su **Settings** → **Gestione Campi Operazioni**
2. Clicca **"Aggiungi Campo"**
3. Compila i dettagli del campo
4. Nel campo **"Valore Predefinito"**:
   - **Numero**: Inserisci il valore numerico
   - **Testo**: Scrivi il testo predefinito
   - **Data**: Seleziona la data dal calendario
   - **Selezione**: Scegli dal menu a tendina
5. Clicca **"Aggiungi Campo"**

### **Modificando un Campo Esistente**
1. Trova il campo nella lista
2. Clicca **✏️ Modifica**
3. Aggiorna il **"Valore Predefinito"**
4. Clicca **"Salva Modifiche"**

## 💡 Esempi Pratici

### **Setup Trading Standard**
```
Campo: "Capitale Totale" (numero) → Predefinito: 10000
Campo: "Size %" (numero) → Predefinito: 2
Campo: "Settore" (selezione) → Predefinito: "Tecnologia"
Campo: "Strategia" (testo) → Predefinito: "Breakout"
Campo: "Confidence Level" (selezione) → Predefinito: "Alto"
```

### **Risultato nel Form**
Quando apri **"Add Trade"**, i campi si precompilano automaticamente:
- Capitale Totale: `10000` ✓
- Size %: `2` ✓  
- Settore: `Tecnologia` ✓
- Strategia: `Breakout` ✓
- Confidence Level: `Alto` ✓

## ⚡ Funzionalità Avanzate

### **Campi Calcolati Automatici**
Con i valori predefiniti attivi, i campi calcolati si aggiornano immediatamente:

```
Se hai impostato:
- Capitale Totale: 10000 (predefinito)
- Size %: 2 (predefinito)

Il campo calcolato "Capitale Investito" mostrerà automaticamente: 200€
Formula: (10000 / 100) * 2 = 200
```

### **Selezione Intelligente dei Campi**
Il selettore di campi nel **Formula Editor** mostra:
- **Nome campo** (es: "Capitale Totale")
- **ID campo** (es: "capitale_totale") 
- **Tipo campo** (es: "number")

Questo ti aiuta a scegliere i campi corretti per le formule.

### **Aggiornamento in Tempo Reale**
I valori si aggiornano istantaneamente mentre digiti:
1. Cambi "Size %" da 2 a 3
2. "Capitale Investito" si aggiorna automaticamente da 200€ a 300€
3. "Peso Portafoglio %" si ricalcola di conseguenza

## 🎭 Casi d'Uso Tipici

### **🏢 Trading Professionale**
```
Capitale Totale: 50000€
Risk per Trade: 1%  
Settore Preferito: "Tecnologia"
Time Frame: "Swing"
Strategia: "Mean Reversion"
```

### **👤 Trading Retail**
```
Capitale Totale: 5000€
Risk per Trade: 3%
Paese: "USA"  
Market Cap: "Large Cap"
Strategia: "Momentum"
```

### **📊 Trading Sistematico**
```
Capitale Totale: 100000€
Risk per Trade: 0.5%
Confidence Level: "Molto Alto"
Time Frame: "Intraday"
Note: "Sistema automatico v2.1"
```

## ✅ Vantaggi dei Valori Predefiniti

- **⚡ Velocità**: Inserimento trade 5x più veloce
- **🎯 Coerenza**: Stessi valori standard per tutti i trade
- **🔄 Automatismo**: Calcoli istantanei appena apri il form
- **📊 Analisi**: Dati uniformi per statistiche accurate
- **🛡️ Riduzione Errori**: Meno possibilità di dimenticare campi importanti

## 🔧 Tips & Trucchi

1. **Usa valori realistici**: Imposta valori che usi effettivamente
2. **Aggiorna periodicamente**: Rivedi i predefiniti ogni trimestre
3. **Testa con trade fittizi**: Verifica che i calcoli siano corretti
4. **Sfrutta i Quick Add**: Usa i pacchetti predefiniti per iniziare rapidamente
5. **Combina sapientemente**: Mix di campi fissi e calcolati per massima efficienza

---

**🎉 Con i valori predefiniti configurati, inserire un trade diventa un'operazione di pochi secondi!** 🚀
