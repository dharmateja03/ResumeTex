import React from 'react';
import { FileText, Twitter, Linkedin, Github } from 'lucide-react';

export function Footer() {
    return (
        <footer className="relative pt-32 pb-10 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
            {/* Gradient Fade In - Blends from theme background to dark slate */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50 dark:from-slate-950 via-slate-900/90 to-slate-900 pointer-events-none -z-10 transition-colors duration-300"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-1">
                        <a href="#" className="flex items-center space-x-2 mb-4">
                            <FileText className="text-white h-6 w-6" />
                            <span className="text-xl font-bold text-white">ResumeTeX</span>
                        </a>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Free ATS resume checker and AI-powered resume optimizer. Check your ATS score instantly, optimize for Applicant Tracking Systems, and land more interviews.
                        </p>

                        {/* Social Links */}
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Linkedin size={20} /></a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors"><Github size={20} /></a>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Free Tools</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="#ats-checker" className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium">Free ATS Checker</a></li>
                            <li><a href="#ats-checker" className="hover:text-white transition-colors">ATS Score Test</a></li>
                            <li><a href="#ats-checker" className="hover:text-white transition-colors">Resume Scanner</a></li>
                            <li><a href="#features" className="hover:text-white transition-colors">Resume Optimizer</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
                            <li><a href="/blog/what-is-ats-applicant-tracking-system-explained" className="hover:text-white transition-colors">What is ATS?</a></li>
                            <li><a href="/blog/software-engineer-resume-guide-2024" className="hover:text-white transition-colors">Resume Guide</a></li>
                            <li><a href="/blog/latex-resume-benefits-why-professionals-choose-tex" className="hover:text-white transition-colors">LaTeX Tips</a></li>
                            <li><a href="/docs" className="hover:text-white transition-colors">Documentation</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-white font-bold mb-4">Legal</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-slate-500 text-sm">&copy; {new Date().getFullYear()} ResumeTeX Inc. All rights reserved.</p>

                    <div className="flex items-center gap-6">
                        {/* All Systems Operational Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-slate-300">All systems operational</span>
                        </div>

                        <a href="/signup" className="text-sm font-semibold text-slate-900 bg-white hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors">
                            Start for free
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
