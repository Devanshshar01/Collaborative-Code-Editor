import React from 'react';
import GridMotion from './GridMotion/GridMotion';
import { Code2, ArrowRight } from 'lucide-react';

const LandingPage = ({ onEnter }) => {
    const items = [
        'React', 'Vite', 'Tailwind', 'Node.js', 'Socket.io', 'Yjs', 'WebRTC',
        'Collaborate', 'Real-time', 'Code', 'Share', 'Build', 'Deploy', 'Scale',
        'JavaScript', 'TypeScript', 'HTML', 'CSS', 'MongoDB', 'Express', 'Docker',
        'Git', 'GitHub', 'VS Code', 'Atom', 'Sublime', 'Vim', 'Emacs'
    ];

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black text-white">
            <div className="absolute inset-0 z-0 opacity-50">
                <GridMotion items={items} gradientColor="#1a1a1a" />
            </div>

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center space-y-6 pointer-events-auto p-8 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <div className="p-3 bg-primary/20 rounded-xl">
                            <Code2 className="w-10 h-10 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Collaborative Editor
                    </h1>

                    <p className="text-lg text-gray-400 max-w-md mx-auto">
                        Real-time collaboration, video chat, and whiteboard.
                        Build together, anywhere.
                    </p>

                    <button
                        onClick={onEnter}
                        className="group relative inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary-hover text-white rounded-full font-semibold text-lg transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105"
                    >
                        Start Coding
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
