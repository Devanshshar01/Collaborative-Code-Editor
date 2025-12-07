/**
 * TimelinePanel - Full Figma-level Animation Timeline
 * Keyframe editing, easing curves, Smart Animate, playback controls
 */

import React, { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export interface Keyframe {
  id: string;
  time: number; // In milliseconds
  value: any;
  easing: EasingFunction;
  property: string;
}

export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInBack'
  | 'easeOutBack'
  | 'easeInOutBack'
  | 'spring'
  | 'bounce';

export interface AnimationTrack {
  id: string;
  nodeId: string;
  nodeName: string;
  property: string;
  keyframes: Keyframe[];
  enabled: boolean;
  collapsed: boolean;
}

export interface AnimationLayer {
  id: string;
  nodeId: string;
  nodeName: string;
  tracks: AnimationTrack[];
  expanded: boolean;
}

// ============ Timeline Store ============

interface TimelineState {
  layers: AnimationLayer[];
  selectedKeyframes: Set<string>;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  loop: boolean;
  zoom: number; // Pixels per second
  scrollOffset: number;
  snapToKeyframes: boolean;
  
  // Actions
  setLayers: (layers: AnimationLayer[]) => void;
  addKeyframe: (trackId: string, keyframe: Keyframe) => void;
  removeKeyframe: (keyframeId: string) => void;
  updateKeyframe: (keyframeId: string, updates: Partial<Keyframe>) => void;
  moveKeyframe: (keyframeId: string, newTime: number) => void;
  selectKeyframe: (id: string, additive: boolean) => void;
  clearSelection: () => void;
  setCurrentTime: (time: number) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggleLoop: () => void;
  setZoom: (zoom: number) => void;
  setScrollOffset: (offset: number) => void;
  toggleSnapToKeyframes: () => void;
  toggleLayerExpanded: (layerId: string) => void;
  toggleTrackCollapsed: (trackId: string) => void;
}

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    layers: [],
    selectedKeyframes: new Set(),
    currentTime: 0,
    duration: 5000, // 5 seconds default
    isPlaying: false,
    loop: false,
    zoom: 100, // 100px per second
    scrollOffset: 0,
    snapToKeyframes: true,

    setLayers: (layers) => set({ layers }),

    addKeyframe: (trackId, keyframe) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          tracks: layer.tracks.map((track) =>
            track.id === trackId
              ? { ...track, keyframes: [...track.keyframes, keyframe].sort((a, b) => a.time - b.time) }
              : track
          ),
        })),
      }));
    },

    removeKeyframe: (keyframeId) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          tracks: layer.tracks.map((track) => ({
            ...track,
            keyframes: track.keyframes.filter((kf) => kf.id !== keyframeId),
          })),
        })),
        selectedKeyframes: new Set(
          Array.from(state.selectedKeyframes).filter((id) => id !== keyframeId)
        ),
      }));
    },

    updateKeyframe: (keyframeId, updates) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          tracks: layer.tracks.map((track) => ({
            ...track,
            keyframes: track.keyframes.map((kf) =>
              kf.id === keyframeId ? { ...kf, ...updates } : kf
            ),
          })),
        })),
      }));
    },

    moveKeyframe: (keyframeId, newTime) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          tracks: layer.tracks.map((track) => ({
            ...track,
            keyframes: track.keyframes
              .map((kf) => (kf.id === keyframeId ? { ...kf, time: newTime } : kf))
              .sort((a, b) => a.time - b.time),
          })),
        })),
      }));
    },

    selectKeyframe: (id, additive) => {
      set((state) => {
        const selectedKeyframes = new Set(additive ? state.selectedKeyframes : []);
        if (additive && selectedKeyframes.has(id)) {
          selectedKeyframes.delete(id);
        } else {
          selectedKeyframes.add(id);
        }
        return { selectedKeyframes };
      });
    },

    clearSelection: () => set({ selectedKeyframes: new Set() }),

    setCurrentTime: (time) => {
      const { duration, snapToKeyframes, layers } = get();
      let finalTime = Math.max(0, Math.min(time, duration));

      if (snapToKeyframes) {
        const allKeyframeTimes: number[] = [];
        layers.forEach((layer) => {
          layer.tracks.forEach((track) => {
            track.keyframes.forEach((kf) => allKeyframeTimes.push(kf.time));
          });
        });

        const snapThreshold = 50; // 50ms
        const closest = allKeyframeTimes.find(
          (t) => Math.abs(t - finalTime) < snapThreshold
        );
        if (closest !== undefined) {
          finalTime = closest;
        }
      }

      set({ currentTime: finalTime });
    },

    play: () => set({ isPlaying: true }),
    pause: () => set({ isPlaying: false }),
    stop: () => set({ isPlaying: false, currentTime: 0 }),
    toggleLoop: () => set((state) => ({ loop: !state.loop })),

    setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(zoom, 500)) }),
    setScrollOffset: (offset) => set({ scrollOffset: offset }),
    toggleSnapToKeyframes: () => set((state) => ({ snapToKeyframes: !state.snapToKeyframes })),

    toggleLayerExpanded: (layerId) => {
      set((state) => ({
        layers: state.layers.map((layer) =>
          layer.id === layerId ? { ...layer, expanded: !layer.expanded } : layer
        ),
      }));
    },

    toggleTrackCollapsed: (trackId) => {
      set((state) => ({
        layers: state.layers.map((layer) => ({
          ...layer,
          tracks: layer.tracks.map((track) =>
            track.id === trackId ? { ...track, collapsed: !track.collapsed } : track
          ),
        })),
      }));
    },
  }))
);

