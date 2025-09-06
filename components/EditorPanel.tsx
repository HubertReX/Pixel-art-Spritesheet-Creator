import React, { useState } from 'react';
import { Sprite } from '../types';
import { EditIcon } from './icons';

interface EditorPanelProps {
    sprite: Sprite;
    onEdit: (prompt: string) => void;
    onClose: () => void;
    isEditing: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ sprite, onEdit, onClose, isEditing }) => {
    const [editPrompt, setEditPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onEdit(editPrompt);
        setEditPrompt('');
    };

    return (
        <div className="border-t-2 border-cyan-500 mt-4 pt-4 flex flex-col gap-4">
             <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-cyan-400">Edit Sprite</h2>
                <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
            </div>
            
            <div className="flex justify-center p-2 bg-[#282c34] rounded-md checkerboard">
                <img src={sprite.previewUrl} alt="Selected Sprite" className="w-24 h-24" style={{ imageRendering: 'pixelated' }} />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <label htmlFor="editPrompt" className="block text-sm font-medium text-gray-300">Edit Instruction</label>
                <textarea
                    id="editPrompt"
                    rows={3}
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="e.g., change the cape color to blue"
                    className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
                <button
                    type="submit"
                    disabled={isEditing || !editPrompt}
                    className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    <EditIcon />
                    {isEditing ? 'Applying Edit...' : 'Regenerate Sprite'}
                </button>
            </form>
        </div>
    );
};

export default EditorPanel;