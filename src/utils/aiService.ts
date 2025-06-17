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
      });

      const content = response.choices[0].message.content || '';
      
      // Cerca di estrarre uno script dal contenuto della risposta
      const script = this.extractScriptFromResponse(content);
      
      return {
        message: content,
        script
      };    } catch (error: unknown) {
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
  }
  private buildSystemPrompt(trades: Trade[], existingScripts: CustomChartScript[]): string {
    const tradeFields = trades.length > 0 ? Object.keys(trades[0]).join(', ') : '';
    const scriptNames = existingScripts.map(s => s.name).join(', ');

    return `Sei un esperto assistente IA specializzato nella creazione di script personalizzati per grafici di trading. Il tuo compito è generare script moderni, efficienti e visivamente accattivanti.

🎯 CONTESTO DEL TRADING LOG:
• Campi disponibili nei trade: ${tradeFields}
• Script esistenti: ${scriptNames || 'Nessuno'}
• Numero di trade disponibili: ${trades.length}

📊 FORMATO RISPOSTA RICHIESTO:
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
• \`trades\`: Array completo di tutti i trade
• \`parameters\`: Oggetto con parametri configurabili
• \`utils\`: Funzioni di utilità per analisi

🔧 FUNZIONI UTILITY DISPONIBILI:
• \`utils.formatCurrency(value)\`: Formatta valori monetari (es. €1.234,56)
• \`utils.formatDate(date)\`: Formatta date in formato leggibile
• \`utils.groupByMonth(trades)\`: Raggruppa trade per mese
• \`utils.groupBySymbol(trades)\`: Raggruppa trade per simbolo
• \`utils.groupByStrategy(trades)\`: Raggruppa trade per strategia
• \`utils.calculateMetrics(trades)\`: Calcola metriche di performance

📈 TIPI DI GRAFICI SUPPORTATI:
• \`bar\`: Grafici a barre per confronti e distribuzioni
• \`line\`: Grafici a linee per trend temporali
• \`pie\`: Grafici a torta per proporzioni
• \`area\`: Grafici ad area per volumi nel tempo
• \`scatter\`: Grafici di dispersione per correlazioni

🎨 STANDARD DI QUALITÀ:
• Codice pulito e ben commentato
• Logica efficiente e performante
• Colori moderni e professionali
• Gestione errori e casi edge
• Nomi variabili descrittivi
• Utilizzo appropriato delle utility

💡 ESEMPI DI ANALISI AVANZATE:
• Equity curves con drawdown analysis
• Heatmap performance per periodo
• Analisi win rate per strategia
• Correlazioni risk/reward
• Distribuzione P&L con percentili
• Analisi temporale delle performance

🚀 BEST PRACTICES PER IL CODICE:
1. Filtra sempre i trade chiusi quando necessario: \`trades.filter(t => t.status === 'Closed')\`
2. Ordina i dati per date: \`.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())\`
3. Gestisci dati mancanti con valori di default
4. Usa colori consistenti e professionali
5. Aggiungi titoli e etichette descrittive

⚠️ IMPORTANTE:
• Rispondi SEMPRE in italiano
• Il JSON deve essere valido e completo
• Il codice deve essere pronto all'uso
• Includi sempre una spiegazione dopo il JSON
• Sii creativo ma mantieni la praticità

Ora dimmi che tipo di grafico vorresti creare e ti fornirò un script professionale e moderno!`;
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
}

export const aiService = new AIService();
