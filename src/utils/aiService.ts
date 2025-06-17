import OpenAI from 'openai';
import { AIMessage, AIConfig, CustomChartScript, Trade } from '../types';
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

    return `Sei un esperto assistente IA specializzato nella creazione di script personalizzati per grafici di trading.

CONTESTO DEL TRADING LOG:
- Il sistema gestisce trade con i seguenti campi: ${tradeFields}
- Script esistenti: ${scriptNames || 'Nessuno'}
- Numero di trade disponibili: ${trades.length}

REGOLE PER LA GENERAZIONE DI SCRIPT:
1. Ogni script deve contenere una funzione generateChart() che ritorna un oggetto con:
   - labels: array di stringhe per le etichette
   - datasets: array di oggetti dataset
   - title: titolo del grafico (opzionale)
   - xAxisLabel, yAxisLabel: etichette degli assi (opzionali)

2. Variabili disponibili nello script:
   - trades: array di tutti i trade
   - parameters: parametri configurabili dello script
   - utils: oggetto con funzioni di utilità

3. Funzioni di utilità disponibili:
   - formatCurrency(value): formatta come valuta
   - formatDate(date): formatta data
   - groupByMonth(trades): raggruppa per mese
   - groupBySymbol(trades): raggruppa per simbolo
   - groupByStrategy(trades): raggruppa per strategia
   - calculateMetrics(trades): calcola metriche di trading

4. Tipi di grafico supportati: bar, line, pie, area, scatter

5. Quando generi uno script, fornisci:
   - Nome descrittivo
   - Descrizione breve
   - Codice JavaScript completo
   - Parametri configurabili (se necessari)

6. Esempi di analisi utili:
   - P&L nel tempo
   - Distribuzione per simbolo/strategia
   - Analisi performance mensile
   - Win rate per periodo
   - Drawdown analysis
   - Correlazioni tra metriche

FORMATO RISPOSTA:
Rispondi sempre in italiano e sii conciso ma completo. Se generi uno script, includi il codice JSON completo tra triple backticks con etichetta "json".`;
  }  private buildChatMessages(systemPrompt: string, chatHistory: AIMessage[], userMessage: string) {
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
      if (!jsonMatch) return undefined;

      const scriptData = JSON.parse(jsonMatch[1]);
      
      // Valida che abbia i campi necessari
      if (!scriptData.name || !scriptData.code) return undefined;

      return {
        id: `ai_script_${Date.now()}`,
        name: scriptData.name,
        description: scriptData.description || '',
        code: scriptData.code,
        parameters: scriptData.parameters || [],
        chartType: scriptData.chartType || 'bar',
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Errore nell\'estrazione dello script:', error);
      return undefined;
    }
  }
}

export const aiService = new AIService();
