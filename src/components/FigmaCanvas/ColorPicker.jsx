/**
 * Color Picker Component
 * Advanced color picker with gradients and opacity
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import clsx from 'clsx';

// Convert hex to HSV
const hexToHsv = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : d / max;
    const v = max;
    
    if (d !== 0) {
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    
    return { h: h * 360, s: s * 100, v: v * 100 };
};

// Convert HSV to hex
const hsvToHex = (h, s, v) => {
    h = h / 360;
    s = s / 100;
    v = v / 100;
    
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
    
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Preset colors (Figma's default palette)
const presetColors = [
    '#000000', '#545454', '#737373', '#a6a6a6', '#d9d9d9', '#ffffff',
    '#ff0000', '#ff8000', '#ffff00', '#80ff00', '#00ff00', '#00ff80',
    '#00ffff', '#0080ff', '#0000ff', '#8000ff', '#ff00ff', '#ff0080',
    '#ff6666', '#ffb366', '#ffff66', '#b3ff66', '#66ff66', '#66ffb3',
    '#66ffff', '#66b3ff', '#6666ff', '#b366ff', '#ff66ff', '#ff66b3',
];

const ColorPicker = ({ color, onChange, onClose, position }) => {
    const pickerRef = useRef(null);
    const [hsv, setHsv] = useState(() => hexToHsv(color || '#D9D9D9'));
    const [hexInput, setHexInput] = useState(color || '#D9D9D9');
    const [opacity, setOpacity] = useState(100);
    const [isDraggingSaturation, setIsDraggingSaturation] = useState(false);
    const [isDraggingHue, setIsDraggingHue] = useState(false);

    // Update hex when HSV changes
    useEffect(() => {
        const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
        setHexInput(hex);
        onChange?.(hex);
    }, [hsv, onChange]);

    // Handle saturation/value picker drag
    const handleSaturationMouseDown = useCallback((e) => {
        setIsDraggingSaturation(true);
        handleSaturationMove(e);
    }, []);

    const handleSaturationMove = useCallback((e) => {
        if (!isDraggingSaturation && e.type !== 'mousedown') return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        setHsv(prev => ({ ...prev, s: x * 100, v: (1 - y) * 100 }));
    }, [isDraggingSaturation]);

    // Handle hue slider drag
    const handleHueMouseDown = useCallback((e) => {
        setIsDraggingHue(true);
        handleHueMove(e);
    }, []);

    const handleHueMove = useCallback((e) => {
        if (!isDraggingHue && e.type !== 'mousedown') return;
        
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        
        setHsv(prev => ({ ...prev, h: x * 360 }));
    }, [isDraggingHue]);

    // Global mouse up handler
    useEffect(() => {
        const handleMouseUp = () => {
            setIsDraggingSaturation(false);
            setIsDraggingHue(false);
        };
        
        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    // Handle hex input change
    const handleHexChange = useCallback((e) => {
        const value = e.target.value;
        setHexInput(value);
        
        if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
            setHsv(hexToHsv(value));
        }
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                onClose();
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Position adjustment
    const adjustedX = Math.min(position?.x || 100, window.innerWidth - 260);
    const adjustedY = Math.min(position?.y || 100, window.innerHeight - 400);

    return (
        <div
            ref={pickerRef}
            className="figma-color-picker"
            style={{ left: adjustedX, top: adjustedY }}
        >
            {/* Saturation/Value picker */}
            <div
                className="figma-color-saturation"
                style={{
                    backgroundColor: hsvToHex(hsv.h, 100, 100),
                }}
                onMouseDown={handleSaturationMouseDown}
                onMouseMove={handleSaturationMove}
            >
                <div className="figma-color-saturation-white" />
                <div className="figma-color-saturation-black" />
                <div
                    className="figma-color-saturation-pointer"
                    style={{
                        left: `${hsv.s}%`,
                        top: `${100 - hsv.v}%`,
                    }}
                />
            </div>

            {/* Hue slider */}
            <div
                className="figma-color-hue"
                onMouseDown={handleHueMouseDown}
                onMouseMove={handleHueMove}
            >
                <div
                    className="figma-color-hue-pointer"
                    style={{ left: `${(hsv.h / 360) * 100}%` }}
                />
            </div>

            {/* Opacity slider */}
            <div className="figma-color-opacity">
                <div
                    className="figma-color-opacity-gradient"
                    style={{
                        background: `linear-gradient(to right, transparent, ${hsvToHex(hsv.h, hsv.s, hsv.v)})`,
                    }}
                />
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(parseInt(e.target.value))}
                    className="figma-color-opacity-slider"
                />
            </div>

            {/* Color inputs */}
            <div className="figma-color-inputs">
                <div className="figma-color-input-group">
                    <input
                        type="text"
                        value={hexInput}
                        onChange={handleHexChange}
                        className="figma-color-hex-input"
                        maxLength={7}
                    />
                    <span className="figma-color-input-label">HEX</span>
                </div>
                <div className="figma-color-input-group">
                    <input
                        type="number"
                        value={opacity}
                        onChange={(e) => setOpacity(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                        className="figma-color-opacity-input"
                        min="0"
                        max="100"
                    />
                    <span className="figma-color-input-label">%</span>
                </div>
            </div>

            {/* Color presets */}
            <div className="figma-color-presets">
                {presetColors.map(presetColor => (
                    <button
                        key={presetColor}
                        className={clsx(
                            'figma-color-preset',
                            hexInput.toLowerCase() === presetColor.toLowerCase() && 'active'
                        )}
                        style={{ backgroundColor: presetColor }}
                        onClick={() => {
                            setHsv(hexToHsv(presetColor));
                            setHexInput(presetColor);
                        }}
                    />
                ))}
            </div>

            {/* Eyedropper */}
            <button className="figma-color-eyedropper">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 1.5a2.121 2.121 0 0 1 3 3L14 7l-1-1-9 9H1v-3l9-9-1-1 2.5-2.5zm-1.06 2.12L3.5 12.56v1.94h1.94l8.94-8.94-1.94-1.94z"/>
                </svg>
                Pick color
            </button>
        </div>
    );
};

export default ColorPicker;
