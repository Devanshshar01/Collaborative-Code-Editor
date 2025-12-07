/**
 * AnimationTimeline - Full Figma-level Animation System
 * Keyframes, easing, Smart Animate, interaction triggers, prototyping animations
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export type EasingType = 
  | 'LINEAR'
  | 'EASE_IN'
  | 'EASE_OUT'
  | 'EASE_IN_OUT'
  | 'EASE_IN_BACK'
  | 'EASE_OUT_BACK'
  | 'EASE_IN_OUT_BACK'
  | 'BOUNCE'
  | 'ELASTIC'
  | 'CUSTOM_BEZIER';

export interface EasingFunction {
  type: EasingType;
  bezier?: [number, number, number, number]; // For CUSTOM_BEZIER
}

export type AnimatableProperty = 
  | 'x'
  | 'y'
  | 'width'
  | 'height'
  | 'rotation'
  | 'scaleX'
  | 'scaleY'
  | 'opacity'
  | 'cornerRadius'
  | 'blur'
  | 'shadowX'
  | 'shadowY'
  | 'shadowBlur'
  | 'fillColor'
  | 'strokeColor'
  | 'strokeWidth';

export interface Keyframe {
  id: string;
  property: AnimatableProperty;
  time: number; // ms
  value: number | string;
  easing: EasingFunction;
}

export interface KeyframeTrack {
  id: string;
  nodeId: string;
  property: AnimatableProperty;
  keyframes: Keyframe[];
}

export interface Animation {
  id: string;
  name: string;
  duration: number; // ms
  delay: number; // ms
  loop: boolean;
  loopCount: number; // -1 for infinite
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  tracks: KeyframeTrack[];
}

export type TriggerType = 
  | 'ON_CLICK'
  | 'ON_HOVER'
  | 'ON_PRESS'
  | 'ON_DRAG'
  | 'AFTER_DELAY'
  | 'MOUSE_ENTER'
  | 'MOUSE_LEAVE'
  | 'MOUSE_DOWN'
  | 'MOUSE_UP'
  | 'KEY_DOWN';

export type TransitionType = 
  | 'INSTANT'
  | 'DISSOLVE'
  | 'SMART_ANIMATE'
  | 'MOVE_IN'
  | 'MOVE_OUT'
  | 'PUSH'
  | 'SLIDE_IN'
  | 'SLIDE_OUT';

export interface Interaction {
  id: string;
  trigger: TriggerType;
  triggerKey?: string; // For KEY_DOWN
  delay?: number; // For AFTER_DELAY
  
  // Actions
  action: InteractionAction;
}

export type InteractionAction = 
  | { type: 'NAVIGATE'; destinationId: string; transition: Transition }
  | { type: 'OPEN_OVERLAY'; overlayId: string; position: OverlayPosition; transition: Transition }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'SWAP_OVERLAY'; overlayId: string; transition: Transition }
  | { type: 'BACK' }
  | { type: 'SCROLL_TO'; nodeId: string }
  | { type: 'SET_VARIABLE'; variableId: string; value: any }
  | { type: 'CONDITIONAL'; condition: string; ifTrue: InteractionAction; ifFalse?: InteractionAction }
  | { type: 'PLAY_ANIMATION'; animationId: string }
  | { type: 'STOP_ANIMATION'; animationId: string }
  | { type: 'OPEN_URL'; url: string; newTab: boolean };

export interface Transition {
  type: TransitionType;
  duration: number;
  easing: EasingFunction;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  matchLayers?: boolean; // For smart animate
}

export interface OverlayPosition {
  type: 'MANUAL' | 'CENTER' | 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 
        'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT';
  x?: number;
  y?: number;
  closeOnClickOutside: boolean;
  backgroundDim: number; // 0-1
}

// Smart Animate matching
export interface SmartAnimateMatch {
  sourceNodeId: string;
  targetNodeId: string;
  properties: AnimatableProperty[];
}

// ============ Easing Functions ============

export class Easing {
  static apply(t: number, easing: EasingFunction): number {
    switch (easing.type) {
      case 'LINEAR':
        return t;
      
      case 'EASE_IN':
        return t * t * t;
      
      case 'EASE_OUT':
        return 1 - Math.pow(1 - t, 3);
      
      case 'EASE_IN_OUT':
        return t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      case 'EASE_IN_BACK': {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
      }
      
      case 'EASE_OUT_BACK': {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      }
      
      case 'EASE_IN_OUT_BACK': {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
          ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
          : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
      }
      
      case 'BOUNCE':
        return this.bounceOut(t);
      
      case 'ELASTIC': {
        const c4 = (2 * Math.PI) / 3;
        return t === 0
          ? 0
          : t === 1
          ? 1
          : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
      }
      
      case 'CUSTOM_BEZIER':
        if (easing.bezier) {
          return this.cubicBezier(...easing.bezier)(t);
        }
        return t;
      
      default:
        return t;
    }
  }

  private static bounceOut(t: number): number {
    const n1 = 7.5625;
    const d1 = 2.75;
    
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }

  private static cubicBezier(x1: number, y1: number, x2: number, y2: number) {
    return function(t: number): number {
      // Newton-Raphson iteration to find t for given x
      let x = t;
      for (let i = 0; i < 8; i++) {
        const currentX = 3 * (1 - x) * (1 - x) * x * x1 + 
                         3 * (1 - x) * x * x * x2 + 
                         x * x * x - t;
        const derivative = 3 * (1 - x) * (1 - x) * x1 + 
                          6 * (1 - x) * x * (x2 - x1) + 
                          3 * x * x * (1 - x2);
        if (Math.abs(currentX) < 0.001) break;
        x -= currentX / derivative;
      }
      
      // Calculate y for found x
      return 3 * (1 - x) * (1 - x) * x * y1 + 
             3 * (1 - x) * x * x * y2 + 
             x * x * x;
    };
  }
}

// ============ Animation Player ============

export class AnimationPlayer {
  private animation: Animation;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentLoop: number = 0;
  private direction: 1 | -1 = 1;
  private onUpdate: (values: Map<string, Map<AnimatableProperty, number | string>>) => void;
  private onComplete: () => void;
  private animationFrameId: number | null = null;

  constructor(
    animation: Animation,
    onUpdate: (values: Map<string, Map<AnimatableProperty, number | string>>) => void,
    onComplete: () => void
  ) {
    this.animation = animation;
    this.onUpdate = onUpdate;
    this.onComplete = onComplete;
  }

  play(): void {
    if (this.isPlaying && !this.isPaused) return;

    if (this.isPaused) {
      this.startTime = performance.now() - this.pausedTime;
      this.isPaused = false;
    } else {
      this.startTime = performance.now() + this.animation.delay;
      this.currentLoop = 0;
      this.direction = 1;
    }

    this.isPlaying = true;
    this.tick();
  }

  pause(): void {
    if (!this.isPlaying || this.isPaused) return;
    
    this.isPaused = true;
    this.pausedTime = performance.now() - this.startTime;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  seek(time: number): void {
    const values = this.getValuesAtTime(time);
    this.onUpdate(values);
  }

  private tick = (): void => {
    if (!this.isPlaying || this.isPaused) return;

    const currentTime = performance.now();
    let elapsed = currentTime - this.startTime;

    // Handle delay
    if (elapsed < 0) {
      this.animationFrameId = requestAnimationFrame(this.tick);
      return;
    }

    // Handle looping
    const duration = this.animation.duration;
    
    if (elapsed > duration) {
      if (this.animation.loop) {
        const loopCount = this.animation.loopCount;
        if (loopCount === -1 || this.currentLoop < loopCount - 1) {
          this.currentLoop++;
          elapsed = elapsed % duration;
          this.startTime = currentTime - elapsed;

          // Handle alternate direction
          if (this.animation.direction === 'alternate' || 
              this.animation.direction === 'alternate-reverse') {
            this.direction *= -1;
          }
        } else {
          this.complete();
          return;
        }
      } else {
        this.complete();
        return;
      }
    }

    // Calculate progress
    let progress = elapsed / duration;
    
    if (this.animation.direction === 'reverse' || 
        (this.animation.direction === 'alternate-reverse' && this.currentLoop === 0) ||
        (this.animation.direction === 'alternate' && this.direction === -1)) {
      progress = 1 - progress;
    }

    // Get interpolated values
    const values = this.getValuesAtTime(elapsed);
    this.onUpdate(values);

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  private getValuesAtTime(time: number): Map<string, Map<AnimatableProperty, number | string>> {
    const values = new Map<string, Map<AnimatableProperty, number | string>>();

    for (const track of this.animation.tracks) {
      if (!values.has(track.nodeId)) {
        values.set(track.nodeId, new Map());
      }

      const nodeValues = values.get(track.nodeId)!;
      const value = this.interpolateTrack(track, time);
      nodeValues.set(track.property, value);
    }

    return values;
  }

  private interpolateTrack(track: KeyframeTrack, time: number): number | string {
    const keyframes = [...track.keyframes].sort((a, b) => a.time - b.time);
    
    if (keyframes.length === 0) {
      return 0;
    }

    if (keyframes.length === 1) {
      return keyframes[0].value;
    }

    // Find surrounding keyframes
    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= time && keyframes[i + 1].time >= time) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }

    if (time <= prevKeyframe.time) {
      return prevKeyframe.value;
    }

    if (time >= nextKeyframe.time) {
      return nextKeyframe.value;
    }

    // Interpolate
    const t = (time - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);
    const easedT = Easing.apply(t, nextKeyframe.easing);

    // Handle different value types
    if (typeof prevKeyframe.value === 'number' && typeof nextKeyframe.value === 'number') {
      return prevKeyframe.value + (nextKeyframe.value - prevKeyframe.value) * easedT;
    }

    // Color interpolation
    if (typeof prevKeyframe.value === 'string' && typeof nextKeyframe.value === 'string') {
      return this.interpolateColor(prevKeyframe.value, nextKeyframe.value, easedT);
    }

    return prevKeyframe.value;
  }

  private interpolateColor(from: string, to: string, t: number): string {
    const fromRgb = this.hexToRgb(from);
    const toRgb = this.hexToRgb(to);
    
    if (!fromRgb || !toRgb) return from;

    const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
    const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
    const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  }

  private complete(): void {
    this.isPlaying = false;
    this.onComplete();
  }
}

// ============ Smart Animate ============

export class SmartAnimate {
  /**
   * Find matching layers between two frames for smart animation
   */
  static findMatches(
    sourceNodes: Map<string, { name: string; type: string; properties: Record<string, any> }>,
    targetNodes: Map<string, { name: string; type: string; properties: Record<string, any> }>
  ): SmartAnimateMatch[] {
    const matches: SmartAnimateMatch[] = [];

    for (const [sourceId, sourceNode] of sourceNodes) {
      // Find matching node in target by name and type
      for (const [targetId, targetNode] of targetNodes) {
        if (sourceNode.name === targetNode.name && sourceNode.type === targetNode.type) {
          // Find which properties differ
          const diffProperties: AnimatableProperty[] = [];
          
          const animatableProps: AnimatableProperty[] = [
            'x', 'y', 'width', 'height', 'rotation', 'scaleX', 'scaleY',
            'opacity', 'cornerRadius', 'blur', 'fillColor', 'strokeColor', 'strokeWidth'
          ];

          for (const prop of animatableProps) {
            if (sourceNode.properties[prop] !== targetNode.properties[prop]) {
              diffProperties.push(prop);
            }
          }

          if (diffProperties.length > 0) {
            matches.push({
              sourceNodeId: sourceId,
              targetNodeId: targetId,
              properties: diffProperties,
            });
          }
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Generate animation from smart animate matches
   */
  static generateAnimation(
    matches: SmartAnimateMatch[],
    sourceNodes: Map<string, Record<string, any>>,
    targetNodes: Map<string, Record<string, any>>,
    duration: number,
    easing: EasingFunction
  ): Animation {
    const tracks: KeyframeTrack[] = [];

    for (const match of matches) {
      const sourceProps = sourceNodes.get(match.sourceNodeId) || {};
      const targetProps = targetNodes.get(match.targetNodeId) || {};

      for (const prop of match.properties) {
        const track: KeyframeTrack = {
          id: `${match.sourceNodeId}_${prop}`,
          nodeId: match.sourceNodeId,
          property: prop,
          keyframes: [
            {
              id: `${match.sourceNodeId}_${prop}_start`,
              property: prop,
              time: 0,
              value: sourceProps[prop] ?? 0,
              easing: { type: 'LINEAR' },
            },
            {
              id: `${match.sourceNodeId}_${prop}_end`,
              property: prop,
              time: duration,
              value: targetProps[prop] ?? 0,
              easing,
            },
          ],
        };
        tracks.push(track);
      }
    }

    return {
      id: `smart_animate_${Date.now()}`,
      name: 'Smart Animate',
      duration,
      delay: 0,
      loop: false,
      loopCount: 1,
      direction: 'normal',
      tracks,
    };
  }
}

// ============ Animation Timeline Store ============

interface AnimationTimelineState {
  // Animations
  animations: Map<string, Animation>;
  activeAnimations: Map<string, AnimationPlayer>;
  
  // Timeline state
  currentTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  
  // Selected items
  selectedAnimationId: string | null;
  selectedTrackIds: string[];
  selectedKeyframeIds: string[];
  
  // Snapping
  snapToKeyframes: boolean;
  snapInterval: number; // ms
  
  // Actions
  createAnimation: (name: string) => Animation;
  deleteAnimation: (id: string) => void;
  duplicateAnimation: (id: string) => Animation;
  
  addTrack: (animationId: string, nodeId: string, property: AnimatableProperty) => KeyframeTrack;
  removeTrack: (animationId: string, trackId: string) => void;
  
  addKeyframe: (animationId: string, trackId: string, time: number, value: number | string, easing?: EasingFunction) => Keyframe;
  updateKeyframe: (animationId: string, trackId: string, keyframeId: string, updates: Partial<Keyframe>) => void;
  deleteKeyframe: (animationId: string, trackId: string, keyframeId: string) => void;
  moveKeyframe: (animationId: string, trackId: string, keyframeId: string, newTime: number) => void;
  
  setEasing: (animationId: string, trackId: string, keyframeId: string, easing: EasingFunction) => void;
  
  // Playback
  play: (animationId: string) => void;
  pause: (animationId: string) => void;
  stop: (animationId: string) => void;
  seek: (animationId: string, time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // Selection
  selectAnimation: (id: string | null) => void;
  selectTrack: (id: string) => void;
  selectKeyframe: (id: string) => void;
  clearSelection: () => void;
  
  // Timeline navigation
  goToTime: (time: number) => void;
  stepForward: (ms: number) => void;
  stepBackward: (ms: number) => void;
  
  // Snapping
  setSnapToKeyframes: (enabled: boolean) => void;
  setSnapInterval: (interval: number) => void;
  snapTime: (time: number) => number;
  
  // Smart animate
  createSmartAnimation: (
    sourceFrameId: string,
    targetFrameId: string,
    duration: number,
    easing: EasingFunction
  ) => Animation | null;
}

export const useAnimationTimeline = create<AnimationTimelineState>()(
  subscribeWithSelector((set, get) => ({
    animations: new Map(),
    activeAnimations: new Map(),
    currentTime: 0,
    isPlaying: false,
    playbackSpeed: 1,
    selectedAnimationId: null,
    selectedTrackIds: [],
    selectedKeyframeIds: [],
    snapToKeyframes: true,
    snapInterval: 100,

    createAnimation: (name: string) => {
      const id = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const animation: Animation = {
        id,
        name,
        duration: 1000,
        delay: 0,
        loop: false,
        loopCount: 1,
        direction: 'normal',
        tracks: [],
      };

      set(state => {
        const newAnimations = new Map(state.animations);
        newAnimations.set(id, animation);
        return { animations: newAnimations };
      });

      return animation;
    },

    deleteAnimation: (id: string) => {
      set(state => {
        const newAnimations = new Map(state.animations);
        newAnimations.delete(id);
        
        const newActive = new Map(state.activeAnimations);
        const player = newActive.get(id);
        if (player) {
          player.stop();
          newActive.delete(id);
        }
        
        return { 
          animations: newAnimations, 
          activeAnimations: newActive,
          selectedAnimationId: state.selectedAnimationId === id ? null : state.selectedAnimationId,
        };
      });
    },

    duplicateAnimation: (id: string) => {
      const { animations } = get();
      const original = animations.get(id);
      
      if (!original) {
        throw new Error(`Animation ${id} not found`);
      }

      const newId = `anim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const duplicate: Animation = {
        ...original,
        id: newId,
        name: `${original.name} Copy`,
        tracks: original.tracks.map(track => ({
          ...track,
          id: `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          keyframes: track.keyframes.map(kf => ({
            ...kf,
            id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          })),
        })),
      };

      set(state => {
        const newAnimations = new Map(state.animations);
        newAnimations.set(newId, duplicate);
        return { animations: newAnimations };
      });

      return duplicate;
    },

    addTrack: (animationId: string, nodeId: string, property: AnimatableProperty) => {
      const id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const track: KeyframeTrack = {
        id,
        nodeId,
        property,
        keyframes: [],
      };

      set(state => {
        const animation = state.animations.get(animationId);
        if (!animation) return state;

        const newAnimations = new Map(state.animations);
        newAnimations.set(animationId, {
          ...animation,
          tracks: [...animation.tracks, track],
        });
        return { animations: newAnimations };
      });

      return track;
    },

    removeTrack: (animationId: string, trackId: string) => {
      set(state => {
        const animation = state.animations.get(animationId);
        if (!animation) return state;

        const newAnimations = new Map(state.animations);
        newAnimations.set(animationId, {
          ...animation,
          tracks: animation.tracks.filter(t => t.id !== trackId),
        });
        return { animations: newAnimations };
      });
    },

    addKeyframe: (animationId: string, trackId: string, time: number, value: number | string, easing?: EasingFunction) => {
      const id = `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const { animations } = get();
      const animation = animations.get(animationId);
      const track = animation?.tracks.find(t => t.id === trackId);
      
      const keyframe: Keyframe = {
        id,
        property: track?.property || 'x',
        time,
        value,
        easing: easing || { type: 'EASE_IN_OUT' },
      };

      set(state => {
        const animation = state.animations.get(animationId);
        if (!animation) return state;

        const newTracks = animation.tracks.map(track => {
          if (track.id !== trackId) return track;
          return {
            ...track,
            keyframes: [...track.keyframes, keyframe].sort((a, b) => a.time - b.time),
          };
        });

        const newAnimations = new Map(state.animations);
        newAnimations.set(animationId, { ...animation, tracks: newTracks });
        return { animations: newAnimations };
      });

      return keyframe;
    },

    updateKeyframe: (animationId: string, trackId: string, keyframeId: string, updates: Partial<Keyframe>) => {
      set(state => {
        const animation = state.animations.get(animationId);
        if (!animation) return state;

        const newTracks = animation.tracks.map(track => {
          if (track.id !== trackId) return track;
          return {
            ...track,
            keyframes: track.keyframes.map(kf => 
              kf.id === keyframeId ? { ...kf, ...updates } : kf
            ).sort((a, b) => a.time - b.time),
          };
        });

        const newAnimations = new Map(state.animations);
        newAnimations.set(animationId, { ...animation, tracks: newTracks });
        return { animations: newAnimations };
      });
    },

    deleteKeyframe: (animationId: string, trackId: string, keyframeId: string) => {
      set(state => {
        const animation = state.animations.get(animationId);
        if (!animation) return state;

        const newTracks = animation.tracks.map(track => {
          if (track.id !== trackId) return track;
          return {
            ...track,
            keyframes: track.keyframes.filter(kf => kf.id !== keyframeId),
          };
        });

        const newAnimations = new Map(state.animations);
        newAnimations.set(animationId, { ...animation, tracks: newTracks });
        return { animations: newAnimations };
      });
    },

    moveKeyframe: (animationId: string, trackId: string, keyframeId: string, newTime: number) => {
      const { snapTime } = get();
      const snappedTime = snapTime(newTime);
      
      get().updateKeyframe(animationId, trackId, keyframeId, { time: snappedTime });
    },

    setEasing: (animationId: string, trackId: string, keyframeId: string, easing: EasingFunction) => {
      get().updateKeyframe(animationId, trackId, keyframeId, { easing });
    },

    play: (animationId: string) => {
      const { animations, activeAnimations, playbackSpeed } = get();
      const animation = animations.get(animationId);
      
      if (!animation) return;

      // Stop existing player if any
      const existingPlayer = activeAnimations.get(animationId);
      if (existingPlayer) {
        existingPlayer.stop();
      }

      const player = new AnimationPlayer(
        animation,
        (values) => {
          // Update node values - would dispatch to scene graph
          set({ currentTime: performance.now() });
        },
        () => {
          set(state => {
            const newActive = new Map(state.activeAnimations);
            newActive.delete(animationId);
            return { activeAnimations: newActive, isPlaying: newActive.size > 0 };
          });
        }
      );

      player.play();

      set(state => {
        const newActive = new Map(state.activeAnimations);
        newActive.set(animationId, player);
        return { activeAnimations: newActive, isPlaying: true };
      });
    },

    pause: (animationId: string) => {
      const { activeAnimations } = get();
      const player = activeAnimations.get(animationId);
      
      if (player) {
        player.pause();
      }
    },

    stop: (animationId: string) => {
      const { activeAnimations } = get();
      const player = activeAnimations.get(animationId);
      
      if (player) {
        player.stop();
        set(state => {
          const newActive = new Map(state.activeAnimations);
          newActive.delete(animationId);
          return { activeAnimations: newActive, isPlaying: newActive.size > 0 };
        });
      }
    },

    seek: (animationId: string, time: number) => {
      const { activeAnimations, animations } = get();
      const player = activeAnimations.get(animationId);
      
      if (player) {
        player.seek(time);
      }
      
      set({ currentTime: time });
    },

    setPlaybackSpeed: (speed: number) => {
      set({ playbackSpeed: speed });
    },

    selectAnimation: (id: string | null) => {
      set({ selectedAnimationId: id, selectedTrackIds: [], selectedKeyframeIds: [] });
    },

    selectTrack: (id: string) => {
      set(state => ({
        selectedTrackIds: state.selectedTrackIds.includes(id)
          ? state.selectedTrackIds.filter(t => t !== id)
          : [...state.selectedTrackIds, id],
      }));
    },

    selectKeyframe: (id: string) => {
      set(state => ({
        selectedKeyframeIds: state.selectedKeyframeIds.includes(id)
          ? state.selectedKeyframeIds.filter(k => k !== id)
          : [...state.selectedKeyframeIds, id],
      }));
    },

    clearSelection: () => {
      set({ selectedTrackIds: [], selectedKeyframeIds: [] });
    },

    goToTime: (time: number) => {
      set({ currentTime: Math.max(0, time) });
    },

    stepForward: (ms: number) => {
      set(state => ({ currentTime: state.currentTime + ms }));
    },

    stepBackward: (ms: number) => {
      set(state => ({ currentTime: Math.max(0, state.currentTime - ms) }));
    },

    setSnapToKeyframes: (enabled: boolean) => {
      set({ snapToKeyframes: enabled });
    },

    setSnapInterval: (interval: number) => {
      set({ snapInterval: interval });
    },

    snapTime: (time: number) => {
      const { snapToKeyframes, snapInterval, selectedAnimationId, animations } = get();
      
      // Snap to interval
      let snapped = Math.round(time / snapInterval) * snapInterval;
      
      // Snap to keyframes
      if (snapToKeyframes && selectedAnimationId) {
        const animation = animations.get(selectedAnimationId);
        if (animation) {
          for (const track of animation.tracks) {
            for (const keyframe of track.keyframes) {
              if (Math.abs(keyframe.time - time) < 20) {
                snapped = keyframe.time;
                break;
              }
            }
          }
        }
      }
      
      return snapped;
    },

    createSmartAnimation: (
      sourceFrameId: string,
      targetFrameId: string,
      duration: number,
      easing: EasingFunction
    ) => {
      // Would get nodes from scene graph
      const sourceNodes = new Map<string, { name: string; type: string; properties: Record<string, any> }>();
      const targetNodes = new Map<string, { name: string; type: string; properties: Record<string, any> }>();
      
      const matches = SmartAnimate.findMatches(sourceNodes, targetNodes);
      
      if (matches.length === 0) {
        return null;
      }
      
      const sourceProps = new Map<string, Record<string, any>>();
      const targetProps = new Map<string, Record<string, any>>();
      
      const animation = SmartAnimate.generateAnimation(
        matches,
        sourceProps,
        targetProps,
        duration,
        easing
      );
      
      set(state => {
        const newAnimations = new Map(state.animations);
        newAnimations.set(animation.id, animation);
        return { animations: newAnimations };
      });
      
      return animation;
    },
  }))
);

// ============ Interaction Store ============

interface InteractionState {
  interactions: Map<string, Interaction[]>; // nodeId -> interactions
  
  addInteraction: (nodeId: string, interaction: Omit<Interaction, 'id'>) => Interaction;
  updateInteraction: (nodeId: string, interactionId: string, updates: Partial<Interaction>) => void;
  removeInteraction: (nodeId: string, interactionId: string) => void;
  
  getInteractionsForNode: (nodeId: string) => Interaction[];
  
  // Prototype mode
  executeInteraction: (nodeId: string, trigger: TriggerType) => void;
}

export const useInteractions = create<InteractionState>()(
  subscribeWithSelector((set, get) => ({
    interactions: new Map(),

    addInteraction: (nodeId: string, interaction: Omit<Interaction, 'id'>) => {
      const id = `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newInteraction: Interaction = { id, ...interaction };

      set(state => {
        const newInteractions = new Map(state.interactions);
        const existing = newInteractions.get(nodeId) || [];
        newInteractions.set(nodeId, [...existing, newInteraction]);
        return { interactions: newInteractions };
      });

      return newInteraction;
    },

    updateInteraction: (nodeId: string, interactionId: string, updates: Partial<Interaction>) => {
      set(state => {
        const newInteractions = new Map(state.interactions);
        const existing = newInteractions.get(nodeId) || [];
        newInteractions.set(nodeId, existing.map(i => 
          i.id === interactionId ? { ...i, ...updates } : i
        ));
        return { interactions: newInteractions };
      });
    },

    removeInteraction: (nodeId: string, interactionId: string) => {
      set(state => {
        const newInteractions = new Map(state.interactions);
        const existing = newInteractions.get(nodeId) || [];
        newInteractions.set(nodeId, existing.filter(i => i.id !== interactionId));
        return { interactions: newInteractions };
      });
    },

    getInteractionsForNode: (nodeId: string) => {
      return get().interactions.get(nodeId) || [];
    },

    executeInteraction: (nodeId: string, trigger: TriggerType) => {
      const interactions = get().getInteractionsForNode(nodeId);
      const matching = interactions.filter(i => i.trigger === trigger);

      for (const interaction of matching) {
        executeAction(interaction.action);
      }
    },
  }))
);

