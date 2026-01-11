import React, { useState, useRef, useEffect } from 'react';
import './Tooltip.css';

const Tooltip = ({
    content,
    children,
    placement = 'top',
    delay = 300,
    className = ''
}) => {
    const [visible, setVisible] = useState(false);
    const timeoutRef = useRef(null);

    const show = () => {
        timeoutRef.current = setTimeout(() => {
            setVisible(true);
        }, delay);
    };

    const hide = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setVisible(false);
    };

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <div
            className="tooltip-container"
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {content && (
                <div
                    className={`tooltip tooltip-${placement} ${visible ? 'visible' : ''} ${className}`}
                    role="tooltip"
                    aria-hidden={!visible}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

export default Tooltip;
