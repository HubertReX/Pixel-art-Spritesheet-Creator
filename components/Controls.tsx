
import React from 'react';
import { GenerateIcon, ExportIcon } from './icons';

interface ControlsProps {
    spriteSize: number;
    setSpriteSize: (size: number) => void;
    frameCount: number;
    setFrameCount: (count: number) => void;
    onGenerate: () => void;
    isGenerating: boolean;
    hasContent: boolean;
    onExport: () => void;
    selectedViewpoints: string[];
    setSelectedViewpoints: (viewpoints: string[]) => void;
    generateAnimation: boolean;
    setGenerateAnimation: (generate: boolean) => void;
    animationType: string;
    setAnimationType: (type: string) => void;
    onBack: () => void;
    baseCharacterPreview: string;
    previewZoom: number;
    setPreviewZoom: (zoom: number) => void;
}

const Controls: React.FC<ControlsProps> = ({
    spriteSize, setSpriteSize, frameCount, setFrameCount,
    onGenerate, isGenerating, hasContent, onExport,
    selectedViewpoints, setSelectedViewpoints, generateAnimation, setGenerateAnimation,
    animationType, setAnimationType, onBack, baseCharacterPreview,
    previewZoom, setPreviewZoom
}) => {
    
    const allViewpoints = ['front', 'back', 'left', 'right'];

    const handleViewpointChange = (viewpoint: string) => {
        const newSelection = selectedViewpoints.includes(viewpoint)
            ? selectedViewpoints.filter(v => v !== viewpoint)
            : [...selectedViewpoints, viewpoint];
        setSelectedViewpoints(newSelection);
    };

    const handleSelectAll = () => setSelectedViewpoints(allViewpoints);
    const handleDeselectAll = () => setSelectedViewpoints([]);
    
    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-gray-600 pb-2">
                <h2 className="text-lg font-bold text-cyan-400">2. Generate Sprite Sheet</h2>
                <button onClick={onBack} className="text-sm text-cyan-400 hover:text-cyan-200">&larr; Back to Design</button>
            </div>
            
            <div className="flex flex-col items-center gap-2 bg-[#282c34] p-2 rounded-md">
                <p className="text-sm font-medium text-gray-300">Base Character:</p>
                <div className="w-48 h-48 checkerboard rounded-md overflow-hidden relative border-2 border-gray-500">
                     <img
                        src={baseCharacterPreview}
                        alt="Base Character Preview"
                        className="transform-gpu absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            width: `${spriteSize * previewZoom}px`,
                            height: `${spriteSize * previewZoom}px`,
                            imageRendering: 'pixelated'
                        }}
                    />
                </div>
                <div className="w-full max-w-xs flex items-center gap-2 px-1">
                    <label htmlFor="preview-zoom-slider" className="text-xs font-medium text-gray-300 whitespace-nowrap">Zoom</label>
                    <input
                        id="preview-zoom-slider"
                        type="range"
                        min="1"
                        max="16"
                        step="1"
                        value={previewZoom}
                        onChange={(e) => setPreviewZoom(Number(e.target.value))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                    <span className="text-xs font-medium text-gray-300 w-8 text-center">{previewZoom}x</span>
                </div>
            </div>
            
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

            <div className="border-t border-gray-600 pt-4 flex flex-col gap-4">
                 <div>
                    <div className="flex justify-between items-baseline mb-2">
                        <label className="text-sm font-medium text-gray-300">A. Select Viewpoints</label>
                        <div className="text-xs">
                            <button onClick={handleSelectAll} className="text-cyan-400 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-sm px-1">all</button>
                            <span className="text-gray-500 mx-1">/</span>
                            <button onClick={handleDeselectAll} className="text-cyan-400 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-sm px-1">none</button>
                        </div>
                    </div>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">B. Animate?</label>
                    <div className="space-y-3">
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={generateAnimation}
                                onChange={(e) => setGenerateAnimation(e.target.checked)}
                                className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-cyan-600 focus:ring-cyan-500"
                            />
                            <span>Generate Animation Frames</span>
                        </label>
                        
                        <input
                            type="text"
                            id="animationType"
                            aria-label="Animation type"
                            value={animationType}
                            onChange={(e) => setAnimationType(e.target.value)}
                            placeholder="Animation type (e.g. walk, run)"
                            className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-700 disabled:text-gray-400"
                            disabled={!generateAnimation}
                        />
                    </div>
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
