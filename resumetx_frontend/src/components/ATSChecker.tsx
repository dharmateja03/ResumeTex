import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Lock, ArrowRight, Loader2, X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from './Button';

interface ATSResult {
    score: number;
    is_authenticated: boolean;
    summary: string;
    file_type: string;
    keyword_analysis: {
        matched_keywords: string[];
        missing_keywords: string[];
        match_percentage: number;
    } | null;
    formatting_issues: string[] | null;
    sections_detected: Record<string, boolean> | null;
    missing_skills: string[] | null;
    action_verbs: {
        strong: string[];
        weak: string[];
    } | null;
    suggestions: string[];
    locked_features?: string[];
}

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'results' | 'error';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export function ATSChecker() {
    const { isSignedIn, getToken } = useAuth();
    const [state, setState] = useState<AnalysisState>('idle');
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [result, setResult] = useState<ATSResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            validateAndSetFile(droppedFile);
        }
    }, []);

    const validateAndSetFile = (selectedFile: File) => {
        const validExtensions = ['.pdf', '.docx', '.doc', '.tex', '.latex'];
        const fileName = selectedFile.name.toLowerCase();
        const isValid = validExtensions.some(ext => fileName.endsWith(ext));

        if (!isValid) {
            setError('Please upload a PDF, DOCX, or LaTeX (.tex) file');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setFile(selectedFile);
        setError(null);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;

        setState('uploading');
        setError(null);

        try {
            setState('analyzing');

            const formData = new FormData();
            formData.append('file', file);
            if (jobDescription.trim()) {
                formData.append('job_description', jobDescription.trim());
            }

            // Get auth token if signed in (for full results)
            const headers: Record<string, string> = {};
            if (isSignedIn) {
                const token = await getToken();
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }
            }

            const response = await fetch(`${API_URL}/ats/analyze`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Analysis failed (${response.status})`);
            }

            const data: ATSResult = await response.json();
            setResult(data);
            setState('results');

        } catch (err) {
            console.error('ATS analysis error:', err);
            setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
            setState('error');
        }
    };

    const resetAnalysis = () => {
        setFile(null);
        setResult(null);
        setError(null);
        setState('idle');
        setJobDescription('');
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Good';
        if (score >= 70) return 'Acceptable';
        if (score >= 60) return 'Needs Work';
        return 'Poor';
    };

    return (
        <section id="ats-checker" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors duration-300">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-[0.02] dark:opacity-[0.04] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
                        <CheckCircle2 size={14} />
                        100% Free - No Sign Up Required
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight mb-4 font-display">
                        Free ATS Resume Score Checker
                    </h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-4">
                        <strong>Check your ATS score instantly - completely free.</strong> Upload your resume and get an AI-powered
                        ATS compatibility analysis in seconds. No account needed.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-400 dark:text-slate-500">
                        <span>ATS Score Checker</span>
                        <span>•</span>
                        <span>Resume ATS Test</span>
                        <span>•</span>
                        <span>Free Resume Scanner</span>
                        <span>•</span>
                        <span>ATS Compatibility Check</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                    {state === 'idle' || state === 'error' ? (
                        <div className="space-y-6">
                            {/* File Upload Area */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Upload Box */}
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`
                                        relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200
                                        ${isDragging
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                            : file
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                        }
                                    `}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.docx,.doc,.tex,.latex"
                                        onChange={handleFileInput}
                                        className="hidden"
                                    />

                                    {file ? (
                                        <div className="space-y-2">
                                            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                                <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setFile(null);
                                                }}
                                                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <Upload className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    Drop your resume here
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                                    or click to browse
                                                </p>
                                            </div>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                PDF, DOCX, or LaTeX (.tex) - Max 10MB
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Job Description */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Job Description <span className="text-slate-400">(optional)</span>
                                    </label>
                                    <textarea
                                        value={jobDescription}
                                        onChange={(e) => setJobDescription(e.target.value)}
                                        placeholder="Paste the job description here for keyword matching analysis..."
                                        className="w-full h-[calc(100%-2rem)] min-h-[180px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Analyze Button */}
                            <Button
                                onClick={handleAnalyze}
                                disabled={!file}
                                className="w-full justify-center h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Analyze Resume
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    ) : state === 'uploading' || state === 'analyzing' ? (
                        <div className="py-16 text-center space-y-4">
                            <Loader2 className="w-12 h-12 mx-auto text-indigo-500 animate-spin" />
                            <p className="text-lg font-medium text-slate-900 dark:text-white">
                                {state === 'uploading' ? 'Uploading resume...' : 'Analyzing with AI...'}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                This may take a few moments
                            </p>
                        </div>
                    ) : state === 'results' && result ? (
                        <div className="space-y-8">
                            {/* Score Header */}
                            <div className="flex flex-col md:flex-row items-center gap-6 p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                {/* Score Circle */}
                                <div className="relative w-32 h-32 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className="text-slate-100 dark:text-slate-700"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="currentColor"
                                            strokeWidth="8"
                                            fill="none"
                                            className={getScoreColor(result.score)}
                                            strokeDasharray={`${(result.score / 100) * 351.86} 351.86`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
                                            {result.score}
                                        </span>
                                        <span className="text-sm text-slate-500 dark:text-slate-400">/100</span>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="flex-1 text-center md:text-left">
                                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                                        result.score >= 80
                                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                            : result.score >= 60
                                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    }`}>
                                        {getScoreLabel(result.score)}
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300">{result.summary}</p>
                                </div>
                            </div>

                            {/* Detailed Results Grid */}
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Suggestions (Always visible) */}
                                <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <AlertCircle size={18} className="text-indigo-500" />
                                        Suggestions
                                    </h4>
                                    <ul className="space-y-3">
                                        {result.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                                                {suggestion}
                                            </li>
                                        ))}
                                    </ul>
                                    {!result.is_authenticated && result.locked_features && (
                                        <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
                                            + {result.locked_features.length - result.suggestions.length} more suggestions available
                                        </p>
                                    )}
                                </div>

                                {/* Locked Content or Full Analysis */}
                                {result.is_authenticated ? (
                                    <>
                                        {/* Keyword Analysis */}
                                        {result.keyword_analysis && (
                                            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                                                    Keyword Analysis
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-slate-500 dark:text-slate-400">Match Rate</span>
                                                        <span className="font-semibold text-slate-900 dark:text-white">
                                                            {result.keyword_analysis.match_percentage}%
                                                        </span>
                                                    </div>
                                                    {result.keyword_analysis.matched_keywords.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Matched:</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {result.keyword_analysis.matched_keywords.slice(0, 8).map((kw, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {result.keyword_analysis.missing_keywords.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Missing:</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {result.keyword_analysis.missing_keywords.slice(0, 8).map((kw, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                                                                        {kw}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Sections Detected */}
                                        {result.sections_detected && (
                                            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                                                    Sections Detected
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {Object.entries(result.sections_detected).map(([section, found]) => (
                                                        <div key={section} className="flex items-center gap-2 text-sm">
                                                            {found ? (
                                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                                            ) : (
                                                                <X size={14} className="text-red-500" />
                                                            )}
                                                            <span className={found ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}>
                                                                {section.charAt(0).toUpperCase() + section.slice(1)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Verbs */}
                                        {result.action_verbs && (
                                            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                                                    Action Verbs
                                                </h4>
                                                <div className="space-y-3">
                                                    {result.action_verbs.strong.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Strong verbs used:</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {result.action_verbs.strong.map((verb, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                                        {verb}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {result.action_verbs.weak.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Consider replacing:</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {result.action_verbs.weak.map((verb, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 text-xs rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                                                                        {verb}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Formatting Issues */}
                                        {result.formatting_issues && result.formatting_issues.length > 0 && (
                                            <div className="p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                                                    Formatting Issues
                                                </h4>
                                                <ul className="space-y-2">
                                                    {result.formatting_issues.map((issue, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                                                            <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                            {issue}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* Blurred Locked Content */
                                    <div className="relative p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        {/* Blurred placeholder content */}
                                        <div className="blur-sm pointer-events-none select-none">
                                            <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                                                Detailed Analysis
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                                <div className="flex flex-wrap gap-1.5 mt-4">
                                                    {[1,2,3,4,5].map(i => (
                                                        <span key={i} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-xs">keyword</span>
                                                    ))}
                                                </div>
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mt-4"></div>
                                                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                                            </div>
                                        </div>

                                        {/* Overlay with login prompt */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                                                <Lock className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                                                Full Analysis Locked
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 text-center px-4">
                                                Sign in to unlock keyword analysis, formatting issues, and more
                                            </p>
                                            <Button href="/login" size="sm">
                                                Sign in to unlock
                                                <ArrowRight className="ml-1 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reset Button */}
                            <div className="flex justify-center">
                                <button
                                    onClick={resetAnalysis}
                                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                                >
                                    Analyze another resume
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Bottom Info - SEO Content */}
                <div className="mt-12 text-center max-w-3xl mx-auto">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        Why Check Your ATS Resume Score?
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Over 75% of resumes are rejected by Applicant Tracking Systems before a human ever sees them.
                        Our free ATS resume checker uses AI to scan your resume the same way ATS software does,
                        giving you an instant compatibility score and actionable feedback to improve your chances.
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Works with PDF, Word (DOCX), and LaTeX resumes. Your resume is analyzed securely and never stored.{' '}
                        <a href="#features" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                            Learn more about our AI resume optimization
                        </a>
                    </p>
                </div>
            </div>
        </section>
    );
}
