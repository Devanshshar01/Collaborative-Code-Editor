/**
 * SceneGraph - Complete Figma-level Scene Graph System
 * Full node types with parent-child relationships, transforms, and properties
 */

import { nanoid } from 'nanoid';

// ============ Base Types ============

export type RGBA = { r: number; g: number; b: number; a: number };
export type Vector2D = { x: number; y: number };
export type Transform = [[number, number, number], [number, number, number]];

export interface Paint {
  type: 'SOLID' | 'GRADIENT_LINEAR' | 'GRADIENT_RADIAL' | 'GRADIENT_ANGULAR' | 'GRADIENT_DIAMOND' | 'IMAGE';
  visible?: boolean;
  opacity?: number;
  color?: RGBA;
  gradientStops?: { position: number; color: RGBA }[];
  gradientTransform?: Transform;
  scaleMode?: 'FILL' | 'FIT' | 'CROP' | 'TILE';
  imageRef?: string;
  blendMode?: BlendMode;
}

export interface Effect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW' | 'LAYER_BLUR' | 'BACKGROUND_BLUR';
  visible: boolean;
  radius: number;
  color?: RGBA;
  offset?: Vector2D;
  spread?: number;
  showShadowBehindNode?: boolean;
}

export interface Stroke {
  paint: Paint;
  weight: number;
  align: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  cap: 'NONE' | 'ROUND' | 'SQUARE';
  join: 'MITER' | 'ROUND' | 'BEVEL';
  dashPattern: number[];
  miterLimit: number;
}

export interface Constraint {
  type: 'MIN' | 'CENTER' | 'MAX' | 'STRETCH' | 'SCALE';
}

export interface Constraints {
  horizontal: Constraint;
  vertical: Constraint;
}

export interface LayoutGrid {
  pattern: 'COLUMNS' | 'ROWS' | 'GRID';
  sectionSize: number;
  visible: boolean;
  color: RGBA;
  alignment: 'MIN' | 'MAX' | 'CENTER' | 'STRETCH';
  gutterSize: number;
  offset: number;
  count: number;
}

export type BlendMode =
  | 'PASS_THROUGH' | 'NORMAL' | 'DARKEN' | 'MULTIPLY' | 'LINEAR_BURN' | 'COLOR_BURN'
  | 'LIGHTEN' | 'SCREEN' | 'LINEAR_DODGE' | 'COLOR_DODGE' | 'OVERLAY' | 'SOFT_LIGHT'
  | 'HARD_LIGHT' | 'DIFFERENCE' | 'EXCLUSION' | 'HUE' | 'SATURATION' | 'COLOR' | 'LUMINOSITY';

export type LayoutMode = 'NONE' | 'HORIZONTAL' | 'VERTICAL';
export type LayoutAlign = 'INHERIT' | 'STRETCH' | 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
export type PrimaryAxisSizing = 'FIXED' | 'AUTO';
export type CounterAxisSizing = 'FIXED' | 'AUTO';
export type PrimaryAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
export type CounterAxisAlign = 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
export type LayoutWrap = 'NO_WRAP' | 'WRAP';

// ============ Node Types ============

export type NodeType =
  | 'DOCUMENT' | 'PAGE' | 'FRAME' | 'GROUP' | 'VECTOR' | 'BOOLEAN_OPERATION'
  | 'STAR' | 'LINE' | 'ELLIPSE' | 'REGULAR_POLYGON' | 'RECTANGLE' | 'TEXT'
  | 'SLICE' | 'COMPONENT' | 'COMPONENT_SET' | 'INSTANCE' | 'STICKY' | 'CONNECTOR'
  | 'SHAPE_WITH_TEXT' | 'CODE_BLOCK' | 'STAMP' | 'WIDGET' | 'EMBED' | 'LINK_UNFURL'
  | 'SECTION' | 'TABLE' | 'TABLE_CELL';

// ============ Base Node ============

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  visible: boolean;
  locked: boolean;
  
  // Parent-child relationships
  parentId: string | null;
  childIds: string[];
  
  // Plugin data
  pluginData: Record<string, string>;
  sharedPluginData: Record<string, Record<string, string>>;
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  lastModifiedBy: string;
}

// ============ Scene Node (with transforms) ============

export interface SceneNode extends BaseNode {
  x: number;
  y: number;
  rotation: number;
  
