export type DesignDNA = 'Minimalist' | 'Vibrant' | 'Cyberpunk' | 'Fortune500' | 'CreativeAgency' | 'MonoDark' | 'Glassmorphism' | 'Editorial' | 'TechSaas';

export type SlideFeature = {
    title: string;
    description: string;
    icon?: string;
    image_url?: string;
};

export type SlideTheme = {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
};

export type Slide = {
    id: number;
    title: string;
    subtitle: string;
    content: string;
    features?: SlideFeature[];
    chartData?: { name: string; value: number }[];
    theme?: SlideTheme;
    design_dna?: DesignDNA;
    styleHint: string;
    moodImage?: string;
    image_url?: string;
    storage_path?: string;
    layout_type: 'hero_center' | 'split_image_left' | 'three_column_grid' | 'split_editorial' | 'feature_grid' | 'timeline_vertical' | 'circular_process' | 'image_card_grid' | 'financial_chart' | 'horizontal_timeline' | 'circular_step' | 'bento_editorial' | 'split_hero' | 'dashboard_editorial' | 'stats_grid';
    overlayOpacity?: number;
    contentPosition?: { x: number; y: number };
    textPositions?: Record<string, { x: number; y: number }>;
    imageAlignment?: 'left' | 'center' | 'right';
};
