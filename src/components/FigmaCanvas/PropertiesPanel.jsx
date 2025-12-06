/**
 * Figma-style Properties Panel
 * Right sidebar for editing selected element properties
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ElementType } from './store';
import clsx from 'clsx';

// Property section component
const PropertySection = ({ title, children, collapsible = true, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="figma-property-section">
            {title && (
                <button
                    className="figma-property-section-header"
                    onClick={() => collapsible && setIsOpen(!isOpen)}
                >
                    {collapsible && (
                        <svg 
                            className={clsx('figma-collapse-icon', isOpen && 'open')}
                            width="8" height="8" viewBox="0 0 8 8"
                        >
                            <path d="M2 1l4 3-4 3V1z" fill="currentColor"/>
                        </svg>
                    )}
                    <span>{title}</span>
                </button>
            )}
            {isOpen && (
                <div className="figma-property-section-content">
                    {children}
                </div>
            )}
        </div>
    );
};

// Input field component
const PropertyInput = ({ label, value, onChange, type = 'text', min, max, step, suffix, disabled }) => {
    return (
        <div className="figma-property-input">
            {label && <label className="figma-property-label">{label}</label>}
            <div className="figma-input-wrapper">
                <input
                    type={type}
                    value={value ?? ''}
                    onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                    min={min}
                    max={max}
                    step={step}
                    disabled={disabled}
                    className="figma-input"
                />
                {suffix && <span className="figma-input-suffix">{suffix}</span>}
            </div>
        </div>
    );
};

// Color swatch component
const ColorSwatch = ({ color, onClick, label }) => {
    const displayColor = color?.color || color || '#D9D9D9';
    const isTransparent = color?.type === 'none' || !color;

    return (
        <div className="figma-color-input">
            {label && <label className="figma-property-label">{label}</label>}
            <button 
                className="figma-color-swatch"
                onClick={onClick}
                style={{ 
                    backgroundColor: isTransparent ? 'transparent' : displayColor,
                    backgroundImage: isTransparent ? 
                        'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' :
                        'none',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                }}
            >
                {!isTransparent && (
                    <span className="figma-color-value">{displayColor.toUpperCase()}</span>
                )}
            </button>
        </div>
    );
};

// Slider component
const PropertySlider = ({ label, value, onChange, min = 0, max = 100, step = 1 }) => {
    return (
        <div className="figma-property-slider">
            {label && <label className="figma-property-label">{label}</label>}
            <div className="figma-slider-wrapper">
                <input
                    type="range"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    min={min}
                    max={max}
                    step={step}
                    className="figma-slider"
                />
                <span className="figma-slider-value">{Math.round(value)}%</span>
            </div>
        </div>
    );
};

// Select dropdown component
const PropertySelect = ({ label, value, onChange, options }) => {
    return (
        <div className="figma-property-select">
            {label && <label className="figma-property-label">{label}</label>}
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="figma-select"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
};

// Alignment buttons
const AlignmentButtons = ({ onAlign }) => {
    const alignments = [
        { id: 'left', icon: '⬅', title: 'Align left' },
        { id: 'center-h', icon: '↔', title: 'Align center horizontally' },
        { id: 'right', icon: '➡', title: 'Align right' },
        { id: 'top', icon: '⬆', title: 'Align top' },
        { id: 'center-v', icon: '↕', title: 'Align center vertically' },
        { id: 'bottom', icon: '⬇', title: 'Align bottom' },
    ];

    return (
        <div className="figma-alignment-buttons">
            {alignments.map(align => (
                <button
                    key={align.id}
                    className="figma-alignment-button"
                    onClick={() => onAlign(align.id)}
                    title={align.title}
                >
                    {align.icon}
                </button>
            ))}
        </div>
    );
};

// Main Properties Panel
const PropertiesPanel = ({ elements, selectedIds, onUpdateElement, onShowColorPicker }) => {
    const selectedElements = useMemo(() => 
        elements.filter(el => selectedIds.includes(el.id)),
        [elements, selectedIds]
    );

    const selectedElement = selectedElements[0];
    const multipleSelected = selectedElements.length > 1;

    // Update handler for single or multiple elements
    const handleUpdate = useCallback((key, value) => {
        selectedIds.forEach(id => {
            onUpdateElement(id, { [key]: value });
        });
    }, [selectedIds, onUpdateElement]);

    // Handle nested updates (e.g., fill.color)
    const handleNestedUpdate = useCallback((parent, key, value) => {
        selectedIds.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (el) {
                onUpdateElement(id, { 
                    [parent]: { ...el[parent], [key]: value } 
                });
            }
        });
    }, [selectedIds, elements, onUpdateElement]);

    // Show color picker
    const handleColorClick = useCallback((property, currentColor, position) => {
        onShowColorPicker({
            color: currentColor,
            position,
            onChange: (newColor) => {
                if (property === 'fill') {
                    handleUpdate('fill', { type: 'solid', color: newColor });
                } else if (property === 'stroke') {
                    handleNestedUpdate('stroke', 'color', newColor);
                }
            },
        });
    }, [handleUpdate, handleNestedUpdate, onShowColorPicker]);

    if (selectedElements.length === 0) {
        return (
            <div className="figma-properties-panel">
                <div className="figma-properties-empty">
                    <div className="figma-properties-empty-icon">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
                            <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                    </div>
                    <p>Select an element to view its properties</p>
                </div>
            </div>
        );
    }

    return (
        <div className="figma-properties-panel">
            {/* Header */}
            <div className="figma-properties-header">
                <span className="figma-properties-title">
                    {multipleSelected 
                        ? `${selectedElements.length} elements selected`
                        : selectedElement?.name || 'Element'
                    }
                </span>
                {!multipleSelected && (
                    <span className="figma-properties-type">
                        {selectedElement?.type}
                    </span>
                )}
            </div>

            {/* Alignment (for multiple selection) */}
            {multipleSelected && (
                <PropertySection title="Align" defaultOpen={true}>
                    <AlignmentButtons onAlign={(alignment) => {
                        // Implement alignment logic
                        console.log('Align:', alignment);
                    }} />
                </PropertySection>
            )}

            {/* Position & Size */}
            <PropertySection title="Position" defaultOpen={true}>
                <div className="figma-property-grid">
                    <PropertyInput
                        label="X"
                        value={multipleSelected ? '' : selectedElement?.x}
                        onChange={(v) => handleUpdate('x', v)}
                        type="number"
                        disabled={multipleSelected}
                    />
                    <PropertyInput
                        label="Y"
                        value={multipleSelected ? '' : selectedElement?.y}
                        onChange={(v) => handleUpdate('y', v)}
                        type="number"
                        disabled={multipleSelected}
                    />
                    <PropertyInput
                        label="W"
                        value={multipleSelected ? '' : selectedElement?.width}
                        onChange={(v) => handleUpdate('width', v)}
                        type="number"
                        min={1}
                    />
                    <PropertyInput
                        label="H"
                        value={multipleSelected ? '' : selectedElement?.height}
                        onChange={(v) => handleUpdate('height', v)}
                        type="number"
                        min={1}
                    />
                </div>
                <div className="figma-property-grid">
                    <PropertyInput
                        label="↻"
                        value={multipleSelected ? '' : selectedElement?.rotation || 0}
                        onChange={(v) => handleUpdate('rotation', v)}
                        type="number"
                        suffix="°"
                    />
                    {selectedElement?.type === ElementType.RECTANGLE && (
                        <PropertyInput
                            label="⊡"
                            value={selectedElement?.cornerRadius || 0}
                            onChange={(v) => handleUpdate('cornerRadius', v)}
                            type="number"
                            min={0}
                        />
                    )}
                </div>
            </PropertySection>

            {/* Fill */}
            <PropertySection title="Fill" defaultOpen={true}>
                <ColorSwatch
                    color={selectedElement?.fill}
                    onClick={(e) => handleColorClick('fill', selectedElement?.fill?.color, { x: e.clientX, y: e.clientY })}
                />
                <PropertySlider
                    label="Opacity"
                    value={(selectedElement?.fill?.opacity ?? 1) * 100}
                    onChange={(v) => handleNestedUpdate('fill', 'opacity', v / 100)}
                />
            </PropertySection>

            {/* Stroke */}
            <PropertySection title="Stroke" defaultOpen={true}>
                <ColorSwatch
                    color={selectedElement?.stroke}
                    onClick={(e) => handleColorClick('stroke', selectedElement?.stroke?.color, { x: e.clientX, y: e.clientY })}
                />
                <div className="figma-property-grid">
                    <PropertyInput
                        label="Width"
                        value={selectedElement?.stroke?.width || 0}
                        onChange={(v) => handleNestedUpdate('stroke', 'width', v)}
                        type="number"
                        min={0}
                        step={0.5}
                    />
                    <PropertySelect
                        label="Style"
                        value={selectedElement?.stroke?.style || 'solid'}
                        onChange={(v) => handleNestedUpdate('stroke', 'style', v)}
                        options={[
                            { value: 'solid', label: 'Solid' },
                            { value: 'dashed', label: 'Dashed' },
                            { value: 'dotted', label: 'Dotted' },
                        ]}
                    />
                </div>
            </PropertySection>

            {/* Effects */}
            <PropertySection title="Effects" defaultOpen={false}>
                <button className="figma-add-effect-btn">
                    + Add effect
                </button>
            </PropertySection>

            {/* Text properties (for text elements) */}
            {selectedElement?.type === ElementType.TEXT && (
                <PropertySection title="Text" defaultOpen={true}>
                    <PropertySelect
                        label="Font"
                        value={selectedElement?.fontFamily || 'Inter'}
                        onChange={(v) => handleUpdate('fontFamily', v)}
                        options={[
                            { value: 'Inter', label: 'Inter' },
                            { value: 'Roboto', label: 'Roboto' },
                            { value: 'Arial', label: 'Arial' },
                            { value: 'Helvetica', label: 'Helvetica' },
                            { value: 'Georgia', label: 'Georgia' },
                            { value: 'monospace', label: 'Monospace' },
                        ]}
                    />
                    <div className="figma-property-grid">
                        <PropertyInput
                            label="Size"
                            value={selectedElement?.fontSize || 16}
                            onChange={(v) => handleUpdate('fontSize', v)}
                            type="number"
                            min={1}
                        />
                        <PropertySelect
                            label="Weight"
                            value={selectedElement?.fontWeight || 400}
                            onChange={(v) => handleUpdate('fontWeight', parseInt(v))}
                            options={[
                                { value: 100, label: 'Thin' },
                                { value: 300, label: 'Light' },
                                { value: 400, label: 'Regular' },
                                { value: 500, label: 'Medium' },
                                { value: 600, label: 'Semibold' },
                                { value: 700, label: 'Bold' },
                                { value: 900, label: 'Black' },
                            ]}
                        />
                    </div>
                    <PropertySelect
                        label="Align"
                        value={selectedElement?.textAlign || 'left'}
                        onChange={(v) => handleUpdate('textAlign', v)}
                        options={[
                            { value: 'left', label: 'Left' },
                            { value: 'center', label: 'Center' },
                            { value: 'right', label: 'Right' },
                            { value: 'justify', label: 'Justify' },
                        ]}
                    />
                    <PropertyInput
                        label="Line Height"
                        value={selectedElement?.lineHeight || 1.2}
                        onChange={(v) => handleUpdate('lineHeight', v)}
                        type="number"
                        step={0.1}
                        min={0.5}
                        max={3}
                    />
                </PropertySection>
            )}

            {/* Element Layer */}
            <PropertySection title="Layer" defaultOpen={true}>
                <PropertySlider
                    label="Opacity"
                    value={(selectedElement?.opacity ?? 1) * 100}
                    onChange={(v) => handleUpdate('opacity', v / 100)}
                />
                <PropertySelect
                    label="Blend Mode"
                    value={selectedElement?.blendMode || 'normal'}
                    onChange={(v) => handleUpdate('blendMode', v)}
                    options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'multiply', label: 'Multiply' },
                        { value: 'screen', label: 'Screen' },
                        { value: 'overlay', label: 'Overlay' },
                        { value: 'darken', label: 'Darken' },
                        { value: 'lighten', label: 'Lighten' },
                        { value: 'color-dodge', label: 'Color Dodge' },
                        { value: 'color-burn', label: 'Color Burn' },
                        { value: 'hard-light', label: 'Hard Light' },
                        { value: 'soft-light', label: 'Soft Light' },
                        { value: 'difference', label: 'Difference' },
                        { value: 'exclusion', label: 'Exclusion' },
                        { value: 'hue', label: 'Hue' },
                        { value: 'saturation', label: 'Saturation' },
                        { value: 'color', label: 'Color' },
                        { value: 'luminosity', label: 'Luminosity' },
                    ]}
                />
            </PropertySection>

            {/* Export */}
            <PropertySection title="Export" defaultOpen={false}>
                <button className="figma-export-btn">
                    + Add export
                </button>
            </PropertySection>
        </div>
    );
};

export default PropertiesPanel;
