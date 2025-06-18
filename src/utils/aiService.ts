import OpenAI from 'openai';
import { AIMessage, AIConfig, CustomChartScript, Trade, ChartParameter } from '../types';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Prompt base dal file botPromt.md
const BOT_PROMPT_TEMPLATE = `Sei **"ChartScripter Pro"**, un assistente IA d'élite, specializzato nella creazione di script JavaScript per una piattaforma di analisi di trading. La tua unica missione è tradurre le richieste degli utenti in script impeccabili e pronti per l'uso, che rispettino rigorosamente le specifiche e le best practice definite in questa guida. Questa guida è la tua unica fonte di verità.

---

### **#1. PROCESSO OPERATIVO OBBLIGATORIO**

Per ogni richiesta, devi seguire questi passaggi senza eccezioni:
1.  **Analizza la Richiesta Utente**: Comprendi a fondo l'obiettivo analitico dell'utente.
2.  **Consulta la Tua Base di Conoscenza**: Basa ogni riga di codice e ogni scelta strutturale sulle specifiche tecniche definite di seguito.
3.  **Sfrutta i Dati Disponibili**: Utilizza i campi (\`\${fieldsList}\`) e le funzioni utility (\`utils\`) nel modo più efficiente possibile per raggiungere l'obiettivo.
4.  **Costruisci il JSON di Risposta**: Genera un singolo blocco di codice JSON valido, formattato come richiesto, senza testo o commenti al di fuori di esso.
5.  **Scrivi la Spiegazione Dettagliata**: Subito dopo il blocco JSON, fornisci una spiegazione chiara, amichevole e professionale dello script generato, evidenziando le sue caratteristiche, come utilizzarlo e le scelte di progettazione che hai fatto.

---

### **#2. CONTESTO DINAMICO DELLA PIATTAFORMA (Fornito ad ogni richiesta)**

*   **Numero di trade totali**: \`\${trades.length}\`
*   **Script già presenti**: \`\${scriptNames || 'Nessuno'}\`
*   **Campi Trade Disponibili (Array \`trades\`)**: \`\${fieldsList}\`
*   **Campi Disponibili**: \`\${availableFields.join(', ')}\`
*   **Descrizione Dettagliata Campi**: \`\${fieldDescriptions}\`

---

### **#3. FORMATO DI RISPOSTA OBBLIGATORIO (JSON)**

La tua risposta DEVE iniziare con \` \\\`\\\`\\\`json \` e finire con \` \\\`\\\`\\\` \`. Nessun testo prima, nessun testo dopo il blocco JSON. La spiegazione deve seguire immediatamente dopo la chiusura del blocco.

**Struttura JSON Immutabile:**
\\\`\\\`\\\`json
{
  "title": "Nome del grafico, breve e d'impatto",
  "description": "Spiegazione dettagliata di cosa mostra il grafico, il suo scopo analitico e come interpretarlo. Evidenzia le caratteristiche avanzate implementate.",
  "chartType": "bar|line|pie|area|scatter",
  "code": "function generateChart() {\\\\n  // Codice JavaScript completo e ottimizzato in una singola stringa, usando \\\\\\\\n per i ritorni a capo.\\\\n  // IL CODICE DEVE ESSERE FUNZIONANTE, COMPLETO E ROBUSTO.\\\\n}",
  "parameters": [
    {
      "id": "identificativo_univoco_parametro_in_minuscolo",
      "name": "NomeVisibileNelFormInCamelCase",
      "type": "string|number|boolean|date|select",
      "defaultValue": "valore_di_default_corretto_per_tipo",
      "required": true,
      "description": "Spiegazione chiara e concisa del parametro per l'utente finale."
    }
  ]
}
\\\`\\\`\\\`

---

### **#4. BASE DI CONOSCENZA TECNICA (Guida Interna)**

#### **A. Ambiente di Esecuzione dello Script (\`code\`)**

*   **Funzione Principale**: Ogni script DEVE contenere una funzione \`generateChart()\`.
*   **Variabili Globali Disponibili**:
    *   \`trades\`: Array di oggetti. Ogni oggetto \`trade\` ha le seguenti proprietà: \`\${availableFields.join(', ')}\`. **Nota Importante**: Queste proprietà corrispondono esattamente ai campi che l'utente vede nella tabella dei trade. Se vengono aggiunti nuovi campi, saranno automaticamente disponibili qui.
    *   \`parameters\`: Oggetto contenente i valori dei parametri definiti nell'array \`parameters\` del JSON (es. \`parameters.mioParametro\`).
    *   \`utils\`: Oggetto con funzioni di utilità.
*   **Funzioni \`utils\` Disponibili**:
    *   \`utils.formatCurrency(value)\`: Formatta un numero come valuta (es. €1.234,56).
    *   \`utils.formatDate(date)\`: Formatta un oggetto Date o una stringa data in formato leggibile (es. DD/MM/YYYY).
    *   \`utils.groupByMonth(trades)\`: Raggruppa i trade per mese (formato 'YYYY-MM').
    *   \`utils.groupBySymbol(trades)\`: Raggruppa i trade per simbolo.
    *   \`utils.groupByStrategy(trades)\`: Raggruppa i trade per strategia.
    *   \`utils.calculateMetrics(trades)\`: Calcola un oggetto di metriche di performance avanzate.

#### **B. Struttura dell'Oggetto Restituito da \`generateChart()\`**

La funzione \`generateChart()\` DEVE restituire un oggetto con la seguente, esatta, struttura:
\\\`\\\`\\\`javascript
{
  labels: string[],           // Etichette per l'asse X
  datasets: [{
    label: string,            // Nome del dataset (appare nella legenda)
    data: number[],           // Dati numerici da plottare
    backgroundColor: string | string[], // Colore/i di riempimento
    borderColor: string | string[],      // Colore/i del bordo
    borderWidth: number,      // Spessore del bordo
    fill?: boolean            // true/false per grafici a linea/area
  }],
  title: string,             // Titolo visualizzato sopra il grafico
  xAxisLabel?: string,        // Etichetta per l'asse X (opzionale)
  yAxisLabel?: string         // Etichetta per l'asse Y (opzionale)
}
\\\`\\\`\\\`

#### **C. Tipi di Grafico Supportati (\`chartType\`) e Loro Utilizzo**
*   \`bar\`: Per confronti categorici (es. P&L mensile, trade per strategia).
*   \`line\`: Per dati continui e trend temporali (es. Equity Curve).
*   \`pie\`: Per distribuzioni proporzionali (es. % trade per simbolo).
*   \`area\`: Simile a \`line\`, ma enfatizza volumi e accumuli (es. Equity Curve con riempimento).
*   \`scatter\`: Per analisi di correlazione tra due variabili numeriche (es. Rischio/Rendimento).

#### **D. Palette Colori Standard**
*   **Verde (Positivo/Profitto)**: \`rgba(34, 197, 94, 0.8)\`
*   **Rosso (Negativo/Perdita)**: \`rgba(239, 68, 68, 0.8)\`
*   **Blu (Neutro/Informativo)**: \`rgba(59, 130, 246, 0.8)\`
*   **Arancione**: \`rgba(245, 158, 11, 0.8)\`
*   **Viola**: \`rgba(139, 92, 246, 0.8)\`
*   **Rosa**: \`rgba(236, 72, 153, 0.8)\`

---

### **#5. PRINCIPI DI QUALITÀ E BEST PRACTICES**

Applica queste regole con la massima diligenza per garantire script di qualità superiore:

1.  **Robustezza e Sicurezza del Codice**:
    *   **Gestisci Casi Limite**: Prevedi e gestisci elegantemente il caso in cui \`trades\` sia vuoto o i dati filtrati risultino in un array vuoto. Restituisci un grafico "vuoto" ma informativo, senza causare errori.
    *   **Ordinamento Temporale Sicuro**: Quando ordini per data, confronta i timestamp per evitare errori: \`sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime())\`.
    *   **Validazione Input**: Controlla sempre l'esistenza e la validità dei campi prima di usarli in calcoli (es. \`trade.pnl || 0\`).

2.  **Chiarezza Visiva e Informativa**:
    *   **Colori Semantici**: Usa sempre i colori standard per indicare profitti (verde) e perdite (rosso).
    *   **Titoli e Etichette Parlanti**: Rendi i titoli dinamici per fornire un contesto aggiuntivo (es. \`title: \\\`P&L Settimanale (\${positiveWeeks}/\${totalWeeks} settimane positive)\\\`\`). Usa sempre \`xAxisLabel\` e \`yAxisLabel\`.
    *   **Formattazione**: Usa \`utils.formatCurrency\` e \`utils.formatDate\` per formattare i dati destinati a etichette o tooltip, migliorando la leggibilità.

3.  **Efficienza e Manutenibilità del Codice**:
    *   **Codice Auto-esplicativo**: Usa nomi di variabili descrittivi (\`closedTradesByMonth\`, \`cumulativeEquity\`) e inserisci commenti brevi solo per logiche complesse.
    *   **Flessibilità tramite Parametri**: Se una richiesta implica una soglia (es. "mostra solo simboli con più di 5 trade"), un periodo o una scelta, implementala come un parametro configurabile.
    *   **Logica Efficiente**: Evita loop annidati non necessari. Usa \`Map\` o oggetti per raggruppamenti e calcoli efficienti invece di iterazioni multiple sullo stesso array.

---

### **#6. TONO E LINGUA**

*   **Lingua**: Rispondi SEMPRE e SOLO in **italiano**.
*   **Tono**: Mantieni un tono professionale, competente e amichevole. Sei un esperto che guida l'utente verso la soluzione migliore, spiegando il "perché" delle tue scelte.

---

**Sei pronto. Attendo la richiesta dell'utente. Inizia la tua risposta direttamente con il blocco \` \\\`\\\`\\\`json \`.**`;

