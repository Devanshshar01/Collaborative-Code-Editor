/**
 * ComponentSystem - Full Figma-level Component Management
 * Components, Variants, Instances, Overrides, Properties, and Library Sync
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import {
  ComponentNode,
  ComponentSetNode,
  InstanceNode,
  ComponentPropertyDefinition,
  ComponentProperties,
  Override,
  BaseNode,
  createNode,
} from './SceneGraph';

// ============ Types ============

export interface ComponentMaster {
  id: string;
  key: string;
  name: string;
  description: string;
  documentationLinks: string[];
  propertyDefinitions: Record<string, ComponentPropertyDefinition>;
  variants: Record<string, string>; // Property name -> value for variant identification
  nodeData: ComponentNode;
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  version: number;
  isPublished: boolean;
  libraryId?: string;
}

export interface ComponentSet {
  id: string;
  key: string;
  name: string;
  description: string;
  propertyDefinitions: Record<string, ComponentPropertyDefinition>;
  variantGroupProperties: Record<string, string[]>; // Property name -> possible values
  componentIds: string[];
  defaultComponentId: string;
  nodeData: ComponentSetNode;
  thumbnail?: string;
  isPublished: boolean;
  libraryId?: string;
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  componentKey: string;
  name: string;
  nodeData: InstanceNode;
  overrides: InstanceOverride[];
  swappedComponentId?: string;
  detached: boolean;
}

export interface InstanceOverride {
  nodeId: string;
  path: string[];
  property: string;
  value: any;
  isReset: boolean;
}

export interface ComponentLibrary {
  id: string;
  name: string;
  description: string;
  teamId: string;
  projectId: string;
  componentKeys: string[];
  componentSetKeys: string[];
  styles: Record<string, any>;
  version: number;
  publishedAt: number;
  isEnabled: boolean;
}

// ============ Helper Functions ============

function generateComponentKey(): string {
  return `component:${nanoid(16)}`;
}

function parseVariantName(name: string): Record<string, string> {
  const variants: Record<string, string> = {};
  const parts = name.split(',').map(p => p.trim());
  
  for (const part of parts) {
    const [key, value] = part.split('=').map(s => s.trim());
    if (key && value) {
      variants[key] = value;
    }
  }
  
  return variants;
}

function buildVariantName(variants: Record<string, string>): string {
  return Object.entries(variants)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

function deepCloneNode(node: BaseNode, idMap: Map<string, string>): BaseNode {
  const newId = nanoid();
  idMap.set(node.id, newId);
  
  const cloned = JSON.parse(JSON.stringify(node));
  cloned.id = newId;
  
  if ('childIds' in cloned && Array.isArray(cloned.childIds)) {
    cloned.childIds = cloned.childIds.map((childId: string) => {
      const newChildId = idMap.get(childId) || nanoid();
      idMap.set(childId, newChildId);
      return newChildId;
    });
  }
  
  return cloned;
}

function applyOverrides(
  instanceNode: InstanceNode,
  masterNode: ComponentNode,
  overrides: InstanceOverride[],
  nodeMap: Map<string, BaseNode>
): BaseNode {
  const clonedMaster = JSON.parse(JSON.stringify(masterNode));
  
  for (const override of overrides) {
    if (override.isReset) continue;
    
    let target = clonedMaster;
    
    // Navigate to the correct node in the hierarchy
    for (const pathSegment of override.path) {
      if (!target) break;
      
      if ('childIds' in target) {
        const childId = (target as any).childIds.find((id: string) => {
          const child = nodeMap.get(id);
          return child?.name === pathSegment;
        });
        
        if (childId) {
          target = nodeMap.get(childId) as any;
        }
      }
    }
    
    if (target) {
      (target as any)[override.property] = override.value;
    }
  }
  
  // Apply instance-level transforms
  clonedMaster.x = instanceNode.x;
  clonedMaster.y = instanceNode.y;
  clonedMaster.rotation = instanceNode.rotation;
  
  if (instanceNode.scaleFactor !== 1) {
    clonedMaster.width = masterNode.width * instanceNode.scaleFactor;
    clonedMaster.height = masterNode.height * instanceNode.scaleFactor;
  }
  
  return clonedMaster;
}

// ============ Main Store ============

interface ComponentSystemState {
  // Masters
  components: Map<string, ComponentMaster>;
  componentSets: Map<string, ComponentSet>;
  
  // Instances
  instances: Map<string, ComponentInstance>;
  
  // Libraries
  libraries: Map<string, ComponentLibrary>;
  enabledLibraryIds: Set<string>;
  
  // Local draft components (not yet saved)
  draftComponents: Map<string, ComponentMaster>;
  
  // Actions
  createComponent: (node: BaseNode, name?: string) => ComponentMaster;
  createComponentSet: (components: ComponentMaster[], name?: string) => ComponentSet;
  createInstance: (componentId: string, x: number, y: number) => ComponentInstance;
  
  updateComponentMaster: (componentId: string, updates: Partial<ComponentMaster>) => void;
  updateComponentProperty: (componentId: string, propertyName: string, definition: ComponentPropertyDefinition) => void;
  addComponentProperty: (componentId: string, propertyName: string, definition: ComponentPropertyDefinition) => void;
  removeComponentProperty: (componentId: string, propertyName: string) => void;
  
  updateInstance: (instanceId: string, overrides: InstanceOverride[]) => void;
  resetInstanceOverrides: (instanceId: string, propertyPath?: string[]) => void;
  detachInstance: (instanceId: string) => BaseNode;
  swapInstance: (instanceId: string, newComponentId: string) => void;
  
  addVariant: (componentSetId: string, variantValues: Record<string, string>) => ComponentMaster;
  removeVariant: (componentSetId: string, componentId: string) => void;
  updateVariant: (componentId: string, variantValues: Record<string, string>) => void;
  
  publishComponent: (componentId: string, libraryId: string) => void;
  unpublishComponent: (componentId: string) => void;
  
  importLibrary: (library: ComponentLibrary) => void;
  enableLibrary: (libraryId: string) => void;
  disableLibrary: (libraryId: string) => void;
  
  getComponentByKey: (key: string) => ComponentMaster | undefined;
  getInstancesOfComponent: (componentId: string) => ComponentInstance[];
  getVariantsOfSet: (componentSetId: string) => ComponentMaster[];
  
  propagateMasterChanges: (componentId: string) => void;
}

export const useComponentSystem = create<ComponentSystemState>()(
  subscribeWithSelector((set, get) => ({
    components: new Map(),
    componentSets: new Map(),
    instances: new Map(),
    libraries: new Map(),
    enabledLibraryIds: new Set(),
    draftComponents: new Map(),

    // ============ Component Creation ============

    createComponent: (node: BaseNode, name?: string) => {
      const componentKey = generateComponentKey();
      const componentId = nanoid();
      
      const componentNode: ComponentNode = {
        ...node,
        type: 'COMPONENT',
        componentPropertyDefinitions: {},
        key: componentKey,
        description: '',
        documentationLinks: [],
        remote: false,
      } as ComponentNode;

      const master: ComponentMaster = {
        id: componentId,
        key: componentKey,
        name: name || node.name || 'Component',
        description: '',
        documentationLinks: [],
        propertyDefinitions: {},
        variants: {},
        nodeData: componentNode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1,
        isPublished: false,
      };

      set(state => {
        const newComponents = new Map(state.components);
        newComponents.set(componentId, master);
        return { components: newComponents };
      });

      return master;
    },

    createComponentSet: (components: ComponentMaster[], name?: string) => {
      const componentSetId = nanoid();
      const componentSetKey = generateComponentKey();
      
      // Collect all unique property names and values
      const variantGroupProperties: Record<string, Set<string>> = {};
      
      for (const component of components) {
        for (const [propName, propValue] of Object.entries(component.variants)) {
          if (!variantGroupProperties[propName]) {
            variantGroupProperties[propName] = new Set();
          }
          variantGroupProperties[propName].add(propValue);
        }
      }

      const componentSetNode: ComponentSetNode = {
        type: 'COMPONENT_SET',
        id: componentSetId,
        name: name || 'Component Set',
        visible: true,
        locked: false,
        parentId: null,
        childIds: components.map(c => c.id),
        pluginData: {},
        sharedPluginData: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: '',
        lastModifiedBy: '',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        absoluteTransform: [[1, 0, 0], [0, 1, 0]],
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        constrainProportions: false,
        layoutAlign: 'INHERIT',
        layoutGrow: 0,
        reactions: [],
        opacity: 1,
        blendMode: 'NORMAL',
        isMask: false,
        effects: [],
        fills: [],
        strokes: [],
        strokeWeight: 0,
        strokeAlign: 'CENTER',
        strokeCap: 'NONE',
        strokeJoin: 'MITER',
        strokeDashPattern: [],
        strokeMiterLimit: 4,
        cornerRadius: 0,
        cornerSmoothing: 0,
        layoutMode: 'NONE',
        primaryAxisSizingMode: 'FIXED',
        counterAxisSizingMode: 'FIXED',
        primaryAxisAlignItems: 'MIN',
        counterAxisAlignItems: 'MIN',
        layoutWrap: 'NO_WRAP',
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
        clipsContent: false,
        guides: [],
        layoutGrids: [],
        exportSettings: [],
        overflowDirection: 'NONE',
        numberOfFixedChildren: 0,
        overlayPositionType: 'CENTER',
        overlayBackground: { type: 'NONE' },
        overlayBackgroundInteraction: 'NONE',
        constraints: {
          horizontal: { type: 'MIN' },
          vertical: { type: 'MIN' },
        },
        componentPropertyDefinitions: {},
        key: componentSetKey,
        description: '',
        documentationLinks: [],
      };

      const componentSet: ComponentSet = {
        id: componentSetId,
        key: componentSetKey,
        name: name || 'Component Set',
        description: '',
        propertyDefinitions: {},
        variantGroupProperties: Object.fromEntries(
          Object.entries(variantGroupProperties).map(([k, v]) => [k, Array.from(v)])
        ),
        componentIds: components.map(c => c.id),
        defaultComponentId: components[0]?.id || '',
        nodeData: componentSetNode,
        isPublished: false,
      };

      set(state => {
        const newComponentSets = new Map(state.componentSets);
        newComponentSets.set(componentSetId, componentSet);
        return { componentSets: newComponentSets };
      });

      return componentSet;
    },

    createInstance: (componentId: string, x: number, y: number) => {
      const { components } = get();
      const master = components.get(componentId);
      
      if (!master) {
        throw new Error(`Component ${componentId} not found`);
      }

      const instanceId = nanoid();
      
      const instanceNode: InstanceNode = {
        type: 'INSTANCE',
        id: instanceId,
        name: master.name,
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
        x,
        y,
        width: master.nodeData.width,
        height: master.nodeData.height,
        rotation: 0,
        absoluteTransform: [[1, 0, x], [0, 1, y]],
        relativeTransform: [[1, 0, 0], [0, 1, 0]],
        constrainProportions: false,
        layoutAlign: 'INHERIT',
        layoutGrow: 0,
        reactions: [],
        opacity: 1,
        blendMode: 'NORMAL',
        isMask: false,
        effects: [],
        fills: master.nodeData.fills,
        strokes: master.nodeData.strokes,
        strokeWeight: master.nodeData.strokeWeight,
        strokeAlign: master.nodeData.strokeAlign,
        strokeCap: master.nodeData.strokeCap,
        strokeJoin: master.nodeData.strokeJoin,
        strokeDashPattern: master.nodeData.strokeDashPattern,
        strokeMiterLimit: master.nodeData.strokeMiterLimit,
        cornerRadius: master.nodeData.cornerRadius,
        cornerSmoothing: master.nodeData.cornerSmoothing,
        layoutMode: master.nodeData.layoutMode,
        primaryAxisSizingMode: master.nodeData.primaryAxisSizingMode,
        counterAxisSizingMode: master.nodeData.counterAxisSizingMode,
        primaryAxisAlignItems: master.nodeData.primaryAxisAlignItems,
        counterAxisAlignItems: master.nodeData.counterAxisAlignItems,
        layoutWrap: master.nodeData.layoutWrap,
        paddingLeft: master.nodeData.paddingLeft,
        paddingRight: master.nodeData.paddingRight,
        paddingTop: master.nodeData.paddingTop,
        paddingBottom: master.nodeData.paddingBottom,
        itemSpacing: master.nodeData.itemSpacing,
        counterAxisSpacing: master.nodeData.counterAxisSpacing,
        horizontalPadding: master.nodeData.horizontalPadding,
        verticalPadding: master.nodeData.verticalPadding,
        itemReverseZIndex: master.nodeData.itemReverseZIndex,
        strokesIncludedInLayout: master.nodeData.strokesIncludedInLayout,
        clipsContent: master.nodeData.clipsContent,
        guides: [],
        layoutGrids: [],
        exportSettings: [],
        overflowDirection: 'NONE',
        numberOfFixedChildren: 0,
        overlayPositionType: 'CENTER',
        overlayBackground: { type: 'NONE' },
        overlayBackgroundInteraction: 'NONE',
        constraints: master.nodeData.constraints,
        componentId,
        isExposedInstance: false,
        exposedInstances: [],
        componentProperties: {},
        overrides: [],
        scaleFactor: 1,
      };

      // Initialize component properties with defaults
      const componentProperties: ComponentProperties = {};
      for (const [propName, propDef] of Object.entries(master.propertyDefinitions)) {
        componentProperties[propName] = {
          type: propDef.type,
          value: propDef.defaultValue,
        };
      }
      instanceNode.componentProperties = componentProperties;

      const instance: ComponentInstance = {
        id: instanceId,
        componentId,
        componentKey: master.key,
        name: master.name,
        nodeData: instanceNode,
        overrides: [],
        detached: false,
      };

      set(state => {
        const newInstances = new Map(state.instances);
        newInstances.set(instanceId, instance);
        return { instances: newInstances };
      });

      return instance;
    },

    // ============ Component Updates ============

    updateComponentMaster: (componentId: string, updates: Partial<ComponentMaster>) => {
      set(state => {
        const newComponents = new Map(state.components);
        const existing = newComponents.get(componentId);
        
        if (existing) {
          newComponents.set(componentId, {
            ...existing,
            ...updates,
            updatedAt: Date.now(),
            version: existing.version + 1,
          });
        }
        
        return { components: newComponents };
      });

      // Propagate changes to instances
      get().propagateMasterChanges(componentId);
    },

    updateComponentProperty: (componentId: string, propertyName: string, definition: ComponentPropertyDefinition) => {
      set(state => {
        const newComponents = new Map(state.components);
        const existing = newComponents.get(componentId);
        
        if (existing) {
          newComponents.set(componentId, {
            ...existing,
            propertyDefinitions: {
              ...existing.propertyDefinitions,
              [propertyName]: definition,
            },
            updatedAt: Date.now(),
            version: existing.version + 1,
          });
        }
        
        return { components: newComponents };
      });
    },

    addComponentProperty: (componentId: string, propertyName: string, definition: ComponentPropertyDefinition) => {
      get().updateComponentProperty(componentId, propertyName, definition);
    },

    removeComponentProperty: (componentId: string, propertyName: string) => {
      set(state => {
        const newComponents = new Map(state.components);
        const existing = newComponents.get(componentId);
        
        if (existing) {
          const { [propertyName]: removed, ...remainingProps } = existing.propertyDefinitions;
          newComponents.set(componentId, {
            ...existing,
            propertyDefinitions: remainingProps,
            updatedAt: Date.now(),
            version: existing.version + 1,
          });
        }
        
        return { components: newComponents };
      });
    },

    // ============ Instance Operations ============

    updateInstance: (instanceId: string, overrides: InstanceOverride[]) => {
      set(state => {
        const newInstances = new Map(state.instances);
        const existing = newInstances.get(instanceId);
        
        if (existing) {
          newInstances.set(instanceId, {
            ...existing,
            overrides: [...existing.overrides, ...overrides],
            nodeData: {
              ...existing.nodeData,
              updatedAt: Date.now(),
            },
          });
        }
        
        return { instances: newInstances };
      });
    },

    resetInstanceOverrides: (instanceId: string, propertyPath?: string[]) => {
      set(state => {
        const newInstances = new Map(state.instances);
        const existing = newInstances.get(instanceId);
        
        if (existing) {
          let newOverrides = existing.overrides;
          
          if (propertyPath) {
            // Reset specific property
            newOverrides = existing.overrides.filter(o => 
              JSON.stringify(o.path) !== JSON.stringify(propertyPath)
            );
          } else {
            // Reset all overrides
            newOverrides = [];
          }
          
          newInstances.set(instanceId, {
            ...existing,
            overrides: newOverrides,
          });
        }
        
        return { instances: newInstances };
      });
    },

    detachInstance: (instanceId: string) => {
      const { instances, components } = get();
      const instance = instances.get(instanceId);
      
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found`);
      }

      const master = components.get(instance.componentId);
      if (!master) {
        throw new Error(`Master component not found`);
      }

      // Create a deep clone of the master with new IDs
      const idMap = new Map<string, string>();
      const detachedNode = deepCloneNode(master.nodeData, idMap);
      
      // Apply position from instance
      (detachedNode as any).x = instance.nodeData.x;
      (detachedNode as any).y = instance.nodeData.y;
      
      // Change type from COMPONENT to FRAME
      (detachedNode as any).type = 'FRAME';

      // Mark instance as detached
      set(state => {
        const newInstances = new Map(state.instances);
        newInstances.set(instanceId, {
          ...instance,
          detached: true,
        });
        return { instances: newInstances };
      });

      return detachedNode;
    },

    swapInstance: (instanceId: string, newComponentId: string) => {
      const { instances, components } = get();
      const instance = instances.get(instanceId);
      const newMaster = components.get(newComponentId);
      
      if (!instance || !newMaster) {
        throw new Error('Instance or new component not found');
      }

      set(state => {
        const newInstances = new Map(state.instances);
        newInstances.set(instanceId, {
          ...instance,
          componentId: newComponentId,
          componentKey: newMaster.key,
          swappedComponentId: newComponentId,
          // Keep position overrides, reset others
          overrides: instance.overrides.filter(o => 
            ['x', 'y', 'width', 'height', 'rotation'].includes(o.property)
          ),
        });
        return { instances: newInstances };
      });
    },

    // ============ Variant Operations ============

    addVariant: (componentSetId: string, variantValues: Record<string, string>) => {
      const { componentSets, components } = get();
      const componentSet = componentSets.get(componentSetId);
      
      if (!componentSet) {
        throw new Error(`Component set ${componentSetId} not found`);
      }

      // Get existing component to clone
      const existingComponent = components.get(componentSet.defaultComponentId);
      if (!existingComponent) {
        throw new Error('Default component not found');
      }

      // Create new component variant
      const newMaster = get().createComponent(
        existingComponent.nodeData,
        buildVariantName(variantValues)
      );
      
      newMaster.variants = variantValues;

      // Update component set
      set(state => {
        const newComponentSets = new Map(state.componentSets);
        const existing = newComponentSets.get(componentSetId);
        
        if (existing) {
          // Update variant group properties
          const newVGP = { ...existing.variantGroupProperties };
          for (const [key, value] of Object.entries(variantValues)) {
            if (!newVGP[key]) {
              newVGP[key] = [];
            }
            if (!newVGP[key].includes(value)) {
              newVGP[key].push(value);
            }
          }

          newComponentSets.set(componentSetId, {
            ...existing,
            componentIds: [...existing.componentIds, newMaster.id],
            variantGroupProperties: newVGP,
          });
        }
        
        return { componentSets: newComponentSets };
      });

      return newMaster;
    },

    removeVariant: (componentSetId: string, componentId: string) => {
      set(state => {
        const newComponentSets = new Map(state.componentSets);
        const existing = newComponentSets.get(componentSetId);
        
        if (existing && existing.componentIds.length > 1) {
          newComponentSets.set(componentSetId, {
            ...existing,
            componentIds: existing.componentIds.filter(id => id !== componentId),
            defaultComponentId: existing.defaultComponentId === componentId
              ? existing.componentIds.find(id => id !== componentId) || ''
              : existing.defaultComponentId,
          });
        }
        
        // Remove the component
        const newComponents = new Map(state.components);
        newComponents.delete(componentId);
        
        return { 
          componentSets: newComponentSets,
          components: newComponents,
        };
      });
    },

    updateVariant: (componentId: string, variantValues: Record<string, string>) => {
      set(state => {
        const newComponents = new Map(state.components);
        const existing = newComponents.get(componentId);
        
        if (existing) {
          newComponents.set(componentId, {
            ...existing,
            name: buildVariantName(variantValues),
            variants: variantValues,
            updatedAt: Date.now(),
          });
        }
        
        return { components: newComponents };
      });
    },

    // ============ Publishing ============

    publishComponent: (componentId: string, libraryId: string) => {
      set(state => {
        const newComponents = new Map(state.components);
        const existing = newComponents.get(componentId);
        
        if (existing) {
          newComponents.set(componentId, {
            ...existing,
            isPublished: true,
            publishedAt: Date.now(),
            libraryId,
          });
        }
        
        return { components: newComponents };
      });
    },

    unpublishComponent: (componentId: string) => {
      set(state => {
        const newComponents = new Map(state.components);
        const existing = newComponents.get(componentId);
        
        if (existing) {
          newComponents.set(componentId, {
            ...existing,
            isPublished: false,
            publishedAt: undefined,
            libraryId: undefined,
          });
        }
        
        return { components: newComponents };
      });
    },

    // ============ Libraries ============

    importLibrary: (library: ComponentLibrary) => {
      set(state => {
        const newLibraries = new Map(state.libraries);
        newLibraries.set(library.id, library);
        return { libraries: newLibraries };
      });
    },

    enableLibrary: (libraryId: string) => {
      set(state => {
        const newEnabled = new Set(state.enabledLibraryIds);
        newEnabled.add(libraryId);
        return { enabledLibraryIds: newEnabled };
      });
    },

    disableLibrary: (libraryId: string) => {
      set(state => {
        const newEnabled = new Set(state.enabledLibraryIds);
        newEnabled.delete(libraryId);
        return { enabledLibraryIds: newEnabled };
      });
    },

    // ============ Queries ============

    getComponentByKey: (key: string) => {
      const { components } = get();
      for (const component of components.values()) {
        if (component.key === key) {
          return component;
        }
      }
      return undefined;
    },

    getInstancesOfComponent: (componentId: string) => {
      const { instances } = get();
      return Array.from(instances.values()).filter(
        i => i.componentId === componentId && !i.detached
      );
    },

    getVariantsOfSet: (componentSetId: string) => {
      const { componentSets, components } = get();
      const set = componentSets.get(componentSetId);
      
      if (!set) return [];
      
      return set.componentIds
        .map(id => components.get(id))
        .filter((c): c is ComponentMaster => c !== undefined);
    },

    // ============ Master Propagation ============

    propagateMasterChanges: (componentId: string) => {
      const { instances, components } = get();
      const master = components.get(componentId);
      
      if (!master) return;

      // Find all instances of this component
      const componentInstances = Array.from(instances.values()).filter(
        i => i.componentId === componentId && !i.detached
      );

      // Update each instance (preserving overrides)
      set(state => {
        const newInstances = new Map(state.instances);
        
        for (const instance of componentInstances) {
          // Merge master changes with instance overrides
          const updatedNodeData = {
            ...instance.nodeData,
            // Update non-overridden properties from master
            fills: instance.overrides.some(o => o.property === 'fills')
              ? instance.nodeData.fills
              : master.nodeData.fills,
            strokes: instance.overrides.some(o => o.property === 'strokes')
              ? instance.nodeData.strokes
              : master.nodeData.strokes,
            cornerRadius: instance.overrides.some(o => o.property === 'cornerRadius')
              ? instance.nodeData.cornerRadius
              : master.nodeData.cornerRadius,
            // etc.
            updatedAt: Date.now(),
          };

          newInstances.set(instance.id, {
            ...instance,
            nodeData: updatedNodeData as InstanceNode,
          });
        }
        
        return { instances: newInstances };
      });
    },
  }))
);

// ============ Selectors ============

export const useComponents = () => useComponentSystem(state => state.components);
export const useComponentSets = () => useComponentSystem(state => state.componentSets);
export const useInstances = () => useComponentSystem(state => state.instances);
export const useLibraries = () => useComponentSystem(state => state.libraries);

export default useComponentSystem;
