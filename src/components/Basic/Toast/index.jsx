import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { createContext, useContext } from "react";
import styles from "./index.module.less";

// Toast Context
const ToastContext = createContext(null);

// Toast Provider Component
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 3000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const value = {
    showToast,
    removeToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastWrapper}>
        <div className={styles.toastContainer}>
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Toast Item Component
function ToastItem({ toast, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for animation
      }, toast.duration - 300);

      return () => clearTimeout(timer);
    }
  }, [toast.duration, onClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`${styles.toast} ${isExiting ? styles.exiting : ""}`}
      onClick={handleClose}
    >
      <div className={styles.toastContent}>
        <span className={styles.toastMessage}>{toast.message}</span>
      </div>
    </div>
  );
}

ToastItem.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
    duration: PropTypes.number.isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

// Hook to use Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

// Convenience functions
export function useToastHelpers() {
  const { showToast } = useToast();

  return {
    success: (message, duration) => showToast(message, "success", duration),
    error: (message, duration) => showToast(message, "error", duration),
    warning: (message, duration) => showToast(message, "warning", duration),
    info: (message, duration) => showToast(message, "info", duration),
  };
}

