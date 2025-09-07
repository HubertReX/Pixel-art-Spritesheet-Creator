import React from 'react';

interface CharacterPreviewProps {
    imageUrl: string | null;
    spriteSize: number;
    zoomLevel: number;
}

const CharacterPreview: React.FC<CharacterPreviewProps> = ({ imageUrl, spriteSize, zoomLevel }) => {
    if (!imageUrl) {
        return (
            <div className="flex items-center justify-center w-full h-full text-gray-400">
                <p>Your generated base character will appear here.</p>
            </div>
        );
    }

    const displaySize = spriteSize * zoomLevel;
    
    return (
        <div className="flex items-center justify-center">
             <div 
                className="border-2 border-cyan-400 rounded-md p-1"
                style={{ width: `${displaySize}px`, height: `${displaySize}px` }}
            >
                <img
                    src={imageUrl}
                    alt="Base Character Preview"
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                />
            </div>
        </div>
    );
};

export default CharacterPreview;
