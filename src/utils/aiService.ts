import OpenAI from 'openai';
import { AIMessage, AIConfig, CustomChartScript, Trade, ChartParameter } from '../types';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export class AIService {
  private client: OpenAI | null = null;
  private config: AIConfig;

  constructor() {
    this.config = {
      apiKey: localStorage.getItem('openrouter_api_key') || '',
      model: 'anthropic/claude-3.5-sonnet',
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
  }
  async generateScript(
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
      });      const content = response.choices[0].message.content || '';
      console.log("Risultato del bot:", content); // Registra il risultato del bot
      
      // Cerca di estrarre uno script dal contenuto della risposta
      const script = this.extractScriptFromResponse(content);
      
      return {
        message: content,
        script
      };} catch (error: unknown) {
      console.error('Errore nella generazione dello script:', error);
      
      const errorObj = error as { status?: number; message?: string };
      if (errorObj.status === 401) {
        throw new Error('API Key non valida. Verifica la tua chiave OpenRouter.');
      } else if (errorObj.status === 429) {
        throw new Error('Limite di rate raggiunto. Riprova tra qualche minuto.');
      } else {
        throw new Error(`Errore del servizio IA: ${errorObj.message || 'Errore sconosciuto'}`);
      }
    }
  }  private buildSystemPrompt(trades: Trade[], existingScripts: CustomChartScript[]): string {
    // Estrai dinamicamente tutti i campi disponibili dai trade
    const availableFields = trades.length > 0 ? Object.keys(trades[0]) : [];
    const fieldsList = availableFields.map(field => `• \`${field}\``).join('\n');
    const scriptNames = existingScripts.map(s => s.name).join(', ');

    // Analizza i tipi di campi per fornire suggerimenti migliori
    const fieldTypes = trades.length > 0 ? this.analyzeFieldTypes(trades[0]) : {};
    const fieldDescriptions = this.getFieldDescriptions(fieldTypes);

    return `Sei un esperto assistente IA specializzato nella creazione di script personalizzati per grafici di trading. Il tuo compito è generare script moderni, efficienti e visivamente accattivanti.

🎯 CONTESTO DEL TRADING LOG:
• **Numero di trade disponibili**: ${trades.length}
• **Script esistenti**: ${scriptNames || 'Nessuno'}

📊 CAMPI DISPONIBILI NEI TRADE:
${fieldsList}

🔍 DESCRIZIONE CAMPI:
${fieldDescriptions}

� FORMATO RISPOSTA RICHIESTO:
Rispondi SEMPRE con un JSON valido racchiuso tra \`\`\`json e \`\`\`, seguito da una spiegazione amichevole.

Struttura JSON obbligatoria:
\`\`\`json
{
  "title": "Nome del grafico breve e descrittivo",
  "description": "Spiegazione dettagliata di cosa mostra il grafico",
  "chartType": "bar|line|pie|area|scatter",
  "code": "function generateChart() { /* codice JavaScript completo */ }",
  "parameters": [
    {
      "id": "param_id",
      "name": "Nome Parametro",
      "type": "string|number|boolean|date|select",
      "defaultValue": "valore_default",
      "required": true,
      "description": "Descrizione del parametro"
    }
  ]
}
\`\`\`

🛠️ VARIABILI DISPONIBILI NEL CODICE:
• \`trades\`: Array completo di tutti i trade con i campi: [${availableFields.join(', ')}]
• \`parameters\`: Oggetto con parametri configurabili dello script
• \`utils\`: Funzioni di utilità per analisi e formattazione

🔧 FUNZIONI UTILITY DISPONIBILI:
• \`utils.formatCurrency(value)\`: Formatta valori monetari (es. €1.234,56)
• \`utils.formatDate(date)\`: Formatta date in formato leggibile
• \`utils.groupByMonth(trades)\`: Raggruppa trade per mese
• \`utils.groupBySymbol(trades)\`: Raggruppa trade per simbolo
• \`utils.groupByStrategy(trades)\`: Raggruppa trade per strategia
• \`utils.calculateMetrics(trades)\`: Calcola metriche di performance

📈 TIPI DI GRAFICI SUPPORTATI:
• \`bar\`: Grafici a barre per confronti e distribuzioni
• \`line\`: Grafici a linee per trend temporali e equity curves
• \`pie\`: Grafici a torta per proporzioni e distribuzioni
• \`area\`: Grafici ad area per volumi e cumulative nel tempo
• \`scatter\`: Grafici di dispersione per correlazioni e analisi

🎨 STANDARD DI QUALITÀ:
• **Codice pulito**: Commenti esplicativi e nomi variabili descrittivi
• **Performance**: Logica efficiente con gestione edge cases
• **Design moderno**: Colori professionali e styling contemporaneo
• **Responsività**: Grafici che si adattano a diverse dimensioni
• **Accessibilità**: Etichette chiare e contrasto adeguato

💡 ESEMPI DI ANALISI AVANZATE:
• **Equity curves**: Utilizza campi come \`${availableFields.includes('pnl') ? 'pnl' : 'profit'}\` cumulativo nel tempo
• **Performance per simbolo**: Raggruppa per \`${availableFields.includes('symbol') ? 'symbol' : 'instrument'}\` e calcola metriche
• **Analisi strategia**: Confronta \`${availableFields.includes('strategy') ? 'strategy' : 'type'}\` con win rate e P&L
• **Distribuzione P&L**: Istogrammi di profitti/perdite con percentili
• **Risk management**: Analizza stop loss vs take profit se disponibili
• **Timing analysis**: Performance per periodo usando campi data

🚀 BEST PRACTICES PER IL CODICE:
1. **Filtra trade rilevanti**: \`trades.filter(t => t.status === 'Closed')\` per analisi complete
2. **Ordina per data**: Usa campi data disponibili per ordinamenti temporali
3. **Gestisci dati mancanti**: Usa valori di default e validazione
4. **Colori semantici**: Verde per profitti, rosso per perdite, blu per neutrali
5. **Formattazione**: Usa sempre le utility per valute e date
6. **Performance**: Evita loop nested e operations costose

⚠️ IMPORTANTE:
• Rispondi SEMPRE in italiano con tono professionale ma amichevole
• Il JSON deve essere valido e completo (controlla parentesi e virgole)
• Il codice deve essere pronto all'uso senza modifiche
• Includi sempre una spiegazione dettagliata dopo il JSON
• Sii creativo ma mantieni focus sulla praticità dei grafici

🎯 ESEMPI DI PROMPT CHE PUOI GESTIRE:
• "Crea equity curve usando i campi disponibili per P&L e date"
• "Mostra distribuzione per ${availableFields.includes('symbol') ? 'symbol' : availableFields.includes('strategy') ? 'strategy' : 'categoria'}"
• "Analizza performance mensile con filtri sui campi disponibili"
• "Grafico correlazione tra ${availableFields.length > 3 ? availableFields[2] : 'volume'} e ${availableFields.includes('pnl') ? 'pnl' : 'risultato'}"

Ora dimmi che tipo di grafico vorresti creare e ti fornirò un script professionale che sfrutta al meglio i tuoi dati! 🚀`;
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
  }
  private extractScriptFromResponse(content: string): CustomChartScript | undefined {
    try {
      // Cerca il blocco JSON nel contenuto
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        console.log('Nessun blocco JSON trovato nella risposta');
        return undefined;
      }

      const scriptData = JSON.parse(jsonMatch[1]);
      
      // Valida che abbia i campi necessari del nuovo formato
      if (!scriptData.title || !scriptData.code || !scriptData.chartType) {
        console.log('JSON non valido - campi mancanti:', scriptData);
        return undefined;
      }

      // Costruisce lo script con il nuovo formato
      const script: CustomChartScript = {
        id: `ai_script_${Date.now()}`,
        name: scriptData.title,
        description: scriptData.description || '',
        code: this.formatScriptCode(scriptData.code),
        parameters: this.validateParameters(scriptData.parameters || []),
        chartType: this.validateChartType(scriptData.chartType),
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Script estratto con successo:', script.name);
      return script;
    } catch (error) {
      console.error('Errore nell\'estrazione dello script:', error);
      return undefined;
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
