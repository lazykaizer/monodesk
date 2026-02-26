import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BlockType =
    | 'text' | 'h1' | 'h2' | 'h3' | 'checklist' | 'divider'
    | 'database' | 'quote' | 'toggle' | 'code' | 'image'
    | 'bullet' | 'numbered' | 'callout';

export type ViewType = 'Table' | 'Board' | 'Timeline' | 'Calendar' | 'List' | 'Chart';
export type PropertyType = 'text' | 'status' | 'priority' | 'date' | 'number' | 'multi-select' | 'checkbox' | 'url' | 'email' | 'phone' | 'person' | 'file' | 'select';
export type Priority = 'High' | 'Medium' | 'Low' | 'None';

export interface DatabaseProperty {
    id: string;
    key: string;
    label: string;
    type: PropertyType;
    options?: string[]; // for multi-select
    isFrozen?: boolean;
    width?: number;
}

export interface DatabaseRow {
    id: string;
    values: Record<string, any>; // mapping property.key to value
    isExpanded?: boolean;
    notes?: string;
    subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface ActivityEntry {
    id: string; // The blockId
    title: string;
    action: 'created' | 'deleted' | 'updated' | 'reordered';
    blockType: BlockType;
    timestamp: number;
}

export interface RoadmapPage {
    id: string;
    title: string;
    icon: string;
    createdAt: number;
    isFavorite?: boolean;
}

export interface RoadmapBlock {
    id: string;
    type: BlockType;
    content: string;
    pageId?: string; // Link to a page
    checked?: boolean;
    url?: string; // for images
    width?: number; // for images (percentage)
    language?: string; // for code blocks
    isToggled?: boolean; // for toggle lists
    data?: {
        properties: DatabaseProperty[];
        rows: DatabaseRow[];
        views: { id: string, name: string, type: ViewType, active: boolean }[];
        // For Callout
        icon?: string;
        color?: string;
    };
    parentId?: string | null; // For nested blocks
    sourceBlockId?: string; // Link to another block (e.g. for charts)
    order: number;
    createdAt: number;
    updatedAt: number;
}

interface RoadmapStore {
    pages: RoadmapPage[];
    activePageId: string | null;
    currentView: 'editor' | 'home';
    isSearchOpen: boolean;
    slashQuery: string;
    slashMenuState: { blockId: string; x: number; y: number } | null;
    blocks: RoadmapBlock[];
    history: ActivityEntry[];
    undoStack: RoadmapBlock[][];
    sidebarOpen: boolean;
    clipboard: { type: 'block' | 'row', data: any, blockId?: string } | null;
    focusedId: string | null;
    focusedRowId: { id: string, blockId: string } | null;

    // View Actions
    setCurrentView: (view: 'editor' | 'home') => void;

    // Page Actions
    addPage: () => void;
    updatePage: (id: string, updates: Partial<RoadmapPage>) => void;
    deletePage: (id: string) => void;
    setActivePageId: (id: string | null) => void;
    toggleFavorite: (id: string) => void;
    duplicatePage: (id: string) => void;
    renamePage: (id: string, newTitle: string) => void;

    // Block Actions
    setBlocks: (blocks: RoadmapBlock[]) => void;
    addBlock: (type: BlockType, index?: number, parentId?: string | null, initialView?: ViewType) => void;
    updateBlock: (id: string, updates: Partial<RoadmapBlock>) => void;
    deleteBlock: (id: string) => void;
    duplicateBlock: (id: string) => void;
    reorderBlocks: (startIndex: number, endIndex: number) => void;
    undo: () => void;

    // Database Actions
    addDatabaseRow: (blockId: string, initialValues?: Partial<DatabaseRow['values']>) => void;
    updateDatabaseRow: (blockId: string, rowId: string, updates: Partial<DatabaseRow>) => void;
    deleteDatabaseRow: (blockId: string, rowId: string) => void;
    reorderDatabaseRows: (blockId: string, startIndex: number, endIndex: number) => void;

    // Subtask Actions
    addSubtask: (blockId: string, rowId: string, title?: string) => void;
    toggleSubtask: (blockId: string, rowId: string, subtaskId: string) => void;
    deleteSubtask: (blockId: string, rowId: string, subtaskId: string) => void;
    updateSubtask: (blockId: string, rowId: string, subtaskId: string, title: string) => void;