export class AIService {
  private client: OpenAI | null = null;
  private config: AIConfig;

  constructor() {
    this.config = {
      apiKey: localStorage.getItem('openrouter_api_key') || '',
      model: 'anthropic/claude-4-sonnet-20250522',
      baseURL: 'https://openrouter.ai/api/v1',
      maxTokens: 4000
    };

    if (this.config.apiKey) {
      this.initializeClient();
    }
  }

  private initializeClient() {
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL,
      dangerouslyAllowBrowser: true
    });
  }

  setApiKey(apiKey: string) {
    this.config.apiKey = apiKey;
    localStorage.setItem('openrouter_api_key', apiKey);
    this.initializeClient();
  }

  getApiKey(): string {
    return this.config.apiKey;
  }  async generateScript(
    userMessage: string,
    chatHistory: AIMessage[],
    trades: Trade[],
    existingScripts: CustomChartScript[]
  ): Promise<{ message: string; script?: CustomChartScript }> {
    if (!this.config.apiKey) {
      throw new Error('API Key non configurata. Inserisci la tua API Key di OpenRouter.');
    }

    if (!this.client) {
      throw new Error('Client IA non inizializzato. Riprova ad inserire la tua API Key.');
    }

    const systemPrompt = this.buildSystemPrompt(trades, existingScripts);
    const messages = this.buildChatMessages(systemPrompt, chatHistory, userMessage);

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: 0.7,
        stream: false
      });

      const content = response.choices[0].message.content || '';
      console.log("Risultato del bot:", content); // Registra il risultato del bot
      
      // Estrai script e messaggio dalla risposta
      const { script, naturalLanguageMessage } = this.extractScriptAndMessageFromResponse(content);
      
      return {
        message: naturalLanguageMessage,
        script
      };
    } catch (error: unknown) {
      console.error('Errore nella generazione dello script:', error);
      
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 401) {
        throw new Error('API Key non valida. Verifica la tua chiave OpenRouter.');
      } else if (errorObj.status === 429) {
        throw new Error('Limite di rate raggiunto. Riprova tra qualche minuto.');
      } else {
        throw new Error(`Errore del servizio IA: ${errorObj.message || 'Errore sconosciuto'}`);
      }
    }  }private buildSystemPrompt(trades: Trade[], existingScripts: CustomChartScript[]): string {
    // Estrai dinamicamente tutti i campi disponibili dai trade
    const availableFields = trades.length > 0 ? Object.keys(trades[0]) : [];
    const fieldsList = availableFields.map(field => `• \`${field}\``).join('\n');
    const scriptNames = existingScripts.map(s => s.name).join(', ');

    // Analizza i tipi di campi per fornire suggerimenti migliori
    const fieldTypes = trades.length > 0 ? this.analyzeFieldTypes(trades[0]) : {};
    const fieldDescriptions = this.getFieldDescriptions(fieldTypes);

    // Utilizza il template del bot e sostituisci le variabili
    return BOT_PROMPT_TEMPLATE
      .replace(/\$\{trades\.length\}/g, trades.length.toString())
      .replace(/\$\{scriptNames \|\| 'Nessuno'\}/g, scriptNames || 'Nessuno')
      .replace(/\$\{fieldsList\}/g, fieldsList)
      .replace(/\$\{availableFields\.join\(', '\)\}/g, availableFields.join(', '))
      .replace(/\$\{fieldDescriptions\}/g, fieldDescriptions);
  }private buildChatMessages(systemPrompt: string, chatHistory: AIMessage[], userMessage: string) {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Aggiungi la cronologia della chat (limitata agli ultimi 10 messaggi)
    const recentHistory = chatHistory.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Aggiungi il messaggio corrente dell'utente
    messages.push({
      role: 'user',
      content: userMessage
    });

    return messages;
  }  private extractScriptAndMessageFromResponse(content: string): { script?: CustomChartScript; naturalLanguageMessage: string } {
    try {
      // Cerca blocco markdown ```json ... ```
      let jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      let jsonStart = -1;
      let jsonEnd = -1;
      let jsonString = '';
      if (jsonMatch) {
        jsonString = jsonMatch[1];
        jsonStart = content.indexOf('```json');
        jsonEnd = content.indexOf('```', jsonStart + 7) + 3;
      } else {
        // Cerca inline: `json { ... }` oppure json { ... }\n
        // Variante con apici: `json { ... }`
        jsonMatch = content.match(/`json\s*({[\s\S]*?})`/);
        if (jsonMatch) {
          jsonString = jsonMatch[1];
          jsonStart = content.indexOf('`json');
          jsonEnd = content.indexOf('`', jsonStart + 5) + 1;
        } else {
          // Variante senza apici: json { ... }\n
          jsonMatch = content.match(/json\s*({[\s\S]*?})\s*(\n|$)/i);
          if (jsonMatch) {
            jsonString = jsonMatch[1];
            jsonStart = content.indexOf('json');
            jsonEnd = jsonStart + jsonMatch[0].length;
          }
        }
      }

      if (!jsonString) {
        throw new Error('Impossibile analizzare il codice fornito dal bot: nessun blocco JSON trovato.');
      }

      // Prova a fare il parse del JSON in modo robusto
      let scriptData: Partial<CustomChartScript & { parameters?: unknown[]; chartType?: string; title?: string; description?: string; code?: string } > = {};
      let parseOk = false;
      try {
        scriptData = JSON.parse(jsonString);
        parseOk = true;
      } catch (e) {
        // Se fallisce, prova a sistemare eventuali errori comuni
        try {
          scriptData = Function('return ' + jsonString)();
          parseOk = true;
        } catch (e2) {
          throw new Error('Impossibile analizzare il codice fornito dal bot: JSON non valido.');
        }
      }

      // Valida che abbia i campi necessari
      if (!parseOk || !scriptData.title || !scriptData.code || !scriptData.chartType) {
        throw new Error('Impossibile analizzare il codice fornito dal bot: campi obbligatori mancanti nel JSON.');
      }

      // Crea il nuovo script
      const script: CustomChartScript = {
        id: `ai_script_${Date.now()}`,
        name: scriptData.title!,
        description: scriptData.description || '',
        code: this.formatScriptCode(scriptData.code!),
        parameters: this.validateParameters(scriptData.parameters || []),
        chartType: this.validateChartType(scriptData.chartType!),
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Prendi il testo dopo il JSON (qualsiasi formato)
      let naturalLanguageMessage = content.substring(jsonEnd).trim();
      if (!naturalLanguageMessage) {        naturalLanguageMessage = script.description || 'Script generato con successo!';
      }
      return {
        script,
        naturalLanguageMessage
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      throw new Error(err?.message || 'Impossibile analizzare il codice fornito dal bot.');
    }
  }

  private formatScriptCode(code: string): string {
    // Assicura che il codice sia ben formattato
    let formattedCode = code.trim();
    
    // Se non inizia con "function", aggiungilo
    if (!formattedCode.startsWith('function generateChart')) {
      formattedCode = `function generateChart() {\n${formattedCode}\n}`;
    }
    
    return formattedCode;
  }  private validateParameters(params: unknown[]): ChartParameter[] {
    return params.map((param: unknown, index) => {
      const p = param as Record<string, unknown>;
      return {
        id: (p.id as string) || `param_${index}`,
        name: (p.name as string) || `Parametro ${index + 1}`,
        type: this.validateParameterType(p.type as string),
        defaultValue: this.getDefaultValue(p.defaultValue, this.validateParameterType(p.type as string)),
        required: Boolean(p.required),
        description: (p.description as string) || '',
        options: p.options as string[] || undefined
      };
    });
  }

  private getDefaultValue(value: unknown, type: ChartParameter['type']): string | number | boolean {
    if (value === null || value === undefined) {
      switch (type) {
        case 'number': return 0;
        case 'boolean': return false;
        default: return '';
      }
    }
    
    switch (type) {
      case 'number': return Number(value) || 0;
      case 'boolean': return Boolean(value);
      default: return String(value);
    }
  }

  private validateParameterType(type: string): ChartParameter['type'] {
    const validTypes: ChartParameter['type'][] = ['string', 'number', 'boolean', 'date', 'select'];
    return validTypes.includes(type as ChartParameter['type']) ? type as ChartParameter['type'] : 'string';
  }

  private validateChartType(type: string): CustomChartScript['chartType'] {
    const validTypes: CustomChartScript['chartType'][] = ['line', 'bar', 'pie', 'area', 'scatter'];
    return validTypes.includes(type as CustomChartScript['chartType']) ? type as CustomChartScript['chartType'] : 'bar';
  }

  private analyzeFieldTypes(trade: Trade): Record<string, string> {
    const fieldTypes: Record<string, string> = {};
    
    Object.entries(trade).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        fieldTypes[key] = 'unknown';
      } else if (typeof value === 'number') {
        fieldTypes[key] = 'number';
      } else if (typeof value === 'boolean') {
        fieldTypes[key] = 'boolean';
      } else if (typeof value === 'string') {
        // Prova a determinare se è una data
        if (this.isDateString(value)) {
          fieldTypes[key] = 'date';
        } else {
          fieldTypes[key] = 'string';
        }
      } else {
        fieldTypes[key] = typeof value;
      }
    });
    
    return fieldTypes;
  }

  private isDateString(str: string): boolean {
    if (!str) return false;
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}/, // MM-DD-YYYY
    ];
    return datePatterns.some(pattern => pattern.test(str)) && !isNaN(Date.parse(str));
  }

  private getFieldDescriptions(fieldTypes: Record<string, string>): string {
    const descriptions: string[] = [];
    
    Object.entries(fieldTypes).forEach(([field, type]) => {
      let description = `• **${field}** (${type})`;
      
      // Aggiungi descrizioni specifiche per campi comuni
      switch (field.toLowerCase()) {
        case 'id':
          description += ': Identificativo univoco del trade';
          break;
        case 'symbol':
          description += ': Simbolo/strumento finanziario (es. AAPL, EURUSD)';
          break;
        case 'pnl':
          description += ': Profitto/Perdita del trade in valuta';
          break;
        case 'qty':
        case 'quantity':
          description += ': Quantità/volume del trade';
          break;
        case 'entryprice':
        case 'entry_price':
          description += ': Prezzo di entrata nel trade';
          break;
        case 'exitprice':
        case 'exit_price':
          description += ': Prezzo di uscita dal trade';
          break;
        case 'entrydate':
        case 'entry_date':
          description += ': Data e ora di apertura del trade';
          break;
        case 'exitdate':
        case 'exit_date':
          description += ': Data e ora di chiusura del trade';
          break;
        case 'strategy':
          description += ': Strategia di trading utilizzata';
          break;
        case 'type':
          description += ': Tipo di trade (Buy/Sell, Long/Short)';
          break;
        case 'status':
          description += ': Stato del trade (Open/Closed)';
          break;
        case 'fees':
          description += ': Commissioni e costi del trade';
          break;
        case 'stoploss':
        case 'stop_loss':
          description += ': Livello di stop loss impostato';
          break;
        case 'takeprofit':
        case 'take_profit':
          description += ': Livello di take profit impostato';
          break;
        default:
          if (type === 'number') {
            description += ': Valore numerico - può essere usato per calcoli e aggregazioni';
          } else if (type === 'date') {
            description += ': Campo data - ideale per analisi temporali e trend';
          } else if (type === 'string') {
            description += ': Campo testuale - utile per raggruppamenti e filtri';
          }
      }
      
      descriptions.push(description);
    });
    
    return descriptions.join('\n');
  }
}

export const aiService = new AIService();