  absoluteTransform: Transform;
  relativeTransform: Transform;
  
  constrainProportions: boolean;
  layoutAlign: LayoutAlign;
  layoutGrow: number;
  
  // Reactions for prototyping
  reactions: Reaction[];
}

// ============ Container Mixins ============

export interface ChildrenMixin {
  childIds: string[];
}

export interface CornerMixin {
  cornerRadius: number | number[];
  cornerSmoothing: number;
}

export interface RectangleCornerMixin {
  topLeftRadius: number;
  topRightRadius: number;
  bottomRightRadius: number;
  bottomLeftRadius: number;
}

export interface BlendMixin {
  opacity: number;
  blendMode: BlendMode;
  isMask: boolean;
  effects: Effect[];
  effectStyleId?: string;
}

export interface GeometryMixin {
  fills: Paint[];
  strokes: Stroke[];
  strokeWeight: number;
  strokeAlign: 'INSIDE' | 'OUTSIDE' | 'CENTER';
  strokeCap: 'NONE' | 'ROUND' | 'SQUARE';
  strokeJoin: 'MITER' | 'ROUND' | 'BEVEL';
  strokeDashPattern: number[];
  strokeMiterLimit: number;
  fillStyleId?: string;
  strokeStyleId?: string;
}

export interface LayoutMixin {
  layoutMode: LayoutMode;
  primaryAxisSizingMode: PrimaryAxisSizing;
  counterAxisSizingMode: CounterAxisSizing;
  primaryAxisAlignItems: PrimaryAxisAlign;
  counterAxisAlignItems: CounterAxisAlign;
  layoutWrap: LayoutWrap;
  
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  
  itemSpacing: number;
  counterAxisSpacing: number;
  
  horizontalPadding: number;
  verticalPadding: number;
  itemReverseZIndex: boolean;
  strokesIncludedInLayout: boolean;
}

// ============ Frame Node ============

export interface FrameNode extends SceneNode, CornerMixin, BlendMixin, GeometryMixin, LayoutMixin, ChildrenMixin {
  type: 'FRAME';
  width: number;
  height: number;
  
  clipsContent: boolean;
  guides: { axis: 'X' | 'Y'; offset: number }[];
  layoutGrids: LayoutGrid[];
  
  constraints: Constraints;
  
  // Export settings
  exportSettings: ExportSettings[];
  
  // For components
  overflowDirection: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'BOTH';
  numberOfFixedChildren: number;
  overlayPositionType: 'CENTER' | 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT' | 'MANUAL';
  overlayBackground: { type: 'NONE' | 'SOLID_COLOR'; color?: RGBA };
  overlayBackgroundInteraction: 'NONE' | 'CLOSE_ON_CLICK_OUTSIDE';
}

// ============ Group Node ============

export interface GroupNode extends SceneNode, BlendMixin, ChildrenMixin {
  type: 'GROUP';
  width: number;
  height: number;
}

// ============ Rectangle Node ============

