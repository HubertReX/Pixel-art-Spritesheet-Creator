import React, { useState, useCallback } from 'react';
import { Sprite } from './types';
import { generateSprite, editSprite } from './services/geminiService';
import { fileToBase64, combineSprites, removeMagentaBackground } from './utils/imageUtils';
import Controls from './components/Controls';
import SpriteGrid from './components/SpriteGrid';
import EditorPanel from './components/EditorPanel';
import { LoadingIcon } from './components/icons';

const App: React.FC = () => {
    const [spriteSize, setSpriteSize] = useState<number>(32);
    const [frameCount, setFrameCount] = useState<number>(4);
    const [initialPrompt, setInitialPrompt] = useState<string>('');
    const [initialImage, setInitialImage] = useState<File | null>(null);
    const [spriteGrid, setSpriteGrid] = useState<(Sprite | null)[][]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [selectedSprite, setSelectedSprite] = useState<{ row: number; col: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedViewpoints, setSelectedViewpoints] = useState<string[]>(['front']);
    const [generateAnimation, setGenerateAnimation] = useState<boolean>(false);
    const [zoomLevel, setZoomLevel] = useState<number>(32);

    const allViewpoints = ['front', 'back', 'left', 'right'];

    const handleGenerate = async () => {
        if (!initialPrompt && !initialImage) {
            setError('Please provide a text description or an image.');
            return;
        }
        if (selectedViewpoints.length === 0) {
            setError('Please select at least one viewpoint to generate.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSpriteGrid([]);
        setSelectedSprite(null);

        const numRows = generateAnimation ? frameCount : 1;
        const viewpointsToGenerate = allViewpoints.filter(vp => selectedViewpoints.includes(vp));
        const numCols = viewpointsToGenerate.length;

        const newGrid: (Sprite | null)[][] = Array(numRows).fill(null).map(() => Array(numCols).fill(null));
        const contextImages: { mimeType: string; data: string }[] = [];

        if (initialImage) {
            try {
                const base64Image = await fileToBase64(initialImage);
                contextImages.push({ mimeType: initialImage.type, data: base64Image.split(',')[1] });
            } catch (err) {
                setError('Failed to read the initial image.');
                setIsLoading(false);
                return;
            }
        }

        try {
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    const viewpoint = viewpointsToGenerate[col];
                    const animationState = !generateAnimation || row === 0 ? 'standing still' : `in a walking animation (frame ${row + 1} of ${frameCount})`;

                    const prompt = `A ${spriteSize}x${spriteSize} pixel art sprite for a top-down view game. The character is ${initialPrompt}. The character is facing ${viewpoint} and is ${animationState}. Maintain a consistent character design based on the provided context images.`;

                    setLoadingMessage(`Generating... Frame ${row + 1}/${numRows}, View: ${viewpoint}`);

                    const newSpriteBase64 = await generateSprite(prompt, contextImages, spriteSize);
                    const imageUrl = `data:image/png;base64,${newSpriteBase64}`;
                    const previewUrl = await removeMagentaBackground(imageUrl);

                    const newSprite: Sprite = {
                        id: `${row}-${col}`,
                        imageUrl: imageUrl,
                        previewUrl: previewUrl,
                        prompt: prompt
                    };

                    newGrid[row][col] = newSprite;
                    setSpriteGrid([...newGrid.map(r => [...r])]);

                    contextImages.push({ mimeType: 'image/png', data: newSpriteBase64 });
                }
            }
        } catch (err) {
            console.error(err);
            setError(`An error occurred during generation: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleSpriteSelect = (row: number, col: number) => {
        if (isLoading) return;
        setSelectedSprite({ row, col });
    };

    const handleEdit = async (editPrompt: string) => {
        if (!selectedSprite || !editPrompt) return;

        const { row, col } = selectedSprite;
        const targetSprite = spriteGrid[row][col];
        if (!targetSprite) return;

        setIsLoading(true);
        setError(null);
        setLoadingMessage(`Editing sprite...`);

        // Gather context: sprites from the same row and column for better consistency
        const contextSprites = spriteGrid.flat().filter(sprite => sprite && sprite.id !== targetSprite.id).slice(0, 5) as Sprite[];

        try {
            const editedSpriteBase64 = await editSprite(editPrompt, targetSprite, contextSprites, spriteSize);
            const imageUrl = `data:image/png;base64,${editedSpriteBase64}`;
            const previewUrl = await removeMagentaBackground(imageUrl);

            const newGrid = [...spriteGrid.map(r => [...r])];
            newGrid[row][col] = {
                ...targetSprite,
                imageUrl: imageUrl,
                previewUrl: previewUrl,
            };
            setSpriteGrid(newGrid);
        } catch (err) {
            console.error(err);
            setError(`Failed to edit sprite: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
            setSelectedSprite(null);
        }
    };

    const handleExport = async () => {
        if (spriteGrid.length === 0) return;
        const dataUrl = await combineSprites(spriteGrid, spriteSize);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'spritesheet.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-[#282c34] min-h-screen text-gray-200 font-mono flex flex-col p-4 gap-4">
            <header className="text-center border-b border-gray-600 pb-2">
                <h1 className="text-2xl font-bold text-cyan-400">Pixel-art Spritesheet Creator</h1>
                <p className="text-sm text-gray-400">Create game-ready sprite sheets with Nano Banana</p>
            </header>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                    <LoadingIcon />
                    <p className="mt-4 text-lg text-white">{loadingMessage}</p>
                </div>
            )}

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 bg-[#3a3f4a] p-4 rounded-md flex flex-col gap-4 border border-gray-600 h-fit">
                    <Controls
                        spriteSize={spriteSize}
                        setSpriteSize={setSpriteSize}
                        frameCount={frameCount}
                        setFrameCount={setFrameCount}
                        initialPrompt={initialPrompt}
                        setInitialPrompt={setInitialPrompt}
                        setInitialImage={setInitialImage}
                        onGenerate={handleGenerate}
                        isGenerating={isLoading}
                        hasContent={spriteGrid.length > 0}
                        onExport={handleExport}
                        selectedViewpoints={selectedViewpoints}
                        setSelectedViewpoints={setSelectedViewpoints}
                        generateAnimation={generateAnimation}
                        setGenerateAnimation={setGenerateAnimation}
                    />
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

                    {selectedSprite && spriteGrid[selectedSprite.row]?.[selectedSprite.col] && (
                        <EditorPanel
                            sprite={spriteGrid[selectedSprite.row][selectedSprite.col]!}
                            onEdit={handleEdit}
                            onClose={() => setSelectedSprite(null)}
                            isEditing={isLoading}
                        />
                    )}
                </div>

                <main className="md:col-span-2 bg-[#3a3f4a] p-4 rounded-md border border-gray-600 flex flex-col items-center justify-start gap-4">
                    {/* Zoom Slider */}
                    <div className="w-full max-w-sm flex items-center gap-4 px-4">
                        <label htmlFor="zoom-slider" className="text-sm font-medium text-gray-300 whitespace-nowrap">Zoom</label>
                        <input
                            id="zoom-slider"
                            type="range"
                            min="1"
                            max="64"
                            step="1"
                            value={zoomLevel}
                            onChange={(e) => setZoomLevel(Number(e.target.value))}
                            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-sm font-medium text-gray-300 w-10 text-center">{zoomLevel}x</span>
                    </div>

                    {/* Sprite Grid Container */}
                    <div className="flex-grow w-full flex items-center justify-center checkerboard p-2 rounded-md overflow-auto">
                        <SpriteGrid
                            grid={spriteGrid}
                            spriteSize={spriteSize}
                            onSpriteSelect={handleSpriteSelect}
                            selectedSprite={selectedSprite}
                            zoomLevel={zoomLevel}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default App;