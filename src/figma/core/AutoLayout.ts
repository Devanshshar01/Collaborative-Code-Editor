/**
 * AutoLayout - Full Figma-level Auto Layout System
 * Horizontal/Vertical layouts, padding, spacing, constraints, responsive resizing
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';
export type LayoutAlign = 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
export type PrimaryAxisSizing = 'FIXED' | 'AUTO';
export type CounterAxisSizing = 'FIXED' | 'AUTO';
export type PrimaryAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
export type CounterAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
export type LayoutWrap = 'NO_WRAP' | 'WRAP';
export type ConstraintType = 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Constraints {
  horizontal: ConstraintType;
  vertical: ConstraintType;
}

export interface LayoutProps {
  // Layout mode
  layoutMode: LayoutMode;
  
  // Primary axis (direction of flow)
  primaryAxisSizingMode: PrimaryAxisSizing;
  primaryAxisAlignItems: PrimaryAxisAlign;
  
  // Counter axis (perpendicular to flow)
  counterAxisSizingMode: CounterAxisSizing;
  counterAxisAlignItems: CounterAxisAlign;
  
  // Wrapping
  layoutWrap: LayoutWrap;
  
  // Spacing
  itemSpacing: number;
  counterAxisSpacing: number; // For wrapped items
  
  // Padding
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  
  // Layout options
  itemReverseZIndex: boolean;
  strokesIncludedInLayout: boolean;
  
  // Absolute positioning within auto-layout
  layoutPositioning?: 'AUTO' | 'ABSOLUTE';
}

export interface LayoutChild {
  id: string;
  width: number;
  height: number;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
  
  // How child aligns within parent
  layoutAlign: LayoutAlign;
  
  // How much the child grows to fill available space
  layoutGrow: number;
  
  // Constraints for non-auto-layout parents
  constraints: Constraints;
  
  // Absolute positioning
  layoutPositioning: 'AUTO' | 'ABSOLUTE';
  absoluteX?: number;
  absoluteY?: number;
}

export interface LayoutResult {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============ Layout Engine ============

export class LayoutEngine {
  /**
   * Calculate layout for a frame and its children
   */
  static calculateLayout(
    frame: LayoutProps & { width: number; height: number },
    children: LayoutChild[]
  ): LayoutResult[] {
    if (frame.layoutMode === 'NONE') {
      return this.calculateConstraintLayout(frame, children);
    }

    if (frame.layoutWrap === 'WRAP') {
      return this.calculateWrappedLayout(frame, children);
    }

    return this.calculateAutoLayout(frame, children);
  }

  /**
   * Calculate auto layout (horizontal or vertical)
   */
  private static calculateAutoLayout(
    frame: LayoutProps & { width: number; height: number },
    children: LayoutChild[]
  ): LayoutResult[] {
    const isHorizontal = frame.layoutMode === 'HORIZONTAL';
    const results: LayoutResult[] = [];

    // Filter out absolutely positioned children
    const flowChildren = children.filter(c => c.layoutPositioning !== 'ABSOLUTE');
    const absoluteChildren = children.filter(c => c.layoutPositioning === 'ABSOLUTE');

    // Calculate available space
    const availableWidth = frame.width - frame.paddingLeft - frame.paddingRight;
    const availableHeight = frame.height - frame.paddingTop - frame.paddingBottom;

    // Primary axis size
    const primaryAvailable = isHorizontal ? availableWidth : availableHeight;
    const counterAvailable = isHorizontal ? availableHeight : availableWidth;

    // Calculate total fixed size and grow factors
    let totalFixedSize = 0;
    let totalGrow = 0;

    for (const child of flowChildren) {
      const childSize = isHorizontal ? child.width : child.height;
      
      if (child.layoutGrow > 0) {
        totalGrow += child.layoutGrow;
      } else {
        totalFixedSize += childSize;
      }
    }

    // Add spacing between items
    const totalSpacing = Math.max(0, flowChildren.length - 1) * frame.itemSpacing;
    totalFixedSize += totalSpacing;

    // Calculate available space for growing items
    const growSpace = Math.max(0, primaryAvailable - totalFixedSize);

    // Position children
    let primaryOffset = isHorizontal ? frame.paddingLeft : frame.paddingTop;

    // Handle primary axis alignment
    if (frame.primaryAxisAlignItems === 'CENTER') {
      const totalContentSize = this.calculateTotalSize(flowChildren, isHorizontal, growSpace, totalGrow);
      primaryOffset += (primaryAvailable - totalContentSize) / 2;
    } else if (frame.primaryAxisAlignItems === 'MAX') {
      const totalContentSize = this.calculateTotalSize(flowChildren, isHorizontal, growSpace, totalGrow);
      primaryOffset += primaryAvailable - totalContentSize;
    }

    // Layout each child
    for (let i = 0; i < flowChildren.length; i++) {
      const child = flowChildren[i];

      // Calculate child size
      let childWidth = child.width;
      let childHeight = child.height;

      if (child.layoutGrow > 0) {
        const growAmount = (growSpace * child.layoutGrow) / totalGrow;
        if (isHorizontal) {
          childWidth = growAmount;
        } else {
          childHeight = growAmount;
        }
      }

      // Handle counter axis alignment
      if (child.layoutAlign === 'STRETCH') {
        if (isHorizontal) {
          childHeight = counterAvailable;
        } else {
          childWidth = counterAvailable;
        }
      }

      // Apply min/max constraints
      if (child.minWidth !== undefined) childWidth = Math.max(childWidth, child.minWidth);
      if (child.maxWidth !== undefined) childWidth = Math.min(childWidth, child.maxWidth);
      if (child.minHeight !== undefined) childHeight = Math.max(childHeight, child.minHeight);
      if (child.maxHeight !== undefined) childHeight = Math.min(childHeight, child.maxHeight);

      // Calculate counter axis offset
      let counterOffset = isHorizontal ? frame.paddingTop : frame.paddingLeft;
      const childCounterSize = isHorizontal ? childHeight : childWidth;

      switch (child.layoutAlign) {
        case 'CENTER':
          counterOffset += (counterAvailable - childCounterSize) / 2;
          break;
        case 'MAX':
          counterOffset += counterAvailable - childCounterSize;
          break;
        case 'BASELINE':
          // TODO: Implement baseline alignment for text
          break;
      }

      // Also consider counter axis alignment of parent
      if (child.layoutAlign === 'INHERIT') {
        switch (frame.counterAxisAlignItems) {
          case 'CENTER':
            counterOffset += (counterAvailable - childCounterSize) / 2;
            break;
          case 'MAX':
            counterOffset += counterAvailable - childCounterSize;
            break;
        }
      }

      // Calculate final position
      const x = isHorizontal ? primaryOffset : counterOffset;
      const y = isHorizontal ? counterOffset : primaryOffset;

      results.push({
        id: child.id,
        x,
        y,
        width: childWidth,
        height: childHeight,
      });

      // Move primary offset
      primaryOffset += (isHorizontal ? childWidth : childHeight) + frame.itemSpacing;
    }

    // Handle space-between distribution
    if (frame.primaryAxisAlignItems === 'SPACE_BETWEEN' && flowChildren.length > 1) {
      const totalContentSize = this.calculateTotalSize(flowChildren, isHorizontal, growSpace, totalGrow) - totalSpacing;
      const extraSpace = primaryAvailable - totalContentSize;
      const spaceBetween = extraSpace / (flowChildren.length - 1);

      let offset = isHorizontal ? frame.paddingLeft : frame.paddingTop;
      for (const result of results) {
        if (isHorizontal) {
          result.x = offset;
          offset += result.width + spaceBetween;
        } else {
          result.y = offset;
          offset += result.height + spaceBetween;
        }
      }
    }

    // Layout absolute children
    for (const child of absoluteChildren) {
      results.push({
        id: child.id,
        x: child.absoluteX ?? 0,
        y: child.absoluteY ?? 0,
        width: child.width,
        height: child.height,
      });
    }

    return results;
  }

  /**
   * Calculate wrapped auto layout
   */
  private static calculateWrappedLayout(
    frame: LayoutProps & { width: number; height: number },
    children: LayoutChild[]
  ): LayoutResult[] {
    const isHorizontal = frame.layoutMode === 'HORIZONTAL';
    const results: LayoutResult[] = [];

    const availableWidth = frame.width - frame.paddingLeft - frame.paddingRight;
    const availableHeight = frame.height - frame.paddingTop - frame.paddingBottom;
    const primaryAvailable = isHorizontal ? availableWidth : availableHeight;

    // Group children into rows/columns
    const lines: LayoutChild[][] = [];
    let currentLine: LayoutChild[] = [];
    let currentLineSize = 0;

    for (const child of children) {
      const childSize = isHorizontal ? child.width : child.height;

      if (currentLine.length > 0 && currentLineSize + childSize + frame.itemSpacing > primaryAvailable) {
        // Start new line
        lines.push(currentLine);
        currentLine = [child];
        currentLineSize = childSize;
      } else {
        currentLine.push(child);
        currentLineSize += (currentLine.length > 1 ? frame.itemSpacing : 0) + childSize;
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Layout each line
    let counterOffset = isHorizontal ? frame.paddingTop : frame.paddingLeft;

    for (const line of lines) {
      // Find max counter size in this line
      let maxCounterSize = 0;
      for (const child of line) {
        const counterSize = isHorizontal ? child.height : child.width;
        maxCounterSize = Math.max(maxCounterSize, counterSize);
      }

      // Layout children in this line
      let primaryOffset = isHorizontal ? frame.paddingLeft : frame.paddingTop;

      // Handle primary axis alignment for this line
      const lineSize = this.calculateLineSize(line, isHorizontal, frame.itemSpacing);
      if (frame.primaryAxisAlignItems === 'CENTER') {
        primaryOffset += (primaryAvailable - lineSize) / 2;
      } else if (frame.primaryAxisAlignItems === 'MAX') {
        primaryOffset += primaryAvailable - lineSize;
      }

      for (const child of line) {
        const childWidth = isHorizontal ? child.width : (child.layoutAlign === 'STRETCH' ? maxCounterSize : child.width);
        const childHeight = isHorizontal ? (child.layoutAlign === 'STRETCH' ? maxCounterSize : child.height) : child.height;

        // Counter axis alignment within line
        let childCounterOffset = counterOffset;
        const childCounterSize = isHorizontal ? childHeight : childWidth;

        switch (child.layoutAlign) {
          case 'CENTER':
            childCounterOffset += (maxCounterSize - childCounterSize) / 2;
            break;
          case 'MAX':
            childCounterOffset += maxCounterSize - childCounterSize;
            break;
        }

        const x = isHorizontal ? primaryOffset : childCounterOffset;
        const y = isHorizontal ? childCounterOffset : primaryOffset;

        results.push({
          id: child.id,
          x,
          y,
          width: childWidth,
          height: childHeight,
        });

        primaryOffset += (isHorizontal ? childWidth : childHeight) + frame.itemSpacing;
      }

      counterOffset += maxCounterSize + frame.counterAxisSpacing;
    }

    return results;
  }

  /**
   * Calculate constraint-based layout (non-auto-layout)
   */
  private static calculateConstraintLayout(
    frame: { width: number; height: number },
    children: LayoutChild[]
  ): LayoutResult[] {
    const results: LayoutResult[] = [];

    for (const child of children) {
      let x = 0;
      let y = 0;
      let width = child.width;
      let height = child.height;

      // Horizontal constraints
      switch (child.constraints.horizontal) {
        case 'MIN':
          x = 0; // Keep at left
          break;
        case 'CENTER':
          x = (frame.width - width) / 2;
          break;
        case 'MAX':
          x = frame.width - width;
          break;
        case 'STRETCH':
          x = 0;
          width = frame.width;
          break;
        case 'SCALE':
          // Scale proportionally - would need original frame size
          break;
      }

      // Vertical constraints
      switch (child.constraints.vertical) {
        case 'MIN':
          y = 0; // Keep at top
          break;
        case 'CENTER':
          y = (frame.height - height) / 2;
          break;
        case 'MAX':
          y = frame.height - height;
          break;
        case 'STRETCH':
          y = 0;
          height = frame.height;
          break;
        case 'SCALE':
          // Scale proportionally
          break;
      }

      // Apply min/max constraints
      if (child.minWidth !== undefined) width = Math.max(width, child.minWidth);
      if (child.maxWidth !== undefined) width = Math.min(width, child.maxWidth);
      if (child.minHeight !== undefined) height = Math.max(height, child.minHeight);
      if (child.maxHeight !== undefined) height = Math.min(height, child.maxHeight);

      results.push({ id: child.id, x, y, width, height });
    }

    return results;
  }

  /**
   * Calculate hugged size (content-based sizing)
   */
  static calculateHuggedSize(
    frame: LayoutProps,
    children: LayoutChild[]
  ): { width: number; height: number } {
    if (frame.layoutMode === 'NONE') {
      // For non-auto-layout, find bounding box of children
      let maxRight = 0;
      let maxBottom = 0;

      for (const child of children) {
        maxRight = Math.max(maxRight, child.width);
        maxBottom = Math.max(maxBottom, child.height);
      }

      return { width: maxRight, height: maxBottom };
    }

    const isHorizontal = frame.layoutMode === 'HORIZONTAL';

    let primarySize = 0;
    let counterSize = 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childPrimary = isHorizontal ? child.width : child.height;
      const childCounter = isHorizontal ? child.height : child.width;

      if (i > 0) {
        primarySize += frame.itemSpacing;
      }
      primarySize += childPrimary;
      counterSize = Math.max(counterSize, childCounter);
    }

    // Add padding
    const totalPaddingPrimary = isHorizontal
      ? frame.paddingLeft + frame.paddingRight
      : frame.paddingTop + frame.paddingBottom;
    const totalPaddingCounter = isHorizontal
      ? frame.paddingTop + frame.paddingBottom
      : frame.paddingLeft + frame.paddingRight;

    return {
      width: isHorizontal ? primarySize + totalPaddingPrimary : counterSize + totalPaddingCounter,
      height: isHorizontal ? counterSize + totalPaddingCounter : primarySize + totalPaddingPrimary,
    };
  }

  /**
   * Apply responsive resizing when parent frame changes size
   */
  static applyResponsiveResize(
    child: LayoutChild & { x: number; y: number },
    oldParentSize: { width: number; height: number },
    newParentSize: { width: number; height: number }
  ): LayoutResult {
    let x = child.x;
    let y = child.y;
    let width = child.width;
    let height = child.height;

    const deltaWidth = newParentSize.width - oldParentSize.width;
    const deltaHeight = newParentSize.height - oldParentSize.height;
    const scaleX = newParentSize.width / oldParentSize.width;
    const scaleY = newParentSize.height / oldParentSize.height;

    // Horizontal constraint
    switch (child.constraints.horizontal) {
      case 'MIN':
        // Left edge stays fixed
        break;
      case 'CENTER':
        x += deltaWidth / 2;
        break;
      case 'MAX':
        x += deltaWidth;
        break;
      case 'STRETCH':
        // Both edges stay fixed, width changes
        width += deltaWidth;
        break;
      case 'SCALE':
        x *= scaleX;
        width *= scaleX;
        break;
    }

    // Vertical constraint
    switch (child.constraints.vertical) {
      case 'MIN':
        // Top edge stays fixed
        break;
      case 'CENTER':
        y += deltaHeight / 2;
        break;
      case 'MAX':
        y += deltaHeight;
        break;
      case 'STRETCH':
        height += deltaHeight;
        break;
      case 'SCALE':
        y *= scaleY;
        height *= scaleY;
        break;
    }

    // Apply min/max constraints
    if (child.minWidth !== undefined) width = Math.max(width, child.minWidth);
    if (child.maxWidth !== undefined) width = Math.min(width, child.maxWidth);
    if (child.minHeight !== undefined) height = Math.max(height, child.minHeight);
    if (child.maxHeight !== undefined) height = Math.min(height, child.maxHeight);

    return { id: child.id, x, y, width, height };
  }

  private static calculateTotalSize(
    children: LayoutChild[],
    isHorizontal: boolean,
    growSpace: number,
    totalGrow: number
  ): number {
    let size = 0;
    for (const child of children) {
      if (child.layoutGrow > 0) {
        size += (growSpace * child.layoutGrow) / totalGrow;
      } else {
        size += isHorizontal ? child.width : child.height;
      }
    }
    return size;
  }

  private static calculateLineSize(
    children: LayoutChild[],
    isHorizontal: boolean,
    spacing: number
  ): number {
    let size = 0;
    for (let i = 0; i < children.length; i++) {
      if (i > 0) size += spacing;
      size += isHorizontal ? children[i].width : children[i].height;
    }
    return size;
  }
}

