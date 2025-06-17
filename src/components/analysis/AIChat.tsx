import React, { useState, useRef, useEffect } from 'react';
import { AIMessage, CustomChartScript, Trade } from '../../types';
import { aiService } from '../../utils/aiService';
import ConfirmModal from '../modals/ConfirmModal';

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
  onScriptUpdated?: (scriptId: string, updatedScript: CustomChartScript) => void;
  trades: Trade[];
  existingScripts: CustomChartScript[];
  currentScript?: CustomChartScript | null; // Script attualmente aperto nell'editor
}

const AIChat: React.FC<AIChatProps> = ({ 
  isOpen, 
  onToggle,   onScriptGenerated, 
  onScriptUpdated,
  trades, 
  existingScripts,
  currentScript
}) => {const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(aiService.getApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState(!aiService.getApiKey());
  const [chatSize, setChatSize] = useState({ width: 400, height: 600 });
  const [isResizing, setIsResizing] = useState(false);
  const [selectedScript, setSelectedScript] = useState<CustomChartScript | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'modify' | 'explain'>('create');
  const [showScriptSelector, setShowScriptSelector] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    script: CustomChartScript | null;
    editMode: 'create' | 'modify';
  }>({ isOpen: false, script: null, editMode: 'create' });
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
  // Gestione resize della chat - Soluzione alternativa migliorata
  const handleResizeStart = (e: React.MouseEvent, direction: 'nw' | 'n' | 'w' | 'header') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = chatSize.width;
    const startHeight = chatSize.height;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      // Per l'header, abilita il ridimensionamento in tutte le direzioni
      if (direction === 'header' || direction.includes('w')) {
        newWidth = Math.max(300, Math.min(800, startWidth + (startX - e.clientX)));
      }
      if (direction === 'header' || direction.includes('n')) {
        newHeight = Math.max(300, Math.min(800, startHeight + (startY - e.clientY)));
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
      content: `🤖 **Benvenuto nell'Assistant IA per Script Personalizzati!**

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
✅ **NUOVO:** Modificare script esistenti
✅ **NUOVO:** Spiegare il funzionamento degli script

**📊 Tipi di grafico disponibili:**
📈 Linee • 📊 Barre • 🥧 Torta • 📉 Area • 🔍 Dispersione

**🔧 Modalità disponibili:**
🆕 **Crea:** Genera un nuovo script
🔧 **Modifica:** Migliora uno script esistente  
📖 **Spiega:** Comprendi come funziona uno script

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

    try {      const response = await aiService.generateScript(
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

      setMessages(prev => [...prev, assistantMessage]);      // Se è stato generato uno script, offri azioni solo in modalità creazione o modifica
      if (response.script && (editMode === 'create' || editMode === 'modify')) {
        setTimeout(() => {
          setConfirmModal({
            isOpen: true,
            script: response.script!,
            editMode: editMode
          });
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

  // Funzione per selezionare uno script esistente
  const handleScriptSelection = (script: CustomChartScript) => {
    setSelectedScript(script);
    setShowScriptSelector(false);
    
    let modeMessage = '';
    if (editMode === 'modify') {
      modeMessage = `🔧 **Script selezionato per la modifica:** "${script.name}"

**Tipo:** ${script.chartType.toUpperCase()}
**Descrizione:** ${script.description}

Dimmi come vuoi modificarlo! Esempi:
• "Aggiungi una media mobile"
• "Cambia i colori del grafico"  
• "Aggiungi un filtro per data"
• "Modifica la legenda"`;
    } else if (editMode === 'explain') {
      modeMessage = `📖 **Spiegazione dello script:** "${script.name}"

**Tipo di grafico:** ${script.chartType.toUpperCase()}
**Descrizione:** ${script.description}

🔍 **Analisi del codice:**

**Cosa fa questo script:**
Questo script genera un grafico ${script.chartType} che ${script.description.toLowerCase()}

**Funzionalità principali:**
${script.parameters.length > 0 ? 
  `• **Parametri configurabili:** ${script.parameters.map(p => p.name).join(', ')}` : 
  '• Nessun parametro configurabile'}
• **Elaborazione dati:** Analizza ${script.code.includes('trades.filter') ? 'con filtri sui trade' : 'tutti i trade disponibili'}
• **Visualizzazione:** ${script.code.includes('Chart.js') ? 'Utilizza Chart.js per il rendering' : 'Rendering personalizzato'}

**💡 Vuoi che analizzi una parte specifica del codice o che spieghi come modificarlo?**`;
    }

    const selectionMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: modeMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, selectionMessage]);
  };
  // Funzione per cambiare modalità di lavoro
  const handleModeChange = (newMode: 'create' | 'modify' | 'explain') => {
    setEditMode(newMode);
    setSelectedScript(null);
    
    let modeMessage = '';
    if (newMode === 'create') {
      modeMessage = `🆕 **Modalità Creazione attivata**

Descrivi il grafico che vuoi creare e genererò un nuovo script per te!`;
    } else if (newMode === 'modify') {
      // Se c'è un currentScript, usalo automaticamente
      if (currentScript) {
        setSelectedScript(currentScript);
        modeMessage = `🔧 **Modalità Modifica attivata per "${currentScript.name}"**

**Tipo:** ${currentScript.chartType.toUpperCase()}
**Descrizione:** ${currentScript.description}

Dimmi come vuoi modificarlo! Esempi:
• "Aggiungi una media mobile"
• "Cambia i colori del grafico"  
• "Aggiungi un filtro per data"
• "Modifica la legenda"`;
      } else {
        modeMessage = `🔧 **Modalità Modifica attivata**

Seleziona uno script esistente per modificarlo. Posso:
• Aggiungere nuove funzionalità
• Modificare i colori e lo stile
• Cambiare il tipo di grafico
• Ottimizzare le performance
• Aggiungere parametri configurabili`;
        
        if (existingScripts.length === 0) {
          modeMessage += '\n\n⚠️ **Nessuno script disponibile per la modifica.** Crea prima alcuni script!';
        } else {
          setShowScriptSelector(true);
        }
      }
    } else if (newMode === 'explain') {
      // Se c'è un currentScript, usalo automaticamente
      if (currentScript) {
        setSelectedScript(currentScript);
        modeMessage = `📖 **Spiegazione dello script:** "${currentScript.name}"

**Tipo di grafico:** ${currentScript.chartType.toUpperCase()}
**Descrizione:** ${currentScript.description}

🔍 **Analisi del codice:**

**Cosa fa questo script:**
Questo script genera un grafico ${currentScript.chartType} che ${currentScript.description.toLowerCase()}

**Funzionalità principali:**
${currentScript.parameters.length > 0 ? 
  `• **Parametri configurabili:** ${currentScript.parameters.map(p => p.name).join(', ')}` : 
  '• Nessun parametro configurabile'}
• **Elaborazione dati:** Analizza ${currentScript.code.includes('trades.filter') ? 'con filtri sui trade' : 'tutti i trade disponibili'}
• **Visualizzazione:** ${currentScript.code.includes('Chart.js') ? 'Utilizza Chart.js per il rendering' : 'Rendering personalizzato'}

**💡 Vuoi che analizzi una parte specifica del codice o che spieghi come modificarlo?**`;
      } else {
        modeMessage = `📖 **Modalità Spiegazione attivata**

Seleziona uno script per ricevere una spiegazione dettagliata del suo funzionamento, incluso:
• Come funziona il codice
• Cosa fanno i parametri
• Come modificarlo
• Suggerimenti per miglioramenti`;
        
        if (existingScripts.length === 0) {
          modeMessage += '\n\n⚠️ **Nessuno script disponibile per la spiegazione.** Crea prima alcuni script!';
        } else {
          setShowScriptSelector(true);
        }
      }
    }

    const modeChangeMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant', 
      content: modeMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, modeChangeMessage]);
  };

  const handleConfirmScript = () => {
    const script = confirmModal.script;
    if (!script) return;

    if (confirmModal.editMode === 'modify' && onScriptUpdated && selectedScript) {
      onScriptUpdated(selectedScript.id, script);
    } else {
      onScriptGenerated(script);
    }

    // Messaggio di conferma
    const confirmMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `✅ **Script "${script.name}" ${confirmModal.editMode === 'modify' ? 'modificato' : 'aggiunto'} con successo!**\n\nLo script è pronto per l'uso. Vuoi lavorare su un altro grafico? 🎨`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, confirmMessage]);
    
    setConfirmModal({ isOpen: false, script: null, editMode: 'create' });
  };

  const handleCancelScript = () => {
    // Messaggio se l'utente rifiuta
    const rejectMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: `📝 Nessun problema! Lo script è sempre disponibile nella cronologia della chat.\n\nVuoi che modifichi ancora qualcosa o preferisci provare con un altro tipo di grafico?`,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, rejectMessage]);
    
    setConfirmModal({ isOpen: false, script: null, editMode: 'create' });
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
    <div 
      ref={chatRef}
      className="ai-chat-container" 
      style={{ 
        width: `${chatSize.width}px`, 
        height: `${chatSize.height}px`,
        cursor: isResizing ? 'nw-resize' : 'default'
      }}
      data-resizing={isResizing}
    >
      {/* Barra intestazione senza selezione modalità */}
      <div className="ai-chat-header-bar">
        {/* <span className="ai-chat-title">Assistant IA</span> */}
        <div className="ai-chat-header-icons">
          {/* ...altre icone come chiudi/minimizza se presenti... */}
        </div>
      </div>

      {/* Selettore script se necessario */}
      {showScriptSelector && (
        <div className="ai-script-selector">
          <label>Seleziona uno script:</label>
          <select
            onChange={e => {
              const script = existingScripts.find(s => s.id === e.target.value);
              if (script) handleScriptSelection(script);
            }}
            defaultValue=""
          >
            <option value="" disabled>-- Scegli uno script --</option>
            {existingScripts.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Resize handles migliorati */}
      <div 
        className="resize-handle resize-handle-nw"
        onMouseDown={(e) => handleResizeStart(e, 'nw')}
        title="Ridimensiona trascinando"
      />
      <div 
        className="resize-handle resize-handle-n"
        onMouseDown={(e) => handleResizeStart(e, 'n')}
        title="Ridimensiona altezza"
      />
      <div 
        className="resize-handle resize-handle-w"
        onMouseDown={(e) => handleResizeStart(e, 'w')}
        title="Ridimensiona larghezza"
      />      <div className="ai-chat-header">
        <div 
          className="ai-chat-title"
          onMouseDown={(e) => handleResizeStart(e, 'header')}
          style={{ cursor: isResizing ? 'nw-resize' : 'move' }}
          title="Trascina per ridimensionare"
        >
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
            <select
              value={editMode}
              onChange={e => setEditMode(e.target.value as 'create' | 'modify' | 'explain')}
              className="ai-mode-select-in-settings"
              style={{ marginLeft: '1rem', minWidth: 120 }}
            >
              <option value="create">🆕 Crea</option>
              <option value="modify">🔧 Modifica</option>
              <option value="explain">📖 Spiega</option>
            </select>
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
      </div>      <div className="ai-chat-footer">
        <small>
          Alimentato da OpenRouter • {trades.length} trade disponibili
        </small>
      </div>      {/* Modal di conferma per applicazione script */}
      {confirmModal.isOpen && confirmModal.script && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={`${confirmModal.editMode === 'modify' ? 'Aggiornare' : 'Aggiungere'} Script`}
          message={`
            <div>
              <p><strong>📊 ${confirmModal.script.name}</strong></p>
              <p><strong>Tipo:</strong> ${confirmModal.script.chartType.toUpperCase()}</p>
              <p><strong>Descrizione:</strong> ${confirmModal.script.description}</p>
              ${confirmModal.script.parameters.length > 0 ? `<p><strong>Parametri:</strong> ${confirmModal.script.parameters.length}</p>` : ''}
              <br>
              <p>Vuoi ${confirmModal.editMode === 'modify' ? 'aggiornare' : 'aggiungere'} questo script al tuo progetto?</p>
            </div>
          `}
          onConfirm={handleConfirmScript}
          onCancel={handleCancelScript}
          confirmText={confirmModal.editMode === 'modify' ? 'Aggiorna' : 'Aggiungi'}
          cancelText="Annulla"
          type="success"
        />
      )}
    </div>
  );
};

export default AIChat;
