import React from 'react';
import { AlertCircle } from 'lucide-react';
import '../styles/ConfirmationModals.css';

const DeleteConfirmationModal = ({ 
  isOpen, 
  title = 'Delete Confirmation', 
  message = 'Are you sure you want to delete this item?',
  itemName = '',
  onConfirm, 
  onCancel, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content delete-modal">
        <div className="modal-header">
          <div className="modal-title-section">
            <AlertCircle size={24} className="alert-icon" />
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
            <div className="item-details">
              <strong>Item:</strong> <span className="item-name">{itemName}</span>
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
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span> Deleting...
              </>
            ) : (
              <>
                Yes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