// ============ Auto Layout Store ============

interface AutoLayoutState {
  // Layout cache
  layoutCache: Map<string, LayoutResult[]>;
  
  // Actions
  setLayoutMode: (nodeId: string, mode: LayoutMode) => void;
  setLayoutDirection: (nodeId: string, direction: 'HORIZONTAL' | 'VERTICAL') => void;
  setSpacing: (nodeId: string, spacing: number) => void;
  setPadding: (nodeId: string, padding: Partial<Padding>) => void;
  setUniformPadding: (nodeId: string, value: number) => void;
  
  setAlignItems: (nodeId: string, primary: PrimaryAxisAlign, counter: CounterAxisAlign) => void;
  setSizingMode: (nodeId: string, primary: PrimaryAxisSizing, counter: CounterAxisSizing) => void;
  setLayoutWrap: (nodeId: string, wrap: LayoutWrap) => void;
  
  setChildLayoutAlign: (nodeId: string, align: LayoutAlign) => void;
  setChildLayoutGrow: (nodeId: string, grow: number) => void;
  setChildConstraints: (nodeId: string, constraints: Constraints) => void;
  
  calculateLayout: (frameId: string, frame: LayoutProps & { width: number; height: number }, children: LayoutChild[]) => LayoutResult[];
  calculateHuggedSize: (frame: LayoutProps, children: LayoutChild[]) => { width: number; height: number };
  
