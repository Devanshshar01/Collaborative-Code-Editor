import React from 'react';
import './Skeleton.css';

const Skeleton = ({
    variant = 'text', // text, circle, rect
    width,
    height,
    className = '',
    ...props
}) => {
    const style = {
        width: width || (variant === 'text' ? '100%' : undefined),
        height: height || (variant === 'text' ? '1em' : undefined),
        ...props.style
    };

    const classes = [
        'skeleton',
        `skeleton-${variant}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classes} style={style} {...props} />
    );
};

export default Skeleton;