export interface RectangleNode extends SceneNode, CornerMixin, RectangleCornerMixin, BlendMixin, GeometryMixin {
  type: 'RECTANGLE';
  width: number;
  height: number;
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Ellipse Node ============

export interface EllipseNode extends SceneNode, BlendMixin, GeometryMixin {
  type: 'ELLIPSE';
  width: number;
  height: number;
  arcData: {
    startingAngle: number;
    endingAngle: number;
    innerRadius: number;
  };
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Line Node ============

export interface LineNode extends SceneNode, BlendMixin, GeometryMixin {
  type: 'LINE';
  width: number;
  height: number;
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Star Node ============

export interface StarNode extends SceneNode, CornerMixin, BlendMixin, GeometryMixin {
  type: 'STAR';
  width: number;
  height: number;
  pointCount: number;
  innerRadius: number;
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Regular Polygon Node ============

export interface RegularPolygonNode extends SceneNode, CornerMixin, BlendMixin, GeometryMixin {
  type: 'REGULAR_POLYGON';
  width: number;
  height: number;
  pointCount: number;
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Vector Node ============

export interface VectorVertex {
  x: number;
  y: number;
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
  strokeJoin?: 'MITER' | 'BEVEL' | 'ROUND';
  cornerRadius?: number;
  handleMirroring?: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
}

export interface VectorSegment {
  start: number;
  end: number;
  tangentStart?: Vector2D;
  tangentEnd?: Vector2D;
}

export interface VectorPath {
  windingRule: 'NONZERO' | 'EVENODD';
  data: string; // SVG path data
}

export interface VectorNetwork {
  vertices: VectorVertex[];
  segments: VectorSegment[];
  regions?: {
    windingRule: 'NONZERO' | 'EVENODD';
    loops: number[][];
    fills?: Paint[];
  }[];
}

export interface VectorNode extends SceneNode, CornerMixin, BlendMixin, GeometryMixin {
  type: 'VECTOR';
  width: number;
  height: number;
  vectorNetwork: VectorNetwork;
  vectorPaths: VectorPath[];
  handleMirroring: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Boolean Operation Node ============

export type BooleanOperationType = 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE';

export interface BooleanOperationNode extends SceneNode, BlendMixin, GeometryMixin, ChildrenMixin {
  type: 'BOOLEAN_OPERATION';
  width: number;
  height: number;
  booleanOperation: BooleanOperationType;
  constraints: Constraints;
  exportSettings: ExportSettings[];
}

// ============ Text Node ============

export type TextCase = 'ORIGINAL' | 'UPPER' | 'LOWER' | 'TITLE' | 'SMALL_CAPS' | 'SMALL_CAPS_FORCED';
export type TextDecoration = 'NONE' | 'UNDERLINE' | 'STRIKETHROUGH';
export type TextAlignHorizontal = 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
export type TextAlignVertical = 'TOP' | 'CENTER' | 'BOTTOM';
export type TextAutoResize = 'NONE' | 'WIDTH_AND_HEIGHT' | 'HEIGHT' | 'TRUNCATE';
export type TextTruncation = 'DISABLED' | 'ENDING';
export type LeadingTrim = 'NONE' | 'CAP_HEIGHT';

export interface TypeStyle {
  fontFamily: string;
  fontPostScriptName?: string;
  paragraphSpacing?: number;
  paragraphIndent?: number;
  listSpacing?: number;
  hangingPunctuation?: boolean;
  hangingList?: boolean;
  italic?: boolean;
  fontWeight: number;
  fontSize: number;
  textCase?: TextCase;
  textDecoration?: TextDecoration;
  textAutoResize?: TextAutoResize;
  textTruncation?: TextTruncation;
  maxLines?: number;
  textAlignHorizontal?: TextAlignHorizontal;
  textAlignVertical?: TextAlignVertical;
  letterSpacing: { value: number; unit: 'PIXELS' | 'PERCENT' };
  lineHeight: { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
  leadingTrim?: LeadingTrim;
  hyperlink?: { type: 'URL' | 'NODE'; value: string };
  opentypeFlags?: Record<string, number>;
}

export interface TextSegment {
  start: number;
  end: number;
  textStyleId?: string;
  fillStyleId?: string;
  fills: Paint[];
  textDecoration: TextDecoration;
  textCase: TextCase;
  lineHeight: { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' };
  letterSpacing: { value: number; unit: 'PIXELS' | 'PERCENT' };
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  hyperlink?: { type: 'URL' | 'NODE'; value: string };
}

export interface TextNode extends SceneNode, BlendMixin {
  type: 'TEXT';
  width: number;
  height: number;
  characters: string;
  textStyleId?: string;
  textAutoResize: TextAutoResize;
  textAlignHorizontal: TextAlignHorizontal;
  textAlignVertical: TextAlignVertical;
  textTruncation: TextTruncation;
  maxLines?: number;
  
  // Character-level styles
  characterStyleOverrides: number[];
  styleOverrideTable: Record<number, Partial<TypeStyle>>;
  
  // Line/paragraph level
  lineTypes: ('ORDERED' | 'UNORDERED' | 'NONE')[];
  lineIndentations: number[];
  
  constraints: Constraints;
  exportSettings: ExportSettings[];
  
  // Mixed properties
  fontName: { family: string; style: string } | { mixed: true };
  fontSize: number | { mixed: true };
  fontWeight: number | { mixed: true };
  textCase: TextCase | { mixed: true };
  textDecoration: TextDecoration | { mixed: true };
  letterSpacing: { value: number; unit: 'PIXELS' | 'PERCENT' } | { mixed: true };
  lineHeight: { value: number; unit: 'PIXELS' | 'PERCENT' | 'AUTO' } | { mixed: true };
  paragraphIndent: number;
  paragraphSpacing: number;
  hangingPunctuation: boolean;
  hangingList: boolean;
  listSpacing: number;
  leadingTrim: LeadingTrim;
  
