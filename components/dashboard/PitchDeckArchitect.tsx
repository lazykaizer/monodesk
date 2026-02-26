"use client";

import { useState, useEffect, useRef, Fragment } from 'react';
import { createPortal } from 'react-dom';
import {
    ChevronLeft, ChevronRight, Download, Edit2, Layout, Plus, Save, Trash2, Wand2, X,
    RefreshCw, Image as ImageIcon, AlignLeft, AlignRight, Maximize, Check, Share2,
    Printer, FileDown, Pencil, History as HistoryIcon, Rocket, Loader2, Sparkles,
    Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignCenter, AlignJustify,
    Palette, Type, Grid, Square, ListFilter, LayoutTemplate, MousePointer2, Type as FontIcon,
    Droplets, Highlighter, Columns, PanelLeft, PanelRight, LayoutGrid, Info, FileArchive, Presentation, FileText
} from 'lucide-react';
import { generateInvestorPitchDeck, generatePitchDeckImage } from '@/app/actions/gemini';
import {
    fetchPitchDeckHistory,
    fetchPitchDeckById,
    vaultPitchDeck,
    deletePitchDeckAction,
    uploadSlideImageAction
} from '@/app/actions/pitch-deck-safe';
import { cn, sanitizeAIText } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import SlideSelector from './SlideSelector';
import { useTaskStore } from "@/lib/store/useTaskStore";
import { useProjectStore } from "@/lib/store/useProjectStore";
import { useExportSystem, type ExportFormat } from './hooks/useExportSystem';
import { AnimatePresence, motion } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import ProjectSyncButton from "./ProjectSyncButton";
import PitchDeckSlide from './PitchDeckSlide';
import FloatingTextToolbar from './FloatingTextToolbar';
import { Slide, SlideFeature } from '@/lib/types/pitch-deck';
import { suggestPitchDeckSlides } from '@/app/actions/gemini';
import CubeLoader from '@/components/ui/cube-loader';

const initialSlides: Slide[] = [];

