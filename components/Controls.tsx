

import React from 'react';
import { PlusIcon, MinusIcon, ChevronDownIcon } from './icons';
import { AnimationPose } from '../types';

interface ControlsProps {
    spriteSize: number;
    setSpriteSize: (size: number) => void;
    frameCount: number;
    setFrameCount: (count: number) => void;
    animationPoses: AnimationPose[];
    setAnimationPoses: (poses: AnimationPose[]) => void;
    generateAnimation: boolean;
    setGenerateAnimation: (generate: boolean) => void;
    animationType: string;
    setAnimationType: (type: string) => void;
    onBack: () => void;
    baseCharacterPreview: string;
    previewZoom: number;
    setPreviewZoom: (zoom: number) => void;
    onRemovePose: (id: string) => void;
    expandedPoseIds: string[];
    setExpandedPoseIds: (ids: React.SetStateAction<string[]>) => void;
    isAnimationExpanded: boolean;
    setIsAnimationExpanded: (isExpanded: boolean) => void;
}

const Controls: React.FC<ControlsProps> = ({
    spriteSize, setSpriteSize, frameCount, setFrameCount,
    animationPoses, setAnimationPoses, generateAnimation, setGenerateAnimation,
    animationType, setAnimationType, onBack, baseCharacterPreview,
    previewZoom, setPreviewZoom, onRemovePose, expandedPoseIds, setExpandedPoseIds,
    isAnimationExpanded, setIsAnimationExpanded
}) => {
    
    const allViewpoints = ['front', 'back', 'left', 'right'];

    const handlePoseNameChange = (id: string, newName: string) => {
        setAnimationPoses(animationPoses.map(pose => 
            pose.id === id ? { ...pose, name: newName } : pose
        ));
    };

    const handlePosePromptChange = (id: string, newPrompt: string) => {
        setAnimationPoses(animationPoses.map(pose => 
            pose.id === id ? { ...pose, prompt: newPrompt } : pose
        ));
    };

    const handleViewpointChange = (poseId: string, viewpoint: string) => {
        setAnimationPoses(animationPoses.map(pose => {
            if (pose.id === poseId) {
                const newSelection = pose.viewpoints.includes(viewpoint)
                    ? pose.viewpoints.filter(v => v !== viewpoint)
                    : [...pose.viewpoints, viewpoint];
                return { ...pose, viewpoints: newSelection };
            }
            return pose;
        }));
    };

    const handleSelectAll = (poseId: string) => {
         setAnimationPoses(animationPoses.map(pose => 
            pose.id === poseId ? { ...pose, viewpoints: allViewpoints } : pose
        ));
    };

    const handleDeselectAll = (poseId: string) => {
        setAnimationPoses(animationPoses.map(pose => 
            pose.id === poseId ? { ...pose, viewpoints: [] } : pose
        ));
    };

    const handleAddPose = () => {
        const newPoseId = Date.now().toString();
        const newPose: AnimationPose = {
            id: newPoseId,
            name: 'Attack',
            prompt: 'A dynamic attack pose, swinging a weapon.',
            viewpoints: ['front'],
        };
        setAnimationPoses([...animationPoses, newPose]);
        setExpandedPoseIds(prev => [...prev, newPoseId]);
    };

    const handleRemovePose = (id: string) => {
        onRemovePose(id);
    };

    const togglePoseExpansion = (id: string) => {
        setExpandedPoseIds(prev =>
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const toggleAnimationExpansion = () => {
        setIsAnimationExpanded(!isAnimationExpanded);
    };
    
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
                            objectFit: 'contain',
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

            <div className="border-t border-gray-600 pt-4 flex flex-col gap-4">
                <h3 className="text-base font-bold text-gray-300">A. Define Poses</h3>
                <div className="flex flex-col gap-2">
                    {animationPoses.map((pose, index) => {
                        const isExpanded = expandedPoseIds.includes(pose.id);
                        return (
                            <div key={pose.id} className="bg-[#282c34] p-3 rounded-md border border-gray-600 flex flex-col gap-3 transition-all">
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => togglePoseExpansion(pose.id)}
                                    aria-expanded={isExpanded}
                                >
                                    <input
                                        type="text"
                                        value={pose.name}
                                        onChange={(e) => handlePoseNameChange(pose.id, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-transparent text-white font-semibold focus:outline-none focus:bg-gray-800 rounded px-1 -ml-1 w-full"
                                        aria-label={`Pose name for pose ${index + 1}`}
                                        disabled={index === 0}
                                    />
                                    <div className="flex items-center">
                                        {index > 0 && ( // Only show remove button for non-default poses
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleRemovePose(pose.id); }} 
                                                title="Remove Pose" 
                                                className="text-red-400 hover:text-red-300 p-1 ml-2"
                                            >
                                                <MinusIcon />
                                            </button>
                                        )}
                                        <ChevronDownIcon className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <>
                                        {index > 0 && (
                                            <div className="flex flex-col gap-1">
                                                <label htmlFor={`pose-prompt-${pose.id}`} className="text-sm font-medium text-gray-300">Pose Prompt (for AI)</label>
                                                <textarea
                                                    id={`pose-prompt-${pose.id}`}
                                                    rows={2}
                                                    value={pose.prompt || ''}
                                                    onChange={(e) => handlePosePromptChange(pose.id, e.target.value)}
                                                    placeholder="e.g., swinging a heavy two-handed axe"
                                                    className="w-full bg-gray-800 text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                                                />
                                            </div>
                                        )}

                                        <div>
                                            <div className="flex justify-between items-baseline mb-2">
                                                <label className="text-sm font-medium text-gray-300">Select Viewpoints</label>
                                                <div className="text-xs">
                                                    <button onClick={() => handleSelectAll(pose.id)} className="text-cyan-400 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-sm px-1">all</button>
                                                    <span className="text-gray-500 mx-1">/</span>
                                                    <button onClick={() => handleDeselectAll(pose.id)} className="text-cyan-400 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-sm px-1">none</button>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {allViewpoints.map(vp => (
                                                    <label key={vp} className="flex items-center space-x-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={pose.viewpoints.includes(vp)}
                                                            onChange={() => handleViewpointChange(pose.id, vp)}
                                                            className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-cyan-600 focus:ring-cyan-500"
                                                        />
                                                        <span>{vp.charAt(0).toUpperCase() + vp.slice(1)}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )
                    })}
                    <button onClick={handleAddPose} className="w-full flex items-center justify-center gap-2 text-sm bg-gray-600 hover:bg-gray-700 text-cyan-300 font-bold py-2 px-4 rounded-md transition-colors">
                        <PlusIcon/> Add Pose
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-600 pt-4 flex flex-col gap-2">
                <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={toggleAnimationExpansion}
                    aria-expanded={isAnimationExpanded}
                >
                    <h3 className="text-base font-bold text-gray-300">B. Animate?</h3>
                    <ChevronDownIcon className={`transform transition-transform duration-200 ${isAnimationExpanded ? 'rotate-180' : ''}`} />
                </div>
                {isAnimationExpanded && (
                     <div className="space-y-3 pt-2">
                        <label className="flex items-center space-x-2 text-sm cursor-pointer">
                            <input
                                type="checkbox"
                                checked={generateAnimation}
                                onChange={(e) => setGenerateAnimation(e.target.checked)}
                                className="h-4 w-4 bg-gray-800 border-gray-600 rounded text-cyan-600 focus:ring-cyan-500"
                            />
                            <span>Generate Animation Frames</span>
                        </label>
                        <div className="grid grid-cols-2 gap-4">
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
                            <div>
                            <label htmlFor="animationType" className="block text-sm font-medium text-gray-300 mb-1">Animation Type</label>
                                <input
                                    type="text"
                                    id="animationType"
                                    aria-label="Animation type"
                                    value={animationType}
                                    onChange={(e) => setAnimationType(e.target.value)}
                                    placeholder="e.g. walk, run"
                                    className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-700 disabled:text-gray-400"
                                    disabled={!generateAnimation}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Controls;