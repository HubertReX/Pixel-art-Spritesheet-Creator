

import React, { useState, useEffect, useRef } from 'react';
import { Sprite, Design, BaseCharacter, AnimationPose, Log, PreviewBackgroundType } from './types';
import { generateBaseCharacter, generateSprite, editSprite, generateDesignName, generateBackground } from './services/geminiService';
import { fileToBase64, combineSprites, removeMagentaBackground, flipImageHorizontally } from './utils/imageUtils';
import { getAllDesigns, saveDesign, deleteDesign, bulkSaveDesigns } from './services/db';

import Controls from './components/Controls';
import SpriteGrid from './components/SpriteGrid';
import EditorPanel from './components/EditorPanel';
import { LoadingIcon, GenerateIcon, ExportIcon } from './components/icons';
import ConceptionControls from './components/ConceptionControls';
import CharacterPreview from './components/CharacterPreview';
import LogConsole from './components/LogConsole';
import PersistenceControls from './components/PersistenceControls';
import ConfirmModal from './components/ConfirmModal';
import BackgroundControls from './components/BackgroundControls';
import { defaultCustomBackground } from './defaultBackground';


type WorkflowStage = 'conception' | 'spritesheet';

const App: React.FC = () => {
    // Design State
    const [savedDesigns, setSavedDesigns] = useState<Design[]>([]);
    const [currentDesignId, setCurrentDesignId] = useState<string | null>(null);
    const [currentDesignCreatedAt, setCurrentDesignCreatedAt] = useState<number | null>(null);
    const [designName, setDesignName] = useState<string>('');
    const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
    
    // Character & Grid State
    const [spriteSize, setSpriteSize] = useState<number>(32);
    const [frameCount, setFrameCount] = useState<number>(4);
    const [initialPrompt, setInitialPrompt] = useState<string>('');
    const [initialImage, setInitialImage] = useState<File | null>(null);
    const [spriteGrid, setSpriteGrid] = useState<(Sprite | null)[][]>([]);
    const [spriteGridViewpoints, setSpriteGridViewpoints] = useState<string[]>([]);
    const [animationPoses, setAnimationPoses] = useState<AnimationPose[]>([{ id: 'default-standing', name: 'Standing', viewpoints: ['front'] }]);
    const [generateAnimation, setGenerateAnimation] = useState<boolean>(false);
    const [animationType, setAnimationType] = useState<string>('walk');
    const [baseCharacter, setBaseCharacter] = useState<BaseCharacter | null>(null);
    
    // UI State
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [selectedSprite, setSelectedSprite] = useState<{ row: number; col: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(16);
    const [previewZoom, setPreviewZoom] = useState<number>(4);
    const [workflowStage, setWorkflowStage] = useState<WorkflowStage>('conception');
    const [logs, setLogs] = useState<Log[]>([]);
    const [expandedPoseIds, setExpandedPoseIds] = useState<string[]>(['default-standing']);
    const [isAnimationExpanded, setIsAnimationExpanded] = useState<boolean>(false);
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        message: string;
        onConfirm: (() => void) | null;
    }>({ isOpen: false, message: '', onConfirm: null });
    const [previewBackgroundType, setPreviewBackgroundType] = useState<PreviewBackgroundType>('transparent');
    const [customBackground, setCustomBackground] = useState<string | null>(defaultCustomBackground);


    const previewContainerRef = useRef<HTMLDivElement>(null);
    const allViewpoints = ['front', 'back', 'left', 'right'];

    // Auto-zoom effect
    useEffect(() => {
        if (workflowStage === 'spritesheet' && spriteGrid.length > 0 && previewContainerRef.current) {
            const rows = spriteGrid.length;
            const cols = spriteGrid[0]?.length || 0;
            if (rows === 0 || cols === 0) return;

            const container = previewContainerRef.current;
            // Generous buffer for container padding, grid gaps, and headers
            const PADDING_BUFFER = 80;
            const containerWidth = container.clientWidth - PADDING_BUFFER;
            const containerHeight = container.clientHeight - PADDING_BUFFER;

            const gridPixelWidth = cols * spriteSize;
            const gridPixelHeight = rows * spriteSize;

            if (gridPixelWidth <= 0 || gridPixelHeight <= 0) return;

            const zoomX = containerWidth / gridPixelWidth;
            const zoomY = containerHeight / gridPixelHeight;

            const newZoom = Math.max(1, Math.floor(Math.min(zoomX, zoomY)));
            setZoomLevel(newZoom);
        }
    }, [spriteGrid, spriteSize, workflowStage]);


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

    const addLog = (title: string, details: Record<string, string | undefined>) => {
        const timestamp = new Date().toLocaleTimeString();
        const newLog = { timestamp, title, details };
        setLogs(prevLogs => [...prevLogs, newLog]);
    };

    const showConfirmModal = (message: string, onConfirm: () => void) => {
        setConfirmation({ isOpen: true, message, onConfirm });
    };

    const handleConfirm = () => {
        if (confirmation.onConfirm) {
            confirmation.onConfirm();
        }
        setConfirmation({ isOpen: false, message: '', onConfirm: null });
    };

    const handleCancelConfirm = () => {
        setConfirmation({ isOpen: false, message: '', onConfirm: null });
    };

    const resetToNewDesign = () => {
        setCurrentDesignId(null);
        setCurrentDesignCreatedAt(null);
        setDesignName('');
        setInitialPrompt('');
        setInitialImage(null);
        setBaseCharacter(null);
        setSpriteGrid([]);
        setSpriteGridViewpoints([]);
        setSpriteSize(32);
        setFrameCount(4);
        setAnimationPoses([{ id: 'default-standing', name: 'Standing', viewpoints: ['front'], prompt: '' }]);
        setExpandedPoseIds(['default-standing']);
        setIsAnimationExpanded(false);
        setGenerateAnimation(false);
        setAnimationType('walk');
        setWorkflowStage('conception');
        setSelectedSprite(null);
        setPreviewBackgroundType('transparent');
        setCustomBackground(defaultCustomBackground);
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
        
        const now = Date.now();
        const designData: Design = {
            id: currentDesignId,
            name: designName,
            prompt: initialPrompt,
            spriteSize,
            frameCount,
            animationType,
            generateAnimation,
            animationPoses,
            baseCharacter,
            spriteGrid,
            createdAt: currentDesignCreatedAt || now,
            lastModified: now,
            previewBackgroundType,
            customBackground: customBackground ?? undefined,
        };

        try {
            await saveDesign(designData);
            if (!currentDesignCreatedAt) {
                setCurrentDesignCreatedAt(now);
            }
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
    
    const handleLoadDesign = (id: string, designsList?: Design[]) => {
        const designs = designsList || savedDesigns;
        const designToLoad = designs.find(d => d.id === id);
        if (designToLoad) {
            setCurrentDesignId(designToLoad.id);
            setCurrentDesignCreatedAt(designToLoad.createdAt);
            setDesignName(designToLoad.name);
            setInitialPrompt(designToLoad.prompt);
            setSpriteSize(designToLoad.spriteSize);
            setFrameCount(designToLoad.frameCount);
            setAnimationType(designToLoad.animationType);
            setGenerateAnimation(designToLoad.generateAnimation);
            setAnimationPoses(designToLoad.animationPoses);
            setBaseCharacter(designToLoad.baseCharacter);
            setSpriteGrid(designToLoad.spriteGrid);
            setSpriteGridViewpoints(allViewpoints);
            setExpandedPoseIds(['default-standing']);
            setIsAnimationExpanded(designToLoad.generateAnimation);
            setPreviewBackgroundType(designToLoad.previewBackgroundType || 'transparent');
            setCustomBackground(designToLoad.customBackground || defaultCustomBackground);
            
            setWorkflowStage(designToLoad.baseCharacter ? 'spritesheet' : 'conception');
            setSelectedSprite(null);
            setError(null);
        }
    };
    
    const handleDeleteDesign = async (id: string) => {
        const deleteAction = async () => {
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
        };

        showConfirmModal(
            "Are you sure you want to permanently delete this design? This action cannot be undone.",
            deleteAction
        );
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

    const handleExportAllDesigns = async () => {
        setError(null);
        try {
            const allDesigns = await getAllDesigns();
            if (allDesigns.length === 0) {
                alert("There are no designs to export.");
                return;
            }

            const backupData = {
                source: "pixel-art-spritesheet-creator-backup",
                version: 3, // Corresponds to DB version
                designs: allDesigns,
            };

            const jsonString = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.download = `pixel-art-spritesheet-backup-${timestamp}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error(err);
            setError(`Failed to export all designs: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    const handleImportDesign = async (file: File) => {
        setError(null);
        if (!file.name.endsWith('.json')) {
            setError("Invalid file type. Please upload a .json file.");
            return;
        }
        
        const migrateDesign = (d: any): Design => {
            const now = Date.now();
            const migrated: Design = {
                ...d,
                createdAt: d.createdAt || now,
                lastModified: d.lastModified || now,
                previewBackgroundType: d.previewBackgroundType || 'transparent',
                customBackground: d.customBackground ?? undefined,
            };

            // V2 -> V3 migration
            if ((d as any).selectedViewpoints && !migrated.animationPoses) {
                migrated.animationPoses = [{ 
                    id: 'default-standing', 
                    name: 'Standing', 
                    viewpoints: (d as any).selectedViewpoints 
                }];
                delete (migrated as any).selectedViewpoints;
            }

            if (!migrated.animationPoses) {
                migrated.animationPoses = [{ id: 'default-standing', name: 'Standing', viewpoints: ['front'] }];
            }

            // Ensure all poses have the correct shape (for V4 prompt field, though optional)
            migrated.animationPoses = migrated.animationPoses.map((p: any) => ({
                id: p.id || Math.random().toString(36).substring(7),
                name: p.name || 'Pose',
                viewpoints: p.viewpoints || [],
                prompt: p.prompt, // Will be undefined if not present, which is fine
            }));


            return migrated;
        }

        try {
            const jsonString = await file.text();
            const importedObject = JSON.parse(jsonString);

            let designsToImport: Design[] = [];

            // Case 1: It's a full backup file
            if (importedObject.source === "pixel-art-spritesheet-creator-backup" && Array.isArray(importedObject.designs)) {
                designsToImport = importedObject.designs.map(migrateDesign);
            } 
            // Case 2: It's a single design file
            else if (typeof importedObject.name === 'string' && (Array.isArray(importedObject.spriteGrid) || importedObject.baseCharacter)) {
                const now = Date.now();
                const singleDesign = { 
                    ...importedObject, 
                    id: importedObject.id || now.toString(),
                };
                designsToImport.push(migrateDesign(singleDesign));
            } else {
                throw new Error("The imported file has an invalid format.");
            }
            
            if (designsToImport.length > 0) {
                await bulkSaveDesigns(designsToImport);
                const updatedDesigns = await getAllDesigns();
                setSavedDesigns(updatedDesigns);
                
                // If it was a single import, automatically load it
                if (designsToImport.length === 1) {
                    handleLoadDesign(designsToImport[0].id, updatedDesigns);
                }
            }

        } catch (err) {
            console.error(err);
            setError(`Failed to import design(s): ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        
        const basePromptEnhancer = `The output MUST be a single, isolated character sprite on a solid magenta background (color #FF00FF). The background must be pure, solid magenta. Do not include any text, labels, or other elements in the image.`;
        
        try {
            const specialInstructions = `Perspective is top-down facing front. The character should fill the frame as much as possible. If the character has feet, they should touch the bottom border of the image. The sprite should have the appearance of a ${spriteSize}x${spriteSize} pixel art character.`;
            const baseCharPrompt = `${initialPrompt}. ${specialInstructions} ${basePromptEnhancer}`;

            addLog('Generating Base Character', {
                'Description': `"${initialPrompt}"`,
                'Prompt': `"${baseCharPrompt}"`
            });

            const newSpriteBase64 = await generateBaseCharacter(initialPrompt, contextImage, spriteSize);
            const imageUrl = `data:image/png;base64,${newSpriteBase64}`;
            const previewUrl = await removeMagentaBackground(imageUrl);
            const newBaseChar = { imageUrl, previewUrl, prompt: initialPrompt };
            setBaseCharacter(newBaseChar);

            // When the base character is updated, the existing spritesheet is no longer valid.
            setSpriteGrid([]);
            setSpriteGridViewpoints([]);

            // If it's a new design, generate a name and set up the design ID
            if (!currentDesignId) {
                setLoadingMessage('Generating design name...');
                const nameGenPrompt = `Generate a very short, cool, and memorable name (2-3 words max) for a game character based on the following description. Return only the name, with no extra text or quotes.\n\nDescription: "${initialPrompt}"`;
                addLog('Generating Design Name', {
                    'Description': `"${initialPrompt}"`,
                    'Prompt': `"${nameGenPrompt}"`
                });
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
            setSelectedSprite(null);
        }
    };

    const handleBackToConception = () => {
        setWorkflowStage('conception');
    };

    const handleRemovePose = (idToRemove: string) => {
        const removeAction = () => {
            const poseIndex = animationPoses.findIndex(p => p.id === idToRemove);
            if (poseIndex === -1) return;

            // Remove the pose from the list
            const newAnimationPoses = animationPoses.filter(p => p.id !== idToRemove);
            setAnimationPoses(newAnimationPoses);
            setExpandedPoseIds(prev => prev.filter(id => id !== idToRemove));

            // Remove corresponding rows from the sprite grid if it exists
            if (spriteGrid.length > 0) {
                const framesPerPose = generateAnimation ? frameCount : 1;
                const startRowIndex = poseIndex * framesPerPose;
                
                const updatedSpriteGrid = [
                    ...spriteGrid.slice(0, startRowIndex),
                    ...spriteGrid.slice(startRowIndex + framesPerPose)
                ];
                setSpriteGrid(updatedSpriteGrid);
            }
        };

        showConfirmModal(
            "Are you sure you want to remove this pose? This action cannot be undone.",
            removeAction
        );
    };

    const handleGenerateSpritesheet = async () => {
        if (!baseCharacter) {
            setError('No base character found.');
            return;
        }
        if (animationPoses.length === 0 || animationPoses.every(p => p.viewpoints.length === 0)) {
            setError('Please select at least one viewpoint in a pose to generate.');
            return;
        }
    
        setIsLoading(true);
        setError(null);
        
        const fixedViewpoints = allViewpoints;
        
        setSpriteGridViewpoints(fixedViewpoints);
        setSelectedSprite(null);
        
        const numPoses = animationPoses.length;
        const framesPerPose = generateAnimation ? frameCount : 1;
        const numRows = numPoses * framesPerPose;
        const numCols = fixedViewpoints.length;
    
        // Preserve existing sprites while resizing the grid for the new generation settings.
        // This prevents sprites from being cleared if they are not part of the current generation batch.
        const oldGrid = spriteGrid;
        const newGrid: (Sprite | null)[][] = Array(numRows).fill(null).map((_, r) =>
            Array(numCols).fill(null).map((__, c) =>
                (oldGrid[r] && oldGrid[r][c] !== undefined) ? oldGrid[r][c] : null
            )
        );
        setSpriteGrid(newGrid);

        const contextImages: { mimeType: string; data: string }[] = [{ mimeType: 'image/png', data: baseCharacter.imageUrl.split(',')[1] }];
        const basePromptEnhancer = `The output MUST be a single, isolated character sprite on a solid magenta background (color #FF00FF). The background must be pure, solid magenta. Do not include any text, labels, or other elements in the image.`;
    
        try {
            let currentRowIndex = 0;
            for (let poseIndex = 0; poseIndex < numPoses; poseIndex++) {
                const pose = animationPoses[poseIndex];
                const totalViewpointsForPose = pose.viewpoints.length;

                for (let frameIndex = 0; frameIndex < framesPerPose; frameIndex++) {
                    let generatedViewpointsForFrame = 0;

                    for (let colIndex = 0; colIndex < numCols; colIndex++) {
                        const viewpoint = fixedViewpoints[colIndex];
                        
                        if (!pose.viewpoints.includes(viewpoint)) {
                            continue; // Skip generation if viewpoint is not selected for this pose
                        }
                        
                        generatedViewpointsForFrame++;

                        // INTELLIGENT FLIP: If generating 'right' view, flip the 'left' view instead of asking the AI.
                        // This overcomes model bias and ensures perfect symmetry.
                        if (viewpoint === 'right' && pose.viewpoints.includes('left')) {
                            const leftColIndex = fixedViewpoints.indexOf('left');
                            const leftSprite = newGrid[currentRowIndex][leftColIndex];

                            if (leftSprite) {
                                setLoadingMessage(`Pose: ${pose.name}, View: right (flipping)`);

                                addLog('Generating Sprite', {
                                    'Design': designName,
                                    'Pose': pose.name,
                                    'Frame': generateAnimation ? `${frameIndex + 1}/${frameCount}` : undefined,
                                    'Viewpoint': viewpoint,
                                    'Method': 'Flipped from "left" viewpoint for symmetry. No AI call made.',
                                });
                                
                                const [flippedImageUrl, flippedPreviewUrl] = await Promise.all([
                                    flipImageHorizontally(leftSprite.imageUrl),
                                    flipImageHorizontally(leftSprite.previewUrl),
                                ]);

                                const rightSprite: Sprite = {
                                    id: `${currentRowIndex}-${colIndex}`,
                                    imageUrl: flippedImageUrl,
                                    previewUrl: flippedPreviewUrl,
                                    prompt: leftSprite.prompt.replace(/facing left/g, 'facing right'),
                                };
                                newGrid[currentRowIndex][colIndex] = rightSprite;
                                setSpriteGrid([...newGrid.map(r => [...r])]);
                                continue; // Skip to the next viewpoint
                            }
                            // If left sprite doesn't exist for some reason, we'll fall through and let the AI try to generate it.
                        }

                        // Use the detailed prompt if available, otherwise fall back to the pose name.
                        const poseDescription = pose.prompt && pose.prompt.trim() !== '' ? pose.prompt : pose.name;

                        const animationState = generateAnimation 
                            ? `performing a "${poseDescription}" animation (frame ${frameIndex + 1} of ${frameCount})` 
                            : `in a static "${poseDescription}" pose`;
                        
                        const prompt = `A ${spriteSize}x${spriteSize} pixel art sprite. The character is ${baseCharacter.prompt}. The character is ${animationState}, facing ${viewpoint}. Maintain a consistent character design based on the provided context images.`;
                        const fullPrompt = `${prompt}. ${basePromptEnhancer} The sprite should have the appearance of a ${spriteSize}x${spriteSize} pixel art character.`;
                        
                        let loadingMsg = `Pose: ${pose.name} (${poseIndex + 1}/${numPoses})`;
                        if (generateAnimation) {
                            loadingMsg += `, Frame: ${frameIndex + 1}/${frameCount}`;
                        }
                        loadingMsg += `, View: ${viewpoint} (${generatedViewpointsForFrame}/${totalViewpointsForPose})`;
                        setLoadingMessage(loadingMsg);
                        
                        addLog('Generating Sprite', {
                            'Design': designName,
                            'Pose': pose.name,
                            'Frame': generateAnimation ? `${frameIndex + 1}/${frameCount}` : undefined,
                            'Viewpoint': viewpoint,
                            'Prompt': `"${fullPrompt}"`,
                        });
                        const newSpriteBase64 = await generateSprite(prompt, contextImages, spriteSize);
                        const imageUrl = `data:image/png;base64,${newSpriteBase64}`;
                        const previewUrl = await removeMagentaBackground(imageUrl);
                        
                        const newSprite: Sprite = {
                            id: `${currentRowIndex}-${colIndex}`,
                            imageUrl: imageUrl,
                            previewUrl: previewUrl,
                            prompt: fullPrompt
                        };
    
                        newGrid[currentRowIndex][colIndex] = newSprite;
                        setSpriteGrid([...newGrid.map(r => [...r])]);
    
                        if (contextImages.length < 10) {
                            contextImages.push({ mimeType: 'image/png', data: newSpriteBase64 });
                        }
                    }
                    currentRowIndex++;
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
    
        const currentViewpoint = spriteGridViewpoints[col];
        const leftColIndex = spriteGridViewpoints.indexOf('left');
        const rightColIndex = spriteGridViewpoints.indexOf('right');
        
        let effectiveTargetSprite = targetSprite;
        let effectiveEditCol = col;
    
        // If editing the right sprite, redirect the edit to the left sprite to maintain symmetry.
        if (currentViewpoint === 'right' && leftColIndex !== -1) {
            const leftSprite = spriteGrid[row][leftColIndex];
            if (leftSprite) {
                effectiveTargetSprite = leftSprite;
                effectiveEditCol = leftColIndex;
                setLoadingMessage(`Editing 'left' sprite to mirror changes...`);
            }
        }
    
        const contextSprites = spriteGrid.flat().filter(sprite => sprite && sprite.id !== effectiveTargetSprite.id).slice(0, 5) as Sprite[];
        const basePromptEnhancer = `The output MUST be a single, isolated character sprite on a solid magenta background (color #FF00FF). The background must be pure, solid magenta. Do not include any text, labels, or other elements in the image.`;
        
        try {
            const framesPerPose = generateAnimation ? frameCount : 1;
            const poseIndex = Math.floor(row / framesPerPose);
            const pose = animationPoses[poseIndex];
            
            const fullPrompt = `Edit the primary input image based on this instruction: "${editPrompt}". The sprite must maintain the appearance of a ${spriteSize}x${spriteSize} pixel art style. Use the other images as context for the character's consistent design. ${basePromptEnhancer}`;

            addLog('Editing Sprite', {
                'Design': designName,
                'Pose': pose.name,
                'Viewpoint': currentViewpoint,
                'Instruction': `"${editPrompt}"`,
                'Prompt': `"${fullPrompt}"`,
            });

            const editedSpriteBase64 = await editSprite(editPrompt, effectiveTargetSprite, contextSprites, spriteSize);
            const imageUrl = `data:image/png;base64,${editedSpriteBase64}`;
            const previewUrl = await removeMagentaBackground(imageUrl);
    
            const newGrid = [...spriteGrid.map(r => [...r])];
            
            // Update the effectively edited sprite (which is always the left or another non-right sprite).
            newGrid[row][effectiveEditCol] = {
                ...effectiveTargetSprite,
                imageUrl: imageUrl,
                previewUrl: previewUrl,
            };
    
            // If the left sprite was edited (either directly or via the right), update the right sprite by flipping.
            if (effectiveEditCol === leftColIndex && rightColIndex !== -1 && newGrid[row][rightColIndex]) {
                setLoadingMessage('Flipping edited sprite...');
                const [flippedImageUrl, flippedPreviewUrl] = await Promise.all([
                    flipImageHorizontally(imageUrl),
                    flipImageHorizontally(previewUrl),
                ]);
                
                const originalRightSprite = newGrid[row][rightColIndex]!;
                newGrid[row][rightColIndex] = {
                    ...originalRightSprite,
                    imageUrl: flippedImageUrl,
                    previewUrl: flippedPreviewUrl,
                };
            }
            
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

    const handleGenerateCustomBackground = async (prompt: string) => {
        setIsLoading(true);
        setError(null);
        setLoadingMessage('Generating custom background...');
        
        try {
            addLog('Generating Custom Background', { 'Prompt': `"${prompt}"` });
            const newBackgroundUrl = await generateBackground(prompt);
            setCustomBackground(newBackgroundUrl);
            setPreviewBackgroundType('custom');
        } catch (err) {
            console.error(err);
            setError(`Failed to generate background: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const getPreviewStyle = (): React.CSSProperties => {
        switch(previewBackgroundType) {
            case 'white':
                return { backgroundColor: '#FFFFFF' };
            case 'black':
                return { backgroundColor: '#000000' };
            case 'custom':
                if (customBackground) {
                    return { 
                        backgroundImage: `url(${customBackground})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center' 
                    };
                }
                return {};
            case 'transparent':
            default:
                return {};
        }
    };

    return (
        <div className="bg-[#282c34] h-screen text-gray-200 font-mono flex flex-col p-4 gap-4 pb-12">
            <header className="text-center border-b border-gray-600 pb-2 flex-shrink-0">
                <h1 className="text-2xl font-bold text-cyan-400">Pixel-art Spritesheet Creator</h1>
                <p className="text-sm text-gray-400">Create game-ready sprite sheets with AI</p>
            </header>

            {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
                    <LoadingIcon />
                    <p className="mt-4 text-lg text-white">{loadingMessage}</p>
                </div>
            )}
            
            {confirmation.isOpen && (
                <ConfirmModal 
                    message={confirmation.message}
                    onConfirm={handleConfirm}
                    onCancel={handleCancelConfirm}
                />
            )}

            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
                <div className="md:col-span-1 flex flex-col gap-4 min-h-0">
                    <div className="flex-shrink-0">
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
                            onExportAll={handleExportAllDesigns}
                            onImport={handleImportDesign}
                            saveSuccess={saveSuccess}
                        />
                    </div>

                    <div className="flex-grow bg-[#3a3f4a] p-4 rounded-md border border-gray-600 overflow-y-auto">
                        {workflowStage === 'conception' ? (
                            <ConceptionControls
                                prompt={initialPrompt}
                                setPrompt={setInitialPrompt}
                                setInitialImage={setInitialImage}
                                onGenerate={handleGenerateBaseCharacter}
                                isGenerating={isLoading}
                                hasBaseCharacter={!!baseCharacter}
                                baseCharacterPreview={baseCharacter?.previewUrl || null}
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
                                    animationPoses={animationPoses}
                                    setAnimationPoses={setAnimationPoses}
                                    generateAnimation={generateAnimation}
                                    setGenerateAnimation={setGenerateAnimation}
                                    animationType={animationType}
                                    setAnimationType={setAnimationType}
                                    onBack={handleBackToConception}
                                    baseCharacterPreview={baseCharacter?.previewUrl || ''}
                                    previewZoom={previewZoom}
                                    setPreviewZoom={setPreviewZoom}
                                    onRemovePose={handleRemovePose}
                                    expandedPoseIds={expandedPoseIds}
                                    setExpandedPoseIds={setExpandedPoseIds}
                                    isAnimationExpanded={isAnimationExpanded}
                                    setIsAnimationExpanded={setIsAnimationExpanded}
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
                    {workflowStage === 'spritesheet' && (
                         <div className="flex-shrink-0 flex flex-col gap-2 p-4 bg-[#3a3f4a] rounded-md border border-gray-600">
                            <button
                                onClick={handleGenerateSpritesheet}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            >
                                <GenerateIcon />
                                {isLoading ? 'Generating...' : 'Generate Sprite Sheet'}
                            </button>
                            
                            {spriteGrid.length > 0 && (
                                <button
                                    onClick={handleExport}
                                    disabled={isLoading}
                                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ExportIcon />
                                    Export as PNG
                                </button>
                            )}
                        </div>
                    )}
                </div>


                <main className="md:col-span-2 bg-[#3a3f4a] p-4 rounded-md border border-gray-600 flex flex-col items-center justify-start gap-4 min-h-0">
                    <div className="w-full flex-shrink-0 flex flex-col items-center gap-4">
                        <BackgroundControls 
                            backgroundType={previewBackgroundType}
                            onBackgroundTypeChange={setPreviewBackgroundType}
                            onGenerateCustomBackground={handleGenerateCustomBackground}
                            isGenerating={isLoading}
                            customBackgroundUrl={customBackground}
                        />
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
                    </div>

                    <div 
                        ref={previewContainerRef} 
                        className={`flex-grow w-full flex items-center justify-center p-2 rounded-md overflow-auto ${
                            (previewBackgroundType === 'transparent' || (previewBackgroundType === 'custom' && !customBackground)) 
                                ? 'checkerboard' 
                                : ''
                        }`}
                        style={getPreviewStyle()}
                    >
                         {workflowStage === 'conception' ? (
                            <CharacterPreview imageUrl={baseCharacter?.previewUrl || null} />
                         ) : (
                            <SpriteGrid
                                grid={spriteGrid}
                                spriteSize={spriteSize}
                                onSpriteSelect={handleSpriteSelect}
                                selectedSprite={selectedSprite}
                                zoomLevel={zoomLevel}
                                viewpoints={spriteGridViewpoints}
                                animationPoses={animationPoses}
                                generateAnimation={generateAnimation}
                                frameCount={frameCount}
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