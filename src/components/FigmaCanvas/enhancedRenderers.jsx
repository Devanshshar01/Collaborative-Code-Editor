/**
 * Enhanced Renderers - SVG renderers with gradients, shadows, blur
 * Supports all element types with advanced visual effects
 */

import React from 'react';
import { ElementType, FillType, BlendMode } from './whiteboardStore';

// ============ Utility Functions ============

const createGradientId = (elementId, type) => `gradient-${type}-${elementId}`;

const createFilterId = (elementId) => `filter-${elementId}`;

const rgbaToHex = (rgba) => {
    if (!rgba) return '#000000';
    if (rgba.startsWith('#')) return rgba;
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return rgba;
    const [, r, g, b] = match;
    return `#${parseInt(r).toString(16).padStart(2, '0')}${parseInt(g).toString(16).padStart(2, '0')}${parseInt(b).toString(16).padStart(2, '0')}`;
};

// ============ Gradient Definitions ============

const renderGradientDef = (element) => {
    const { fill, id } = element;
    if (!fill || fill.type === FillType.SOLID || fill.type === FillType.NONE) return null;
    
    const gradientId = createGradientId(id, fill.type);
    const stops = fill.stops || [
        { offset: 0, color: fill.color || '#000000', opacity: 1 },
        { offset: 1, color: fill.endColor || '#ffffff', opacity: 1 },
    ];
    
    if (fill.type === FillType.LINEAR_GRADIENT) {
        const angle = fill.angle || 0;
        const rad = (angle * Math.PI) / 180;
        const x1 = 50 - Math.cos(rad) * 50;
        const y1 = 50 - Math.sin(rad) * 50;
        const x2 = 50 + Math.cos(rad) * 50;
        const y2 = 50 + Math.sin(rad) * 50;
        
        return (
            <linearGradient
                key={gradientId}
                id={gradientId}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
            >
                {stops.map((stop, i) => (
                    <stop
                        key={i}
                        offset={`${stop.offset * 100}%`}
                        stopColor={stop.color}
                        stopOpacity={stop.opacity}
                    />
                ))}
            </linearGradient>
        );
    }
    
    if (fill.type === FillType.RADIAL_GRADIENT) {
        return (
            <radialGradient
                key={gradientId}
                id={gradientId}
                cx={`${fill.cx || 50}%`}
                cy={`${fill.cy || 50}%`}
                r={`${fill.r || 50}%`}
            >
                {stops.map((stop, i) => (
                    <stop
                        key={i}
                        offset={`${stop.offset * 100}%`}
                        stopColor={stop.color}
                        stopOpacity={stop.opacity}
                    />
                ))}
            </radialGradient>
        );
    }
    
    return null;
};

// ============ Filter Definitions ============

const renderFilterDef = (element) => {
    const { shadow, blur, id } = element;
    const hasShadow = shadow?.enabled;
    const hasBlur = blur?.enabled && blur.amount > 0;
    
    if (!hasShadow && !hasBlur) return null;
    
    const filterId = createFilterId(id);
    
    return (
        <filter key={filterId} id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            {hasBlur && blur.type === 'layer' && (
                <feGaussianBlur in="SourceGraphic" stdDeviation={blur.amount} result="blur" />
            )}
            {hasBlur && blur.type === 'background' && (
                <feGaussianBlur in="BackgroundImage" stdDeviation={blur.amount} result="blur" />
            )}
            {hasShadow && shadow.type === 'drop' && (
                <>
                    <feDropShadow
                        dx={shadow.offsetX}
                        dy={shadow.offsetY}
                        stdDeviation={shadow.blur / 2}
                        floodColor={shadow.color}
                    />
                </>
            )}
            {hasShadow && shadow.type === 'inner' && (
                <>
                    <feOffset dx={shadow.offsetX} dy={shadow.offsetY} />
                    <feGaussianBlur stdDeviation={shadow.blur / 2} result="shadow" />
                    <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
                    <feFlood floodColor={shadow.color} result="shadowColor" />
                    <feComposite in="shadowColor" in2="shadowDiff" operator="in" result="shadow" />
                    <feComposite in="shadow" in2="SourceGraphic" operator="over" result="final" />
                </>
            )}
        </filter>
    );
};

