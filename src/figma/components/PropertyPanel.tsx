/**
 * PropertyPanel - Full Figma-level Property Inspector
 * Comprehensive properties editor for all node types with live updates
 */

import React, { useState, useCallback, useMemo, memo } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export interface PropertyPanelNode {
  id: string;
  name: string;
  type: string;
  
  // Transform
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Layout (if applicable)
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL';
  primaryAxisAlign?: string;
  counterAxisAlign?: string;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  itemSpacing?: number;
  
  // Constraints
  horizontalConstraint?: string;
  verticalConstraint?: string;
  
  // Appearance
  fills: Fill[];
  strokes: Stroke[];
  effects: Effect[];
  opacity: number;
  blendMode: string;
  
  // Corner Radius (if applicable)
  cornerRadius?: number | [number, number, number, number];
  
  // Typography (if text)
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  lineHeight?: number | string;
  letterSpacing?: number;
  textAlign?: string;
  textDecoration?: string;
  
  // Component
  isComponent?: boolean;
  isInstance?: boolean;
  componentId?: string;
  
  // Prototyping
  interactions?: Interaction[];
}

export interface Fill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'IMAGE';
  visible: boolean;
  opacity: number;
  color?: { r: number; g: number; b: number; a: number };
  gradientStops?: Array<{ position: number; color: { r: number; g: number; b: number; a: number } }>;
  imageUrl?: string;
}

export interface Stroke {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  visible: boolean;
  opacity: number;
  color?: { r: number; g: number; b: number; a: number };
  weight: number;
  align: 'INSIDE' | 'CENTER' | 'OUTSIDE';
}

export interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  color?: { r: number; g: number; b: number; a: number };
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
}

export interface Interaction {
  trigger: 'ON_CLICK' | 'ON_HOVER' | 'ON_PRESS' | 'ON_DRAG';
  action: 'NAVIGATE' | 'OPEN_OVERLAY' | 'SWAP' | 'SCROLL_TO' | 'OPEN_URL';
  destinationId?: string;
  transition?: {
    type: 'DISSOLVE' | 'SMART_ANIMATE' | 'SLIDE_IN' | 'SLIDE_OUT' | 'PUSH';
    duration: number;
    easing: string;
  };
}

// ============ Property Store ============

interface PropertyPanelState {
  selectedNodes: PropertyPanelNode[];
  activeTab: 'design' | 'prototype' | 'code';
  expandedSections: Set<string>;
  
  setSelectedNodes: (nodes: PropertyPanelNode[]) => void;
  setActiveTab: (tab: 'design' | 'prototype' | 'code') => void;
  toggleSection: (section: string) => void;
  updateProperty: (nodeId: string, property: string, value: any) => void;
}

export const usePropertyPanelStore = create<PropertyPanelState>()(
  subscribeWithSelector((set, get) => ({
    selectedNodes: [],
    activeTab: 'design',
    expandedSections: new Set(['transform', 'fill', 'stroke']),
    
    setSelectedNodes: (nodes) => set({ selectedNodes: nodes }),
    
    setActiveTab: (tab) => set({ activeTab: tab }),
    
    toggleSection: (section) => {
      set((state) => {
        const expandedSections = new Set(state.expandedSections);
        if (expandedSections.has(section)) {
          expandedSections.delete(section);
        } else {
          expandedSections.add(section);
        }
        return { expandedSections };
      });
    },
    
    updateProperty: (nodeId, property, value) => {
      set((state) => {
        const nodes = state.selectedNodes.map((node) =>
          node.id === nodeId ? { ...node, [property]: value } : node
        );
        return { selectedNodes: nodes };
      });
    },
  }))
);

// ============ Icons ============

const Icons = {
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 4l4 4 4-4"/>
    </svg>
  ),
  Plus: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M6 2v8M2 6h8"/>
    </svg>
  ),
  Minus: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 6h8"/>
    </svg>
  ),
  Eye: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 3C3.5 3 1 7 1 7s2.5 4 6 4 6-4 6-4-2.5-4-6-4zm0 6.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
    </svg>
  ),
  EyeOff: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M2 2l10 10M7 4c2 0 4.5 2 5.5 3-.3.3-.7.7-1.2 1.1M7 10c-2 0-4.5-2-5.5-3 .3-.3.7-.7 1.2-1.1"/>
    </svg>
  ),
  Link: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M5 7l2-2m-2 0l2 2M8 4a2 2 0 012 2 2 2 0 01-2 2M4 8a2 2 0 01-2-2 2 2 0 012-2"/>
    </svg>
  ),
  Unlink: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M5 7l2-2m-2 0l2 2M8 4a2 2 0 012 2M4 8a2 2 0 01-2-2"/>
    </svg>
  ),
};

