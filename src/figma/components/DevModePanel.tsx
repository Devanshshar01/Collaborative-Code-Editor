/**
 * DevModePanel - Full Figma-level Dev Mode
 * Code generation, asset inspection, CSS/iOS/Android export, measurement tools
 */

import React, { useState, useMemo, useCallback } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export type CodeLanguage = 'CSS' | 'Tailwind' | 'SwiftUI' | 'Kotlin' | 'Flutter' | 'React' | 'Vue';
export type MeasurementUnit = 'px' | 'pt' | 'dp' | 'rem' | 'em' | '%';

export interface InspectData {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  
  // Position & Size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  
  // Auto Layout
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  primaryAxisAlign?: string;
  counterAxisAlign?: string;
  padding?: { top: number; right: number; bottom: number; left: number };
  gap?: number;
  
  // Constraints
  constraints?: {
    horizontal: string;
    vertical: string;
  };
  
  // Fills
  fills: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    gradient?: any;
    image?: string;
  }>;
  
  // Strokes
  strokes: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    weight: number;
    align: string;
  }>;
  
  // Effects
  effects: Array<{
    type: string;
    color?: { r: number; g: number; b: number; a: number };
    offset?: { x: number; y: number };
    radius: number;
    spread?: number;
  }>;
  
  // Typography (for text nodes)
  typography?: {
    fontFamily: string;
    fontWeight: number;
    fontSize: number;
    lineHeight: number | string;
    letterSpacing: number;
    textAlign: string;
    textDecoration?: string;
    textTransform?: string;
  };
  
  // Corner Radius
  cornerRadius?: number | [number, number, number, number];
  
  // Opacity & Blend
  opacity: number;
  blendMode: string;
  
  // Component info
  componentId?: string;
  componentName?: string;
  isInstance?: boolean;
}

export interface AssetInfo {
  id: string;
  name: string;
  type: 'image' | 'icon' | 'component';
  formats: Array<{
    format: string;
    scale: number;
    size: { width: number; height: number };
  }>;
  exportSettings: any[];
}

export interface MeasurementResult {
  distance: number;
  direction: 'horizontal' | 'vertical';
  fromNodeId: string;
  toNodeId: string;
}

// ============ Code Generation ============

export class CodeGenerator {
  static generate(node: InspectData, language: CodeLanguage): string {
    switch (language) {
      case 'CSS':
        return this.generateCSS(node);
      case 'Tailwind':
        return this.generateTailwind(node);
      case 'SwiftUI':
        return this.generateSwiftUI(node);
      case 'Kotlin':
        return this.generateKotlin(node);
      case 'Flutter':
        return this.generateFlutter(node);
      case 'React':
        return this.generateReact(node);
      case 'Vue':
        return this.generateVue(node);
      default:
        return '';
    }
  }

  private static generateCSS(node: InspectData): string {
    const lines: string[] = [];
    
    lines.push(`.${this.toClassName(node.nodeName)} {`);
    
    // Position & Size
    lines.push(`  width: ${node.width}px;`);
    lines.push(`  height: ${node.height}px;`);
    
    if (node.rotation !== 0) {
      lines.push(`  transform: rotate(${node.rotation}deg);`);
    }
    
    // Flexbox for auto layout
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      lines.push(`  display: flex;`);
      lines.push(`  flex-direction: ${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'};`);
      
      if (node.primaryAxisAlign) {
        const justify = this.mapAlignment(node.primaryAxisAlign);
        lines.push(`  justify-content: ${justify};`);
      }
      
      if (node.counterAxisAlign) {
        const align = this.mapAlignment(node.counterAxisAlign);
        lines.push(`  align-items: ${align};`);
      }
      
      if (node.gap) {
        lines.push(`  gap: ${node.gap}px;`);
      }
    }
    
