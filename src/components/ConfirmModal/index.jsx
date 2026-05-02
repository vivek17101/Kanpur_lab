import styles from './ConfirmModal.module.css';

export default function ConfirmModal({
  message,
  detail = '',
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
}) {
  if (!message) return null;
  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <p className={styles.message}>{message}</p>
        {detail && <p className={styles.detail}>{detail}</p>}
        <div className={styles.actions}>
          <button className={styles.cancel} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`${styles.confirm} ${styles[variant]}`} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
