import React, { forwardRef, useState } from 'react';
import './Input.css';

const Input = forwardRef(({
    label,
    helperText,
    error,
    success,
    leftIcon,
    rightIcon,
    className = '',
    id,
    maxLength,
    showCount,
    disabled,
    ...props
}, ref) => {
    const [valueLength, setValueLength] = useState(props.value ? props.value.length : 0);

    const handleChange = (e) => {
        setValueLength(e.target.value.length);
        if (props.onChange) props.onChange(e);
    };

    const wrapperClasses = [
        'input-wrapper',
        error ? 'error' : '',
        success ? 'success' : '',
        disabled ? 'disabled' : '',
        className
    ].filter(Boolean).join(' ');

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className="input-group">
            {label && <label htmlFor={inputId} className="input-label">{label}</label>}

            <div className={wrapperClasses}>
                {leftIcon && <span className="input-icon left">{leftIcon}</span>}

                <input
                    ref={ref}
                    id={inputId}
                    className="input-field"
                    disabled={disabled}
                    maxLength={maxLength}
                    aria-invalid={!!error}
                    aria-describedby={helperText ? `${inputId}-helper` : undefined}
                    onChange={handleChange}
                    {...props}
                />

                {rightIcon && <span className="input-icon right">{rightIcon}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {(helperText || error || success) && (
                    <span
                        id={`${inputId}-helper`}
                        className={`input-helper ${error ? 'error' : success ? 'success' : ''}`}
                    >
                        {error || success || helperText}
                    </span>
                )}

                {showCount && maxLength && (
                    <span className="char-count">
                        {valueLength}/{maxLength}
                    </span>
                )}
            </div>
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
