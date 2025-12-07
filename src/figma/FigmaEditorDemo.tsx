/**
 * Figma Editor Demo/Integration Example
 * Shows how to integrate the Figma editor into your application
 */

import React from 'react';
import { FigmaEditor, figmaStyles } from './figma';

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = figmaStyles;
document.head.appendChild(styleSheet);

/**
 * EXAMPLE 1: Basic Standalone Editor
 */
export function StandaloneFigmaEditor() {
  const handleSave = (document: any) => {
    console.log('Saving document:', document);
    // Save to localStorage, backend, etc.
    localStorage.setItem('figma-document', JSON.stringify(document));
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FigmaEditor
        onSave={handleSave}
      />
    </div>
  );
}

/**
 * EXAMPLE 2: Collaborative Editor with Room
 */
export function CollaborativeFigmaEditor() {
  const roomId = 'project-abc-123'; // Get from URL or props
  const userId = 'user-' + Math.random().toString(36).substr(2, 9);

  return (
    <FigmaEditor
      roomId={roomId}
      userId={userId}
      onSave={(document) => {
        // Save to backend
        fetch('/api/projects/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, document })
        });
      }}
    />
  );
}

/**
 * EXAMPLE 3: Embedded Editor in Dashboard
 */
export function EmbeddedFigmaEditor() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', background: '#1a1a1a', padding: '20px' }}>
        <h2>Projects</h2>
        <ul>
          <li>Project 1</li>
          <li>Project 2</li>
          <li>Project 3</li>
        </ul>
      </div>
      
      {/* Editor */}
      <div style={{ flex: 1 }}>
        <FigmaEditor
          roomId="embedded-project"
          userId="user-123"
        />
      </div>
    </div>
  );
}

/**
 * EXAMPLE 4: Editor with Custom Toolbar Actions
 */
import { useEditorStore } from './figma';

