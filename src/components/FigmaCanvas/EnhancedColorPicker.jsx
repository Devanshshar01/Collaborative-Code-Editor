/**
 * EnhancedColorPicker - Advanced color picker with gradient editor
 * Supports solid colors, linear/radial gradients, eyedropper, opacity
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FillType } from './whiteboardStore';

// ============ Color Utilities ============

const hexToHsv = (hex) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }
    
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToHex = (h, s, v) => {
    h = h / 360; s = s / 100; v = v / 100;
    
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    
    const toHex = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
};

// Color presets
const COLOR_PRESETS = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#00ccff', '#0066ff',
    '#6600ff', '#ff00ff', '#ff0066', '#00ff99', '#99ff00', '#ff9900',
];

// ============ Main Component ============

export const EnhancedColorPicker = ({ 
    value, 
    onChange, 
    onClose,
    showGradient = true,
    showOpacity = true,
    showEyedropper = true,
    title = 'Color'
}) => {
    const [fillType, setFillType] = useState(value?.type || FillType.SOLID);
    const [color, setColor] = useState(value?.color || '#D9D9D9');
    const [opacity, setOpacity] = useState(value?.opacity ?? 1);
    const [hsv, setHsv] = useState(hexToHsv(value?.color || '#D9D9D9'));
    const [hexInput, setHexInput] = useState((value?.color || '#D9D9D9').replace('#', ''));
    
    // Gradient state
    const [gradientAngle, setGradientAngle] = useState(value?.angle || 0);
    const [gradientStops, setGradientStops] = useState(value?.stops || [
        { offset: 0, color: '#000000', opacity: 1 },
        { offset: 1, color: '#ffffff', opacity: 1 },
    ]);
    const [selectedStop, setSelectedStop] = useState(0);
    const [radialCx, setRadialCx] = useState(value?.cx || 50);
    const [radialCy, setRadialCy] = useState(value?.cy || 50);
    
    // Eyedropper state
    const [isPickingColor, setIsPickingColor] = useState(false);
    
    const satValRef = useRef(null);
    const hueRef = useRef(null);
    const opacityRef = useRef(null);
    
    // Update output when values change
    useEffect(() => {
        let output;
        
        if (fillType === FillType.NONE) {
            output = { type: FillType.NONE };
        } else if (fillType === FillType.SOLID) {
            output = { type: FillType.SOLID, color, opacity };
        } else if (fillType === FillType.LINEAR_GRADIENT) {
            output = { 
                type: FillType.LINEAR_GRADIENT, 
                angle: gradientAngle,
                stops: gradientStops,
                opacity,
            };
        } else if (fillType === FillType.RADIAL_GRADIENT) {
            output = {
                type: FillType.RADIAL_GRADIENT,
                cx: radialCx,
                cy: radialCy,
                stops: gradientStops,
                opacity,
            };
        }
        
        onChange?.(output);
    }, [fillType, color, opacity, gradientAngle, gradientStops, radialCx, radialCy, onChange]);
    
    // Handle saturation/value picker
    const handleSatValMouseDown = useCallback((e) => {
        const move = (e) => {
            const rect = satValRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            
            const newS = x * 100;
            const newV = (1 - y) * 100;
            
            setHsv(prev => ({ ...prev, s: newS, v: newV }));
            const newColor = hsvToHex(hsv.h, newS, newV);
            setColor(newColor);
            setHexInput(newColor.replace('#', ''));
            
            if (fillType === FillType.LINEAR_GRADIENT || fillType === FillType.RADIAL_GRADIENT) {
                const newStops = [...gradientStops];
                newStops[selectedStop] = { ...newStops[selectedStop], color: newColor };
                setGradientStops(newStops);
            }
        };
        
        move(e);
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', handleMouseUp);
    }, [hsv.h, fillType, gradientStops, selectedStop]);
    
    // Handle hue picker
    const handleHueMouseDown = useCallback((e) => {
        const move = (e) => {
            const rect = hueRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const newH = x * 360;
            
            setHsv(prev => ({ ...prev, h: newH }));
            const newColor = hsvToHex(newH, hsv.s, hsv.v);
            setColor(newColor);
            setHexInput(newColor.replace('#', ''));
            
            if (fillType === FillType.LINEAR_GRADIENT || fillType === FillType.RADIAL_GRADIENT) {
                const newStops = [...gradientStops];
                newStops[selectedStop] = { ...newStops[selectedStop], color: newColor };
                setGradientStops(newStops);
            }
        };
        
        move(e);
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', handleMouseUp);
    }, [hsv.s, hsv.v, fillType, gradientStops, selectedStop]);
    
    // Handle opacity slider
    const handleOpacityMouseDown = useCallback((e) => {
        const move = (e) => {
            const rect = opacityRef.current?.getBoundingClientRect();
            if (!rect) return;
            
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setOpacity(x);
        };
        
        move(e);
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);
    
    // Handle hex input
    const handleHexChange = (e) => {
        let value = e.target.value.replace('#', '').toUpperCase();
        if (value.length <= 6 && /^[0-9A-F]*$/.test(value)) {
            setHexInput(value);
            if (value.length === 6) {
                const hex = `#${value}`;
                setColor(hex);
                setHsv(hexToHsv(hex));
            }
        }
    };
    
    // Handle preset click
    const handlePresetClick = (presetColor) => {
        setColor(presetColor);
        setHexInput(presetColor.replace('#', ''));
        setHsv(hexToHsv(presetColor));
        
        if (fillType === FillType.LINEAR_GRADIENT || fillType === FillType.RADIAL_GRADIENT) {
            const newStops = [...gradientStops];
            newStops[selectedStop] = { ...newStops[selectedStop], color: presetColor };
            setGradientStops(newStops);
        }
    };
    
    // Handle eyedropper
    const handleEyedropper = async () => {
        if (!window.EyeDropper) {
            alert('Eyedropper not supported in this browser');
            return;
        }
        
        try {
            setIsPickingColor(true);
            const eyeDropper = new window.EyeDropper();
            const result = await eyeDropper.open();
            const pickedColor = result.sRGBHex;
            setColor(pickedColor);
            setHexInput(pickedColor.replace('#', ''));
            setHsv(hexToHsv(pickedColor));
        } catch (e) {
            // User cancelled
        } finally {
            setIsPickingColor(false);
        }
    };
    
    // Handle gradient stop click
    const handleStopClick = (index) => {
        setSelectedStop(index);
        const stop = gradientStops[index];
        setColor(stop.color);
        setHexInput(stop.color.replace('#', ''));
        setHsv(hexToHsv(stop.color));
    };
    
    // Add gradient stop
    const addGradientStop = () => {
        if (gradientStops.length >= 8) return;
        
        const newStop = {
            offset: 0.5,
            color: '#888888',
            opacity: 1,
        };
        
        const newStops = [...gradientStops, newStop].sort((a, b) => a.offset - b.offset);
        setGradientStops(newStops);
        setSelectedStop(newStops.findIndex(s => s === newStop));
    };
    
    // Remove gradient stop
    const removeGradientStop = () => {
        if (gradientStops.length <= 2) return;
        
        const newStops = gradientStops.filter((_, i) => i !== selectedStop);
        setGradientStops(newStops);
        setSelectedStop(Math.max(0, selectedStop - 1));
    };
    
    // Render gradient preview
    const getGradientPreview = () => {
        const stops = gradientStops.map(s => `${s.color} ${s.offset * 100}%`).join(', ');
        
        if (fillType === FillType.LINEAR_GRADIENT) {
            return `linear-gradient(${gradientAngle}deg, ${stops})`;
        } else if (fillType === FillType.RADIAL_GRADIENT) {
            return `radial-gradient(circle at ${radialCx}% ${radialCy}%, ${stops})`;
        }
        return color;
    };
    
    const hueColor = hsvToHex(hsv.h, 100, 100);
    
    return (
        <div className="enhanced-color-picker" style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <span style={styles.title}>{title}</span>
                {onClose && (
                    <button onClick={onClose} style={styles.closeBtn}>×</button>
                )}
            </div>
            
            {/* Fill type selector */}
            {showGradient && (
                <div style={styles.fillTypeRow}>
                    <button
                        onClick={() => setFillType(FillType.NONE)}
                        style={{
                            ...styles.fillTypeBtn,
                            ...(fillType === FillType.NONE ? styles.fillTypeBtnActive : {}),
                        }}
                    >
                        <span style={styles.noneIcon}>∅</span>
                    </button>
                    <button
                        onClick={() => setFillType(FillType.SOLID)}
                        style={{
                            ...styles.fillTypeBtn,
                            ...(fillType === FillType.SOLID ? styles.fillTypeBtnActive : {}),
                        }}
                    >
                        <div style={{ ...styles.solidIcon, background: color }} />
                    </button>
                    <button
                        onClick={() => setFillType(FillType.LINEAR_GRADIENT)}
                        style={{
                            ...styles.fillTypeBtn,
                            ...(fillType === FillType.LINEAR_GRADIENT ? styles.fillTypeBtnActive : {}),
                        }}
                    >
                        <div style={{ ...styles.gradientIcon, background: 'linear-gradient(90deg, #000, #fff)' }} />
                    </button>
                    <button
                        onClick={() => setFillType(FillType.RADIAL_GRADIENT)}
                        style={{
                            ...styles.fillTypeBtn,
                            ...(fillType === FillType.RADIAL_GRADIENT ? styles.fillTypeBtnActive : {}),
                        }}
                    >
                        <div style={{ ...styles.gradientIcon, background: 'radial-gradient(circle, #fff, #000)' }} />
                    </button>
                </div>
            )}
            
            {fillType !== FillType.NONE && (
                <>
                    {/* Gradient preview and controls */}
                    {(fillType === FillType.LINEAR_GRADIENT || fillType === FillType.RADIAL_GRADIENT) && (
                        <div style={styles.gradientSection}>
                            {/* Gradient preview */}
                            <div style={{ ...styles.gradientPreview, background: getGradientPreview() }} />
                            
                            {/* Gradient stops */}
                            <div style={styles.stopsContainer}>
                                {gradientStops.map((stop, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleStopClick(i)}
                                        style={{
                                            ...styles.stopHandle,
                                            left: `${stop.offset * 100}%`,
                                            background: stop.color,
                                            border: selectedStop === i ? '2px solid #0d99ff' : '2px solid #fff',
                                        }}
                                    />
                                ))}
                            </div>
                            
                            {/* Gradient angle / position */}
                            {fillType === FillType.LINEAR_GRADIENT && (
                                <div style={styles.row}>
                                    <label style={styles.label}>Angle</label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={gradientAngle}
                                        onChange={(e) => setGradientAngle(parseInt(e.target.value))}
                                        style={styles.slider}
                                    />
                                    <input
                                        type="number"
                                        value={gradientAngle}
                                        onChange={(e) => setGradientAngle(parseInt(e.target.value) || 0)}
                                        style={styles.numberInput}
                                    />
                                </div>
                            )}
                            
                            {/* Add/remove stops */}
                            <div style={styles.stopButtons}>
                                <button onClick={addGradientStop} style={styles.smallBtn}>+ Add Stop</button>
                                <button onClick={removeGradientStop} style={styles.smallBtn}>- Remove</button>
                            </div>
                        </div>
                    )}
                    
                    {/* Saturation/Value picker */}
                    <div
                        ref={satValRef}
                        style={{
                            ...styles.satValPicker,
                            background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})`,
                        }}
                        onMouseDown={handleSatValMouseDown}
                    >
                        <div
                            style={{
                                ...styles.satValCursor,
                                left: `${hsv.s}%`,
                                top: `${100 - hsv.v}%`,
                            }}
                        />
                    </div>
                    
                    {/* Hue picker */}
                    <div
                        ref={hueRef}
                        style={styles.huePicker}
                        onMouseDown={handleHueMouseDown}
                    >
                        <div
                            style={{
                                ...styles.hueCursor,
                                left: `${hsv.h / 360 * 100}%`,
                            }}
                        />
                    </div>
                    
                    {/* Opacity slider */}
                    {showOpacity && (
                        <div style={styles.row}>
                            <label style={styles.label}>Opacity</label>
                            <div
                                ref={opacityRef}
                                style={{
                                    ...styles.opacitySlider,
                                    background: `linear-gradient(to right, transparent, ${color})`,
                                }}
                                onMouseDown={handleOpacityMouseDown}
                            >
                                <div
                                    style={{
                                        ...styles.opacityCursor,
                                        left: `${opacity * 100}%`,
                                    }}
                                />
                            </div>
                            <span style={styles.opacityValue}>{Math.round(opacity * 100)}%</span>
                        </div>
                    )}
                    
                    {/* Hex input and eyedropper */}
                    <div style={styles.hexRow}>
                        <div style={styles.colorPreview}>
                            <div style={{ ...styles.colorSwatch, background: color, opacity }} />
                        </div>
                        <div style={styles.hexInputWrapper}>
                            <span style={styles.hashSymbol}>#</span>
                            <input
                                type="text"
                                value={hexInput}
                                onChange={handleHexChange}
                                maxLength={6}
                                style={styles.hexInput}
                            />
                        </div>
                        {showEyedropper && (
                            <button
                                onClick={handleEyedropper}
                                style={{
                                    ...styles.eyedropperBtn,
                                    opacity: isPickingColor ? 0.5 : 1,
                                }}
                                disabled={isPickingColor}
                                title="Pick color from screen"
                            >
                                💧
                            </button>
                        )}
                    </div>
                    
                    {/* Color presets */}
                    <div style={styles.presetsGrid}>
                        {COLOR_PRESETS.map((preset, i) => (
                            <button
                                key={i}
                                onClick={() => handlePresetClick(preset)}
                                style={{
                                    ...styles.presetBtn,
                                    background: preset,
                                    border: color.toLowerCase() === preset.toLowerCase() ? '2px solid #0d99ff' : '1px solid #444',
                                }}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ============ Styles ============

const styles = {
    container: {
        width: 240,
        background: '#2a2a2a',
        borderRadius: 8,
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        fontFamily: 'Inter, sans-serif',
        fontSize: 12,
        color: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontWeight: 600,
    },
    closeBtn: {
        background: 'none',
        border: 'none',
        color: '#888',
        fontSize: 18,
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
    },
    fillTypeRow: {
        display: 'flex',
        gap: 4,
    },
    fillTypeBtn: {
        width: 32,
        height: 32,
        border: '1px solid #444',
        borderRadius: 4,
        background: '#333',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    fillTypeBtnActive: {
        border: '2px solid #0d99ff',
    },
    noneIcon: {
        fontSize: 16,
        color: '#888',
    },
    solidIcon: {
        width: 20,
        height: 20,
        borderRadius: 3,
    },
    gradientIcon: {
        width: 20,
        height: 20,
        borderRadius: 3,
    },
    gradientSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    gradientPreview: {
        height: 30,
        borderRadius: 4,
        border: '1px solid #444',
    },
    stopsContainer: {
        position: 'relative',
        height: 20,
        background: '#333',
        borderRadius: 4,
        marginBottom: 4,
    },
    stopHandle: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 2,
        transform: 'translateX(-50%)',
        top: 3,
        cursor: 'pointer',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    },
    stopButtons: {
        display: 'flex',
        gap: 8,
    },
    smallBtn: {
        flex: 1,
        padding: '4px 8px',
        fontSize: 10,
        background: '#444',
        border: 'none',
        borderRadius: 4,
        color: '#fff',
        cursor: 'pointer',
    },
    satValPicker: {
        position: 'relative',
        width: '100%',
        height: 150,
        borderRadius: 4,
        cursor: 'crosshair',
    },
    satValCursor: {
        position: 'absolute',
        width: 14,
        height: 14,
        border: '2px solid #fff',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
    },
    huePicker: {
        position: 'relative',
        width: '100%',
        height: 14,
        borderRadius: 7,
        background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
        cursor: 'crosshair',
    },
    hueCursor: {
        position: 'absolute',
        width: 6,
        height: 18,
        background: '#fff',
        borderRadius: 3,
        top: -2,
        transform: 'translateX(-50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    label: {
        width: 50,
        color: '#888',
    },
    slider: {
        flex: 1,
        height: 4,
        appearance: 'none',
        background: '#444',
        borderRadius: 2,
        outline: 'none',
    },
    numberInput: {
        width: 45,
        padding: '4px 6px',
        background: '#333',
        border: '1px solid #444',
        borderRadius: 4,
        color: '#fff',
        fontSize: 11,
        textAlign: 'center',
    },
    opacitySlider: {
        position: 'relative',
        flex: 1,
        height: 14,
        borderRadius: 7,
        cursor: 'crosshair',
        backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
        backgroundSize: '8px 8px',
        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
    },
    opacityCursor: {
        position: 'absolute',
        width: 6,
        height: 18,
        background: '#fff',
        borderRadius: 3,
        top: -2,
        transform: 'translateX(-50%)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
    },
    opacityValue: {
        width: 35,
        textAlign: 'right',
        fontSize: 11,
    },
    hexRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    colorPreview: {
        width: 32,
        height: 32,
        borderRadius: 4,
        border: '1px solid #444',
        overflow: 'hidden',
        backgroundImage: 'linear-gradient(45deg, #444 25%, transparent 25%), linear-gradient(-45deg, #444 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #444 75%), linear-gradient(-45deg, transparent 75%, #444 75%)',
        backgroundSize: '8px 8px',
    },
    colorSwatch: {
        width: '100%',
        height: '100%',
    },
    hexInputWrapper: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        background: '#333',
        border: '1px solid #444',
        borderRadius: 4,
        padding: '4px 8px',
    },
    hashSymbol: {
        color: '#666',
        marginRight: 2,
    },
    hexInput: {
        flex: 1,
        background: 'none',
        border: 'none',
        color: '#fff',
        fontSize: 12,
        outline: 'none',
        textTransform: 'uppercase',
        fontFamily: 'monospace',
    },
    eyedropperBtn: {
        width: 32,
        height: 32,
        border: '1px solid #444',
        borderRadius: 4,
        background: '#333',
        cursor: 'pointer',
        fontSize: 14,
    },
    presetsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 4,
    },
    presetBtn: {
        width: 32,
        height: 24,
        borderRadius: 3,
        cursor: 'pointer',
        padding: 0,
    },
};

export default EnhancedColorPicker;
