import React from 'react';
import '../../styles/modal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Conferma',
  cancelText = 'Annulla',
  type = 'info'
}) => {
  if (!isOpen) return null;

  const getIconForType = () => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🗑️';
      case 'success':
        return '✅';
      default:
        return 'ℹ️';
    }
  };

  const getTypeClass = () => {
    return `confirm-modal-${type}`;
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className={`modal-content confirm-modal ${getTypeClass()}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <span className="modal-icon">{getIconForType()}</span>
            {title}
          </h3>
          <button 
            className="modal-close"
            onClick={onCancel}
            title="Chiudi"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="confirm-message" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        
        <div className="modal-actions">
          <button 
            className="modal-btn modal-btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`modal-btn modal-btn-${type === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
