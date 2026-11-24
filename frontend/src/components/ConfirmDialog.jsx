import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Yes, delete',
  cancelLabel = 'No, cancel',
  busy = false,
  onConfirm,
  onCancel,
}) {
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      className="modal-overlay confirm-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <div
        className="confirm-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <div className="confirm-icon">
          <i className="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
        </div>
        <h4 id="confirm-dialog-title">{title}</h4>
        <p id="confirm-dialog-message">{message}</p>
        <div className="confirm-foot">
          <button
            ref={cancelRef}
            type="button"
            className="btn btn-outline"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="btn btn-confirm-delete"
            onClick={onConfirm}
            disabled={busy}
          >
            <i className="bi bi-trash3" aria-hidden="true"></i>{' '}
            {busy ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
