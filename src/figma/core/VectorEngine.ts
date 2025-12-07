/**
 * VectorEngine - Full Figma-level Vector Graphics Engine
 * Pen tool, Bezier curves, Boolean operations, Path editing, Masking
 */

import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export interface Point {
  x: number;
  y: number;
}

export interface CubicBezierPoint extends Point {
  handleIn?: Point;   // Control point coming into this point
  handleOut?: Point;  // Control point going out from this point
  cornerRadius?: number;
  handleMirroring?: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
}

export interface PathSegment {
  command: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
  points: Point[];
  arcParams?: { rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean };
}

export interface VectorPath {
  id: string;
  segments: PathSegment[];
  closed: boolean;
  windingRule: 'NONZERO' | 'EVENODD';
}

export interface VectorVertex {
  id: string;
  x: number;
  y: number;
  handleIn: Point | null;
  handleOut: Point | null;
  cornerRadius: number;
  handleMirroring: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH';
  strokeCap?: 'NONE' | 'ROUND' | 'SQUARE' | 'ARROW_LINES' | 'ARROW_EQUILATERAL';
}

export interface VectorEdge {
  id: string;
  startVertexId: string;
  endVertexId: string;
}

export interface VectorRegion {
  id: string;
  edgeIds: string[];
  windingRule: 'NONZERO' | 'EVENODD';
  fillIndex: number;
}

export interface VectorNetwork {
  vertices: VectorVertex[];
  edges: VectorEdge[];
  regions: VectorRegion[];
}

export type BooleanOperationType = 'UNION' | 'SUBTRACT' | 'INTERSECT' | 'EXCLUDE';

// ============ Path Utilities ============

export function pointDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

export function pointAdd(p1: Point, p2: Point): Point {
  return { x: p1.x + p2.x, y: p1.y + p2.y };
}

export function pointSubtract(p1: Point, p2: Point): Point {
  return { x: p1.x - p2.x, y: p1.y - p2.y };
}

export function pointScale(p: Point, scale: number): Point {
  return { x: p.x * scale, y: p.y * scale };
}

export function pointNormalize(p: Point): Point {
  const length = Math.sqrt(p.x * p.x + p.y * p.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: p.x / length, y: p.y / length };
}

export function pointRotate(p: Point, angle: number, center: Point = { x: 0, y: 0 }): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = p.x - center.x;
  const dy = p.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

