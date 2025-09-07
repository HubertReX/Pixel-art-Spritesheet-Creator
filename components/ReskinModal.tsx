
import React, { useState } from 'react';

interface ReskinModalProps {
    isOpen: boolean;
    onConfirm: (prompt: string) => void;
    onClose: () => void;
}

const ReskinModal: React.FC<ReskinModalProps> = ({ isOpen, onConfirm, onClose }) => {
    const [prompt, setPrompt] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (prompt.trim()) {
            onConfirm(prompt);
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-[#3a3f4a] p-6 rounded-md border border-gray-600 shadow-lg max-w-lg w-full mx-4 flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-cyan-400">Reskin Spritesheet</h2>
                <p className="text-sm text-gray-300">
                    Enter a prompt to apply a consistent change across all sprites in this sheet. 
                    This will create a <span className="font-semibold text-yellow-400">new, duplicated design</span> and may use a significant number of API calls.
                </p>
                <div>
                    <label htmlFor="reskinPrompt" className="block text-sm font-medium text-gray-300 mb-1">Reskin Instruction</label>
                    <textarea
                        id="reskinPrompt"
                        rows={3}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="e.g., make the armor golden, change character to a female version, add a pirate hat"
                        className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        autoFocus
                    />
                     <p className="text-xs text-gray-500 text-right mt-1">Ctrl+Enter to submit</p>
                </div>
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors font-semibold"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!prompt.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                        Start Reskin
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReskinModal;
