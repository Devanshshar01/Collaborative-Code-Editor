import {BaseBoxShapeUtil, HTMLContainer, stopEventPropagation, defaultShapeUtils} from '@tldraw/tldraw';

// Custom annotation shape for collaborative editing
export class AnnotationShapeUtil extends BaseBoxShapeUtil {
    static type = 'annotation';

    static props = {
        w: 200,
        h: 100,
        text: '',
        author: '',
        color: '#ff0000',
        timestamp: Date.now()
    };

    getDefaultProps() {
        return {
            w: 200,
            h: 100,
            text: 'Add your comment here...',
            author: 'Anonymous',
            color: '#ff6b6b',
            timestamp: Date.now()
        };
    }

    getGeometry(shape) {
        return {
            bounds: {
                x: 0,
                y: 0,
                width: shape.props.w,
                height: shape.props.h
            }
        };
    }

    render(shape) {
        const bounds = this.getGeometry(shape).bounds;

        return (
            <HTMLContainer
                id={shape.id}
                style={{
                    pointerEvents: 'all',
                    width: bounds.width,
                    height: bounds.height,
                }}
            >
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: shape.props.color + '20',
                        border: `2px solid ${shape.props.color}`,
                        borderRadius: '8px',
                        padding: '8px',
                        display: 'flex',
                        flexDirection: 'column',
                        fontSize: '14px',
                        fontFamily: 'system-ui, sans-serif'
                    }}
                >
                    <div
                        style={{
                            fontSize: '11px',
                            color: shape.props.color,
                            fontWeight: 'bold',
                            marginBottom: '4px',
                            opacity: 0.8
                        }}
                    >
                        {shape.props.author} • {new Date(shape.props.timestamp).toLocaleTimeString()}
                    </div>
                    <div
                        contentEditable
                        suppressContentEditableWarning
                        style={{
                            flex: 1,
                            outline: 'none',
                            color: '#333',
                            lineHeight: '1.4'
                        }}
                        onPointerDown={stopEventPropagation}
                        onInput={(e) => {
                            if (this.editor) {
                                this.editor.updateShape({
                                    id: shape.id,
                                    type: 'annotation',
                                    props: {
                                        ...shape.props,
                                        text: e.currentTarget.textContent || ''
                                    }
                                });
                            }
                        }}
                    >
                        {shape.props.text}
                    </div>
                </div>
            </HTMLContainer>
        );
    }
}

// Enhanced shape utilities including custom shapes
export const enhancedShapeUtils = [
    ...defaultShapeUtils,
    AnnotationShapeUtil
];

// Utility functions for whiteboard collaboration
export const WhiteboardUtils = {
    // Create annotation at specific position
    createAnnotation(editor, point, text, author, color) {
        if (!editor) {
            console.warn('Editor not available for creating annotation');
            return null;
        }

        const annotationId = `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            editor.createShapes([
                {
                    id: annotationId,
                    type: 'annotation',
                    x: point.x,
                    y: point.y,
                    props: {
                        w: 200,
                        h: 100,
                        text: text || 'New comment',
                        author: author || 'Anonymous',
                        color: color || '#ff6b6b',
                        timestamp: Date.now()
                    }
                }
            ]);

            return annotationId;
        } catch (error) {
            console.error('Failed to create annotation:', error);
            return null;
        }
    },

    // Get whiteboard bounds for efficient rendering
    getWhiteboardBounds(editor) {
        if (!editor) return {x: 0, y: 0, width: 1920, height: 1080};

        try {
            const allShapes = editor.getCurrentPageShapes();
            if (allShapes.length === 0) {
                return {x: 0, y: 0, width: 1920, height: 1080};
            }

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

            allShapes.forEach(shape => {
                try {
                    const bounds = editor.getShapeGeometry(shape)?.bounds;
                    if (bounds) {
                        minX = Math.min(minX, shape.x + bounds.x);
                        minY = Math.min(minY, shape.y + bounds.y);
                        maxX = Math.max(maxX, shape.x + bounds.x + bounds.width);
                        maxY = Math.max(maxY, shape.y + bounds.y + bounds.height);
                    }
                } catch (err) {
                    // Skip shapes that can't be processed
                    console.warn('Skipping shape bounds calculation:', err);
                }
            });

            return {
                x: minX - 100,
                y: minY - 100,
                width: maxX - minX + 200,
                height: maxY - minY + 200
            };
        } catch (error) {
            console.error('Error calculating whiteboard bounds:', error);
            return {x: 0, y: 0, width: 1920, height: 1080};
        }
    },

    // Optimize shapes for large diagrams
    optimizeLargeDiagram(editor, maxShapes = 1000) {
        if (!editor) return;

        try {
            const allShapes = editor.getCurrentPageShapes();

            if (allShapes.length <= maxShapes) {
                return;
            }

            console.log(`📊 Optimizing diagram: ${allShapes.length} shapes (limit: ${maxShapes})`);

            // Sort shapes by creation time
            const sortedShapes = allShapes.sort((a, b) => {
                const aTime = a.props?.timestamp || 0;
                const bTime = b.props?.timestamp || 0;
                return aTime - bTime;
            });

            // Keep only the most recent shapes
            const shapesToDelete = sortedShapes.slice(0, sortedShapes.length - maxShapes);
            const idsToDelete = shapesToDelete.map(shape => shape.id);

            editor.deleteShapes(idsToDelete);

            console.log(`📊 Deleted ${idsToDelete.length} old shapes for performance`);
        } catch (error) {
            console.error('Error optimizing diagram:', error);
        }
    },

    // Export visible shapes only (for performance)
    exportVisibleShapes(editor) {
        if (!editor) return [];

        try {
            const viewport = editor.getViewportPageBounds();
            const visibleShapes = editor.getCurrentPageShapes().filter(shape => {
                try {
                    const shapeBounds = editor.getShapeGeometry(shape)?.bounds;
                    return shapeBounds && viewport.intersects(shapeBounds);
                } catch (err) {
                    return false; // Skip problematic shapes
                }
            });

            return visibleShapes.map(shape => ({
                id: shape.id,
                type: shape.type,
                x: shape.x,
                y: shape.y,
                props: shape.props
            }));
        } catch (error) {
            console.error('Error exporting visible shapes:', error);
            return [];
        }
    }
};

export {AnnotationShapeUtil};