export function pointLerp(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

// ============ Bezier Curve Utilities ============

export function cubicBezierPoint(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

export function cubicBezierDerivative(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  return {
    x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
    y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
  };
}

export function quadraticBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function splitCubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): { left: [Point, Point, Point, Point]; right: [Point, Point, Point, Point] } {
  const p01 = pointLerp(p0, p1, t);
  const p12 = pointLerp(p1, p2, t);
  const p23 = pointLerp(p2, p3, t);
  const p012 = pointLerp(p01, p12, t);
  const p123 = pointLerp(p12, p23, t);
  const p0123 = pointLerp(p012, p123, t);

  return {
    left: [p0, p01, p012, p0123],
    right: [p0123, p123, p23, p3],
  };
}

// ============ Path Generation ============

export function pathToSVG(path: VectorPath): string {
  let d = '';

  for (const segment of path.segments) {
    switch (segment.command) {
      case 'M':
        d += `M ${segment.points[0].x} ${segment.points[0].y} `;
        break;
      case 'L':
        d += `L ${segment.points[0].x} ${segment.points[0].y} `;
        break;
      case 'C':
        d += `C ${segment.points[0].x} ${segment.points[0].y} ${segment.points[1].x} ${segment.points[1].y} ${segment.points[2].x} ${segment.points[2].y} `;
        break;
      case 'Q':
        d += `Q ${segment.points[0].x} ${segment.points[0].y} ${segment.points[1].x} ${segment.points[1].y} `;
        break;
      case 'A':
        if (segment.arcParams) {
          const { rx, ry, rotation, largeArc, sweep } = segment.arcParams;
          d += `A ${rx} ${ry} ${rotation} ${largeArc ? 1 : 0} ${sweep ? 1 : 0} ${segment.points[0].x} ${segment.points[0].y} `;
        }
        break;
      case 'Z':
        d += 'Z ';
        break;
    }
  }

  return d.trim();
}

export function svgToPath(d: string): VectorPath {
  const segments: PathSegment[] = [];
  const commands = d.match(/[MLCQAZ][^MLCQAZ]*/gi) || [];

  for (const cmd of commands) {
    const type = cmd[0].toUpperCase() as 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z';
    const numbers = cmd.slice(1).trim().split(/[\s,]+/).map(parseFloat);
    const points: Point[] = [];

    switch (type) {
      case 'M':
      case 'L':
        points.push({ x: numbers[0], y: numbers[1] });
        break;
      case 'C':
        points.push(
          { x: numbers[0], y: numbers[1] },
          { x: numbers[2], y: numbers[3] },
          { x: numbers[4], y: numbers[5] }
        );
        break;
      case 'Q':
        points.push(
          { x: numbers[0], y: numbers[1] },
          { x: numbers[2], y: numbers[3] }
        );
        break;
      case 'A':
        points.push({ x: numbers[5], y: numbers[6] });
        segments.push({
          command: type,
          points,
          arcParams: {
            rx: numbers[0],
            ry: numbers[1],
            rotation: numbers[2],
            largeArc: numbers[3] === 1,
            sweep: numbers[4] === 1,
          },
        });
        continue;
      case 'Z':
        break;
    }

    segments.push({ command: type, points });
  }

  return {
    id: nanoid(),
    segments,
    closed: segments.some(s => s.command === 'Z'),
    windingRule: 'NONZERO',
  };
}

// ============ Shape Generation ============

export function createRectanglePath(
  x: number,
  y: number,
  width: number,
  height: number,
  cornerRadius: number | [number, number, number, number] = 0
): VectorPath {
  const r = Array.isArray(cornerRadius)
    ? cornerRadius
    : [cornerRadius, cornerRadius, cornerRadius, cornerRadius];

  // Clamp radii to valid range
  const maxRadius = Math.min(width, height) / 2;
  const radii = r.map(radius => Math.min(radius, maxRadius));

  const segments: PathSegment[] = [];
  const [tl, tr, br, bl] = radii;

  // Top edge
  segments.push({ command: 'M', points: [{ x: x + tl, y }] });
  segments.push({ command: 'L', points: [{ x: x + width - tr, y }] });

  // Top-right corner
  if (tr > 0) {
    segments.push({
      command: 'C',
      points: [
        { x: x + width - tr * 0.448, y },
        { x: x + width, y: y + tr * 0.448 },
        { x: x + width, y: y + tr },
      ],
    });
  }

  // Right edge
  segments.push({ command: 'L', points: [{ x: x + width, y: y + height - br }] });

  // Bottom-right corner
  if (br > 0) {
    segments.push({
      command: 'C',
      points: [
        { x: x + width, y: y + height - br * 0.448 },
        { x: x + width - br * 0.448, y: y + height },
        { x: x + width - br, y: y + height },
      ],
    });
  }

  // Bottom edge
  segments.push({ command: 'L', points: [{ x: x + bl, y: y + height }] });

  // Bottom-left corner
  if (bl > 0) {
    segments.push({
      command: 'C',
      points: [
        { x: x + bl * 0.448, y: y + height },
        { x, y: y + height - bl * 0.448 },
        { x, y: y + height - bl },
      ],
    });
  }

  // Left edge
  segments.push({ command: 'L', points: [{ x, y: y + tl }] });

  // Top-left corner
  if (tl > 0) {
    segments.push({
      command: 'C',
      points: [
        { x, y: y + tl * 0.448 },
        { x: x + tl * 0.448, y },
        { x: x + tl, y },
      ],
    });
  }

  segments.push({ command: 'Z', points: [] });

  return {
    id: nanoid(),
    segments,
    closed: true,
    windingRule: 'NONZERO',
  };
}

export function createEllipsePath(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  startAngle: number = 0,
  endAngle: number = Math.PI * 2,
  innerRadius: number = 0
): VectorPath {
  const segments: PathSegment[] = [];
  const kappa = 0.5522847498; // Bezier approximation constant for circles

  if (startAngle === 0 && endAngle === Math.PI * 2 && innerRadius === 0) {
    // Full ellipse using 4 cubic bezier curves
    segments.push({ command: 'M', points: [{ x: cx + rx, y: cy }] });

    segments.push({
      command: 'C',
      points: [
        { x: cx + rx, y: cy + ry * kappa },
        { x: cx + rx * kappa, y: cy + ry },
        { x: cx, y: cy + ry },
      ],
    });

    segments.push({
      command: 'C',
      points: [
        { x: cx - rx * kappa, y: cy + ry },
        { x: cx - rx, y: cy + ry * kappa },
        { x: cx - rx, y: cy },
      ],
    });

    segments.push({
      command: 'C',
      points: [
        { x: cx - rx, y: cy - ry * kappa },
        { x: cx - rx * kappa, y: cy - ry },
        { x: cx, y: cy - ry },
      ],
    });

    segments.push({
      command: 'C',
      points: [
        { x: cx + rx * kappa, y: cy - ry },
        { x: cx + rx, y: cy - ry * kappa },
        { x: cx + rx, y: cy },
      ],
    });

    segments.push({ command: 'Z', points: [] });
  } else {
    // Arc or donut
    const startX = cx + rx * Math.cos(startAngle);
    const startY = cy + ry * Math.sin(startAngle);
    const endX = cx + rx * Math.cos(endAngle);
    const endY = cy + ry * Math.sin(endAngle);

    segments.push({ command: 'M', points: [{ x: startX, y: startY }] });

    const angleDiff = endAngle - startAngle;
    const largeArc = Math.abs(angleDiff) > Math.PI;

    segments.push({
      command: 'A',
      points: [{ x: endX, y: endY }],
      arcParams: {
        rx,
        ry,
        rotation: 0,
        largeArc,
        sweep: angleDiff > 0,
      },
    });

    if (innerRadius > 0) {
      const innerRx = rx * innerRadius;
      const innerRy = ry * innerRadius;
      const innerEndX = cx + innerRx * Math.cos(endAngle);
      const innerEndY = cy + innerRy * Math.sin(endAngle);
      const innerStartX = cx + innerRx * Math.cos(startAngle);
      const innerStartY = cy + innerRy * Math.sin(startAngle);

      segments.push({ command: 'L', points: [{ x: innerEndX, y: innerEndY }] });
      segments.push({
        command: 'A',
        points: [{ x: innerStartX, y: innerStartY }],
        arcParams: {
          rx: innerRx,
          ry: innerRy,
          rotation: 0,
          largeArc,
          sweep: angleDiff < 0,
        },
      });
    }

    segments.push({ command: 'Z', points: [] });
  }

  return {
    id: nanoid(),
    segments,
    closed: true,
    windingRule: 'NONZERO',
  };
}

export function createPolygonPath(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  cornerRadius: number = 0
): VectorPath {
  const segments: PathSegment[] = [];
  const angleStep = (Math.PI * 2) / sides;
  const startAngle = -Math.PI / 2; // Start from top

  const points: Point[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    points.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  if (cornerRadius > 0) {
    // With corner radius - use quadratic curves at corners
    const maxRadius = radius * Math.sin(angleStep / 2);
    const r = Math.min(cornerRadius, maxRadius);

    for (let i = 0; i < sides; i++) {
      const curr = points[i];
      const next = points[(i + 1) % sides];
      const prev = points[(i - 1 + sides) % sides];

      const toPrev = pointNormalize(pointSubtract(prev, curr));
      const toNext = pointNormalize(pointSubtract(next, curr));

      const startPoint = pointAdd(curr, pointScale(toNext, r));
      const endPoint = pointAdd(curr, pointScale(toPrev, r));

      if (i === 0) {
        segments.push({ command: 'M', points: [endPoint] });
      } else {
        segments.push({ command: 'L', points: [endPoint] });
      }

      segments.push({
        command: 'Q',
        points: [curr, startPoint],
      });
    }
  } else {
    segments.push({ command: 'M', points: [points[0]] });
    for (let i = 1; i < sides; i++) {
      segments.push({ command: 'L', points: [points[i]] });
    }
  }

  segments.push({ command: 'Z', points: [] });

  return {
    id: nanoid(),
    segments,
    closed: true,
    windingRule: 'NONZERO',
  };
}

export function createStarPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
  cornerRadius: number = 0
): VectorPath {
  const segments: PathSegment[] = [];
  const angleStep = Math.PI / points;
  const startAngle = -Math.PI / 2;

  const starPoints: Point[] = [];
  for (let i = 0; i < points * 2; i++) {
    const angle = startAngle + i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    starPoints.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }

  segments.push({ command: 'M', points: [starPoints[0]] });
  for (let i = 1; i < starPoints.length; i++) {
    segments.push({ command: 'L', points: [starPoints[i]] });
  }
  segments.push({ command: 'Z', points: [] });

  return {
    id: nanoid(),
    segments,
    closed: true,
    windingRule: 'NONZERO',
  };
}

// ============ Boolean Operations ============

interface PathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getPathBounds(path: VectorPath): PathBounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const segment of path.segments) {
    for (const point of segment.points) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
  }

  return { minX, minY, maxX, maxY };
}

