/**
 * CollaborationSystem - Full Real-time Multi-user Collaboration
 * CRDT integration, live cursors, presence, multi-user undo, comments
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

// ============ Types ============

export interface UserPresence {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor: CursorPosition | null;
  selection: string[];
  viewport: Viewport | null;
  lastActive: number;
  status: 'active' | 'idle' | 'away' | 'offline';
}

export interface CursorPosition {
  x: number;
  y: number;
  pageId: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
  pageId: string;
}

export interface Comment {
  id: string;
  nodeId?: string;
  pageId: string;
  x: number;
  y: number;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: number;
  replies: CommentReply[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface VersionSnapshot {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: number;
  documentState: Uint8Array; // Yjs document state
  thumbnail?: string;
}

export interface UndoHistoryEntry {
  id: string;
  userId: string;
  timestamp: number;
  action: string;
  affectedNodes: string[];
  undoData: any;
}

// ============ User Colors ============

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9',
];

export function getRandomUserColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
}

// ============ CRDT Document Manager ============

export class CRDTDocument {
  private doc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private awareness: any;
  
  // Shared types
  private nodes: Y.Map<any>;
  private pages: Y.Map<any>;
  private comments: Y.Array<any>;
  private versions: Y.Array<any>;
  private metadata: Y.Map<any>;

  constructor(documentId: string) {
    this.doc = new Y.Doc();
    
    // Initialize shared types
    this.nodes = this.doc.getMap('nodes');
    this.pages = this.doc.getMap('pages');
    this.comments = this.doc.getArray('comments');
    this.versions = this.doc.getArray('versions');
    this.metadata = this.doc.getMap('metadata');
  }

  connect(serverUrl: string, roomName: string, user: { id: string; name: string; color: string }): void {
    // WebSocket provider for real-time sync
    this.provider = new WebsocketProvider(serverUrl, roomName, this.doc);
    this.awareness = this.provider.awareness;

    // Set local user state
    this.awareness.setLocalState({
      user: {
        id: user.id,
        name: user.name,
        color: user.color,
      },
      cursor: null,
      selection: [],
      viewport: null,
    });

    // Offline persistence
    this.persistence = new IndexeddbPersistence(roomName, this.doc);
  }

  disconnect(): void {
    if (this.provider) {
      this.provider.destroy();
      this.provider = null;
    }
    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }
  }

  // ============ Node Operations ============

  getNode(id: string): any {
    return this.nodes.get(id);
  }

  setNode(id: string, node: any): void {
    this.doc.transact(() => {
      this.nodes.set(id, node);
    });
  }

  updateNode(id: string, updates: Record<string, any>): void {
    this.doc.transact(() => {
      const existing = this.nodes.get(id);
      if (existing) {
        this.nodes.set(id, { ...existing, ...updates });
      }
    });
  }

  deleteNode(id: string): void {
    this.doc.transact(() => {
      this.nodes.delete(id);
    });
  }

  getAllNodes(): Map<string, any> {
    const result = new Map<string, any>();
    this.nodes.forEach((value, key) => {
      result.set(key, value);
    });
    return result;
  }

  observeNodes(callback: (event: Y.YMapEvent<any>) => void): () => void {
    this.nodes.observe(callback);
    return () => this.nodes.unobserve(callback);
  }

  // ============ Page Operations ============

  getPage(id: string): any {
    return this.pages.get(id);
  }

  setPage(id: string, page: any): void {
    this.doc.transact(() => {
      this.pages.set(id, page);
    });
  }

  deletePage(id: string): void {
    this.doc.transact(() => {
      this.pages.delete(id);
    });
  }

  getAllPages(): Map<string, any> {
    const result = new Map<string, any>();
    this.pages.forEach((value, key) => {
      result.set(key, value);
    });
    return result;
  }

  // ============ Comments ============

  addComment(comment: Omit<Comment, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Comment {
    const now = Date.now();
    const newComment: Comment = {
      ...comment,
      id: `comment_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
      replies: [],
    };

    this.doc.transact(() => {
      this.comments.push([newComment]);
    });

    return newComment;
  }

  updateComment(id: string, updates: Partial<Comment>): void {
    this.doc.transact(() => {
      const index = this.findCommentIndex(id);
      if (index !== -1) {
        const existing = this.comments.get(index);
        this.comments.delete(index, 1);
        this.comments.insert(index, [{ ...existing, ...updates, updatedAt: Date.now() }]);
      }
    });
  }

  deleteComment(id: string): void {
    this.doc.transact(() => {
      const index = this.findCommentIndex(id);
      if (index !== -1) {
        this.comments.delete(index, 1);
      }
    });
  }

  addReply(commentId: string, reply: Omit<CommentReply, 'id' | 'createdAt' | 'updatedAt'>): CommentReply {
    const now = Date.now();
    const newReply: CommentReply = {
      ...reply,
      id: `reply_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.doc.transact(() => {
      const index = this.findCommentIndex(commentId);
      if (index !== -1) {
        const existing = this.comments.get(index) as Comment;
        this.comments.delete(index, 1);
        this.comments.insert(index, [{
          ...existing,
          replies: [...existing.replies, newReply],
          updatedAt: now,
        }]);
      }
    });

    return newReply;
  }

  resolveComment(id: string, resolvedBy: string): void {
    this.updateComment(id, {
      resolved: true,
      resolvedBy,
      resolvedAt: Date.now(),
    });
  }

  unresolveComment(id: string): void {
    this.updateComment(id, {
      resolved: false,
      resolvedBy: undefined,
      resolvedAt: undefined,
    });
  }

  getAllComments(): Comment[] {
    return this.comments.toArray() as Comment[];
  }

  getCommentsForPage(pageId: string): Comment[] {
    return this.getAllComments().filter(c => c.pageId === pageId);
  }

  getCommentsForNode(nodeId: string): Comment[] {
    return this.getAllComments().filter(c => c.nodeId === nodeId);
  }

  private findCommentIndex(id: string): number {
    for (let i = 0; i < this.comments.length; i++) {
      if ((this.comments.get(i) as Comment).id === id) {
        return i;
      }
    }
    return -1;
  }

  observeComments(callback: (event: Y.YArrayEvent<any>) => void): () => void {
    this.comments.observe(callback);
    return () => this.comments.unobserve(callback);
  }

  // ============ Awareness (Presence) ============

  updateCursor(cursor: CursorPosition | null): void {
    if (!this.awareness) return;
    const state = this.awareness.getLocalState() || {};
    this.awareness.setLocalState({ ...state, cursor });
  }

  updateSelection(selection: string[]): void {
    if (!this.awareness) return;
    const state = this.awareness.getLocalState() || {};
    this.awareness.setLocalState({ ...state, selection });
  }

  updateViewport(viewport: Viewport): void {
    if (!this.awareness) return;
    const state = this.awareness.getLocalState() || {};
    this.awareness.setLocalState({ ...state, viewport });
  }

  getPresences(): Map<number, any> {
    if (!this.awareness) return new Map();
    return this.awareness.getStates();
  }

  onPresenceChange(callback: (changes: Map<number, any>) => void): () => void {
    if (!this.awareness) return () => {};
    
    const handler = () => {
      callback(this.awareness.getStates());
    };
    
    this.awareness.on('change', handler);
    return () => this.awareness.off('change', handler);
  }

  // ============ Versioning ============

  createVersion(name: string, description: string, createdBy: string): VersionSnapshot {
    const snapshot: VersionSnapshot = {
      id: `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdBy,
      createdAt: Date.now(),
      documentState: Y.encodeStateAsUpdate(this.doc),
    };

    this.doc.transact(() => {
      this.versions.push([snapshot]);
    });

    return snapshot;
  }

  getVersions(): VersionSnapshot[] {
    return this.versions.toArray() as VersionSnapshot[];
  }

  restoreVersion(versionId: string): boolean {
    const version = this.getVersions().find(v => v.id === versionId);
    if (!version) return false;

    // Create a temporary doc to apply the state
    const tempDoc = new Y.Doc();
    Y.applyUpdate(tempDoc, version.documentState);

    // Clear current state and apply version
    this.doc.transact(() => {
      // Clear nodes
      this.nodes.forEach((_, key) => {
        this.nodes.delete(key);
      });
      
      // Clear pages
      this.pages.forEach((_, key) => {
        this.pages.delete(key);
      });

      // Apply version state
      const tempNodes = tempDoc.getMap('nodes');
      tempNodes.forEach((value, key) => {
        this.nodes.set(key, value);
      });

      const tempPages = tempDoc.getMap('pages');
      tempPages.forEach((value, key) => {
        this.pages.set(key, value);
      });
    });

    return true;
  }

  // ============ Undo/Redo ============

  private undoManager: Y.UndoManager | null = null;

  initUndoManager(trackedTypes: Y.AbstractType<any>[]): void {
    this.undoManager = new Y.UndoManager(trackedTypes, {
      captureTimeout: 500,
    });
  }

  undo(): boolean {
    if (!this.undoManager) return false;
    return this.undoManager.undo() !== null;
  }

  redo(): boolean {
    if (!this.undoManager) return false;
    return this.undoManager.redo() !== null;
  }

  canUndo(): boolean {
    return this.undoManager?.undoStack.length ?? 0 > 0;
  }

  canRedo(): boolean {
    return this.undoManager?.redoStack.length ?? 0 > 0;
  }

  // ============ Transaction Helpers ============

  transact(fn: () => void): void {
    this.doc.transact(fn);
  }

  // ============ Export/Import ============

  exportDocument(): Uint8Array {
    return Y.encodeStateAsUpdate(this.doc);
  }

  importDocument(data: Uint8Array): void {
    Y.applyUpdate(this.doc, data);
  }

  getDoc(): Y.Doc {
    return this.doc;
  }
}

// ============ Collaboration Store ============

interface CollaborationState {
  // Connection state
  isConnected: boolean;
  connectionError: string | null;
  
  // Current user
  currentUser: UserPresence | null;
  
  // Other users
  users: Map<string, UserPresence>;
  
  // Comments
  comments: Comment[];
  activeCommentId: string | null;
  showResolvedComments: boolean;
  
  // Versions
  versions: VersionSnapshot[];
  
  // Document
  document: CRDTDocument | null;
  
  // Actions
  connect: (serverUrl: string, roomId: string, user: Omit<UserPresence, 'cursor' | 'selection' | 'viewport' | 'lastActive' | 'status'>) => void;
  disconnect: () => void;
  
  // Cursor & Selection
  updateCursor: (position: CursorPosition | null) => void;
  updateSelection: (nodeIds: string[]) => void;
  updateViewport: (viewport: Viewport) => void;
  
  // Following
  followingUserId: string | null;
  followUser: (userId: string | null) => void;
  
  // Comments
  addComment: (nodeId: string | undefined, pageId: string, x: number, y: number, content: string) => Comment | null;
  updateComment: (id: string, content: string) => void;
  deleteComment: (id: string) => void;
  resolveComment: (id: string) => void;
  unresolveComment: (id: string) => void;
  addReply: (commentId: string, content: string) => void;
  setActiveComment: (id: string | null) => void;
  toggleResolvedComments: () => void;
  
  // Versions
  createVersion: (name: string, description?: string) => VersionSnapshot | null;
  restoreVersion: (versionId: string) => boolean;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  
  // Nodes (CRDT operations)
  getNode: (id: string) => any;
  setNode: (id: string, node: any) => void;
  updateNode: (id: string, updates: Record<string, any>) => void;
  deleteNode: (id: string) => void;
  
  // Batch operations
  batchUpdate: (operations: Array<{ type: 'set' | 'update' | 'delete'; id: string; data?: any }>) => void;
}

export const useCollaboration = create<CollaborationState>()(
  subscribeWithSelector((set, get) => ({
    isConnected: false,
    connectionError: null,
    currentUser: null,
    users: new Map(),
    comments: [],
    activeCommentId: null,
    showResolvedComments: false,
    versions: [],
    document: null,
    followingUserId: null,
    canUndo: false,
    canRedo: false,

    connect: (serverUrl: string, roomId: string, user) => {
      const doc = new CRDTDocument(roomId);
      
      const fullUser: UserPresence = {
        ...user,
        cursor: null,
        selection: [],
        viewport: null,
        lastActive: Date.now(),
        status: 'active',
      };

      doc.connect(serverUrl, roomId, {
        id: user.id,
        name: user.name,
        color: user.color,
      });

      // Initialize undo manager
      doc.initUndoManager([doc.getDoc().getMap('nodes')]);

      // Listen for presence changes
      doc.onPresenceChange((states) => {
        const users = new Map<string, UserPresence>();
        
        states.forEach((state, clientId) => {
          if (state.user && state.user.id !== user.id) {
            users.set(state.user.id, {
              id: state.user.id,
              name: state.user.name,
              email: state.user.email || '',
              avatar: state.user.avatar,
              color: state.user.color,
              cursor: state.cursor,
              selection: state.selection || [],
              viewport: state.viewport,
              lastActive: Date.now(),
              status: 'active',
            });
          }
        });

        set({ users });
      });

      // Listen for comment changes
      doc.observeComments(() => {
        set({ comments: doc.getAllComments() });
      });

      set({
        document: doc,
        currentUser: fullUser,
        isConnected: true,
        connectionError: null,
        comments: doc.getAllComments(),
        versions: doc.getVersions(),
      });
    },

    disconnect: () => {
      const { document } = get();
      if (document) {
        document.disconnect();
      }
      
      set({
        document: null,
        isConnected: false,
        currentUser: null,
        users: new Map(),
        comments: [],
        versions: [],
      });
    },

    updateCursor: (position: CursorPosition | null) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return;

      document.updateCursor(position);
      
      set({
        currentUser: { ...currentUser, cursor: position, lastActive: Date.now() },
      });
    },

    updateSelection: (nodeIds: string[]) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return;

      document.updateSelection(nodeIds);
      
      set({
        currentUser: { ...currentUser, selection: nodeIds, lastActive: Date.now() },
      });
    },

    updateViewport: (viewport: Viewport) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return;

      document.updateViewport(viewport);
      
      set({
        currentUser: { ...currentUser, viewport, lastActive: Date.now() },
      });
    },

    followUser: (userId: string | null) => {
      set({ followingUserId: userId });
    },

    addComment: (nodeId, pageId, x, y, content) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return null;

      const comment = document.addComment({
        nodeId,
        pageId,
        x,
        y,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content,
        resolved: false,
      });

      return comment;
    },

    updateComment: (id: string, content: string) => {
      const { document } = get();
      if (!document) return;

      document.updateComment(id, { content });
    },

    deleteComment: (id: string) => {
      const { document } = get();
      if (!document) return;

      document.deleteComment(id);
    },

    resolveComment: (id: string) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return;

      document.resolveComment(id, currentUser.id);
    },

    unresolveComment: (id: string) => {
      const { document } = get();
      if (!document) return;

      document.unresolveComment(id);
    },

    addReply: (commentId: string, content: string) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return;

      document.addReply(commentId, {
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        content,
      });
    },

    setActiveComment: (id: string | null) => {
      set({ activeCommentId: id });
    },

    toggleResolvedComments: () => {
      set(state => ({ showResolvedComments: !state.showResolvedComments }));
    },

    createVersion: (name: string, description?: string) => {
      const { document, currentUser } = get();
      if (!document || !currentUser) return null;

      const version = document.createVersion(name, description || '', currentUser.id);
      set({ versions: document.getVersions() });
      return version;
    },

    restoreVersion: (versionId: string) => {
      const { document } = get();
      if (!document) return false;

      return document.restoreVersion(versionId);
    },

    undo: () => {
      const { document } = get();
      if (!document) return;

      document.undo();
      set({
        canUndo: document.canUndo(),
        canRedo: document.canRedo(),
      });
    },

    redo: () => {
      const { document } = get();
      if (!document) return;

      document.redo();
      set({
        canUndo: document.canUndo(),
        canRedo: document.canRedo(),
      });
    },

    getNode: (id: string) => {
      const { document } = get();
      if (!document) return null;

      return document.getNode(id);
    },

    setNode: (id: string, node: any) => {
      const { document } = get();
      if (!document) return;

      document.setNode(id, node);
      set({
        canUndo: document.canUndo(),
        canRedo: document.canRedo(),
      });
    },

    updateNode: (id: string, updates: Record<string, any>) => {
      const { document } = get();
      if (!document) return;

      document.updateNode(id, updates);
      set({
        canUndo: document.canUndo(),
        canRedo: document.canRedo(),
      });
    },

    deleteNode: (id: string) => {
      const { document } = get();
      if (!document) return;

      document.deleteNode(id);
      set({
        canUndo: document.canUndo(),
        canRedo: document.canRedo(),
      });
    },

    batchUpdate: (operations) => {
      const { document } = get();
      if (!document) return;

      document.transact(() => {
        for (const op of operations) {
          switch (op.type) {
            case 'set':
              document.setNode(op.id, op.data);
              break;
            case 'update':
              document.updateNode(op.id, op.data);
              break;
            case 'delete':
              document.deleteNode(op.id);
              break;
          }
        }
      });

      set({
        canUndo: document.canUndo(),
        canRedo: document.canRedo(),
      });
    },
  }))
);

// ============ Presence Component Helpers ============

export function useUserPresences(): UserPresence[] {
  const users = useCollaboration(state => state.users);
  return Array.from(users.values());
}

export function useCurrentUser(): UserPresence | null {
  return useCollaboration(state => state.currentUser);
}

export function useFollowedUser(): UserPresence | null {
  const followingUserId = useCollaboration(state => state.followingUserId);
  const users = useCollaboration(state => state.users);
  
  if (!followingUserId) return null;
  return users.get(followingUserId) || null;
}

export function useComments(pageId?: string, nodeId?: string): Comment[] {
  const comments = useCollaboration(state => state.comments);
  const showResolved = useCollaboration(state => state.showResolvedComments);
  
  return comments.filter(c => {
    if (!showResolved && c.resolved) return false;
    if (pageId && c.pageId !== pageId) return false;
    if (nodeId && c.nodeId !== nodeId) return false;
    return true;
  });
}

// ============ Cursor Renderer ============

export interface CursorRenderProps {
  user: UserPresence;
  viewportOffset: { x: number; y: number };
  zoom: number;
}

export function getCursorStyle(props: CursorRenderProps): React.CSSProperties {
  const { user, viewportOffset, zoom } = props;
  
  if (!user.cursor) return { display: 'none' };
  
  return {
    position: 'absolute',
    left: (user.cursor.x - viewportOffset.x) * zoom,
    top: (user.cursor.y - viewportOffset.y) * zoom,
    pointerEvents: 'none',
    zIndex: 10000,
    transform: 'translate(-2px, -2px)',
  };
}

// ============ Selection Highlight ============

export function getSelectionHighlightStyle(
  nodeId: string,
  users: UserPresence[],
  getNodeBounds: (id: string) => { x: number; y: number; width: number; height: number } | null,
  viewportOffset: { x: number; y: number },
  zoom: number
): React.CSSProperties | null {
  const user = users.find(u => u.selection.includes(nodeId));
  if (!user) return null;
  
  const bounds = getNodeBounds(nodeId);
  if (!bounds) return null;
  
  return {
    position: 'absolute',
    left: (bounds.x - viewportOffset.x) * zoom,
    top: (bounds.y - viewportOffset.y) * zoom,
    width: bounds.width * zoom,
    height: bounds.height * zoom,
    border: `2px solid ${user.color}`,
    pointerEvents: 'none',
    zIndex: 9999,
  };
}

export default useCollaboration;
