/**
 * PluginAPI - Full Figma-level Plugin System
 * Sandboxed execution, capability system, event hooks, UI panels
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============ Types ============

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  icon?: string;
  main: string; // Entry point file
  ui?: string; // UI HTML file
  
  // Permissions
  permissions: PluginPermission[];
  
  // Menu configuration
  menu?: PluginMenuItem[];
  
  // Relaunch buttons
  relaunchButtons?: RelaunchButton[];
  
  // Parameter definitions
  parameters?: ParameterDefinition[];
  
  // Network access domains
  networkAccess?: {
    allowedDomains: string[];
    reasoning: string;
  };
  
  // Document access
  documentAccess?: 'current-document' | 'any-document';
  
  // Enable code generation
  codegenLanguages?: string[];
}

export type PluginPermission = 
  | 'read-nodes'
  | 'write-nodes'
  | 'read-styles'
  | 'write-styles'
  | 'read-components'
  | 'write-components'
  | 'read-variables'
  | 'write-variables'
  | 'network-access'
  | 'clipboard-read'
  | 'clipboard-write'
  | 'local-storage'
  | 'show-ui'
  | 'timer-access'
  | 'selection-access'
  | 'viewport-access'
  | 'export-access';

export interface PluginMenuItem {
  name: string;
  command: string;
  parameters?: ParameterDefinition[];
  submenu?: PluginMenuItem[];
}

export interface RelaunchButton {
  command: string;
  name: string;
  multipleSelection?: boolean;
}

export interface ParameterDefinition {
  key: string;
  name: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'dropdown';
  options?: Array<{ name: string; value: string }>;
  default?: any;
  optional?: boolean;
}

export interface PluginInstance {
  manifest: PluginManifest;
  sandbox: PluginSandbox;
  ui: PluginUI | null;
  state: 'loading' | 'running' | 'stopped' | 'error';
  error?: string;
}

export interface PluginMessage {
  type: string;
  payload: any;
}

// ============ Plugin Sandbox ============

export class PluginSandbox {
  private iframe: HTMLIFrameElement | null = null;
  private worker: Worker | null = null;
  private manifest: PluginManifest;
  private messageHandlers: Map<string, (payload: any) => void> = new Map();
  private api: PluginAPIBridge;
  private isDestroyed: boolean = false;

  constructor(manifest: PluginManifest, api: PluginAPIBridge) {
    this.manifest = manifest;
    this.api = api;
  }

  async initialize(code: string): Promise<void> {
    // Create sandboxed iframe for plugin execution
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.sandbox.add('allow-scripts');
    
    document.body.appendChild(this.iframe);

    // Inject API bridge and plugin code
    const sandboxedCode = this.createSandboxedCode(code);
    
    return new Promise((resolve, reject) => {
      if (!this.iframe?.contentWindow) {
        reject(new Error('Failed to create sandbox'));
        return;
      }

      // Set up message listener for sandbox communication
      const messageHandler = (event: MessageEvent) => {
        if (event.source !== this.iframe?.contentWindow) return;
        this.handleSandboxMessage(event.data);
      };

      window.addEventListener('message', messageHandler);

      // Write sandboxed code to iframe
      const doc = this.iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <script>
              ${sandboxedCode}
            </script>
          </head>
          <body></body>
          </html>
        `);
        doc.close();
      }

      // Wait for initialization
      setTimeout(resolve, 100);
    });
  }

  private createSandboxedCode(pluginCode: string): string {
    const permissions = this.manifest.permissions;
    
    return `
      (function() {
        'use strict';
        
        // Create figma API object
        const figma = {
          // Selection
          ${permissions.includes('selection-access') ? `
          currentPage: {
            selection: [],
            findAll: (callback) => {
              return sendMessage('findAll', { callback: callback.toString() });
            },
            findOne: (callback) => {
              return sendMessage('findOne', { callback: callback.toString() });
            },
            findChildren: (callback) => {
              return sendMessage('findChildren', { callback: callback.toString() });
            },
          },
          ` : ''}
          
          ${permissions.includes('viewport-access') ? `
          viewport: {
            center: { x: 0, y: 0 },
            zoom: 1,
            scrollAndZoomIntoView: (nodes) => {
              sendMessage('scrollAndZoomIntoView', { nodeIds: nodes.map(n => n.id) });
            },
          },
          ` : ''}
          
          // Node creation
          ${permissions.includes('write-nodes') ? `
          createRectangle: () => sendMessage('createRectangle', {}),
          createEllipse: () => sendMessage('createEllipse', {}),
          createPolygon: () => sendMessage('createPolygon', {}),
          createStar: () => sendMessage('createStar', {}),
          createLine: () => sendMessage('createLine', {}),
          createText: () => sendMessage('createText', {}),
          createFrame: () => sendMessage('createFrame', {}),
          createComponent: () => sendMessage('createComponent', {}),
          createPage: () => sendMessage('createPage', {}),
          createSlice: () => sendMessage('createSlice', {}),
          createVector: () => sendMessage('createVector', {}),
          createBooleanOperation: () => sendMessage('createBooleanOperation', {}),
          group: (nodes, parent) => sendMessage('group', { nodeIds: nodes.map(n => n.id), parentId: parent?.id }),
          flatten: (nodes) => sendMessage('flatten', { nodeIds: nodes.map(n => n.id) }),
          union: (nodes) => sendMessage('union', { nodeIds: nodes.map(n => n.id) }),
          subtract: (nodes) => sendMessage('subtract', { nodeIds: nodes.map(n => n.id) }),
          intersect: (nodes) => sendMessage('intersect', { nodeIds: nodes.map(n => n.id) }),
          exclude: (nodes) => sendMessage('exclude', { nodeIds: nodes.map(n => n.id) }),
          ` : ''}
          
          // Node reading
          ${permissions.includes('read-nodes') ? `
          getNodeById: (id) => sendMessage('getNodeById', { id }),
          root: {
            children: [],
            findAll: (callback) => sendMessage('rootFindAll', { callback: callback.toString() }),
          },
          ` : ''}
          
          // Styles
          ${permissions.includes('read-styles') ? `
          getLocalPaintStyles: () => sendMessage('getLocalPaintStyles', {}),
          getLocalTextStyles: () => sendMessage('getLocalTextStyles', {}),
          getLocalEffectStyles: () => sendMessage('getLocalEffectStyles', {}),
          getLocalGridStyles: () => sendMessage('getLocalGridStyles', {}),
          ` : ''}
          
          ${permissions.includes('write-styles') ? `
          createPaintStyle: () => sendMessage('createPaintStyle', {}),
          createTextStyle: () => sendMessage('createTextStyle', {}),
          createEffectStyle: () => sendMessage('createEffectStyle', {}),
          createGridStyle: () => sendMessage('createGridStyle', {}),
          ` : ''}
          
          // Components
          ${permissions.includes('read-components') ? `
          getLocalComponents: () => sendMessage('getLocalComponents', {}),
          getLocalComponentSets: () => sendMessage('getLocalComponentSets', {}),
          ` : ''}
          
          // Variables
          ${permissions.includes('read-variables') ? `
          variables: {
            getLocalVariables: () => sendMessage('getLocalVariables', {}),
            getVariableById: (id) => sendMessage('getVariableById', { id }),
            getLocalVariableCollections: () => sendMessage('getLocalVariableCollections', {}),
          },
          ` : ''}
          
          ${permissions.includes('write-variables') ? `
          variables: {
            ...figma.variables,
            createVariable: (name, collection, type) => sendMessage('createVariable', { name, collectionId: collection.id, type }),
            createVariableCollection: (name) => sendMessage('createVariableCollection', { name }),
          },
          ` : ''}
          
          // UI
          ${permissions.includes('show-ui') ? `
          showUI: (html, options) => sendMessage('showUI', { html, options }),
          ui: {
            postMessage: (msg) => sendMessage('uiPostMessage', { message: msg }),
            onmessage: null,
            close: () => sendMessage('closeUI', {}),
            resize: (width, height) => sendMessage('resizeUI', { width, height }),
          },
          ` : ''}
          
          // Clipboard
          ${permissions.includes('clipboard-read') ? `
          clipboard: {
            readText: () => sendMessage('clipboardRead', {}),
          },
          ` : ''}
          
          ${permissions.includes('clipboard-write') ? `
          clipboard: {
            ...figma.clipboard,
            writeText: (text) => sendMessage('clipboardWrite', { text }),
          },
          ` : ''}
          
          // Export
          ${permissions.includes('export-access') ? `
          exportAsync: (settings) => sendMessage('exportAsync', { settings }),
          ` : ''}
          
          // Storage
          ${permissions.includes('local-storage') ? `
          clientStorage: {
            getAsync: (key) => sendMessage('storageGet', { key }),
            setAsync: (key, value) => sendMessage('storageSet', { key, value }),
            deleteAsync: (key) => sendMessage('storageDelete', { key }),
            keysAsync: () => sendMessage('storageKeys', {}),
          },
          ` : ''}
          
          // Timer
          ${permissions.includes('timer-access') ? `
          timer: {
            start: () => sendMessage('timerStart', {}),
            stop: () => sendMessage('timerStop', {}),
            elapsed: 0,
          },
          ` : ''}
          
          // Notifications
          notify: (message, options) => sendMessage('notify', { message, options }),
          
          // Close plugin
          closePlugin: (message) => sendMessage('closePlugin', { message }),
          
          // Parameters
          parameters: {
            on: (type, callback) => {
              registerHandler('parameters_' + type, callback);
            },
          },
          
          // Mixed value
          mixed: Symbol('mixed'),
          
          // Commands
          command: null,
          
          // Plugin data
          getPluginData: (key) => sendMessage('getPluginData', { key }),
          setPluginData: (key, value) => sendMessage('setPluginData', { key, value }),
          getSharedPluginData: (namespace, key) => sendMessage('getSharedPluginData', { namespace, key }),
          setSharedPluginData: (namespace, key, value) => sendMessage('setSharedPluginData', { namespace, key, value }),
        };
        
        // Message sending
        const pendingMessages = new Map();
        let messageId = 0;
        
        function sendMessage(type, payload) {
          return new Promise((resolve, reject) => {
            const id = messageId++;
            pendingMessages.set(id, { resolve, reject });
            
            parent.postMessage({
              source: 'plugin-sandbox',
              id,
              type,
              payload,
              pluginId: '${this.manifest.id}',
            }, '*');
          });
        }
        
        function registerHandler(type, callback) {
          window['handler_' + type] = callback;
        }
        
        // Message receiving
        window.addEventListener('message', (event) => {
          const data = event.data;
          if (data.source !== 'plugin-host') return;
          
          if (data.id !== undefined && pendingMessages.has(data.id)) {
            const { resolve, reject } = pendingMessages.get(data.id);
            pendingMessages.delete(data.id);
            
            if (data.error) {
              reject(new Error(data.error));
            } else {
              resolve(data.result);
            }
          } else if (data.type === 'ui-message' && figma.ui.onmessage) {
            figma.ui.onmessage(data.payload);
          } else if (data.type && window['handler_' + data.type]) {
            window['handler_' + data.type](data.payload);
          }
        });
        
        // Run plugin code
        try {
          ${pluginCode}
        } catch (error) {
          sendMessage('error', { message: error.message, stack: error.stack });
        }
      })();
    `;
  }

  private handleSandboxMessage(data: any): void {
    if (data.source !== 'plugin-sandbox') return;
    if (data.pluginId !== this.manifest.id) return;

    this.api.handlePluginRequest(data.type, data.payload, (result, error) => {
      if (this.iframe?.contentWindow) {
        this.iframe.contentWindow.postMessage({
          source: 'plugin-host',
          id: data.id,
          result,
          error,
        }, '*');
      }
    });
  }

  sendMessage(type: string, payload: any): void {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage({
        source: 'plugin-host',
        type,
        payload,
      }, '*');
    }
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.messageHandlers.clear();
  }
}

// ============ Plugin UI ============

export class PluginUI {
  private container: HTMLDivElement | null = null;
  private iframe: HTMLIFrameElement | null = null;
  private onMessage: (msg: any) => void;
  private onClose: () => void;

  constructor(onMessage: (msg: any) => void, onClose: () => void) {
    this.onMessage = onMessage;
    this.onClose = onClose;
  }

  show(html: string, options?: { width?: number; height?: number; title?: string; visible?: boolean }): void {
    if (this.container) {
      this.close();
    }

    // Create container
    this.container = document.createElement('div');
    this.container.className = 'plugin-ui-container';
    this.container.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${options?.width || 300}px;
      height: ${options?.height || 400}px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;

    // Create title bar
    const titleBar = document.createElement('div');
    titleBar.style.cssText = `
      padding: 8px 12px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: move;
    `;
    titleBar.innerHTML = `
      <span style="font-weight: 500; font-size: 13px;">${options?.title || 'Plugin'}</span>
      <button class="plugin-close-btn" style="
        border: none;
        background: none;
        cursor: pointer;
        padding: 4px;
        font-size: 16px;
      ">×</button>
    `;

    const closeBtn = titleBar.querySelector('.plugin-close-btn');
    closeBtn?.addEventListener('click', () => this.close());

    // Make draggable
    this.makeDraggable(this.container, titleBar);

    // Create iframe for UI
    this.iframe = document.createElement('iframe');
    this.iframe.style.cssText = `
      flex: 1;
      border: none;
      width: 100%;
    `;
    this.iframe.sandbox.add('allow-scripts', 'allow-forms');

    // Set up message handling
    window.addEventListener('message', this.handleUIMessage);

    // Write HTML to iframe
    this.container.appendChild(titleBar);
    this.container.appendChild(this.iframe);
    document.body.appendChild(this.container);

    // Inject parent messaging API
    const uiCode = `
      <!DOCTYPE html>
      <html>
      <head>
        <script>
          const parent = {
            postMessage: (msg, origin) => {
              window.parent.postMessage({
                source: 'plugin-ui',
                payload: msg,
              }, '*');
            },
          };
          
          window.onmessage = (event) => {
            if (event.data.source === 'plugin-host' && event.data.type === 'message') {
              if (typeof onmessage === 'function') {
                onmessage(event.data.payload);
              }
            }
          };
        </script>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;

    const doc = this.iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(uiCode);
      doc.close();
    }

    if (options?.visible === false) {
      this.container.style.display = 'none';
    }
  }

  private handleUIMessage = (event: MessageEvent): void => {
    if (event.data?.source === 'plugin-ui') {
      this.onMessage(event.data.payload);
    }
  };

  postMessage(message: any): void {
    if (this.iframe?.contentWindow) {
      this.iframe.contentWindow.postMessage({
        source: 'plugin-host',
        type: 'message',
        payload: message,
      }, '*');
    }
  }

  resize(width: number, height: number): void {
    if (this.container) {
      this.container.style.width = `${width}px`;
      this.container.style.height = `${height}px`;
    }
  }

  close(): void {
    window.removeEventListener('message', this.handleUIMessage);
    
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
      this.iframe = null;
    }
    
    this.onClose();
  }

  private makeDraggable(container: HTMLElement, handle: HTMLElement): void {
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).classList.contains('plugin-close-btn')) return;
      
      isDragging = true;
      offsetX = e.clientX - container.offsetLeft;
      offsetY = e.clientY - container.offsetTop;
      container.style.transform = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      container.style.left = `${e.clientX - offsetX}px`;
      container.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }
}

// ============ Plugin API Bridge ============

export class PluginAPIBridge {
  private getNodes: () => Map<string, any>;
  private setNode: (id: string, node: any) => void;
  private createNode: (type: string) => any;
  private deleteNode: (id: string) => void;
  private getSelection: () => string[];
  private setSelection: (ids: string[]) => void;
  private notify: (message: string, options?: any) => void;
  private storage: Map<string, any> = new Map();

  constructor(options: {
    getNodes: () => Map<string, any>;
    setNode: (id: string, node: any) => void;
    createNode: (type: string) => any;
    deleteNode: (id: string) => void;
    getSelection: () => string[];
    setSelection: (ids: string[]) => void;
    notify: (message: string, options?: any) => void;
  }) {
    this.getNodes = options.getNodes;
    this.setNode = options.setNode;
    this.createNode = options.createNode;
    this.deleteNode = options.deleteNode;
    this.getSelection = options.getSelection;
    this.setSelection = options.setSelection;
    this.notify = options.notify;
  }

  handlePluginRequest(
    type: string,
    payload: any,
    respond: (result: any, error?: string) => void
  ): void {
    try {
      const result = this.executeRequest(type, payload);
      respond(result);
    } catch (error) {
      respond(null, (error as Error).message);
    }
  }

  private executeRequest(type: string, payload: any): any {
    switch (type) {
      // Node operations
      case 'getNodeById':
        return this.getNodes().get(payload.id);
      
      case 'createRectangle':
        return this.createNode('RECTANGLE');
      
      case 'createEllipse':
        return this.createNode('ELLIPSE');
      
      case 'createFrame':
        return this.createNode('FRAME');
      
      case 'createText':
        return this.createNode('TEXT');
      
      case 'createComponent':
        return this.createNode('COMPONENT');
      
      case 'createVector':
        return this.createNode('VECTOR');
      
      // Selection
      case 'getSelection':
        return this.getSelection();
      
      case 'setSelection':
        this.setSelection(payload.ids);
        return true;
      
      // Storage
      case 'storageGet':
        return this.storage.get(payload.key);
      
      case 'storageSet':
        this.storage.set(payload.key, payload.value);
        return true;
      
      case 'storageDelete':
        this.storage.delete(payload.key);
        return true;
      
      case 'storageKeys':
        return Array.from(this.storage.keys());
      
      // Notifications
      case 'notify':
        this.notify(payload.message, payload.options);
        return true;
      
      // Plugin close
      case 'closePlugin':
        return { close: true, message: payload.message };
      
      // Clipboard
      case 'clipboardRead':
        return navigator.clipboard.readText();
      
      case 'clipboardWrite':
        navigator.clipboard.writeText(payload.text);
        return true;
      
      default:
        throw new Error(`Unknown plugin API request: ${type}`);
    }
  }
}

// ============ Plugin Manager Store ============

interface PluginManagerState {
  // Installed plugins
  plugins: Map<string, PluginManifest>;
  
  // Running plugins
  runningPlugins: Map<string, PluginInstance>;
  
  // Plugin settings
  pluginSettings: Map<string, Record<string, any>>;
  
  // Recent plugins
  recentPlugins: string[];
  
  // Actions
  installPlugin: (manifest: PluginManifest, code: string) => Promise<void>;
  uninstallPlugin: (id: string) => void;
  
  runPlugin: (id: string, command?: string, parameters?: Record<string, any>) => Promise<void>;
  stopPlugin: (id: string) => void;
  
  getPluginState: (id: string) => PluginInstance | undefined;
  
  setPluginSetting: (pluginId: string, key: string, value: any) => void;
  getPluginSetting: (pluginId: string, key: string) => any;
  
  // UI
  showPluginUI: (pluginId: string, html: string, options?: any) => void;
  closePluginUI: (pluginId: string) => void;
  postMessageToPlugin: (pluginId: string, message: any) => void;
  
  // Community plugins
  fetchCommunityPlugins: () => Promise<PluginManifest[]>;
}

export const usePluginManager = create<PluginManagerState>()(
  subscribeWithSelector((set, get) => ({
    plugins: new Map(),
    runningPlugins: new Map(),
    pluginSettings: new Map(),
    recentPlugins: [],

    installPlugin: async (manifest: PluginManifest, code: string) => {
      // Validate manifest
      if (!manifest.id || !manifest.name || !manifest.version) {
        throw new Error('Invalid plugin manifest');
      }

      // Check for required permissions
      const dangerousPermissions = manifest.permissions.filter(p => 
        ['network-access', 'clipboard-read', 'clipboard-write'].includes(p)
      );

      if (dangerousPermissions.length > 0) {
        // Would show permission dialog here
        console.log('Plugin requires sensitive permissions:', dangerousPermissions);
      }

      // Store plugin
      set(state => {
        const newPlugins = new Map(state.plugins);
        newPlugins.set(manifest.id, manifest);
        
        // Store code in localStorage
        localStorage.setItem(`plugin_code_${manifest.id}`, code);
        
        return { plugins: newPlugins };
      });
    },

    uninstallPlugin: (id: string) => {
      const { runningPlugins } = get();
      
      // Stop if running
      if (runningPlugins.has(id)) {
        get().stopPlugin(id);
      }

      // Remove from storage
      localStorage.removeItem(`plugin_code_${id}`);

      set(state => {
        const newPlugins = new Map(state.plugins);
        newPlugins.delete(id);
        
        const newSettings = new Map(state.pluginSettings);
        newSettings.delete(id);
        
        return { 
          plugins: newPlugins, 
          pluginSettings: newSettings,
          recentPlugins: state.recentPlugins.filter(p => p !== id),
        };
      });
    },

    runPlugin: async (id: string, command?: string, parameters?: Record<string, any>) => {
      const { plugins, runningPlugins } = get();
      const manifest = plugins.get(id);

      if (!manifest) {
        throw new Error(`Plugin ${id} not found`);
      }

      // Stop existing instance if running
      if (runningPlugins.has(id)) {
        get().stopPlugin(id);
      }

      // Create API bridge
      const api = new PluginAPIBridge({
        getNodes: () => new Map(), // Would connect to scene graph
        setNode: () => {},
        createNode: (type: string) => ({ id: `node_${Date.now()}`, type }),
        deleteNode: () => {},
        getSelection: () => [],
        setSelection: () => {},
        notify: (message: string) => {
          // Would show notification
          console.log('Plugin notification:', message);
        },
      });

      // Create sandbox
      const sandbox = new PluginSandbox(manifest, api);

      // Get plugin code
      const code = localStorage.getItem(`plugin_code_${id}`);
      if (!code) {
        throw new Error(`Plugin code for ${id} not found`);
      }

      // Initialize sandbox
      await sandbox.initialize(code);

      // Create plugin instance
      const instance: PluginInstance = {
        manifest,
        sandbox,
        ui: null,
        state: 'running',
      };

      // Update state
      set(state => {
        const newRunning = new Map(state.runningPlugins);
        newRunning.set(id, instance);
        
        const newRecent = [id, ...state.recentPlugins.filter(p => p !== id)].slice(0, 10);
        
        return { runningPlugins: newRunning, recentPlugins: newRecent };
      });

      // Send command if specified
      if (command) {
        sandbox.sendMessage('command', { command, parameters });
      }
    },

    stopPlugin: (id: string) => {
      const { runningPlugins } = get();
      const instance = runningPlugins.get(id);

      if (!instance) return;

      // Close UI
      if (instance.ui) {
        instance.ui.close();
      }

      // Destroy sandbox
      instance.sandbox.destroy();

      set(state => {
        const newRunning = new Map(state.runningPlugins);
        newRunning.delete(id);
        return { runningPlugins: newRunning };
      });
    },

    getPluginState: (id: string) => {
      return get().runningPlugins.get(id);
    },

    setPluginSetting: (pluginId: string, key: string, value: any) => {
      set(state => {
        const newSettings = new Map(state.pluginSettings);
        const pluginSettings = newSettings.get(pluginId) || {};
        pluginSettings[key] = value;
        newSettings.set(pluginId, pluginSettings);
        
        // Persist
        localStorage.setItem(`plugin_settings_${pluginId}`, JSON.stringify(pluginSettings));
        
        return { pluginSettings: newSettings };
      });
    },

    getPluginSetting: (pluginId: string, key: string) => {
      const { pluginSettings } = get();
      const settings = pluginSettings.get(pluginId);
      return settings?.[key];
    },

    showPluginUI: (pluginId: string, html: string, options?: any) => {
      const { runningPlugins } = get();
      const instance = runningPlugins.get(pluginId);

      if (!instance) return;

      // Close existing UI
      if (instance.ui) {
        instance.ui.close();
      }

      // Create new UI
      const ui = new PluginUI(
        (msg) => {
          // Forward message to sandbox
          instance.sandbox.sendMessage('ui-message', msg);
        },
        () => {
          // UI closed
          set(state => {
            const newRunning = new Map(state.runningPlugins);
            const inst = newRunning.get(pluginId);
            if (inst) {
              newRunning.set(pluginId, { ...inst, ui: null });
            }
            return { runningPlugins: newRunning };
          });
        }
      );

      ui.show(html, options);

      set(state => {
        const newRunning = new Map(state.runningPlugins);
        const inst = newRunning.get(pluginId);
        if (inst) {
          newRunning.set(pluginId, { ...inst, ui });
        }
        return { runningPlugins: newRunning };
      });
    },

    closePluginUI: (pluginId: string) => {
      const { runningPlugins } = get();
      const instance = runningPlugins.get(pluginId);

      if (instance?.ui) {
        instance.ui.close();
      }
    },

    postMessageToPlugin: (pluginId: string, message: any) => {
      const { runningPlugins } = get();
      const instance = runningPlugins.get(pluginId);

      if (instance?.ui) {
        instance.ui.postMessage(message);
      }
    },

    fetchCommunityPlugins: async () => {
      // Would fetch from community plugin registry
      // For now, return empty array
      return [];
    },
  }))
);

// ============ Plugin Development Helpers ============

export function createPluginManifest(options: Partial<PluginManifest>): PluginManifest {
  return {
    id: options.id || `plugin_${Date.now()}`,
    name: options.name || 'Untitled Plugin',
    version: options.version || '1.0.0',
    description: options.description || '',
    author: options.author || 'Unknown',
    main: options.main || 'code.js',
    permissions: options.permissions || ['read-nodes'],
    ...options,
  };
}

export function validatePluginManifest(manifest: any): string[] {
  const errors: string[] = [];

  if (!manifest.id) errors.push('Missing plugin ID');
  if (!manifest.name) errors.push('Missing plugin name');
  if (!manifest.version) errors.push('Missing plugin version');
  if (!manifest.main) errors.push('Missing main entry point');
  
  if (manifest.permissions) {
    const validPermissions: PluginPermission[] = [
      'read-nodes', 'write-nodes', 'read-styles', 'write-styles',
      'read-components', 'write-components', 'read-variables', 'write-variables',
      'network-access', 'clipboard-read', 'clipboard-write', 'local-storage',
      'show-ui', 'timer-access', 'selection-access', 'viewport-access', 'export-access',
    ];
    
    for (const perm of manifest.permissions) {
      if (!validPermissions.includes(perm)) {
        errors.push(`Invalid permission: ${perm}`);
      }
    }
  }

  return errors;
}

export default usePluginManager;
