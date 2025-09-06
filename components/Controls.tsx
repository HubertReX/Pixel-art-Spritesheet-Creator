
import React from 'react';
import { UploadIcon, GenerateIcon, ExportIcon } from './icons';

interface ControlsProps {
    spriteSize: number;
    setSpriteSize: (size: number) => void;
    frameCount: number;
    setFrameCount: (count: number) => void;
    initialPrompt: string;
    setInitialPrompt: (prompt: string) => void;
    setInitialImage: (file: File | null) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    hasContent: boolean;
    onExport: () => void;
    selectedViewpoints: string[];
    setSelectedViewpoints: (viewpoints: string[]) => void;
    generateAnimation: boolean;
    setGenerateAnimation: (generate: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({
    spriteSize, setSpriteSize, frameCount, setFrameCount,
    initialPrompt, setInitialPrompt, setInitialImage,
    onGenerate, isGenerating, hasContent, onExport,
    selectedViewpoints, setSelectedViewpoints, generateAnimation, setGenerateAnimation
}) => {
    
    const allViewpoints = ['front', 'back', 'left', 'right'];

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setInitialImage(e.target.files[0]);
        }
    };

    const handleViewpointChange = (viewpoint: string) => {
        const newSelection = selectedViewpoints.includes(viewpoint)
            ? selectedViewpoints.filter(v => v !== viewpoint)
            : [...selectedViewpoints, viewpoint];
        setSelectedViewpoints(newSelection);
    };
    
    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold text-cyan-400 border-b border-gray-600 pb-2">Generation Controls</h2>
            
            <div className="grid grid-cols-2 gap-4">
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
                    <label htmlFor="frameCount" className="block text-sm font-medium text-gray-300 mb-1">Anim Frames</label>
                    <input
                        type="number"
                        id="frameCount"
                        value={frameCount}
                        onChange={(e) => setFrameCount(parseInt(e.target.value, 10))}
                        className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-700 disabled:text-gray-400"
                        min="1"
                        max="16"
                        disabled={!generateAnimation}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="initialPrompt" className="block text-sm font-medium text-gray-300 mb-1">Character Description</label>
                <textarea
                    id="initialPrompt"
                    rows={4}
                    value={initialPrompt}
                    onChange={(e) => setInitialPrompt(e.target.value)}
                    placeholder="e.g., A brave knight with shiny silver armor and a red cape"
                    className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
            </div>

            <div>
                <label htmlFor="initialImage" className="block text-sm font-medium text-gray-300 mb-1">...or Upload Reference Image</label>
                <label className="w-full flex items-center justify-center gap-2 bg-[#282c34] text-gray-300 p-2 rounded-md border-2 border-dashed border-gray-600 cursor-pointer hover:bg-gray-700 hover:border-cyan-500">
                    <UploadIcon />
                    <span>Choose File</span>
                    <input id="initialImage" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
            </div>
            
            <div className="border-t border-gray-600 pt-4 flex flex-col gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">1. Select Viewpoints</label>
                    <div className="grid grid-cols-2 gap-2">
                        {allViewpoints.map(vp => (
                            <label key={vp} className="flex items-center space-x-2 text-sm cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedViewpoints.includes(vp)}
                                    onChange={() => handleViewpointChange(vp)}
                                    className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-cyan-600 focus:ring-cyan-500"
                                />
                                <span>{vp.charAt(0).toUpperCase() + vp.slice(1)}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">2. Animate?</label>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer">
                        <input
                            type="checkbox"
                            checked={generateAnimation}
                            onChange={(e) => setGenerateAnimation(e.target.checked)}
                            className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-cyan-600 focus:ring-cyan-500"
                        />
                        <span>Generate Animation Frames</span>
                    </label>
                </div>
            </div>

            <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            >
                <GenerateIcon />
                {isGenerating ? 'Generating...' : 'Generate Sprite Sheet'}
            </button>
            
            {hasContent && (
                 <button
                    onClick={onExport}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    <ExportIcon />
                    Export as PNG
                </button>
            )}
        </div>
    );
};

export default Controls;