    // Property Actions
    addDatabaseProperty: (blockId: string, label: string, type: PropertyType) => void;
    updateDatabaseProperty: (blockId: string, propertyId: string, updates: Partial<DatabaseProperty>) => void;
    deleteDatabaseProperty: (blockId: string, propertyId: string) => void;
    reorderDatabaseProperties: (blockId: string, startIndex: number, endIndex: number) => void;
    duplicateDatabaseProperty: (blockId: string, propertyId: string) => void;
    addDatabasePropertyOption: (blockId: string, propertyId: string, option: string) => void;

    // View Actions
    addDatabaseView: (blockId: string, name: string, type: ViewType) => void;
    deleteDatabaseView: (blockId: string, viewId: string) => void;
    setActiveView: (blockId: string, viewId: string) => void;

    // UI Actions
    setFocusedId: (id: string | null) => void;
    setFocusedRowId: (id: string | null, blockId: string | null) => void;
    copy: () => void;
    paste: () => void;
    toggleSidebar: () => void;
    setSearchOpen: (open: boolean) => void;
    setSlashQuery: (query: string) => void;
    setSlashMenuState: (state: { blockId: string; x: number; y: number } | null) => void;
    addHistory: (blockId: string, title: string, action?: ActivityEntry['action'], blockType?: BlockType) => void;
    reset: () => void;
}

export const useRoadmapStore = create<RoadmapStore>()(
    persist(
        (set, get) => ({
            pages: [],
            activePageId: null,
            currentView: 'home',
            blocks: [],
            history: [],
            undoStack: [],
            sidebarOpen: true,
            isSearchOpen: false,
            slashQuery: "",
            slashMenuState: null,
            clipboard: null,
            focusedId: null,
            focusedRowId: null,

            setCurrentView: (view) => set({ currentView: view }),
            setSearchOpen: (open) => set({ isSearchOpen: open }),
            setSlashQuery: (query: string) => set({ slashQuery: query }),
            setSlashMenuState: (state) => set({ slashMenuState: state }),

            setFocusedId: (id) => set({ focusedId: id, focusedRowId: null }),
            setFocusedRowId: (id, blockId) => set({ focusedRowId: id && blockId ? { id, blockId } : null, focusedId: null }),

            copy: () => {
                const { blocks, focusedId, focusedRowId } = get();
                if (focusedRowId) {
                    const block = blocks.find(b => b.id === focusedRowId.blockId);
                    const row = block?.data?.rows.find(r => r.id === focusedRowId.id);
                    if (row) {
                        set({ clipboard: { type: 'row', data: JSON.parse(JSON.stringify(row)), blockId: focusedRowId.blockId } });
                    }
                } else if (focusedId) {
                    const block = blocks.find(b => b.id === focusedId);
                    if (block) {
                        set({ clipboard: { type: 'block', data: JSON.parse(JSON.stringify(block)) } });
                    }
                }
            },

            paste: () => {
                const { clipboard, blocks, activePageId } = get();
                if (!clipboard) return;

                if (clipboard.type === 'block') {
                    const newBlock = {
                        ...clipboard.data,
                        id: `block-${Math.random().toString(36).substr(2, 9)}`,
                        order: blocks.filter(b => b.pageId === activePageId).length,
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    };
                    set({
                        undoStack: [blocks, ...get().undoStack].slice(0, 50),
                        blocks: [...blocks, newBlock]
                    });
                } else if (clipboard.type === 'row') {
                    // Try to paste into focused block or the block it was copied from
                    const targetBlockId = get().focusedId || get().focusedRowId?.blockId || clipboard.blockId;
                    if (!targetBlockId) return;

                    set({
                        undoStack: [blocks, ...get().undoStack].slice(0, 50),
                        blocks: blocks.map(b => {
                            if (b.id !== targetBlockId || b.type !== 'database') return b;
                            const newRow = {
                                ...clipboard.data,
                                id: `row-${Math.random().toString(36).substr(2, 9)}`,
                            };
                            return { ...b, data: { ...b.data!, rows: [...b.data!.rows, newRow] } };
                        })
                    });
                }
            },

            addPage: () => set((state) => {
                const id = `page-${Math.random().toString(36).substr(2, 9)}`;
                const newPage: RoadmapPage = {
                    id,
                    title: 'Untitled',
                    icon: '📄',
                    createdAt: Date.now()
                };
                return {
                    pages: [...state.pages, newPage],
                    activePageId: id,
                    currentView: 'editor'
                };
            }),

            updatePage: (id, updates) => set((state) => ({
                pages: state.pages.map(p => p.id === id ? { ...p, ...updates } : p)
            })),

            deletePage: (id) => set((state) => {
                const newPages = state.pages.filter(p => p.id !== id);
                return {
                    pages: newPages,
                    blocks: state.blocks.filter(b => b.pageId !== id),
                    activePageId: state.activePageId === id ? (newPages[0]?.id || null) : state.activePageId,
                    currentView: state.activePageId === id && newPages.length === 0 ? 'home' : state.currentView
                };
            }),

            setActivePageId: (id) => set({ activePageId: id, currentView: id ? 'editor' : 'home' }),

            toggleFavorite: (id) => set((state) => ({
                pages: state.pages.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)
            })),

            duplicatePage: (id) => set((state) => {
                const page = state.pages.find(p => p.id === id);
                if (!page) return state;

                const newPageId = `page-${Math.random().toString(36).substr(2, 9)}`;
                const newPage: RoadmapPage = {
                    ...page,
                    id: newPageId,
                    title: `${page.title} (Copy)`,
                    createdAt: Date.now(),
                    isFavorite: false
                };

                // Duplicate blocks belonging to this page
                const pageBlocks = state.blocks.filter(b => b.pageId === id);
                const newBlocks = pageBlocks.map(b => ({
                    ...JSON.parse(JSON.stringify(b)),
                    id: `block-${Math.random().toString(36).substr(2, 9)}`,
                    pageId: newPageId,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                }));

                return {
                    pages: [...state.pages, newPage],
                    blocks: [...state.blocks, ...newBlocks],
                    activePageId: newPageId,
                    currentView: 'editor'
                };
            }),

            renamePage: (id, newTitle) => set((state) => ({
                pages: state.pages.map(p => p.id === id ? { ...p, title: newTitle } : p)
            })),

            setBlocks: (blocks) => set({ blocks }),

            addBlock: (type, index, parentId, initialView) => set((state) => {
                const id = `block-${Math.random().toString(36).substr(2, 9)}`;
                const now = Date.now();
                const newBlock: RoadmapBlock = {
                    id,
                    type,
                    content: '',
                    pageId: state.activePageId || undefined,
                    parentId,
                    order: state.blocks.filter(b => b.pageId === state.activePageId).length,
                    createdAt: now,
                    updatedAt: now,
                };

                if (type === 'database') {
                    newBlock.data = {
                        properties: [
                            { id: 'p1', key: 'title', label: 'Name', type: 'text' },
                            { id: 'p2', key: 'status', label: 'Status', type: 'status' },
                            { id: 'p3', key: 'priority', label: 'Priority', type: 'priority' },
                            { id: 'p4', key: 'tags', label: 'Tags', type: 'multi-select' },
                        ],
                        rows: [],
                        views: [
                            { id: 'v1', name: initialView || 'Table', type: initialView || 'Table', active: true }
                        ]
                    };
                }

                const newBlocks = [...state.blocks];
                if (typeof index === 'number') {
                    newBlocks.splice(index, 0, newBlock);
                } else {
                    newBlocks.push(newBlock);
                }

                const ordered = newBlocks.map((b, i) => ({ ...b, order: i }));
                state.addHistory(id, '', 'created', type);

                return {
                    blocks: ordered,
                    undoStack: [state.blocks, ...state.undoStack].slice(0, 50)
                };
            }),

            updateBlock: (id, updates) => set((state) => ({
                blocks: state.blocks.map(x => x.id === id ? { ...x, ...updates, updatedAt: Date.now() } : x)
            })),

            deleteBlock: (id) => set((state) => {
                const b = state.blocks.find(x => x.id === id);
                if (b) state.addHistory(id, b.content, 'deleted', b.type);
                return {
                    blocks: state.blocks.filter(x => x.id !== id && x.parentId !== id),
                    undoStack: [state.blocks, ...state.undoStack].slice(0, 50)
                };
            }),

            duplicateBlock: (id) => set((state) => {
                const b = state.blocks.find(x => x.id === id);
                if (!b) return state;
                const newBlock = { ...b, id: `block-${Math.random().toString(36).substr(2, 9)}`, createdAt: Date.now() };
                const newBlocks = [...state.blocks];
                newBlocks.splice(b.order + 1, 0, newBlock);
                return {
                    undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                    blocks: newBlocks.map((x, i) => ({ ...x, order: i }))
                };
            }),

            reorderBlocks: (startIndex, endIndex) => set((state) => {
                const result = Array.from(state.blocks);
                const [removed] = result.splice(startIndex, 1);
                result.splice(endIndex, 0, removed);
                return {
                    undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                    blocks: result.map((b, i) => ({ ...b, order: i }))
                };
            }),

            undo: () => set((state) => {
                if (state.undoStack.length === 0) return state;
                const [prev, ...rest] = state.undoStack;
                return { blocks: prev, undoStack: rest };
            }),

            addDatabaseRow: (blockId, initialValues = {}) => set((state) => ({
                undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || b.type !== 'database') return b;
                    const newRow: DatabaseRow = {
                        id: `row-${Math.random().toString(36).substr(2, 9)}`,
                        values: {
                            title: '',
                            status: 'To Do',
                            priority: 'None',
                            ...initialValues
                        },
                        subtasks: []
                    };
                    return { ...b, data: { ...b.data!, rows: [...b.data!.rows, newRow] } };
                })
            })),

