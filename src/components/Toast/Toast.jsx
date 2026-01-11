import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import './Toast.css';

const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
};

const Toast = ({ id, type = 'info', message, duration = 3000, onClose }) => {
    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, id, onClose]);

    return (
        <div className={`toast toast-${type}`} role="alert">
            <div className="toast-icon">
                {icons[type]}
            </div>
            <div className="toast-content">
                <p className="toast-message">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="toast-close"
                aria-label="Close notification"
            >
                <X size={16} />
            </button>
            {duration && (
                <div
                    className="toast-progress"
                    style={{
                        animationDuration: `${duration}ms`,
                        color: `var(--color-${type})`
                    }}
                />
            )}
        </div>
    );
};

export default Toast;