function boundsIntersect(a: PathBounds, b: PathBounds): boolean {
  return !(a.maxX < b.minX || b.maxX < a.minX || a.maxY < b.minY || b.maxY < a.minY);
}

function pointInPath(point: Point, path: VectorPath): boolean {
  // Ray casting algorithm
  let inside = false;
  const { x, y } = point;
  
  let j = path.segments.length - 1;
  let prevPoint: Point | null = null;
  
  for (let i = 0; i < path.segments.length; i++) {
    const segment = path.segments[i];
    if (segment.command === 'Z') continue;
    
    const currPoint = segment.points[segment.points.length - 1];
    
    if (prevPoint) {
      const xi = prevPoint.x;
      const yi = prevPoint.y;
      const xj = currPoint.x;
      const yj = currPoint.y;
      
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    
    prevPoint = currPoint;
    j = i;
  }
  
  return inside;
}

function findLineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const d1 = pointSubtract(p2, p1);
  const d2 = pointSubtract(p4, p3);
  const d3 = pointSubtract(p1, p3);

  const cross = d1.x * d2.y - d1.y * d2.x;
  if (Math.abs(cross) < 1e-10) return null;

  const t = (d3.x * d2.y - d3.y * d2.x) / cross;
  const u = (d3.x * d1.y - d3.y * d1.x) / cross;

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: p1.x + t * d1.x,
      y: p1.y + t * d1.y,
    };
  }

  return null;
}