// ============ Color Utilities ============

function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${toHex(a)}` : hex;
}

function hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0, a: 1 };
  
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
    a: result[4] ? parseInt(result[4], 16) / 255 : 1,
  };
}

// ============ Collapsible Section ============

interface SectionProps {
  title: string;
  sectionKey: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const Section = memo<SectionProps>(({ title, sectionKey, children, defaultExpanded = true }) => {
  const { expandedSections, toggleSection } = usePropertyPanelStore();
  const isExpanded = expandedSections.has(sectionKey);

  return (
    <div className="property-section">
      <button
        className="property-section__header"
        onClick={() => toggleSection(sectionKey)}
      >
        <span className={`property-section__chevron ${isExpanded ? 'property-section__chevron--expanded' : ''}`}>
          <Icons.ChevronDown />
        </span>
        <span className="property-section__title">{title}</span>
      </button>
      {isExpanded && (
        <div className="property-section__content">
          {children}
        </div>
      )}
    </div>
  );
});

Section.displayName = 'Section';

// ============ Input Components ============

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}

const NumberInput = memo<NumberInputProps>(({ label, value, onChange, suffix, min, max, step = 1 }) => {
  const [editValue, setEditValue] = useState(String(value));

  const handleBlur = () => {
    const num = parseFloat(editValue);
    if (!isNaN(num)) {
      onChange(num);
    } else {
      setEditValue(String(value));
    }
  };

  return (
    <div className="property-input">
      <label className="property-input__label">{label}</label>
      <div className="property-input__control">
        <input
          type="text"
          className="property-input__field"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleBlur();
          }}
        />
        {suffix && <span className="property-input__suffix">{suffix}</span>}
      </div>
    </div>
  );
});

NumberInput.displayName = 'NumberInput';

interface ColorInputProps {
  label: string;
  value: { r: number; g: number; b: number; a: number };
  onChange: (value: { r: number; g: number; b: number; a: number }) => void;
}

const ColorInput = memo<ColorInputProps>(({ label, value, onChange }) => {
  const hex = rgbaToHex(value.r, value.g, value.b, value.a);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="property-input">
      <label className="property-input__label">{label}</label>
      <div className="property-input__control property-input__control--color">
        <button
          className="property-color-swatch"
          style={{ backgroundColor: hex }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          className="property-input__field"
          value={hex.toUpperCase()}
          onChange={(e) => {
            const rgba = hexToRgba(e.target.value);
            onChange(rgba);
          }}
        />
      </div>
    </div>
  );
});

ColorInput.displayName = 'ColorInput';

interface SelectInputProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}

const SelectInput = memo<SelectInputProps>(({ label, value, options, onChange }) => {
  return (
    <div className="property-input">
      <label className="property-input__label">{label}</label>
      <select
        className="property-input__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
});

SelectInput.displayName = 'SelectInput';

// ============ Transform Section ============

interface TransformSectionProps {
  node: PropertyPanelNode;
  onUpdate: (property: string, value: any) => void;
}

const TransformSection = memo<TransformSectionProps>(({ node, onUpdate }) => {
  const [lockAspect, setLockAspect] = useState(false);

  const handleWidthChange = (width: number) => {
    onUpdate('width', width);
    if (lockAspect) {
      const aspectRatio = node.width / node.height;
      onUpdate('height', width / aspectRatio);
    }
  };

  const handleHeightChange = (height: number) => {
    onUpdate('height', height);
    if (lockAspect) {
      const aspectRatio = node.width / node.height;
      onUpdate('width', height * aspectRatio);
    }
  };

  return (
    <Section title="Transform" sectionKey="transform">
      <div className="property-grid property-grid--2col">
        <NumberInput label="X" value={node.x} onChange={(v) => onUpdate('x', v)} />
        <NumberInput label="Y" value={node.y} onChange={(v) => onUpdate('y', v)} />
      </div>
      
      <div className="property-grid property-grid--2col">
        <NumberInput label="W" value={node.width} onChange={handleWidthChange} />
        <NumberInput label="H" value={node.height} onChange={handleHeightChange} />
      </div>
      
      <div className="property-lock-aspect">
        <button
          className={`property-lock-btn ${lockAspect ? 'property-lock-btn--active' : ''}`}
          onClick={() => setLockAspect(!lockAspect)}
          title={lockAspect ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
        >
          {lockAspect ? <Icons.Link /> : <Icons.Unlink />}
        </button>
      </div>
      
      <NumberInput
        label="Rotation"
        value={node.rotation}
        onChange={(v) => onUpdate('rotation', v)}
        suffix="°"
      />
      
      {typeof node.cornerRadius === 'number' && (
        <NumberInput
          label="Corner Radius"
          value={node.cornerRadius}
          onChange={(v) => onUpdate('cornerRadius', v)}
        />
      )}
    </Section>
  );
});

TransformSection.displayName = 'TransformSection';

// ============ Auto Layout Section ============

interface AutoLayoutSectionProps {
  node: PropertyPanelNode;
  onUpdate: (property: string, value: any) => void;
}

const AutoLayoutSection = memo<AutoLayoutSectionProps>(({ node, onUpdate }) => {
  if (!node.layoutMode || node.layoutMode === 'NONE') return null;

  return (
    <Section title="Auto Layout" sectionKey="autolayout">
      <SelectInput
        label="Direction"
        value={node.layoutMode}
        options={[
          { value: 'HORIZONTAL', label: 'Horizontal' },
          { value: 'VERTICAL', label: 'Vertical' },
        ]}
        onChange={(v) => onUpdate('layoutMode', v)}
      />
      
      <NumberInput
        label="Spacing"
        value={node.itemSpacing || 0}
        onChange={(v) => onUpdate('itemSpacing', v)}
      />
      
      <div className="property-padding-grid">
        <NumberInput
          label="T"
          value={node.paddingTop || 0}
          onChange={(v) => onUpdate('paddingTop', v)}
        />
        <NumberInput
          label="R"
          value={node.paddingRight || 0}
          onChange={(v) => onUpdate('paddingRight', v)}
        />
        <NumberInput
          label="B"
          value={node.paddingBottom || 0}
          onChange={(v) => onUpdate('paddingBottom', v)}
        />
        <NumberInput
          label="L"
          value={node.paddingLeft || 0}
          onChange={(v) => onUpdate('paddingLeft', v)}
        />
      </div>
      
      <SelectInput
        label="Align"
        value={node.primaryAxisAlign || 'MIN'}
        options={[
          { value: 'MIN', label: 'Packed' },
          { value: 'CENTER', label: 'Center' },
          { value: 'MAX', label: 'Max' },
          { value: 'SPACE_BETWEEN', label: 'Space Between' },
        ]}
        onChange={(v) => onUpdate('primaryAxisAlign', v)}
      />
    </Section>
  );
});

AutoLayoutSection.displayName = 'AutoLayoutSection';

// ============ Fill Section ============

interface FillSectionProps {
  fills: Fill[];
  onUpdate: (fills: Fill[]) => void;
}

const FillSection = memo<FillSectionProps>(({ fills, onUpdate }) => {
  const addFill = () => {
    onUpdate([
      ...fills,
      {
        type: 'SOLID',
        visible: true,
        opacity: 1,
        color: { r: 0.8, g: 0.8, b: 0.8, a: 1 },
      },
    ]);
  };

  const removeFill = (index: number) => {
    onUpdate(fills.filter((_, i) => i !== index));
  };

  const updateFill = (index: number, updates: Partial<Fill>) => {
    onUpdate(fills.map((fill, i) => (i === index ? { ...fill, ...updates } : fill)));
  };

  return (
    <Section title="Fill" sectionKey="fill">
      {fills.map((fill, index) => (
        <div key={index} className="property-list-item">
          <div className="property-list-item__header">
            <button
              className="property-list-item__toggle"
              onClick={() => updateFill(index, { visible: !fill.visible })}
            >
              {fill.visible ? <Icons.Eye /> : <Icons.EyeOff />}
            </button>
            <span className="property-list-item__type">{fill.type}</span>
            <button
              className="property-list-item__remove"
              onClick={() => removeFill(index)}
            >
              <Icons.Minus />
            </button>
          </div>
          {fill.visible && fill.color && (
            <div className="property-list-item__content">
              <ColorInput
                label="Color"
                value={fill.color}
                onChange={(color) => updateFill(index, { color })}
              />
              <NumberInput
                label="Opacity"
                value={fill.opacity * 100}
                onChange={(v) => updateFill(index, { opacity: v / 100 })}
                suffix="%"
                min={0}
                max={100}
              />
            </div>
          )}
        </div>
      ))}
      <button className="property-add-btn" onClick={addFill}>
        <Icons.Plus /> Add Fill
      </button>
    </Section>
  );
});

FillSection.displayName = 'FillSection';

// ============ Stroke Section ============

interface StrokeSectionProps {
  strokes: Stroke[];
  onUpdate: (strokes: Stroke[]) => void;
}

const StrokeSection = memo<StrokeSectionProps>(({ strokes, onUpdate }) => {
  const addStroke = () => {
    onUpdate([
      ...strokes,
      {
        type: 'SOLID',
        visible: true,
        opacity: 1,
        color: { r: 0, g: 0, b: 0, a: 1 },
        weight: 1,
        align: 'INSIDE',
      },
    ]);
  };

  const removeStroke = (index: number) => {
    onUpdate(strokes.filter((_, i) => i !== index));
  };

  const updateStroke = (index: number, updates: Partial<Stroke>) => {
    onUpdate(strokes.map((stroke, i) => (i === index ? { ...stroke, ...updates } : stroke)));
  };

  return (
    <Section title="Stroke" sectionKey="stroke">
      {strokes.map((stroke, index) => (
        <div key={index} className="property-list-item">
          <div className="property-list-item__header">
            <button
              className="property-list-item__toggle"
              onClick={() => updateStroke(index, { visible: !stroke.visible })}
            >
              {stroke.visible ? <Icons.Eye /> : <Icons.EyeOff />}
            </button>
            <span className="property-list-item__type">{stroke.type}</span>
            <button
              className="property-list-item__remove"
              onClick={() => removeStroke(index)}
            >
              <Icons.Minus />
            </button>
          </div>
          {stroke.visible && stroke.color && (
            <div className="property-list-item__content">
              <ColorInput
                label="Color"
                value={stroke.color}
                onChange={(color) => updateStroke(index, { color })}
              />
              <NumberInput
                label="Weight"
                value={stroke.weight}
                onChange={(v) => updateStroke(index, { weight: v })}
              />
              <SelectInput
                label="Align"
                value={stroke.align}
                options={[
                  { value: 'INSIDE', label: 'Inside' },
                  { value: 'CENTER', label: 'Center' },
                  { value: 'OUTSIDE', label: 'Outside' },
                ]}
                onChange={(v) => updateStroke(index, { align: v as any })}
              />
            </div>
          )}
        </div>
      ))}
      <button className="property-add-btn" onClick={addStroke}>
        <Icons.Plus /> Add Stroke
      </button>
    </Section>
  );
});

StrokeSection.displayName = 'StrokeSection';

// ============ Effects Section ============

interface EffectsSectionProps {
  effects: Effect[];
  onUpdate: (effects: Effect[]) => void;
}

const EffectsSection = memo<EffectsSectionProps>(({ effects, onUpdate }) => {
  const addEffect = () => {
    onUpdate([
      ...effects,
      {
        type: 'DROP_SHADOW',
        visible: true,
        color: { r: 0, g: 0, b: 0, a: 0.25 },
        offset: { x: 0, y: 4 },
        radius: 4,
        spread: 0,
      },
    ]);
  };

  const removeEffect = (index: number) => {
    onUpdate(effects.filter((_, i) => i !== index));
  };

  const updateEffect = (index: number, updates: Partial<Effect>) => {
    onUpdate(effects.map((effect, i) => (i === index ? { ...effect, ...updates } : effect)));
  };

  return (
    <Section title="Effects" sectionKey="effects">
      {effects.map((effect, index) => (
        <div key={index} className="property-list-item">
          <div className="property-list-item__header">
            <button
              className="property-list-item__toggle"
              onClick={() => updateEffect(index, { visible: !effect.visible })}
            >
              {effect.visible ? <Icons.Eye /> : <Icons.EyeOff />}
            </button>
            <span className="property-list-item__type">{effect.type}</span>
            <button
              className="property-list-item__remove"
              onClick={() => removeEffect(index)}
            >
              <Icons.Minus />
            </button>
          </div>
          {effect.visible && (
            <div className="property-list-item__content">
              <SelectInput
                label="Type"
                value={effect.type}
                options={[
                  { value: 'DROP_SHADOW', label: 'Drop Shadow' },
                  { value: 'INNER_SHADOW', label: 'Inner Shadow' },
                  { value: 'LAYER_BLUR', label: 'Layer Blur' },
                  { value: 'BACKGROUND_BLUR', label: 'Background Blur' },
                ]}
                onChange={(v) => updateEffect(index, { type: v as any })}
              />
              {effect.type !== 'LAYER_BLUR' && effect.type !== 'BACKGROUND_BLUR' && effect.color && (
                <ColorInput
                  label="Color"
                  value={effect.color}
                  onChange={(color) => updateEffect(index, { color })}
                />
              )}
              {effect.offset && (
                <div className="property-grid property-grid--2col">
                  <NumberInput
                    label="X"
                    value={effect.offset.x}
                    onChange={(x) => updateEffect(index, { offset: { ...effect.offset!, x } })}
                  />
                  <NumberInput
                    label="Y"
                    value={effect.offset.y}
                    onChange={(y) => updateEffect(index, { offset: { ...effect.offset!, y } })}
                  />
                </div>
              )}
              <NumberInput
                label="Blur"
                value={effect.radius}
                onChange={(v) => updateEffect(index, { radius: v })}
              />
              {effect.spread !== undefined && (
                <NumberInput
                  label="Spread"
                  value={effect.spread}
                  onChange={(v) => updateEffect(index, { spread: v })}
                />
              )}
            </div>
          )}
        </div>
      ))}
      <button className="property-add-btn" onClick={addEffect}>
        <Icons.Plus /> Add Effect
      </button>
    </Section>
  );
});

EffectsSection.displayName = 'EffectsSection';

// ============ Typography Section ============

interface TypographySectionProps {
  node: PropertyPanelNode;
  onUpdate: (property: string, value: any) => void;
}

const TypographySection = memo<TypographySectionProps>(({ node, onUpdate }) => {
  if (node.type !== 'TEXT') return null;

  return (
    <Section title="Typography" sectionKey="typography">
      <SelectInput
        label="Font Family"
        value={node.fontFamily || 'Inter'}
        options={[
          { value: 'Inter', label: 'Inter' },
          { value: 'Roboto', label: 'Roboto' },
          { value: 'Open Sans', label: 'Open Sans' },
          { value: 'Poppins', label: 'Poppins' },
          { value: 'SF Pro', label: 'SF Pro' },
        ]}
        onChange={(v) => onUpdate('fontFamily', v)}
      />
      
      <div className="property-grid property-grid--2col">
        <SelectInput
          label="Weight"
          value={String(node.fontWeight || 400)}
          options={[
            { value: '100', label: 'Thin' },
            { value: '300', label: 'Light' },
            { value: '400', label: 'Regular' },
            { value: '500', label: 'Medium' },
            { value: '600', label: 'Semibold' },
            { value: '700', label: 'Bold' },
            { value: '900', label: 'Black' },
          ]}
          onChange={(v) => onUpdate('fontWeight', parseInt(v))}
        />
        <NumberInput
          label="Size"
          value={node.fontSize || 16}
          onChange={(v) => onUpdate('fontSize', v)}
        />
      </div>
      
      <div className="property-grid property-grid--2col">
        <NumberInput
          label="Line Height"
          value={typeof node.lineHeight === 'number' ? node.lineHeight : 1.5}
          onChange={(v) => onUpdate('lineHeight', v)}
        />
        <NumberInput
          label="Letter Spacing"
          value={node.letterSpacing || 0}
          onChange={(v) => onUpdate('letterSpacing', v)}
          suffix="%"
        />
      </div>
      
      <SelectInput
        label="Align"
        value={node.textAlign || 'LEFT'}
        options={[
          { value: 'LEFT', label: 'Left' },
          { value: 'CENTER', label: 'Center' },
          { value: 'RIGHT', label: 'Right' },
          { value: 'JUSTIFIED', label: 'Justified' },
        ]}
        onChange={(v) => onUpdate('textAlign', v)}
      />
    </Section>
  );
});

TypographySection.displayName = 'TypographySection';

// ============ Appearance Section ============

interface AppearanceSectionProps {
  node: PropertyPanelNode;
  onUpdate: (property: string, value: any) => void;
}

const AppearanceSection = memo<AppearanceSectionProps>(({ node, onUpdate }) => {
  return (
    <Section title="Appearance" sectionKey="appearance">
      <NumberInput
        label="Opacity"
        value={node.opacity * 100}
        onChange={(v) => onUpdate('opacity', v / 100)}
        suffix="%"
        min={0}
        max={100}
      />
      
      <SelectInput
        label="Blend Mode"
        value={node.blendMode}
        options={[
          { value: 'NORMAL', label: 'Normal' },
          { value: 'MULTIPLY', label: 'Multiply' },
          { value: 'SCREEN', label: 'Screen' },
          { value: 'OVERLAY', label: 'Overlay' },
          { value: 'DARKEN', label: 'Darken' },
          { value: 'LIGHTEN', label: 'Lighten' },
          { value: 'COLOR_DODGE', label: 'Color Dodge' },
          { value: 'COLOR_BURN', label: 'Color Burn' },
        ]}
        onChange={(v) => onUpdate('blendMode', v)}
      />
    </Section>
  );
});

AppearanceSection.displayName = 'AppearanceSection';

// ============ Main Property Panel ============

export interface PropertyPanelProps {
  className?: string;
  nodes?: PropertyPanelNode[];
  onPropertyChange?: (nodeId: string, property: string, value: any) => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = memo(({
  className = '',
  nodes = [],
  onPropertyChange,
}) => {
  const { selectedNodes, activeTab, setActiveTab, setSelectedNodes } = usePropertyPanelStore();

  // Update selected nodes when prop changes
  React.useEffect(() => {
    if (nodes.length > 0) {
      setSelectedNodes(nodes);
    }
  }, [nodes, setSelectedNodes]);

  const handleUpdate = useCallback((nodeId: string, property: string, value: any) => {
    onPropertyChange?.(nodeId, property, value);
  }, [onPropertyChange]);

  if (selectedNodes.length === 0) {
    return (
      <div className={`property-panel ${className}`}>
        <div className="property-panel__empty">
          <p>Select a layer to view properties</p>
        </div>
      </div>
    );
  }

  const node = selectedNodes[0]; // Single selection for now

  return (
    <div className={`property-panel ${className}`}>
      {/* Header */}
      <div className="property-panel__header">
        <div className="property-panel__tabs">
          <button
            className={`property-panel__tab ${activeTab === 'design' ? 'property-panel__tab--active' : ''}`}
            onClick={() => setActiveTab('design')}
          >
            Design
          </button>
          <button
            className={`property-panel__tab ${activeTab === 'prototype' ? 'property-panel__tab--active' : ''}`}
            onClick={() => setActiveTab('prototype')}
          >
            Prototype
          </button>
          <button
            className={`property-panel__tab ${activeTab === 'code' ? 'property-panel__tab--active' : ''}`}
            onClick={() => setActiveTab('code')}
          >
            Code
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="property-panel__content">
        {activeTab === 'design' && (
          <>
            <TransformSection node={node} onUpdate={(prop, val) => handleUpdate(node.id, prop, val)} />
            <AutoLayoutSection node={node} onUpdate={(prop, val) => handleUpdate(node.id, prop, val)} />
            <FillSection fills={node.fills} onUpdate={(fills) => handleUpdate(node.id, 'fills', fills)} />
            <StrokeSection strokes={node.strokes} onUpdate={(strokes) => handleUpdate(node.id, 'strokes', strokes)} />
            <EffectsSection effects={node.effects} onUpdate={(effects) => handleUpdate(node.id, 'effects', effects)} />
            <TypographySection node={node} onUpdate={(prop, val) => handleUpdate(node.id, prop, val)} />
            <AppearanceSection node={node} onUpdate={(prop, val) => handleUpdate(node.id, prop, val)} />
          </>
        )}
        
        {activeTab === 'prototype' && (
          <div className="property-panel__placeholder">
            <p>Prototype interactions will appear here</p>
          </div>
        )}
        
        {activeTab === 'code' && (
          <div className="property-panel__placeholder">
            <p>Code inspection will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
});

PropertyPanel.displayName = 'PropertyPanel';

// ============ Styles ============

export const propertyPanelStyles = `
.property-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-secondary, #1e1e1e);
  color: var(--text-primary, #ffffff);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 12px;
  user-select: none;
  overflow: hidden;
}