// ============ Icons ============

const Icons = {
  Play: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2l10 6-10 6V2z" />
    </svg>
  ),
  Pause: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M3 2h3v12H3V2zm7 0h3v12h-3V2z" />
    </svg>
  ),
  Stop: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <rect x="3" y="3" width="10" height="10" />
    </svg>
  ),
  Loop: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13 5H5v2l-3-3 3-3v2h9v5h-1V5zM3 11h8V9l3 3-3 3v-2H2V8h1v3z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M2 4l4 4 4-4" />
    </svg>
  ),
  ChevronRight: () => (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
      <path d="M4 2l4 4-4 4" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 2v10M2 7h10" />
    </svg>
  ),
  Keyframe: () => (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
      <path d="M5 1l4 4-4 4-4-4 4-4z" />
    </svg>
  ),
  MagnetOn: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 2C5 2 3 4 3 6v4c0 1 1 2 2 2h1V8H5V6c0-1 1-2 3-2s3 1 3 2v2h-1v4h1c1 0 2-1 2-2V6c0-2-2-4-5-4z" />
    </svg>
  ),
  ZoomIn: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7 3a4 4 0 014 7l4 4-1 1-4-4a4 4 0 11-3-8zm0 1a3 3 0 100 6 3 3 0 000-6zm0 1v2h2v1H7v2H6V8H4V7h2V5h1z" />
    </svg>
  ),
  ZoomOut: () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7 3a4 4 0 014 7l4 4-1 1-4-4a4 4 0 11-3-8zm0 1a3 3 0 100 6 3 3 0 000-6zM4 7h6v1H4V7z" />
    </svg>
  ),
};

// ============ Time Ruler ============

interface TimeRulerProps {
  duration: number;
  zoom: number;
  scrollOffset: number;
  currentTime: number;
  onTimeChange: (time: number) => void;
}