function executeAction(action: InteractionAction): void {
  switch (action.type) {
    case 'NAVIGATE':
      // Navigate to destination frame
      console.log(`Navigate to ${action.destinationId}`);
      break;
    
    case 'OPEN_OVERLAY':
      // Open overlay
      console.log(`Open overlay ${action.overlayId}`);
      break;
    
    case 'CLOSE_OVERLAY':
      // Close current overlay
      console.log('Close overlay');
      break;
    
    case 'BACK':
      // Navigate back
      console.log('Navigate back');
      break;
    
    case 'SCROLL_TO':
      // Scroll to node
      console.log(`Scroll to ${action.nodeId}`);
      break;
    
    case 'PLAY_ANIMATION':
      useAnimationTimeline.getState().play(action.animationId);
      break;
    
    case 'STOP_ANIMATION':
      useAnimationTimeline.getState().stop(action.animationId);
      break;
    
    case 'OPEN_URL':
      if (action.newTab) {
        window.open(action.url, '_blank');
      } else {
        window.location.href = action.url;
      }
      break;
    
    case 'CONDITIONAL':
      // Evaluate condition and execute appropriate action
      try {
        const result = eval(action.condition);
        if (result) {
          executeAction(action.ifTrue);
        } else if (action.ifFalse) {
          executeAction(action.ifFalse);
        }
      } catch (e) {
        console.error('Failed to evaluate condition:', e);
      }
      break;
  }
}

export default useAnimationTimeline;