.property-panel__empty,
.property-panel__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #888);
  text-align: center;
  padding: 24px;
}

.property-panel__header {
  border-bottom: 1px solid var(--border-color, #333);
}

.property-panel__tabs {
  display: flex;
}

.property-panel__tab {
  flex: 1;
  padding: 12px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary, #888);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;
}

.property-panel__tab:hover {
  color: var(--text-primary, #fff);
}

.property-panel__tab--active {
  color: var(--text-primary, #fff);
  border-bottom-color: var(--accent-color, #3b82f6);
}

.property-panel__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.property-section {
  border-bottom: 1px solid var(--border-color, #333);
}

.property-section__header {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px;
  background: none;
  border: none;
  color: var(--text-primary, #fff);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

.property-section__header:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.05));
}

.property-section__chevron {
  display: flex;
  margin-right: 8px;
  color: var(--text-secondary, #888);
  transition: transform 0.15s;
}

.property-section__chevron--expanded {
  transform: rotate(0deg);
}

.property-section__title {
  flex: 1;
}

.property-section__content {
  padding: 0 12px 12px;
}

.property-input {
  margin-bottom: 12px;
}

.property-input__label {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary, #888);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-input__control {
  display: flex;
  align-items: center;
  gap: 6px;
}

.property-input__control--color {
  gap: 8px;
}

.property-input__field {
  flex: 1;
  padding: 6px 8px;
  background: var(--input-bg, #2a2a2a);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  outline: none;
}

.property-input__field:focus {
  border-color: var(--focus-color, #3b82f6);
}

.property-input__suffix {
  color: var(--text-secondary, #888);
  font-size: 11px;
}

.property-input__select {
  width: 100%;
  padding: 6px 8px;
  background: var(--input-bg, #2a2a2a);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  color: var(--text-primary, #fff);
  font-size: 12px;
  cursor: pointer;
  outline: none;
}

.property-color-swatch {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.property-grid {
  display: grid;
  gap: 12px;
  margin-bottom: 12px;
}

.property-grid--2col {
  grid-template-columns: 1fr 1fr;
}

.property-padding-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.property-lock-aspect {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.property-lock-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--input-bg, #2a2a2a);
  border: 1px solid var(--border-color, #444);
  border-radius: 4px;
  color: var(--text-secondary, #888);
  cursor: pointer;
}

.property-lock-btn:hover {
  border-color: var(--text-primary, #fff);
  color: var(--text-primary, #fff);
}

.property-lock-btn--active {
  background: var(--accent-color, #3b82f6);
  border-color: var(--accent-color, #3b82f6);
  color: white;
}

.property-list-item {
  margin-bottom: 16px;
  padding: 8px;
  background: var(--input-bg, #2a2a2a);
  border-radius: 6px;
}

.property-list-item__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.property-list-item__toggle {
  display: flex;
  padding: 4px;
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
}

.property-list-item__type {
  flex: 1;
  font-size: 11px;
  color: var(--text-secondary, #888);
  text-transform: uppercase;
}

.property-list-item__remove {
  display: flex;
  padding: 4px;
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
}

.property-list-item__remove:hover {
  color: #ef4444;
}

.property-list-item__content {
  padding-top: 8px;
  border-top: 1px solid var(--border-color, #444);
}

.property-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px;
  background: var(--input-bg, #2a2a2a);
  border: 1px dashed var(--border-color, #444);
  border-radius: 4px;
  color: var(--text-secondary, #888);
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s, color 0.15s;
}

.property-add-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.05));
  color: var(--text-primary, #fff);
}
`;

export default PropertyPanel;
