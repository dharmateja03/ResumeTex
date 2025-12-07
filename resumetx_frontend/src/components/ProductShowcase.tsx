import React, { useState } from 'react';
import { GitBranch, Sparkles, Command, Mail, FileText, CheckCircle2, Clock, ChevronRight, PenTool } from 'lucide-react';

const tabs = [
    {
        id: 'generation',
        label: 'AI Generation',
        icon: Sparkles,
        description: 'Transform bullet points into executive summaries in seconds.',
        color: 'text-indigo-500'
    },
    {
        id: 'history',
        label: 'Version History',
        icon: GitBranch,
        description: 'Auto-save every job description and its optimized resume version.',
        color: 'text-blue-500'
    },
    {
        id: 'instructions',
        label: 'Custom Rules',
        icon: Command,
        description: 'Tell the AI exactly what to emphasize or avoid.',
        color: 'text-purple-500'
    },
    {
        id: 'suite',
        label: 'Full Suite',
        icon: Mail,
        description: 'Generate tailored Cover Letters and Cold Emails instantly.',
        color: 'text-emerald-500'
    }
];

export const ProductShowcase: React.FC = () => {
    const [activeTab, setActiveTab] = useState('generation');

    return (
        <section className="py-24 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900 dark:text-white font-display">
                        Complete Application Control
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        Everything you need to manage your job search like a software project.
                    </p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex flex-wrap justify-center gap-4 mb-12">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 border
                                    ${isActive
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-lg scale-105'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }
                                `}
                            >
                                <Icon size={16} className={isActive ? 'text-current' : tab.color} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Main Content Window */}
                <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-2xl overflow-hidden min-h-[500px] transition-colors duration-300">
                    {/* Window Header */}
                    <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center px-4 gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                        </div>
                        <div className="mx-auto text-xs font-mono text-slate-400 dark:text-slate-600 flex items-center gap-1">
                            <span className="opacity-50">resumetex-app</span> / <span className="text-slate-600 dark:text-slate-400 font-bold">{activeTab}</span>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-8 h-full flex items-center justify-center">

                        {/* 1. AI Generation View */}
                        {activeTab === 'generation' && (
                            <div className="w-full max-w-4xl animate-fade-in flex flex-col gap-4">

                                {/* Status Indicator */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-3 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-400 gap-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={16} />
                                        <span>Format & Layout Structure Preserved</span>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-75">
                                        <Clock size={16} />
                                        <span>Time elapsed: 1.4s</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Original Input</h4>
                                        </div>
                                        <div className="bg-white dark:bg-slate-950 p-6 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm font-mono text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                                            - Worked on backend API<br/>
                                            - Fixed bugs in database<br/>
                                            - Made site faster<br/>
                                            - Used React and Node
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-2">
                                                <Sparkles size={14} /> Optimized Output
                                            </h4>
                                        </div>
                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-6 rounded-lg border border-indigo-100 dark:border-indigo-500/20 shadow-sm font-sans text-sm text-slate-800 dark:text-slate-200 leading-relaxed relative">
                                            <ul className="space-y-3 list-disc pl-4">
                                                <li><span className="bg-green-200/50 dark:bg-green-500/20 px-1 rounded">Engineered scalable REST APIs</span> serving 10k+ daily users, improving response time by 40%.</li>
                                                <li><span className="bg-green-200/50 dark:bg-green-500/20 px-1 rounded">Optimized PostgreSQL queries</span> resulting in a 25% reduction in infrastructure costs.</li>
                                                <li>Spearheaded frontend migration to React, enhancing user retention metrics.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Version History View */}
                        {activeTab === 'history' && (
                            <div className="w-full max-w-2xl animate-fade-in">
                                <div className="space-y-6">
                                    {[
                                        { role: 'Product Manager @ Google', time: '2 mins ago', status: 'current' },
                                        { role: 'Product Manager @ Amazon', time: '2 days ago', status: 'saved' },
                                        { role: 'Software Engineer (General)', time: '1 week ago', status: 'saved' }
                                    ].map((item, i) => (
                                        <div key={i} className={`flex gap-4 group cursor-pointer ${item.status === 'current' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}>
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full border-2 ${item.status === 'current' ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-300 dark:border-slate-600'}`}></div>
                                                {i !== 2 && <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 my-1"></div>}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="bg-white dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div>
                                                            <h4 className="font-bold text-slate-900 dark:text-white">{item.role}</h4>
                                                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                                <Clock size={12} /> {item.time}
                                                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                                                <span className="font-mono">v1.0.{2-i}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 transition-colors group-hover:border-blue-200 dark:group-hover:border-blue-900/30">
                                                        <FileText size={14} className="text-slate-400 shrink-0" />
                                                        <div className="flex-1 truncate">
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Archived Job Description</span>
                                                            <span className="text-[10px] text-slate-400 block">Saved for reference</span>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-wide">View JD</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Custom Instructions View */}
                        {activeTab === 'instructions' && (
                            <div className="w-full max-w-3xl animate-fade-in">
                                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded text-purple-600 dark:text-purple-400">
                                            <Command size={18} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Global Instructions</h4>
                                            <p className="text-xs text-slate-500">These rules apply to every generation.</p>
                                        </div>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Custom Prompt</label>
                                            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-mono text-slate-700 dark:text-slate-300">
                                                "Always emphasize my leadership experience in scalable systems.
                                                Never use the word 'assisted', use 'spearheaded' or 'led' instead.
                                                Keep bullet points under 2 lines."
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded w-fit">
                                            <CheckCircle2 size={14} />
                                            Active for next generation
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 4. Full Suite View */}
                        {activeTab === 'suite' && (
                            <div className="w-full max-w-4xl animate-fade-in flex gap-6">
                                {/* Resume Preview (Mini) */}
                                <div className="hidden md:block w-1/3 opacity-50 scale-90 origin-right">
                                    <div className="bg-white dark:bg-slate-800 h-64 rounded-lg border border-slate-200 dark:border-slate-700 p-4 space-y-2 overflow-hidden grayscale">
                                        <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-600 rounded mb-4"></div>
                                        <div className="space-y-1">
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded"></div>
                                            <div className="h-2 w-5/6 bg-slate-100 dark:bg-slate-700 rounded"></div>
                                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded"></div>
                                        </div>
                                    </div>
                                    <p className="text-center text-xs mt-2 text-slate-400">Resume.pdf</p>
                                </div>

                                {/* Active Email/Cover Letter */}
                                <div className="flex-1 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 relative">
                                    <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        Generated in 1.2s
                                    </div>
                                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                                        <div className="flex gap-2">
                                            <button className="px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-300">Cover Letter</button>
                                            <button className="px-3 py-1 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">Cold Email</button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 font-sans text-sm text-slate-600 dark:text-slate-300">
                                        <p>Subject: <span className="text-slate-900 dark:text-white font-medium">Application for Senior Backend Engineer - ResumeTeX</span></p>
                                        <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>
                                        <p>Hi [Hiring Manager],</p>
                                        <p>
                                            I've been following ResumeTeX's growth in the AI space and was impressed by the recent AST parser update.
                                        </p>
                                        <p>
                                            With 5 years of experience scaling Node.js architectures at [Previous Co], I believe I can help...
                                        </p>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 mt-4 flex items-center gap-2 text-xs text-slate-400">
                                            <PenTool size={12} />
                                            <span>AI generated based on job description context</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};
