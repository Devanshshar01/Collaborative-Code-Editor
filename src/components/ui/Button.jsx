import React, { forwardRef } from 'react';
import './Button.css';

const Button = forwardRef(({
    variant = 'primary',
    size = 'md',
    className = '',
    isLoading = false,
    disabled = false,
    startIcon,
    endIcon,
    children,
    ...props
}, ref) => {
    const classes = [
        'btn',
        `btn-${variant}`,
        `btn-${size}`,
        isLoading ? 'btn-loading' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            ref={ref}
            className={classes}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <span className="btn-loader" aria-hidden="true" />}
            <span className="btn-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {startIcon && <span className="btn-icon-start">{startIcon}</span>}
                {children}
                {endIcon && <span className="btn-icon-end">{endIcon}</span>}
            </span>
        </button>
    );
});

Button.displayName = 'Button';

export default Button;