  fills: Paint[];
}

// ============ Component Node ============

export interface ComponentPropertyDefinition {
  type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
  defaultValue: string | boolean;
  preferredValues?: { type: 'COMPONENT' | 'COMPONENT_SET'; key: string }[];
  variantOptions?: string[];
}

export interface ComponentNode extends FrameNode {
  type: 'COMPONENT';
  componentPropertyDefinitions: Record<string, ComponentPropertyDefinition>;
  key: string;
  description: string;
  documentationLinks: { uri: string }[];
  remote: boolean;
}

// ============ Component Set Node ============

export interface ComponentSetNode extends FrameNode {
  type: 'COMPONENT_SET';
  componentPropertyDefinitions: Record<string, ComponentPropertyDefinition>;
  key: string;
  description: string;
  documentationLinks: { uri: string }[];
}

// ============ Instance Node ============

export interface ComponentProperties {
  [propertyName: string]: {
    type: 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP' | 'VARIANT';
    value: string | boolean;
  };
}

export interface InstanceNode extends FrameNode {
  type: 'INSTANCE';
  componentId: string;
  isExposedInstance: boolean;
  exposedInstances: { name: string; id: string }[];
  componentProperties: ComponentProperties;
  overrides: Override[];
  scaleFactor: number;
}

export interface Override {
  id: string;
  overriddenFields: string[];
}

// ============ Connector Node ============

export interface ConnectorEndpoint {
  endpointNodeId?: string;
  position?: Vector2D;
  magnet?: 'AUTO' | 'TOP' | 'BOTTOM' | 'LEFT' | 'RIGHT' | 'CENTER';
}

export interface ConnectorNode extends SceneNode, BlendMixin, GeometryMixin {
  type: 'CONNECTOR';
  width: number;
  height: number;
  connectorStart: ConnectorEndpoint;
  connectorEnd: ConnectorEndpoint;
  connectorStartStrokeCap: 'NONE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL' | 'TRIANGLE_FILLED' | 'CIRCLE_FILLED' | 'DIAMOND_FILLED';
  connectorEndStrokeCap: 'NONE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL' | 'TRIANGLE_FILLED' | 'CIRCLE_FILLED' | 'DIAMOND_FILLED';
  connectorLineType: 'STRAIGHT' | 'ELBOWED';
  cornerRadius?: number;
  cornerSmoothing?: number;
  textBackground?: { type: 'NONE' | 'SOLID_COLOR'; color?: RGBA };
}

// ============ Slice Node ============

export interface ExportSettings {
  suffix: string;
  format: 'PNG' | 'JPG' | 'SVG' | 'PDF';
  constraint: { type: 'SCALE' | 'WIDTH' | 'HEIGHT'; value: number };
}

export interface SliceNode extends SceneNode {
  type: 'SLICE';
  width: number;
  height: number;
  exportSettings: ExportSettings[];
  absoluteBoundingBox: { x: number; y: number; width: number; height: number };
}

// ============ Prototyping ============

export type TriggerType = 
  | 'ON_CLICK' | 'ON_HOVER' | 'ON_PRESS' | 'ON_DRAG' 
  | 'AFTER_TIMEOUT' | 'MOUSE_ENTER' | 'MOUSE_LEAVE' 
  | 'MOUSE_UP' | 'MOUSE_DOWN' | 'ON_KEY_DOWN';

export type ActionType = 
  | 'NAVIGATE' | 'SWAP' | 'OVERLAY' | 'SCROLL_TO' | 'OPEN_LINK'
  | 'CLOSE' | 'BACK' | 'SET_VARIABLE' | 'CONDITIONAL' | 'NODE';

export type TransitionType = 
  | 'INSTANT' | 'DISSOLVE' | 'SMART_ANIMATE' 
  | 'MOVE_IN' | 'MOVE_OUT' | 'PUSH' | 'SLIDE_IN' | 'SLIDE_OUT';

export type EasingType = 
  | 'LINEAR' | 'EASE_IN' | 'EASE_OUT' | 'EASE_IN_AND_OUT' 
  | 'EASE_IN_BACK' | 'EASE_OUT_BACK' | 'EASE_IN_AND_OUT_BACK'
  | 'CUSTOM_SPRING' | 'CUSTOM_BEZIER' | 'GENTLE' | 'QUICK' | 'BOUNCY' | 'SLOW';

export interface Easing {
  type: EasingType;
  easingFunctionCubicBezier?: { x1: number; y1: number; x2: number; y2: number };
  easingFunctionSpring?: { mass: number; stiffness: number; damping: number };
}

export interface Transition {
  type: TransitionType;
  duration: number;
  easing: Easing;
  direction?: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
  matchLayers?: boolean;
}

export interface Action {
  type: ActionType;
  destinationId?: string | null;
  navigation?: 'NAVIGATE' | 'SWAP' | 'OVERLAY' | 'SCROLL_TO' | 'CHANGE_TO';
  transition?: Transition;
  preserveScrollPosition?: boolean;
  overlayRelativePosition?: Vector2D;
  resetVideoPosition?: boolean;
  resetScrollPosition?: boolean;
  resetInteractiveComponents?: boolean;
  url?: string;
  openInNewTab?: boolean;
}

export interface Reaction {
  trigger: {
    type: TriggerType;
    timeout?: number;
    delay?: number;
    keyCodes?: number[];
  };
  actions: Action[];
}

// ============ Node Factory ============

export function createNode<T extends BaseNode>(type: NodeType, props: Partial<T> = {}): T {
  const baseNode: BaseNode = {
    id: nanoid(),
    name: `${type} ${Date.now() % 1000}`,
    type,
    visible: true,
    locked: false,
    parentId: null,
    childIds: [],
    pluginData: {},
    sharedPluginData: {},
    createdAt: Date.now(),
    updatedAt: Date.now(),
    createdBy: '',
    lastModifiedBy: '',
  };

  const defaultTransform: Transform = [[1, 0, 0], [0, 1, 0]];

  const sceneDefaults = {
    x: 0,
    y: 0,
    rotation: 0,
    absoluteTransform: defaultTransform,
    relativeTransform: defaultTransform,
    constrainProportions: false,
    layoutAlign: 'INHERIT' as LayoutAlign,
    layoutGrow: 0,
    reactions: [],
  };

  const blendDefaults = {
    opacity: 1,
    blendMode: 'NORMAL' as BlendMode,
    isMask: false,
    effects: [],
  };

  const geometryDefaults = {
    fills: [{ type: 'SOLID' as const, color: { r: 0.85, g: 0.85, b: 0.85, a: 1 } }],
    strokes: [],
    strokeWeight: 1,
    strokeAlign: 'CENTER' as const,
    strokeCap: 'NONE' as const,
    strokeJoin: 'MITER' as const,
    strokeDashPattern: [],
    strokeMiterLimit: 4,
  };

  const layoutDefaults = {
    layoutMode: 'NONE' as LayoutMode,
    primaryAxisSizingMode: 'FIXED' as PrimaryAxisSizing,
    counterAxisSizingMode: 'FIXED' as CounterAxisSizing,
    primaryAxisAlignItems: 'MIN' as PrimaryAxisAlign,
    counterAxisAlignItems: 'MIN' as CounterAxisAlign,
    layoutWrap: 'NO_WRAP' as LayoutWrap,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    itemSpacing: 0,
    counterAxisSpacing: 0,
    horizontalPadding: 0,
    verticalPadding: 0,
    itemReverseZIndex: false,
    strokesIncludedInLayout: false,
  };

  const cornerDefaults = {
    cornerRadius: 0,
    cornerSmoothing: 0,
    topLeftRadius: 0,
    topRightRadius: 0,
    bottomRightRadius: 0,
    bottomLeftRadius: 0,
  };

  const constraintDefaults = {
    constraints: {
      horizontal: { type: 'MIN' as const },
      vertical: { type: 'MIN' as const },
    },
  };

  switch (type) {
    case 'FRAME':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...layoutDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        clipsContent: true,
        guides: [],
        layoutGrids: [],
        exportSettings: [],
        overflowDirection: 'NONE',
        numberOfFixedChildren: 0,
        overlayPositionType: 'CENTER',
        overlayBackground: { type: 'NONE' },
        overlayBackgroundInteraction: 'NONE',
        ...props,
      } as T;

    case 'RECTANGLE':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        exportSettings: [],
        ...props,
      } as T;

