import React from 'react';
import './Avatar.css';

const Avatar = ({
    src,
    alt,
    fallback,
    size = 'md',
    status,
    color,
    className = '',
    ...props
}) => {
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    const backgroundColor = color || `hsl(${Math.random() * 360}, 70%, 50%)`;

    return (
        <div
            className={`avatar avatar-${size} ${className}`}
            style={{ backgroundColor: !src ? backgroundColor : undefined }}
            {...props}
        >
            {src ? (
                <img src={src} alt={alt} className="avatar-img" />
            ) : (
                <span>{fallback || (alt ? getInitials(alt) : '??')}</span>
            )}

            {status && (
                <span className={`status-indicator status-${status}`} />
            )}
        </div>
    );
};

export const AvatarGroup = ({ children, max = 5, className = '' }) => {
    const total = React.Children.count(children);
    const visible = React.Children.toArray(children).slice(0, max);
    const remaining = total - max;

    return (
        <div className={`avatar-group ${className}`}>
            {visible}
            {remaining > 0 && (
                <div className="avatar avatar-md" style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text-primary)' }}>
                    +{remaining}
                </div>
            )}
        </div>
    );
};

export default Avatar;