export default function PitchDeckArchitect() {
    const { tasks, startTask, completeTask, failTask, setTask } = useTaskStore();
    const { currentProject } = useProjectStore();
    const task = tasks['pitch'];

    const [currentStep, setCurrentStep] = useState(1);
    const [deckConfig, setDeckConfig] = useState({
        idea: "",
        density: 'balanced' as 'minimal' | 'balanced' | 'extensive',
        tone: 'professional' as 'professional' | 'casual' | 'playful',
        theme: 'dark_neon',
        selectedSlides: [] as string[]
    });

    const [slides, setSlides] = useState<Slide[]>(task?.data || initialSlides);
    const [activeSlide, setActiveSlide] = useState<Slide | null>(null);
    const isGenerating = task?.status === 'loading';
    const [isComplete, setIsComplete] = useState(task?.status === 'success' || (task?.data && task.data.length > 0));
    const [startupName, setStartupName] = useState(task?.data?.[0]?.title || "");
    const [currentDeckId, setCurrentDeckId] = useState<string | null>(task?.deckId || null);
    const currentDeckIdRef = useRef<string | null>(task?.deckId || null); // Synchronous ref for background uploads
    const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
    const generationAbortRef = useRef<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [savingProgress, setSavingProgress] = useState<string | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const isHydratedRef = useRef(false);
    const isSilentSavingRef = useRef(false);
    const isSavePendingRef = useRef(false);
    // Ref for fast debounced text auto-save timer
    const textSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Always-current slides ref for the debounced save callback
    const latestSlidesRef = useRef<Slide[]>(slides);
    const [isDeepFetching, setIsDeepFetching] = useState(false);
    const isDeepFetchingRef = useRef<boolean>(false);

    const [viewMode, setViewMode] = useState<'history' | 'editor'>(task?.viewMode || 'history');
    const viewModeRef = useRef(viewMode);

    // Sync viewMode to store and ref whenever it changes locally
    useEffect(() => {
        viewModeRef.current = viewMode;
        setTask('pitch', { viewMode });
    }, [viewMode]);
    const [history, setHistory] = useState<any[]>([]);

    // Scaling Logic
    const containerRef = useRef<HTMLDivElement>(null);
    const slideEditorRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                // Calculate scale based on container width vs 1920px native width
                const currentWidth = containerRef.current.clientWidth;
                setScale(currentWidth / 1920);
            }
        };

        // Initial calc
        updateScale();

        // Add listener
        const observer = new ResizeObserver(updateScale);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [activeSlide]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (isComplete && hasUnsavedChanges && !isSaving) {
                    saveToDatabase(slides);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [slides, isComplete, hasUnsavedChanges, isSaving]);

    useEffect(() => {
        if (!isComplete || !hasUnsavedChanges || isSaving) return;

        const timer = setTimeout(() => {
            saveToDatabase(slides, true); // Silent auto-save
        }, 1000); // 1 second safety-net auto-save

        return () => clearTimeout(timer);
    }, [slides, isComplete, hasUnsavedChanges, isSaving]);

    // Export system hook
    const { exportDeck, isExporting, exportProgress } = useExportSystem();

    // Refs to avoid stale closures in hydration effect without changing dep array size
    const slidesRef = useRef(slides);
    slidesRef.current = slides;
    latestSlidesRef.current = slides;
    const isCompleteRef = useRef(isComplete);
    isCompleteRef.current = isComplete;

    // Hydration Sync: Ensure we load data from store if it exists but local state is empty
    useEffect(() => {
        // Case A: Generation is currently in progress
        if (task?.status === 'loading') {
            console.log("Resuming active generation UI...");
            setViewMode('editor');
            return;
        }

        // If generation is complete (slides are loaded locally), NEVER reset view
        if (isCompleteRef.current || slidesRef.current.length > 0) {
            return;
        }

        // Case B: Generation succeeded but local state is empty (Refresh scenario)
        if (slidesRef.current.length === 0 && task?.data && task.data.length > 0) {
            console.log("Hydrating slides from store...", task.data.length);

            // Check if we need to reconcile with DB (due to image stripping in store)
            const needsReconcile = task.deckId && task.data.some((s: any) => !s.moodImage && !s.image_url);

            if (needsReconcile && task.deckId) {
                console.log("Images missing in local cache, fetching full record from Supabase...");
                setIsHydrating(true);
                fetchPitchDeckById(task.deckId).then(fullDeck => {
                    if (fullDeck && fullDeck.slides_content) {
                        setSlides(fullDeck.slides_content);
                        setStartupName(fullDeck.deck_title);

                        // Restore active slide from store or default to first
                        const storedActiveId = task.activeSlideId;
                        const restoredActive = fullDeck.slides_content.find((s: any) => String(s.id) === String(storedActiveId)) || fullDeck.slides_content[0];
                        setActiveSlide(restoredActive);
                        setIsHydrating(false);
                        isHydratedRef.current = true;
                    }
                }).catch(err => {
                    console.error("Reconciliation fetch failed:", err);
                    setIsHydrating(false);
                    isHydratedRef.current = true;
                    // Fallback to stripped data
                    setSlides(task.data);
                    setActiveSlide(task.data[0]);
                });
            } else {
                setSlides(task.data);
                setStartupName(task.data?.[0]?.title || "");
                isHydratedRef.current = true;

                // Restore active slide from store
                const storedActiveId = task.activeSlideId;
                const restoredActive = task.data.find((s: any) => String(s.id) === String(storedActiveId)) || task.data[0];
                setActiveSlide(restoredActive);
            }

            setIsComplete(true);

            // Restore ID if it exists in store
            if (task.deckId) {
                setCurrentDeckId(task.deckId);
                currentDeckIdRef.current = task.deckId;
            }

            if (task.viewMode) {
                setViewMode(task.viewMode);
            } else {
                setViewMode('editor');
            }
        } else if (slidesRef.current.length === 0 && (!task?.data || task.data.length === 0) && (task?.status as string) !== 'loading' && !isCompleteRef.current) {
            // Only switch to history if we genuinely have no data, aren't loading, and aren't complete
            if (!task?.viewMode || task.viewMode === 'history') {
                setViewMode('history');
            }
        }
    }, [task?.data, task?.status, task?.deckId]); // Original 3 deps — refs handle the rest



    // Persistence Sync: Ensure we save local state back to store when it changes
    // IMPORTANT: Strip base64 images BEFORE writing to the store to stay under localStorage limits
    useEffect(() => {
        // Avoid saving empty state if we just cleared or haven't loaded yet
        if (slides.length > 0) {
            const liteSlides = slides.map((s, i) => ({
                ...s,
                moodImage: i === 0 ? s.moodImage : null, // Keep only first slide thumbnail
            }));
            setTask('pitch', {
                data: liteSlides,
                status: 'success',
                deckId: currentDeckId,
                activeSlideId: activeSlide?.id
            });
        }
    }, [slides, currentDeckId, activeSlide?.id]);

    const handleClear = () => {
        setTask('pitch', { status: 'idle', data: [], input: "", progress: 0 });
        setSlides([]);
        setActiveSlide(null);
        setIsComplete(false);
        setStartupName("");
        setDeckConfig({
            idea: "",
            density: 'balanced',
            tone: 'professional',
            theme: 'dark_neon',
            selectedSlides: []
        });
        setCurrentStep(1);
        setViewMode('history');
    };


    // History Fetching
    const fetchHistory = async () => {
        try {
            const data = await fetchPitchDeckHistory();
            if (Array.isArray(data)) {
                setHistory(data);
            } else {
                console.error("fetchPitchDeckHistory returned non-array data:", data);
                setHistory([]);
            }
        } catch (error: any) {
            console.error("Error fetching pitch deck history:", error);
            // Handle Supabase egress/rate limit errors
            if (error?.message?.toLowerCase().includes("limit") || error?.code === "402" || error?.code === "429") {
                alert("Database Access Limited: It seems the daily bandwidth limit has been reached. Some images might not load.");
            }
        }
    };

    useEffect(() => {
        if (viewMode === 'history') {
            fetchHistory();
        }
    }, [viewMode]);

    const deleteFromHistory = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deletePitchDeckAction(id);
            fetchHistory();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    const handleBackToHistory = async () => {
        try {
            if (slides.length > 0 && isHydratedRef.current) {
                // Auto-save in the background, only if we are fully hydrated
                saveToDatabase(slides, true);
            }
        } catch (e) {
            console.error("Auto-save on exit failed:", e);
        }

        // CRITICAL: Stop any ongoing generation task status
        if (task?.status === 'loading') {
            setTask('pitch', { status: 'idle' });
        }
        // Reset wizard for a fresh start
        setDeckConfig({ idea: "", density: 'balanced', tone: 'professional', theme: 'dark_neon', selectedSlides: [] });
        setCurrentStep(1);
        setSlides([]);
        setActiveSlide(null);
        setIsComplete(false);
        setGeneratingImages({}); // Clear stuck rendering indicators
        setTask('pitch', { input: "", viewMode: 'history' });

        // Switch view immediately for better UX
        setViewMode('history');
    };

    const loadFromHistory = (item: any) => {
        console.log("Loading deck from history:", item.id, "Slides:", item.slides_content?.length);

        // Instant Switch: Use lightweight data first
        setStartupName(item.deck_title);
        setSlides(item.slides_content || initialSlides);
        if (item.slides_content && item.slides_content.length > 0) {
            setActiveSlide(item.slides_content[0]);
        }
        setCurrentDeckId(item.id);
        currentDeckIdRef.current = item.id;
        setIsComplete(true);
        setTask('pitch', { data: item.slides_content, status: 'success', input: item.idea, progress: 100 });
        setDeckConfig(prev => ({ ...prev, idea: item.idea }));
        setHasUnsavedChanges(false);
        setViewMode('editor');

        // Background Fetch: If it's a lightweight project, get full data silently
        const isLightweight = item.slides_content?.length > 1 && !item.slides_content[1].moodImage && !item.slides_content[1].image_url;

        if (isLightweight) {
            console.log("Background fetching full deck visuals...");
            isDeepFetchingRef.current = true;
            // We don't block, just trigger it
            (async () => {
                try {
                    const data = await fetchPitchDeckById(item.id);
                    if (data && data.slides_content) {
                        // Atomic sync: update slides and activeSlide without disrupting view
                        setSlides(data.slides_content);
                        setActiveSlide(prev => {
                            if (!prev) return data.slides_content[0];
                            // Find the same slide index in full data
                            const currentIndex = item.slides_content.findIndex((s: any) => s.id === prev.id);
                            return data.slides_content[currentIndex !== -1 ? currentIndex : 0];
                        });
                        setHistory(prev => prev.map(h => h.id === item.id ? data : h));
                        console.log("Background fetch complete.");
                    }
                } catch (err: any) {
                    console.error("Deep fetch failed:", err);
                } finally {
                    isDeepFetchingRef.current = false;
                }
            })();
        }
    };


    const saveToDatabase = async (currentSlides: Slide[], silent = false) => {
        if (isHydrating && !silent) {
            console.warn("Save blocked: Hydration in progress.");
            return;
        }

        if (isDeepFetchingRef.current) {
            console.warn("Save blocked: Deep fetch in progress. Preventing data overwrite.");
            return;
        }

        // Concurrency Guard for non-silent saves
        if (isSaving && !silent) {
            console.warn("Manual save already in progress, skipping.");
            return;
        }

        // Concurrency guard for silent saves — if already auto-saving, mark as pending to sync later
        if (silent && isSilentSavingRef.current) {
            isSavePendingRef.current = true;
            return;
        }

        console.log("saveToDatabase called", { slideCount: currentSlides.length, silent });
        if (!silent) setIsSaving(true);
        if (silent) isSilentSavingRef.current = true;

        try {
            let deckId = currentDeckIdRef.current;

            // 1. STAGE 1: Ensure we have a deckId (Skeleton Save)
            if (!deckId) {
                console.log("Stage 1: Initializing Cloud Record (Skeleton)");
                if (!silent) setSavingProgress("Initializing cloud record...");
                const skeletonPayload = {
                    deck_title: String(currentSlides[0]?.title || startupName || deckConfig.idea.substring(0, 30)).trim(),
                    slides_content: currentSlides.map(s => s.image_url ? { ...s, moodImage: undefined } : s),
                    idea: String(deckConfig.idea).trim(),
                };
                const data = await vaultPitchDeck(skeletonPayload);
                if (data && data.id) {
                    deckId = data.id;
                    setCurrentDeckId(data.id);
                    currentDeckIdRef.current = data.id;
                    setTask('pitch', { deckId: data.id });
                }
            }

            if (!deckId) throw new Error("Could not acquire deck ID for saving.");

            // 2. STAGE 2: Sequentially upload any unsaved Base64 images
            const changesMap: Record<number, Partial<Slide>> = {};
            let hasNewImages = false;

            for (let i = 0; i < currentSlides.length; i++) {
                const slide = currentSlides[i];
                if (slide.moodImage?.startsWith('data:image')) {
                    hasNewImages = true;
                    if (!silent) setSavingProgress(`Uploading slide ${i + 1} visual...`);

                    try {
                        const uploadResult = await uploadSlideImageAction(deckId, String(slide.id), slide.moodImage);
                        if (uploadResult && uploadResult.publicUrl) {
                            changesMap[slide.id] = {
                                image_url: uploadResult.publicUrl,
                                storage_path: uploadResult.fileName,
                                moodImage: undefined
                            };
                        }
                    } catch (uploadErr) {
                        console.warn(`Failed to upload image for slide ${i}:`, uploadErr);
                    }
                }
            }

            // 3. STAGE 3: Final Metadata Save
            if (!silent) setSavingProgress("Finalizing save...");

            const updatedSlidesForPayload = currentSlides.map(s => {
                const changes = changesMap[s.id];
                if (changes) return { ...s, ...changes };
                if (s.image_url) return { ...s, moodImage: undefined };
                return s;
            });

            const finalPayload = {
                id: deckId,
                deck_title: updatedSlidesForPayload[0]?.title || startupName || deckConfig.idea.substring(0, 30),
                slides_content: updatedSlidesForPayload,
                idea: deckConfig.idea,
            };

            await vaultPitchDeck(finalPayload);

            // 4. ATOMIC SYNC
            if (hasNewImages) {
                setSlides(prev => prev.map(s => {
                    const changes = changesMap[s.id];
                    return changes ? { ...s, ...changes } : s;
                }));
                if (activeSlide && changesMap[activeSlide.id]) {
                    setActiveSlide(prev => prev ? { ...prev, ...changesMap[prev.id] } : null);
                }
            }

            setLastSaved(new Date());
            setHasUnsavedChanges(false);
            fetchHistory();
        } catch (error: any) {
            console.error("Failed to save deck to DB:", error);
            if (!silent) alert(`Database Save Error: ${JSON.stringify(error, null, 2)}`);
        } finally {
            if (silent) {
                isSilentSavingRef.current = false;
                // If a save was requested during the current save, trigger a final sync
                if (isSavePendingRef.current) {
                    isSavePendingRef.current = false;
                    saveToDatabase(latestSlidesRef.current, true);
                }
            }
            if (!silent) {
                setIsSaving(false);
                setSavingProgress(null);
            }
        }
    };

    const generateImageForSlide = async (slide: Slide, force = false) => {
        if (generatingImages[slide.id]) return;

        // 1. Guard Clause: Skip if image already exists (unless forcing)
        if (!force && slide.image_url && slide.image_url.startsWith('http')) {
            return;
        }

        setGeneratingImages(prev => ({ ...prev, [slide.id]: true }));

        try {
            // 3. (Optional) Force Regeneration Logic - nothing to clean up in storage now

            // 4. Generate/Prepare Image
            let base64Image: string | undefined = slide.moodImage;

            if (force || !base64Image) {
                const prompt = slide.styleHint || `Vibrant corporate 3D illustration, ${slide.title}, cinematic studio lighting, hyper-detailed textures, professional colors`;
                try {
                    base64Image = await generatePitchDeckImage(prompt);
                    if (base64Image) {
                        // Instantly show the new Base64 to the user
                        setSlides(current => {
                            const updated = current.map(s => s.id === slide.id ? { ...s, moodImage: base64Image } : s);
                            return updated;
                        });
                    }
                } catch (genError) {
                    console.error(`AI Image Generation failed for slide: ${slide.title}`, genError);
                    return;
                }
            }

            // 5. Automatic Database Sync - pass the updated array directly to avoid stale closures
            if (currentDeckIdRef.current && base64Image) {
                // Use a functional-style mapping to ensure we don't use stale refs
                // We'll wait a tiny bit to let the React state update from line 433 at least queue up
                await new Promise(r => setTimeout(r, 0));
                const refreshedSlides = slidesRef.current.map(s => s.id === slide.id ? { ...s, moodImage: base64Image } : s);
                await saveToDatabase(refreshedSlides, true);
            }

            // 6. Generate Feature Images (Legacy logic)
            if (slide.layout_type === 'image_card_grid' || slide.layout_type === 'feature_grid') {
                const updatedFeatures = [...(slide.features || [])];
                let changed = false;

                for (let i = 0; i < updatedFeatures.length; i++) {
                    const feat = updatedFeatures[i];
                    if (feat.image_url && !feat.image_url.startsWith('data:image') && !feat.image_url.startsWith('http')) {
                        try {
                            const featImage = await generatePitchDeckImage(feat.image_url);
                            if (featImage) {
                                updatedFeatures[i] = { ...feat, image_url: featImage };
                                changed = true;
                            }
                        } catch (featError) {
                            console.error(`Feature image gen failed for ${feat.title}:`, featError);
                        }
                    }
                }

                if (changed) {
                    setSlides(current => current.map(s => s.id === slide.id ? { ...s, features: updatedFeatures } : s));
                }
            }
        } catch (error: any) {
            console.error("Unhandled error in generateImageForSlide:", slide.title, error);
        } finally {
            setGeneratingImages(prev => ({ ...prev, [slide.id]: false }));
        }
    };

    // Lazy Load Trigger - Sequential Queue with Cancellation
    useEffect(() => {
        const generationId = ++generationAbortRef.current;

        const generateImagesSequentially = async () => {
            if (!isComplete || slides.length === 0 || viewMode !== 'editor') return;

            // IMAGE GUARD: Don't auto-generate images for old decks loaded from history.
            // Only auto-generate if the task was created in the last 15 minutes.
            const taskTimestamp = useTaskStore.getState().tasks['pitch']?.timestamp || 0;
            const isFresh = Date.now() - taskTimestamp < 15 * 60 * 1000;

            if (!isFresh && !currentDeckId) { // If it's old and unsaved, maybe it's a recovered session
                // Allow
            } else if (!isFresh) {
                console.log("Skipping background image auto-gen for historical deck.");
                return;
            }

            // Use a for-i loop with slidesRef to always get the latest state (closure is stale)
            for (let i = 0; i < slidesRef.current.length; i++) {
                const slide = slidesRef.current[i];
                // Check if effect was cancelled
                if (generationId !== generationAbortRef.current) return;

                // Check if we already have a generated image (either Base64 moodImage or a persisted image_url from DB)
                if (slide.moodImage || slide.image_url || generatingImages[slide.id]) {
                    continue;
                }

                // Stop if global task error
                if (useTaskStore.getState().tasks['pitch']?.status === 'error') return;

                console.log(`Starting background gen for slide: ${slide.title}`);
                await generateImageForSlide(slide);

                // Small delay to prevent API flooding/extension blocking
                await new Promise(r => setTimeout(r, 1000));
            }
        };

        generateImagesSequentially();

        return () => {
            // Cancel this loop when slides change or effect re-runs
            generationAbortRef.current++;
        };
    }, [isComplete, slides.length, currentDeckId, viewMode]);

    const handleGenerateDeck = async () => {
        if (isGenerating) {
            setTask('pitch', { status: 'idle', data: null, progress: 0 });
            return;
        }

        if (!deckConfig.idea) return alert("Please enter an idea first!");

        // DEDUPLICATION: If we already have a deck for this exact idea in history,
        // and it's less than 2 minutes old, just load it instead of generating new slides.
        const recentMatch = history.find(h =>
            h.idea.toLowerCase() === deckConfig.idea.toLowerCase() &&
            (Date.now() - new Date(h.created_at).getTime() < 120000)
        );


        if (recentMatch) {
            console.log("Loading recent duplicate instead of re-generating...");
            loadFromHistory(recentMatch);
            return;
        }

        // CRITICAL: Reset local state for fresh generation
        setSlides([]);
        setActiveSlide(null);
        setIsComplete(false);
        setCurrentDeckId(null);
        currentDeckIdRef.current = null;
        setTask('pitch', { deckId: null });

        startTask('pitch', [
            "RESEARCHING SECTOR...",
            "ORCHESTRATING NARRATIVE...",
            "SYNTHESIZING SLIDES...",
            "DESIGNING VISUALS..."
        ]);
        setTask('pitch', { input: deckConfig.idea });


        // SWITCH TO EDITOR IMMEDIATELY ON GENERATE
        setViewMode('editor');

        try {
            const { summarizeProjectContext } = await import('@/lib/utils/project-context');
            const context = summarizeProjectContext(currentProject);

            // Step 1: Text Generation (Fast)
            const rawData = await generateInvestorPitchDeck(
                deckConfig.idea,
                deckConfig.selectedSlides,
                context,
                deckConfig.density,
                deckConfig.tone
            );


            if (useTaskStore.getState().tasks['pitch']?.status !== 'loading' || viewModeRef.current !== 'editor') {
                console.log("Generation cancelled or view changed. Aborting UI update.");
                return;
            }

            if (!rawData || !Array.isArray(rawData)) {
                failTask('pitch', "No valid data returned.");
                return;
            }

            const transformedSlides: Slide[] = rawData.map((s: any, i: number) => ({
                id: i + 1,
                title: sanitizeAIText(s.headline || s.title || "Untitled Slide"),
                subtitle: sanitizeAIText(s.sub_headline || s.slide_type || ""),
                content: `<ul>${(s.bullet_points || s.bullets || []).map((p: string) => `<li>${sanitizeAIText(p)}</li>`).join('')}</ul>`,
                features: (s.features || []).map((f: any) => ({
                    ...f,
                    title: sanitizeAIText(f.title || ""),
                    description: sanitizeAIText(f.description || ""),
                    icon: f.icon_keyword
                })),
                styleHint: s.image_prompt || s.styleHint,
                layout_type: s.layout_type || 'split_image_left',
                design_dna: s.design_dna || 'Minimalist',
                theme: s.theme,
                overlayOpacity: 0.2
            }));

            if (transformedSlides.length === 0) {
                failTask('pitch', "No slides generated.");
                return;
            }

            // Step 2: Show slides immediately
            setSlides(transformedSlides);
            setActiveSlide(transformedSlides[0]);
            setStartupName(transformedSlides[0]?.title || "New Pitch Deck");
            setIsComplete(true);

            // CRITICAL: Lock viewMode in store BEFORE completeTask so hydration useEffect
            // doesn't see undefined viewMode and reset us back to 'history'
            setTask('pitch', { viewMode: 'editor', input: '' });

            // Mark task as success with text data
            setTask('pitch', { loadingStep: "ORCHESTRATING NARRATIVE..." });
            await new Promise(r => setTimeout(r, 800));
            setTask('pitch', { loadingStep: "SYNTHESIZING SLIDES..." });
            await new Promise(r => setTimeout(r, 800));
            setTask('pitch', { loadingStep: "DESIGNING VISUALS..." });
            await new Promise(r => setTimeout(r, 800));

            completeTask('pitch', transformedSlides);

            // Reset wizard state so it's fresh if user returns to create another deck
            setDeckConfig({ idea: '', density: 'balanced', tone: 'professional', theme: 'dark_neon', selectedSlides: [] });
            setCurrentStep(1);



            // Images will be triggered by the useEffect above
            await saveToDatabase(transformedSlides, true);

        } catch (error) {
            const currentStatus = useTaskStore.getState().tasks['pitch']?.status;
            if (currentStatus === 'loading') {
                console.error("Deck Gen Failed:", error);
                failTask('pitch', "Generation failed.");
            }
        }
    };


    const handleSlideContentChange = (slideId: number, field: keyof Slide, newValue: any) => {
        setSlides((prevSlides) => {
            return prevSlides.map(s => s.id === slideId ? { ...s, [field]: newValue } : s);
        });

        // Update active slide too if matches
        setActiveSlide(prev => (prev && prev.id === slideId) ? { ...prev, [field]: newValue } : prev);
        setHasUnsavedChanges(true);
    };

    const updateSlide = (updatedSlide: Slide) => {
        console.log(`[updateSlide] id=${updatedSlide.id}, title="${(updatedSlide.title || '').substring(0, 40)}..."`);
        setSlides(currentSlides => {
            const newSlides = currentSlides.map(s => s.id === updatedSlide.id ? updatedSlide : s);
            latestSlidesRef.current = newSlides;
            return newSlides;
        });
        setActiveSlide(updatedSlide);
        setHasUnsavedChanges(true);

        // Fast auto-save: debounce 500ms so rapid edits batch together,
        // but save quickly enough that a page refresh won't lose data.
        if (textSaveTimerRef.current) clearTimeout(textSaveTimerRef.current);
        textSaveTimerRef.current = setTimeout(() => {
            saveToDatabase(latestSlidesRef.current, true);
        }, 250);
    };

    // Slide Topics State
    const [availableTopics, setAvailableTopics] = useState([
        "Title Slide (Brand Intro)",
        "The Problem (Pain Points)",
        "The Solution (Product Reveal)",
        "Market Opportunity (TAM/SAM/SOM)",
        "The Product (Features & Demo)",
        "Business Model (How we make money)",
        "Traction & Validation",
        "Go-To-Market Strategy",
        "Competitive Landscape",
        "Competitive Advantage (Moat)",
        "Financial Projections",
        "The Team",
        "Roadmap & Milestones",
        "The Ask (Funding Request)",
        "Vision & Mission"
    ]);
    const [customTopic, setCustomTopic] = useState("");
    const [isAnalyzingSlides, setIsAnalyzingSlides] = useState(false);

    const handleAddCustomTopic = () => {
        if (!customTopic.trim()) return;
        if (availableTopics.includes(customTopic)) return;
        setAvailableTopics([...availableTopics, customTopic]);
        setDeckConfig(prev => ({
            ...prev,
            selectedSlides: [...prev.selectedSlides, customTopic]
        })); // Auto-select new topic
        setCustomTopic("");
    };

    const toggleSlideSelection = (topic: string) => {
        setDeckConfig(prev => ({
            ...prev,
            selectedSlides: prev.selectedSlides.includes(topic)
                ? prev.selectedSlides.filter(t => t !== topic)
                : [...prev.selectedSlides, topic]
        }));
    };


    return (
        <div className="h-screen bg-[#050505] text-white font-sans flex overflow-hidden">

            {/* LEFT SIDEBAR - DYNAMIC (HISTORY OR SLIDES) */}
            <div className="w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-10 shrink-0 transition-all duration-300">

                {viewMode === 'history' ? (
                    /* HISTORY MODE SIDEBAR */
                    <>
                        <div className="p-4 border-b border-white/5">
                            <h2 className="text-sm font-bold text-zinc-300 tracking-wider">YOUR PROJECTS</h2>
                            <p className="text-[10px] text-zinc-500">{history.length} saved decks</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-10 px-4 text-zinc-600 text-xs">
                                    No saved decks found.
                                </div>
                            ) : (
                                history.map((item) => {
                                    // Extract thumbnail from first slide if available
                                    const firstSlide = item.slides_content?.[0];
                                    const thumbnail = firstSlide?.moodImage;

                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => loadFromHistory(item)}
                                            className="group relative w-full aspect-video rounded-lg border border-white/10 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all"
                                        >
                                            {/* Background Image / Thumbnail */}
                                            {item.slides_content?.[0]?.image_url || item.slides_content?.[0]?.moodImage ? (
                                                <img
                                                    src={item.slides_content[0].image_url || item.slides_content[0].moodImage}
                                                    alt="thumb"
                                                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-zinc-900 flex items-center justify-center">
                                                    <Layout className="text-zinc-700" size={24} />
                                                </div>
                                            )}

                                            {/* Gradient Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                                            {/* Content */}
                                            <div className="absolute bottom-0 inset-x-0 p-3">
                                                <h4 className="font-serif text-sm font-bold text-white leading-tight line-clamp-2">{item.deck_title}</h4>
                                                <p className="text-[10px] text-zinc-400 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                                            </div>

                                            {/* Delete Action */}
                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 bg-black/50 text-red-400 hover:text-red-500 hover:bg-black" onClick={(e) => deleteFromHistory(e, item.id)}>
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                ) : (
                    /* EDITOR MODE SIDEBAR */
                    <>
                        <div className="p-3 border-b border-white/5 flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={handleBackToHistory}>
                                <ChevronLeft size={16} />
                            </Button>
                            <div>
                                <h2 className="text-sm font-bold text-zinc-300 tracking-wider">CURRENT DECK</h2>
                                <p className="text-[10px] text-zinc-500">{slides.length} slides</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                            {slides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    onClick={() => setActiveSlide(slide)}
                                    className={cn(
                                        "w-full aspect-video rounded-lg border overflow-hidden relative group transition-all text-left",
                                        activeSlide?.id === slide.id
                                            ? "border-cyan-500 ring-2 ring-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                            : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    {/* Thumbnail Image */}
                                    {(slide.image_url || slide.moodImage) ? (
                                        <img src={slide.image_url || slide.moodImage} alt="thumb" className="w-full h-full object-cover opacity-60" />
                                    ) : (
                                        <div className="w-full h-full bg-[#111] flex items-center justify-center">
                                            {generatingImages[slide.id] ? (
                                                <Loader2 className="animate-spin text-cyan-500" size={16} />
                                            ) : (
                                                <ImageIcon className="text-zinc-700" size={16} />
                                            )}
                                        </div>
                                    )}

                                    {/* Overlay Number */}
                                    <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-[10px] font-bold text-white backdrop-blur-sm border border-white/10">
                                        {index + 1}
                                    </div>

                                    <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 backdrop-blur-sm truncate">
                                        <span className="text-[10px] text-zinc-300 font-medium px-1 block truncate">
                                            {slide.title || "Untitled"}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* MAIN STAGE */}
            <div className="flex-1 flex flex-col relative z-0 h-screen overflow-hidden bg-[#000]">
                {/* TOOLBAR */}
                <div className="h-16 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-6 shrink-0 z-20">
                    <div className="flex-1 flex items-center">
                        {isComplete && viewMode === 'editor' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBackToHistory}
                                className="border-red-500/20 text-red-500 hover:bg-red-500/10"
                            >
                                <Save size={16} className="mr-2" /> Save & Exit
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-1 justify-center">
                        {/* Only show simplified toolbar if in setup/history mode */}
                        {viewMode === 'history' ? (
                            <div className="flex items-center gap-3">
                                {[
                                    { n: 1, label: 'Idea' },
                                    { n: 2, label: 'Content & Voice' },
                                    { n: 3, label: 'Theme' },
                                    { n: 4, label: 'Architecture' },
                                ].map((s, i) => (
                                    <Fragment key={s.n}>
                                        <button
                                            onClick={() => s.n < currentStep && setCurrentStep(s.n)}
                                            className={cn(
                                                "flex items-center gap-1.5 transition-all group",
                                                s.n < currentStep && "cursor-pointer"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all",
                                                currentStep === s.n
                                                    ? "bg-cyan-500 border-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.6)]"
                                                    : s.n < currentStep
                                                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                                                        : "bg-white/5 border-white/10 text-zinc-600"
                                            )}>
                                                {s.n < currentStep ? <Check size={11} /> : s.n}
                                            </div>
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest transition-all hidden sm:block",
                                                currentStep === s.n ? "text-white" : s.n < currentStep ? "text-zinc-500" : "text-zinc-700"
                                            )}>{s.label}</span>
                                        </button>
                                        {i < 3 && (
                                            <div className={cn(
                                                "h-px w-6 md:w-12 transition-all duration-500",
                                                s.n < currentStep ? "bg-cyan-500/50" : "bg-white/10"
                                            )} />
                                        )}
                                    </Fragment>
                                ))}
                            </div>
                        ) : (
                            // EDITOR MODE TOOLBAR
                            <>
                                {!isComplete ? (
                                    <div className="flex items-center gap-2 w-full max-w-xl">
                                        <span className="text-sm text-zinc-500 animate-pulse">Generating deck...</span>
                                    </div>
                                ) : (
                                    <div className="flex-1" />
                                )}
                            </>
                        )}

                    </div>

                    <div className="flex items-center gap-3 flex-1 justify-end">
                        {/* Save Status Indicator */}
                        {(deckConfig.idea.trim() !== "" || slides.length > 0 || isComplete) && (
                            <div className="flex items-center gap-2 mr-4 text-[10px] font-mono tracking-widest uppercase whitespace-nowrap">
                                {isSaving ? (
                                    <span className="flex items-center gap-2 text-cyan-500 animate-pulse font-bold">
                                        <Loader2 size={12} className="animate-spin" /> {savingProgress || "Saving..."}
                                    </span>
                                ) : hasUnsavedChanges ? (
                                    <button
                                        onClick={() => saveToDatabase(slides)}
                                        className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold transition-all group"
                                    >
                                        <Save size={12} className="group-hover:translate-y-[-1px] transition-transform" /> Save Progress
                                    </button>
                                ) : (
                                    <span className="text-zinc-600 flex items-center gap-2">
                                        <Check size={12} className="text-zinc-700" /> Draft Saved
                                    </span>
                                )}
                            </div>
                        )}

                        <ProjectSyncButton
                            module="pitch"
                            data={slides}
                            disabled={!isComplete}
                            context={{ name: startupName, description: deckConfig.idea }}
                        />

                        {isComplete && viewMode === 'editor' && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        className="bg-white text-black hover:bg-zinc-200 h-10 px-6 font-bold gap-2"
                                        disabled={isExporting}
                                    >
                                        {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                                        {isExporting ? (exportProgress || "Exporting...") : "Export Options"}
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 bg-[#111] border-white/10 text-white p-2">
                                    <div className="px-2 py-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Select Format</div>

                                    <DropdownMenuItem
                                        onClick={() => exportDeck('pdf', 'pitch-deck-export-root', startupName, slides)}
                                        className="flex items-center gap-2 hover:bg-white/5 cursor-pointer rounded"
                                    >
                                        <FileText size={16} className="text-red-500" />
                                        <span>Export as PDF</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() => exportDeck('png-zip', 'pitch-deck-export-root', startupName, slides)}
                                        className="flex items-center gap-2 hover:bg-white/5 cursor-pointer rounded"
                                    >
                                        <FileArchive size={16} className="text-amber-500" />
                                        <span>Export as Images (ZIP)</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/5" />

                                    <DropdownMenuItem
                                        onClick={() => exportDeck('pptx-static', 'pitch-deck-export-root', startupName, slides)}
                                        className="flex items-center justify-between group hover:bg-white/5 cursor-pointer rounded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Presentation size={16} className="text-cyan-500" />
                                            <span>PPTX (Non-Editable)</span>
                                        </div>
                                        <span title="Exact design retained, but text is not editable.">
                                            <Info
                                                size={14}
                                                className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-help"
                                            />
                                        </span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                        onClick={() => exportDeck('pptx-editable', 'pitch-deck-export-root', startupName, slides)}
                                        className="flex items-center justify-between group hover:bg-white/5 cursor-pointer rounded"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Presentation size={16} className="text-green-500" />
                                            <span>PPTX (Editable)</span>
                                        </div>
                                        <span title="Native PowerPoint text boxes - fully editable in PPT.">
                                            <Info
                                                size={14}
                                                className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-help"
                                            />
                                        </span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}


                    </div>
                </div>


                {/* CONTENT AREA: SETUP or EDITOR */}
                <div className="flex-1 overflow-y-auto bg-[#050505] relative custom-scrollbar flex flex-col">
                    <AnimatePresence mode="wait">
                        {viewMode === 'history' ? (
                            <motion.div
                                key="wizard"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex-1 overflow-y-auto flex flex-col custom-scrollbar"
                            >
                                <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col pt-6 pb-32 px-4 min-h-full">
                                    <div className="my-auto w-full">

                                        {currentStep === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                                className="space-y-6 text-center"
                                            >
                                                {/* Ambient glow */}
                                                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                                                    <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl" />
                                                </div>

                                                <div className="relative space-y-5">
                                                    <h1 className="text-5xl md:text-7xl font-serif font-black text-white tracking-tight leading-none">
                                                        What are you<br />
                                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">building?</span>
                                                    </h1>
                                                    <p className="text-zinc-400 text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed whitespace-nowrap">
                                                        Describe your startup idea. Our AI will craft a world-class investor pitch from scratch.
                                                    </p>
                                                </div>

                                                <div className="relative max-w-3xl mx-auto">
                                                    {currentProject && !deckConfig.idea && (
                                                        <button
                                                            onClick={() => setDeckConfig(prev => ({ ...prev, idea: currentProject.description || currentProject.name }))}
                                                            className="absolute -top-10 left-4 z-10 text-[10px] text-cyan-400 hover:text-cyan-300 font-bold tracking-widest uppercase flex items-center gap-2 transition-colors bg-cyan-500/10 backdrop-blur-sm px-3 py-1.5 rounded-t-lg border border-b-0 border-cyan-500/20"
                                                        >
                                                            <Rocket size={12} />
                                                            Auto-fill from {currentProject.name}
                                                        </button>
                                                    )}
                                                    <textarea
                                                        value={deckConfig.idea}
                                                        onChange={(e) => setDeckConfig(prev => ({ ...prev, idea: e.target.value }))}
                                                        placeholder="e.g. A decentralised AI network for autonomous drone logistics that reduces last-mile delivery costs by 60%..."
                                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-7 text-lg md:text-xl text-white placeholder:text-zinc-700 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all min-h-[220px] font-inter resize-none leading-relaxed"
                                                        autoFocus
                                                    />
                                                    <div className="absolute bottom-4 right-5 flex items-center gap-3">
                                                        <span className={cn("text-[10px] font-mono uppercase tracking-widest transition-colors", deckConfig.idea.length > 50 ? "text-cyan-600" : "text-zinc-700")}>
                                                            {deckConfig.idea.length} chars
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center pt-4">
                                                    <Button
                                                        size="lg"
                                                        onClick={() => setCurrentStep(2)}
                                                        disabled={!deckConfig.idea.trim()}
                                                        className="h-14 px-10 text-base font-bold bg-cyan-500 hover:bg-cyan-400 text-black group rounded-full shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] transition-all disabled:opacity-30 disabled:shadow-none"
                                                    >
                                                        Next: Content & Voice
                                                        <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {currentStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                                className="space-y-8 relative"
                                            >
                                                {/* Ambient glows */}
                                                <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden>
                                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
                                                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                                                </div>

                                                <div className="text-center space-y-4">
                                                    <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tight">Narrative Design</h2>
                                                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Define the depth and personality of your pitch deck.</p>
                                                </div>

                                                <div className="space-y-8 max-w-4xl mx-auto relative">
                                                    {/* Density Section */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                                <AlignJustify size={10} className="text-cyan-500/60" /> Content Depth
                                                            </span>
                                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: 'minimal', label: 'Minimal', sub: 'Key bullet points', detail: 'Fast-paced, scannable', icon: AlignLeft },
                                                                { id: 'balanced', label: 'Balanced', sub: 'Standard VC depth', detail: 'Recommended for Series A', icon: LayoutGrid },
                                                                { id: 'extensive', label: 'Extensive', sub: 'Deep paragraphs', detail: 'Research-backed detail', icon: AlignJustify }
                                                            ].map((opt) => (
                                                                <motion.button
                                                                    key={opt.id}
                                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => setDeckConfig(prev => ({ ...prev, density: opt.id as any }))}
                                                                    className={cn(
                                                                        "p-5 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden",
                                                                        deckConfig.density === opt.id
                                                                            ? "bg-cyan-500/10 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.15),inset_0_1px_0_rgba(6,182,212,0.2)]"
                                                                            : "bg-[#0a0a0a]/80 border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03] hover:shadow-lg hover:shadow-black/20"
                                                                    )}
                                                                >
                                                                    {deckConfig.density === opt.id && (
                                                                        <>
                                                                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-cyan-500/5 rounded-2xl" />
                                                                            <motion.div
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center"
                                                                            >
                                                                                <Check size={10} className="text-black" strokeWidth={3} />
                                                                            </motion.div>
                                                                        </>
                                                                    )}
                                                                    <div className={cn(
                                                                        "w-9 h-9 rounded-xl flex items-center justify-center mb-3 relative transition-all duration-300",
                                                                        deckConfig.density === opt.id
                                                                            ? "bg-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                                                                            : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                                                                    )}>
                                                                        <opt.icon className={cn("relative transition-colors duration-300", deckConfig.density === opt.id ? "text-cyan-400" : "text-zinc-600 group-hover:text-zinc-400")} size={16} />
                                                                    </div>
                                                                    <div className={cn("font-bold text-sm relative transition-colors duration-300", deckConfig.density === opt.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-300")}>{opt.label}</div>
                                                                    <div className={cn("text-[11px] mt-1 relative transition-colors duration-300", deckConfig.density === opt.id ? "text-cyan-400/70" : "text-zinc-600")}>{opt.sub}</div>
                                                                    <div className="text-[10px] text-zinc-700 mt-0.5 relative">{opt.detail}</div>
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Tone Section */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                                                <Palette size={10} className="text-purple-500/60" /> Voice & Tone
                                                            </span>
                                                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            {[
                                                                { id: 'professional', label: 'Professional', sub: 'VC ready & authoritative', detail: 'Best for investor meetings', icon: Rocket },
                                                                { id: 'casual', label: 'Casual', sub: 'Friendly & direct', detail: 'Great for demos & pitches', icon: MousePointer2 },
                                                                { id: 'playful', label: 'Playful', sub: 'Bold & energetic', detail: 'Stand out from the crowd', icon: Palette }
                                                            ].map((opt) => (
                                                                <motion.button
                                                                    key={opt.id}
                                                                    whileHover={{ scale: 1.02, y: -2 }}
                                                                    whileTap={{ scale: 0.98 }}
                                                                    onClick={() => setDeckConfig(prev => ({ ...prev, tone: opt.id as any }))}
                                                                    className={cn(
                                                                        "p-5 rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden",
                                                                        deckConfig.tone === opt.id
                                                                            ? "bg-purple-500/10 border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.15),inset_0_1px_0_rgba(168,85,247,0.2)]"
                                                                            : "bg-[#0a0a0a]/80 border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03] hover:shadow-lg hover:shadow-black/20"
                                                                    )}
                                                                >
                                                                    {deckConfig.tone === opt.id && (
                                                                        <>
                                                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-500/5 rounded-2xl" />
                                                                            <motion.div
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"
                                                                            >
                                                                                <Check size={10} className="text-white" strokeWidth={3} />
                                                                            </motion.div>
                                                                        </>
                                                                    )}
                                                                    <div className={cn(
                                                                        "w-9 h-9 rounded-xl flex items-center justify-center mb-3 relative transition-all duration-300",
                                                                        deckConfig.tone === opt.id
                                                                            ? "bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.3)]"
                                                                            : "bg-white/[0.04] group-hover:bg-white/[0.08]"
                                                                    )}>
                                                                        <opt.icon className={cn("relative transition-colors duration-300", deckConfig.tone === opt.id ? "text-purple-400" : "text-zinc-600 group-hover:text-zinc-400")} size={16} />
                                                                    </div>
                                                                    <div className={cn("font-bold text-sm relative transition-colors duration-300", deckConfig.tone === opt.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-300")}>{opt.label}</div>
                                                                    <div className={cn("text-[11px] mt-1 relative transition-colors duration-300", deckConfig.tone === opt.id ? "text-purple-400/70" : "text-zinc-600")}>{opt.sub}</div>
                                                                    <div className="text-[10px] text-zinc-700 mt-0.5 relative">{opt.detail}</div>
                                                                </motion.button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-center gap-3 pt-4 pb-24 relative">
                                                    <Button variant="ghost" size="lg" className="h-12 px-7 rounded-full text-zinc-600 hover:text-white hover:bg-white/5 transition-all" onClick={() => setCurrentStep(1)}>
                                                        ← Back
                                                    </Button>
                                                    <Button
                                                        size="lg"
                                                        onClick={() => setCurrentStep(3)}
                                                        className="h-12 px-10 text-base font-bold bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black group rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all"
                                                    >
                                                        Next: Visual Theme <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {currentStep === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                                className="space-y-8 relative"
                                            >
                                                {/* Ambient glows */}
                                                <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden>
                                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
                                                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                                                </div>

                                                <div className="text-center space-y-4">
                                                    <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tight">Brand Identity</h2>
                                                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Choose the aesthetic that best matches your brand DNA.</p>
                                                </div>

                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-5xl mx-auto relative">
                                                    {[
                                                        { id: 'dark_neon', label: 'Dark Neon', sub: 'Cyber premium', colors: ['#0a0a0a', '#0e7490', '#06b6d4', '#7c3aed', '#8b5cf6'] },
                                                        { id: 'minimal', label: 'Minimalist', sub: 'Clean & focused', colors: ['#fafafa', '#e4e4e7', '#a1a1aa', '#52525b', '#18181b'] },
                                                        { id: 'corporate', label: 'Fortune 500', sub: 'Enterprise grade', colors: ['#051c2c', '#0c3547', '#1e40af', '#60a5fa', '#f8fafc'] },
                                                        { id: 'editorial', label: 'Editorial', sub: 'Bold & editorial', colors: ['#0a0a0a', '#1a1a1a', '#fbbf24', '#f59e0b', '#f8fafc'] },
                                                        { id: 'cyber', label: 'Cyberpunk', sub: 'Vivid & futuristic', colors: ['#0f0f0f', '#831843', '#f472b6', '#059669', '#34d399'] },
                                                        { id: 'nature', label: 'Eco-System', sub: 'Earthy & fresh', colors: ['#064e3b', '#065f46', '#10b981', '#6ee7b7', '#ecfdf5'] },
                                                        { id: 'lux', label: 'Luxury', sub: 'Executive gold', colors: ['#0f0f0f', '#1a1a1a', '#92711f', '#d4af37', '#f5f5f5'] },
                                                        { id: 'startup', label: 'Hyper-Growth', sub: 'Bold & disruptive', colors: ['#1e3a5f', '#3b82f6', '#f8fafc', '#dc2626', '#ef4444'] }
                                                    ].map((theme, themeIdx) => (
                                                        <motion.button
                                                            key={theme.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.4, delay: themeIdx * 0.05 }}
                                                            whileHover={{ scale: 1.04, y: -4 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => setDeckConfig(prev => ({ ...prev, theme: theme.id }))}
                                                            className={cn(
                                                                "rounded-2xl border text-left transition-all duration-300 group relative overflow-hidden",
                                                                deckConfig.theme === theme.id
                                                                    ? "border-cyan-500/70 shadow-[0_0_35px_rgba(6,182,212,0.2),0_0_15px_rgba(6,182,212,0.1)]"
                                                                    : "bg-[#0a0a0a]/80 border-white/[0.06] hover:border-white/20 hover:shadow-xl hover:shadow-black/30"
                                                            )}
                                                        >
                                                            {/* Gradient background for selected */}
                                                            {deckConfig.theme === theme.id && (
                                                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-cyan-500/5 to-transparent rounded-2xl" />
                                                            )}

                                                            {/* Color Bars Preview - inspired by reference images */}
                                                            <div className="relative p-3 pb-0">
                                                                <div
                                                                    className="w-full h-28 rounded-xl overflow-hidden flex gap-1 p-1.5"
                                                                    style={{
                                                                        background: `linear-gradient(135deg, ${theme.colors[0]}40, ${theme.colors[2]}30, ${theme.colors[4]}20)`
                                                                    }}
                                                                >
                                                                    {theme.colors.map((color, i) => (
                                                                        <motion.div
                                                                            key={i}
                                                                            initial={{ height: '60%' }}
                                                                            animate={{ height: `${60 + (i % 2 === 0 ? 25 : 15)}%` }}
                                                                            transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                                                            className="flex-1 rounded-lg transition-all duration-300 group-hover:rounded-xl"
                                                                            style={{
                                                                                background: `linear-gradient(180deg, ${color}, ${color}cc)`,
                                                                                alignSelf: i % 2 === 0 ? 'flex-start' : 'flex-end',
                                                                                boxShadow: `0 4px 12px ${color}40`,
                                                                            }}
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Color dots row */}
                                                            <div className="flex items-center gap-1 px-4 pt-3">
                                                                {theme.colors.map((c, i) => (
                                                                    <div
                                                                        key={i}
                                                                        className="w-3 h-3 rounded-full border border-white/10 transition-transform duration-300 group-hover:scale-110"
                                                                        style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}50` }}
                                                                    />
                                                                ))}
                                                            </div>

                                                            {/* Label */}
                                                            <div className="px-4 pt-2 pb-4">
                                                                <div className={cn(
                                                                    "font-bold text-sm transition-colors duration-300",
                                                                    deckConfig.theme === theme.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                                                )}>{theme.label}</div>
                                                                <div className={cn(
                                                                    "text-[10px] mt-0.5 transition-colors duration-300",
                                                                    deckConfig.theme === theme.id ? "text-cyan-400/70" : "text-zinc-600"
                                                                )}>{theme.sub}</div>
                                                            </div>

                                                            {/* Checkmark badge */}
                                                            {deckConfig.theme === theme.id && (
                                                                <motion.div
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    className="absolute top-4 right-4 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.5)]"
                                                                >
                                                                    <Check size={12} className="text-black" strokeWidth={3} />
                                                                </motion.div>
                                                            )}
                                                        </motion.button>
                                                    ))}
                                                </div>

                                                <div className="flex justify-center gap-3 pt-4 pb-24 relative">
                                                    <Button variant="ghost" size="lg" className="h-12 px-7 rounded-full text-zinc-600 hover:text-white hover:bg-white/5 transition-all" onClick={() => setCurrentStep(2)}>
                                                        ← Back
                                                    </Button>
                                                    <Button
                                                        size="lg"
                                                        onClick={() => setCurrentStep(4)}
                                                        className="h-12 px-10 text-base font-bold bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-black group rounded-full shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all"
                                                    >
                                                        Next: Pick Slides <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}

                                        {currentStep === 4 && (
                                            <motion.div
                                                key="step4"
                                                initial={{ opacity: 0, x: 30 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.35, ease: 'easeOut' }}
                                                className="space-y-8 relative"
                                            >
                                                {/* Ambient glows */}
                                                <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden>
                                                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] animate-pulse" />
                                                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
                                                </div>

                                                <div className="text-center space-y-4">
                                                    <h2 className="text-4xl md:text-6xl font-serif font-black text-white tracking-tight">Slide Architecture</h2>
                                                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto">Select the structural components of your investor narrative.</p>
                                                </div>

                                                <div className="space-y-5 max-w-6xl mx-auto px-4">
                                                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                                        <div className="flex items-center gap-2.5">
                                                            <motion.div
                                                                key={deckConfig.selectedSlides.length}
                                                                initial={{ scale: 1.4, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                                                                className="flex items-center justify-center w-7 h-7 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black text-xs tabular-nums"
                                                            >
                                                                {deckConfig.selectedSlides.length}
                                                            </motion.div>
                                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                                                Slides Selected
                                                            </span>
                                                        </div>

                                                        <motion.button
                                                            whileHover={{ scale: 1.03 }}
                                                            whileTap={{ scale: 0.97 }}
                                                            disabled={isAnalyzingSlides}
                                                            onClick={async () => {
                                                                setIsAnalyzingSlides(true);
                                                                try {
                                                                    const suggested = await suggestPitchDeckSlides(deckConfig.idea, availableTopics);
                                                                    if (suggested && Array.isArray(suggested)) {
                                                                        setDeckConfig(prev => ({ ...prev, selectedSlides: suggested }));
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                } finally {
                                                                    setIsAnalyzingSlides(false);
                                                                }
                                                            }}
                                                            className="px-4 py-1.5 rounded-full border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:border-cyan-500/50 hover:bg-cyan-500/5 disabled:opacity-50 flex items-center gap-2"
                                                        >
                                                            {isAnalyzingSlides ? (
                                                                <>
                                                                    <Loader2 size={11} className="animate-spin" />
                                                                    <span>Analyzing...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Sparkles size={11} />
                                                                    <span>Auto-Select</span>
                                                                </>
                                                            )}
                                                        </motion.button>
                                                    </div>

                                                    <motion.div
                                                        variants={{
                                                            hidden: { opacity: 0 },
                                                            show: {
                                                                opacity: 1,
                                                                transition: {
                                                                    staggerChildren: 0.04,
                                                                    delayChildren: 0.05
                                                                }
                                                            }
                                                        }}
                                                        initial="hidden"
                                                        animate="show"
                                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
                                                    >
                                                        {availableTopics.map((topic) => {
                                                            const isSelected = deckConfig.selectedSlides.includes(topic);
                                                            const selectionIndex = deckConfig.selectedSlides.indexOf(topic);
                                                            return (
                                                                <motion.button
                                                                    key={topic}
                                                                    variants={{
                                                                        hidden: { opacity: 0, y: 12, x: -4, filter: 'blur(4px)' },
                                                                        show: { opacity: 1, y: 0, x: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } }
                                                                    }}
                                                                    whileHover={{ scale: 1.015, y: -1 }}
                                                                    whileTap={{ scale: 0.985 }}
                                                                    onClick={() => toggleSlideSelection(topic)}
                                                                    className={cn(
                                                                        "relative group flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all duration-300 text-left overflow-hidden",
                                                                        isSelected
                                                                            ? "bg-cyan-500/[0.06] border-cyan-500/30"
                                                                            : "bg-white/[0.015] border-white/[0.04] hover:border-white/10 hover:bg-white/[0.03]"
                                                                    )}
                                                                >
                                                                    {/* Animated left accent bar */}
                                                                    <motion.div
                                                                        initial={false}
                                                                        animate={{
                                                                            scaleY: isSelected ? 1 : 0,
                                                                            opacity: isSelected ? 1 : 0
                                                                        }}
                                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                                        className="absolute left-0 top-[15%] bottom-[15%] w-[2.5px] rounded-r-full bg-gradient-to-b from-cyan-400 via-cyan-500 to-blue-500"
                                                                        style={{ transformOrigin: 'top' }}
                                                                    />

                                                                    {/* Number badge / Plus icon */}
                                                                    <div className={cn(
                                                                        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 text-xs font-black",
                                                                        isSelected
                                                                            ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/25"
                                                                            : "bg-white/[0.03] text-zinc-600 border border-white/[0.06] group-hover:text-zinc-400 group-hover:border-white/10"
                                                                    )}>
                                                                        <AnimatePresence mode="wait">
                                                                            {isSelected ? (
                                                                                <motion.span
                                                                                    key="num"
                                                                                    initial={{ scale: 0, rotate: -90 }}
                                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                                    exit={{ scale: 0, rotate: 90 }}
                                                                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                                                    className="tabular-nums"
                                                                                >
                                                                                    {selectionIndex + 1}
                                                                                </motion.span>
                                                                            ) : (
                                                                                <motion.span
                                                                                    key="plus"
                                                                                    initial={{ scale: 0, rotate: 90 }}
                                                                                    animate={{ scale: 1, rotate: 0 }}
                                                                                    exit={{ scale: 0, rotate: -90 }}
                                                                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                                                                >
                                                                                    <Plus size={13} />
                                                                                </motion.span>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>

                                                                    {/* Topic text */}
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <span className={cn(
                                                                            "font-semibold text-[13px] leading-tight tracking-tight transition-colors duration-300 truncate",
                                                                            isSelected ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                                                                        )}>
                                                                            {topic.split('(')[0].trim()}
                                                                        </span>
                                                                        {topic.includes('(') && (
                                                                            <span className={cn(
                                                                                "text-[9px] font-semibold uppercase tracking-widest truncate mt-0.5 transition-colors duration-300",
                                                                                isSelected ? "text-cyan-500/60" : "text-zinc-700"
                                                                            )}>
                                                                                {topic.match(/\(([^)]+)\)/)?.[1] || ''}
                                                                            </span>
                                                                        )}
                                                                    </div>

                                                                    {/* Check indicator */}
                                                                    <AnimatePresence>
                                                                        {isSelected && (
                                                                            <motion.div
                                                                                initial={{ scale: 0, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                                exit={{ scale: 0, opacity: 0 }}
                                                                                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                                                                                className="w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                                                                            >
                                                                                <Check size={11} className="text-black stroke-[3]" />
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </motion.button>
                                                            );
                                                        })}

                                                        {/* Slim Custom Topic Card */}
                                                        <motion.div
                                                            variants={{
                                                                hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
                                                                show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 300, damping: 24 } }
                                                            }}
                                                            className="relative px-3.5 py-3 rounded-xl border border-dashed border-white/[0.06] bg-white/[0.01] hover:border-cyan-500/20 transition-all group flex items-center gap-2.5"
                                                        >
                                                            <div className="w-7 h-7 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0 group-hover:border-cyan-500/20 group-hover:text-cyan-500 transition-colors">
                                                                <Plus className="text-zinc-700 group-hover:text-cyan-500 transition-colors" size={13} />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={customTopic}
                                                                onChange={(e) => setCustomTopic(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTopic()}
                                                                placeholder="Custom slide topic..."
                                                                className="flex-1 bg-transparent border-none text-[13px] text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:ring-0"
                                                            />
                                                            <AnimatePresence>
                                                                {customTopic.trim() && (
                                                                    <motion.button
                                                                        initial={{ scale: 0, opacity: 0 }}
                                                                        animate={{ scale: 1, opacity: 1 }}
                                                                        exit={{ scale: 0, opacity: 0 }}
                                                                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                                                        onClick={handleAddCustomTopic}
                                                                        className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-black uppercase tracking-widest hover:bg-cyan-500/20 transition-all"
                                                                    >
                                                                        Add
                                                                    </motion.button>
                                                                )}
                                                            </AnimatePresence>
                                                        </motion.div>
                                                    </motion.div>
                                                </div>

                                                <div className="flex justify-center gap-4 pt-10 pb-24">
                                                    <Button
                                                        variant="ghost"
                                                        size="lg"
                                                        className="h-14 px-10 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 text-base font-medium transition-all"
                                                        onClick={() => setCurrentStep(3)}
                                                    >
                                                        ← Go back
                                                    </Button>
                                                    <Button
                                                        size="lg"
                                                        onClick={handleGenerateDeck}
                                                        disabled={deckConfig.selectedSlides.length === 0 || isGenerating}
                                                        className={cn(
                                                            "h-14 px-12 text-lg font-black group rounded-full transition-all duration-500",
                                                            isGenerating
                                                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                                                : "bg-white text-black hover:bg-cyan-500 hover:text-black shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(6,182,212,0.4)]"
                                                        )}
                                                    >
                                                        {isGenerating ? (
                                                            <><Loader2 className="animate-spin mr-3" size={20} /> Building Deck...</>
                                                        ) : (
                                                            <><Rocket className="mr-3 group-hover:animate-bounce" size={20} /> Build Pitch Deck</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}

                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex-1 relative flex flex-col overflow-hidden h-full"
                            >
                                {/* Active Slide View */}
                                <div ref={slideEditorRef} className="flex-1 bg-black p-4 md:p-12 flex flex-col items-center justify-center relative overflow-hidden">
                                    {/* Floating Text Selection Toolbar */}
                                    <FloatingTextToolbar containerRef={slideEditorRef} />

                                    {isGenerating && !activeSlide && (
                                        <div className="flex flex-col items-center justify-center h-full w-full">
                                            <CubeLoader
                                                title={task?.loadingStep || "ARCHITECTING"}
                                                description={`Generating your pitch deck slides, please wait...`}
                                            />
                                        </div>
                                    )}

                                    {activeSlide && (
                                        <div
                                            ref={containerRef}
                                            className="relative w-full max-w-6xl aspect-video bg-black border border-white/10 shadow-2xl rounded-xl overflow-hidden group shrink-0"
                                        >
                                            <div
                                                style={{
                                                    transform: `scale(${scale})`,
                                                    transformOrigin: 'top left',
                                                    width: '1920px',
                                                    height: '1080px'
                                                }}
                                            >
                                                <PitchDeckSlide
                                                    slide={activeSlide}
                                                    isActive={true}
                                                    isEditing={true}
                                                    onUpdate={updateSlide}
                                                    onRegenerateImage={() => generateImageForSlide(activeSlide, true)}
                                                    isRefreshingImage={generatingImages[activeSlide.id]}
                                                />
                                            </div>


                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* HIDDEN EXPORT CONTAINER */}
                <div id="pitch-deck-export-root" style={{ position: 'absolute', top: '-10000px', left: '-10000px', overflow: 'hidden' }}>
                    {slides.map(slide => (
                        <div key={slide.id} className="pdf-slide-container relative" style={{ width: 1920, height: 1080 }}>
                            <PitchDeckSlide slide={slide} exportMode={true} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

