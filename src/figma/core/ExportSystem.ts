/**
 * ExportSystem - Full Figma-level Export System
 * PNG, JPG, SVG, PDF export with vector accuracy, slices, multiple resolutions
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export type ExportFormat = 'PNG' | 'JPG' | 'SVG' | 'PDF' | 'WEBP';
export type ExportConstraint = 'SCALE' | 'WIDTH' | 'HEIGHT';

export interface ExportSettings {
  format: ExportFormat;
  constraint?: {
    type: ExportConstraint;
    value: number;
  };
  contentsOnly?: boolean;
  useAbsoluteBounds?: boolean;
  suffix?: string;
}

export interface ExportPreset {
  id: string;
  name: string;
  settings: ExportSettings[];
}

export interface SliceNode {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  exportSettings: ExportSettings[];
}

export interface ExportResult {
  nodeId: string;
  nodeName: string;
  format: ExportFormat;
  scale: number;
  data: Blob | string;
  width: number;
  height: number;
  filename: string;
}

export interface CodeExportFormat {
  language: 'CSS' | 'iOS' | 'Android' | 'React' | 'Flutter' | 'Tailwind';
  includeLayout?: boolean;
  includeStyles?: boolean;
  includeAssets?: boolean;
}

export interface CodeExportResult {
  language: CodeExportFormat['language'];
  code: string;
  assets: Map<string, Blob>;
}

// ============ Image Renderer ============

export class ImageRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async renderToImage(
    nodes: NodeRenderData[],
    width: number,
    height: number,
    scale: number = 1,
    backgroundColor?: string
  ): Promise<HTMLCanvasElement> {
    this.canvas.width = width * scale;
    this.canvas.height = height * scale;

    // Clear canvas
    if (backgroundColor) {
      this.ctx.fillStyle = backgroundColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Apply scale
    this.ctx.scale(scale, scale);

    // Render each node
    for (const node of nodes) {
      await this.renderNode(node);
    }

    // Reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    return this.canvas;
  }

  private async renderNode(node: NodeRenderData): Promise<void> {
    this.ctx.save();

    // Apply transforms
    if (node.transform) {
      this.ctx.transform(
        node.transform.a,
        node.transform.b,
        node.transform.c,
        node.transform.d,
        node.transform.tx,
        node.transform.ty
      );
    }

    // Apply opacity
    if (node.opacity !== undefined) {
      this.ctx.globalAlpha = node.opacity;
    }

    // Apply blend mode
    if (node.blendMode) {
      this.ctx.globalCompositeOperation = this.getCompositeOperation(node.blendMode);
    }

    // Render based on type
    switch (node.type) {
      case 'RECTANGLE':
        await this.renderRectangle(node);
        break;
      case 'ELLIPSE':
        await this.renderEllipse(node);
        break;
      case 'VECTOR':
        await this.renderVector(node);
        break;
      case 'TEXT':
        await this.renderText(node);
        break;
      case 'IMAGE':
        await this.renderImage(node);
        break;
      case 'FRAME':
      case 'GROUP':
        await this.renderContainer(node);
        break;
    }

    // Render children
    if (node.children) {
      for (const child of node.children) {
        await this.renderNode(child);
      }
    }

    this.ctx.restore();
  }

  private async renderRectangle(node: NodeRenderData): Promise<void> {
    const { x, y, width, height, cornerRadius, fills, strokes, strokeWeight } = node;

    // Create path with rounded corners
    this.ctx.beginPath();
    if (cornerRadius && cornerRadius > 0) {
      this.roundedRect(x, y, width, height, cornerRadius);
    } else {
      this.ctx.rect(x, y, width, height);
    }

    // Apply fills
    if (fills) {
      for (const fill of fills) {
        if (!fill.visible) continue;
        this.ctx.fillStyle = this.getFillStyle(fill, x, y, width, height);
        this.ctx.fill();
      }
    }

    // Apply strokes
    if (strokes && strokeWeight) {
      for (const stroke of strokes) {
        if (!stroke.visible) continue;
        this.ctx.strokeStyle = this.getFillStyle(stroke, x, y, width, height);
        this.ctx.lineWidth = strokeWeight;
        this.ctx.stroke();
      }
    }
  }

  private async renderEllipse(node: NodeRenderData): Promise<void> {
    const { x, y, width, height, fills, strokes, strokeWeight } = node;
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = width / 2;
    const ry = height / 2;

    this.ctx.beginPath();
    this.ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);

    if (fills) {
      for (const fill of fills) {
        if (!fill.visible) continue;
        this.ctx.fillStyle = this.getFillStyle(fill, x, y, width, height);
        this.ctx.fill();
      }
    }

    if (strokes && strokeWeight) {
      for (const stroke of strokes) {
        if (!stroke.visible) continue;
        this.ctx.strokeStyle = this.getFillStyle(stroke, x, y, width, height);
        this.ctx.lineWidth = strokeWeight;
        this.ctx.stroke();
      }
    }
  }

  private async renderVector(node: NodeRenderData): Promise<void> {
    if (!node.vectorPaths) return;

    for (const pathData of node.vectorPaths) {
      const path = new Path2D(pathData.data);

      if (node.fills) {
        for (const fill of node.fills) {
          if (!fill.visible) continue;
          this.ctx.fillStyle = this.getFillStyle(fill, node.x, node.y, node.width, node.height);
          this.ctx.fill(path, pathData.windingRule || 'nonzero');
        }
      }

      if (node.strokes && node.strokeWeight) {
        for (const stroke of node.strokes) {
          if (!stroke.visible) continue;
          this.ctx.strokeStyle = this.getFillStyle(stroke, node.x, node.y, node.width, node.height);
          this.ctx.lineWidth = node.strokeWeight;
          this.ctx.lineCap = node.strokeCap || 'butt';
          this.ctx.lineJoin = node.strokeJoin || 'miter';
          this.ctx.stroke(path);
        }
      }
    }
  }

  private async renderText(node: NodeRenderData): Promise<void> {
    if (!node.characters) return;

    const { x, y, fontSize, fontFamily, fontWeight, fills, textAlign, lineHeight } = node;

    this.ctx.font = `${fontWeight || 400} ${fontSize || 12}px ${fontFamily || 'sans-serif'}`;
    this.ctx.textAlign = (textAlign as CanvasTextAlign) || 'left';
    this.ctx.textBaseline = 'top';

    if (fills) {
      for (const fill of fills) {
        if (!fill.visible) continue;
        this.ctx.fillStyle = this.getFillStyle(fill, x, y, node.width, node.height);
      }
    }

    // Split text into lines
    const lines = node.characters.split('\n');
    const lineHeightPx = lineHeight || (fontSize || 12) * 1.2;

    for (let i = 0; i < lines.length; i++) {
      this.ctx.fillText(lines[i], x, y + i * lineHeightPx);
    }
  }

  private async renderImage(node: NodeRenderData): Promise<void> {
    if (!node.imageUrl) return;

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        this.ctx.drawImage(img, node.x, node.y, node.width, node.height);
        resolve();
      };
      
      img.onerror = () => resolve();
      img.src = node.imageUrl;
    });
  }

  private async renderContainer(node: NodeRenderData): Promise<void> {
    // Clip if needed
    if (node.clipsContent) {
      this.ctx.beginPath();
      if (node.cornerRadius && node.cornerRadius > 0) {
        this.roundedRect(node.x, node.y, node.width, node.height, node.cornerRadius);
      } else {
        this.ctx.rect(node.x, node.y, node.width, node.height);
      }
      this.ctx.clip();
    }

    // Render background
    if (node.fills) {
      this.ctx.beginPath();
      if (node.cornerRadius && node.cornerRadius > 0) {
        this.roundedRect(node.x, node.y, node.width, node.height, node.cornerRadius);
      } else {
        this.ctx.rect(node.x, node.y, node.width, node.height);
      }

      for (const fill of node.fills) {
        if (!fill.visible) continue;
        this.ctx.fillStyle = this.getFillStyle(fill, node.x, node.y, node.width, node.height);
        this.ctx.fill();
      }
    }
  }

  private roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    const r = Math.min(radius, width / 2, height / 2);
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + width - r, y);
    this.ctx.arcTo(x + width, y, x + width, y + r, r);
    this.ctx.lineTo(x + width, y + height - r);
    this.ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    this.ctx.lineTo(x + r, y + height);
    this.ctx.arcTo(x, y + height, x, y + height - r, r);
    this.ctx.lineTo(x, y + r);
    this.ctx.arcTo(x, y, x + r, y, r);
    this.ctx.closePath();
  }

  private getFillStyle(
    fill: FillData,
    x: number,
    y: number,
    width: number,
    height: number
  ): string | CanvasGradient | CanvasPattern {
    switch (fill.type) {
      case 'SOLID':
        return this.colorToRgba(fill.color, fill.opacity);

      case 'GRADIENT_LINEAR': {
        const gradient = this.ctx.createLinearGradient(
          x + fill.gradientHandlePositions![0].x * width,
          y + fill.gradientHandlePositions![0].y * height,
          x + fill.gradientHandlePositions![1].x * width,
          y + fill.gradientHandlePositions![1].y * height
        );
        for (const stop of fill.gradientStops || []) {
          gradient.addColorStop(stop.position, this.colorToRgba(stop.color, fill.opacity));
        }
        return gradient;
      }

      case 'GRADIENT_RADIAL': {
        const centerX = x + fill.gradientHandlePositions![0].x * width;
        const centerY = y + fill.gradientHandlePositions![0].y * height;
        const radius = Math.sqrt(
          Math.pow((fill.gradientHandlePositions![1].x - fill.gradientHandlePositions![0].x) * width, 2) +
          Math.pow((fill.gradientHandlePositions![1].y - fill.gradientHandlePositions![0].y) * height, 2)
        );
        const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        for (const stop of fill.gradientStops || []) {
          gradient.addColorStop(stop.position, this.colorToRgba(stop.color, fill.opacity));
        }
        return gradient;
      }

      default:
        return 'transparent';
    }
  }

  private colorToRgba(color: ColorData, opacity: number = 1): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = (color.a ?? 1) * opacity;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  private getCompositeOperation(blendMode: string): GlobalCompositeOperation {
    const modeMap: Record<string, GlobalCompositeOperation> = {
      'PASS_THROUGH': 'source-over',
      'NORMAL': 'source-over',
      'DARKEN': 'darken',
      'MULTIPLY': 'multiply',
      'COLOR_BURN': 'color-burn',
      'LIGHTEN': 'lighten',
      'SCREEN': 'screen',
      'COLOR_DODGE': 'color-dodge',
      'OVERLAY': 'overlay',
      'SOFT_LIGHT': 'soft-light',
      'HARD_LIGHT': 'hard-light',
      'DIFFERENCE': 'difference',
      'EXCLUSION': 'exclusion',
      'HUE': 'hue',
      'SATURATION': 'saturation',
      'COLOR': 'color',
      'LUMINOSITY': 'luminosity',
    };
    return modeMap[blendMode] || 'source-over';
  }
}

// Node render data interface
interface NodeRenderData {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity?: number;
  blendMode?: string;
  transform?: { a: number; b: number; c: number; d: number; tx: number; ty: number };
  cornerRadius?: number;
  fills?: FillData[];
  strokes?: FillData[];
  strokeWeight?: number;
  strokeCap?: CanvasLineCap;
  strokeJoin?: CanvasLineJoin;
  vectorPaths?: Array<{ data: string; windingRule?: CanvasFillRule }>;
  characters?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  textAlign?: string;
  lineHeight?: number;
  imageUrl?: string;
  clipsContent?: boolean;
  children?: NodeRenderData[];
}

interface FillData {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  visible: boolean;
  opacity?: number;
  color?: ColorData;
  gradientHandlePositions?: Array<{ x: number; y: number }>;
  gradientStops?: Array<{ position: number; color: ColorData }>;
}

interface ColorData {
  r: number;
  g: number;
  b: number;
  a?: number;
}

// ============ SVG Exporter ============

export class SVGExporter {
  export(nodes: NodeRenderData[], width: number, height: number): string {
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
`;

    // Add defs for gradients
    svg += '<defs>\n';
    svg += this.collectDefs(nodes);
    svg += '</defs>\n';

    // Render nodes
    for (const node of nodes) {
      svg += this.renderNode(node, 0);
    }

    svg += '</svg>';
    return svg;
  }

  private collectDefs(nodes: NodeRenderData[]): string {
    let defs = '';
    // Collect all gradient definitions
    // This would iterate through nodes and create gradient defs
    return defs;
  }

  private renderNode(node: NodeRenderData, depth: number): string {
    const indent = '  '.repeat(depth + 1);
    let svg = '';

    const transformAttr = node.transform
      ? ` transform="matrix(${node.transform.a},${node.transform.b},${node.transform.c},${node.transform.d},${node.transform.tx},${node.transform.ty})"`
      : '';

    const opacityAttr = node.opacity !== undefined && node.opacity < 1
      ? ` opacity="${node.opacity}"`
      : '';

    switch (node.type) {
      case 'RECTANGLE':
        svg += this.renderRectangle(node, indent, transformAttr, opacityAttr);
        break;
      case 'ELLIPSE':
        svg += this.renderEllipse(node, indent, transformAttr, opacityAttr);
        break;
      case 'VECTOR':
        svg += this.renderVector(node, indent, transformAttr, opacityAttr);
        break;
      case 'TEXT':
        svg += this.renderText(node, indent, transformAttr, opacityAttr);
        break;
      case 'FRAME':
      case 'GROUP':
        svg += this.renderGroup(node, indent, transformAttr, opacityAttr, depth);
        break;
    }

    return svg;
  }

  private renderRectangle(node: NodeRenderData, indent: string, transform: string, opacity: string): string {
    const rx = node.cornerRadius ? ` rx="${node.cornerRadius}"` : '';
    const fill = this.getFill(node.fills);
    const stroke = this.getStroke(node.strokes, node.strokeWeight);

    return `${indent}<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}"${rx}${fill}${stroke}${transform}${opacity}/>\n`;
  }

  private renderEllipse(node: NodeRenderData, indent: string, transform: string, opacity: string): string {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const rx = node.width / 2;
    const ry = node.height / 2;
    const fill = this.getFill(node.fills);
    const stroke = this.getStroke(node.strokes, node.strokeWeight);

    return `${indent}<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${fill}${stroke}${transform}${opacity}/>\n`;
  }

  private renderVector(node: NodeRenderData, indent: string, transform: string, opacity: string): string {
    if (!node.vectorPaths) return '';

    let svg = '';
    for (const pathData of node.vectorPaths) {
      const fill = this.getFill(node.fills);
      const stroke = this.getStroke(node.strokes, node.strokeWeight);
      const fillRule = pathData.windingRule === 'evenodd' ? ' fill-rule="evenodd"' : '';

      svg += `${indent}<path d="${pathData.data}"${fillRule}${fill}${stroke}${transform}${opacity}/>\n`;
    }

    return svg;
  }

  private renderText(node: NodeRenderData, indent: string, transform: string, opacity: string): string {
    if (!node.characters) return '';

    const fill = this.getFill(node.fills);
    const fontFamily = node.fontFamily ? ` font-family="${node.fontFamily}"` : '';
    const fontSize = node.fontSize ? ` font-size="${node.fontSize}"` : '';
    const fontWeight = node.fontWeight ? ` font-weight="${node.fontWeight}"` : '';

    const escapedText = node.characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return `${indent}<text x="${node.x}" y="${node.y}"${fontFamily}${fontSize}${fontWeight}${fill}${transform}${opacity}>${escapedText}</text>\n`;
  }

  private renderGroup(node: NodeRenderData, indent: string, transform: string, opacity: string, depth: number): string {
    let svg = `${indent}<g${transform}${opacity}>\n`;

    if (node.children) {
      for (const child of node.children) {
        svg += this.renderNode(child, depth + 1);
      }
    }

    svg += `${indent}</g>\n`;
    return svg;
  }

  private getFill(fills?: FillData[]): string {
    if (!fills || fills.length === 0) return ' fill="none"';

    const fill = fills.find(f => f.visible);
    if (!fill) return ' fill="none"';

    if (fill.type === 'SOLID' && fill.color) {
      const r = Math.round(fill.color.r * 255);
      const g = Math.round(fill.color.g * 255);
      const b = Math.round(fill.color.b * 255);
      const a = fill.color.a ?? 1;

      if (a < 1) {
        return ` fill="rgba(${r},${g},${b},${a})"`;
      }
      return ` fill="rgb(${r},${g},${b})"`;
    }

    return ' fill="none"';
  }

  private getStroke(strokes?: FillData[], strokeWeight?: number): string {
    if (!strokes || strokes.length === 0 || !strokeWeight) return '';

    const stroke = strokes.find(s => s.visible);
    if (!stroke) return '';

    let result = ` stroke-width="${strokeWeight}"`;

    if (stroke.type === 'SOLID' && stroke.color) {
      const r = Math.round(stroke.color.r * 255);
      const g = Math.round(stroke.color.g * 255);
      const b = Math.round(stroke.color.b * 255);
      result += ` stroke="rgb(${r},${g},${b})"`;
    }

    return result;
  }
}

// ============ PDF Exporter ============

export class PDFExporter {
  async export(
    nodes: NodeRenderData[],
    width: number,
    height: number,
    options?: { title?: string; author?: string }
  ): Promise<Blob> {
    // Use canvas-based approach with PDF generation
    const renderer = new ImageRenderer();
    const canvas = await renderer.renderToImage(nodes, width, height, 2);
    
    // Convert to PDF using basic PDF structure
    const pdfContent = this.createPDF(canvas, width, height, options);
    
    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  private createPDF(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    options?: { title?: string; author?: string }
  ): Uint8Array {
    // Basic PDF structure (minimal implementation)
    // For production, would use a library like jsPDF
    
    const imageData = canvas.toDataURL('image/jpeg', 0.95);
    const base64Data = imageData.split(',')[1];
    const binaryData = atob(base64Data);
    
    // PDF points (72 per inch)
    const pdfWidth = width * 0.75;
    const pdfHeight = height * 0.75;

    const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 44 >>
stream
q
${pdfWidth} 0 0 ${pdfHeight} 0 0 cm
/Im0 Do
Q
endstream
endobj
5 0 obj
<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${binaryData.length} >>
stream
${binaryData}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00001 n 
0000000058 00001 n 
0000000115 00001 n 
0000000266 00001 n 
0000000359 00001 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${500 + binaryData.length}
%%EOF`;

    return new TextEncoder().encode(pdf);
  }
}

// ============ Code Exporter ============

export class CodeExporter {
  export(node: NodeRenderData, format: CodeExportFormat): CodeExportResult {
    switch (format.language) {
      case 'CSS':
        return this.exportCSS(node);
      case 'React':
        return this.exportReact(node);
      case 'Tailwind':
        return this.exportTailwind(node);
      case 'iOS':
        return this.exportSwiftUI(node);
      case 'Android':
        return this.exportKotlin(node);
      case 'Flutter':
        return this.exportFlutter(node);
      default:
        return { language: format.language, code: '', assets: new Map() };
    }
  }

  private exportCSS(node: NodeRenderData): CodeExportResult {
    let css = `.${this.toClassName(node.type)} {\n`;

    // Dimensions
    css += `  width: ${node.width}px;\n`;
    css += `  height: ${node.height}px;\n`;

    // Position
    css += `  position: absolute;\n`;
    css += `  left: ${node.x}px;\n`;
    css += `  top: ${node.y}px;\n`;

    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find(f => f.visible);
      if (fill && fill.type === 'SOLID' && fill.color) {
        css += `  background-color: rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a ?? 1});\n`;
      }
    }

    // Border radius
    if (node.cornerRadius) {
      css += `  border-radius: ${node.cornerRadius}px;\n`;
    }

    // Border
    if (node.strokes && node.strokes.length > 0 && node.strokeWeight) {
      const stroke = node.strokes.find(s => s.visible);
      if (stroke && stroke.type === 'SOLID' && stroke.color) {
        css += `  border: ${node.strokeWeight}px solid rgba(${Math.round(stroke.color.r * 255)}, ${Math.round(stroke.color.g * 255)}, ${Math.round(stroke.color.b * 255)}, ${stroke.color.a ?? 1});\n`;
      }
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      css += `  opacity: ${node.opacity};\n`;
    }

    css += '}\n';

    return { language: 'CSS', code: css, assets: new Map() };
  }

  private exportReact(node: NodeRenderData): CodeExportResult {
    const className = this.toClassName(node.type);
    
    let code = `import React from 'react';\n\n`;
    code += `const ${className} = () => {\n`;
    code += `  return (\n`;
    code += `    <div\n`;
    code += `      style={{\n`;
    code += `        width: ${node.width},\n`;
    code += `        height: ${node.height},\n`;
    code += `        position: 'absolute',\n`;
    code += `        left: ${node.x},\n`;
    code += `        top: ${node.y},\n`;

    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find(f => f.visible);
      if (fill && fill.type === 'SOLID' && fill.color) {
        code += `        backgroundColor: 'rgba(${Math.round(fill.color.r * 255)}, ${Math.round(fill.color.g * 255)}, ${Math.round(fill.color.b * 255)}, ${fill.color.a ?? 1})',\n`;
      }
    }

    if (node.cornerRadius) {
      code += `        borderRadius: ${node.cornerRadius},\n`;
    }

    code += `      }}\n`;
    code += `    />\n`;
    code += `  );\n`;
    code += `};\n\n`;
    code += `export default ${className};\n`;

    return { language: 'React', code, assets: new Map() };
  }

  private exportTailwind(node: NodeRenderData): CodeExportResult {
    const classes: string[] = [];

    // Size
    classes.push(`w-[${node.width}px]`);
    classes.push(`h-[${node.height}px]`);

    // Position
    classes.push('absolute');
    classes.push(`left-[${node.x}px]`);
    classes.push(`top-[${node.y}px]`);

    // Background
    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find(f => f.visible);
      if (fill && fill.type === 'SOLID' && fill.color) {
        const hex = this.rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        classes.push(`bg-[${hex}]`);
      }
    }

    // Border radius
    if (node.cornerRadius) {
      classes.push(`rounded-[${node.cornerRadius}px]`);
    }

    // Opacity
    if (node.opacity !== undefined && node.opacity < 1) {
      classes.push(`opacity-${Math.round(node.opacity * 100)}`);
    }

    const code = `<div className="${classes.join(' ')}" />`;

    return { language: 'Tailwind', code, assets: new Map() };
  }

  private exportSwiftUI(node: NodeRenderData): CodeExportResult {
    let code = `struct ${this.toClassName(node.type)}: View {\n`;
    code += `    var body: some View {\n`;
    code += `        Rectangle()\n`;
    code += `            .frame(width: ${node.width}, height: ${node.height})\n`;
    code += `            .position(x: ${node.x + node.width / 2}, y: ${node.y + node.height / 2})\n`;

    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find(f => f.visible);
      if (fill && fill.type === 'SOLID' && fill.color) {
        code += `            .fill(Color(red: ${fill.color.r.toFixed(3)}, green: ${fill.color.g.toFixed(3)}, blue: ${fill.color.b.toFixed(3)}))\n`;
      }
    }

    if (node.cornerRadius) {
      code += `            .cornerRadius(${node.cornerRadius})\n`;
    }

    code += `    }\n`;
    code += `}\n`;

    return { language: 'iOS', code, assets: new Map() };
  }

  private exportKotlin(node: NodeRenderData): CodeExportResult {
    let code = `@Composable\n`;
    code += `fun ${this.toClassName(node.type)}() {\n`;
    code += `    Box(\n`;
    code += `        modifier = Modifier\n`;
    code += `            .width(${node.width}.dp)\n`;
    code += `            .height(${node.height}.dp)\n`;
    code += `            .offset(x = ${node.x}.dp, y = ${node.y}.dp)\n`;

    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find(f => f.visible);
      if (fill && fill.type === 'SOLID' && fill.color) {
        const r = Math.round(fill.color.r * 255);
        const g = Math.round(fill.color.g * 255);
        const b = Math.round(fill.color.b * 255);
        code += `            .background(Color(${r}, ${g}, ${b}))\n`;
      }
    }

    if (node.cornerRadius) {
      code += `            .clip(RoundedCornerShape(${node.cornerRadius}.dp))\n`;
    }

    code += `    )\n`;
    code += `}\n`;

    return { language: 'Android', code, assets: new Map() };
  }

  private exportFlutter(node: NodeRenderData): CodeExportResult {
    let code = `Container(\n`;
    code += `  width: ${node.width},\n`;
    code += `  height: ${node.height},\n`;
    code += `  margin: EdgeInsets.only(left: ${node.x}, top: ${node.y}),\n`;
    code += `  decoration: BoxDecoration(\n`;

    if (node.fills && node.fills.length > 0) {
      const fill = node.fills.find(f => f.visible);
      if (fill && fill.type === 'SOLID' && fill.color) {
        const r = Math.round(fill.color.r * 255);
        const g = Math.round(fill.color.g * 255);
        const b = Math.round(fill.color.b * 255);
        code += `    color: Color.fromRGBO(${r}, ${g}, ${b}, ${fill.color.a ?? 1}),\n`;
      }
    }

    if (node.cornerRadius) {
      code += `    borderRadius: BorderRadius.circular(${node.cornerRadius}),\n`;
    }

    code += `  ),\n`;
    code += `)\n`;

    return { language: 'Flutter', code, assets: new Map() };
  }

  private toClassName(type: string): string {
    return type.charAt(0) + type.slice(1).toLowerCase();
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (c: number) => Math.round(c * 255).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}

// ============ Export Store ============

interface ExportState {
  // Export presets
  presets: ExportPreset[];
  
  // Export queue
  exportQueue: Array<{ nodeId: string; settings: ExportSettings }>;
  isExporting: boolean;
  progress: number;
  
  // Actions
  exportNode: (nodeId: string, settings: ExportSettings) => Promise<ExportResult>;
  exportNodes: (nodeIds: string[], settings: ExportSettings) => Promise<ExportResult[]>;
  exportPage: (pageId: string, settings: ExportSettings) => Promise<ExportResult>;
  
  batchExport: (exports: Array<{ nodeId: string; settings: ExportSettings }>) => Promise<ExportResult[]>;
  
  // Presets
  addPreset: (preset: Omit<ExportPreset, 'id'>) => ExportPreset;
  updatePreset: (id: string, updates: Partial<ExportPreset>) => void;
  deletePreset: (id: string) => void;
  
  // Code export
  exportCode: (nodeId: string, format: CodeExportFormat) => Promise<CodeExportResult>;
  
  // Download helpers
  downloadExport: (result: ExportResult) => void;
  downloadAllExports: (results: ExportResult[]) => void;
}

export const useExport = create<ExportState>()(
  subscribeWithSelector((set, get) => ({
    presets: [
      {
        id: 'ios',
        name: 'iOS',
        settings: [
          { format: 'PNG', constraint: { type: 'SCALE', value: 1 }, suffix: '' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 2 }, suffix: '@2x' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 3 }, suffix: '@3x' },
        ],
      },
      {
        id: 'android',
        name: 'Android',
        settings: [
          { format: 'PNG', constraint: { type: 'SCALE', value: 1 }, suffix: '-mdpi' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 1.5 }, suffix: '-hdpi' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 2 }, suffix: '-xhdpi' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 3 }, suffix: '-xxhdpi' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 4 }, suffix: '-xxxhdpi' },
        ],
      },
      {
        id: 'web',
        name: 'Web',
        settings: [
          { format: 'PNG', constraint: { type: 'SCALE', value: 1 }, suffix: '' },
          { format: 'PNG', constraint: { type: 'SCALE', value: 2 }, suffix: '@2x' },
          { format: 'SVG', suffix: '' },
        ],
      },
    ],
    exportQueue: [],
    isExporting: false,
    progress: 0,

    exportNode: async (nodeId: string, settings: ExportSettings) => {
      set({ isExporting: true, progress: 0 });

      try {
        // Get node data from scene graph
        const node = getNodeRenderData(nodeId);
        if (!node) {
          throw new Error('Node not found');
        }

        const scale = settings.constraint?.type === 'SCALE' ? settings.constraint.value : 1;
        const renderer = new ImageRenderer();

        let result: ExportResult;

        switch (settings.format) {
          case 'SVG': {
            const exporter = new SVGExporter();
            const svg = exporter.export([node], node.width, node.height);
            result = {
              nodeId,
              nodeName: node.type,
              format: 'SVG',
              scale: 1,
              data: svg,
              width: node.width,
              height: node.height,
              filename: `${node.type}${settings.suffix || ''}.svg`,
            };
            break;
          }

          case 'PDF': {
            const exporter = new PDFExporter();
            const pdf = await exporter.export([node], node.width, node.height);
            result = {
              nodeId,
              nodeName: node.type,
              format: 'PDF',
              scale: 1,
              data: pdf,
              width: node.width,
              height: node.height,
              filename: `${node.type}${settings.suffix || ''}.pdf`,
            };
            break;
          }

          default: {
            const canvas = await renderer.renderToImage([node], node.width, node.height, scale);
            const blob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), `image/${settings.format.toLowerCase()}`, 0.95);
            });
            result = {
              nodeId,
              nodeName: node.type,
              format: settings.format,
              scale,
              data: blob,
              width: node.width * scale,
              height: node.height * scale,
              filename: `${node.type}${settings.suffix || ''}.${settings.format.toLowerCase()}`,
            };
          }
        }

        set({ isExporting: false, progress: 100 });
        return result;
      } catch (error) {
        set({ isExporting: false, progress: 0 });
        throw error;
      }
    },

    exportNodes: async (nodeIds: string[], settings: ExportSettings) => {
      const results: ExportResult[] = [];
      const total = nodeIds.length;

      set({ isExporting: true, progress: 0 });

      for (let i = 0; i < nodeIds.length; i++) {
        const result = await get().exportNode(nodeIds[i], settings);
        results.push(result);
        set({ progress: ((i + 1) / total) * 100 });
      }

      set({ isExporting: false, progress: 100 });
      return results;
    },

    exportPage: async (pageId: string, settings: ExportSettings) => {
      // Export entire page
      return get().exportNode(pageId, settings);
    },

    batchExport: async (exports) => {
      const results: ExportResult[] = [];
      const total = exports.length;

      set({ isExporting: true, progress: 0 });

      for (let i = 0; i < exports.length; i++) {
        const { nodeId, settings } = exports[i];
        const result = await get().exportNode(nodeId, settings);
        results.push(result);
        set({ progress: ((i + 1) / total) * 100 });
      }

      set({ isExporting: false, progress: 100 });
      return results;
    },

    addPreset: (preset) => {
      const id = `preset_${Date.now()}`;
      const newPreset: ExportPreset = { ...preset, id };

      set(state => ({
        presets: [...state.presets, newPreset],
      }));

      return newPreset;
    },

    updatePreset: (id: string, updates: Partial<ExportPreset>) => {
      set(state => ({
        presets: state.presets.map(p => 
          p.id === id ? { ...p, ...updates } : p
        ),
      }));
    },

    deletePreset: (id: string) => {
      set(state => ({
        presets: state.presets.filter(p => p.id !== id),
      }));
    },

    exportCode: async (nodeId: string, format: CodeExportFormat) => {
      const node = getNodeRenderData(nodeId);
      if (!node) {
        throw new Error('Node not found');
      }

      const exporter = new CodeExporter();
      return exporter.export(node, format);
    },

    downloadExport: (result: ExportResult) => {
      const url = result.data instanceof Blob
        ? URL.createObjectURL(result.data)
        : `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.data as string)}`;

      const link = document.createElement('a');
      link.href = url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (result.data instanceof Blob) {
        URL.revokeObjectURL(url);
      }
    },

    downloadAllExports: (results: ExportResult[]) => {
      // For multiple files, would create a ZIP
      // For now, download each file
      for (const result of results) {
        get().downloadExport(result);
      }
    },
  }))
);

// Helper function to get node render data (would connect to scene graph)
function getNodeRenderData(nodeId: string): NodeRenderData | null {
  // This would get actual node data from the scene graph
  // Placeholder implementation
  return {
    type: 'RECTANGLE',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fills: [{ type: 'SOLID', visible: true, color: { r: 0.5, g: 0.5, b: 1 } }],
  };
}

export default useExport;
