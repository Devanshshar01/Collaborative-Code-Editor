/**
 * Supporting Components
 * Grid, Rulers, Guides, Selection Box, Transform Handles, etc.
 */

import React from 'react';

// Grid component
export const Grid = ({ zoom }) => {
    const gridSize = 10;
    const majorGridSize = 100;
    
    return (
        <g className="figma-grid">
            <defs>
                <pattern
                    id="smallGrid"
                    width={gridSize}
                    height={gridSize}
                    patternUnits="userSpaceOnUse"
                >
                    <path
                        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="0.5"
                    />
                </pattern>
                <pattern
                    id="grid"
                    width={majorGridSize}
                    height={majorGridSize}
                    patternUnits="userSpaceOnUse"
                >
                    <rect width={majorGridSize} height={majorGridSize} fill="url(#smallGrid)" />
                    <path
                        d={`M ${majorGridSize} 0 L 0 0 0 ${majorGridSize}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                    />
                </pattern>
            </defs>
            <rect
                x="-10000"
                y="-10000"
                width="20000"
                height="20000"
                fill="url(#grid)"
            />
        </g>
    );
};

// Rulers component
export const Rulers = ({ zoom, pan }) => {
    const rulerSize = 20;
    const tickInterval = 50;
    const majorTickInterval = 100;
    
    // Generate horizontal ruler ticks
    const hTicks = [];
    for (let x = 0; x < 5000; x += tickInterval) {
        const isMajor = x % majorTickInterval === 0;
        hTicks.push(
            <g key={`h-${x}`}>
                <line
                    x1={(x * zoom) + pan.x}
                    y1={isMajor ? 8 : 14}
                    x2={(x * zoom) + pan.x}
                    y2={rulerSize}
                    stroke="#666"
                    strokeWidth="1"
                />
                {isMajor && (
                    <text
                        x={(x * zoom) + pan.x + 2}
                        y={12}
                        fontSize="9"
                        fill="#999"
                    >
                        {x}
                    </text>
                )}
            </g>
        );
    }
    
    // Generate vertical ruler ticks
    const vTicks = [];
    for (let y = 0; y < 5000; y += tickInterval) {
        const isMajor = y % majorTickInterval === 0;
        vTicks.push(
            <g key={`v-${y}`}>
                <line
                    x1={isMajor ? 8 : 14}
                    y1={(y * zoom) + pan.y}
                    x2={rulerSize}
                    y2={(y * zoom) + pan.y}
                    stroke="#666"
                    strokeWidth="1"
                />
                {isMajor && (
                    <text
                        x={4}
                        y={(y * zoom) + pan.y + 3}
                        fontSize="9"
                        fill="#999"
                        transform={`rotate(-90, 4, ${(y * zoom) + pan.y})`}
                    >
                        {y}
                    </text>
                )}
            </g>
        );
    }
    
    return (
        <>
            {/* Horizontal ruler */}
            <div className="figma-ruler figma-ruler-h">
                <svg width="100%" height={rulerSize}>
                    <rect width="100%" height="100%" fill="#2c2c2c" />
                    {hTicks}
                </svg>
            </div>
            
            {/* Vertical ruler */}
            <div className="figma-ruler figma-ruler-v">
                <svg width={rulerSize} height="100%">
                    <rect width="100%" height="100%" fill="#2c2c2c" />
                    {vTicks}
                </svg>
            </div>
            
            {/* Corner */}
            <div className="figma-ruler-corner">
                <svg width={rulerSize} height={rulerSize}>
                    <rect width="100%" height="100%" fill="#2c2c2c" />
                </svg>
            </div>
        </>
    );
};

// Guides component
export const Guides = ({ guides }) => {
    return (
        <g className="figma-guides">
            {guides.map(guide => (
                <line
                    key={guide.id}
                    x1={guide.orientation === 'horizontal' ? -10000 : guide.position}
                    y1={guide.orientation === 'horizontal' ? guide.position : -10000}
                    x2={guide.orientation === 'horizontal' ? 10000 : guide.position}
                    y2={guide.orientation === 'horizontal' ? guide.position : 10000}
                    stroke="#f0f"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                />
            ))}
        </g>
    );
};

// Selection box component
export const SelectionBox = ({ box, zoom }) => {
    return (
        <rect
            x={box.x}
            y={box.y}
            width={box.width}
            height={box.height}
            fill="rgba(0, 149, 255, 0.1)"
            stroke="#0095ff"
            strokeWidth={1 / zoom}
            strokeDasharray={`${4 / zoom},${4 / zoom}`}
        />
    );
};

// Transform handles component
export const TransformHandles = ({ element, zoom, onTransformStart, onTransform, onTransformEnd }) => {
    const { x, y, width, height, rotation } = element;
    const handleSize = 8 / zoom;
    const rotateHandleDistance = 20 / zoom;
    
    // Handle positions
    const handles = [
        { id: 'nw', x: x, y: y, cursor: 'nwse-resize' },
        { id: 'n', x: x + width / 2, y: y, cursor: 'ns-resize' },
        { id: 'ne', x: x + width, y: y, cursor: 'nesw-resize' },
        { id: 'e', x: x + width, y: y + height / 2, cursor: 'ew-resize' },
        { id: 'se', x: x + width, y: y + height, cursor: 'nwse-resize' },
        { id: 's', x: x + width / 2, y: y + height, cursor: 'ns-resize' },
        { id: 'sw', x: x, y: y + height, cursor: 'nesw-resize' },
        { id: 'w', x: x, y: y + height / 2, cursor: 'ew-resize' },
    ];
    
    return (
        <g 
            className="figma-transform-handles"
            transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
        >
            {/* Selection outline */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="none"
                stroke="#0d99ff"
                strokeWidth={2 / zoom}
                pointerEvents="none"
            />
            
            {/* Resize handles */}
            {handles.map(handle => (
                <rect
                    key={handle.id}
                    x={handle.x - handleSize / 2}
                    y={handle.y - handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    fill="white"
                    stroke="#0d99ff"
                    strokeWidth={1 / zoom}
                    style={{ cursor: handle.cursor }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onTransformStart?.(handle.id);
                    }}
                />
            ))}
            
            {/* Rotation handle */}
            <g>
                <line
                    x1={x + width / 2}
                    y1={y}
                    x2={x + width / 2}
                    y2={y - rotateHandleDistance}
                    stroke="#0d99ff"
                    strokeWidth={1 / zoom}
                />
                <circle
                    cx={x + width / 2}
                    cy={y - rotateHandleDistance}
                    r={handleSize / 2}
                    fill="white"
                    stroke="#0d99ff"
                    strokeWidth={1 / zoom}
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onTransformStart?.('rotate');
                    }}
                />
            </g>
            
            {/* Size label */}
            <text
                x={x + width / 2}
                y={y + height + 20 / zoom}
                fontSize={11 / zoom}
                fill="#0d99ff"
                textAnchor="middle"
                pointerEvents="none"
            >
                {Math.round(width)} × {Math.round(height)}
            </text>
        </g>
    );
};

// Cursor overlay for collaborative cursors
export const CursorOverlay = ({ cursors, zoom, pan }) => {
    return (
        <div className="figma-cursor-overlay">
            {cursors.map(cursor => (
                <div
                    key={cursor.id}
                    className="figma-cursor"
                    style={{
                        left: cursor.x * zoom + pan.x,
                        top: cursor.y * zoom + pan.y,
                        '--cursor-color': cursor.color || '#f0f',
                    }}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5 3l14 9-6.5 1.5L11 20l-1.5-5.5L3 13l2-10z"/>
                    </svg>
                    <span className="figma-cursor-name">{cursor.name}</span>
                </div>
            ))}
        </div>
    );
};

export default {
    Grid,
    Rulers,
    Guides,
    SelectionBox,
    TransformHandles,
    CursorOverlay,
};
