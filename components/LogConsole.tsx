import React, { useState, useEffect, useRef } from 'react';

interface Log {
    timestamp: string;
    message: string;
}

interface LogConsoleProps {
    logs: Log[];
}

const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
    const [isOpen, setIsOpen] = useState(false);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, isOpen]);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#1e2128] text-gray-300 p-2 text-left font-mono text-sm hover:bg-gray-700 flex items-center gap-2"
                aria-expanded={isOpen}
                aria-controls="log-panel"
            >
                <span className="transform transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                <span>Console ({logs.length})</span>
            </button>
            {isOpen && (
                <div 
                    id="log-panel"
                    ref={logContainerRef} 
                    className="bg-black bg-opacity-90 text-white p-4 h-48 overflow-y-auto font-mono text-xs border-t-2 border-cyan-500"
                >
                    {logs.map((log, index) => (
                        <div key={index} className="mb-2 last:mb-0">
                            <span className="text-green-400">{log.timestamp}: </span>
                            <span className="text-gray-300 whitespace-pre-wrap">{log.message}</span>
                        </div>
                    ))}
                     {logs.length === 0 && <p className="text-gray-500">No logs yet. Generate a character to see prompt details.</p>}
                </div>
            )}
        </div>
    );
};

export default LogConsole;
