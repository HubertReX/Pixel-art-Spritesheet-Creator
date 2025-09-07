
import { Sprite } from './types';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

// Helper function to convert RGB to HSL color space.
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, l];
};


// A more robust check for magenta-like colors using HSL color space.
const isMagentaLike = (r: number, g: number, b: number): boolean => {
    const [h, s, l] = rgbToHsl(r, g, b);
    
    // Check if hue is in the magenta/purple/pink range (magenta is ~300 degrees).
    const isMagentaHue = (h >= 285 && h <= 340);
    
    // Ensure it's a saturated color (not gray/white/black).
    const isSaturated = s > 0.4;
    
    // Ensure it's not too dark or too light.
    const isMidLightness = l > 0.2 && l < 0.95;

    return isMagentaHue && isSaturated && isMidLightness;
};


export const removeMagentaBackground = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (isMagentaLike(data[i], data[i + 1], data[i + 2])) {
                    data[i + 3] = 0; // Set alpha to 0 (transparent)
                }
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = base64Image;
    });
};

export const flipImageHorizontally = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context'));

            // Flip the canvas context horizontally
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            
            // Draw the image onto the flipped context
            ctx.drawImage(img, 0, 0);
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(err);
        img.src = base64Image;
    });
};

/**
 * Processes a single sprite image: finds the character, crops it,
 * downscales it to the target sprite size with transparency, and returns the ImageData.
 */
export const processSpriteFrame = (sprite: Sprite, spriteSize: number): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            if (!tempCtx) return reject(new Error('Could not create temporary canvas context.'));
            
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            tempCtx.drawImage(img, 0, 0);

            const sourceImageData = tempCtx.getImageData(0, 0, img.width, img.height);
            const sourceData = sourceImageData.data;
            let minX = img.width, minY = img.height, maxX = -1, maxY = -1;

            for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                    const i = (y * img.width + x) * 4;
                    if (!isMagentaLike(sourceData[i], sourceData[i + 1], sourceData[i + 2])) {
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            const downscaledCanvas = document.createElement('canvas');
            downscaledCanvas.width = spriteSize;
            downscaledCanvas.height = spriteSize;
            const downscaledCtx = downscaledCanvas.getContext('2d');
            
            if (downscaledCtx && maxX !== -1) {
                const bboxWidth = maxX - minX + 1;
                const bboxHeight = maxY - minY + 1;
                const sourceSquareSize = Math.max(bboxWidth, bboxHeight);
                const sourceSquareX = minX - (sourceSquareSize - bboxWidth) / 2;
                const sourceSquareY = minY - (sourceSquareSize - bboxHeight) / 2;
                
                const downscaledImageData = downscaledCtx.createImageData(spriteSize, spriteSize);
                const downscaledData = downscaledImageData.data;
                const pixelBlockSize = sourceSquareSize / spriteSize;
                const offset = pixelBlockSize / 2;

                for (let y = 0; y < spriteSize; y++) {
                    for (let x = 0; x < spriteSize; x++) {
                        const sx = Math.floor(sourceSquareX + x * pixelBlockSize + offset);
                        const sy = Math.floor(sourceSquareY + y * pixelBlockSize + offset);
                        
                        const clampedSx = Math.max(0, Math.min(img.width - 1, sx));
                        const clampedSy = Math.max(0, Math.min(img.height - 1, sy));
                        const sourcePixelIndex = (clampedSy * img.width + clampedSx) * 4;
                        const targetPixelIndex = (y * spriteSize + x) * 4;
                        
                        const rVal = sourceData[sourcePixelIndex];
                        const gVal = sourceData[sourcePixelIndex + 1];
                        const bVal = sourceData[sourcePixelIndex + 2];

                        if (isMagentaLike(rVal, gVal, bVal)) {
                            downscaledData[targetPixelIndex + 3] = 0;
                        } else {
                            downscaledData[targetPixelIndex]     = rVal;
                            downscaledData[targetPixelIndex + 1] = gVal;
                            downscaledData[targetPixelIndex + 2] = bVal;
                            downscaledData[targetPixelIndex + 3] = 255;
                        }
                    }
                }
                downscaledCtx.putImageData(downscaledImageData, 0, 0);
            }
            
            resolve(downscaledCtx.getImageData(0, 0, spriteSize, spriteSize));
        };
        img.onerror = (err) => reject(err);
        img.src = sprite.imageUrl;
    });
};


export const combineSprites = (grid: (Sprite | null)[][], spriteSize: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const rows = grid.length;
        if (rows === 0) return resolve('');
        const cols = grid[0]?.length || 0;
        if (cols === 0) return resolve('');

        const canvas = document.createElement('canvas');
        canvas.width = cols * spriteSize;
        canvas.height = rows * spriteSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.imageSmoothingEnabled = false;

        const allSprites = grid.flat();
        if (allSprites.every(s => !s)) {
            return resolve(canvas.toDataURL('image/png'));
        }

        const promises: Promise<{r: number, c: number, data: ImageData}>[] = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sprite = grid[r][c];
                if (sprite) {
                    promises.push(
                        processSpriteFrame(sprite, spriteSize).then(data => ({ r, c, data }))
                    );
                }
            }
        }
        
        try {
            const processedFrames = await Promise.all(promises);
            processedFrames.forEach(({ r, c, data }) => {
                ctx.putImageData(data, c * spriteSize, r * spriteSize);
            });
            resolve(canvas.toDataURL('image/png'));
        } catch(err) {
            reject(err);
        }
    });
};

/**
 * Generates a GIF from an array of sprites.
 */
export const generateGif = async (sprites: Sprite[], spriteSize: number, fps: number): Promise<string> => {
    if (sprites.length === 0) {
        throw new Error("No sprites provided for GIF generation.");
    }
    
    const gif = GIFEncoder();
    const delay = 1000 / fps;

    const framesData = await Promise.all(
        sprites.map(sprite => processSpriteFrame(sprite, spriteSize))
    );

    // Create a palette from the first frame. Use 'rgba4444' for transparency support.
    // The first color in the palette will be transparent.
    const palette = quantize(framesData[0].data, 256, { format: 'rgba4444' });

    for (const imageData of framesData) {
        // Apply the shared palette to the frame
        const index = applyPalette(imageData.data, palette, 'rgba4444');
        gif.writeFrame(index, imageData.width, imageData.height, { palette, delay, transparent: true, dispose: 2 });
    }

    gif.finish();
    const buffer = gif.bytesView();
    const blob = new Blob([buffer], { type: 'image/gif' });
    return URL.createObjectURL(blob);
};