    case 'ELLIPSE':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        arcData: { startingAngle: 0, endingAngle: Math.PI * 2, innerRadius: 0 },
        exportSettings: [],
        ...props,
      } as T;

    case 'TEXT':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...constraintDefaults,
        width: 100,
        height: 24,
        characters: 'Text',
        textAutoResize: 'WIDTH_AND_HEIGHT',
        textAlignHorizontal: 'LEFT',
        textAlignVertical: 'TOP',
        textTruncation: 'DISABLED',
        characterStyleOverrides: [],
        styleOverrideTable: {},
        lineTypes: [],
        lineIndentations: [],
        exportSettings: [],
        fontName: { family: 'Inter', style: 'Regular' },
        fontSize: 14,
        fontWeight: 400,
        textCase: 'ORIGINAL',
        textDecoration: 'NONE',
        letterSpacing: { value: 0, unit: 'PERCENT' },
        lineHeight: { value: 0, unit: 'AUTO' },
        paragraphIndent: 0,
        paragraphSpacing: 0,
        hangingPunctuation: false,
        hangingList: false,
        listSpacing: 0,
        leadingTrim: 'NONE',
        fills: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
        ...props,
      } as T;

    case 'VECTOR':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        vectorNetwork: { vertices: [], segments: [] },
        vectorPaths: [],
        handleMirroring: 'NONE',
        exportSettings: [],
        ...props,
      } as T;

