/**
 * EnhancedPropertiesPanel - Right sidebar with all property controls
 * Shadow, blur, blend mode, transform, stroke, fill controls
 */

import React, { useState, useCallback } from 'react';
import { useWhiteboardStore, BlendMode, StrokeStyle, FillType, ElementType } from './whiteboardStore';
import { EnhancedColorPicker } from './EnhancedColorPicker';

// ============ Property Section Component ============

const PropertySection = ({ title, collapsed, onToggle, children }) => (
    <div style={styles.section}>
        <div style={styles.sectionHeader} onClick={onToggle}>
            <span style={styles.sectionTitle}>{title}</span>
            <span style={styles.chevron}>{collapsed ? '▶' : '▼'}</span>
        </div>
        {!collapsed && <div style={styles.sectionContent}>{children}</div>}
    </div>
);

// ============ Input Components ============

const NumberInput = ({ label, value, onChange, min, max, step = 1, unit = '' }) => (
    <div style={styles.inputRow}>
        <label style={styles.inputLabel}>{label}</label>
        <div style={styles.inputWrapper}>
            <input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                min={min}
                max={max}
                step={step}
                style={styles.numberInput}
            />
            {unit && <span style={styles.unit}>{unit}</span>}
        </div>
    </div>
);

const SliderInput = ({ label, value, onChange, min = 0, max = 100 }) => (
    <div style={styles.inputRow}>
        <label style={styles.inputLabel}>{label}</label>
        <input
            type="range"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            min={min}
            max={max}
            style={styles.slider}
        />
        <span style={styles.sliderValue}>{Math.round(value)}</span>
    </div>
);

