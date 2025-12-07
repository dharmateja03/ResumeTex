import React, { useRef, useState } from 'react';
import { FileCode, Key, History, Mail, FileText, Send, Layers } from 'lucide-react';

// --- 3D Tilt Card Component ---
interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = "" }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Calculate rotation (max 10 degrees)
        const rX = ((mouseY / height) - 0.5) * -5; // Reduced tilt for subtler effect
        const rY = ((mouseX / width) - 0.5) * 5;

        setRotation({ x: rX, y: rY });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
    };

    return (
        <div
            className={`perspective-1000 ${className}`}
            style={{ perspective: '1000px' }}
        >
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: isHovered
                        ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.01, 1.01, 1.01)`
                        : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                    transition: 'transform 0.2s ease-out'
                }}
                className="h-full w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-black/20 p-8 flex flex-col relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition-colors duration-300"
            >
                {children}
            </div>
        </div>
    );
};

// --- CSS for the rotating cube animation ---
const styles = `
@keyframes spin-slow {
  from { transform: rotateX(0deg) rotateY(0deg); }
  to { transform: rotateX(360deg) rotateY(360deg); }
}
.cube-spinner {
  animation: spin-slow 20s linear infinite;
  transform-style: preserve-3d;
}
`;

export function Features() {
    return (
        <section id="features" className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
            <style>{styles}</style>

            {/* Minimal Grid Background */}
            <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
            {/* Dark mode grid overlay to invert color if needed, or just let opacity handle it.
                For dark mode, white lines look better. */}
            <div className="absolute inset-0 z-0 opacity-0 dark:opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="mb-20">
                    <h2 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white tracking-tighter mb-6 font-display">
                        Engineered for Applications.
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl font-light">
                        A complete suite for the technical job seeker. <br/>
                        Track history, bring your own keys, and generate everything in one click.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[600px]">

                    {/* Feature 1: The Engine (LaTeX) - Large Card */}
                    <div className="lg:col-span-7 h-full">
                        <TiltCard className="h-full">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
                                    <FileCode className="h-6 w-6 text-slate-900 dark:text-white" />
                                </div>
                                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded transition-colors">AST_PARSER_V2</span>
                            </div>

                            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Native LaTeX Core</h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
                                We treat your resume as code. Our engine parses the Abstract Syntax Tree of your .tex file, injecting optimization vectors without breaking your compilation pipeline.
                            </p>

                            {/* 3D Wireframe Visual */}
                            <div className="absolute right-[-50px] bottom-[-50px] w-64 h-64 md:w-80 md:h-80 opacity-10 dark:opacity-20 pointer-events-none">
                                <div className="relative w-full h-full cube-spinner">
                                    <div className="absolute inset-0 border-2 border-slate-900 dark:border-white transform translate-z-10"></div>
                                    <div className="absolute inset-0 border-2 border-slate-900 dark:border-white transform rotate-y-90 translate-z-10"></div>
                                    <div className="absolute inset-0 border-2 border-slate-900 dark:border-white transform rotate-x-90 translate-z-10"></div>
                                </div>
                            </div>

                            {/* Code Snippet Visual */}
                            <div className="mt-auto bg-slate-900 dark:bg-black rounded-lg p-4 font-mono text-xs text-slate-400 shadow-2xl transform translate-x-4 translate-y-4 border border-slate-800 dark:border-slate-800">
                                <div className="flex gap-1.5 mb-3">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                </div>
                                <div className="space-y-1">
                                    <p><span className="text-purple-400">const</span> <span className="text-blue-400">compile</span> = (tex) ={'>'} {'{'}</p>
                                    <p className="pl-4 text-slate-500">// Preserving structure...</p>
                                    <p className="pl-4">return <span className="text-yellow-400">pdflatex</span>(tex, flags);</p>
                                    <p>{'}'}</p>
                                </div>
                            </div>
                        </TiltCard>
                    </div>

                    {/* Right Column Grid */}
                    <div className="lg:col-span-5 grid grid-rows-3 gap-6 h-full">

                        {/* Feature 2: History & Tracking */}
                        <TiltCard className="row-span-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <History className="h-4 w-4 text-slate-400" />
                                        <h4 className="font-bold text-slate-900 dark:text-white">Application History</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">Save job descriptions and track every tailored version.</p>
                                </div>
                                {/* Mini UI Visual */}
                                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded p-2 w-24 space-y-1 opacity-80 transition-colors">
                                    <div className="h-1.5 w-12 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                                    <div className="h-1.5 w-16 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                                    <div className="h-1.5 w-10 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                                </div>
                            </div>
                        </TiltCard>

                         {/* Feature 3: One Click Suite */}
                         <TiltCard className="row-span-1">
                             <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Layers className="h-4 w-4 text-slate-400" />
                                        <h4 className="font-bold text-slate-900 dark:text-white">One-Click Suite</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Auto-generate Resume, Cover Letter, and Cold Email.</p>
                                </div>
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-white dark:border-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"><FileText size={14}/></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-900 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors"><Mail size={14}/></div>
                                    <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white border border-white dark:border-slate-900 flex items-center justify-center text-white dark:text-slate-900 transition-colors"><Send size={14}/></div>
                                </div>
                             </div>
                        </TiltCard>

                        {/* Feature 4: BYO Key */}
                        <TiltCard className="row-span-1">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Key className="h-4 w-4 text-slate-400" />
                                        <h4 className="font-bold text-slate-900 dark:text-white">BYO API Key</h4>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Free forever. Use your own OpenAI/Anthropic key.</p>
                                </div>
                                <div className="bg-slate-900 dark:bg-black rounded px-2 py-1 h-fit border dark:border-slate-800">
                                    <span className="text-[10px] font-mono text-green-400">sk-...48x</span>
                                </div>
                            </div>
                        </TiltCard>

                    </div>
                </div>
            </div>
        </section>
    );
}
