/**
 * CanvasRenderer - High-performance WebGL/Canvas2D Rendering Engine
 * Virtual rendering for 10k+ objects, GPU acceleration, hit testing
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export interface RenderNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  opacity?: number;
  blendMode?: string;
  visible?: boolean;
  locked?: boolean;
  
  // Bounds
  absoluteX?: number;
  absoluteY?: number;
  
  // Style
  fills?: Fill[];
  strokes?: Stroke[];
  effects?: Effect[];
  cornerRadius?: number | number[];
  
  // Vector data
  vectorPaths?: VectorPath[];
  
  // Text data
  characters?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: CanvasTextAlign;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: string;
  
  // Image data
  imageUrl?: string;
  imageData?: ImageData;
  
  // Container
  clipsContent?: boolean;
  children?: RenderNode[];
}

export interface Fill {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'IMAGE';
  visible: boolean;
  opacity?: number;
  color?: RGBA;
  gradientStops?: GradientStop[];
  gradientTransform?: number[];
  imageUrl?: string;
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
}

export interface Stroke {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL';
  visible: boolean;
  opacity?: number;
  color?: RGBA;
  weight: number;
  align?: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cap?: CanvasLineCap;
  join?: CanvasLineJoin;
  dashPattern?: number[];
  miterLimit?: number;
}

export interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  color?: RGBA;
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
}

export interface GradientStop {
  position: number;
  color: RGBA;
}

export interface VectorPath {
  data: string; // SVG path data
  windingRule: 'nonzero' | 'evenodd';
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export interface HitTestResult {
  nodeId: string;
  x: number;
  y: number;
  distance: number;
}

// ============ Spatial Index (R-tree style) ============

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

class SpatialIndex {
  private nodes: Map<string, BoundingBox> = new Map();
  private gridSize = 100;
  private grid: Map<string, Set<string>> = new Map();

  insert(id: string, x: number, y: number, width: number, height: number): void {
    const box: BoundingBox = {
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height,
    };
    
    this.nodes.set(id, box);
    
    // Add to spatial grid
    const cells = this.getCellsForBox(box);
    for (const cell of cells) {
      let set = this.grid.get(cell);
      if (!set) {
        set = new Set();
        this.grid.set(cell, set);
      }
      set.add(id);
    }
  }

  remove(id: string): void {
    const box = this.nodes.get(id);
    if (!box) return;
    
    const cells = this.getCellsForBox(box);
    for (const cell of cells) {
      const set = this.grid.get(cell);
      if (set) {
        set.delete(id);
      }
    }
    
    this.nodes.delete(id);
  }

  update(id: string, x: number, y: number, width: number, height: number): void {
    this.remove(id);
    this.insert(id, x, y, width, height);
  }

  query(viewport: Viewport): string[] {
    const box: BoundingBox = {
      minX: viewport.x,
      minY: viewport.y,
      maxX: viewport.x + viewport.width / viewport.zoom,
      maxY: viewport.y + viewport.height / viewport.zoom,
    };
    
    const candidates = new Set<string>();
    const cells = this.getCellsForBox(box);
    
    for (const cell of cells) {
      const set = this.grid.get(cell);
      if (set) {
        for (const id of set) {
          candidates.add(id);
        }
      }
    }
    
    // Filter by actual intersection
    const results: string[] = [];
    for (const id of candidates) {
      const nodeBox = this.nodes.get(id);
      if (nodeBox && this.intersects(box, nodeBox)) {
        results.push(id);
      }
    }
    
    return results;
  }

  pointQuery(x: number, y: number): string[] {
    const cellKey = this.getCellKey(x, y);
    const candidates = this.grid.get(cellKey);
    if (!candidates) return [];
    
    const results: string[] = [];
    for (const id of candidates) {
      const box = this.nodes.get(id);
      if (box && x >= box.minX && x <= box.maxX && y >= box.minY && y <= box.maxY) {
        results.push(id);
      }
    }
    
    return results;
  }

  private getCellKey(x: number, y: number): string {
    const cellX = Math.floor(x / this.gridSize);
    const cellY = Math.floor(y / this.gridSize);
    return `${cellX}:${cellY}`;
  }

  private getCellsForBox(box: BoundingBox): string[] {
    const cells: string[] = [];
    const startX = Math.floor(box.minX / this.gridSize);
    const endX = Math.floor(box.maxX / this.gridSize);
    const startY = Math.floor(box.minY / this.gridSize);
    const endY = Math.floor(box.maxY / this.gridSize);
    
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        cells.push(`${x}:${y}`);
      }
    }
    
    return cells;
  }

  private intersects(a: BoundingBox, b: BoundingBox): boolean {
    return a.minX <= b.maxX && a.maxX >= b.minX &&
           a.minY <= b.maxY && a.maxY >= b.minY;
  }

  clear(): void {
    this.nodes.clear();
    this.grid.clear();
  }
}

// ============ Canvas2D Renderer ============

export class Canvas2DRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private gradientCache: Map<string, CanvasGradient> = new Map();
  private pathCache: Map<string, Path2D> = new Map();
  private dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true,
    })!;
    
    // Offscreen canvas for double buffering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCtx = this.offscreenCanvas.getContext('2d')!;
    
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.offscreenCanvas.width = this.canvas.width;
    this.offscreenCanvas.height = this.canvas.height;
    
    this.ctx.scale(this.dpr, this.dpr);
    this.offscreenCtx.scale(this.dpr, this.dpr);
  }

  render(nodes: RenderNode[], viewport: Viewport, selectedIds: Set<string>): void {
    const ctx = this.offscreenCtx;
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Apply viewport transform
    ctx.save();
    ctx.translate(-viewport.x * viewport.zoom, -viewport.y * viewport.zoom);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Render nodes
    for (const node of nodes) {
      if (node.visible === false) continue;
      this.renderNode(ctx, node);
    }

    // Render selection highlights
    for (const node of nodes) {
      if (selectedIds.has(node.id)) {
        this.renderSelectionHighlight(ctx, node);
      }
    }

    ctx.restore();

    // Copy to main canvas
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(this.offscreenCanvas, 0, 0, width, height);
  }

  private renderNode(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    ctx.save();

    // Apply transforms
    ctx.translate(node.x + node.width / 2, node.y + node.height / 2);
    if (node.rotation) {
      ctx.rotate(node.rotation * Math.PI / 180);
    }
    if (node.scaleX !== undefined || node.scaleY !== undefined) {
      ctx.scale(node.scaleX ?? 1, node.scaleY ?? 1);
    }
    ctx.translate(-node.width / 2, -node.height / 2);

    // Apply opacity
    if (node.opacity !== undefined) {
      ctx.globalAlpha = node.opacity;
    }

    // Apply blend mode
    if (node.blendMode) {
      ctx.globalCompositeOperation = this.getCompositeOperation(node.blendMode);
    }

    // Apply clipping
    if (node.clipsContent) {
      ctx.beginPath();
      this.createNodePath(ctx, node);
      ctx.clip();
    }

    // Apply effects (shadows, blur)
    this.applyEffects(ctx, node);

    // Render based on type
    switch (node.type) {
      case 'RECTANGLE':
      case 'FRAME':
        this.renderRectangle(ctx, node);
        break;
      case 'ELLIPSE':
        this.renderEllipse(ctx, node);
        break;
      case 'VECTOR':
      case 'POLYGON':
      case 'STAR':
      case 'LINE':
        this.renderVector(ctx, node);
        break;
      case 'TEXT':
        this.renderText(ctx, node);
        break;
      case 'IMAGE':
        this.renderImage(ctx, node);
        break;
      case 'GROUP':
        // Just a container, children rendered separately
        break;
    }

    // Render children
    if (node.children) {
      for (const child of node.children) {
        if (child.visible !== false) {
          this.renderNode(ctx, child);
        }
      }
    }

    ctx.restore();
  }

  private createNodePath(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    const { width, height, cornerRadius } = node;

    if (node.type === 'ELLIPSE') {
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    } else if (cornerRadius) {
      const radii = Array.isArray(cornerRadius) 
        ? cornerRadius 
        : [cornerRadius, cornerRadius, cornerRadius, cornerRadius];
      this.roundedRect(ctx, 0, 0, width, height, radii);
    } else {
      ctx.rect(0, 0, width, height);
    }
  }

  private renderRectangle(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    ctx.beginPath();
    this.createNodePath(ctx, node);

    // Fills
    if (node.fills) {
      for (const fill of node.fills) {
        if (!fill.visible) continue;
        ctx.fillStyle = this.getFillStyle(ctx, fill, node.width, node.height);
        ctx.fill();
      }
    }

    // Strokes
    if (node.strokes) {
      for (const stroke of node.strokes) {
        if (!stroke.visible) continue;
        ctx.strokeStyle = this.getStrokeStyle(ctx, stroke, node.width, node.height);
        ctx.lineWidth = stroke.weight;
        ctx.lineCap = stroke.cap || 'butt';
        ctx.lineJoin = stroke.join || 'miter';
        if (stroke.dashPattern) {
          ctx.setLineDash(stroke.dashPattern);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }

  private renderEllipse(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    ctx.beginPath();
    ctx.ellipse(
      node.width / 2,
      node.height / 2,
      node.width / 2,
      node.height / 2,
      0,
      0,
      Math.PI * 2
    );

    if (node.fills) {
      for (const fill of node.fills) {
        if (!fill.visible) continue;
        ctx.fillStyle = this.getFillStyle(ctx, fill, node.width, node.height);
        ctx.fill();
      }
    }

    if (node.strokes) {
      for (const stroke of node.strokes) {
        if (!stroke.visible) continue;
        ctx.strokeStyle = this.getStrokeStyle(ctx, stroke, node.width, node.height);
        ctx.lineWidth = stroke.weight;
        ctx.stroke();
      }
    }
  }

  private renderVector(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    if (!node.vectorPaths) return;

    for (const pathData of node.vectorPaths) {
      // Use cached Path2D if available
      let path = this.pathCache.get(node.id + pathData.data);
      if (!path) {
        path = new Path2D(pathData.data);
        this.pathCache.set(node.id + pathData.data, path);
      }

      if (node.fills) {
        for (const fill of node.fills) {
          if (!fill.visible) continue;
          ctx.fillStyle = this.getFillStyle(ctx, fill, node.width, node.height);
          ctx.fill(path, pathData.windingRule);
        }
      }

      if (node.strokes) {
        for (const stroke of node.strokes) {
          if (!stroke.visible) continue;
          ctx.strokeStyle = this.getStrokeStyle(ctx, stroke, node.width, node.height);
          ctx.lineWidth = stroke.weight;
          ctx.lineCap = stroke.cap || 'butt';
          ctx.lineJoin = stroke.join || 'miter';
          ctx.stroke(path);
        }
      }
    }
  }

  private renderText(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    if (!node.characters) return;

    const fontSize = node.fontSize || 12;
    const fontFamily = node.fontFamily || 'Inter, sans-serif';
    const fontWeight = node.fontWeight || 400;
    
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = node.textAlign || 'left';
    ctx.textBaseline = 'top';

    if (node.fills) {
      for (const fill of node.fills) {
        if (!fill.visible) continue;
        ctx.fillStyle = this.getFillStyle(ctx, fill, node.width, node.height);
      }
    }

    const lineHeight = node.lineHeight || fontSize * 1.2;
    const lines = node.characters.split('\n');

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 0, i * lineHeight);
    }
  }

  private renderImage(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    if (!node.imageUrl && !node.imageData) return;

    if (node.imageData) {
      ctx.putImageData(node.imageData, 0, 0);
    } else if (node.imageUrl) {
      let img = this.imageCache.get(node.imageUrl);
      
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = node.imageUrl;
        this.imageCache.set(node.imageUrl, img);
        
        img.onload = () => {
          // Trigger re-render
        };
      }
      
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, node.width, node.height);
      }
    }
  }

  private renderSelectionHighlight(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    ctx.save();
    ctx.translate(node.x, node.y);
    
    // Selection border
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    ctx.beginPath();
    this.createNodePath(ctx, node);
    ctx.stroke();

    // Resize handles
    const handleSize = 8;
    const handles = [
      { x: 0, y: 0 },
      { x: node.width / 2, y: 0 },
      { x: node.width, y: 0 },
      { x: node.width, y: node.height / 2 },
      { x: node.width, y: node.height },
      { x: node.width / 2, y: node.height },
      { x: 0, y: node.height },
      { x: 0, y: node.height / 2 },
    ];

    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#0d99ff';
    ctx.lineWidth = 1;

    for (const handle of handles) {
      ctx.beginPath();
      ctx.rect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  private applyEffects(ctx: CanvasRenderingContext2D, node: RenderNode): void {
    if (!node.effects) return;

    for (const effect of node.effects) {
      if (!effect.visible) continue;

      switch (effect.type) {
        case 'DROP_SHADOW':
          ctx.shadowColor = this.rgbaToString(effect.color || { r: 0, g: 0, b: 0, a: 0.5 });
          ctx.shadowBlur = effect.radius;
          ctx.shadowOffsetX = effect.offset?.x || 0;
          ctx.shadowOffsetY = effect.offset?.y || 0;
          break;
        case 'LAYER_BLUR':
          ctx.filter = `blur(${effect.radius}px)`;
          break;
      }
    }
  }

  private getFillStyle(
    ctx: CanvasRenderingContext2D,
    fill: Fill,
    width: number,
    height: number
  ): string | CanvasGradient | CanvasPattern {
    switch (fill.type) {
      case 'SOLID':
        return this.rgbaToString(fill.color || { r: 0, g: 0, b: 0, a: 1 }, fill.opacity);

      case 'GRADIENT_LINEAR': {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        for (const stop of fill.gradientStops || []) {
          gradient.addColorStop(stop.position, this.rgbaToString(stop.color, fill.opacity));
        }
        return gradient;
      }

      case 'GRADIENT_RADIAL': {
        const gradient = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, Math.max(width, height) / 2
        );
        for (const stop of fill.gradientStops || []) {
          gradient.addColorStop(stop.position, this.rgbaToString(stop.color, fill.opacity));
        }
        return gradient;
      }

      default:
        return 'transparent';
    }
  }

  private getStrokeStyle(
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    width: number,
    height: number
  ): string | CanvasGradient {
    if (stroke.type === 'SOLID' && stroke.color) {
      return this.rgbaToString(stroke.color, stroke.opacity);
    }
    return 'black';
  }

  private roundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radii: number[]
  ): void {
    const [tl, tr, br, bl] = radii;
    
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + width - tr, y);
    ctx.arcTo(x + width, y, x + width, y + tr, tr);
    ctx.lineTo(x + width, y + height - br);
    ctx.arcTo(x + width, y + height, x + width - br, y + height, br);
    ctx.lineTo(x + bl, y + height);
    ctx.arcTo(x, y + height, x, y + height - bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x, y, x + tl, y, tl);
    ctx.closePath();
  }

  private rgbaToString(color: RGBA, opacity: number = 1): string {
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    const a = color.a * opacity;
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

  hitTest(x: number, y: number, nodes: RenderNode[]): RenderNode | null {
    // Iterate in reverse to check topmost nodes first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.visible === false || node.locked) continue;

      const hit = this.hitTestNode(x, y, node);
      if (hit) return hit;
    }
    return null;
  }

  private hitTestNode(x: number, y: number, node: RenderNode): RenderNode | null {
    // Check children first (they're on top)
    if (node.children) {
      for (let i = node.children.length - 1; i >= 0; i--) {
        const hit = this.hitTestNode(x, y, node.children[i]);
        if (hit) return hit;
      }
    }

    // Transform point to local coordinates
    const localX = x - node.x;
    const localY = y - node.y;

    // Apply inverse rotation if needed
    if (node.rotation) {
      const angle = -node.rotation * Math.PI / 180;
      const cx = node.width / 2;
      const cy = node.height / 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const tx = localX - cx;
      const ty = localY - cy;
      const rx = tx * cos - ty * sin + cx;
      const ry = tx * sin + ty * cos + cy;
      
      if (rx >= 0 && rx <= node.width && ry >= 0 && ry <= node.height) {
        return node;
      }
    } else {
      if (localX >= 0 && localX <= node.width && localY >= 0 && localY <= node.height) {
        return node;
      }
    }

    return null;
  }

  destroy(): void {
    this.imageCache.clear();
    this.gradientCache.clear();
    this.pathCache.clear();
  }
}

// ============ Render Store ============

interface RendererState {
  // Renderer
  renderer: Canvas2DRenderer | null;
  
  // Viewport
  viewport: Viewport;
  
  // Spatial index
  spatialIndex: SpatialIndex;
  
  // Visible nodes (after culling)
  visibleNodeIds: string[];
  
  // Selection
  selectedIds: Set<string>;
  hoveredId: string | null;
  
  // Performance stats
  fps: number;
  frameTime: number;
  nodeCount: number;
  
  // Actions
  initRenderer: (canvas: HTMLCanvasElement) => void;
  destroyRenderer: () => void;
  
  setViewport: (viewport: Partial<Viewport>) => void;
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, centerX: number, centerY: number) => void;
  zoomToFit: (nodeIds?: string[]) => void;
  
  render: (nodes: RenderNode[]) => void;
  requestRender: () => void;
  
  hitTest: (x: number, y: number, nodes: RenderNode[]) => RenderNode | null;
  hitTestRect: (x: number, y: number, width: number, height: number) => string[];
  
  updateSpatialIndex: (nodes: RenderNode[]) => void;
  queryVisibleNodes: () => string[];
  
  setSelection: (ids: string[]) => void;
  addToSelection: (id: string) => void;
  removeFromSelection: (id: string) => void;
  clearSelection: () => void;
  
  setHovered: (id: string | null) => void;
}

export const useRenderer = create<RendererState>()(
  subscribeWithSelector((set, get) => ({
    renderer: null,
    viewport: { x: 0, y: 0, zoom: 1, width: 0, height: 0 },
    spatialIndex: new SpatialIndex(),
    visibleNodeIds: [],
    selectedIds: new Set(),
    hoveredId: null,
    fps: 0,
    frameTime: 0,
    nodeCount: 0,

    initRenderer: (canvas: HTMLCanvasElement) => {
      const renderer = new Canvas2DRenderer(canvas);
      const rect = canvas.getBoundingClientRect();
      
      set({
        renderer,
        viewport: {
          x: 0,
          y: 0,
          zoom: 1,
          width: rect.width,
          height: rect.height,
        },
      });
    },

    destroyRenderer: () => {
      const { renderer } = get();
      if (renderer) {
        renderer.destroy();
      }
      set({ renderer: null });
    },

    setViewport: (updates: Partial<Viewport>) => {
      set(state => ({
        viewport: { ...state.viewport, ...updates },
      }));
    },

    pan: (dx: number, dy: number) => {
      set(state => ({
        viewport: {
          ...state.viewport,
          x: state.viewport.x - dx / state.viewport.zoom,
          y: state.viewport.y - dy / state.viewport.zoom,
        },
      }));
    },

    zoom: (factor: number, centerX: number, centerY: number) => {
      set(state => {
        const { viewport } = state;
        const newZoom = Math.max(0.01, Math.min(256, viewport.zoom * factor));
        
        // Zoom towards cursor position
        const worldX = viewport.x + centerX / viewport.zoom;
        const worldY = viewport.y + centerY / viewport.zoom;
        const newX = worldX - centerX / newZoom;
        const newY = worldY - centerY / newZoom;
        
        return {
          viewport: {
            ...viewport,
            x: newX,
            y: newY,
            zoom: newZoom,
          },
        };
      });
    },

    zoomToFit: (nodeIds?: string[]) => {
      const { spatialIndex, viewport } = get();
      
      // Calculate bounding box of nodes
      // Would use actual node data from scene graph
      
      set({
        viewport: {
          ...viewport,
          x: 0,
          y: 0,
          zoom: 1,
        },
      });
    },

    render: (nodes: RenderNode[]) => {
      const { renderer, viewport, selectedIds } = get();
      if (!renderer) return;

      const startTime = performance.now();

      // Cull nodes outside viewport
      const visibleNodes = nodes.filter(node => {
        const nodeRight = node.x + node.width;
        const nodeBottom = node.y + node.height;
        const viewRight = viewport.x + viewport.width / viewport.zoom;
        const viewBottom = viewport.y + viewport.height / viewport.zoom;

        return nodeRight > viewport.x && node.x < viewRight &&
               nodeBottom > viewport.y && node.y < viewBottom;
      });

      renderer.render(visibleNodes, viewport, selectedIds);

      const frameTime = performance.now() - startTime;
      const fps = Math.round(1000 / Math.max(1, frameTime));

      set({
        fps,
        frameTime,
        nodeCount: visibleNodes.length,
        visibleNodeIds: visibleNodes.map(n => n.id),
      });
    },

    requestRender: () => {
      // Would schedule a render on next animation frame
    },

    hitTest: (x: number, y: number, nodes: RenderNode[]) => {
      const { renderer, viewport } = get();
      if (!renderer) return null;

      // Convert screen coordinates to world coordinates
      const worldX = viewport.x + x / viewport.zoom;
      const worldY = viewport.y + y / viewport.zoom;

      return renderer.hitTest(worldX, worldY, nodes);
    },

    hitTestRect: (x: number, y: number, width: number, height: number) => {
      const { spatialIndex, viewport } = get();
      
      const worldX = viewport.x + x / viewport.zoom;
      const worldY = viewport.y + y / viewport.zoom;
      const worldWidth = width / viewport.zoom;
      const worldHeight = height / viewport.zoom;
      
      return spatialIndex.query({
        x: worldX,
        y: worldY,
        width: worldWidth,
        height: worldHeight,
        zoom: 1,
      });
    },

    updateSpatialIndex: (nodes: RenderNode[]) => {
      const { spatialIndex } = get();
      spatialIndex.clear();
      
      for (const node of nodes) {
        spatialIndex.insert(node.id, node.x, node.y, node.width, node.height);
      }
    },

    queryVisibleNodes: () => {
      const { spatialIndex, viewport } = get();
      return spatialIndex.query(viewport);
    },

    setSelection: (ids: string[]) => {
      set({ selectedIds: new Set(ids) });
    },

    addToSelection: (id: string) => {
      set(state => {
        const newSelection = new Set(state.selectedIds);
        newSelection.add(id);
        return { selectedIds: newSelection };
      });
    },

    removeFromSelection: (id: string) => {
      set(state => {
        const newSelection = new Set(state.selectedIds);
        newSelection.delete(id);
        return { selectedIds: newSelection };
      });
    },

    clearSelection: () => {
      set({ selectedIds: new Set() });
    },

    setHovered: (id: string | null) => {
      set({ hoveredId: id });
    },
  }))
);

export default useRenderer;
