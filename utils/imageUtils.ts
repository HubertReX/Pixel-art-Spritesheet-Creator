
import { Sprite } from './types';

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
};

export const combineSprites = (grid: (Sprite | null)[][], spriteSize: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const rows = grid.length;
        if (rows === 0) return resolve('');
        const cols = grid[0].length;
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

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const sprite = grid[r][c];
                if (sprite) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, c * spriteSize, r * spriteSize, spriteSize, spriteSize);
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
