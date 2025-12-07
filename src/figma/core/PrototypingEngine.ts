/**
 * PrototypingEngine - Full Figma-level Prototyping System
 * Interactive prototypes, flows, device frames, sharing, hotspots
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Easing, EasingFunction, TransitionType, TriggerType } from './AnimationTimeline';

// ============ Types ============

export type DeviceType = 
  | 'IPHONE_14_PRO'
  | 'IPHONE_14'
  | 'IPHONE_SE'
  | 'IPAD_PRO_12_9'
  | 'IPAD_MINI'
  | 'ANDROID_SMALL'
  | 'ANDROID_LARGE'
  | 'DESKTOP_1920'
  | 'DESKTOP_1440'
  | 'DESKTOP_1280'
  | 'MACBOOK_PRO_14'
  | 'MACBOOK_AIR'
  | 'APPLE_WATCH'
  | 'CUSTOM';

export interface DevicePreset {
  type: DeviceType;
  name: string;
  width: number;
  height: number;
  deviceColor?: 'silver' | 'space-gray' | 'gold' | 'midnight';
  hasNotch?: boolean;
  hasDynamicIsland?: boolean;
  cornerRadius?: number;
  statusBarHeight?: number;
  homeIndicatorHeight?: number;
}

export interface PrototypeFlow {
  id: string;
  name: string;
  startingFrameId: string;
  description?: string;
  thumbnail?: string;
}

export interface PrototypeInteraction {
  id: string;
  sourceNodeId: string;
  trigger: TriggerType;
  triggerDelay?: number; // For AFTER_DELAY
  triggerKey?: string; // For KEY_DOWN
  
  action: PrototypeAction;
}

export type PrototypeAction = 
  | NavigateAction
  | OverlayAction
  | ScrollAction
  | SwapAction
  | BackAction
  | LinkAction
  | VariableAction;

export interface NavigateAction {
  type: 'NAVIGATE';
  destinationId: string;
  transition: PrototypeTransition;
  preserveScrollPosition?: boolean;
}

export interface OverlayAction {
  type: 'OPEN_OVERLAY' | 'CLOSE_OVERLAY' | 'SWAP_OVERLAY';
  overlayId?: string;
  position?: OverlayPosition;
  transition?: PrototypeTransition;
  closeOnClickOutside?: boolean;
  backgroundDim?: number;
}

export interface ScrollAction {
  type: 'SCROLL_TO';
  nodeId: string;
  scrollBehavior: 'smooth' | 'instant';
}

export interface SwapAction {
  type: 'SWAP_WITH';
  nodeId: string;
  transition: PrototypeTransition;
}

export interface BackAction {
  type: 'BACK';
  transition?: PrototypeTransition;
}

export interface LinkAction {
  type: 'OPEN_LINK';
  url: string;
  openInNewTab: boolean;
}

export interface VariableAction {
  type: 'SET_VARIABLE';
  variableId: string;
  value: any;
  operation?: 'set' | 'toggle' | 'increment' | 'decrement';
}

export interface PrototypeTransition {
  type: TransitionType;
  duration: number;
  easing: EasingFunction;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  matchLayers?: boolean; // For SMART_ANIMATE
}

export interface OverlayPosition {
  type: 'MANUAL' | 'CENTER' | 'TOP_LEFT' | 'TOP_CENTER' | 'TOP_RIGHT' | 
        'BOTTOM_LEFT' | 'BOTTOM_CENTER' | 'BOTTOM_RIGHT' | 'RELATIVE';
  x?: number;
  y?: number;
  relativeToNodeId?: string;
}

export interface PrototypeSettings {
  device: DevicePreset;
  backgroundColor: string;
  showDeviceFrame: boolean;
  showCursor: boolean;
  cursorType: 'default' | 'touch' | 'none';
  startingFrameId: string;
  flows: PrototypeFlow[];
}

export interface HotspotHint {
  nodeId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hasInteraction: boolean;
}

// ============ Device Presets ============

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    type: 'IPHONE_14_PRO',
    name: 'iPhone 14 Pro',
    width: 393,
    height: 852,
    hasDynamicIsland: true,
    cornerRadius: 55,
    statusBarHeight: 59,
    homeIndicatorHeight: 34,
  },
  {
    type: 'IPHONE_14',
    name: 'iPhone 14',
    width: 390,
    height: 844,
    hasNotch: true,
    cornerRadius: 47,
    statusBarHeight: 47,
    homeIndicatorHeight: 34,
  },
  {
    type: 'IPHONE_SE',
    name: 'iPhone SE',
    width: 375,
    height: 667,
    cornerRadius: 0,
    statusBarHeight: 20,
    homeIndicatorHeight: 0,
  },
  {
    type: 'IPAD_PRO_12_9',
    name: 'iPad Pro 12.9"',
    width: 1024,
    height: 1366,
    cornerRadius: 18,
    statusBarHeight: 24,
    homeIndicatorHeight: 20,
  },
  {
    type: 'IPAD_MINI',
    name: 'iPad Mini',
    width: 744,
    height: 1133,
    cornerRadius: 18,
    statusBarHeight: 24,
    homeIndicatorHeight: 20,
  },
  {
    type: 'ANDROID_SMALL',
    name: 'Android Small',
    width: 360,
    height: 640,
    cornerRadius: 0,
    statusBarHeight: 24,
    homeIndicatorHeight: 48,
  },
  {
    type: 'ANDROID_LARGE',
    name: 'Android Large',
    width: 412,
    height: 915,
    cornerRadius: 16,
    statusBarHeight: 28,
    homeIndicatorHeight: 48,
  },
  {
    type: 'DESKTOP_1920',
    name: 'Desktop 1920×1080',
    width: 1920,
    height: 1080,
  },
  {
    type: 'DESKTOP_1440',
    name: 'Desktop 1440×900',
    width: 1440,
    height: 900,
  },
  {
    type: 'DESKTOP_1280',
    name: 'Desktop 1280×720',
    width: 1280,
    height: 720,
  },
  {
    type: 'MACBOOK_PRO_14',
    name: 'MacBook Pro 14"',
    width: 1512,
    height: 982,
  },
  {
    type: 'MACBOOK_AIR',
    name: 'MacBook Air',
    width: 1280,
    height: 832,
  },
  {
    type: 'APPLE_WATCH',
    name: 'Apple Watch',
    width: 198,
    height: 242,
    cornerRadius: 48,
  },
];

// ============ Transition Engine ============

export class TransitionEngine {
  private currentElement: HTMLElement | null = null;
  private targetElement: HTMLElement | null = null;
  private container: HTMLElement | null = null;
  private isTransitioning: boolean = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async performTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.currentElement = from;
    this.targetElement = to;

    switch (transition.type) {
      case 'INSTANT':
        await this.instantTransition(from, to);
        break;
      case 'DISSOLVE':
        await this.dissolveTransition(from, to, transition);
        break;
      case 'SMART_ANIMATE':
        await this.smartAnimateTransition(from, to, transition);
        break;
      case 'MOVE_IN':
        await this.moveInTransition(from, to, transition);
        break;
      case 'MOVE_OUT':
        await this.moveOutTransition(from, to, transition);
        break;
      case 'PUSH':
        await this.pushTransition(from, to, transition);
        break;
      case 'SLIDE_IN':
        await this.slideInTransition(from, to, transition);
        break;
      case 'SLIDE_OUT':
        await this.slideOutTransition(from, to, transition);
        break;
    }

    this.isTransitioning = false;
  }

  private async instantTransition(from: HTMLElement, to: HTMLElement): Promise<void> {
    from.style.display = 'none';
    to.style.display = 'block';
  }

  private async dissolveTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    to.style.opacity = '0';
    to.style.display = 'block';
    to.style.position = 'absolute';
    to.style.top = '0';
    to.style.left = '0';

    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / transition.duration, 1);
        const easedProgress = Easing.apply(progress, transition.easing);

        from.style.opacity = String(1 - easedProgress);
        to.style.opacity = String(easedProgress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          from.style.display = 'none';
          from.style.opacity = '1';
          to.style.position = '';
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async smartAnimateTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    // Find matching elements by data-node-name attribute
    const fromNodes = from.querySelectorAll('[data-node-name]');
    const toNodes = to.querySelectorAll('[data-node-name]');

    const matches = new Map<string, { from: Element; to: Element }>();

    fromNodes.forEach((fromNode) => {
      const name = fromNode.getAttribute('data-node-name');
      if (!name) return;

      toNodes.forEach((toNode) => {
        if (toNode.getAttribute('data-node-name') === name) {
          matches.set(name, { from: fromNode, to: toNode });
        }
      });
    });

    // Prepare to element
    to.style.display = 'block';
    to.style.opacity = '0';
    to.style.position = 'absolute';
    to.style.top = '0';
    to.style.left = '0';

    // Create animation clips for matching elements
    const animations: Animation[] = [];

    matches.forEach(({ from: fromNode, to: toNode }) => {
      const fromRect = fromNode.getBoundingClientRect();
      const toRect = toNode.getBoundingClientRect();

      const clone = fromNode.cloneNode(true) as HTMLElement;
      clone.style.position = 'fixed';
      clone.style.left = `${fromRect.left}px`;
      clone.style.top = `${fromRect.top}px`;
      clone.style.width = `${fromRect.width}px`;
      clone.style.height = `${fromRect.height}px`;
      clone.style.zIndex = '10000';

      document.body.appendChild(clone);

      const animation = clone.animate([
        {
          left: `${fromRect.left}px`,
          top: `${fromRect.top}px`,
          width: `${fromRect.width}px`,
          height: `${fromRect.height}px`,
        },
        {
          left: `${toRect.left}px`,
          top: `${toRect.top}px`,
          width: `${toRect.width}px`,
          height: `${toRect.height}px`,
        },
      ], {
        duration: transition.duration,
        easing: this.getEasingString(transition.easing),
        fill: 'forwards',
      });

      animation.onfinish = () => {
        document.body.removeChild(clone);
      };

      animations.push(animation);
    });

    // Fade between non-matching content
    await this.dissolveTransition(from, to, {
      ...transition,
      duration: transition.duration * 0.8,
    });

    // Wait for all animations
    await Promise.all(animations.map(a => a.finished));
  }

  private async moveInTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    const direction = transition.direction || 'right';
    const offset = this.getDirectionOffset(direction);

    to.style.display = 'block';
    to.style.position = 'absolute';
    to.style.top = '0';
    to.style.left = '0';
    to.style.transform = `translate(${offset.x}%, ${offset.y}%)`;

    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / transition.duration, 1);
        const easedProgress = Easing.apply(progress, transition.easing);

        const x = offset.x * (1 - easedProgress);
        const y = offset.y * (1 - easedProgress);
        to.style.transform = `translate(${x}%, ${y}%)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          from.style.display = 'none';
          to.style.position = '';
          to.style.transform = '';
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async moveOutTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    const direction = transition.direction || 'left';
    const offset = this.getDirectionOffset(direction);

    to.style.display = 'block';
    to.style.position = 'absolute';
    to.style.top = '0';
    to.style.left = '0';
    to.style.zIndex = '-1';

    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / transition.duration, 1);
        const easedProgress = Easing.apply(progress, transition.easing);

        const x = offset.x * easedProgress;
        const y = offset.y * easedProgress;
        from.style.transform = `translate(${x}%, ${y}%)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          from.style.display = 'none';
          from.style.transform = '';
          to.style.position = '';
          to.style.zIndex = '';
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async pushTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    const direction = transition.direction || 'left';
    const offset = this.getDirectionOffset(direction);
    const reverseOffset = { x: -offset.x, y: -offset.y };

    to.style.display = 'block';
    to.style.position = 'absolute';
    to.style.top = '0';
    to.style.left = '0';
    to.style.transform = `translate(${reverseOffset.x}%, ${reverseOffset.y}%)`;

    return new Promise((resolve) => {
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / transition.duration, 1);
        const easedProgress = Easing.apply(progress, transition.easing);

        const fromX = offset.x * easedProgress;
        const fromY = offset.y * easedProgress;
        from.style.transform = `translate(${fromX}%, ${fromY}%)`;

        const toX = reverseOffset.x * (1 - easedProgress);
        const toY = reverseOffset.y * (1 - easedProgress);
        to.style.transform = `translate(${toX}%, ${toY}%)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          from.style.display = 'none';
          from.style.transform = '';
          to.style.position = '';
          to.style.transform = '';
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  private async slideInTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    // Similar to moveIn but overlay-style
    await this.moveInTransition(from, to, transition);
  }

  private async slideOutTransition(
    from: HTMLElement,
    to: HTMLElement,
    transition: PrototypeTransition
  ): Promise<void> {
    await this.moveOutTransition(from, to, transition);
  }

  private getDirectionOffset(direction: string): { x: number; y: number } {
    switch (direction) {
      case 'left':
        return { x: -100, y: 0 };
      case 'right':
        return { x: 100, y: 0 };
      case 'top':
        return { x: 0, y: -100 };
      case 'bottom':
        return { x: 0, y: 100 };
      default:
        return { x: 100, y: 0 };
    }
  }

  private getEasingString(easing: EasingFunction): string {
    switch (easing.type) {
      case 'LINEAR':
        return 'linear';
      case 'EASE_IN':
        return 'ease-in';
      case 'EASE_OUT':
        return 'ease-out';
      case 'EASE_IN_OUT':
        return 'ease-in-out';
      case 'CUSTOM_BEZIER':
        if (easing.bezier) {
          return `cubic-bezier(${easing.bezier.join(',')})`;
        }
        return 'ease';
      default:
        return 'ease';
    }
  }
}

// ============ Prototype Player ============

export class PrototypePlayer {
  private container: HTMLElement;
  private settings: PrototypeSettings;
  private currentFrameId: string;
  private navigationHistory: string[] = [];
  private overlayStack: Array<{ frameId: string; element: HTMLElement }> = [];
  private transitionEngine: TransitionEngine;
  private renderFrame: (frameId: string) => HTMLElement;
  private onNavigate?: (frameId: string) => void;
  private variables: Map<string, any> = new Map();

  constructor(
    container: HTMLElement,
    settings: PrototypeSettings,
    renderFrame: (frameId: string) => HTMLElement,
    onNavigate?: (frameId: string) => void
  ) {
    this.container = container;
    this.settings = settings;
    this.currentFrameId = settings.startingFrameId;
    this.renderFrame = renderFrame;
    this.onNavigate = onNavigate;
    this.transitionEngine = new TransitionEngine(container);

    this.setupContainer();
    this.navigateTo(settings.startingFrameId);
  }

  private setupContainer(): void {
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';
    this.container.style.backgroundColor = this.settings.backgroundColor;

    if (this.settings.showDeviceFrame) {
      this.container.style.width = `${this.settings.device.width}px`;
      this.container.style.height = `${this.settings.device.height}px`;
      this.container.style.borderRadius = `${this.settings.device.cornerRadius || 0}px`;
    }

    // Set up cursor
    if (this.settings.cursorType === 'touch') {
      this.container.style.cursor = 'pointer';
    } else if (this.settings.cursorType === 'none') {
      this.container.style.cursor = 'none';
    }
  }

  async navigateTo(
    frameId: string,
    transition?: PrototypeTransition,
    preserveScrollPosition?: boolean
  ): Promise<void> {
    const newElement = this.renderFrame(frameId);
    const currentElement = this.container.querySelector('.prototype-frame') as HTMLElement;

    if (currentElement && transition && transition.type !== 'INSTANT') {
      newElement.classList.add('prototype-frame');
      this.container.appendChild(newElement);
      
      await this.transitionEngine.performTransition(
        currentElement,
        newElement,
        transition
      );
      
      currentElement.remove();
    } else {
      if (currentElement) {
        currentElement.remove();
      }
      newElement.classList.add('prototype-frame');
      this.container.appendChild(newElement);
    }

    // Update history
    if (this.currentFrameId !== frameId) {
      this.navigationHistory.push(this.currentFrameId);
    }
    this.currentFrameId = frameId;

    // Scroll position
    if (!preserveScrollPosition) {
      newElement.scrollTop = 0;
    }

    // Bind interactions
    this.bindInteractions(newElement);

    this.onNavigate?.(frameId);
  }

  async goBack(transition?: PrototypeTransition): Promise<boolean> {
    if (this.navigationHistory.length === 0) return false;

    const previousFrameId = this.navigationHistory.pop()!;
    await this.navigateTo(previousFrameId, transition);
    
    // Remove the current frame from history since we're going back
    this.navigationHistory.pop();
    
    return true;
  }

  async openOverlay(
    overlayFrameId: string,
    position: OverlayPosition,
    transition?: PrototypeTransition,
    closeOnClickOutside?: boolean,
    backgroundDim?: number
  ): Promise<void> {
    // Create overlay backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'prototype-overlay-backdrop';
    backdrop.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, ${backgroundDim ?? 0.5});
      z-index: ${1000 + this.overlayStack.length * 10};
    `;

    if (closeOnClickOutside) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeOverlay();
        }
      });
    }

    this.container.appendChild(backdrop);

    // Create overlay content
    const overlayElement = this.renderFrame(overlayFrameId);
    overlayElement.className = 'prototype-overlay';
    overlayElement.style.cssText = `
      position: absolute;
      z-index: ${1001 + this.overlayStack.length * 10};
    `;

    // Position overlay
    this.positionOverlay(overlayElement, position);

    this.container.appendChild(overlayElement);

    // Apply transition
    if (transition && transition.type !== 'INSTANT') {
      overlayElement.style.opacity = '0';
      overlayElement.style.transform = 'scale(0.9)';
      
      requestAnimationFrame(() => {
        overlayElement.style.transition = `opacity ${transition.duration}ms, transform ${transition.duration}ms`;
        overlayElement.style.opacity = '1';
        overlayElement.style.transform = 'scale(1)';
      });
    }

    // Bind interactions
    this.bindInteractions(overlayElement);

    this.overlayStack.push({ frameId: overlayFrameId, element: overlayElement });
  }

  async closeOverlay(transition?: PrototypeTransition): Promise<void> {
    if (this.overlayStack.length === 0) return;

    const { element } = this.overlayStack.pop()!;
    const backdrop = this.container.querySelector('.prototype-overlay-backdrop:last-child');

    if (transition && transition.type !== 'INSTANT') {
      element.style.transition = `opacity ${transition.duration}ms, transform ${transition.duration}ms`;
      element.style.opacity = '0';
      element.style.transform = 'scale(0.9)';

      if (backdrop) {
        (backdrop as HTMLElement).style.transition = `opacity ${transition.duration}ms`;
        (backdrop as HTMLElement).style.opacity = '0';
      }

      await new Promise(resolve => setTimeout(resolve, transition.duration));
    }

    element.remove();
    backdrop?.remove();
  }

  async swapOverlay(
    newOverlayFrameId: string,
    transition?: PrototypeTransition
  ): Promise<void> {
    if (this.overlayStack.length > 0) {
      const { element: oldElement } = this.overlayStack[this.overlayStack.length - 1];
      const newElement = this.renderFrame(newOverlayFrameId);
      
      newElement.style.cssText = oldElement.style.cssText;
      
      if (transition && transition.type !== 'INSTANT') {
        await this.transitionEngine.performTransition(oldElement, newElement, transition);
      }
      
      oldElement.remove();
      this.container.appendChild(newElement);
      this.overlayStack[this.overlayStack.length - 1] = { frameId: newOverlayFrameId, element: newElement };
      
      this.bindInteractions(newElement);
    }
  }

  private positionOverlay(element: HTMLElement, position: OverlayPosition): void {
    const rect = element.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    switch (position.type) {
      case 'CENTER':
        element.style.left = `${(containerRect.width - rect.width) / 2}px`;
        element.style.top = `${(containerRect.height - rect.height) / 2}px`;
        break;
      case 'TOP_LEFT':
        element.style.left = '0';
        element.style.top = '0';
        break;
      case 'TOP_CENTER':
        element.style.left = `${(containerRect.width - rect.width) / 2}px`;
        element.style.top = '0';
        break;
      case 'TOP_RIGHT':
        element.style.right = '0';
        element.style.top = '0';
        break;
      case 'BOTTOM_LEFT':
        element.style.left = '0';
        element.style.bottom = '0';
        break;
      case 'BOTTOM_CENTER':
        element.style.left = `${(containerRect.width - rect.width) / 2}px`;
        element.style.bottom = '0';
        break;
      case 'BOTTOM_RIGHT':
        element.style.right = '0';
        element.style.bottom = '0';
        break;
      case 'MANUAL':
        element.style.left = `${position.x ?? 0}px`;
        element.style.top = `${position.y ?? 0}px`;
        break;
    }
  }

  private bindInteractions(element: HTMLElement): void {
    // Find all interactive elements
    const interactiveElements = element.querySelectorAll('[data-interaction]');
    
    interactiveElements.forEach((el) => {
      const interactionData = el.getAttribute('data-interaction');
      if (!interactionData) return;

      try {
        const interaction: PrototypeInteraction = JSON.parse(interactionData);
        this.bindInteraction(el as HTMLElement, interaction);
      } catch (e) {
        console.error('Failed to parse interaction data:', e);
      }
    });
  }

  private bindInteraction(element: HTMLElement, interaction: PrototypeInteraction): void {
    const executeAction = () => this.executeAction(interaction.action);

    switch (interaction.trigger) {
      case 'ON_CLICK':
        element.addEventListener('click', executeAction);
        break;
      case 'ON_HOVER':
        element.addEventListener('mouseenter', executeAction);
        break;
      case 'MOUSE_LEAVE':
        element.addEventListener('mouseleave', executeAction);
        break;
      case 'ON_PRESS':
        element.addEventListener('mousedown', executeAction);
        break;
      case 'MOUSE_UP':
        element.addEventListener('mouseup', executeAction);
        break;
      case 'AFTER_DELAY':
        setTimeout(executeAction, interaction.triggerDelay || 0);
        break;
      case 'KEY_DOWN':
        document.addEventListener('keydown', (e) => {
          if (e.key === interaction.triggerKey) {
            executeAction();
          }
        });
        break;
      case 'ON_DRAG':
        let isDragging = false;
        element.addEventListener('mousedown', () => {
          isDragging = true;
        });
        document.addEventListener('mousemove', () => {
          if (isDragging) {
            executeAction();
          }
        });
        document.addEventListener('mouseup', () => {
          isDragging = false;
        });
        break;
    }
  }

  private async executeAction(action: PrototypeAction): Promise<void> {
    switch (action.type) {
      case 'NAVIGATE':
        await this.navigateTo(
          action.destinationId,
          action.transition,
          action.preserveScrollPosition
        );
        break;
      
      case 'OPEN_OVERLAY':
        if (action.overlayId) {
          await this.openOverlay(
            action.overlayId,
            action.position || { type: 'CENTER' },
            action.transition,
            action.closeOnClickOutside,
            action.backgroundDim
          );
        }
        break;
      
      case 'CLOSE_OVERLAY':
        await this.closeOverlay(action.transition);
        break;
      
      case 'SWAP_OVERLAY':
        if (action.overlayId) {
          await this.swapOverlay(action.overlayId, action.transition);
        }
        break;
      
      case 'SCROLL_TO':
        const targetElement = document.querySelector(`[data-node-id="${action.nodeId}"]`);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: action.scrollBehavior,
            block: 'start',
          });
        }
        break;
      
      case 'BACK':
        await this.goBack(action.transition);
        break;
      
      case 'OPEN_LINK':
        if (action.openInNewTab) {
          window.open(action.url, '_blank');
        } else {
          window.location.href = action.url;
        }
        break;
      
      case 'SET_VARIABLE':
        this.setVariable(action.variableId, action.value, action.operation);
        break;
    }
  }

  private setVariable(id: string, value: any, operation?: string): void {
    const current = this.variables.get(id);

    switch (operation) {
      case 'toggle':
        this.variables.set(id, !current);
        break;
      case 'increment':
        this.variables.set(id, (current || 0) + (value || 1));
        break;
      case 'decrement':
        this.variables.set(id, (current || 0) - (value || 1));
        break;
      default:
        this.variables.set(id, value);
    }
  }

  getVariable(id: string): any {
    return this.variables.get(id);
  }

  getHotspotHints(): HotspotHint[] {
    const hints: HotspotHint[] = [];
    const interactiveElements = this.container.querySelectorAll('[data-interaction]');
    
    interactiveElements.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();
      
      hints.push({
        nodeId: el.getAttribute('data-node-id') || '',
        x: rect.left - containerRect.left,
        y: rect.top - containerRect.top,
        width: rect.width,
        height: rect.height,
        hasInteraction: true,
      });
    });
    
    return hints;
  }

  destroy(): void {
    this.container.innerHTML = '';
    this.navigationHistory = [];
    this.overlayStack = [];
    this.variables.clear();
  }
}

// ============ Prototype Store ============

interface PrototypingState {
  // Prototype mode
  isPrototyping: boolean;
  currentFlowId: string | null;
  
  // Settings
  settings: PrototypeSettings | null;
  
  // Interactions
  interactions: Map<string, PrototypeInteraction[]>;
  
  // Flows
  flows: PrototypeFlow[];
  
  // Player
  player: PrototypePlayer | null;
  
  // Actions
  startPrototype: (settings: PrototypeSettings, container: HTMLElement, renderFrame: (id: string) => HTMLElement) => void;
  stopPrototype: () => void;
  
  // Flow management
  createFlow: (name: string, startingFrameId: string) => PrototypeFlow;
  updateFlow: (id: string, updates: Partial<PrototypeFlow>) => void;
  deleteFlow: (id: string) => void;
  selectFlow: (id: string | null) => void;
  
  // Interaction management
  addInteraction: (nodeId: string, interaction: Omit<PrototypeInteraction, 'id'>) => PrototypeInteraction;
  updateInteraction: (nodeId: string, interactionId: string, updates: Partial<PrototypeInteraction>) => void;
  removeInteraction: (nodeId: string, interactionId: string) => void;
  getInteractionsForNode: (nodeId: string) => PrototypeInteraction[];
  
  // Navigation (when in prototype mode)
  navigateTo: (frameId: string) => Promise<void>;
  goBack: () => Promise<boolean>;
  
  // Sharing
  generateShareLink: () => Promise<string>;
  embedCode: () => string;
}

export const usePrototyping = create<PrototypingState>()(
  subscribeWithSelector((set, get) => ({
    isPrototyping: false,
    currentFlowId: null,
    settings: null,
    interactions: new Map(),
    flows: [],
    player: null,

    startPrototype: (settings, container, renderFrame) => {
      const player = new PrototypePlayer(
        container,
        settings,
        renderFrame,
        (frameId) => {
          // Update state when navigation happens
        }
      );

      set({
        isPrototyping: true,
        settings,
        player,
      });
    },

    stopPrototype: () => {
      const { player } = get();
      if (player) {
        player.destroy();
      }

      set({
        isPrototyping: false,
        player: null,
      });
    },

    createFlow: (name, startingFrameId) => {
      const flow: PrototypeFlow = {
        id: `flow_${Date.now()}`,
        name,
        startingFrameId,
      };

      set(state => ({
        flows: [...state.flows, flow],
      }));

      return flow;
    },

    updateFlow: (id, updates) => {
      set(state => ({
        flows: state.flows.map(f => f.id === id ? { ...f, ...updates } : f),
      }));
    },

    deleteFlow: (id) => {
      set(state => ({
        flows: state.flows.filter(f => f.id !== id),
        currentFlowId: state.currentFlowId === id ? null : state.currentFlowId,
      }));
    },

    selectFlow: (id) => {
      set({ currentFlowId: id });
    },

    addInteraction: (nodeId, interaction) => {
      const id = `int_${Date.now()}`;
      const newInteraction: PrototypeInteraction = { id, ...interaction };

      set(state => {
        const newInteractions = new Map(state.interactions);
        const existing = newInteractions.get(nodeId) || [];
        newInteractions.set(nodeId, [...existing, newInteraction]);
        return { interactions: newInteractions };
      });

      return newInteraction;
    },

    updateInteraction: (nodeId, interactionId, updates) => {
      set(state => {
        const newInteractions = new Map(state.interactions);
        const existing = newInteractions.get(nodeId) || [];
        newInteractions.set(nodeId, existing.map(i => 
          i.id === interactionId ? { ...i, ...updates } : i
        ));
        return { interactions: newInteractions };
      });
    },

    removeInteraction: (nodeId, interactionId) => {
      set(state => {
        const newInteractions = new Map(state.interactions);
        const existing = newInteractions.get(nodeId) || [];
        newInteractions.set(nodeId, existing.filter(i => i.id !== interactionId));
        return { interactions: newInteractions };
      });
    },

    getInteractionsForNode: (nodeId) => {
      return get().interactions.get(nodeId) || [];
    },

    navigateTo: async (frameId) => {
      const { player } = get();
      if (player) {
        await player.navigateTo(frameId);
      }
    },

    goBack: async () => {
      const { player } = get();
      if (player) {
        return player.goBack();
      }
      return false;
    },

    generateShareLink: async () => {
      // Generate share link
      const shareId = `share_${Date.now()}`;
      return `https://figma-clone.app/prototype/${shareId}`;
    },

    embedCode: () => {
      const shareId = `share_${Date.now()}`;
      return `<iframe src="https://figma-clone.app/embed/${shareId}" width="400" height="800" frameborder="0"></iframe>`;
    },
  }))
);

export default usePrototyping;