  applyAutoLayoutToSelection: (selection: string[], direction: LayoutMode) => void;
  removeAutoLayout: (nodeId: string) => void;
  
  // Grid layout
  addGridLayout: (nodeId: string, columns: number, rows: number, gap: number) => void;
  
  // Distribute and align
  distributeHorizontally: (nodeIds: string[]) => void;
  distributeVertically: (nodeIds: string[]) => void;
  alignLeft: (nodeIds: string[]) => void;
  alignCenter: (nodeIds: string[]) => void;
  alignRight: (nodeIds: string[]) => void;
  alignTop: (nodeIds: string[]) => void;
  alignMiddle: (nodeIds: string[]) => void;
  alignBottom: (nodeIds: string[]) => void;
}

// Node positions cache for alignment/distribution
const nodePositionsCache = new Map<string, { x: number; y: number; width: number; height: number }>();

export const useAutoLayout = create<AutoLayoutState>()(
  subscribeWithSelector((set, get) => ({
    layoutCache: new Map(),

    setLayoutMode: (nodeId: string, mode: LayoutMode) => {
      // This would typically update the node in the scene graph
      // Dispatch update to scene graph store
    },

    setLayoutDirection: (nodeId: string, direction: 'HORIZONTAL' | 'VERTICAL') => {
      // Update direction
    },

    setSpacing: (nodeId: string, spacing: number) => {
      // Update spacing
    },

    setPadding: (nodeId: string, padding: Partial<Padding>) => {
      // Update padding
    },

    setUniformPadding: (nodeId: string, value: number) => {
      // Update all padding values
    },

    setAlignItems: (nodeId: string, primary: PrimaryAxisAlign, counter: CounterAxisAlign) => {
      // Update alignment
    },

    setSizingMode: (nodeId: string, primary: PrimaryAxisSizing, counter: CounterAxisSizing) => {
      // Update sizing mode
    },

    setLayoutWrap: (nodeId: string, wrap: LayoutWrap) => {
      // Update wrap mode
    },

    setChildLayoutAlign: (nodeId: string, align: LayoutAlign) => {
      // Update child alignment
    },

    setChildLayoutGrow: (nodeId: string, grow: number) => {
      // Update grow factor
    },

    setChildConstraints: (nodeId: string, constraints: Constraints) => {
      // Update constraints
    },

    calculateLayout: (
      frameId: string,
      frame: LayoutProps & { width: number; height: number },
      children: LayoutChild[]
    ) => {
      const results = LayoutEngine.calculateLayout(frame, children);
      
      set(state => {
        const newCache = new Map(state.layoutCache);
        newCache.set(frameId, results);
        return { layoutCache: newCache };
      });
      
      return results;
    },

    calculateHuggedSize: (frame: LayoutProps, children: LayoutChild[]) => {
      return LayoutEngine.calculateHuggedSize(frame, children);
    },

    applyAutoLayoutToSelection: (selection: string[], direction: LayoutMode) => {
      // Create auto-layout frame from selection
      // Group selected nodes into a frame with auto-layout
    },

    removeAutoLayout: (nodeId: string) => {
      // Remove auto-layout from frame (keep children with absolute positions)
    },

    addGridLayout: (nodeId: string, columns: number, rows: number, gap: number) => {
      // Apply grid layout settings
    },

    distributeHorizontally: (nodeIds: string[]) => {
      if (nodeIds.length < 3) return;
      
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length < 3) return;
      
      // Sort by x position
      const sorted = [...positions].sort((a, b) => a!.x - b!.x);
      const first = sorted[0]!;
      const last = sorted[sorted.length - 1]!;
      
      const totalWidth = last.x + last.width - first.x;
      const childrenWidth = positions.reduce((sum, p) => sum + p!.width, 0);
      const spacing = (totalWidth - childrenWidth) / (positions.length - 1);
      
      let currentX = first.x;
      for (const pos of sorted) {
        // Update position in scene graph
        currentX += pos!.width + spacing;
      }
    },

    distributeVertically: (nodeIds: string[]) => {
      if (nodeIds.length < 3) return;
      
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length < 3) return;
      
      const sorted = [...positions].sort((a, b) => a!.y - b!.y);
      const first = sorted[0]!;
      const last = sorted[sorted.length - 1]!;
      
      const totalHeight = last.y + last.height - first.y;
      const childrenHeight = positions.reduce((sum, p) => sum + p!.height, 0);
      const spacing = (totalHeight - childrenHeight) / (positions.length - 1);
      
      let currentY = first.y;
      for (const pos of sorted) {
        currentY += pos!.height + spacing;
      }
    },

    alignLeft: (nodeIds: string[]) => {
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length === 0) return;
      
      const minX = Math.min(...positions.map(p => p!.x));
      for (const pos of positions) {
        // Update x to minX
      }
    },

    alignCenter: (nodeIds: string[]) => {
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length === 0) return;
      
      const centers = positions.map(p => p!.x + p!.width / 2);
      const avgCenter = centers.reduce((a, b) => a + b, 0) / centers.length;
      
      for (const pos of positions) {
        // Update x so center is at avgCenter
      }
    },

    alignRight: (nodeIds: string[]) => {
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length === 0) return;
      
      const maxRight = Math.max(...positions.map(p => p!.x + p!.width));
      for (const pos of positions) {
        // Update x so right edge is at maxRight
      }
    },

    alignTop: (nodeIds: string[]) => {
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length === 0) return;
      
      const minY = Math.min(...positions.map(p => p!.y));
      for (const pos of positions) {
        // Update y to minY
      }
    },

    alignMiddle: (nodeIds: string[]) => {
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length === 0) return;
      
      const middles = positions.map(p => p!.y + p!.height / 2);
      const avgMiddle = middles.reduce((a, b) => a + b, 0) / middles.length;
      
      for (const pos of positions) {
        // Update y so middle is at avgMiddle
      }
    },

    alignBottom: (nodeIds: string[]) => {
      const positions = nodeIds.map(id => nodePositionsCache.get(id)).filter(Boolean);
      if (positions.length === 0) return;
      
      const maxBottom = Math.max(...positions.map(p => p!.y + p!.height));
      for (const pos of positions) {
        // Update y so bottom edge is at maxBottom
      }
    },
  }))
);

// ============ React Hooks ============

export function useLayoutForFrame(
  frameId: string,
  frame: LayoutProps & { width: number; height: number } | null,
  children: LayoutChild[]
): LayoutResult[] {
  const { calculateLayout, layoutCache } = useAutoLayout();

  if (!frame) return [];

  // Check cache first
  const cached = layoutCache.get(frameId);
  if (cached) return cached;

  // Calculate and cache
  return calculateLayout(frameId, frame, children);
}

export default useAutoLayout;
