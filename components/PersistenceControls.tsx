import React, { useState, useRef } from 'react';
import { Design } from '../types';
import { SaveIcon, PlusIcon, TrashIcon, FolderOpenIcon, CheckIcon, UploadIcon, ExportIcon } from './icons';

interface PersistenceControlsProps {
    designs: Design[];
    currentDesignId: string | null;
    designName: string;
    setDesignName: (name: string) => void;
    onSave: () => void;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    onNew: () => void;
    onExport: (id: string) => void;
    onImport: (file: File) => void;
    saveSuccess: boolean;
}

const PersistenceControls: React.FC<PersistenceControlsProps> = ({
    designs, currentDesignId, designName, setDesignName,
    onSave, onLoad, onDelete, onNew, onExport, onImport, saveSuccess
}) => {
    const [isListOpen, setIsListOpen] = useState(false);
    const importInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        importInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImport(e.target.files[0]);
            // Reset the input value to allow importing the same file again
            e.target.value = '';
        }
    };

    return (
        <div className="bg-[#3a3f4a] p-4 rounded-md border border-gray-600 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-cyan-400 border-b border-gray-600 pb-2">Designs</h2>
            <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={designName}
                    onChange={(e) => setDesignName(e.target.value)}
                    placeholder="[Create a character to begin]"
                    className="w-full bg-[#282c34] text-white p-2 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none disabled:bg-gray-700 disabled:text-gray-500"
                    disabled={!currentDesignId}
                    aria-label="Design Name"
                />
                <button
                    onClick={onSave}
                    disabled={!currentDesignId}
                    title="Save Design"
                    className={`p-2 text-white rounded-md transition-colors ${
                        saveSuccess
                            ? 'bg-green-600'
                            : 'bg-cyan-600 hover:bg-cyan-700'
                    } disabled:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label="Save Design"
                >
                    {saveSuccess ? <CheckIcon /> : <SaveIcon />}
                </button>
                 <button
                    onClick={handleImportClick}
                    title="Import Design"
                    className="p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    aria-label="Import Design"
                >
                    <UploadIcon />
                </button>
                 <input
                    type="file"
                    ref={importInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                />
                <button
                    onClick={onNew}
                    title="New Design"
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    aria-label="New Design"
                >
                    <PlusIcon />
                </button>
            </div>

            <div>
                <button
                    onClick={() => setIsListOpen(!isListOpen)}
                    className="w-full text-left text-sm font-medium p-2 bg-[#282c34] rounded-md hover:bg-gray-700 flex justify-between items-center"
                    aria-expanded={isListOpen}
                >
                    <span>Saved Designs ({designs.length})</span>
                    <span className={`transform transition-transform ${isListOpen ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {isListOpen && (
                    <ul className="mt-2 bg-[#282c34] p-2 rounded-md max-h-48 overflow-y-auto border border-gray-600">
                        {designs.length > 0 ? (
                            designs.map(d => (
                                <li key={d.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-700">
                                    <span className="text-sm truncate" title={d.name}>{d.name}</span>
                                    <div className="flex gap-2 items-center flex-shrink-0">
                                        <button onClick={() => onExport(d.id)} title="Export" className="text-gray-300 hover:text-green-400" aria-label={`Export ${d.name}`}>
                                            <ExportIcon />
                                        </button>
                                        <button onClick={() => onLoad(d.id)} title="Load" className="text-gray-300 hover:text-cyan-400" aria-label={`Load ${d.name}`}>
                                            <FolderOpenIcon />
                                        </button>
                                        <button onClick={() => onDelete(d.id)} title="Delete" className="text-gray-300 hover:text-red-400" aria-label={`Delete ${d.name}`}>
                                            <TrashIcon />
                                        </button>
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="text-gray-500 p-2 text-sm">No saved designs.</li>
                        )}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PersistenceControls;