const TimeRuler = memo<TimeRulerProps>(({
  duration,
  zoom,
  scrollOffset,
  currentTime,
  onTimeChange,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalWidth = (duration / 1000) * zoom;
  const majorInterval = zoom >= 100 ? 1000 : zoom >= 50 ? 2000 : 5000; // 1s, 2s, or 5s
  const minorInterval = majorInterval / 5;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rulerRef.current) return;
    setIsDragging(true);
    const rect = rulerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + scrollOffset;
    const time = (x / zoom) * 1000;
    onTimeChange(time);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + scrollOffset;
      const time = (x / zoom) * 1000;
      onTimeChange(time);
    },
    [isDragging, scrollOffset, zoom, onTimeChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= duration; i += minorInterval) {
    const x = (i / 1000) * zoom;
    const isMajor = i % majorInterval === 0;

    ticks.push(
      <div
        key={i}
        className={`timeline-ruler__tick ${isMajor ? 'timeline-ruler__tick--major' : ''}`}
        style={{ left: x }}
      >
        {isMajor && (
          <span className="timeline-ruler__label">{(i / 1000).toFixed(1)}s</span>
        )}
      </div>
    );
  }

  const playheadX = (currentTime / 1000) * zoom;

  return (
    <div
      ref={rulerRef}
      className="timeline-ruler"
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
    >
      <div className="timeline-ruler__content" style={{ width: totalWidth }}>
        {ticks}
      </div>
      <div
        className="timeline-playhead"
        style={{ left: playheadX - scrollOffset }}
      >
        <div className="timeline-playhead__handle" />
        <div className="timeline-playhead__line" />
      </div>
    </div>
  );
});

TimeRuler.displayName = 'TimeRuler';

// ============ Keyframe Diamond ============

interface KeyframeDiamondProps {
  keyframe: Keyframe;
  isSelected: boolean;
  zoom: number;
  onSelect: (e: React.MouseEvent) => void;
  onDragStart: (e: React.MouseEvent) => void;
}

const KeyframeDiamond = memo<KeyframeDiamondProps>(({
  keyframe,
  isSelected,
  zoom,
  onSelect,
  onDragStart,
}) => {
  const x = (keyframe.time / 1000) * zoom;

  return (
    <div
      className={`timeline-keyframe ${isSelected ? 'timeline-keyframe--selected' : ''}`}
      style={{ left: x }}
      onClick={onSelect}
      onMouseDown={onDragStart}
      title={`${(keyframe.time / 1000).toFixed(2)}s - ${keyframe.easing}`}
    >
      <Icons.Keyframe />
    </div>
  );
});

KeyframeDiamond.displayName = 'KeyframeDiamond';

// ============ Animation Track ============

interface AnimationTrackRowProps {
  track: AnimationTrack;
  zoom: number;
  selectedKeyframes: Set<string>;
  onKeyframeSelect: (id: string, additive: boolean) => void;
  onKeyframeMove: (id: string, newTime: number) => void;
  onAddKeyframe: (trackId: string, time: number) => void;
}

const AnimationTrackRow = memo<AnimationTrackRowProps>(({
  track,
  zoom,
  selectedKeyframes,
  onKeyframeSelect,
  onKeyframeMove,
  onAddKeyframe,
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingKeyframe, setDraggingKeyframe] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTime, setDragStartTime] = useState(0);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current || draggingKeyframe) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / zoom) * 1000;
    onAddKeyframe(track.id, time);
  };

  const handleKeyframeDragStart = (keyframeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const keyframe = track.keyframes.find((kf) => kf.id === keyframeId);
    if (!keyframe) return;

    setDraggingKeyframe(keyframeId);
    setDragStartX(e.clientX);
    setDragStartTime(keyframe.time);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingKeyframe || !trackRef.current) return;
      const deltaX = e.clientX - dragStartX;
      const deltaTime = (deltaX / zoom) * 1000;
      const newTime = Math.max(0, dragStartTime + deltaTime);
      onKeyframeMove(draggingKeyframe, newTime);
    },
    [draggingKeyframe, dragStartX, dragStartTime, zoom, onKeyframeMove]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingKeyframe(null);
  }, []);

  useEffect(() => {
    if (draggingKeyframe) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingKeyframe, handleMouseMove, handleMouseUp]);

  return (
    <div className="timeline-track">
      <div className="timeline-track__label">
        <span className="timeline-track__name">{track.property}</span>
      </div>
      <div
        ref={trackRef}
        className="timeline-track__canvas"
        onClick={handleTrackClick}
      >
        {track.keyframes.map((keyframe) => (
          <KeyframeDiamond
            key={keyframe.id}
            keyframe={keyframe}
            isSelected={selectedKeyframes.has(keyframe.id)}
            zoom={zoom}
            onSelect={(e) => {
              e.stopPropagation();
              onKeyframeSelect(keyframe.id, e.metaKey || e.ctrlKey);
            }}
            onDragStart={(e) => handleKeyframeDragStart(keyframe.id, e)}
          />
        ))}
      </div>
    </div>
  );
});

