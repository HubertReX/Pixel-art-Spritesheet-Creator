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

export interface Design {
    id: string;
    name: string;
    prompt: string;
    spriteSize: number;
    frameCount: number;
    animationType: string;
    generateAnimation: boolean;
    selectedViewpoints: string[];
    baseCharacter: BaseCharacter | null;
    spriteGrid: (Sprite | null)[][];
}