    // Padding
    if (node.padding) {
      const { top, right, bottom, left } = node.padding;
      if (top === right && right === bottom && bottom === left) {
        lines.push(`  padding: ${top}px;`);
      } else if (top === bottom && left === right) {
        lines.push(`  padding: ${top}px ${left}px;`);
      } else {
        lines.push(`  padding: ${top}px ${right}px ${bottom}px ${left}px;`);
      }
    }
    
    // Background
    if (node.fills.length > 0) {
      const fill = node.fills[0];
      if (fill.type === 'SOLID' && fill.color) {
        lines.push(`  background-color: ${this.rgbaToCSS(fill.color)};`);
      } else if (fill.type.includes('GRADIENT') && fill.gradient) {
        lines.push(`  background: ${this.gradientToCSS(fill)};`);
      }
    }
    
    // Border
    if (node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        lines.push(`  border: ${stroke.weight}px solid ${this.rgbaToCSS(stroke.color)};`);
      }
    }
    
    // Corner Radius
    if (node.cornerRadius) {
      if (typeof node.cornerRadius === 'number') {
        lines.push(`  border-radius: ${node.cornerRadius}px;`);
      } else {
        lines.push(`  border-radius: ${node.cornerRadius.join('px ')}px;`);
      }
    }
    
    // Effects
    const shadows = node.effects.filter(e => e.type.includes('SHADOW'));
    if (shadows.length > 0) {
      const shadowCSS = shadows.map(s => {
        const inset = s.type === 'INNER_SHADOW' ? 'inset ' : '';
        return `${inset}${s.offset?.x || 0}px ${s.offset?.y || 0}px ${s.radius}px ${s.spread || 0}px ${this.rgbaToCSS(s.color || { r: 0, g: 0, b: 0, a: 0.25 })}`;
      }).join(', ');
      lines.push(`  box-shadow: ${shadowCSS};`);
    }
    
    const blurs = node.effects.filter(e => e.type === 'LAYER_BLUR');
    if (blurs.length > 0) {
      lines.push(`  filter: blur(${blurs[0].radius}px);`);
    }
    
    const bgBlurs = node.effects.filter(e => e.type === 'BACKGROUND_BLUR');
    if (bgBlurs.length > 0) {
      lines.push(`  backdrop-filter: blur(${bgBlurs[0].radius}px);`);
    }
    
    // Opacity
    if (node.opacity < 1) {
      lines.push(`  opacity: ${node.opacity};`);
    }
    
    // Blend mode
    if (node.blendMode !== 'NORMAL' && node.blendMode !== 'PASS_THROUGH') {
      lines.push(`  mix-blend-mode: ${node.blendMode.toLowerCase().replace('_', '-')};`);
    }
    
    // Typography
    if (node.typography) {
      const t = node.typography;
      lines.push(`  font-family: '${t.fontFamily}', sans-serif;`);
      lines.push(`  font-size: ${t.fontSize}px;`);
      lines.push(`  font-weight: ${t.fontWeight};`);
      
      if (typeof t.lineHeight === 'number') {
        lines.push(`  line-height: ${t.lineHeight}px;`);
      } else {
        lines.push(`  line-height: ${t.lineHeight};`);
      }
      
      if (t.letterSpacing !== 0) {
        lines.push(`  letter-spacing: ${t.letterSpacing}px;`);
      }
      
      lines.push(`  text-align: ${t.textAlign.toLowerCase()};`);
      
      if (t.textDecoration) {
        lines.push(`  text-decoration: ${t.textDecoration.toLowerCase()};`);
      }
      
      if (t.textTransform) {
        lines.push(`  text-transform: ${t.textTransform.toLowerCase()};`);
      }
    }
    
    lines.push(`}`);
    
    return lines.join('\n');
  }

  private static generateTailwind(node: InspectData): string {
    const classes: string[] = [];
    
    // Size
    classes.push(`w-[${node.width}px]`);
    classes.push(`h-[${node.height}px]`);
    
    // Flexbox
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      classes.push('flex');
      classes.push(node.layoutMode === 'HORIZONTAL' ? 'flex-row' : 'flex-col');
      
      if (node.gap) {
        classes.push(`gap-[${node.gap}px]`);
      }
    }
    
    // Padding
    if (node.padding) {
      const { top, right, bottom, left } = node.padding;
      if (top === right && right === bottom && bottom === left) {
        classes.push(`p-[${top}px]`);
      } else {
        classes.push(`pt-[${top}px]`);
        classes.push(`pr-[${right}px]`);
        classes.push(`pb-[${bottom}px]`);
        classes.push(`pl-[${left}px]`);
      }
    }
    
    // Background
    if (node.fills.length > 0 && node.fills[0].type === 'SOLID' && node.fills[0].color) {
      const hex = this.rgbaToHex(node.fills[0].color);
      classes.push(`bg-[${hex}]`);
    }
    
    // Border
    if (node.strokes.length > 0) {
      const stroke = node.strokes[0];
      classes.push(`border-[${stroke.weight}px]`);
      if (stroke.color) {
        classes.push(`border-[${this.rgbaToHex(stroke.color)}]`);
      }
    }
    
    // Corner Radius
    if (node.cornerRadius) {
      if (typeof node.cornerRadius === 'number') {
        classes.push(`rounded-[${node.cornerRadius}px]`);
      }
    }
    
    // Shadow
    const shadows = node.effects.filter(e => e.type === 'DROP_SHADOW');
    if (shadows.length > 0) {
      classes.push('shadow-lg'); // Simplified
    }
    
    // Opacity
    if (node.opacity < 1) {
      classes.push(`opacity-${Math.round(node.opacity * 100)}`);
    }
    
    // Typography
    if (node.typography) {
      const t = node.typography;
      classes.push(`text-[${t.fontSize}px]`);
      classes.push(`font-[${t.fontWeight}]`);
      classes.push(`leading-[${t.lineHeight}px]`);
    }
    
    return `<div className="${classes.join(' ')}" />`;
  }

  private static generateSwiftUI(node: InspectData): string {
    const lines: string[] = [];
    
    if (node.nodeType === 'TEXT') {
      lines.push(`Text("${node.nodeName}")`);
    } else if (node.fills.length > 0 && node.fills[0].type === 'IMAGE') {
      lines.push(`Image("${node.nodeName}")`);
    } else {
      lines.push(`Rectangle()`);
    }
    
    // Size
    lines.push(`    .frame(width: ${node.width}, height: ${node.height})`);
    
    // Background
    if (node.fills.length > 0 && node.fills[0].type === 'SOLID' && node.fills[0].color) {
      const c = node.fills[0].color;
      lines.push(`    .fill(Color(red: ${c.r.toFixed(3)}, green: ${c.g.toFixed(3)}, blue: ${c.b.toFixed(3)}, opacity: ${c.a.toFixed(3)}))`);
    }
    
    // Corner Radius
    if (node.cornerRadius && typeof node.cornerRadius === 'number') {
      lines.push(`    .cornerRadius(${node.cornerRadius})`);
    }
    
    // Opacity
    if (node.opacity < 1) {
      lines.push(`    .opacity(${node.opacity})`);
    }
    
    // Shadow
    const shadow = node.effects.find(e => e.type === 'DROP_SHADOW');
    if (shadow) {
      lines.push(`    .shadow(color: .black.opacity(0.25), radius: ${shadow.radius}, x: ${shadow.offset?.x || 0}, y: ${shadow.offset?.y || 0})`);
    }
    
    return lines.join('\n');
  }

  private static generateKotlin(node: InspectData): string {
    const lines: string[] = [];
    
    lines.push(`Box(`);
    lines.push(`    modifier = Modifier`);
    lines.push(`        .width(${node.width}.dp)`);
    lines.push(`        .height(${node.height}.dp)`);
    
    // Background
    if (node.fills.length > 0 && node.fills[0].type === 'SOLID' && node.fills[0].color) {
      const c = node.fills[0].color;
      const hex = this.rgbaToHex(c).replace('#', '');
      lines.push(`        .background(Color(0xFF${hex.toUpperCase()}))`);
    }
    
    // Corner Radius
    if (node.cornerRadius && typeof node.cornerRadius === 'number') {
      lines.push(`        .clip(RoundedCornerShape(${node.cornerRadius}.dp))`);
    }
    
    // Border
    if (node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        const hex = this.rgbaToHex(stroke.color).replace('#', '');
        lines.push(`        .border(${stroke.weight}.dp, Color(0xFF${hex.toUpperCase()}))`);
      }
    }
    
    lines.push(`)`);
    
    return lines.join('\n');
  }

  private static generateFlutter(node: InspectData): string {
    const lines: string[] = [];
    
    lines.push(`Container(`);
    lines.push(`  width: ${node.width},`);
    lines.push(`  height: ${node.height},`);
    lines.push(`  decoration: BoxDecoration(`);
    
    // Background
    if (node.fills.length > 0 && node.fills[0].type === 'SOLID' && node.fills[0].color) {
      const c = node.fills[0].color;
      lines.push(`    color: Color.fromRGBO(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a}),`);
    }
    
    // Corner Radius
    if (node.cornerRadius && typeof node.cornerRadius === 'number') {
      lines.push(`    borderRadius: BorderRadius.circular(${node.cornerRadius}),`);
    }
    
    // Border
    if (node.strokes.length > 0) {
      const stroke = node.strokes[0];
      if (stroke.color) {
        const c = stroke.color;
        lines.push(`    border: Border.all(`);
        lines.push(`      color: Color.fromRGBO(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}, ${c.a}),`);
        lines.push(`      width: ${stroke.weight},`);
        lines.push(`    ),`);
      }
    }
    
    // Shadow
    const shadow = node.effects.find(e => e.type === 'DROP_SHADOW');
    if (shadow) {
      lines.push(`    boxShadow: [`);
      lines.push(`      BoxShadow(`);
      lines.push(`        blurRadius: ${shadow.radius},`);
      lines.push(`        offset: Offset(${shadow.offset?.x || 0}, ${shadow.offset?.y || 0}),`);
      lines.push(`      ),`);
      lines.push(`    ],`);
    }
    
    lines.push(`  ),`);
    lines.push(`)`);
    
    return lines.join('\n');
  }

  private static generateReact(node: InspectData): string {
    const lines: string[] = [];
    
    lines.push(`import React from 'react';`);
    lines.push(``);
    lines.push(`const ${this.toComponentName(node.nodeName)} = () => {`);
    lines.push(`  return (`);
    lines.push(`    <div`);
    lines.push(`      style={{`);
    lines.push(`        width: ${node.width},`);
    lines.push(`        height: ${node.height},`);
    
    // Background
    if (node.fills.length > 0 && node.fills[0].type === 'SOLID' && node.fills[0].color) {
      lines.push(`        backgroundColor: '${this.rgbaToCSS(node.fills[0].color)}',`);
    }
    
    // Corner Radius
    if (node.cornerRadius) {
      if (typeof node.cornerRadius === 'number') {
        lines.push(`        borderRadius: ${node.cornerRadius},`);
      }
    }
    
    // Flexbox
    if (node.layoutMode && node.layoutMode !== 'NONE') {
      lines.push(`        display: 'flex',`);
      lines.push(`        flexDirection: '${node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'}',`);
      if (node.gap) {
        lines.push(`        gap: ${node.gap},`);
      }
    }
    
    lines.push(`      }}`);
    lines.push(`    />`);
    lines.push(`  );`);
    lines.push(`};`);
    lines.push(``);
    lines.push(`export default ${this.toComponentName(node.nodeName)};`);
    
    return lines.join('\n');
  }

  private static generateVue(node: InspectData): string {
    const lines: string[] = [];
    
    lines.push(`<template>`);
    lines.push(`  <div :style="containerStyle" />`);
    lines.push(`</template>`);
    lines.push(``);
    lines.push(`<script setup>`);
    lines.push(`const containerStyle = {`);
    lines.push(`  width: '${node.width}px',`);
    lines.push(`  height: '${node.height}px',`);
    
    if (node.fills.length > 0 && node.fills[0].type === 'SOLID' && node.fills[0].color) {
      lines.push(`  backgroundColor: '${this.rgbaToCSS(node.fills[0].color)}',`);
    }
    
    if (node.cornerRadius && typeof node.cornerRadius === 'number') {
      lines.push(`  borderRadius: '${node.cornerRadius}px',`);
    }
    
    lines.push(`};`);
    lines.push(`</script>`);
    
    return lines.join('\n');
  }

  // Helper methods
  private static rgbaToCSS(color: { r: number; g: number; b: number; a: number }): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    
    if (color.a === 1) {
      return `rgb(${r}, ${g}, ${b})`;
    }
    return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
  }

  private static rgbaToHex(color: { r: number; g: number; b: number; a: number }): string {
    const r = Math.round(color.r * 255).toString(16).padStart(2, '0');
    const g = Math.round(color.g * 255).toString(16).padStart(2, '0');
    const b = Math.round(color.b * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  private static gradientToCSS(fill: any): string {
    return 'linear-gradient(to right, #000, #fff)'; // Simplified
  }

  private static mapAlignment(align: string): string {
    const map: Record<string, string> = {
      'MIN': 'flex-start',
      'CENTER': 'center',
      'MAX': 'flex-end',
      'SPACE_BETWEEN': 'space-between',
      'BASELINE': 'baseline',
    };
    return map[align] || 'flex-start';
  }

  private static toClassName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  }

  private static toComponentName(name: string): string {
    return name.split(/[^a-zA-Z0-9]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join('');
  }
}

// ============ Dev Mode Store ============

interface DevModeState {
  // Mode
  isDevMode: boolean;
  
  // Selected language
  language: CodeLanguage;
  
  // Units
  unit: MeasurementUnit;
  
  // Inspect data
  inspectedNode: InspectData | null;
  
  // Measurements
  measurements: MeasurementResult[];
  showMeasurements: boolean;
  
  // Assets
  assets: AssetInfo[];
  
  // Code generation
  generatedCode: string;
  
  // Clipboard
  copiedProperty: string | null;
  
  // Actions
  setDevMode: (enabled: boolean) => void;
  setLanguage: (language: CodeLanguage) => void;
  setUnit: (unit: MeasurementUnit) => void;
  
  inspectNode: (data: InspectData) => void;
  clearInspection: () => void;
  
  measureBetween: (nodeId1: string, nodeId2: string) => void;
  clearMeasurements: () => void;
  toggleMeasurements: () => void;
  
  generateCode: () => void;
  copyCode: () => void;
  copyProperty: (property: string, value: string) => void;
  
  extractAssets: (nodeIds: string[]) => void;
  exportAsset: (assetId: string, format: string, scale: number) => Promise<Blob>;
}

export const useDevMode = create<DevModeState>()(
  subscribeWithSelector((set, get) => ({
    isDevMode: false,
    language: 'CSS',
    unit: 'px',
    inspectedNode: null,
    measurements: [],
    showMeasurements: true,
    assets: [],
    generatedCode: '',
    copiedProperty: null,

    setDevMode: (enabled: boolean) => {
      set({ isDevMode: enabled });
    },

    setLanguage: (language: CodeLanguage) => {
      set({ language });
      get().generateCode();
    },

    setUnit: (unit: MeasurementUnit) => {
      set({ unit });
    },

    inspectNode: (data: InspectData) => {
      set({ inspectedNode: data });
      get().generateCode();
    },

    clearInspection: () => {
      set({ inspectedNode: null, generatedCode: '' });
    },

    measureBetween: (nodeId1: string, nodeId2: string) => {
      // Calculate distance between two nodes
      // Would get node positions from scene graph
      const measurement: MeasurementResult = {
        distance: 100, // Placeholder
        direction: 'horizontal',
        fromNodeId: nodeId1,
        toNodeId: nodeId2,
      };

      set(state => ({
        measurements: [...state.measurements, measurement],
      }));
    },

    clearMeasurements: () => {
      set({ measurements: [] });
    },

    toggleMeasurements: () => {
      set(state => ({ showMeasurements: !state.showMeasurements }));
    },

    generateCode: () => {
      const { inspectedNode, language } = get();
      if (!inspectedNode) {
        set({ generatedCode: '' });
        return;
      }

      const code = CodeGenerator.generate(inspectedNode, language);
      set({ generatedCode: code });
    },

    copyCode: () => {
      const { generatedCode } = get();
      navigator.clipboard.writeText(generatedCode);
    },

    copyProperty: (property: string, value: string) => {
      navigator.clipboard.writeText(value);
      set({ copiedProperty: property });
      
      setTimeout(() => {
        set({ copiedProperty: null });
      }, 2000);
    },

    extractAssets: (nodeIds: string[]) => {
      // Extract assets from selected nodes
      const assets: AssetInfo[] = nodeIds.map(id => ({
        id,
        name: `Asset-${id}`,
        type: 'image' as const,
        formats: [
          { format: 'PNG', scale: 1, size: { width: 100, height: 100 } },
          { format: 'PNG', scale: 2, size: { width: 200, height: 200 } },
          { format: 'SVG', scale: 1, size: { width: 100, height: 100 } },
        ],
        exportSettings: [],
      }));

      set({ assets });
    },

    exportAsset: async (assetId: string, format: string, scale: number) => {
      // Would export the asset
      return new Blob([''], { type: 'image/png' });
    },
  }))
);

// ============ React Components ============

interface DevModePanelProps {
  className?: string;
}

export const DevModePanel: React.FC<DevModePanelProps> = ({ className }) => {
  const {
    isDevMode,
    language,
    unit,
    inspectedNode,
    generatedCode,
    copiedProperty,
    setLanguage,
    setUnit,
    copyCode,
    copyProperty,
  } = useDevMode();

  const [activeTab, setActiveTab] = useState<'inspect' | 'code' | 'assets'>('inspect');

  if (!isDevMode) return null;

  return (
    <div className={`dev-mode-panel ${className || ''}`} style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>Dev Mode</div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as CodeLanguage)}
          style={styles.select}
        >
          <option value="CSS">CSS</option>
          <option value="Tailwind">Tailwind</option>
          <option value="React">React</option>
          <option value="Vue">Vue</option>
          <option value="SwiftUI">SwiftUI</option>
          <option value="Kotlin">Kotlin/Compose</option>
          <option value="Flutter">Flutter</option>
        </select>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === 'inspect' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('inspect')}
        >
          Inspect
        </button>
        <button
          style={activeTab === 'code' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('code')}
        >
          Code
        </button>
        <button
          style={activeTab === 'assets' ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab('assets')}
        >
          Assets
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'inspect' && inspectedNode && (
          <InspectTab
            node={inspectedNode}
            unit={unit}
            copiedProperty={copiedProperty}
            onCopyProperty={copyProperty}
          />
        )}

        {activeTab === 'code' && (
          <CodeTab
            code={generatedCode}
            language={language}
            onCopy={copyCode}
          />
        )}

        {activeTab === 'assets' && (
          <AssetsTab />
        )}
      </div>
    </div>
  );
};

