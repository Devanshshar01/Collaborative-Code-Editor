/**
 * Element Renderers
 * SVG rendering functions for each element type
 */

import React from 'react';
import { ElementType } from './store';

// Helper to convert fill to SVG
const getFill = (fill) => {
    if (!fill || fill.type === 'none') return 'none';
    if (fill.type === 'solid') return fill.color || '#D9D9D9';
    // Gradients could be handled here
    return fill.color || '#D9D9D9';
};

// Helper to get stroke props
const getStrokeProps = (stroke) => {
    if (!stroke || stroke.width === 0) return {};
    return {
        stroke: stroke.color || '#000000',
        strokeWidth: stroke.width || 1,
        strokeDasharray: stroke.style === 'dashed' ? '8,4' : 
                         stroke.style === 'dotted' ? '2,2' : undefined,
    };
};

// Rectangle renderer
export const RectangleRenderer = ({ element }) => {
    const { x, y, width, height, cornerRadius, fill, stroke, rotation, opacity } = element;
    
    return (
        <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={cornerRadius || 0}
            ry={cornerRadius || 0}
            fill={getFill(fill)}
            fillOpacity={fill?.opacity ?? 1}
            {...getStrokeProps(stroke)}
            transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
            style={{ opacity }}
        />
    );
};

// Ellipse renderer
export const EllipseRenderer = ({ element }) => {
    const { x, y, width, height, fill, stroke, rotation, opacity } = element;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    
    return (
        <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill={getFill(fill)}
            fillOpacity={fill?.opacity ?? 1}
            {...getStrokeProps(stroke)}
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            style={{ opacity }}
        />
    );
};

// Frame renderer (rectangle with clipping)
export const FrameRenderer = ({ element }) => {
    const { id, x, y, width, height, cornerRadius, fill, stroke, rotation, opacity, children } = element;
    
    return (
        <g 
            transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
            style={{ opacity }}
        >
            <defs>
                <clipPath id={`clip-${id}`}>
                    <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        rx={cornerRadius || 0}
                    />
                </clipPath>
            </defs>
            
            {/* Frame background */}
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                rx={cornerRadius || 0}
                fill={getFill(fill)}
                {...getStrokeProps(stroke)}
            />
            
            {/* Frame name label */}
            <text
                x={x}
                y={y - 8}
                className="figma-frame-label"
                fontSize="11"
                fill="#999"
            >
                {element.name}
            </text>
            
            {/* Children (clipped) */}
            {children && (
                <g clipPath={`url(#clip-${id})`}>
                    {children.map(child => renderElement({
                        ...child,
                        x: x + child.x,
                        y: y + child.y,
                    }))}
                </g>
            )}
        </g>
    );
};

// Line renderer
export const LineRenderer = ({ element }) => {
    const { x, y, width, height, stroke, rotation, opacity } = element;
    
    return (
        <line
            x1={x}
            y1={y}
            x2={x + width}
            y2={y + height}
            {...getStrokeProps({ ...stroke, width: stroke?.width || 2 })}
            transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
            style={{ opacity }}
        />
    );
};

// Arrow renderer
export const ArrowRenderer = ({ element }) => {
    const { x, y, width, height, stroke, rotation, opacity } = element;
    const strokeColor = stroke?.color || '#000000';
    const strokeWidth = stroke?.width || 2;
    
    // Arrow head
    const arrowSize = 10;
    const angle = Math.atan2(height, width);
    const x2 = x + width;
    const y2 = y + height;
    
    return (
        <g
            transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
            style={{ opacity }}
        >
            <line
                x1={x}
                y1={y}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
            />
            {/* Arrow head */}
            <polygon
                points={`
                    ${x2},${y2}
                    ${x2 - arrowSize * Math.cos(angle - Math.PI/6)},${y2 - arrowSize * Math.sin(angle - Math.PI/6)}
                    ${x2 - arrowSize * Math.cos(angle + Math.PI/6)},${y2 - arrowSize * Math.sin(angle + Math.PI/6)}
                `}
                fill={strokeColor}
            />
        </g>
    );
};

// Polygon renderer
export const PolygonRenderer = ({ element }) => {
    const { x, y, width, height, fill, stroke, rotation, opacity, sides = 3 } = element;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;
    
    // Generate polygon points
    const points = Array.from({ length: sides }, (_, i) => {
        const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
        return `${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`;
    }).join(' ');
    
    return (
        <polygon
            points={points}
            fill={getFill(fill)}
            fillOpacity={fill?.opacity ?? 1}
            {...getStrokeProps(stroke)}
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            style={{ opacity }}
        />
    );
};