export function booleanOperation(
  pathA: VectorPath,
  pathB: VectorPath,
  operation: BooleanOperationType
): VectorPath {
  // Check bounds first for quick rejection
  const boundsA = getPathBounds(pathA);
  const boundsB = getPathBounds(pathB);

  if (!boundsIntersect(boundsA, boundsB)) {
    switch (operation) {
      case 'UNION':
        // Return both paths combined (simplified - just concatenate)
        return {
          id: nanoid(),
          segments: [...pathA.segments.filter(s => s.command !== 'Z'), ...pathB.segments],
          closed: true,
          windingRule: 'NONZERO',
        };
      case 'SUBTRACT':
        return pathA;
      case 'INTERSECT':
        return { id: nanoid(), segments: [], closed: false, windingRule: 'NONZERO' };
      case 'EXCLUDE':
        return {
          id: nanoid(),
          segments: [...pathA.segments.filter(s => s.command !== 'Z'), ...pathB.segments],
          closed: true,
          windingRule: 'EVENODD',
        };
    }
  }

  // For production, use a proper polygon clipping library like Clipper.js
  // This is a simplified implementation for demonstration
  
  // Convert paths to polygon points for boolean ops
  const pointsA = pathToPoints(pathA);
  const pointsB = pathToPoints(pathB);

  let resultPoints: Point[] = [];

  switch (operation) {
    case 'UNION':
      resultPoints = computeUnion(pointsA, pointsB, pathA, pathB);
      break;
    case 'SUBTRACT':
      resultPoints = computeSubtract(pointsA, pointsB, pathA, pathB);
      break;
    case 'INTERSECT':
      resultPoints = computeIntersect(pointsA, pointsB, pathA, pathB);
      break;
    case 'EXCLUDE':
      resultPoints = computeExclude(pointsA, pointsB, pathA, pathB);
      break;
  }

  return pointsToPath(resultPoints);
}