            updateDatabaseRow: (blockId, rowId, updates) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data!,
                            rows: b.data!.rows.map(r => r.id === rowId ? { ...r, ...updates } : r)
                        }
                    };
                })
            })),

            deleteDatabaseRow: (blockId, rowId) => set((state) => ({
                undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data!,
                            rows: b.data!.rows.filter(r => r.id !== rowId)
                        }
                    };
                })
            })),

            reorderDatabaseRows: (blockId, startIndex, endIndex) => set((state) => ({
                undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    const result = Array.from(b.data.rows);
                    const [removed] = result.splice(startIndex, 1);
                    result.splice(endIndex, 0, removed);
                    return { ...b, data: { ...b.data, rows: result } };
                })
            })),

            addSubtask: (blockId, rowId, title = "") => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data,
                            rows: b.data.rows.map(r => {
                                if (r.id !== rowId) return r;
                                const newSubtask = { id: Math.random().toString(36).substr(2, 5), title, completed: false };
                                return { ...r, subtasks: [...(r.subtasks || []), newSubtask] };
                            })
                        }
                    };
                })
            })),

            toggleSubtask: (blockId, rowId, subtaskId) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data,
                            rows: b.data.rows.map(r => {
                                if (r.id !== rowId) return r;
                                return { ...r, subtasks: r.subtasks?.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) };
                            })
                        }
                    };
                })
            })),

            deleteSubtask: (blockId, rowId, subtaskId) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data,
                            rows: b.data.rows.map(r => {
                                if (r.id !== rowId) return r;
                                return { ...r, subtasks: r.subtasks?.filter(s => s.id !== subtaskId) };
                            })
                        }
                    };
                })
            })),

            updateSubtask: (blockId, rowId, subtaskId, title) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data,
                            rows: b.data.rows.map(r => {
                                if (r.id !== rowId) return r;
                                return { ...r, subtasks: r.subtasks?.map(s => s.id === subtaskId ? { ...s, title } : s) };
                            })
                        }
                    };
                })
            })),

            addDatabaseProperty: (blockId, label, type) => set((state) => ({
                undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    const id = `prop-${Math.random().toString(36).substr(2, 5)}`;
                    const key = label.toLowerCase().replace(/\s+/g, '_');
                    return { ...b, data: { ...b.data, properties: [...b.data.properties, { id, key, label, type }] } };
                })
            })),

            updateDatabaseProperty: (blockId, propertyId, updates) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return { ...b, data: { ...b.data, properties: b.data.properties.map(p => p.id === propertyId ? { ...p, ...updates } : p) } };
                })
            })),

            deleteDatabaseProperty: (blockId, propertyId) => set((state) => {
                const blocks = state.blocks.map((block) => {
                    if (block.id === blockId && block.data) {
                        return {
                            ...block,
                            data: {
                                ...block.data,
                                properties: block.data.properties.filter((p) => p.id !== propertyId),
                                rows: block.data.rows.map(row => {
                                    const newValues = { ...row.values };
                                    const prop = block.data!.properties.find(p => p.id === propertyId);
                                    if (prop) delete newValues[prop.key];
                                    return { ...row, values: newValues };
                                })
                            },
                        };
                    }
                    return block;
                });
                return {
                    undoStack: [state.blocks, ...state.undoStack].slice(0, 50),
                    blocks
                };
            }),

            reorderDatabaseProperties: (blockId, startIndex, endIndex) => set((state) => {
                const blocks = state.blocks.map((block) => {
                    if (block.id === blockId && block.data) {
                        const newProperties = Array.from(block.data.properties);
                        const [removed] = newProperties.splice(startIndex, 1);
                        newProperties.splice(endIndex, 0, removed);
                        return {
                            ...block,
                            data: {
                                ...block.data,
                                properties: newProperties,
                            },
                        };
                    }
                    return block;
                });
                return { blocks };
            }),

            duplicateDatabaseProperty: (blockId, propertyId) => set((state) => {
                const blocks = state.blocks.map((block) => {
                    if (block.id === blockId && block.data) {
                        const propIndex = block.data.properties.findIndex(p => p.id === propertyId);
                        if (propIndex === -1) return block;

                        const originalProp = block.data.properties[propIndex];
                        const newProp: DatabaseProperty = {
                            ...originalProp,
                            id: crypto.randomUUID(),
                            key: `${originalProp.key}_copy_${Date.now()}`,
                            label: `${originalProp.label} (Copy)`,
                        };

                        const newProperties = [...block.data.properties];
                        newProperties.splice(propIndex + 1, 0, newProp);

                        const newRows = block.data.rows.map(row => ({
                            ...row,
                            values: {
                                ...row.values,
                                [newProp.key]: row.values[originalProp.key]
                            }
                        }));

                        return {
                            ...block,
                            data: {
                                ...block.data,
                                properties: newProperties,
                                rows: newRows
                            }
                        };
                    }
                    return block;
                });
                return { blocks };
            }),

            addDatabasePropertyOption: (blockId: string, propertyId: string, option: string) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return {
                        ...b,
                        data: {
                            ...b.data,
                            properties: b.data.properties.map(p => {
                                if (p.id !== propertyId) return p;
                                const currentOptions = p.options || [];
                                if (currentOptions.includes(option)) return p;
                                return { ...p, options: [...currentOptions, option] };
                            })
                        }
                    };
                })
            })),

            addDatabaseView: (blockId, name, type) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    const id = `view-${Math.random().toString(36).substr(2, 5)}`;
                    return { ...b, data: { ...b.data, views: [...b.data.views.map(v => ({ ...v, active: false })), { id, name, type, active: true }] } };
                })
            })),

            deleteDatabaseView: (blockId, viewId) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    const newViews = b.data.views.filter(v => v.id !== viewId);
                    if (newViews.length > 0 && !newViews.find(v => v.active)) {
                        newViews[0].active = true;
                    }
                    return { ...b, data: { ...b.data, views: newViews } };
                })
            })),

            setActiveView: (blockId, viewId) => set((state) => ({
                blocks: state.blocks.map(b => {
                    if (b.id !== blockId || !b.data) return b;
                    return { ...b, data: { ...b.data, views: b.data.views.map(v => ({ ...v, active: v.id === viewId })) } };
                })
            })),

            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

            addHistory: (blockId, title, action = 'updated', blockType = 'text') => set((state) => {
                const now = Date.now();
                const lastEntry = state.history[0];
                if (lastEntry && lastEntry.id === blockId && lastEntry.action === action && (now - lastEntry.timestamp < 3000)) {
                    const newHistory = [...state.history];
                    newHistory[0] = { ...lastEntry, title: title || lastEntry.title, timestamp: now };
                    return { history: newHistory };
                }
                const newEntry: ActivityEntry = { id: blockId, title: title || 'Untitled', action, blockType, timestamp: now };
                return { history: [newEntry, ...state.history].slice(0, 50) };
            }),

            reset: () => set({ pages: [], activePageId: null, blocks: [], history: [], sidebarOpen: true }),
        }),
        {
            name: 'monodesk-workspace-engine-v3',
            partialize: (state) => {
                const { slashMenuState, slashQuery, isSearchOpen, undoStack, ...rest } = state;
                return rest;
            }
        }
    )
);
