import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, CustomChartScript, Trade } from '../../types';
import { aiService } from '../../utils/aiService';

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  onScriptGenerated: (script: CustomChartScript) => void;
  trades: Trade[];
  existingScripts: CustomChartScript[];
}

// Componente per formattare i messaggi con Markdown base
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  const formatContent = (text: string) => {
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code inline
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Newlines
      .replace(/\n/g, '<br />');
  };

  return (
    <div 
      dangerouslySetInnerHTML={{ 
        __html: formatContent(content) 
      }} 
    />
  );
};

interface AIChatProps {
  isOpen: boolean;
  onToggle: () => void;
  onScriptGenerated: (script: CustomChartScript) => void;
  trades: Trade[];
  existingScripts: CustomChartScript[];
}

const AIChat: React.FC<AIChatProps> = ({ 
  isOpen, 
  onToggle, 
  onScriptGenerated, 
  trades, 
  existingScripts 
}) => {  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(aiService.getApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(!aiService.getApiKey());
  const [chatSize, setChatSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Gestione resize della chat
  const handleMouseDown = (e: React.MouseEvent, direction: 'nw' | 'n' | 'w') => {
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = chatSize.width;
    const startHeight = chatSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      if (direction.includes('w')) {
        newWidth = Math.max(320, startWidth + (startX - e.clientX));
      }
      if (direction.includes('n')) {
        newHeight = Math.max(400, startHeight + (startY - e.clientY));
      }
      
      setChatSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      aiService.setApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      addWelcomeMessage();
    }
  };
  const addWelcomeMessage = () => {
    const welcomeMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `� **Benvenuto nell'Assistant IA per Script Personalizzati!**

Sono qui per aiutarti a creare grafici avanzati per la tua analisi di trading. Basta che mi descrivi cosa vuoi visualizzare e io genererò il codice JavaScript completo.

**💡 Esempi di richieste:**
• *"Crea un grafico dell'equity curve con drawdown"*
• *"Mostra la distribuzione P&L per strategia"*
• *"Analizza le performance mensili con grafico a barre"*
• *"Fai un grafico a torta dei trade per simbolo"*

**🎯 Cosa posso fare:**
✅ Generare script JavaScript pronti all'uso
✅ Creare grafici moderni e professionali  
✅ Aggiungere parametri configurabili
✅ Ottimizzare per performance e leggibilità

**📊 Tipi di grafico disponibili:**
📈 Linee • 📊 Barre • 🥧 Torta • 📉 Area • 🔍 Dispersione

Dimmi che tipo di analisi vorresti vedere! 🎨`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiService.generateScript(
        inputMessage.trim(),
        messages,
        trades,
        existingScripts
      );

      const assistantMessage: AIMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);      // Se è stato generato uno script, offrilo all'utente
      if (response.script) {
        setTimeout(() => {
          const scriptInfo = `📊 **${response.script!.name}**
          
**Tipo:** ${response.script!.chartType.toUpperCase()}
**Descrizione:** ${response.script!.description}
${response.script!.parameters.length > 0 ? `**Parametri:** ${response.script!.parameters.length}` : ''}

Vuoi aggiungere questo script al tuo progetto?`;

          const shouldAdd = window.confirm(scriptInfo);
          if (shouldAdd) {
            onScriptGenerated(response.script!);
            
            // Aggiungi messaggio di conferma
            const confirmMessage: AIMessage = {
              id: `msg_${Date.now() + 2}`,
              role: 'assistant',
              content: `✅ **Script "${response.script!.name}" aggiunto con successo!**
              
Lo script è stato caricato nell'editor e è pronto per l'uso. Puoi modificarlo ulteriormente se necessario o testarlo direttamente.

Vuoi creare un altro grafico? 🎨`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, confirmMessage]);
          } else {
            // Messaggio se l'utente rifiuta
            const rejectMessage: AIMessage = {
              id: `msg_${Date.now() + 2}`,
              role: 'assistant',
              content: `📝 Nessun problema! Lo script è sempre disponibile nella cronologia della chat. 

Vuoi che modifichi qualcosa nel codice o preferisci provare con un altro tipo di grafico?`,
              timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, rejectMessage]);
          }
        }, 500);
      }
    } catch (error) {
      const errorMessage: AIMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `❌ ${error instanceof Error ? error.message : 'Si è verificato un errore imprevisto.'}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    addWelcomeMessage();
  };

  if (!isOpen) {
    return (
      <button 
        onClick={onToggle}
        className="ai-chat-toggle"
        title="Apri Assistant IA"
      >
        🤖 IA
      </button>
    );
  }
  return (    <div 
      ref={chatRef}
      className="ai-chat-container" 
      style={{ 
        width: `${chatSize.width}px`, 
        height: `${chatSize.height}px`,
        cursor: isResizing ? 'nw-resize' : 'default'
      }}
      data-resizing={isResizing}
    >
      {/* Resize handles */}
      <div 
        className="resize-handle resize-handle-nw"
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div 
        className="resize-handle resize-handle-n"
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div 
        className="resize-handle resize-handle-w"
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />

      <div className="ai-chat-header">
        <div className="ai-chat-title">
          <span className="ai-icon">🤖</span>
          <h4>Assistant IA</h4>
        </div>
        <div className="ai-chat-controls">
          <button 
            onClick={clearChat}
            className="ai-chat-clear"
            title="Pulisci chat"
          >
            🗑️
          </button>
          <button 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className="ai-chat-settings"
            title="Impostazioni"
          >
            ⚙️
          </button>
          <button 
            onClick={onToggle}
            className="ai-chat-close"
            title="Chiudi"
          >
            ✕
          </button>
        </div>
      </div>

      {showApiKeyInput && (
        <div className="ai-api-key-input">
          <div className="api-key-form">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Inserisci la tua API Key di OpenRouter"
              className="api-key-field"
            />
            <button 
              onClick={handleApiKeySubmit}
              className="api-key-submit"
            >
              Salva
            </button>
          </div>
          <p className="api-key-help">
            Ottieni la tua API Key su{' '}
            <a 
              href="https://openrouter.ai/keys" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              openrouter.ai
            </a>
          </p>
        </div>
      )}

      <div className="ai-chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`ai-message ${message.role}`}
          >            <div className="ai-message-content">
              <FormattedMessage content={message.content} />
            </div>
            <div className="ai-message-time">
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="ai-message assistant">
            <div className="ai-message-content ai-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input">
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Descrivi il grafico che vorresti creare..."
          className="ai-input-field"
          rows={2}
          disabled={isLoading || showApiKeyInput}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading || showApiKeyInput}
          className="ai-send-button"
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>

      <div className="ai-chat-footer">
        <small>
          Alimentato da OpenRouter • {trades.length} trade disponibili
        </small>
      </div>

      {/* Resize handles */}
      <div 
        className="ai-chat-resize-handle nw"
        onMouseDown={(e) => handleMouseDown(e, 'nw')}
      />
      <div 
        className="ai-chat-resize-handle n"
        onMouseDown={(e) => handleMouseDown(e, 'n')}
      />
      <div 
        className="ai-chat-resize-handle w"
        onMouseDown={(e) => handleMouseDown(e, 'w')}
      />
    </div>
  );
};

export default AIChat;
