import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskStatus = 'idle' | 'loading' | 'success' | 'error';

export interface TaskState {
    status: TaskStatus;
    progress: number;
    loadingStep: string;
    data: any | null;
    input: string;
    timestamp: number;
    error?: string;
    deckId?: string | null;
    viewMode?: 'history' | 'editor';
    activeSlideId?: string | number | null;
}

interface TaskStore {
    tasks: Record<string, TaskState>;
    ownerId: string | null;
    setTask: (moduleId: string, updates: Partial<TaskState>) => void;
    clearTask: (moduleId: string) => void;
    startTask: (moduleId: string, steps?: string[]) => void;
    completeTask: (moduleId: string, data: any) => void;
    failTask: (moduleId: string, error: string) => void;
    reset: () => void;
    syncUser: (userId: string) => void;
}

export const useTaskStore = create<TaskStore>()(
    persist(
        (set, get) => ({
            tasks: {},
            ownerId: null,
            syncUser: (userId) => {
                if (get().ownerId !== userId) {
                    set({ tasks: {}, ownerId: userId });
                }
            },
            setTask: (moduleId, updates) =>
                set((state) => ({
                    tasks: {
                        ...state.tasks,
                        [moduleId]: {
                            ...(state.tasks[moduleId] || {
                                status: 'idle',
                                progress: 0,
                                loadingStep: '',
                                data: null,
                                timestamp: Date.now(),
                            }),
                            ...updates,
                        },
                    },
                })),
            clearTask: (moduleId) =>
                set((state) => {
                    const newTasks = { ...state.tasks };
                    delete newTasks[moduleId];
                    return { tasks: newTasks };
                }),
            startTask: (moduleId, steps = []) =>
                set((state) => ({
                    tasks: {
                        ...state.tasks,
                        [moduleId]: {
                            status: 'loading',
                            progress: 0,
                            loadingStep: steps[0] || 'Initializing...',
                            data: null,
                            input: '',
                            timestamp: Date.now(),
                        },
                    },
                })),
            completeTask: (moduleId, data) =>
                set((state) => ({
                    tasks: {
                        ...state.tasks,
                        [moduleId]: {
                            ...state.tasks[moduleId],
                            status: 'success',
                            progress: 100,
                            loadingStep: 'Completed',
                            data,
                            timestamp: Date.now(),
                        },
                    },
                })),
            failTask: (moduleId, error) =>
                set((state) => ({
                    tasks: {
                        ...state.tasks,
                        [moduleId]: {
                            ...state.tasks[moduleId],
                            status: 'error',
                            loadingStep: 'Failed',
                            error,
                            timestamp: Date.now(),
                        },
                    },
                })),
            reset: () => set({ tasks: {} }),
        }),
        {
            name: 'monodesk-tasks',
            // Safe storage wrapper to recover from corrupted localStorage data
            storage: {
                getItem: (name: string) => {
                    try {
                        const raw = localStorage.getItem(name);
                        if (!raw) return null;
                        return JSON.parse(raw);
                    } catch (e) {
                        console.warn('Corrupted localStorage data detected, clearing:', e);
                        localStorage.removeItem(name);
                        return null;
                    }
                },
                setItem: (name: string, value: any) => {
                    try {
                        const serialized = JSON.stringify(value);
                        // Guard: don't write if > 4MB to avoid corruption
                        if (serialized.length > 4 * 1024 * 1024) {
                            console.warn('Store data too large for localStorage, skipping persist');
                            return;
                        }
                        localStorage.setItem(name, serialized);
                    } catch (e) {
                        console.warn('Failed to persist to localStorage:', e);
                    }
                },
                removeItem: (name: string) => localStorage.removeItem(name),
            },
            partialize: (state) => ({
                ...state,
                tasks: Object.fromEntries(
                    Object.entries(state.tasks).map(([key, value]) => [
                        key,
                        {
                            ...value,
                            // SMART PERSISTENCE:
                            // Keep moodImage (base64) ONLY if we don't have a storage link (image_url) yet.
                            // This ensures images survive refresh until they are safely uploaded.
                            data: key === 'pitch' && value.data
                                ? value.data.map((slide: any) =>
                                    ({ ...slide, moodImage: slide.image_url ? null : slide.moodImage })
                                )
                                : key === 'creative' && value.data
                                    ? {
                                        ...value.data,
                                        image: value.data.image ? { ...value.data.image, image: typeof value.data.image.image === 'string' && value.data.image.image.startsWith('data:image') ? null : value.data.image.image } : null,
                                        logo: value.data.logo ? { ...value.data.logo, image: typeof value.data.logo.image === 'string' && value.data.logo.image.startsWith('data:image') ? null : value.data.logo.image } : null,
                                        agency: value.data.agency ? { ...value.data.agency, image: typeof value.data.agency.image === 'string' && value.data.agency.image.startsWith('data:image') ? null : value.data.agency.image } : null,
                                        video: value.data.video ? { ...value.data.video, video: typeof value.data.video.video === 'string' && value.data.video.video.startsWith('data:') ? null : value.data.video.video } : null
                                    }
                                    : value.data,
                            deckId: value.deckId,
                            viewMode: value.viewMode,
                            activeSlideId: value.activeSlideId
                        }
                    ])
                )
            })
        }
    )
);
