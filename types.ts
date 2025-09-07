

export type PreviewBackgroundType = 'transparent' | 'white' | 'black' | 'custom';

export interface Sprite {
  id: string;
  imageUrl: string; // base64 data URL with magenta BG
  previewUrl: string; // base64 data URL with transparent BG
  prompt: string;
}

export interface BaseCharacter {
    imageUrl: string;
    previewUrl: string;
    prompt: string;
}

export interface AnimationPose {
    id: string;
    name: string;
    prompt?: string; // A more detailed prompt for the AI
    viewpoints: string[];
    isAnimated?: boolean;
    frameCount?: number;
    animationType?: string;
}

export interface Log {
    timestamp: string;
    title: string;
    details: Record<string, string | undefined>;
}

export interface Design {
    id: string;
    name: string;
    prompt: string;
    spriteSize: number;
    animationPoses: AnimationPose[];
    baseCharacter: BaseCharacter | null;
    spriteGrid: (Sprite | null)[][];
    createdAt: number;
    lastModified: number;
    previewBackgroundType?: PreviewBackgroundType;
    customBackground?: string; // base64 data URL
}