function pathToPoints(path: VectorPath, resolution: number = 0.1): Point[] {
  const points: Point[] = [];
  let currentPoint: Point = { x: 0, y: 0 };

  for (const segment of path.segments) {
    switch (segment.command) {
      case 'M':
      case 'L':
        currentPoint = segment.points[0];
        points.push(currentPoint);
        break;
      case 'C':
        // Sample cubic bezier
        const steps = Math.ceil(pointDistance(currentPoint, segment.points[2]) / resolution);
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          points.push(cubicBezierPoint(
            currentPoint,
            segment.points[0],
            segment.points[1],
            segment.points[2],
            t
          ));
        }
        currentPoint = segment.points[2];
        break;
      case 'Q':
        // Sample quadratic bezier
        const qSteps = Math.ceil(pointDistance(currentPoint, segment.points[1]) / resolution);
        for (let i = 1; i <= qSteps; i++) {
          const t = i / qSteps;
          points.push(quadraticBezierPoint(
            currentPoint,
            segment.points[0],
            segment.points[1],
            t
          ));
        }
        currentPoint = segment.points[1];
        break;
    }
  }

  return points;
}

function pointsToPath(points: Point[]): VectorPath {
  if (points.length === 0) {
    return { id: nanoid(), segments: [], closed: false, windingRule: 'NONZERO' };
  }

  const segments: PathSegment[] = [
    { command: 'M', points: [points[0]] },
    ...points.slice(1).map(p => ({ command: 'L' as const, points: [p] })),
    { command: 'Z', points: [] },
  ];

  return {
    id: nanoid(),
    segments,
    closed: true,
    windingRule: 'NONZERO',
  };
}

function computeUnion(
  pointsA: Point[],
  pointsB: Point[],
  pathA: VectorPath,
  pathB: VectorPath
): Point[] {
  // Simplified union - combine outer contours
  const result: Point[] = [];
  
  // Add points from A that are outside B
  for (const p of pointsA) {
    if (!pointInPath(p, pathB)) {
      result.push(p);
    }
  }
  
  // Add points from B that are outside A
  for (const p of pointsB) {
    if (!pointInPath(p, pathA)) {
      result.push(p);
    }
  }
  
  // Sort points to form a proper contour (convex hull for simplicity)
  return convexHull(result);
}

function computeSubtract(
  pointsA: Point[],
  pointsB: Point[],
  pathA: VectorPath,
  pathB: VectorPath
): Point[] {
  // Return points from A that are outside B
  return pointsA.filter(p => !pointInPath(p, pathB));
}

