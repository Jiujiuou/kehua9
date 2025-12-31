import { useState, useCallback, createContext, useContext } from "react";
import PropTypes from "prop-types";
import styles from "./index.module.less";

// Confirm Context
const ConfirmContext = createContext(null);

// Confirm Provider Component
export function ConfirmProvider({ children }) {
  const [confirm, setConfirm] = useState(null);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    setConfirm({
      message,
      onConfirm: () => {
        setConfirm(null);
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setConfirm(null);
        if (onCancel) onCancel();
      },
    });
  }, []);

  const value = {
    showConfirm,
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {confirm && (
        <div className={styles.confirmOverlay} onClick={confirm.onCancel}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmMessage}>{confirm.message}</div>
            <div className={styles.confirmButtons}>
              <button
                className={styles.cancelButton}
                onClick={confirm.onCancel}
              >
                取消
              </button>
              <button
                className={styles.confirmButton}
                onClick={confirm.onConfirm}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

ConfirmProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook to use Confirm
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}

// Convenience function
export function useConfirmHelper() {
  const { showConfirm } = useConfirm();

  return useCallback((message) => {
    return new Promise((resolve) => {
      showConfirm(
        message,
        () => resolve(true),
        () => resolve(false)
      );
    });
  }, [showConfirm]);
}

