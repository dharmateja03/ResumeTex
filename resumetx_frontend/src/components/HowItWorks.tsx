import React from 'react';
import { Upload, Wand2, Download } from 'lucide-react';
import { Button } from './Button';

export function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-slate-950 relative border-y border-slate-100 dark:border-slate-900 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white font-display">Optimizing is as easy as 1-2-3</h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                        No complex setup. Just upload, optimize, and apply.
                    </p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-10 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
                        {/* Step 1 */}
                        <div className="text-center">
                            <div className="relative inline-block bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
                                <div className="h-20 w-20 mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors">
                                    <Upload className="h-8 w-8 text-slate-700 dark:text-slate-300" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Upload Resume</h3>
                            <p className="text-slate-500 dark:text-slate-400">Import your existing PDF or Word resume, or start from scratch with our templates.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center">
                            <div className="relative inline-block bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
                                <div className="h-20 w-20 mx-auto bg-slate-900 dark:bg-white border border-slate-900 dark:border-white rounded-2xl flex items-center justify-center mb-6 shadow-lg transition-colors">
                                    <Wand2 className="h-8 w-8 text-white dark:text-slate-900" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">AI Optimization</h3>
                            <p className="text-slate-500 dark:text-slate-400">Paste the job description. Our AI tailors your resume instantly for the specific role.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center">
                             <div className="relative inline-block bg-slate-50 dark:bg-slate-950 px-4 transition-colors">
                                <div className="h-20 w-20 mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors">
                                    <Download className="h-8 w-8 text-slate-700 dark:text-slate-300" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Download & Apply</h3>
                            <p className="text-slate-500 dark:text-slate-400">Export as a perfectly formatted PDF and start getting calls from recruiters.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Button href="/signup" size="lg">Start Optimizing for Free</Button>
                </div>
            </div>
        </section>
    );
}