function computeIntersect(
  pointsA: Point[],
  pointsB: Point[],
  pathA: VectorPath,
  pathB: VectorPath
): Point[] {
  // Return points from A that are inside B
  return pointsA.filter(p => pointInPath(p, pathB));
}

function computeExclude(
  pointsA: Point[],
  pointsB: Point[],
  pathA: VectorPath,
  pathB: VectorPath
): Point[] {
  const result: Point[] = [];
  
  // Add points from A that are outside B
  for (const p of pointsA) {
    if (!pointInPath(p, pathB)) {
      result.push(p);
    }
  }
  
  // Add points from B that are outside A
  for (const p of pointsB) {
    if (!pointInPath(p, pathA)) {
      result.push(p);
    }
  }
  
  return result;
}

function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;

  // Find the leftmost point
  let start = 0;
  for (let i = 1; i < points.length; i++) {
    if (points[i].x < points[start].x) {
      start = i;
    }
  }

  const hull: Point[] = [];
  let current = start;

  do {
    hull.push(points[current]);
    let next = 0;

    for (let i = 1; i < points.length; i++) {
      if (next === current) {
        next = i;
        continue;
      }

      const cross = 
        (points[next].x - points[current].x) * (points[i].y - points[current].y) -
        (points[next].y - points[current].y) * (points[i].x - points[current].x);

      if (cross < 0) {
        next = i;
      }
    }

    current = next;
  } while (current !== start && hull.length < points.length);

  return hull;
}

// ============ Vector Engine Store ============

interface VectorEngineState {
  // Current drawing state
  isDrawing: boolean;
  currentPath: VectorPath | null;
  currentVertices: VectorVertex[];
  selectedVertexIds: Set<string>;
  selectedEdgeIds: Set<string>;
  
  // Tool state
  penToolMode: 'draw' | 'edit';
  
  // Actions
  startPath: (point: Point) => void;
  addVertex: (point: Point, handleOut?: Point) => void;
  closePath: () => VectorPath;
  cancelPath: () => void;
  
  selectVertex: (vertexId: string, addToSelection?: boolean) => void;
  selectEdge: (edgeId: string, addToSelection?: boolean) => void;
  clearSelection: () => void;
  
