import React, { useState, useEffect } from 'react';
import { Sprite, Design, BaseCharacter } from './types';
import { generateBaseCharacter, generateSprite, editSprite, generateDesignName } from './services/geminiService';
import { fileToBase64, combineSprites, removeMagentaBackground } from './utils/imageUtils';
import { getAllDesigns, saveDesign, deleteDesign } from './services/db';

import Controls from './components/Controls';
import SpriteGrid from './components/SpriteGrid';
import EditorPanel from './components/EditorPanel';
import { LoadingIcon } from './components/icons';
import ConceptionControls from './components/ConceptionControls';
import CharacterPreview from './components/CharacterPreview';
import LogConsole from './components/LogConsole';
import PersistenceControls from './components/PersistenceControls';


type WorkflowStage = 'conception' | 'spritesheet';

interface Log {
    timestamp: string;
    message: string;
}

const App: React.FC = () => {
    // Design State
    const [savedDesigns, setSavedDesigns] = useState<Design[]>([]);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [designName, setDesignName] = useState<string>('');
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    
    // Character & Grid State
    const [spriteSize, setSpriteSize] = useState<number>(32);
    const [frameCount, setFrameCount] = useState<number>(4);
    const [initialPrompt, setInitialPrompt] = useState<string>('');
    const [initialImage, setInitialImage] = useState<File | null>(null);
    const [spriteGrid, setSpriteGrid] = useState<(Sprite | null)[][]>([]);
    const [selectedViewpoints, setSelectedViewpoints] = useState<string[]>(['front']);
    const [generateAnimation, setGenerateAnimation] = useState<boolean>(false);
    const [animationType, setAnimationType] = useState<string>('walk');
    const [baseCharacter, setBaseCharacter] = useState<BaseCharacter | null>(null);
    
    // UI State
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [selectedSprite, setSelectedSprite] = useState<{ row: number; col: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(32);
    const [previewZoom, setPreviewZoom] = useState<number>(4);
    const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('conception');
    const [logs, setLogs] = useState<Log[]>([]);

    const allViewpoints = ['front', 'back', 'left', 'right'];

    // Load saved designs from IndexedDB on initial render
    useEffect(() => {
        const loadDesignsFromDB = async () => {
            try {
                const designs = await getAllDesigns();
                setSavedDesigns(designs);
            } catch (e) {
                console.error("Failed to load designs from IndexedDB:", e);
                setError("Could not load saved designs from the database.");
            }
        };
        loadDesignsFromDB();
    }, []);

    const addLog = (prompt: string) => {
        const timestamp = new Date().toLocaleTimeString();
        const newLog = { timestamp, message: `Sending prompt:\n${prompt}` };
        setLogs(prevLogs => [...prevLogs, newLog]);
    };

    const resetToNewDesign = () => {
        setCurrentDesignId(null);
        setDesignName('');
        setInitialPrompt('');
        setInitialImage(null);
        setBaseCharacter(null);
        setSpriteGrid([]);
        setSpriteSize(32);
        setFrameCount(4);
        setSelectedViewpoints(['front']);
        setGenerateAnimation(false);
        setAnimationType('walk');
        setWorkflowStage('conception');
        setSelectedSprite(null);
        setError(null);
    };

    const handleNewDesign = () => {
        resetToNewDesign();
    };

    const handleSaveDesign = async () => {
        if (!currentDesignId || !designName) {
            setError("A design must be created and have a name before it can be saved.");
            return;
        }

        const designData: Design = {
            id: currentDesignId,
            name: designName,
            prompt: initialPrompt,
            spriteSize,
            frameCount,
            animationType,
            generateAnimation,
            selectedViewpoints,
            baseCharacter,
            spriteGrid,
        };

        try {
            await saveDesign(designData);
            const updatedDesigns = await getAllDesigns(); // Re-fetch to get sorted list
            setSavedDesigns(updatedDesigns);
            setError(null);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } catch (e) {
            console.error("Failed to save to IndexedDB:", e);
            setError("Could not save the design to the database. An error occurred.");
        }
    };
    
    const handleLoadDesign = (id: string) => {
        const designToLoad = savedDesigns.find(d => d.id === id);
        if (designToLoad) {
            setCurrentDesignId(designToLoad.id);
            setDesignName(designToLoad.name);
            setInitialPrompt(designToLoad.prompt);
            setSpriteSize(designToLoad.spriteSize);
            setFrameCount(designToLoad.frameCount);
            setAnimationType(designToLoad.animationType);
            setGenerateAnimation(designToLoad.generateAnimation);
            setSelectedViewpoints(designToLoad.selectedViewpoints);
            setBaseCharacter(designToLoad.baseCharacter);
            setSpriteGrid(designToLoad.spriteGrid);
            
            setWorkflowStage(designToLoad.baseCharacter ? 'spritesheet' : 'conception');
            setSelectedSprite(null);
            setError(null);
        }
    };
    
    const handleDeleteDesign = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this design? This cannot be undone.")) {
            try {
                await deleteDesign(id);
                const updatedDesigns = savedDesigns.filter(d => d.id !== id);
                setSavedDesigns(updatedDesigns);

                if (currentDesignId === id) {
                    resetToNewDesign();
                }
            } catch (e) {
                 console.error("Failed to delete design from IndexedDB:", e);
                 setError("Could not delete the design from the database.");
            }
        }
    };

    const handleExportDesign = (id: string) => {
        setError(null);
        const designToExport = savedDesigns.find(d => d.id === id);
        if (!designToExport) {
            setError("Could not find the design to export.");
            return;
        }

        try {
            const designJson = JSON.stringify(designToExport, null, 2);
            const blob = new Blob([designJson], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const safeFilename = designToExport.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            link.download = `pixel-art-spritesheet-creator-${safeFilename || 'design'}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (err) {
            console.error(err);
            setError(`Failed to export design: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleImportDesign = async (file: File) => {
        setError(null);
        if (!file.name.endsWith('.json')) {
            setError("Invalid file type. Please upload a .json file.");
            return;
        }
        
        try {
            const jsonString = await file.text();
            const importedObject = JSON.parse(jsonString);

            // Basic validation
            if (!importedObject || typeof importedObject.name !== 'string' || !Array.isArray(importedObject.spriteGrid)) {
                throw new Error("The imported file has an invalid format.");
            }
            
            // Assign a new unique ID to prevent conflicts
            const newDesign: Design = { ...importedObject, id: Date.now().toString() };

            await saveDesign(newDesign);
            const updatedDesigns = await getAllDesigns();
            setSavedDesigns(updatedDesigns);
            
            // Automatically load the newly imported design
            handleLoadDesign(newDesign.id);

        } catch (err) {
            console.error(err);
            setError(`Failed to import design: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };


    const handleGenerateBaseCharacter = async () => {
        if (!initialPrompt && !initialImage) {
            setError('Please provide a text description or an image.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Generating base character...');

        let contextImage: { mimeType: string; data: string } | null = null;
        if (initialImage) {
            try {
                const base64Image = await fileToBase64(initialImage);
                contextImage = { mimeType: initialImage.type, data: base64Image.split(',')[1] };
            } catch (err) {
                setError('Failed to read the initial image.');
                setIsLoading(false);
                return;
            }
        }
        
        try {
            const newSpriteBase64 = await generateBaseCharacter(initialPrompt, contextImage, spriteSize, addLog);
            const imageUrl = `data:image/png;base64,${newSpriteBase64}`;
            const previewUrl = await removeMagentaBackground(imageUrl);
            const newBaseChar = { imageUrl, previewUrl, prompt: initialPrompt };
            setBaseCharacter(newBaseChar);

            // If it's a new design, generate a name and set up the design ID
            if (!currentDesignId) {
                setLoadingMessage('Generating design name...');
                const name = await generateDesignName(initialPrompt);
                setDesignName(name);
                setCurrentDesignId(Date.now().toString());
            }

        } catch (err) {
            console.error(err);
            setError(`An error occurred during generation: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleProceedToSpritesheet = () => {
        if (baseCharacter) {
            setWorkflowStage('spritesheet');
            setError(null);
            setSpriteGrid([]);
            setSelectedSprite(null);
        }
    };

    const handleBackToConception = () => {
        setWorkflowStage('conception');
    };

    const handleGenerateSpritesheet = async () => {
        if (!baseCharacter) {
            setError('No base character found.');
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
        const contextImages: { mimeType: string; data: string }[] = [{ mimeType: 'image/png', data: baseCharacter.imageUrl.split(',')[1] }];

        try {
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < numCols; col++) {
                    const viewpoint = viewpointsToGenerate[col];
                    const animationState = !generateAnimation || row === 0 ? 'standing still' : `in a ${animationType} animation (frame ${row + 1} of ${frameCount})`;
                    
                    const prompt = `A ${spriteSize}x${spriteSize} pixel art sprite. The character is ${baseCharacter.prompt}. The character is facing ${viewpoint} and is ${animationState}. Maintain a consistent character design based on the provided context images.`;
                    
                    setLoadingMessage(`Generating... Frame ${row + 1}/${numRows}, View: ${viewpoint}`);
                    
                    const newSpriteBase64 = await generateSprite(prompt, contextImages, spriteSize, addLog);
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

        const contextSprites = spriteGrid.flat().filter(sprite => sprite && sprite.id !== targetSprite.id).slice(0, 5) as Sprite[];
        
        try {
            const editedSpriteBase64 = await editSprite(editPrompt, targetSprite, contextSprites, spriteSize, addLog);
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
        <div className="bg-[#282c34] min-h-screen text-gray-200 font-mono flex flex-col p-4 gap-4 pb-12">
            <header className="text-center border-b border-gray-600 pb-2">
                <h1 className="text-2xl font-bold text-cyan-400">Pixel-art Spritesheet Creator</h1>
                <p className="text-sm text-gray-400">Create game-ready sprite sheets with AI</p>
            </header>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                    <LoadingIcon />
                    <p className="mt-4 text-lg text-white">{loadingMessage}</p>
                </div>
            )}

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 flex flex-col gap-4 h-fit">
                     <PersistenceControls
                        designs={savedDesigns}
                        currentDesignId={currentDesignId}
                        designName={designName}
                        setDesignName={setDesignName}
                        onSave={handleSaveDesign}
                        onLoad={handleLoadDesign}
                        onDelete={handleDeleteDesign}
                        onNew={handleNewDesign}
                        onExport={handleExportDesign}
                        onImport={handleImportDesign}
                        saveSuccess={saveSuccess}
                    />

                    <div className="bg-[#3a3f4a] p-4 rounded-md border border-gray-600">
                        {workflowStage === 'conception' ? (
                            <ConceptionControls
                                prompt={initialPrompt}
                                setPrompt={setInitialPrompt}
                                setInitialImage={setInitialImage}
                                onGenerate={handleGenerateBaseCharacter}
                                isGenerating={isLoading}
                                hasBaseCharacter={!!baseCharacter}
                                onProceed={handleProceedToSpritesheet}
                                spriteSize={spriteSize}
                                setSpriteSize={setSpriteSize}
                            />
                        ) : (
                            <>
                                <Controls
                                    spriteSize={spriteSize}
                                    setSpriteSize={setSpriteSize}
                                    frameCount={frameCount}
                                    setFrameCount={setFrameCount}
                                    onGenerate={handleGenerateSpritesheet}
                                    isGenerating={isLoading}
                                    hasContent={spriteGrid.length > 0}
                                    onExport={handleExport}
                                    selectedViewpoints={selectedViewpoints}
                                    setSelectedViewpoints={setSelectedViewpoints}
                                    generateAnimation={generateAnimation}
                                    setGenerateAnimation={setGenerateAnimation}
                                    animationType={animationType}
                                    setAnimationType={setAnimationType}
                                    onBack={handleBackToConception}
                                    baseCharacterPreview={baseCharacter?.previewUrl || ''}
                                    previewZoom={previewZoom}
                                    setPreviewZoom={setPreviewZoom}
                                />
                                {selectedSprite && spriteGrid[selectedSprite.row]?.[selectedSprite.col] && (
                                    <EditorPanel
                                        sprite={spriteGrid[selectedSprite.row][selectedSprite.col]!}
                                        onEdit={handleEdit}
                                        onClose={() => setSelectedSprite(null)}
                                        isEditing={isLoading}
                                    />
                                )}
                            </>
                        )}
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>
                </div>


                <main className="md:col-span-2 bg-[#3a3f4a] p-4 rounded-md border border-gray-600 flex flex-col items-center justify-start gap-4">
                   {workflowStage === 'spritesheet' && (
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
                   )}

                    <div className="flex-grow w-full flex items-center justify-center checkerboard p-2 rounded-md overflow-auto">
                         {workflowStage === 'conception' ? (
                            <CharacterPreview imageUrl={baseCharacter?.previewUrl || null} />
                         ) : (
                            <SpriteGrid
                                grid={spriteGrid}
                                spriteSize={spriteSize}
                                onSpriteSelect={handleSpriteSelect}
                                selectedSprite={selectedSprite}
                                zoomLevel={zoomLevel}
                            />
                         )}
                    </div>
                </main>
            </div>
            <LogConsole logs={logs} />
        </div>
    );
};

export default App;