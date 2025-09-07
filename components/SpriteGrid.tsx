

import React, { useState, useEffect } from 'react';
import { Sprite, AnimationPose } from '../types';
import { generateGif } from '../utils/imageUtils';
import { ExportIcon, LoadingIcon } from './icons';

interface SpriteGridProps {
    grid: (Sprite | null)[][];
    spriteSize: number;
    onSpriteSelect: (row: number, col: number) => void;
    selectedSprite: { row: number; col: number } | null;
    zoomLevel: number;
    viewpoints: string[];
    animationPoses: AnimationPose[];
    animationSpeed: number;
}

const SpriteGrid: React.FC<SpriteGridProps> = ({ 
    grid, spriteSize, onSpriteSelect, selectedSprite, zoomLevel, 
    viewpoints, animationPoses, animationSpeed
}) => {
    const [animationTick, setAnimationTick] = useState(0);
    const [isDownloadingGif, setIsDownloadingGif] = useState<{ poseId: string; colIndex: number } | null>(null);

    const hasAnyAnimation = animationPoses.some(p => p.isAnimated && (p.frameCount ?? 0) > 1);

    useEffect(() => {
        if (!hasAnyAnimation) {
            return;
        }

        const intervalId = setInterval(() => {
            setAnimationTick(prev => prev + 1);
        }, 1000 / animationSpeed);

        return () => clearInterval(intervalId);
    }, [animationSpeed, hasAnyAnimation]);


    const handleDownloadGif = async (pose: AnimationPose, colIndex: number) => {
        if (!pose.isAnimated || !pose.frameCount || pose.frameCount <= 1 || isDownloadingGif) return;
    
        setIsDownloadingGif({ poseId: pose.id, colIndex });
        try {
            let poseStartIndex = 0;
            for (const p of animationPoses) {
                if (p.id === pose.id) break;
                poseStartIndex += p.isAnimated ? (p.frameCount ?? 1) : 1;
            }
    
            const framesToExport: Sprite[] = [];
            for (let i = 0; i < pose.frameCount; i++) {
                const sprite = grid[poseStartIndex + i]?.[colIndex];
                if (sprite) {
                    framesToExport.push(sprite);
                }
            }
    
            if (framesToExport.length === 0) {
                console.warn("No frames to export for this animation viewpoint.");
                return;
            }
    
            const gifUrl = await generateGif(framesToExport, spriteSize, animationSpeed);
    
            const link = document.createElement('a');
            link.href = gifUrl;
            const viewpointName = viewpoints[colIndex] || 'animation';
            const designName = pose.name.replace(/\s+/g, '-').toLowerCase();
            link.download = `${designName}-${viewpointName}.gif`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(gifUrl);
    
        } catch (error) {
            console.error("Failed to generate GIF", error);
            // Consider showing an error message to the user
        } finally {
            setIsDownloadingGif(null);
        }
    };


    if (grid.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-64 text-gray-400">
                <p>Your generated sprite sheet will appear here.</p>
            </div>
        );
    }

    const cols = viewpoints.length > 0 ? viewpoints.length : (grid[0]?.length || 0);
    const displaySize = spriteSize * zoomLevel;

    const getRowHeader = (pose: AnimationPose, frameInPose: number): string => {
        return pose.isAnimated && (pose.frameCount ?? 1) > 1
            ? `${pose.name} ${frameInPose + 1}`
            : pose.name;
    }

    let cumulativeRowIndex = 0;

    return (
        <div
            className="inline-grid items-center p-2"
            style={{
                gridTemplateColumns: `auto repeat(${cols}, minmax(0, 1fr))`,
                gap: '8px',
            }}
        >
            {/* Top-left empty cell */}
            <div />

            {/* Column Headers */}
            {viewpoints.map((vp, colIndex) => (
                <div key={`col-header-${colIndex}`} className="text-center text-gray-200 text-lg font-semibold capitalize [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                    {vp}
                </div>
            ))}

            {/* Rows with headers and sprites */}
            {animationPoses.map((pose) => {
                const framesThisPose = pose.isAnimated ? (pose.frameCount ?? 1) : 1;
                const poseStartIndex = cumulativeRowIndex;
                
                const poseContent = (
                    <React.Fragment key={pose.id}>
                        {/* Render the normal frame rows for this pose */}
                        {Array.from({ length: framesThisPose }).map((_, frameIndex) => {
                             const rowIndex = poseStartIndex + frameIndex;
                             const rowData = grid[rowIndex];
                             if (!rowData) return null;

                             return (
                                <React.Fragment key={`row-fragment-${rowIndex}`}>
                                    <div className="text-right text-gray-200 text-lg font-semibold pr-2 whitespace-nowrap [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                                        {getRowHeader(pose, frameIndex)}
                                    </div>
                                    {Array.from({ length: cols }).map((_, colIndex) => {
                                        const sprite = rowData[colIndex] ?? null;
                                        const isSelected = selectedSprite?.row === rowIndex && selectedSprite?.col === colIndex;
                                        const cellClasses = `w-full h-full flex items-center justify-center border-2 rounded-md
                                            ${isSelected ? 'border-cyan-400' : 'border-transparent'} 
                                            ${sprite ? 'cursor-pointer hover:bg-cyan-500/30' : 'bg-black/20'}`;

                                        return (
                                            <div
                                                key={`${rowIndex}-${colIndex}`}
                                                className={cellClasses}
                                                style={{ width: `${displaySize}px`, height: `${displaySize}px` }}
                                                onClick={() => sprite && onSpriteSelect(rowIndex, colIndex)}
                                                aria-label={`Sprite, row ${rowIndex + 1}, column ${colIndex + 1}`}
                                            >
                                                {sprite ? (
                                                    <img
                                                        src={sprite.previewUrl}
                                                        alt={`Sprite ${rowIndex}-${colIndex}`}
                                                        className="w-full h-full object-contain"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-black/20 rounded-sm" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                             );
                        })}
                        
                        {/* Render the animation preview row for this pose */}
                        {pose.isAnimated && framesThisPose > 1 && (
                            <React.Fragment key={`anim-row-${pose.id}`}>
                                <div className="text-right text-cyan-400 text-lg font-semibold pr-2 whitespace-nowrap [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                                    Preview
                                </div>
                                {Array.from({ length: cols }).map((_, colIndex) => {
                                    const currentFrameForPose = animationTick % framesThisPose;
                                    const spriteForFrame = grid[poseStartIndex + currentFrameForPose]?.[colIndex];

                                    const isDownloadingThis = isDownloadingGif?.poseId === pose.id && isDownloadingGif?.colIndex === colIndex;
                                    const hasFramesForThisViewpoint = Array.from({ length: framesThisPose }).some((_, frameIndex) => !!grid[poseStartIndex + frameIndex]?.[colIndex]);

                                    return (
                                        <div
                                            key={`anim-cell-${pose.id}-${colIndex}`}
                                            className="w-full h-full flex items-center justify-center rounded-md bg-black/20 relative group"
                                            style={{ width: `${displaySize}px`, height: `${displaySize}px` }}
                                            aria-label={`Animation preview for ${viewpoints[colIndex]}`}
                                        >
                                            {spriteForFrame ? (
                                                <img
                                                    src={spriteForFrame.previewUrl}
                                                    alt={`Animation frame ${currentFrameForPose + 1}`}
                                                    className="w-full h-full object-contain"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-black/20 rounded-sm" />
                                            )}
                                            {hasFramesForThisViewpoint && (
                                                <button
                                                    onClick={() => handleDownloadGif(pose, colIndex)}
                                                    disabled={!!isDownloadingGif}
                                                    className="absolute text-white inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 disabled:opacity-100 disabled:cursor-wait transition-opacity rounded-md"
                                                    title={`Download ${viewpoints[colIndex]} animation as GIF`}
                                                >
                                                    {isDownloadingThis ? <LoadingIcon /> : <ExportIcon />}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </React.Fragment>
                        )}
                    </React.Fragment>
                );

                cumulativeRowIndex += framesThisPose;
                return poseContent;
            })}
        </div>
    );
};

export default SpriteGrid;