const SelectInput = ({ label, value, onChange, options }) => (
    <div style={styles.inputRow}>
        <label style={styles.inputLabel}>{label}</label>
        <select value={value} onChange={(e) => onChange(e.target.value)} style={styles.select}>
            {options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

const CheckboxInput = ({ label, checked, onChange }) => (
    <div style={styles.checkboxRow}>
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            style={styles.checkbox}
        />
        <label style={styles.checkboxLabel}>{label}</label>
    </div>
);

// ============ Color Button Component ============

const ColorButton = ({ color, opacity = 1, onClick }) => (
    <button onClick={onClick} style={styles.colorButton}>
        <div style={{ ...styles.colorSwatch, background: color, opacity }} />
    </button>
);

// ============ Main Component ============

export const EnhancedPropertiesPanel = ({ className = '' }) => {
    const { selectedIds, elements, updateSelectedElements, updateElement, getSelectedElements } = useWhiteboardStore();
    const selectedElements = getSelectedElements();
    
    // Section collapse states
    const [sections, setSections] = useState({
        transform: false,
        fill: false,
        stroke: false,
        shadow: false,
        blur: false,
        typography: false,
        constraints: true,
    });
    
    // Color picker state
    const [activeColorPicker, setActiveColorPicker] = useState(null);
    
    const toggleSection = (key) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    // Get common properties from selection
    const getCommonProp = useCallback((getter) => {
        if (selectedElements.length === 0) return null;
        const firstValue = getter(selectedElements[0]);
        const allSame = selectedElements.every(el => JSON.stringify(getter(el)) === JSON.stringify(firstValue));
        return allSame ? firstValue : 'mixed';
    }, [selectedElements]);
    
    // Update handlers
    const handleUpdate = useCallback((updates) => {
        updateSelectedElements(updates);
    }, [updateSelectedElements]);
    
    const handleNestedUpdate = useCallback((key, nestedKey, value) => {
        const current = getCommonProp(el => el[key]) || {};
        handleUpdate({
            [key]: { ...current, [nestedKey]: value }
        });
    }, [getCommonProp, handleUpdate]);
    
    if (selectedElements.length === 0) {
        return (
            <div className={className} style={styles.panel}>
                <div style={styles.emptyState}>
                    <p style={styles.emptyText}>Select an element to view properties</p>
                </div>
            </div>
        );
    }
    
    const firstElement = selectedElements[0];
    const isText = firstElement.type === ElementType.TEXT;
    const isMultiple = selectedElements.length > 1;
    
    // Common values
    const x = getCommonProp(el => Math.round(el.x));
    const y = getCommonProp(el => Math.round(el.y));
    const width = getCommonProp(el => Math.round(el.width || 0));
    const height = getCommonProp(el => Math.round(el.height || 0));
    const rotation = getCommonProp(el => el.rotation || 0);
    const opacity = getCommonProp(el => (el.opacity ?? 1) * 100);
    const cornerRadius = getCommonProp(el => el.cornerRadius || 0);
    const blendMode = getCommonProp(el => el.blendMode || BlendMode.NORMAL);
    
    // Fill values
    const fill = getCommonProp(el => el.fill);
    const fillColor = fill?.color || '#D9D9D9';
    const fillOpacity = fill?.opacity ?? 1;
    
    // Stroke values
    const stroke = getCommonProp(el => el.stroke);
    const strokeColor = stroke?.color || '#000000';
    const strokeWidth = stroke?.width ?? 0;
    const strokeStyle = stroke?.style || StrokeStyle.SOLID;
    
    // Shadow values
    const shadow = getCommonProp(el => el.shadow);
    
    // Blur values
    const blur = getCommonProp(el => el.blur);
    
    return (
        <div className={className} style={styles.panel}>
            <div style={styles.header}>
                <span style={styles.headerTitle}>
                    {isMultiple ? `${selectedElements.length} Elements` : firstElement.name || firstElement.type}
                </span>
            </div>
            
            <div style={styles.content}>
                {/* Transform Section */}
                <PropertySection
                    title="Transform"
                    collapsed={sections.transform}
                    onToggle={() => toggleSection('transform')}
                >
                    <div style={styles.grid2}>
                        <NumberInput
                            label="X"
                            value={x}
                            onChange={(v) => handleUpdate({ x: v })}
                            unit="px"
                        />
                        <NumberInput
                            label="Y"
                            value={y}
                            onChange={(v) => handleUpdate({ y: v })}
                            unit="px"
                        />
                        <NumberInput
                            label="W"
                            value={width}
                            onChange={(v) => handleUpdate({ width: v })}
                            min={1}
                            unit="px"
                        />
                        <NumberInput
                            label="H"
                            value={height}
                            onChange={(v) => handleUpdate({ height: v })}
                            min={1}
                            unit="px"
                        />
                    </div>
                    <div style={styles.grid2}>
                        <NumberInput
                            label="↻"
                            value={rotation}
                            onChange={(v) => handleUpdate({ rotation: v })}
                            min={-360}
                            max={360}
                            unit="°"
                        />
                        <NumberInput
                            label="⌄"
                            value={cornerRadius}
                            onChange={(v) => handleUpdate({ cornerRadius: v })}
                            min={0}
                            unit="px"
                        />
                    </div>
                    <SliderInput
                        label="Opacity"
                        value={opacity}
                        onChange={(v) => handleUpdate({ opacity: v / 100 })}
                    />
                    <SelectInput
                        label="Blend"
                        value={blendMode}
                        onChange={(v) => handleUpdate({ blendMode: v })}
                        options={Object.entries(BlendMode).map(([key, value]) => ({
                            value,
                            label: key.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase()),
                        }))}
                    />
                </PropertySection>
                
                {/* Fill Section */}
                <PropertySection
                    title="Fill"
                    collapsed={sections.fill}
                    onToggle={() => toggleSection('fill')}
                >
                    <div style={styles.colorRow}>
                        <ColorButton
                            color={fillColor}
                            opacity={fillOpacity}
                            onClick={() => setActiveColorPicker(activeColorPicker === 'fill' ? null : 'fill')}
                        />
                        <div style={styles.colorInfo}>
                            <span style={styles.colorHex}>{fillColor?.toUpperCase()}</span>
                            <span style={styles.colorOpacity}>{Math.round(fillOpacity * 100)}%</span>
                        </div>
                        <CheckboxInput
                            label=""
                            checked={fill?.type !== FillType.NONE}
                            onChange={(checked) => handleNestedUpdate('fill', 'type', checked ? FillType.SOLID : FillType.NONE)}
                        />
                    </div>
                    {activeColorPicker === 'fill' && (
                        <div style={styles.colorPickerWrapper}>
                            <EnhancedColorPicker
                                value={fill}
                                onChange={(newFill) => handleUpdate({ fill: newFill })}
                                onClose={() => setActiveColorPicker(null)}
                            />
                        </div>
                    )}
                </PropertySection>
                
                {/* Stroke Section */}
                <PropertySection
                    title="Stroke"
                    collapsed={sections.stroke}
                    onToggle={() => toggleSection('stroke')}
                >
                    <div style={styles.colorRow}>
                        <ColorButton
                            color={strokeColor}
                            onClick={() => setActiveColorPicker(activeColorPicker === 'stroke' ? null : 'stroke')}
                        />
                        <div style={styles.colorInfo}>
                            <span style={styles.colorHex}>{strokeColor?.toUpperCase()}</span>
                        </div>
                        <NumberInput
                            label=""
                            value={strokeWidth}
                            onChange={(v) => handleNestedUpdate('stroke', 'width', v)}
                            min={0}
                            max={100}
                            unit="px"
                        />
                    </div>
                    {activeColorPicker === 'stroke' && (
                        <div style={styles.colorPickerWrapper}>
                            <EnhancedColorPicker
                                value={{ type: FillType.SOLID, color: strokeColor, opacity: 1 }}
                                onChange={(newStroke) => handleNestedUpdate('stroke', 'color', newStroke.color)}
                                onClose={() => setActiveColorPicker(null)}
                                showGradient={false}
                            />
                        </div>
                    )}
                    <SelectInput
                        label="Style"
                        value={strokeStyle}
                        onChange={(v) => handleNestedUpdate('stroke', 'style', v)}
                        options={[
                            { value: StrokeStyle.SOLID, label: 'Solid' },
                            { value: StrokeStyle.DASHED, label: 'Dashed' },
                            { value: StrokeStyle.DOTTED, label: 'Dotted' },
                        ]}
                    />
                    <div style={styles.grid2}>
                        <SelectInput
                            label="Cap"
                            value={stroke?.cap || 'round'}
                            onChange={(v) => handleNestedUpdate('stroke', 'cap', v)}
                            options={[
                                { value: 'butt', label: 'Butt' },
                                { value: 'round', label: 'Round' },
                                { value: 'square', label: 'Square' },
                            ]}
                        />
                        <SelectInput
                            label="Join"
                            value={stroke?.join || 'round'}
                            onChange={(v) => handleNestedUpdate('stroke', 'join', v)}
                            options={[
                                { value: 'miter', label: 'Miter' },
                                { value: 'round', label: 'Round' },
                                { value: 'bevel', label: 'Bevel' },
                            ]}
                        />
                    </div>
                </PropertySection>
                
                {/* Shadow Section */}
                <PropertySection
                    title="Shadow"
                    collapsed={sections.shadow}
                    onToggle={() => toggleSection('shadow')}
                >
                    <CheckboxInput
                        label="Enable Shadow"
                        checked={shadow?.enabled || false}
                        onChange={(v) => handleNestedUpdate('shadow', 'enabled', v)}
                    />
                    {shadow?.enabled && (
                        <>
                            <SelectInput
                                label="Type"
                                value={shadow?.type || 'drop'}
                                onChange={(v) => handleNestedUpdate('shadow', 'type', v)}
                                options={[
                                    { value: 'drop', label: 'Drop Shadow' },
                                    { value: 'inner', label: 'Inner Shadow' },
                                ]}
                            />
                            <div style={styles.colorRow}>
                                <ColorButton
                                    color={shadow?.color || 'rgba(0,0,0,0.25)'}
                                    onClick={() => setActiveColorPicker(activeColorPicker === 'shadow' ? null : 'shadow')}
                                />
                                <span style={styles.colorHex}>{shadow?.color || 'rgba(0,0,0,0.25)'}</span>
                            </div>
                            {activeColorPicker === 'shadow' && (
                                <div style={styles.colorPickerWrapper}>
                                    <EnhancedColorPicker
                                        value={{ type: FillType.SOLID, color: shadow?.color || '#000000', opacity: 0.25 }}
                                        onChange={(v) => handleNestedUpdate('shadow', 'color', v.color)}
                                        onClose={() => setActiveColorPicker(null)}
                                        showGradient={false}
                                    />
                                </div>
                            )}
                            <div style={styles.grid2}>
                                <NumberInput
                                    label="X"
                                    value={shadow?.offsetX || 0}
                                    onChange={(v) => handleNestedUpdate('shadow', 'offsetX', v)}
                                    unit="px"
                                />
                                <NumberInput
                                    label="Y"
                                    value={shadow?.offsetY || 4}
                                    onChange={(v) => handleNestedUpdate('shadow', 'offsetY', v)}
                                    unit="px"
                                />
                            </div>
                            <div style={styles.grid2}>
                                <NumberInput
                                    label="Blur"
                                    value={shadow?.blur || 8}
                                    onChange={(v) => handleNestedUpdate('shadow', 'blur', v)}
                                    min={0}
                                    unit="px"
                                />
                                <NumberInput
                                    label="Spread"
                                    value={shadow?.spread || 0}
                                    onChange={(v) => handleNestedUpdate('shadow', 'spread', v)}
                                    unit="px"
                                />
                            </div>
                        </>
                    )}
                </PropertySection>
                
                {/* Blur Section */}
                <PropertySection
                    title="Blur"
                    collapsed={sections.blur}
                    onToggle={() => toggleSection('blur')}
                >
                    <CheckboxInput
                        label="Enable Blur"
                        checked={blur?.enabled || false}
                        onChange={(v) => handleNestedUpdate('blur', 'enabled', v)}
                    />
                    {blur?.enabled && (
                        <>
                            <SelectInput
                                label="Type"
                                value={blur?.type || 'layer'}
                                onChange={(v) => handleNestedUpdate('blur', 'type', v)}
                                options={[
                                    { value: 'layer', label: 'Layer Blur' },
                                    { value: 'background', label: 'Background Blur' },
                                ]}
                            />
                            <SliderInput
                                label="Amount"
                                value={blur?.amount || 0}
                                onChange={(v) => handleNestedUpdate('blur', 'amount', v)}
                                max={50}
                            />
                        </>
                    )}
                </PropertySection>
                
                {/* Typography Section (for text elements) */}
                {isText && (
                    <PropertySection
                        title="Typography"
                        collapsed={sections.typography}
                        onToggle={() => toggleSection('typography')}
                    >
                        <SelectInput
                            label="Font"
                            value={firstElement.fontFamily || 'Inter'}
                            onChange={(v) => handleUpdate({ fontFamily: v })}
                            options={[
                                { value: 'Inter, sans-serif', label: 'Inter' },
                                { value: 'Roboto, sans-serif', label: 'Roboto' },
                                { value: 'Open Sans, sans-serif', label: 'Open Sans' },
                                { value: 'Montserrat, sans-serif', label: 'Montserrat' },
                                { value: 'Playfair Display, serif', label: 'Playfair Display' },
                                { value: 'Georgia, serif', label: 'Georgia' },
                                { value: 'monospace', label: 'Monospace' },
                            ]}
                        />
                        <div style={styles.grid2}>
                            <NumberInput
                                label="Size"
                                value={firstElement.fontSize || 16}
                                onChange={(v) => handleUpdate({ fontSize: v })}
                                min={8}
                                max={144}
                                unit="px"
                            />
                            <SelectInput
                                label="Weight"
                                value={firstElement.fontWeight || 400}
                                onChange={(v) => handleUpdate({ fontWeight: parseInt(v) })}
                                options={[
                                    { value: 100, label: 'Thin' },
                                    { value: 300, label: 'Light' },
                                    { value: 400, label: 'Regular' },
                                    { value: 500, label: 'Medium' },
                                    { value: 600, label: 'Semi Bold' },
                                    { value: 700, label: 'Bold' },
                                    { value: 900, label: 'Black' },
                                ]}
                            />
                        </div>
                        <div style={styles.grid2}>
                            <NumberInput
                                label="Line H"
                                value={(firstElement.lineHeight || 1.4) * 100}
                                onChange={(v) => handleUpdate({ lineHeight: v / 100 })}
                                min={50}
                                max={300}
                                unit="%"
                            />
                            <NumberInput
                                label="Letter"
                                value={firstElement.letterSpacing || 0}
                                onChange={(v) => handleUpdate({ letterSpacing: v })}
                                step={0.1}
                                unit="px"
                            />
                        </div>
                        <div style={styles.buttonGroup}>
                            <button
                                onClick={() => handleUpdate({ textAlign: 'left' })}
                                style={{
                                    ...styles.alignBtn,
                                    ...(firstElement.textAlign === 'left' ? styles.alignBtnActive : {}),
                                }}
                            >
                                ⟵
                            </button>
                            <button
                                onClick={() => handleUpdate({ textAlign: 'center' })}
                                style={{
                                    ...styles.alignBtn,
                                    ...(firstElement.textAlign === 'center' ? styles.alignBtnActive : {}),
                                }}
                            >
                                ⟷
                            </button>
                            <button
                                onClick={() => handleUpdate({ textAlign: 'right' })}
                                style={{
                                    ...styles.alignBtn,
                                    ...(firstElement.textAlign === 'right' ? styles.alignBtnActive : {}),
                                }}
                            >
                                ⟶
                            </button>
                        </div>
                    </PropertySection>
                )}
            </div>
        </div>
    );
};

// ============ Styles ============

const styles = {
    panel: {
        width: 280,
        height: '100%',
        background: '#252525',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        color: '#fff',
        overflow: 'hidden',
    },
    header: {
        padding: '12px 16px',
        borderBottom: '1px solid #333',
    },
    headerTitle: {
        fontWeight: 600,
        fontSize: 13,
    },
    content: {
        flex: 1,
        overflowY: 'auto',
        padding: 8,
    },
    emptyState: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    emptyText: {
        color: '#666',
        textAlign: 'center',
    },
    section: {
        marginBottom: 4,
        background: '#2a2a2a',
        borderRadius: 6,
        overflow: 'hidden',
    },
    sectionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 12px',
        cursor: 'pointer',
        userSelect: 'none',
    },
    sectionTitle: {
        fontWeight: 500,
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: '#888',
    },
    chevron: {
        fontSize: 8,
        color: '#666',
    },
    sectionContent: {
        padding: '0 12px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    inputRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    inputLabel: {
        width: 35,
        color: '#888',
        fontSize: 11,
    },
    inputWrapper: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        background: '#333',
        borderRadius: 4,
        overflow: 'hidden',
    },
    numberInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        padding: '6px 8px',
        color: '#fff',
        fontSize: 11,
        outline: 'none',
        minWidth: 0,
    },
    unit: {
        padding: '0 6px',
        color: '#666',
        fontSize: 10,
    },
    slider: {
        flex: 1,
        height: 4,
        appearance: 'none',
        background: '#444',
        borderRadius: 2,
        outline: 'none',
    },
    sliderValue: {
        width: 30,
        textAlign: 'right',
        color: '#888',
        fontSize: 11,
    },
    select: {
        flex: 1,
        background: '#333',
        border: 'none',
        borderRadius: 4,
        padding: '6px 8px',
        color: '#fff',
        fontSize: 11,
        outline: 'none',
    },
    checkboxRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    checkbox: {
        width: 14,
        height: 14,
        accentColor: '#0d99ff',
    },
    checkboxLabel: {
        color: '#ccc',
        fontSize: 11,
    },
    grid2: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
    },
    colorRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    colorButton: {
        width: 32,
        height: 32,
        border: '1px solid #444',
        borderRadius: 4,
        padding: 3,
        background: '#333',
        cursor: 'pointer',
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
        backgroundSize: '8px 8px',
    },
    colorSwatch: {
        width: '100%',
        height: '100%',
        borderRadius: 2,
    },
    colorInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    colorHex: {
        fontSize: 11,
        color: '#ccc',
        fontFamily: 'monospace',
    },
    colorOpacity: {
        fontSize: 10,
        color: '#666',
    },
    colorPickerWrapper: {
        marginTop: 8,
        marginLeft: -12,
        marginRight: -12,
        padding: '0 12px',
    },
    buttonGroup: {
        display: 'flex',
        gap: 4,
    },
    alignBtn: {
        flex: 1,
        padding: '6px 0',
        background: '#333',
        border: 'none',
        borderRadius: 4,
        color: '#888',
        cursor: 'pointer',
        fontSize: 12,
    },
    alignBtnActive: {
        background: '#0d99ff',
        color: '#fff',
    },
};

export default EnhancedPropertiesPanel;
