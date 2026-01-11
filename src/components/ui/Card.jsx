import React from 'react';
import './Card.css';

const Card = ({
    children,
    className = '',
    hoverable = false,
    onClick,
    ...props
}) => {
    const classes = [
        'card',
        hoverable ? 'card-hoverable' : '',
        onClick ? 'cursor-pointer' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classes}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export const CardHeader = ({ title, subtitle, children, className = '' }) => (
    <div className={`card-header ${className}`}>
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle">{subtitle}</p>}
        {children}
    </div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={`card-body ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`card-footer ${className}`}>
        {children}
    </div>
);

export const CardImage = ({ src, alt, className = '' }) => (
    <img src={src} alt={alt} className={`card-img ${className}`} />
);

export default Card;