export function CustomFigmaEditor() {
  const { exportSelection, selectedNodeIds } = useEditorStore();

  const handleExportPNG = async () => {
    if (selectedNodeIds.length > 0) {
      await exportSelection('PNG');
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <FigmaEditor />
      
      {/* Custom floating actions */}
      <div style={{
        position: 'absolute',
        top: '80px',
        right: '20px',
        background: '#2a2a2a',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <button onClick={handleExportPNG} style={{
          padding: '8px 16px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}>
          Export PNG
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 5: Programmatic Node Creation
 */
export function ProgrammaticDesign() {
  const { createNode, sceneGraph } = useEditorStore();

  const createDesignSystem = () => {
    // Create a frame
    const frameId = createNode('FRAME', {
      name: 'Design System',
      x: 0,
      y: 0,
      width: 1920,
      height: 1080,
      fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95, a: 1 }, visible: true, opacity: 1 }]
    });

    // Create buttons
    const colors = [
      { name: 'Primary', color: { r: 0.23, g: 0.51, b: 0.96, a: 1 } },
      { name: 'Secondary', color: { r: 0.59, g: 0.28, b: 1, a: 1 } },
      { name: 'Success', color: { r: 0.13, g: 0.77, b: 0.49, a: 1 } },
      { name: 'Danger', color: { r: 0.94, g: 0.27, b: 0.27, a: 1 } },
    ];

    colors.forEach((btn, index) => {
      const buttonId = createNode('RECTANGLE', {
        name: btn.name + ' Button',
        x: 50 + (index * 200),
        y: 100,
        width: 150,
        height: 50,
        cornerRadius: 8,
        fills: [{ type: 'SOLID', color: btn.color, visible: true, opacity: 1 }]
      });

      // Add to frame
      const frame = sceneGraph.findNode(frameId);
      const button = sceneGraph.findNode(buttonId);
      if (frame && button) {
        sceneGraph.appendChild(frameId, buttonId);
      }
    });

    console.log('Design system created!');
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <FigmaEditor />
      
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#2a2a2a',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <button onClick={createDesignSystem} style={{
          padding: '10px 20px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}>
          Generate Design System
        </button>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 6: With Animation
 */
export function AnimatedDesign() {
  const { createNode, animationTimeline } = useEditorStore();

  const createAnimatedLogo = () => {
    // Create circle
    const circleId = createNode('ELLIPSE', {
      name: 'Animated Circle',
      x: 500,
      y: 300,
      width: 200,
      height: 200,
      fills: [{ type: 'SOLID', color: { r: 0.4, g: 0.6, b: 1, a: 1 }, visible: true, opacity: 1 }]
    });

    // Animate scale
    const scaleAnim = animationTimeline.createAnimation(circleId, 'scale');
    animationTimeline.addKeyframe(scaleAnim.id, 0, 1, 'linear');
    animationTimeline.addKeyframe(scaleAnim.id, 1000, 1.5, 'easeInOut');
    animationTimeline.addKeyframe(scaleAnim.id, 2000, 1, 'easeInOut');

    // Animate opacity
    const opacityAnim = animationTimeline.createAnimation(circleId, 'opacity');
    animationTimeline.addKeyframe(opacityAnim.id, 0, 1, 'linear');
    animationTimeline.addKeyframe(opacityAnim.id, 1000, 0.5, 'easeInOut');
    animationTimeline.addKeyframe(opacityAnim.id, 2000, 1, 'easeInOut');

    // Play animations
    animationTimeline.play(scaleAnim.id);
    animationTimeline.play(opacityAnim.id);

    console.log('Animated logo created!');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FigmaEditor />
      
      <button
        onClick={createAnimatedLogo}
        style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: '#8b5cf6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 1000
        }}
      >
        Create Animated Logo
      </button>
    </div>
  );
}

/**
 * EXAMPLE 7: Plugin Integration
 */
export function WithPlugins() {
  const { pluginManager } = useEditorStore();

  const installExamplePlugin = () => {
    const plugin = {
      id: 'color-palette-generator',
      name: 'Color Palette Generator',
      version: '1.0.0',
      capabilities: ['read', 'write'] as const,
      entry: `
        // Plugin code
        figma.on('selectionchange', (nodes) => {
          console.log('Selection:', nodes.length, 'nodes');
        });

        figma.ui.show({
          title: 'Color Palette',
          width: 300,
          height: 400,
          html: '<div><h2>Generate Palette</h2><button onclick="generate()">Generate</button></div>'
        });

        function generate() {
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
          colors.forEach((color, i) => {
            figma.createRectangle({
              x: i * 100,
              y: 100,
              width: 80,
              height: 80,
              fills: [{ type: 'SOLID', color: hexToRgb(color) }]
            });
          });
        }
      `
    };

    pluginManager.installPlugin(plugin);
    pluginManager.enablePlugin('color-palette-generator');
    console.log('Plugin installed!');
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <FigmaEditor />
      
      <button
        onClick={installExamplePlugin}
        style={{
          position: 'absolute',
          top: '80px',
          right: '340px',
          padding: '10px 20px',
          background: '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          zIndex: 1000
        }}
      >
        Install Color Plugin
      </button>
    </div>
  );
}

/**
 * Default export - renders basic editor
 */
export default function FigmaEditorDemo() {
  return <StandaloneFigmaEditor />;
}

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Import the component you want:
 *    import { StandaloneFigmaEditor } from './FigmaEditorDemo';
 * 
 * 2. Render it in your app:
 *    <StandaloneFigmaEditor />
 * 
 * 3. Or use the default export:
 *    import FigmaEditorDemo from './FigmaEditorDemo';
 *    <FigmaEditorDemo />
 * 
 * 4. For collaborative editing:
 *    <CollaborativeFigmaEditor />
 * 
 * 5. For programmatic control:
 *    const { createNode, sceneGraph } = useEditorStore();
 *    // Create nodes, animate, export, etc.
 */
