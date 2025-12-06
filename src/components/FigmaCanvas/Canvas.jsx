/**
 * Figma-style Canvas Component
 * Handles rendering, interactions, and viewport management
 */

import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useCanvasStore, ToolType, ElementType, createElement } from './store';
import { renderElement } from './renderers';
import { Grid, Rulers, Guides, SelectionBox, TransformHandles, CursorOverlay } from './components';

const Canvas = forwardRef(({
    elements,
    selectedIds,
    tool,
    zoom,
    pan,
    onZoom,
    onPan,
    onAddElement,
    onUpdateElement,
    onSelectElements,
    onClearSelection,
    onContextMenu,
    collaborativeCursors = [],
}, ref) => {
    const canvasRef = useRef(null);
    const svgRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const [isSelecting, setIsSelecting] = useState(false);
    const [dragStart, setDragStart] = useState(null);
    const [selectionBox, setSelectionBox] = useState(null);
    const [currentElement, setCurrentElement] = useState(null);
    const [transforming, setTransforming] = useState(null);

    const { 
        gridEnabled, 
        snapEnabled, 
        rulersEnabled, 
        guides,
        setHoveredId,
        hoveredId,
    } = useCanvasStore();

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        toDataURL: async (type = 'image/png') => {
            // Convert SVG to canvas and export
            const svg = svgRef.current;
            if (!svg) return null;
            
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            return new Promise((resolve) => {
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL(type));
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
            });
        },
        toSVG: () => {
            const svg = svgRef.current;
            if (!svg) return '';
            return new XMLSerializer().serializeToString(svg);
        },
    }));

    // Convert screen coordinates to canvas coordinates
    const screenToCanvas = useCallback((screenX, screenY) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return { x: 0, y: 0 };
        
        return {
            x: (screenX - rect.left - pan.x) / zoom,
            y: (screenY - rect.top - pan.y) / zoom,
        };
    }, [zoom, pan]);

    // Snap to grid
    const snapToGrid = useCallback((value, gridSize = 8) => {
        if (!snapEnabled) return value;
        return Math.round(value / gridSize) * gridSize;
    }, [snapEnabled]);

    // Handle mouse down
    const handleMouseDown = useCallback((e) => {
        if (e.button === 1 || (e.button === 0 && (tool === ToolType.HAND || e.spaceKey))) {
            // Middle mouse or hand tool - start panning
            setIsPanning(true);
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        const pos = screenToCanvas(e.clientX, e.clientY);
        setDragStart(pos);

        // Check if clicking on an element
        const clickedElement = [...elements].reverse().find(el => {
            if (!el.visible || el.locked) return false;
            return (
                pos.x >= el.x &&
                pos.x <= el.x + (el.width || 0) &&
                pos.y >= el.y &&
                pos.y <= el.y + (el.height || 0)
            );
        });

        if (tool === ToolType.SELECT) {
            if (clickedElement) {
                if (e.shiftKey) {
                    // Add/remove from selection
                    if (selectedIds.includes(clickedElement.id)) {
                        onSelectElements(selectedIds.filter(id => id !== clickedElement.id));
                    } else {
                        onSelectElements([...selectedIds, clickedElement.id]);
                    }
                } else if (!selectedIds.includes(clickedElement.id)) {
                    onSelectElements([clickedElement.id]);
                }
                setIsDragging(true);
            } else {
                // Start selection box
                onClearSelection();
                setIsSelecting(true);
                setSelectionBox({ x: pos.x, y: pos.y, width: 0, height: 0 });
            }
        } else if ([ToolType.RECTANGLE, ToolType.ELLIPSE, ToolType.FRAME, ToolType.LINE, ToolType.POLYGON, ToolType.STAR].includes(tool)) {
            // Start drawing shape
            setIsDrawing(true);
            const newElement = createElement(
                tool === ToolType.FRAME ? ElementType.FRAME :
                tool === ToolType.ELLIPSE ? ElementType.ELLIPSE :
                tool === ToolType.LINE ? ElementType.LINE :
                tool === ToolType.POLYGON ? ElementType.POLYGON :
                tool === ToolType.STAR ? ElementType.STAR :
                ElementType.RECTANGLE,
                {
                    x: snapToGrid(pos.x),
                    y: snapToGrid(pos.y),
                    width: 0,
                    height: 0,
                }
            );
            setCurrentElement(newElement);
        } else if (tool === ToolType.TEXT) {
            // Create text element
            const textElement = createElement(ElementType.TEXT, {
                x: snapToGrid(pos.x),
                y: snapToGrid(pos.y),
                width: 200,
                height: 40,
                text: 'Type something',
                fontSize: 16,
                fontFamily: 'Inter',
                fontWeight: 400,
                textAlign: 'left',
                fill: { type: 'solid', color: '#000000' },
            });
            onAddElement(textElement);
        } else if (tool === ToolType.PENCIL || tool === ToolType.PEN) {
            // Start path drawing
            setIsDrawing(true);
            const pathElement = createElement(ElementType.PATH, {
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
                points: [{ x: 0, y: 0 }],
                stroke: { color: '#000000', width: 2, style: 'solid' },
                fill: { type: 'none' },
            });
            setCurrentElement(pathElement);
        }
    }, [tool, elements, selectedIds, screenToCanvas, snapToGrid, onSelectElements, onClearSelection, onAddElement]);

    // Handle mouse move
    const handleMouseMove = useCallback((e) => {
        const pos = screenToCanvas(e.clientX, e.clientY);

        // Update hovered element
        if (tool === ToolType.SELECT && !isDragging && !isSelecting) {
            const hoveredElement = [...elements].reverse().find(el => {
                if (!el.visible || el.locked) return false;
                return (
                    pos.x >= el.x &&
                    pos.x <= el.x + (el.width || 0) &&
                    pos.y >= el.y &&
                    pos.y <= el.y + (el.height || 0)
                );
            });
            setHoveredId(hoveredElement?.id || null);
        }

        if (isPanning && dragStart) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            onPan(dx, dy);
            setDragStart({ x: e.clientX, y: e.clientY });
            return;
        }

        if (!dragStart) return;

        if (isSelecting) {
            // Update selection box
            setSelectionBox({
                x: Math.min(dragStart.x, pos.x),
                y: Math.min(dragStart.y, pos.y),
                width: Math.abs(pos.x - dragStart.x),
                height: Math.abs(pos.y - dragStart.y),
            });
        } else if (isDragging && selectedIds.length > 0) {
            // Move selected elements
            const dx = pos.x - dragStart.x;
            const dy = pos.y - dragStart.y;
            
            selectedIds.forEach(id => {
                const el = elements.find(e => e.id === id);
                if (el && !el.locked) {
                    onUpdateElement(id, {
                        x: snapToGrid(el.x + dx),
                        y: snapToGrid(el.y + dy),
                    });
                }
            });
            setDragStart(pos);
        } else if (isDrawing && currentElement) {
            if (currentElement.type === ElementType.PATH) {
                // Add point to path
                setCurrentElement(prev => ({
                    ...prev,
                    points: [...prev.points, { 
                        x: pos.x - prev.x, 
                        y: pos.y - prev.y 
                    }],
                }));
            } else {
                // Update shape dimensions
                const width = snapToGrid(pos.x - dragStart.x);
                const height = snapToGrid(pos.y - dragStart.y);
                
                setCurrentElement(prev => ({
                    ...prev,
                    x: width < 0 ? snapToGrid(pos.x) : prev.x,
                    y: height < 0 ? snapToGrid(pos.y) : prev.y,
                    width: Math.abs(width),
                    height: e.shiftKey ? Math.abs(width) : Math.abs(height), // Shift for square
                }));
            }
        }
    }, [tool, elements, selectedIds, dragStart, isPanning, isDragging, isSelecting, isDrawing, currentElement, screenToCanvas, snapToGrid, setHoveredId, onPan, onUpdateElement]);

    // Handle mouse up
    const handleMouseUp = useCallback((e) => {
        if (isSelecting && selectionBox) {
            // Select elements within box
            const selected = elements.filter(el => {
                if (!el.visible || el.locked) return false;
                return (
                    el.x >= selectionBox.x &&
                    el.x + (el.width || 0) <= selectionBox.x + selectionBox.width &&
                    el.y >= selectionBox.y &&
                    el.y + (el.height || 0) <= selectionBox.y + selectionBox.height
                );
            });
            onSelectElements(selected.map(e => e.id));
        }

        if (isDrawing && currentElement) {
            // Finish drawing - add element if it has size
            if (currentElement.width > 5 || currentElement.height > 5 || 
                (currentElement.points && currentElement.points.length > 2)) {
                onAddElement(currentElement);
            }
        }

        setIsDragging(false);
        setIsDrawing(false);
        setIsPanning(false);
        setIsSelecting(false);
        setDragStart(null);
        setSelectionBox(null);
        setCurrentElement(null);
    }, [elements, isSelecting, selectionBox, isDrawing, currentElement, onSelectElements, onAddElement]);

    // Handle wheel for zoom
    const handleWheel = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            onZoom(delta * zoom, e.clientX, e.clientY);
        } else {
            // Pan with wheel
            onPan(-e.deltaX, -e.deltaY);
        }
    }, [zoom, onZoom, onPan]);

    // Handle context menu
    const handleContextMenu = useCallback((e) => {
        e.preventDefault();
        const pos = screenToCanvas(e.clientX, e.clientY);
        
        // Find clicked element
        const clickedElement = [...elements].reverse().find(el => {
            if (!el.visible) return false;
            return (
                pos.x >= el.x &&
                pos.x <= el.x + (el.width || 0) &&
                pos.y >= el.y &&
                pos.y <= el.y + (el.height || 0)
            );
        });

        if (clickedElement) {
            if (!selectedIds.includes(clickedElement.id)) {
                onSelectElements([clickedElement.id]);
            }
        }

        onContextMenu(e, clickedElement?.id);
    }, [elements, selectedIds, screenToCanvas, onSelectElements, onContextMenu]);

    // Handle double click for text editing
    const handleDoubleClick = useCallback((e) => {
        const pos = screenToCanvas(e.clientX, e.clientY);
        const clickedElement = [...elements].reverse().find(el => {
            if (!el.visible || el.locked) return false;
            return (
                pos.x >= el.x &&
                pos.x <= el.x + (el.width || 0) &&
                pos.y >= el.y &&
                pos.y <= el.y + (el.height || 0)
            );
        });

        if (clickedElement?.type === ElementType.TEXT) {
            // Enter text editing mode
            // This would open inline text editor
        }
    }, [elements, screenToCanvas]);

    // Add event listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    // Get cursor based on tool
    const getCursor = () => {
        if (isPanning) return 'grabbing';
        switch (tool) {
            case ToolType.HAND: return 'grab';
            case ToolType.ZOOM: return 'zoom-in';
            case ToolType.TEXT: return 'text';
            case ToolType.PEN:
            case ToolType.PENCIL: return 'crosshair';
            default: return hoveredId ? 'move' : 'default';
        }
    };

    return (
        <div
            ref={canvasRef}
            className="figma-canvas"
            style={{ cursor: getCursor() }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onDoubleClick={handleDoubleClick}
        >
            {/* Rulers */}
            {rulersEnabled && (
                <Rulers zoom={zoom} pan={pan} />
            )}

            {/* SVG Canvas */}
            <svg
                ref={svgRef}
                className="figma-svg-canvas"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                }}
            >
                {/* Grid */}
                {gridEnabled && (
                    <Grid zoom={zoom} />
                )}

                {/* Guides */}
                <Guides guides={guides} />

                {/* Elements */}
                {elements.map(element => (
                    <g
                        key={element.id}
                        style={{
                            opacity: element.visible ? element.opacity : 0.3,
                            pointerEvents: element.locked ? 'none' : 'auto',
                        }}
                    >
                        {renderElement(element)}
                    </g>
                ))}

                {/* Current drawing element */}
                {currentElement && (
                    <g style={{ opacity: 0.7 }}>
                        {renderElement(currentElement)}
                    </g>
                )}

                {/* Selection highlights */}
                {selectedIds.map(id => {
                    const el = elements.find(e => e.id === id);
                    if (!el) return null;
                    return (
                        <TransformHandles
                            key={`handles-${id}`}
                            element={el}
                            zoom={zoom}
                            onTransformStart={(type) => setTransforming({ id, type })}
                            onTransform={(changes) => onUpdateElement(id, changes)}
                            onTransformEnd={() => setTransforming(null)}
                        />
                    );
                })}

                {/* Hover highlight */}
                {hoveredId && !selectedIds.includes(hoveredId) && (
                    <rect
                        x={elements.find(e => e.id === hoveredId)?.x}
                        y={elements.find(e => e.id === hoveredId)?.y}
                        width={elements.find(e => e.id === hoveredId)?.width}
                        height={elements.find(e => e.id === hoveredId)?.height}
                        fill="none"
                        stroke="#0d99ff"
                        strokeWidth={1 / zoom}
                        pointerEvents="none"
                    />
                )}

                {/* Selection box */}
                {selectionBox && (
                    <SelectionBox box={selectionBox} zoom={zoom} />
                )}
            </svg>

            {/* Collaborative cursors */}
            <CursorOverlay
                cursors={collaborativeCursors}
                zoom={zoom}
                pan={pan}
            />

            {/* Zoom indicator */}
            <div className="figma-zoom-indicator">
                {Math.round(zoom * 100)}%
            </div>
        </div>
    );
});

Canvas.displayName = 'Canvas';

export default Canvas;