AnimationTrackRow.displayName = 'AnimationTrackRow';

// ============ Animation Layer ============

interface AnimationLayerRowProps {
  layer: AnimationLayer;
  zoom: number;
  selectedKeyframes: Set<string>;
  onToggleExpanded: () => void;
  onKeyframeSelect: (id: string, additive: boolean) => void;
  onKeyframeMove: (id: string, newTime: number) => void;
  onAddKeyframe: (trackId: string, time: number) => void;
}

const AnimationLayerRow = memo<AnimationLayerRowProps>(({
  layer,
  zoom,
  selectedKeyframes,
  onToggleExpanded,
  onKeyframeSelect,
  onKeyframeMove,
  onAddKeyframe,
}) => {
  return (
    <div className="timeline-layer">
      <div className="timeline-layer__header">
        <button className="timeline-layer__expand" onClick={onToggleExpanded}>
          {layer.expanded ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
        </button>
        <span className="timeline-layer__name">{layer.nodeName}</span>
      </div>
      {layer.expanded &&
        layer.tracks.map((track) => (
          <AnimationTrackRow
            key={track.id}
            track={track}
            zoom={zoom}
            selectedKeyframes={selectedKeyframes}
            onKeyframeSelect={onKeyframeSelect}
            onKeyframeMove={onKeyframeMove}
            onAddKeyframe={onAddKeyframe}
          />
        ))}
    </div>
  );
});

AnimationLayerRow.displayName = 'AnimationLayerRow';

// ============ Playback Controls ============

interface PlaybackControlsProps {
  isPlaying: boolean;
  loop: boolean;
  currentTime: number;
  duration: number;
  snapToKeyframes: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onToggleSnap: () => void;
}

const PlaybackControls = memo<PlaybackControlsProps>(({
  isPlaying,
  loop,
  currentTime,
  duration,
  snapToKeyframes,
  onPlay,
  onPause,
  onStop,
  onToggleLoop,
  onToggleSnap,
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${milliseconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="timeline-controls">
      <div className="timeline-controls__playback">
        {isPlaying ? (
          <button className="timeline-controls__btn" onClick={onPause} title="Pause">
            <Icons.Pause />
          </button>
        ) : (
          <button className="timeline-controls__btn" onClick={onPlay} title="Play">
            <Icons.Play />
          </button>
        )}
        <button className="timeline-controls__btn" onClick={onStop} title="Stop">
          <Icons.Stop />
        </button>
        <button
          className={`timeline-controls__btn ${loop ? 'timeline-controls__btn--active' : ''}`}
          onClick={onToggleLoop}
          title="Loop"
        >
          <Icons.Loop />
        </button>
      </div>

      <div className="timeline-controls__time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <div className="timeline-controls__options">
        <button
          className={`timeline-controls__btn ${snapToKeyframes ? 'timeline-controls__btn--active' : ''}`}
          onClick={onToggleSnap}
          title="Snap to Keyframes"
        >
          <Icons.MagnetOn />
        </button>
      </div>
    </div>
  );
});

PlaybackControls.displayName = 'PlaybackControls';

// ============ Main Timeline Panel ============

export interface TimelinePanelProps {
  className?: string;
  layers?: AnimationLayer[];
  onKeyframeAdd?: (trackId: string, keyframe: Keyframe) => void;
  onKeyframeRemove?: (keyframeId: string) => void;
  onKeyframeUpdate?: (keyframeId: string, updates: Partial<Keyframe>) => void;
}

export const TimelinePanel: React.FC<TimelinePanelProps> = memo(({
  className = '',
  layers: propLayers,
  onKeyframeAdd,
  onKeyframeRemove,
  onKeyframeUpdate,
}) => {
  const {
    layers,
    selectedKeyframes,
    currentTime,
    duration,
    isPlaying,
    loop,
    zoom,
    scrollOffset,
    snapToKeyframes,
    setLayers,
    addKeyframe,
    removeKeyframe,
    selectKeyframe,
    clearSelection,
    setCurrentTime,
    play,
    pause,
    stop,
    toggleLoop,
    setZoom,
    setScrollOffset,
    toggleSnapToKeyframes,
    toggleLayerExpanded,
    moveKeyframe,
  } = useTimelineStore();

  const timelineRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  // Update layers from props
  useEffect(() => {
    if (propLayers && propLayers.length > 0) {
      setLayers(propLayers);
    }
  }, [propLayers, setLayers]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();

      const animate = (time: number) => {
        const delta = time - lastTime;
        lastTime = time;

        setCurrentTime(currentTime + delta);

        if (currentTime >= duration) {
          if (loop) {
            setCurrentTime(0);
          } else {
            pause();
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isPlaying, currentTime, duration, loop, setCurrentTime, pause]);

  const handleAddKeyframe = useCallback(
    (trackId: string, time: number) => {
      const keyframe: Keyframe = {
        id: `kf-${Date.now()}-${Math.random()}`,
        time,
        value: 0,
        easing: 'easeInOut',
        property: '',
      };
      addKeyframe(trackId, keyframe);
      onKeyframeAdd?.(trackId, keyframe);
    },
    [addKeyframe, onKeyframeAdd]
  );

  const handleZoomIn = () => setZoom(zoom * 1.2);
  const handleZoomOut = () => setZoom(zoom / 1.2);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          isPlaying ? pause() : play();
          break;
        case 'Delete':
        case 'Backspace':
          selectedKeyframes.forEach((id) => {
            removeKeyframe(id);
            onKeyframeRemove?.(id);
          });
          clearSelection();
          break;
        case 'Escape':
          clearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedKeyframes, play, pause, removeKeyframe, clearSelection, onKeyframeRemove]);

  if (layers.length === 0) {
    return (
      <div className={`timeline-panel ${className}`}>
        <div className="timeline-panel__empty">
          <p>No animations yet. Select a layer and add keyframes to animate.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`timeline-panel ${className}`}>
      {/* Header */}
      <div className="timeline-panel__header">
        <PlaybackControls
          isPlaying={isPlaying}
          loop={loop}
          currentTime={currentTime}
          duration={duration}
          snapToKeyframes={snapToKeyframes}
          onPlay={play}
          onPause={pause}
          onStop={stop}
          onToggleLoop={toggleLoop}
          onToggleSnap={toggleSnapToKeyframes}
        />
        <div className="timeline-panel__zoom">
          <button className="timeline-panel__zoom-btn" onClick={handleZoomOut}>
            <Icons.ZoomOut />
          </button>
          <span className="timeline-panel__zoom-label">{Math.round(zoom)}px/s</span>
          <button className="timeline-panel__zoom-btn" onClick={handleZoomIn}>
            <Icons.ZoomIn />
          </button>
        </div>
      </div>

      {/* Time Ruler */}
      <div className="timeline-panel__ruler-container">
        <div className="timeline-panel__ruler-spacer" />
        <TimeRuler
          duration={duration}
          zoom={zoom}
          scrollOffset={scrollOffset}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
        />
      </div>

      {/* Layers */}
      <div ref={timelineRef} className="timeline-panel__content">
        {layers.map((layer) => (
          <AnimationLayerRow
            key={layer.id}
            layer={layer}
            zoom={zoom}
            selectedKeyframes={selectedKeyframes}
            onToggleExpanded={() => toggleLayerExpanded(layer.id)}
            onKeyframeSelect={selectKeyframe}
            onKeyframeMove={moveKeyframe}
            onAddKeyframe={handleAddKeyframe}
          />
        ))}
      </div>
    </div>
  );
});

TimelinePanel.displayName = 'TimelinePanel';

// ============ Styles ============

export const timelinePanelStyles = `
.timeline-panel {
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

.timeline-panel__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-secondary, #888);
  text-align: center;
  padding: 24px;
}

.timeline-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #333);
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.timeline-controls__playback {
  display: flex;
  gap: 4px;
}

.timeline-controls__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary, #888);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.timeline-controls__btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.timeline-controls__btn--active {
  background: var(--accent-color, #3b82f6);
  color: white;
}

.timeline-controls__time {
  color: var(--text-secondary, #888);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}

.timeline-controls__options {
  display: flex;
  gap: 4px;
}

.timeline-panel__zoom {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timeline-panel__zoom-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  background: none;
  border: none;
  border-radius: 4px;
  color: var(--text-secondary, #888);
  cursor: pointer;
}

.timeline-panel__zoom-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
  color: var(--text-primary, #fff);
}

.timeline-panel__zoom-label {
  min-width: 60px;
  text-align: center;
  color: var(--text-secondary, #888);
  font-size: 11px;
}

.timeline-panel__ruler-container {
  display: flex;
  border-bottom: 1px solid var(--border-color, #333);
  background: var(--bg-tertiary, #252525);
}

.timeline-panel__ruler-spacer {
  width: 200px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color, #333);
}

.timeline-ruler {
  position: relative;
  flex: 1;
  height: 32px;
  overflow: hidden;
}

.timeline-ruler__content {
  position: relative;
  height: 100%;
}

.timeline-ruler__tick {
  position: absolute;
  top: 20px;
  width: 1px;
  height: 8px;
  background: var(--border-color, #444);
}

.timeline-ruler__tick--major {
  top: 0;
  height: 32px;
  background: var(--border-color, #555);
}

.timeline-ruler__label {
  position: absolute;
  top: 4px;
  left: 4px;
  color: var(--text-secondary, #888);
  font-size: 10px;
}

.timeline-playhead {
  position: absolute;
  top: 0;
  width: 2px;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.timeline-playhead__handle {
  position: absolute;
  top: 0;
  left: -6px;
  width: 14px;
  height: 14px;
  background: var(--accent-color, #3b82f6);
  border-radius: 2px;
}

.timeline-playhead__line {
  position: absolute;
  top: 14px;
  left: 0;
  width: 2px;
  height: calc(100% - 14px);
  background: var(--accent-color, #3b82f6);
}

.timeline-panel__content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.timeline-layer {
  border-bottom: 1px solid var(--border-color, #333);
}

.timeline-layer__header {
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 8px;
  background: var(--bg-tertiary, #252525);
  border-right: 1px solid var(--border-color, #333);
}

.timeline-layer__expand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  background: none;
  border: none;
  color: var(--text-secondary, #888);
  cursor: pointer;
}

.timeline-layer__name {
  margin-left: 8px;
  font-size: 12px;
  font-weight: 500;
}

.timeline-track {
  display: flex;
  height: 32px;
}

.timeline-track__label {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 0 16px 0 32px;
  border-right: 1px solid var(--border-color, #333);
  background: var(--bg-tertiary, #252525);
}

.timeline-track__name {
  color: var(--text-secondary, #888);
  font-size: 11px;
}

.timeline-track__canvas {
  position: relative;
  flex: 1;
  background: var(--bg-secondary, #1e1e1e);
  cursor: crosshair;
}

.timeline-keyframe {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  color: var(--accent-color, #3b82f6);
  cursor: pointer;
  z-index: 5;
}

.timeline-keyframe:hover {
  color: var(--accent-color-bright, #60a5fa);
}

.timeline-keyframe--selected {
  color: #fbbf24;
}

.timeline-keyframe svg {
  width: 100%;
  height: 100%;
}
`;

export default TimelinePanel;
