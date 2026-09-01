import React from 'react';
import { Send, AlertCircle } from 'lucide-react';
import '../styles/ConfirmationModals.css';

const SubmitConfirmationModal = ({ 
  isOpen, 
  title = 'Submit Confirmation', 
  message = 'Are you sure you want to submit this form?',
  itemName = '',
  onConfirm, 
  onCancel, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content submit-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <AlertCircle size={24} className="check-icon" />
            <h2>{title}</h2>
          </div>
          <button 
            onClick={onCancel} 
            className="modal-close-btn"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-message">{message}</p>
          {itemName && (
            <div className="item-details submit-details">
              <strong>Form Type:</strong> <span className="item-name">{itemName}</span>
            </div>
          )}
          
        </div>

        <div className="modal-footer">
          <button 
            onClick={onCancel} 
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="btn btn-success"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Submitting...
              </>
            ) : (
              <>
                <Send size={16} /> Confirm Submit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitConfirmationModal;