// ============ Fill Helpers ============

const getFillValue = (element) => {
    const { fill, id } = element;
    if (!fill || fill.type === FillType.NONE) return 'none';
    if (fill.type === FillType.SOLID) return fill.color;
    return `url(#${createGradientId(id, fill.type)})`;
};

const getFilterValue = (element) => {
    const { shadow, blur, id } = element;
    const hasShadow = shadow?.enabled;
    const hasBlur = blur?.enabled && blur.amount > 0;
    if (!hasShadow && !hasBlur) return 'none';
    return `url(#${createFilterId(id)})`;
};

const getStrokeDasharray = (stroke) => {
    if (!stroke) return 'none';
    switch (stroke.style) {
        case 'dashed': return `${stroke.width * 4} ${stroke.width * 2}`;
        case 'dotted': return `${stroke.width} ${stroke.width}`;
        default: return 'none';
    }
};

// ============ Element Renderers ============

const renderRectangle = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, cornerRadius, stroke, blendMode } = element;
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={cornerRadius}
                ry={cornerRadius}
                fill={getFillValue(element)}
                fillOpacity={element.fill?.opacity}
                stroke={stroke?.width > 0 ? stroke.color : 'none'}
                strokeWidth={stroke?.width}
                strokeDasharray={getStrokeDasharray(stroke)}
                strokeLinecap={stroke?.cap}
                strokeLinejoin={stroke?.join}
                filter={getFilterValue(element)}
            />
            {isHovered && !isSelected && (
                <rect
                    x={x - 1}
                    y={y - 1}
                    width={width + 2}
                    height={height + 2}
                    rx={cornerRadius}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderEllipse = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, stroke, blendMode } = element;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill={getFillValue(element)}
                fillOpacity={element.fill?.opacity}
                stroke={stroke?.width > 0 ? stroke.color : 'none'}
                strokeWidth={stroke?.width}
                strokeDasharray={getStrokeDasharray(stroke)}
                filter={getFilterValue(element)}
            />
            {isHovered && !isSelected && (
                <ellipse
                    cx={cx}
                    cy={cy}
                    rx={rx + 1}
                    ry={ry + 1}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderLine = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, stroke, blendMode, endMarker, startMarker } = element;
    const x1 = x;
    const y1 = y;
    const x2 = x + width;
    const y2 = y + height;
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderFilterDef(element)}
            <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={stroke?.color || '#000000'}
                strokeWidth={stroke?.width || 2}
                strokeDasharray={getStrokeDasharray(stroke)}
                strokeLinecap={stroke?.cap || 'round'}
                markerEnd={endMarker === 'arrow' ? 'url(#arrow-end)' : undefined}
                markerStart={startMarker === 'arrow' ? 'url(#arrow-end)' : undefined}
                filter={getFilterValue(element)}
            />
            {isHovered && !isSelected && (
                <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#0d99ff"
                    strokeWidth={(stroke?.width || 2) + 4}
                    strokeLinecap="round"
                    opacity={0.3}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderPath = (element, isSelected, isHovered) => {
    const { points, rotation, opacity, stroke, fill, blendMode, closed, x = 0, y = 0 } = element;
    if (!points || points.length < 2) return null;
    
    const pathData = points.map((p, i) => 
        `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
    ).join(' ') + (closed ? ' Z' : '');
    
    const bounds = points.reduce((acc, p) => ({
        minX: Math.min(acc.minX, p.x),
        minY: Math.min(acc.minY, p.y),
        maxX: Math.max(acc.maxX, p.x),
        maxY: Math.max(acc.maxY, p.y),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    return (
        <g
            transform={`translate(${x}, ${y})${rotation ? ` rotate(${rotation} ${centerX} ${centerY})` : ''}`}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            <path
                d={pathData}
                fill={closed ? getFillValue(element) : 'none'}
                fillOpacity={fill?.opacity}
                stroke={stroke?.color || '#000000'}
                strokeWidth={stroke?.width || 2}
                strokeDasharray={getStrokeDasharray(stroke)}
                strokeLinecap={stroke?.cap || 'round'}
                strokeLinejoin={stroke?.join || 'round'}
                filter={getFilterValue(element)}
            />
            {isHovered && !isSelected && (
                <path
                    d={pathData}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={(stroke?.width || 2) + 4}
                    strokeLinecap="round"
                    opacity={0.3}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderBezier = (element, isSelected, isHovered) => {
    const { points, rotation, opacity, stroke, fill, blendMode, closed, x = 0, y = 0 } = element;
    if (!points || points.length < 2) return null;
    
    // Generate smooth bezier curve
    let pathData = `M ${points[0].x},${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
        const p0 = points[i - 1];
        const p1 = points[i];
        const cp1 = p0.handleOut || { x: p0.x + (p1.x - p0.x) / 3, y: p0.y };
        const cp2 = p1.handleIn || { x: p1.x - (p1.x - p0.x) / 3, y: p1.y };
        pathData += ` C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${p1.x},${p1.y}`;
    }
    
    if (closed) pathData += ' Z';
    
    const bounds = points.reduce((acc, p) => ({
        minX: Math.min(acc.minX, p.x),
        minY: Math.min(acc.minY, p.y),
        maxX: Math.max(acc.maxX, p.x),
        maxY: Math.max(acc.maxY, p.y),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    return (
        <g
            transform={`translate(${x}, ${y})${rotation ? ` rotate(${rotation} ${(bounds.minX + bounds.maxX) / 2} ${(bounds.minY + bounds.maxY) / 2})` : ''}`}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            <path
                d={pathData}
                fill={closed ? getFillValue(element) : 'none'}
                fillOpacity={fill?.opacity}
                stroke={stroke?.color || '#000000'}
                strokeWidth={stroke?.width || 2}
                strokeDasharray={getStrokeDasharray(stroke)}
                strokeLinecap={stroke?.cap || 'round'}
                strokeLinejoin={stroke?.join || 'round'}
                filter={getFilterValue(element)}
            />
        </g>
    );
};

const renderPolygon = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, stroke, blendMode, sides = 6 } = element;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    
    const points = [];
    for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        points.push(`${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`);
    }
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            <polygon
                points={points.join(' ')}
                fill={getFillValue(element)}
                fillOpacity={element.fill?.opacity}
                stroke={stroke?.width > 0 ? stroke.color : 'none'}
                strokeWidth={stroke?.width}
                strokeDasharray={getStrokeDasharray(stroke)}
                strokeLinejoin={stroke?.join || 'round'}
                filter={getFilterValue(element)}
            />
        </g>
    );
};

const renderStar = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, stroke, blendMode, points: numPoints = 5, innerRadius, outerRadius } = element;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const or = outerRadius || width / 2;
    const ir = innerRadius || or * 0.4;
    
    const pointsArr = [];
    for (let i = 0; i < numPoints * 2; i++) {
        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
        const r = i % 2 === 0 ? or : ir;
        pointsArr.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            <polygon
                points={pointsArr.join(' ')}
                fill={getFillValue(element)}
                fillOpacity={element.fill?.opacity}
                stroke={stroke?.width > 0 ? stroke.color : 'none'}
                strokeWidth={stroke?.width}
                strokeDasharray={getStrokeDasharray(stroke)}
                strokeLinejoin={stroke?.join || 'round'}
                filter={getFilterValue(element)}
            />
        </g>
    );
};

const renderText = (element, isSelected, isHovered) => {
    const { 
        x, y, width, height, rotation, opacity, blendMode,
        text, fontFamily, fontSize, fontWeight, fontStyle,
        textDecoration, textAlign, verticalAlign, lineHeight, letterSpacing, fill
    } = element;
    
    const lines = (text || '').split('\n');
    const lineHeightPx = fontSize * (lineHeight || 1.4);
    
    const getY = (index) => {
        let baseY = y;
        if (verticalAlign === 'middle') {
            baseY = y + (height - lines.length * lineHeightPx) / 2;
        } else if (verticalAlign === 'bottom') {
            baseY = y + height - lines.length * lineHeightPx;
        }
        return baseY + fontSize + index * lineHeightPx;
    };
    
    const getX = () => {
        if (textAlign === 'center') return x + width / 2;
        if (textAlign === 'right') return x + width;
        return x;
    };
    
    const getAnchor = () => {
        if (textAlign === 'center') return 'middle';
        if (textAlign === 'right') return 'end';
        return 'start';
    };
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderGradientDef(element)}
            {renderFilterDef(element)}
            {lines.map((line, i) => (
                <text
                    key={i}
                    x={getX()}
                    y={getY(i)}
                    fontFamily={fontFamily}
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    fontStyle={fontStyle}
                    textDecoration={textDecoration}
                    textAnchor={getAnchor()}
                    letterSpacing={letterSpacing}
                    fill={fill?.color || '#000000'}
                    fillOpacity={fill?.opacity}
                    filter={getFilterValue(element)}
                >
                    {line}
                </text>
            ))}
            {isHovered && !isSelected && (
                <rect
                    x={x - 2}
                    y={y - 2}
                    width={width + 4}
                    height={height + 4}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderImage = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, blendMode, src, fit, cornerRadius } = element;
    
    const clipPathId = `clip-${element.id}`;
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})` : undefined}
            opacity={opacity}
            style={{ mixBlendMode: blendMode !== BlendMode.NORMAL ? blendMode : undefined }}
        >
            {renderFilterDef(element)}
            {cornerRadius > 0 && (
                <defs>
                    <clipPath id={clipPathId}>
                        <rect x={x} y={y} width={width} height={height} rx={cornerRadius} ry={cornerRadius} />
                    </clipPath>
                </defs>
            )}
            <image
                x={x}
                y={y}
                width={width}
                height={height}
                href={src}
                preserveAspectRatio={fit === 'cover' ? 'xMidYMid slice' : fit === 'contain' ? 'xMidYMid meet' : 'none'}
                clipPath={cornerRadius > 0 ? `url(#${clipPathId})` : undefined}
                filter={getFilterValue(element)}
            />
            {isHovered && !isSelected && (
                <rect
                    x={x - 1}
                    y={y - 1}
                    width={width + 2}
                    height={height + 2}
                    rx={cornerRadius}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderFrame = (element, isSelected, isHovered) => {
    const { x, y, width, height, rotation, opacity, stroke, cornerRadius, name } = element;
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${x + width / 2} ${y + height / 2})` : undefined}
            opacity={opacity}
        >
            {/* Frame name label */}
            <text
                x={x}
                y={y - 8}
                fontSize={11}
                fill="#999"
                fontFamily="Inter, sans-serif"
            >
                {name}
            </text>
            {/* Frame background */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={cornerRadius}
                ry={cornerRadius}
                fill={getFillValue(element)}
                fillOpacity={element.fill?.opacity}
                stroke={stroke?.width > 0 ? stroke.color : '#333'}
                strokeWidth={stroke?.width || 1}
            />
            {isHovered && !isSelected && (
                <rect
                    x={x - 1}
                    y={y - 1}
                    width={width + 2}
                    height={height + 2}
                    rx={cornerRadius}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

const renderConnector = (element, isSelected, isHovered) => {
    const { x, y, width, height, stroke, endMarker, startMarker, waypoints = [], routingMode } = element;
    
    let pathData;
    if (waypoints.length > 0) {
        pathData = `M ${x},${y} ${waypoints.map(p => `L ${p.x},${p.y}`).join(' ')} L ${x + width},${y + height}`;
    } else if (routingMode === 'orthogonal') {
        const midX = x + width / 2;
        pathData = `M ${x},${y} L ${midX},${y} L ${midX},${y + height} L ${x + width},${y + height}`;
    } else {
        pathData = `M ${x},${y} L ${x + width},${y + height}`;
    }
    
    return (
        <g>
            <path
                d={pathData}
                fill="none"
                stroke={stroke?.color || '#000000'}
                strokeWidth={stroke?.width || 2}
                strokeLinecap={stroke?.cap || 'round'}
                markerEnd={endMarker === 'arrow' ? 'url(#arrow-end)' : undefined}
                markerStart={startMarker === 'arrow' ? 'url(#arrow-end)' : undefined}
            />
            {isHovered && !isSelected && (
                <path
                    d={pathData}
                    fill="none"
                    stroke="#0d99ff"
                    strokeWidth={(stroke?.width || 2) + 4}
                    strokeLinecap="round"
                    opacity={0.3}
                    style={{ pointerEvents: 'none' }}
                />
            )}
        </g>
    );
};

// ============ Main Element Renderer ============

export const renderElement = (element, isSelected, isHovered) => {
    if (!element.visible) return null;
    
    const renderers = {
        [ElementType.RECTANGLE]: renderRectangle,
        [ElementType.ELLIPSE]: renderEllipse,
        [ElementType.LINE]: renderLine,
        [ElementType.ARROW]: renderLine,
        [ElementType.PATH]: renderPath,
        [ElementType.BEZIER]: renderBezier,
        [ElementType.POLYGON]: renderPolygon,
        [ElementType.STAR]: renderStar,
        [ElementType.TEXT]: renderText,
        [ElementType.IMAGE]: renderImage,
        [ElementType.FRAME]: renderFrame,
        [ElementType.CONNECTOR]: renderConnector,
    };
    
    const renderer = renderers[element.type];
    if (!renderer) return null;
    
    return renderer(element, isSelected, isHovered);
};

// ============ Canvas Helpers ============

export const renderGrid = (zoom, panX, panY, width, height) => {
    const gridSize = 20;
    const minorGridSize = gridSize;
    const majorGridSize = gridSize * 5;
    
    const startX = Math.floor(-panX / zoom / minorGridSize) * minorGridSize;
    const startY = Math.floor(-panY / zoom / minorGridSize) * minorGridSize;
    const endX = startX + (width / zoom) + minorGridSize * 2;
    const endY = startY + (height / zoom) + minorGridSize * 2;
    
    const lines = [];
    
    // Minor grid lines
    for (let x = startX; x <= endX; x += minorGridSize) {
        const isMajor = x % majorGridSize === 0;
        lines.push(
            <line
                key={`v-${x}`}
                x1={x}
                y1={startY}
                x2={x}
                y2={endY}
                stroke={isMajor ? '#444' : '#333'}
                strokeWidth={1 / zoom}
            />
        );
    }
    
    for (let y = startY; y <= endY; y += minorGridSize) {
        const isMajor = y % majorGridSize === 0;
        lines.push(
            <line
                key={`h-${y}`}
                x1={startX}
                y1={y}
                x2={endX}
                y2={y}
                stroke={isMajor ? '#444' : '#333'}
                strokeWidth={1 / zoom}
            />
        );
    }
    
    return <g className="grid">{lines}</g>;
};

export const renderGuides = (guides) => {
    if (!guides || guides.length === 0) return null;
    
    return (
        <g className="guides">
            {guides.map(guide => (
                <line
                    key={guide.id}
                    x1={guide.orientation === 'horizontal' ? -10000 : guide.position}
                    y1={guide.orientation === 'horizontal' ? guide.position : -10000}
                    x2={guide.orientation === 'horizontal' ? 10000 : guide.position}
                    y2={guide.orientation === 'horizontal' ? guide.position : 10000}
                    stroke="#ff00ff"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                />
            ))}
        </g>
    );
};

export const renderSelectionBox = (box) => {
    const x = Math.min(box.startX, box.endX);
    const y = Math.min(box.startY, box.endY);
    const width = Math.abs(box.endX - box.startX);
    const height = Math.abs(box.endY - box.startY);
    
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="rgba(13, 153, 255, 0.1)"
            stroke="#0d99ff"
            strokeWidth={1}
            strokeDasharray="4,4"
        />
    );
};

export const renderTransformHandles = (bounds, zoom) => {
    if (!bounds) return null;
    
    const handleSize = 8 / zoom;
    const { x, y, width, height } = bounds;
    
    const handles = [
        { key: 'nw', x: x, y: y },
        { key: 'n', x: x + width / 2, y: y },
        { key: 'ne', x: x + width, y: y },
        { key: 'e', x: x + width, y: y + height / 2 },
        { key: 'se', x: x + width, y: y + height },
        { key: 's', x: x + width / 2, y: y + height },
        { key: 'sw', x: x, y: y + height },
        { key: 'w', x: x, y: y + height / 2 },
    ];
    
    return (
        <g className="transform-handles">
            {/* Selection border */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                fill="none"
                stroke="#0d99ff"
                strokeWidth={2 / zoom}
            />
            
            {/* Rotation handle */}
            <line
                x1={x + width / 2}
                y1={y}
                x2={x + width / 2}
                y2={y - 30 / zoom}
                stroke="#0d99ff"
                strokeWidth={1 / zoom}
            />
            <circle
                cx={x + width / 2}
                cy={y - 30 / zoom}
                r={handleSize / 2}
                fill="#fff"
                stroke="#0d99ff"
                strokeWidth={2 / zoom}
            />
            
            {/* Resize handles */}
            {handles.map(handle => (
                <rect
                    key={handle.key}
                    x={handle.x - handleSize / 2}
                    y={handle.y - handleSize / 2}
                    width={handleSize}
                    height={handleSize}
                    fill="#fff"
                    stroke="#0d99ff"
                    strokeWidth={2 / zoom}
                />
            ))}
        </g>
    );
};

export const renderSnapGuides = (guides, zoom) => {
    if (!guides) return null;
    
    const lines = [];
    
    guides.x?.forEach((x, i) => {
        lines.push(
            <line
                key={`snap-x-${i}`}
                x1={x}
                y1={-10000}
                x2={x}
                y2={10000}
                stroke="#ff00ff"
                strokeWidth={1 / zoom}
                strokeDasharray={`${4 / zoom},${4 / zoom}`}
            />
        );
    });
    
    guides.y?.forEach((y, i) => {
        lines.push(
            <line
                key={`snap-y-${i}`}
                x1={-10000}
                y1={y}
                x2={10000}
                y2={y}
                stroke="#ff00ff"
                strokeWidth={1 / zoom}
                strokeDasharray={`${4 / zoom},${4 / zoom}`}
            />
        );
    });
    
    return <g className="snap-guides">{lines}</g>;
};

export const renderMeasurements = (bounds, zoom) => {
    if (!bounds) return null;
    
    const { x, y, width, height } = bounds;
    const fontSize = 10 / zoom;
    const offset = 20 / zoom;
    
    return (
        <g className="measurements">
            {/* Width measurement */}
            <text
                x={x + width / 2}
                y={y - offset}
                textAnchor="middle"
                fontSize={fontSize}
                fill="#ff00ff"
            >
                {Math.round(width)}
            </text>
            
            {/* Height measurement */}
            <text
                x={x + width + offset}
                y={y + height / 2}
                textAnchor="start"
                fontSize={fontSize}
                fill="#ff00ff"
                transform={`rotate(90 ${x + width + offset} ${y + height / 2})`}
            >
                {Math.round(height)}
            </text>
        </g>
    );
};

export const renderRemoteCursors = (cursors, currentUserId) => {
    if (!cursors || Object.keys(cursors).length === 0) return null;
    
    return (
        <g className="remote-cursors">
            {Object.entries(cursors).map(([userId, cursor]) => {
                if (userId === currentUserId) return null;
                
                return (
                    <g key={userId} transform={`translate(${cursor.x}, ${cursor.y})`}>
                        {/* Cursor arrow */}
                        <path
                            d="M 0 0 L 0 14 L 4 11 L 7 18 L 9 17 L 6 10 L 11 10 Z"
                            fill={cursor.color || '#ff00ff'}
                            stroke="#fff"
                            strokeWidth={1}
                        />
                        {/* User name label */}
                        <rect
                            x={12}
                            y={10}
                            width={cursor.name?.length * 7 + 8 || 50}
                            height={18}
                            rx={4}
                            fill={cursor.color || '#ff00ff'}
                        />
                        <text
                            x={16}
                            y={23}
                            fontSize={11}
                            fill="#fff"
                            fontFamily="Inter, sans-serif"
                        >
                            {cursor.name || 'Anonymous'}
                        </text>
                    </g>
                );
            })}
        </g>
    );
};

export default renderElement;