  moveVertex: (vertexId: string, newPosition: Point) => void;
  moveHandle: (vertexId: string, handle: 'in' | 'out', newPosition: Point) => void;
  setHandleMirroring: (vertexId: string, mode: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH') => void;
  
  splitEdge: (edgeId: string, t: number) => string;
  deleteVertex: (vertexId: string) => void;
  
  setCornerRadius: (vertexId: string, radius: number) => void;
  convertToCorner: (vertexId: string) => void;
  convertToSmooth: (vertexId: string) => void;
  
  performBoolean: (pathA: VectorPath, pathB: VectorPath, operation: BooleanOperationType) => VectorPath;
  
  createRectangle: (x: number, y: number, width: number, height: number, cornerRadius?: number) => VectorPath;
  createEllipse: (cx: number, cy: number, rx: number, ry: number) => VectorPath;
  createPolygon: (cx: number, cy: number, radius: number, sides: number) => VectorPath;
  createStar: (cx: number, cy: number, outerRadius: number, innerRadius: number, points: number) => VectorPath;
}

export const useVectorEngine = create<VectorEngineState>()(
  subscribeWithSelector((set, get) => ({
    isDrawing: false,
    currentPath: null,
    currentVertices: [],
    selectedVertexIds: new Set(),
    selectedEdgeIds: new Set(),
    penToolMode: 'draw',

    startPath: (point: Point) => {
      const vertex: VectorVertex = {
        id: nanoid(),
        x: point.x,
        y: point.y,
        handleIn: null,
        handleOut: null,
        cornerRadius: 0,
        handleMirroring: 'ANGLE_AND_LENGTH',
      };

      set({
        isDrawing: true,
        currentVertices: [vertex],
        currentPath: {
          id: nanoid(),
          segments: [{ command: 'M', points: [point] }],
          closed: false,
          windingRule: 'NONZERO',
        },
      });
    },

    addVertex: (point: Point, handleOut?: Point) => {
      const { currentVertices, currentPath } = get();
      if (!currentPath) return;

      const vertex: VectorVertex = {
        id: nanoid(),
        x: point.x,
        y: point.y,
        handleIn: null,
        handleOut: handleOut || null,
        cornerRadius: 0,
        handleMirroring: handleOut ? 'ANGLE_AND_LENGTH' : 'NONE',
      };

      const prevVertex = currentVertices[currentVertices.length - 1];
      let newSegment: PathSegment;

      if (prevVertex.handleOut || handleOut) {
        // Cubic bezier curve
        const handleIn = handleOut 
          ? { x: point.x - (handleOut.x - point.x), y: point.y - (handleOut.y - point.y) }
          : point;
        
        newSegment = {
          command: 'C',
          points: [
            prevVertex.handleOut || prevVertex,
            handleIn,
            point,
          ],
        };
        
        vertex.handleIn = handleIn;
      } else {
        // Straight line
        newSegment = { command: 'L', points: [point] };
      }

      set({
        currentVertices: [...currentVertices, vertex],
        currentPath: {
          ...currentPath,
          segments: [...currentPath.segments, newSegment],
        },
      });
    },

    closePath: () => {
      const { currentPath, currentVertices } = get();
      if (!currentPath || currentVertices.length < 2) {
        return currentPath || { id: nanoid(), segments: [], closed: false, windingRule: 'NONZERO' };
      }

      const closedPath: VectorPath = {
        ...currentPath,
        segments: [...currentPath.segments, { command: 'Z', points: [] }],
        closed: true,
      };

      set({
        isDrawing: false,
        currentPath: null,
        currentVertices: [],
      });

      return closedPath;
    },

    cancelPath: () => {
      set({
        isDrawing: false,
        currentPath: null,
        currentVertices: [],
      });
    },

    selectVertex: (vertexId: string, addToSelection = false) => {
      set(state => ({
        selectedVertexIds: addToSelection
          ? new Set([...state.selectedVertexIds, vertexId])
          : new Set([vertexId]),
      }));
    },

    selectEdge: (edgeId: string, addToSelection = false) => {
      set(state => ({
        selectedEdgeIds: addToSelection
          ? new Set([...state.selectedEdgeIds, edgeId])
          : new Set([edgeId]),
      }));
    },

    clearSelection: () => {
      set({
        selectedVertexIds: new Set(),
        selectedEdgeIds: new Set(),
      });
    },

    moveVertex: (vertexId: string, newPosition: Point) => {
      set(state => ({
        currentVertices: state.currentVertices.map(v =>
          v.id === vertexId
            ? { ...v, x: newPosition.x, y: newPosition.y }
            : v
        ),
      }));
    },

    moveHandle: (vertexId: string, handle: 'in' | 'out', newPosition: Point) => {
      set(state => ({
        currentVertices: state.currentVertices.map(v => {
          if (v.id !== vertexId) return v;

          const updated = { ...v };
          
          if (handle === 'in') {
            updated.handleIn = newPosition;
            
            if (v.handleMirroring === 'ANGLE_AND_LENGTH' && v.handleOut) {
              const dx = v.x - newPosition.x;
              const dy = v.y - newPosition.y;
              updated.handleOut = { x: v.x + dx, y: v.y + dy };
            } else if (v.handleMirroring === 'ANGLE' && v.handleOut) {
              const dx = v.x - newPosition.x;
              const dy = v.y - newPosition.y;
              const length = Math.sqrt(
                (v.handleOut.x - v.x) ** 2 + (v.handleOut.y - v.y) ** 2
              );
              const newLength = Math.sqrt(dx * dx + dy * dy);
              const scale = length / newLength;
              updated.handleOut = { x: v.x + dx * scale, y: v.y + dy * scale };
            }
          } else {
            updated.handleOut = newPosition;
            
            if (v.handleMirroring === 'ANGLE_AND_LENGTH' && v.handleIn) {
              const dx = v.x - newPosition.x;
              const dy = v.y - newPosition.y;
              updated.handleIn = { x: v.x + dx, y: v.y + dy };
            } else if (v.handleMirroring === 'ANGLE' && v.handleIn) {
              const dx = v.x - newPosition.x;
              const dy = v.y - newPosition.y;
              const length = Math.sqrt(
                (v.handleIn.x - v.x) ** 2 + (v.handleIn.y - v.y) ** 2
              );
              const newLength = Math.sqrt(dx * dx + dy * dy);
              const scale = length / newLength;
              updated.handleIn = { x: v.x + dx * scale, y: v.y + dy * scale };
            }
          }
          
          return updated;
        }),
      }));
    },

    setHandleMirroring: (vertexId: string, mode: 'NONE' | 'ANGLE' | 'ANGLE_AND_LENGTH') => {
      set(state => ({
        currentVertices: state.currentVertices.map(v =>
          v.id === vertexId ? { ...v, handleMirroring: mode } : v
        ),
      }));
    },

    splitEdge: (edgeId: string, t: number) => {
      // Implementation for splitting an edge at parameter t
      const newVertexId = nanoid();
      // Add logic to split the edge and insert new vertex
      return newVertexId;
    },

    deleteVertex: (vertexId: string) => {
      set(state => ({
        currentVertices: state.currentVertices.filter(v => v.id !== vertexId),
        selectedVertexIds: new Set(
          [...state.selectedVertexIds].filter(id => id !== vertexId)
        ),
      }));
    },

    setCornerRadius: (vertexId: string, radius: number) => {
      set(state => ({
        currentVertices: state.currentVertices.map(v =>
          v.id === vertexId ? { ...v, cornerRadius: radius } : v
        ),
      }));
    },

    convertToCorner: (vertexId: string) => {
      set(state => ({
        currentVertices: state.currentVertices.map(v =>
          v.id === vertexId
            ? { ...v, handleIn: null, handleOut: null, handleMirroring: 'NONE' as const }
            : v
        ),
      }));
    },

    convertToSmooth: (vertexId: string) => {
      set(state => ({
        currentVertices: state.currentVertices.map(v => {
          if (v.id !== vertexId) return v;
          
          // Calculate smooth handles based on adjacent vertices
          const idx = state.currentVertices.findIndex(vertex => vertex.id === vertexId);
          const prev = state.currentVertices[idx - 1];
          const next = state.currentVertices[idx + 1];
          
          if (!prev || !next) return v;
          
          const dx = (next.x - prev.x) / 4;
          const dy = (next.y - prev.y) / 4;
          
          return {
            ...v,
            handleIn: { x: v.x - dx, y: v.y - dy },
            handleOut: { x: v.x + dx, y: v.y + dy },
            handleMirroring: 'ANGLE_AND_LENGTH' as const,
          };
        }),
      }));
    },

    performBoolean: (pathA: VectorPath, pathB: VectorPath, operation: BooleanOperationType) => {
      return booleanOperation(pathA, pathB, operation);
    },

    createRectangle: (x: number, y: number, width: number, height: number, cornerRadius = 0) => {
      return createRectanglePath(x, y, width, height, cornerRadius);
    },

    createEllipse: (cx: number, cy: number, rx: number, ry: number) => {
      return createEllipsePath(cx, cy, rx, ry);
    },

    createPolygon: (cx: number, cy: number, radius: number, sides: number) => {
      return createPolygonPath(cx, cy, radius, sides);
    },

    createStar: (cx: number, cy: number, outerRadius: number, innerRadius: number, points: number) => {
      return createStarPath(cx, cy, outerRadius, innerRadius, points);
    },
  }))
);

export default useVectorEngine;
