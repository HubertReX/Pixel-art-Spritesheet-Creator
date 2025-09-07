

import React, { useState, useEffect } from 'react';
import { Sprite, AnimationPose } from '../types';

interface SpriteGridProps {
    grid: (Sprite | null)[][];
    spriteSize: number;
    onSpriteSelect: (row: number, col: number) => void;
    selectedSprite: { row: number; col: number } | null;
    zoomLevel: number;
    viewpoints: string[];
    animationPoses: AnimationPose[];
    generateAnimation: boolean;
    frameCount: number;
    animationSpeed: number;
}

const SpriteGrid: React.FC<SpriteGridProps> = ({ 
    grid, spriteSize, onSpriteSelect, selectedSprite, zoomLevel, 
    viewpoints, animationPoses, generateAnimation, frameCount, animationSpeed
}) => {
    const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

    useEffect(() => {
        if (!generateAnimation || frameCount <= 1) {
            setCurrentFrameIndex(0); // Reset frame index if animation is off
            return;
        }

        const intervalId = setInterval(() => {
            setCurrentFrameIndex(prev => (prev + 1) % frameCount);
        }, 1000 / animationSpeed);

        return () => clearInterval(intervalId);
    }, [animationSpeed, frameCount, generateAnimation]);


    if (grid.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-64 text-gray-400">
                <p>Your generated sprite sheet will appear here.</p>
            </div>
        );
    }

    const cols = viewpoints.length > 0 ? viewpoints.length : (grid[0]?.length || 0);
    const displaySize = spriteSize * zoomLevel;

    const getRowHeader = (rowIndex: number): string => {
        const framesPerPose = generateAnimation ? frameCount : 1;
        if (framesPerPose === 0) return `Row ${rowIndex + 1}`; // Avoid division by zero
        
        const poseIndex = Math.floor(rowIndex / framesPerPose);
        const frameInPose = rowIndex % framesPerPose;
        const pose = animationPoses[poseIndex];

        if (!pose) return `Row ${rowIndex + 1}`;

        return generateAnimation 
            ? `${pose.name} ${frameInPose + 1}` 
            : pose.name;
    }

    const framesPerPose = generateAnimation ? frameCount : 1;

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
            {animationPoses.map((pose, poseIndex) => {
                const poseStartRow = poseIndex * framesPerPose;

                return (
                    <React.Fragment key={pose.id}>
                        {/* Render the normal frame rows for this pose */}
                        {Array.from({ length: framesPerPose }).map((_, frameIndex) => {
                             const rowIndex = poseStartRow + frameIndex;
                             const rowData = grid[rowIndex];
                             // Don't render a row if its data hasn't been generated yet
                             if (!rowData) return null;

                             return (
                                <React.Fragment key={`row-fragment-${rowIndex}`}>
                                    <div className="text-right text-gray-200 text-lg font-semibold pr-2 whitespace-nowrap [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                                        {getRowHeader(rowIndex)}
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
                        {generateAnimation && frameCount > 1 && (
                            <React.Fragment key={`anim-row-${pose.id}`}>
                                <div className="text-right text-cyan-400 text-lg font-semibold pr-2 whitespace-nowrap [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                                    Preview
                                </div>
                                {Array.from({ length: cols }).map((_, colIndex) => {
                                    const spriteForFrame = grid[poseStartRow + currentFrameIndex]?.[colIndex];
                                    return (
                                        <div
                                            key={`anim-cell-${poseIndex}-${colIndex}`}
                                            className="w-full h-full flex items-center justify-center rounded-md bg-black/20"
                                            style={{ width: `${displaySize}px`, height: `${displaySize}px` }}
                                            aria-label={`Animation preview for ${viewpoints[colIndex]}`}
                                        >
                                            {spriteForFrame ? (
                                                <img
                                                    src={spriteForFrame.previewUrl}
                                                    alt={`Animation frame ${currentFrameIndex + 1}`}
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
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
};

export default SpriteGrid;