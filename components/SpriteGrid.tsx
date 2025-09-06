import React from 'react';
import { Sprite } from '../types';

interface SpriteGridProps {
    grid: (Sprite | null)[][];
    spriteSize: number;
    onSpriteSelect: (row: number, col: number) => void;
    selectedSprite: { row: number; col: number } | null;
    zoomLevel: number;
}

const SpriteGrid: React.FC<SpriteGridProps> = ({ grid, spriteSize, onSpriteSelect, selectedSprite, zoomLevel }) => {
    if (grid.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-64 text-gray-400">
                <p>Your generated sprite sheet will appear here.</p>
            </div>
        );
    }

    const rows = grid.length;
    const cols = grid[0]?.length || 0;
    const displaySize = spriteSize * zoomLevel;

    return (
        <div
            className="grid bg-transparent p-2 border-2 border-gray-500 rounded-md"
            style={{
                gridTemplateColumns: `repeat(${cols}, ${displaySize}px)`,
                gridTemplateRows: `repeat(${rows}, ${displaySize}px)`,
                gap: '4px',
            }}
        >
            {grid.map((row, rowIndex) =>
                row.map((sprite, colIndex) => {
                    const isSelected = selectedSprite?.row === rowIndex && selectedSprite?.col === colIndex;
                    const cellClasses = `w-full h-full flex items-center justify-center border-2 
                        ${isSelected ? 'border-cyan-400' : 'border-transparent'} 
                        ${sprite ? 'cursor-pointer hover:bg-cyan-500/30' : 'bg-black/20'}`;

                    return (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={cellClasses}
                            style={{ width: `${displaySize}px`, height: `${displaySize}px` }}
                            onClick={() => sprite && onSpriteSelect(rowIndex, colIndex)}
                        >
                            {sprite ? (
                                <img
                                    src={sprite.previewUrl}
                                    alt={`Sprite ${rowIndex}-${colIndex}`}
                                    className="w-full h-full object-contain"
                                    style={{ imageRendering: 'pixelated' }}
                                />
                            ) : null}
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default SpriteGrid;