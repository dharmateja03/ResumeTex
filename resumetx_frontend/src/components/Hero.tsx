import React from 'react';
import { Button } from './Button';
import { ArrowRight, Sparkles, CheckCircle2, Search, BarChart3 } from 'lucide-react';

export function Hero() {
    // Generate static random values for stars to prevent hydration mismatch
    const stars = [
        { top: '10%', left: '80%', delay: '0s' },
        { top: '20%', left: '60%', delay: '2.5s' },
        { top: '40%', left: '90%', delay: '1s' },
        { top: '5%', left: '50%', delay: '4s' },
        { top: '30%', left: '70%', delay: '1.5s' },
        { top: '15%', left: '20%', delay: '3s' },
        { top: '25%', left: '40%', delay: '5s' },
        { top: '5%', left: '10%', delay: '1.2s' },
        { top: '50%', left: '85%', delay: '3.5s' },
        { top: '60%', left: '20%', delay: '0.5s' },
        { top: '15%', left: '95%', delay: '4.8s' },
        { top: '35%', left: '15%', delay: '2.2s' },
        { top: '45%', left: '55%', delay: '1.8s' },
        { top: '8%', left: '30%', delay: '3.8s' },
        { top: '55%', left: '5%', delay: '2.9s' },
        { top: '25%', left: '5%', delay: '0.8s' },
        { top: '42%', left: '80%', delay: '4.2s' },
    ];

    return (
        <section className="relative pt-40 pb-20 lg:pt-52 lg:pb-32 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">

            {/* --- 3JS Style Elements --- */}

            {/* 1. Perspective Grid Floor */}
            <div className="absolute bottom-0 left-0 right-0 h-[400px] pointer-events-none opacity-[0.4] dark:opacity-[0.2]"
                 style={{
                     background: 'linear-gradient(transparent 0%, rgba(99, 102, 241, 0.05) 100%)',
                     transform: 'perspective(1000px) rotateX(60deg) translateY(100px) scale(2)',
                     transformOrigin: 'bottom center'
                 }}>
                 <div className="absolute inset-0"
                      style={{
                          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(148, 163, 184, 0.2) 25%, rgba(148, 163, 184, 0.2) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.2) 75%, rgba(148, 163, 184, 0.2) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(148, 163, 184, 0.2) 25%, rgba(148, 163, 184, 0.2) 26%, transparent 27%, transparent 74%, rgba(148, 163, 184, 0.2) 75%, rgba(148, 163, 184, 0.2) 76%, transparent 77%, transparent)',
                          backgroundSize: '50px 50px'
                      }}
                 ></div>
            </div>

            {/* 2. Shooting Stars */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {stars.map((star, i) => (
                    <div
                        key={i}
                        className="absolute h-[1px] w-[100px] bg-gradient-to-r from-transparent via-slate-400 to-transparent dark:via-white animate-shooting opacity-0"
                        style={{
                            top: star.top,
                            left: star.left,
                            animationDelay: star.delay,
                            animationDuration: '4s'
                        }}
                    ></div>
                ))}
            </div>

            {/* 3. Floating Particles */}
            <div className="absolute top-20 left-20 w-2 h-2 bg-blue-500/30 rounded-full animate-float blur-[1px]"></div>
            <div className="absolute top-40 right-40 w-3 h-3 bg-purple-500/30 rounded-full animate-float blur-[2px]" style={{ animationDelay: '1s' }}></div>
            <div className="absolute bottom-40 left-1/3 w-1.5 h-1.5 bg-slate-400/30 rounded-full animate-float blur-[0.5px]" style={{ animationDelay: '2s' }}></div>

            {/* --- Floating HUD Hooks (Desktop Only) --- */}

            {/* Left HUD: Keyword Match */}
            <div className="hidden lg:block absolute top-1/2 left-[5%] -translate-y-[60%] w-64 p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-float z-20" style={{ animationDuration: '7s' }}>
                <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <Search size={14} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Keyword Match</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-400">React.js</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Found</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-400">TypeScript</span>
                        <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 size={10} /> Found</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 dark:text-slate-400">AWS</span>
                        <span className="text-blue-500 font-bold flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">Injected</span>
                    </div>
                </div>
            </div>

            {/* Right HUD: ATS Score */}
            <div className="hidden lg:block absolute top-1/2 right-[5%] -translate-y-[40%] w-72 p-5 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-float z-20" style={{ animationDuration: '8s', animationDelay: '1s' }}>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 size={16} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">ATS Score Prediction</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        {/* Circle background */}
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-slate-100 dark:text-slate-800" />
                            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-emerald-500" strokeDasharray="175.9" strokeDashoffset="3.5" strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xl font-bold text-slate-900 dark:text-white">98</span>
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">Excellent</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Top 5% of applicants</div>
                    </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[98%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
                <div className="mt-2 text-[10px] text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    Passing Scan...
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center flex flex-col items-center">

                {/* AI Badge */}
                <div className="inline-flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-indigo-100 dark:border-indigo-500/30 shadow-[0_2px_20px_rgba(99,102,241,0.15)] mb-10 animate-[fadeInUp_0.8s_ease-out_forwards] opacity-0 hover:scale-105 transition-all duration-300 cursor-default group select-none">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                        <Sparkles size={12} fill="currentColor" className="animate-pulse" />
                    </div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-200">
                        ATS-Verified AI Models <span className="mx-1.5 text-slate-300 dark:text-slate-700">|</span> <span className="text-slate-500 dark:text-slate-400">Keeps exact format</span>
                    </span>
                </div>

                <h1 className="text-6xl md:text-7xl lg:text-9xl font-bold tracking-tight text-primary dark:text-white mb-8 leading-[1] animate-[fadeInUp_0.8s_ease-out_forwards] opacity-0 font-display">
                    AI Resume <br className="hidden md:block"/>
                    Optimizer. <br className="hidden md:block"/>
                    <span className="text-slate-400 dark:text-slate-500 relative inline-block">
                        Always free
                        {/* Underline decoration */}
                        <svg className="absolute w-full h-3 -bottom-1 left-0 text-indigo-500/50 dark:text-indigo-400/50" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="2" fill="none" />
                        </svg>
                    </span>.
                </h1>

                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-[fadeInUp_0.8s_ease-out_0.2s_forwards] opacity-0">
                    <span className="text-slate-900 dark:text-white font-semibold">Stop paying for resume tools.</span>{' '}
                    Get ATS-optimized, job-tailored resumes in 30 seconds. Free forever.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-[fadeInUp_0.8s_ease-out_0.4s_forwards] opacity-0 w-full mb-12">
                    <Button href="/signup" size="lg" className="min-w-[200px] h-14 text-lg shadow-[0_0_20px_rgba(2,6,23,0.15)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                        Start Free Forever
                    </Button>
                    <Button href="#how-it-works" variant="ghost" size="lg" className="min-w-[200px] h-14 text-lg group text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                        See how it works <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>

                {/* Social Proof / Active Users */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-[fadeInUp_0.8s_ease-out_0.6s_forwards] opacity-0">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map((i) => (
                            <img
                                key={i}
                                className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200"
                                src={`https://picsum.photos/32/32?random=${i + 10}`}
                                alt="User"
                            />
                        ))}
                         <div className="h-8 w-8 rounded-full border-2 border-white dark:border-slate-950 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-400">
                            +400
                        </div>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            <span className="text-slate-900 dark:text-white font-bold">453 users</span> are currently using this
                        </p>
                    </div>
                </div>

                {/* Internal Links for SEO */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-8 animate-[fadeInUp_0.8s_ease-out_0.8s_forwards] opacity-0">
                    <a href="/blog/what-is-ats-applicant-tracking-system-explained" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        What is ATS?
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <a href="/blog/software-engineer-resume-guide-2024" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Resume Guide
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <a href="/blog/latex-resume-benefits-why-professionals-choose-tex" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Why LaTeX?
                    </a>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <a href="/docs" className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        Documentation
                    </a>
                </div>

                {/* SEO Content Section */}
                <div className="mt-16 max-w-3xl mx-auto text-center animate-[fadeInUp_0.8s_ease-out_1s_forwards] opacity-0">
                    <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                        Why Use an AI Resume Optimizer?
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                        Over 90% of Fortune 500 companies use Applicant Tracking Systems (ATS) to filter resumes before a human ever sees them.
                        Our AI-powered resume optimizer analyzes job descriptions, identifies critical keywords, and tailors your LaTeX resume
                        to match exactly what recruiters and ATS systems are looking for.
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        Unlike generic resume builders, ResumeTex preserves your professional LaTeX formatting while intelligently
                        incorporating job-specific skills, technologies, and action verbs. Whether you're a software engineer, data scientist,
                        or product manager, get more interviews by ensuring your resume speaks the same language as the job posting.
                    </p>
                </div>
            </div>

            {/* Background Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-tr from-slate-100 to-transparent dark:from-slate-900 dark:to-transparent rounded-[100%] blur-[100px] -z-10 opacity-60 dark:opacity-40 transition-colors duration-300"></div>
        </section>
    );
}
