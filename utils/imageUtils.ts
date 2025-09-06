import { Sprite } from './types';

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

export const combineSprites = (grid: (Sprite | null)[][], spriteSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
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

        let loadedImages = 0;
        const totalImages = grid.flat().filter(Boolean).length;
        
        if (totalImages === 0) {
            return resolve(canvas.toDataURL('image/png'));
        }

        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        if (!tempCtx) {
            return reject(new Error('Could not create temporary canvas context for processing.'));
        }

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sprite = grid[r][c];
                if (sprite) {
                    const img = new Image();
                    img.onload = () => {
                        // Draw image to a temporary canvas for analysis
                        tempCanvas.width = img.width;
                        tempCanvas.height = img.height;
                        tempCtx.drawImage(img, 0, 0);

                        // 1. Find the bounding box of non-magenta pixels
                        const sourceImageData = tempCtx.getImageData(0, 0, img.width, img.height);
                        const sourceData = sourceImageData.data;
                        let minX = img.width, minY = img.height, maxX = -1, maxY = -1;

                        for (let y = 0; y < img.height; y++) {
                            for (let x = 0; x < img.width; x++) {
                                const i = (y * img.width + x) * 4;
                                // Check if pixel is NOT magenta-like
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
                        
                        if (downscaledCtx && maxX !== -1) { // Check if the image is not empty
                            // 2. Define a square crop region centered on the character
                            const bboxWidth = maxX - minX + 1;
                            const bboxHeight = maxY - minY + 1;
                            const sourceSquareSize = Math.max(bboxWidth, bboxHeight);
                            const sourceSquareX = minX - (sourceSquareSize - bboxWidth) / 2;
                            const sourceSquareY = minY - (sourceSquareSize - bboxHeight) / 2;
                            
                            // 3. Perform pixel-perfect downscaling from the cropped region
                            const downscaledImageData = downscaledCtx.createImageData(spriteSize, spriteSize);
                            const downscaledData = downscaledImageData.data;
                            const pixelBlockSize = sourceSquareSize / spriteSize;
                            const offset = pixelBlockSize / 2;

                            for (let y = 0; y < spriteSize; y++) {
                                for (let x = 0; x < spriteSize; x++) {
                                    // Find the center of the source pixel block in the cropped area
                                    const sx = Math.floor(sourceSquareX + x * pixelBlockSize + offset);
                                    const sy = Math.floor(sourceSquareY + y * pixelBlockSize + offset);
                                    
                                    // Clamp coordinates to be within the source image bounds
                                    const clampedSx = Math.max(0, Math.min(img.width - 1, sx));
                                    const clampedSy = Math.max(0, Math.min(img.height - 1, sy));

                                    const sourcePixelIndex = (clampedSy * img.width + clampedSx) * 4;
                                    const targetPixelIndex = (y * spriteSize + x) * 4;
                                    
                                    const rVal = sourceData[sourcePixelIndex];
                                    const gVal = sourceData[sourcePixelIndex + 1];
                                    const bVal = sourceData[sourcePixelIndex + 2];

                                    // If the sampled pixel is magenta-like, make it transparent
                                    if (isMagentaLike(rVal, gVal, bVal)) {
                                        downscaledData[targetPixelIndex] = 0;
                                        downscaledData[targetPixelIndex + 1] = 0;
                                        downscaledData[targetPixelIndex + 2] = 0;
                                        downscaledData[targetPixelIndex + 3] = 0; // transparent
                                    } else {
                                        downscaledData[targetPixelIndex]     = rVal;
                                        downscaledData[targetPixelIndex + 1] = gVal;
                                        downscaledData[targetPixelIndex + 2] = bVal;
                                        downscaledData[targetPixelIndex + 3] = sourceData[sourcePixelIndex + 3];
                                    }
                                }
                            }
                            downscaledCtx.putImageData(downscaledImageData, 0, 0);
                        }
                        // If image was empty, the downscaledCanvas remains transparent, which is correct.

                        // 4. Draw the final cropped & downscaled sprite to the main spritesheet
                        ctx.drawImage(downscaledCanvas, c * spriteSize, r * spriteSize);

                        loadedImages++;
                        if (loadedImages === totalImages) {
                            resolve(canvas.toDataURL('image/png'));
                        }
                    };
                    img.onerror = () => {
                        loadedImages++;
                         if (loadedImages === totalImages) {
                            resolve(canvas.toDataURL('image/png'));
                        }
                    };
                    img.src = sprite.imageUrl;
                }
            }
        }
    });
};