    case 'GROUP':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        width: 100,
        height: 100,
        ...props,
      } as T;

    case 'COMPONENT':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...layoutDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        clipsContent: true,
        guides: [],
        layoutGrids: [],
        exportSettings: [],
        overflowDirection: 'NONE',
        numberOfFixedChildren: 0,
        overlayPositionType: 'CENTER',
        overlayBackground: { type: 'NONE' },
        overlayBackgroundInteraction: 'NONE',
        componentPropertyDefinitions: {},
        key: nanoid(),
        description: '',
        documentationLinks: [],
        remote: false,
        ...props,
      } as T;

    case 'INSTANCE':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...layoutDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        clipsContent: true,
        guides: [],
        layoutGrids: [],
        exportSettings: [],
        overflowDirection: 'NONE',
        numberOfFixedChildren: 0,
        overlayPositionType: 'CENTER',
        overlayBackground: { type: 'NONE' },
        overlayBackgroundInteraction: 'NONE',
        componentId: '',
        isExposedInstance: false,
        exposedInstances: [],
        componentProperties: {},
        overrides: [],
        scaleFactor: 1,
        ...props,
      } as T;

    case 'BOOLEAN_OPERATION':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        booleanOperation: 'UNION',
        exportSettings: [],
        ...props,
      } as T;

    case 'LINE':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...constraintDefaults,
        width: 100,
        height: 0,
        exportSettings: [],
        strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
        strokeWeight: 2,
        ...props,
      } as T;

    case 'STAR':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        pointCount: 5,
        innerRadius: 0.382,
        exportSettings: [],
        ...props,
      } as T;

    case 'REGULAR_POLYGON':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        ...cornerDefaults,
        ...constraintDefaults,
        width: 100,
        height: 100,
        pointCount: 6,
        exportSettings: [],
        ...props,
      } as T;

    case 'SLICE':
      return {
        ...baseNode,
        ...sceneDefaults,
        width: 100,
        height: 100,
        exportSettings: [],
        absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 100 },
        ...props,
      } as T;

    case 'CONNECTOR':
      return {
        ...baseNode,
        ...sceneDefaults,
        ...blendDefaults,
        ...geometryDefaults,
        width: 100,
        height: 100,
        connectorStart: {},
        connectorEnd: {},
        connectorStartStrokeCap: 'NONE',
        connectorEndStrokeCap: 'ARROW_LINES',
        connectorLineType: 'STRAIGHT',
        strokes: [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }],
        strokeWeight: 2,
        ...props,
      } as T;

    default:
      return {
        ...baseNode,
        ...sceneDefaults,
        ...props,
      } as T;
  }
}

// ============ Scene Graph Manager ============

export class SceneGraphManager {
  private nodes: Map<string, BaseNode> = new Map();
  private documentId: string;
  private pageIds: string[] = [];

  constructor() {
    this.documentId = nanoid();
  }

