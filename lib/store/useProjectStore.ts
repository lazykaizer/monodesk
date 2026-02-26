import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@/lib/supabase/client';

export interface Project {
    id: string;
    user_id: string;
    name: string;
    description: string;
    knowledge_base: any;
    style_guide: any;
    created_at: string;
    updated_at: string;
}

interface ProjectStore {
    projects: Project[];
    activeProjectId: string | null;
    currentProject: Project | null;
    isLoading: boolean;
    error: string | null;

    fetchProjects: () => Promise<void>;
    setActiveProject: (projectId: string | null) => Promise<void>;
    syncModuleData: (moduleKey: string, data: any) => Promise<void>;
    updateStyleDNA: (stylePrompt: string) => Promise<void>;
    createProject: (name: string, description?: string) => Promise<string | null>;
    deleteProject: (projectId: string) => Promise<void>;
    refreshCurrentProject: () => Promise<void>;
    reset: () => void;
}

const supabase = createClient();

export const useProjectStore = create<ProjectStore>()(
    persist(
        (set, get) => ({
            projects: [],
            activeProjectId: null,
            currentProject: null,
            isLoading: false,
            error: null,

            fetchProjects: async () => {
                set({ isLoading: true, error: null });
                try {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .order('updated_at', { ascending: false });

                    if (error) throw error;
                    set({ projects: data || [] });
                } catch (err: any) {
                    set({ error: err.message });
                } finally {
                    set({ isLoading: false });
                }
            },

            setActiveProject: async (projectId: string | null) => {
                if (!projectId) {
                    set({ activeProjectId: null, currentProject: null });
                    return;
                }

                set({ isLoading: true, activeProjectId: projectId });
                try {
                    const { data, error } = await supabase
                        .from('projects')
                        .select('*')
                        .eq('id', projectId)
                        .single();

                    if (error) throw error;
                    set({ currentProject: data });
                } catch (err: any) {
                    set({ error: err.message, activeProjectId: null, currentProject: null });
                } finally {
                    set({ isLoading: false });
                }
            },

            syncModuleData: async (moduleKey: string, data: any) => {
                const { activeProjectId, currentProject } = get();
                if (!activeProjectId || !currentProject) return;

                const updatedKB = {
                    ...currentProject.knowledge_base,
                    [moduleKey]: data
                };

                // Optimistic Update
                set({
                    currentProject: {
                        ...currentProject,
                        knowledge_base: updatedKB
                    }
                });

                try {
                    const { error } = await supabase
                        .from('projects')
                        .update({ knowledge_base: updatedKB })
                        .eq('id', activeProjectId);

                    if (error) throw error;
                    await get().fetchProjects();
                } catch (err: any) {
                    set({ error: err.message });
                    // Rollback could be implemented here
                }
            },

            updateStyleDNA: async (stylePrompt: string) => {
                const { activeProjectId, currentProject } = get();
                if (!activeProjectId || !currentProject) return;

                const updatedStyle = {
                    ...currentProject.style_guide,
                    style_dna: stylePrompt
                };

                // Optimistic Update
                set({
                    currentProject: {
                        ...currentProject,
                        style_guide: updatedStyle
                    }
                });

                try {
                    const { error } = await supabase
                        .from('projects')
                        .update({ style_guide: updatedStyle })
                        .eq('id', activeProjectId);

                    if (error) throw error;
                    await get().fetchProjects();
                } catch (err: any) {
                    set({ error: err.message });
                }
            },

            createProject: async (name: string, description: string = "") => {
                set({ isLoading: true, error: null });
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) throw new Error("Not authenticated");

                    const { data, error } = await supabase
                        .from('projects')
                        .insert({
                            user_id: user.id,
                            name,
                            description,
                            knowledge_base: {},
                            style_guide: {}
                        })
                        .select()
                        .single();

                    if (error) throw error;

                    await get().fetchProjects();
                    await get().setActiveProject(data.id);
                    return data.id;
                } catch (err: any) {
                    set({ error: err.message });
                    return null;
                } finally {
                    set({ isLoading: false });
                }
            },

            deleteProject: async (projectId: string) => {
                set({ isLoading: true, error: null });
                try {
                    const { error } = await supabase
                        .from('projects')
                        .delete()
                        .eq('id', projectId);

                    if (error) throw error;

                    const { activeProjectId } = get();
                    if (activeProjectId === projectId) {
                        set({ activeProjectId: null, currentProject: null });
                    }

                    await get().fetchProjects();
                } catch (err: any) {
                    set({ error: err.message });
                } finally {
                    set({ isLoading: false });
                }
            },

            refreshCurrentProject: async () => {
                const { activeProjectId } = get();
                if (activeProjectId) {
                    await get().setActiveProject(activeProjectId);
                }
            },
            reset: () => set({
                projects: [],
                activeProjectId: null,
                currentProject: null,
                isLoading: false,
                error: null
            })
        }),
        {
            name: 'monodesk-projects',
            partialize: (state) => ({
                ...state,
                // Don't persist heavy fields in localStorage to avoid QuotaExceededError.
                // These are already saved in Supabase and fetched when needed.
                projects: state.projects.map(p => ({
                    ...p,
                    knowledge_base: {},
                    style_guide: {}
                })),
                currentProject: state.currentProject ? {
                    ...state.currentProject,
                    knowledge_base: {},
                    style_guide: {}
                } : null
            })
        }
    )
);
