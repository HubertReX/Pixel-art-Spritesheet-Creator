export interface Sprite {
  id: string;
  imageUrl: string; // base64 data URL with magenta BG
  previewUrl: string; // base64 data URL with transparent BG
  prompt: string;
}