  // Node CRUD operations
  addNode(node: BaseNode): void {
    this.nodes.set(node.id, node);
    
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent && 'childIds' in parent) {
        (parent as any).childIds.push(node.id);
      }
    }
  }

  removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Remove from parent's children
    if (node.parentId) {
      const parent = this.nodes.get(node.parentId);
      if (parent && 'childIds' in parent) {
        (parent as any).childIds = (parent as any).childIds.filter((id: string) => id !== nodeId);
      }
    }

    // Recursively remove children
    if ('childIds' in node) {
      [...(node as any).childIds].forEach((childId: string) => {
        this.removeNode(childId);
      });
    }

    this.nodes.delete(nodeId);
  }

  getNode<T extends BaseNode>(nodeId: string): T | undefined {
    return this.nodes.get(nodeId) as T | undefined;
  }

  updateNode(nodeId: string, updates: Partial<BaseNode>): void {
    const node = this.nodes.get(nodeId);
    if (node) {
      Object.assign(node, updates, { updatedAt: Date.now() });
    }
  }

  // Tree operations
  getChildren(nodeId: string): BaseNode[] {
    const node = this.nodes.get(nodeId);
    if (!node || !('childIds' in node)) return [];
    return (node as any).childIds.map((id: string) => this.nodes.get(id)).filter(Boolean);
  }

  getParent(nodeId: string): BaseNode | undefined {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parentId) return undefined;
    return this.nodes.get(node.parentId);
  }

  getAncestors(nodeId: string): BaseNode[] {
    const ancestors: BaseNode[] = [];
    let current = this.getParent(nodeId);
    while (current) {
      ancestors.push(current);
      current = this.getParent(current.id);
    }
    return ancestors;
  }

  getDescendants(nodeId: string): BaseNode[] {
    const descendants: BaseNode[] = [];
    const collect = (id: string) => {
      const children = this.getChildren(id);
      children.forEach(child => {
        descendants.push(child);
        collect(child.id);
      });
    };
    collect(nodeId);
    return descendants;
  }

  // Reparenting
  reparent(nodeId: string, newParentId: string, index?: number): void {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Remove from old parent
    if (node.parentId) {
      const oldParent = this.nodes.get(node.parentId);
      if (oldParent && 'childIds' in oldParent) {
        (oldParent as any).childIds = (oldParent as any).childIds.filter((id: string) => id !== nodeId);
      }
    }

    // Add to new parent
    const newParent = this.nodes.get(newParentId);
    if (newParent && 'childIds' in newParent) {
      if (index !== undefined) {
        (newParent as any).childIds.splice(index, 0, nodeId);
      } else {
        (newParent as any).childIds.push(nodeId);
      }
    }

    node.parentId = newParentId;
  }

  // Reorder within parent
  reorder(nodeId: string, newIndex: number): void {
    const node = this.nodes.get(nodeId);
    if (!node || !node.parentId) return;

    const parent = this.nodes.get(node.parentId);
    if (!parent || !('childIds' in parent)) return;

    const childIds = (parent as any).childIds as string[];
    const currentIndex = childIds.indexOf(nodeId);
    if (currentIndex === -1) return;

    childIds.splice(currentIndex, 1);
    childIds.splice(newIndex, 0, nodeId);
  }

  // Clone with new IDs
  clone(nodeId: string, deep = true): BaseNode | undefined {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;

    const clonedNode = {
      ...JSON.parse(JSON.stringify(node)),
      id: nanoid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (deep && 'childIds' in node) {
      clonedNode.childIds = (node as any).childIds.map((childId: string) => {
        const clonedChild = this.clone(childId, true);
        if (clonedChild) {
          clonedChild.parentId = clonedNode.id;
          this.addNode(clonedChild);
          return clonedChild.id;
        }
        return null;
      }).filter(Boolean);
    }

    return clonedNode;
  }

  // Flatten to array
  getAllNodes(): BaseNode[] {
    return Array.from(this.nodes.values());
  }

  // Export
  toJSON(): object {
    return {
      documentId: this.documentId,
      pageIds: this.pageIds,
      nodes: Object.fromEntries(this.nodes),
    };
  }

  // Import
  fromJSON(data: any): void {
    this.documentId = data.documentId;
    this.pageIds = data.pageIds;
    this.nodes.clear();
    Object.entries(data.nodes).forEach(([id, node]) => {
      this.nodes.set(id, node as BaseNode);
    });
  }
}

export default SceneGraphManager;