// Star renderer
export const StarRenderer = ({ element }) => {
    const { x, y, width, height, fill, stroke, rotation, opacity, points: numPoints = 5, innerRadius = 0.4 } = element;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outerRx = width / 2;
    const outerRy = height / 2;
    const innerRx = outerRx * innerRadius;
    const innerRy = outerRy * innerRadius;
    
    // Generate star points
    const points = Array.from({ length: numPoints * 2 }, (_, i) => {
        const angle = (i * Math.PI / numPoints) - Math.PI / 2;
        const isOuter = i % 2 === 0;
        const rx = isOuter ? outerRx : innerRx;
        const ry = isOuter ? outerRy : innerRy;
        return `${cx + rx * Math.cos(angle)},${cy + ry * Math.sin(angle)}`;
    }).join(' ');
    
    return (
        <polygon
            points={points}
            fill={getFill(fill)}
            fillOpacity={fill?.opacity ?? 1}
            {...getStrokeProps(stroke)}
            transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}
            style={{ opacity }}
        />
    );
};

// Path renderer
export const PathRenderer = ({ element }) => {
    const { x, y, points, fill, stroke, rotation, opacity } = element;
    
    if (!points || points.length < 2) return null;
    
    // Convert points to SVG path
    const d = points.map((point, i) => 
        `${i === 0 ? 'M' : 'L'} ${x + point.x} ${y + point.y}`
    ).join(' ');
    
    return (
        <path
            d={d}
            fill={getFill(fill)}
            {...getStrokeProps({ ...stroke, width: stroke?.width || 2 })}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={rotation ? `rotate(${rotation} ${x} ${y})` : undefined}
            style={{ opacity }}
        />
    );
};

// Text renderer
export const TextRenderer = ({ element }) => {
    const { 
        x, y, width, height, 
        text, fontSize, fontFamily, fontWeight, textAlign, lineHeight,
        fill, stroke, rotation, opacity 
    } = element;
    
    const textAnchor = textAlign === 'center' ? 'middle' : 
                       textAlign === 'right' ? 'end' : 'start';
    const textX = textAlign === 'center' ? x + width / 2 :
                  textAlign === 'right' ? x + width : x;
    
    return (
        <text
            x={textX}
            y={y + (fontSize || 16)}
            width={width}
            fontSize={fontSize || 16}
            fontFamily={fontFamily || 'Inter, sans-serif'}
            fontWeight={fontWeight || 400}
            textAnchor={textAnchor}
            fill={getFill(fill)}
            {...getStrokeProps(stroke)}
            transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
            style={{ opacity, lineHeight: lineHeight || 1.2 }}
        >
            {text || 'Text'}
        </text>
    );
};

// Image renderer
export const ImageRenderer = ({ element }) => {
    const { x, y, width, height, src, rotation, opacity, cornerRadius } = element;
    
    return (
        <g>
            {cornerRadius ? (
                <>
                    <defs>
                        <clipPath id={`img-clip-${element.id}`}>
                            <rect x={x} y={y} width={width} height={height} rx={cornerRadius} />
                        </clipPath>
                    </defs>
                    <image
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        href={src}
                        clipPath={`url(#img-clip-${element.id})`}
                        transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
                        style={{ opacity }}
                        preserveAspectRatio="xMidYMid slice"
                    />
                </>
            ) : (
                <image
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    href={src}
                    transform={rotation ? `rotate(${rotation} ${x + width/2} ${y + height/2})` : undefined}
                    style={{ opacity }}
                    preserveAspectRatio="xMidYMid slice"
                />
            )}
        </g>
    );
};

// Group renderer
export const GroupRenderer = ({ element }) => {
    const { x, y, rotation, opacity, children } = element;
    
    return (
        <g
            transform={`translate(${x}, ${y})${rotation ? ` rotate(${rotation})` : ''}`}
            style={{ opacity }}
        >
            {children && children.map(child => renderElement(child))}
        </g>
    );
};

// Main render function
export const renderElement = (element) => {
    if (!element) return null;
    
    const key = element.id;
    
    switch (element.type) {
        case ElementType.RECTANGLE:
            return <RectangleRenderer key={key} element={element} />;
        case ElementType.ELLIPSE:
            return <EllipseRenderer key={key} element={element} />;
        case ElementType.FRAME:
            return <FrameRenderer key={key} element={element} />;
        case ElementType.LINE:
            return <LineRenderer key={key} element={element} />;
        case ElementType.ARROW:
            return <ArrowRenderer key={key} element={element} />;
        case ElementType.POLYGON:
            return <PolygonRenderer key={key} element={element} />;
        case ElementType.STAR:
            return <StarRenderer key={key} element={element} />;
        case ElementType.PATH:
            return <PathRenderer key={key} element={element} />;
        case ElementType.TEXT:
            return <TextRenderer key={key} element={element} />;
        case ElementType.IMAGE:
            return <ImageRenderer key={key} element={element} />;
        case ElementType.GROUP:
        case ElementType.COMPONENT:
        case ElementType.INSTANCE:
            return <GroupRenderer key={key} element={element} />;
        default:
            return <RectangleRenderer key={key} element={element} />;
    }
};

export default renderElement;
