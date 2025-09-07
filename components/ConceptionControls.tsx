import React from 'react';
import { UploadIcon, GenerateIcon, ExportIcon } from './icons';

interface ConceptionControlsProps {
    prompt: string;
    setPrompt: (prompt: string) => void;
    setInitialImage: (file: File | null) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    hasBaseCharacter: boolean;
    baseCharacterPreview: string | null;
    onProceed: () => void;
    spriteSize: number;
    setSpriteSize: (size: number) => void;
}

const ConceptionControls: React.FC<ConceptionControlsProps> = ({
    prompt, setPrompt, setInitialImage, onGenerate, isGenerating,
    hasBaseCharacter, baseCharacterPreview, onProceed, spriteSize, setSpriteSize
}) => {
    
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInitialImage(e.target.files[0]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            if (!isGenerating && (prompt || hasBaseCharacter)) {
                onGenerate();
            }
        }
    };

    const handleDownloadBaseCharacter = () => {
        if (!baseCharacterPreview) return;
        const link = document.createElement('a');
        link.href = baseCharacterPreview;
        link.download = 'base_character.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const suggestions = [
        { name: 'glowing ghost', prompt: 'a floating, glowy ghost, similar to the ones in PacMan game' },
        { name: 'dark warrior', prompt: 'cartoonish, sharp, Japanese, shadow warrior with long katana and thin legs. Simple design, limit color palette to 6' },
        { name: 'silly dragon', prompt: 'cartoonish, silly dragon, with a big belly' },
        { name: 'brave knight', prompt: 'A brave knight with shiny silver armor. Use a few colors. Make it clean, without too many details.' }
    ];

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-cyan-400 border-b border-gray-600 pb-2">1. Create Base Character</h2>
            <p className="text-sm text-gray-400">Describe your character. You can refine the image until it's perfect before generating the full sprite sheet.</p>

            <div>
                <label htmlFor="spriteSize" className="block text-sm font-medium text-gray-300 mb-1">Sprite Size (px)</label>
                <input
                    type="number"
                    id="spriteSize"
                    value={spriteSize}
                    onChange={(e) => setSpriteSize(parseInt(e.target.value, 10))}
                    className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    min="8"
                    step="8"
                />
            </div>

            <div>
                <label htmlFor="initialPrompt" className="block text-sm font-medium text-gray-300 mb-1">Character Description</label>
                <textarea
                    id="initialPrompt"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="A brave knight with shiny silver armor. Use a top-down view, character facing front, with the character's feet at the bottom of the frame. Use few colors. Make it clean, with out too many details."
                    className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 text-right mt-1">Ctrl+Enter to generate</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                    <button
                        key={suggestion.name}
                        onClick={() => setPrompt(suggestion.prompt)}
                        title={suggestion.prompt}
                        className="px-3 py-1 text-xs font-semibold text-cyan-300 bg-[#282c34] border border-gray-600 rounded-full hover:bg-cyan-600 hover:text-white transition-colors"
                    >
                        {suggestion.name}
                    </button>
                ))}
            </div>

            <div>
                <label htmlFor="initialImage" className="block text-sm font-medium text-gray-300 mb-1">...or Upload Reference Image</label>
                <label className="w-full flex items-center justify-center gap-2 bg-[#282c34] text-gray-300 p-2 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700 hover:border-cyan-500">
                    <UploadIcon />
                    <span>Choose File</span>
                    <input id="initialImage" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
            </div>
            
            <button
                onClick={onGenerate}
                disabled={isGenerating || (!prompt && !hasBaseCharacter)}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                <GenerateIcon />
                {isGenerating ? 'Generating...' : (hasBaseCharacter ? 'Refine Character' : 'Generate Character')}
            </button>
            
            {hasBaseCharacter && (
                <>
                    <button
                        onClick={handleDownloadBaseCharacter}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        <ExportIcon />
                        Download Character
                    </button>
                    <button
                        onClick={onProceed}
                        disabled={isGenerating}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        Next: Create Sprite Sheet &rarr;
                    </button>
                </>
            )}
        </div>
    );
};

export default ConceptionControls;