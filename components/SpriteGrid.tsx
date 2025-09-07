
import React from 'react';
import { Sprite } from '../types';

interface SpriteGridProps {
    grid: (Sprite | null)[][];
    spriteSize: number;
    onSpriteSelect: (row: number, col: number) => void;
    selectedSprite: { row: number; col: number } | null;
    zoomLevel: number;
    viewpoints: string[];
    isAnimated: boolean;
}

const SpriteGrid: React.FC<SpriteGridProps> = ({ grid, spriteSize, onSpriteSelect, selectedSprite, zoomLevel, viewpoints, isAnimated }) => {
    if (grid.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-64 text-gray-400">
                <p>Your generated sprite sheet will appear here.</p>
            </div>
        );
    }

    const rows = grid.length;
    const cols = viewpoints.length > 0 ? viewpoints.length : (grid[0]?.length || 0);
    const displaySize = spriteSize * zoomLevel;

    return (
        <div
            className="inline-grid items-center p-2"
            style={{
                gridTemplateColumns: `auto repeat(${cols}, ${displaySize}px)`,
                gridTemplateRows: `auto repeat(${rows}, ${displaySize}px)`,
                gap: '8px',
            }}
        >
            {/* Top-left empty cell */}
            <div />

            {/* Column Headers */}
            {viewpoints.map((vp, colIndex) => (
                <div key={`col-header-${colIndex}`} className="text-center text-gray-400 text-sm font-semibold capitalize">
                    {vp}
                </div>
            ))}

            {/* Rows with headers and sprites, flattened for CSS Grid */}
            {grid.flatMap((row, rowIndex) => [
                <div key={`row-header-${rowIndex}`} className="text-right text-gray-400 text-sm font-semibold pr-2 whitespace-nowrap">
                    {isAnimated ? `Frame ${rowIndex + 1}` : 'Standing'}
                </div>,
                ...Array.from({ length: cols }).map((_, colIndex) => {
                    const sprite = row[colIndex] ?? null;
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
                })
            ])}
        </div>
    );
};

export default SpriteGrid;
