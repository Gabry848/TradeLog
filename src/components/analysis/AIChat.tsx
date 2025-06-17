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

const AIChat: React.FC<AIChatProps> = ({ 
  isOpen, 
  onToggle, 
  onScriptGenerated, 
  trades, 
  existingScripts 
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(aiService.getApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(!aiService.getApiKey());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

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
      content: '👋 Ciao! Sono il tuo assistente IA per la creazione di script personalizzati. Dimmi che tipo di grafico vorresti creare e ti aiuterò a generare lo script.\n\nEsempi:\n• "Crea un grafico a linee del P&L cumulativo"\n• "Mostra la distribuzione dei trade per strategia"\n• "Analizza la performance mensile con un grafico a barre"',
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

      setMessages(prev => [...prev, assistantMessage]);

      // Se è stato generato uno script, offrilo all'utente
      if (response.script) {
        setTimeout(() => {
          const shouldAdd = window.confirm(
            `Ho generato lo script "${response.script!.name}". Vuoi aggiungerlo al tuo progetto?`
          );
          if (shouldAdd) {
            onScriptGenerated(response.script!);
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

  return (
    <div className="ai-chat-container">
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
          >
            <div className="ai-message-content">
              {message.content.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < message.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
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
    </div>
  );
};

export default AIChat;