// Sub-components
interface InspectTabProps {
  node: InspectData;
  unit: MeasurementUnit;
  copiedProperty: string | null;
  onCopyProperty: (property: string, value: string) => void;
}

const InspectTab: React.FC<InspectTabProps> = ({ node, unit, copiedProperty, onCopyProperty }) => {
  const formatValue = (value: number): string => {
    switch (unit) {
      case 'pt':
        return `${value * 0.75}pt`;
      case 'dp':
        return `${value}dp`;
      case 'rem':
        return `${value / 16}rem`;
      case '%':
        return `${value}%`;
      default:
        return `${value}px`;
    }
  };

  const PropertyRow: React.FC<{ label: string; value: string; property: string }> = ({ label, value, property }) => (
    <div
      style={styles.propertyRow}
      onClick={() => onCopyProperty(property, value)}
    >
      <span style={styles.propertyLabel}>{label}</span>
      <span style={copiedProperty === property ? styles.copiedValue : styles.propertyValue}>
        {copiedProperty === property ? 'Copied!' : value}
      </span>
    </div>
  );

  return (
    <div style={styles.inspectContent}>
      {/* Node Info */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>{node.nodeName}</div>
        <div style={styles.nodeType}>{node.nodeType}</div>
      </div>

      {/* Layout */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Layout</div>
        <PropertyRow label="Width" value={formatValue(node.width)} property="width" />
        <PropertyRow label="Height" value={formatValue(node.height)} property="height" />
        <PropertyRow label="X" value={formatValue(node.x)} property="x" />
        <PropertyRow label="Y" value={formatValue(node.y)} property="y" />
        {node.rotation !== 0 && (
          <PropertyRow label="Rotation" value={`${node.rotation}°`} property="rotation" />
        )}
      </div>

      {/* Auto Layout */}
      {node.layoutMode && node.layoutMode !== 'NONE' && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Auto Layout</div>
          <PropertyRow label="Direction" value={node.layoutMode} property="layoutMode" />
          {node.gap && <PropertyRow label="Gap" value={formatValue(node.gap)} property="gap" />}
          {node.padding && (
            <PropertyRow
              label="Padding"
              value={`${node.padding.top} ${node.padding.right} ${node.padding.bottom} ${node.padding.left}`}
              property="padding"
            />
          )}
        </div>
      )}

      {/* Fill */}
      {node.fills.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Fill</div>
          {node.fills.map((fill, i) => (
            <div key={i} style={styles.fillPreview}>
              {fill.type === 'SOLID' && fill.color && (
                <>
                  <div
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: `rgba(${fill.color.r * 255}, ${fill.color.g * 255}, ${fill.color.b * 255}, ${fill.color.a})`,
                    }}
                  />
                  <PropertyRow
                    label=""
                    value={`rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a.toFixed(2)})`}
                    property={`fill-${i}`}
                  />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Stroke */}
      {node.strokes.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Stroke</div>
          {node.strokes.map((stroke, i) => (
            <div key={i}>
              <PropertyRow label="Weight" value={`${stroke.weight}px`} property={`stroke-weight-${i}`} />
              {stroke.color && (
                <div style={styles.fillPreview}>
                  <div
                    style={{
                      ...styles.colorSwatch,
                      backgroundColor: `rgba(${stroke.color.r * 255}, ${stroke.color.g * 255}, ${stroke.color.b * 255}, ${stroke.color.a})`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Effects */}
      {node.effects.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Effects</div>
          {node.effects.map((effect, i) => (
            <div key={i}>
              <PropertyRow label="Type" value={effect.type} property={`effect-type-${i}`} />
              <PropertyRow label="Radius" value={`${effect.radius}px`} property={`effect-radius-${i}`} />
            </div>
          ))}
        </div>
      )}

      {/* Typography */}
      {node.typography && (
        <div style={styles.section}>
          <div style={styles.sectionTitle}>Typography</div>
          <PropertyRow label="Font" value={node.typography.fontFamily} property="fontFamily" />
          <PropertyRow label="Size" value={`${node.typography.fontSize}px`} property="fontSize" />
          <PropertyRow label="Weight" value={String(node.typography.fontWeight)} property="fontWeight" />
          <PropertyRow label="Line Height" value={String(node.typography.lineHeight)} property="lineHeight" />
          <PropertyRow label="Letter Spacing" value={`${node.typography.letterSpacing}px`} property="letterSpacing" />
        </div>
      )}
    </div>
  );
};

interface CodeTabProps {
  code: string;
  language: CodeLanguage;
  onCopy: () => void;
}

const CodeTab: React.FC<CodeTabProps> = ({ code, language, onCopy }) => {
  return (
    <div style={styles.codeContent}>
      <div style={styles.codeHeader}>
        <span style={styles.codeLanguage}>{language}</span>
        <button style={styles.copyButton} onClick={onCopy}>
          Copy Code
        </button>
      </div>
      <pre style={styles.codeBlock}>
        <code>{code || 'Select a layer to generate code'}</code>
      </pre>
    </div>
  );
};

const AssetsTab: React.FC = () => {
  const { assets, exportAsset } = useDevMode();

  return (
    <div style={styles.assetsContent}>
      {assets.length === 0 ? (
        <div style={styles.emptyState}>
          Select layers to view exportable assets
        </div>
      ) : (
        assets.map((asset) => (
          <div key={asset.id} style={styles.assetItem}>
            <div style={styles.assetName}>{asset.name}</div>
            <div style={styles.assetFormats}>
              {asset.formats.map((format, i) => (
                <button
                  key={i}
                  style={styles.formatButton}
                  onClick={() => exportAsset(asset.id, format.format, format.scale)}
                >
                  {format.format} {format.scale > 1 ? `@${format.scale}x` : ''}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// ============ Styles ============

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: 320,
    height: '100%',
    backgroundColor: '#1e1e1e',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid #333',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: 12,
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: 600,
    fontSize: 14,
  },
  select: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    border: '1px solid #444',
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 12,
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #333',
  },
  tab: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: 12,
  },
  activeTab: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 12,
    borderBottom: '2px solid #0d99ff',
  },
  content: {
    flex: 1,
    overflow: 'auto',
  },
  inspectContent: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 600,
    marginBottom: 8,
    color: '#fff',
  },
  nodeType: {
    color: '#888',
    fontSize: 11,
  },
  propertyRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    cursor: 'pointer',
  },
  propertyLabel: {
    color: '#888',
  },
  propertyValue: {
    color: '#fff',
    fontFamily: 'monospace',
  },
  copiedValue: {
    color: '#0d99ff',
    fontFamily: 'monospace',
  },
  fillPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  colorSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
    border: '1px solid #444',
  },
  codeContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  codeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    borderBottom: '1px solid #333',
  },
  codeLanguage: {
    color: '#888',
  },
  copyButton: {
    backgroundColor: '#0d99ff',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '4px 12px',
    cursor: 'pointer',
    fontSize: 12,
  },
  codeBlock: {
    flex: 1,
    margin: 0,
    padding: 16,
    overflow: 'auto',
    backgroundColor: '#1a1a1a',
    fontFamily: 'Menlo, Monaco, monospace',
    fontSize: 11,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  assetsContent: {
    padding: 16,
  },
  emptyState: {
    color: '#888',
    textAlign: 'center',
    padding: 32,
  },
  assetItem: {
    padding: 12,
    backgroundColor: '#2d2d2d',
    borderRadius: 6,
    marginBottom: 8,
  },
  assetName: {
    fontWeight: 500,
    marginBottom: 8,
  },
  assetFormats: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  formatButton: {
    backgroundColor: '#3d3d3d',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: 11,
  },
};

export default DevModePanel;
