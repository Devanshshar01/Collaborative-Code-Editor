import React from 'react';
import './Badge.css';

const Badge = ({
    children,
    variant = 'soft', // soft, filled, outlined
    color = 'default', // primary, success, error, warning, info
    size = 'md',
    className = '',
    ...props
}) => {
    const classes = [
        'badge',
        `badge-${variant === 'filled' ? 'filled' : variant === 'outlined' ? 'outlined' : 'soft'}`,
        `badge-${color}`,
        `badge-${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classes} {...props}>
            {children}
        </span>
    );
};

export default Badge;
