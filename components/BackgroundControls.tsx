
import React, { useState } from 'react';
import { PreviewBackgroundType } from '../types';
import { GenerateIcon, ExportIcon } from './icons';

interface BackgroundControlsProps {
    backgroundType: PreviewBackgroundType;
    onBackgroundTypeChange: (type: PreviewBackgroundType) => void;
    onGenerateCustomBackground: (prompt: string) => void;
    isGenerating: boolean;
    customBackgroundUrl: string | null;
}

const BackgroundControls: React.FC<BackgroundControlsProps> = ({
    backgroundType,
    onBackgroundTypeChange,
    onGenerateCustomBackground,
    isGenerating,
    customBackgroundUrl,
}) => {
    const [prompt, setPrompt] = useState('');

    const handleGenerate = () => {
        if (prompt && !isGenerating) {
            onGenerateCustomBackground(prompt);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleGenerate();
        }
    };

    const handleDownloadBackground = () => {
        if (!customBackgroundUrl) return;
        const link = document.createElement('a');
        link.href = customBackgroundUrl;
        link.download = 'custom_background.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const options: { id: PreviewBackgroundType, label: string }[] = [
        { id: 'transparent', label: 'Transparent' },
        { id: 'white', label: 'White' },
        { id: 'black', label: 'Black' },
        { id: 'custom', label: 'Custom' },
    ];

    return (
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-4 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-sm font-medium text-gray-300">BG:</span>
                {options.map(option => (
                     <button
                        key={option.id}
                        onClick={() => onBackgroundTypeChange(option.id)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${
                            backgroundType === option.id
                                ? 'bg-cyan-500 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                     >
                         {option.label}
                     </button>
                ))}
            </div>

            {backgroundType === 'custom' && (
                <div className="flex items-center gap-2 w-full sm:w-auto sm:max-w-xs mt-2 sm:mt-0">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., grassy field"
                        className="w-full bg-[#282c34] text-white text-sm p-1.5 rounded-md border border-gray-600 focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                        disabled={isGenerating}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt}
                        className="p-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                        title="Generate Background"
                    >
                        <GenerateIcon />
                    </button>
                    {customBackgroundUrl && (
                        <button
                            onClick={handleDownloadBackground}
                            disabled={isGenerating}
                            className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                            title="Download Background"
                        >
                            <ExportIcon />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default BackgroundControls;