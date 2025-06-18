# 📋 Guida: Come Registrare e Configurare le Operazioni di Trading

## 🎯 Registrare una Nuova Operazione

### 1. **Accesso alla Sezione Trades**
- Clicca su **"Trades"** nella barra di navigazione principale

### 2. **Aggiungere una Nuova Operazione**
- Clicca sul pulsante **"Add Trade"** (con icona +)
- Si aprirà un modal con il form di inserimento

### 3. **Compilare i Campi**
I campi disponibili sono:
- **Symbol** ⭐ (Obbligatorio): Simbolo del titolo (es: AAPL, MSFT)
- **Type** ⭐ (Obbligatorio): Buy o Sell
- **Quantity** ⭐ (Obbligatorio): Numero di azioni/contratti
- **Price** ⭐ (Obbligatorio): Prezzo per azione
- **Date** ⭐ (Obbligatorio): Data dell'operazione
- **Strategy** (Opzionale): Strategia utilizzata (es: Momentum, Scalping)
- **Fees** (Opzionale): Commissioni del broker

### 4. **Salvataggio**
- Clicca su **"Add Trade"** per salvare
- L'operazione viene salvata automaticamente nel localStorage
- Viene generato un export CSV automatico

## ⚙️ Configurazione del Salvataggio

### 1. **Accesso alle Impostazioni**
- Clicca su **"Settings"** nella barra di navigazione

### 2. **Configurazione File CSV**
- **Nome File**: Imposta il nome del file CSV (es: "trading_operations.csv")
- **Cartella Destinazione**: Seleziona dove salvare i file
  - Lascia vuoto per usare la cartella download predefinita
  - Usa "Sfoglia" per selezionare una cartella specifica (solo app Electron)

### 3. **Valori Predefiniti**
Configura i valori che appariranno automaticamente nei nuovi trade:
- **P&L Predefinito**: Valore iniziale per nuove operazioni
- **Quantità Predefinita**: Numero standard di azioni
- **Prezzo Predefinito**: Prezzo iniziale suggerito
- **Commissioni Predefinite**: Commissioni standard del tuo broker

## 📁 Dove Vengono Salvate le Operazioni

### **Salvataggio Locale**
- Tutte le operazioni sono salvate nel **localStorage** del browser
- I dati persistono tra le sessioni
- Backup automatico locale

### **Export CSV Automatico**
- Ad ogni nuova operazione o modifica, viene generato un export CSV
- Il file viene salvato in base alla configurazione:
  - **Browser Web**: Download nella cartella predefinita
  - **App Electron**: Salvataggio diretto nella cartella configurata

### **Percorso File**
Il percorso completo è mostrato nella sezione Settings:
```
Percorso completo: C:\Users\Nome\Documents\Trading\trading_operations.csv
```

## 🔄 Import/Export Manuale

### **Importare Operazioni**
1. Vai nella sezione **Trades**
2. Clicca su **"Import CSV"**
3. Seleziona un file CSV con le operazioni
4. Le operazioni vengono aggiunte a quelle esistenti (non sostituite)

### **Esportare Operazioni**
1. Vai nella sezione **Trades**
2. Clicca su **"Export CSV"**
3. Il file viene salvato secondo la configurazione attiva

## 📊 Modifica delle Operazioni

### **Editing Inline**
- Nella tabella Trades, clicca su qualsiasi cella per modificarla
- Premi **Enter** per salvare o **Esc** per annullare
- Le modifiche vengono salvate automaticamente
- Feedback visivo per confermare il salvataggio

### **Validazione**
- I campi numerici accettano solo numeri
- Il simbolo è obbligatorio
- Le date devono essere valide
- Gli errori vengono mostrati con feedback visivo

## 🎨 Personalizzazione

### **Campi Configurabili**
I campi delle operazioni sono completamente configurabili:
- Aggiungi campi personalizzati
- Modifica placeholder e validazioni
- Imposta campi obbligatori o opzionali

### **Formato CSV**
Il formato CSV generato include tutti i campi configurati:
```csv
Symbol,Type,Quantity,Price,Date,Strategy,Fees
AAPL,Buy,100,150.00,2024-06-14,Momentum,9.95
```

## 💡 Consigli per l'Utilizzo

### **Best Practices**
1. **Configura i valori predefiniti** per velocizzare l'inserimento
2. **Usa una cartella dedicata** per i file CSV
3. **Fai backup regolari** esportando i dati
4. **Controlla la configurazione** prima di operazioni importanti

### **Gestione Dati**
- I dati sono salvati localmente nel browser
- Usa la funzione export per backup esterni
- Importa dati da altri sistemi tramite CSV
- Le modifiche sono immediate e persistenti

### **Sicurezza**
- I dati rimangono sul tuo dispositivo
- Nessuna trasmissione verso server esterni
- Controllo completo sui tuoi dati di trading

---

🎯 **Con questa configurazione, ogni operazione viene registrata automaticamente e salvata nel formato che preferisci!**
