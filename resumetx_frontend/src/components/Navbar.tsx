import React, { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Button } from './Button';

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial theme
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setIsDark(true);
            document.documentElement.classList.add('dark');
        } else {
            setIsDark(false);
            document.documentElement.classList.remove('dark');
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        }
    };

    const navLinks: { label: string; href: string; highlight?: boolean }[] = [
        { label: 'Free ATS Checker', href: '#ats-checker', highlight: true },
        { label: 'Features', href: '#features' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Blog', href: '/blog' },
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 transition-all duration-300 pointer-events-none">
            <nav
                className={`
                    pointer-events-auto relative flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${scrolled
                        ? 'w-full max-w-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.1)] rounded-full py-2.5 px-6'
                        : 'w-full max-w-7xl bg-transparent border-transparent py-4 px-2'
                    }
                `}
            >
                {/* Logo */}
                <a href="#" className="flex items-center gap-2 shrink-0 group">
                    <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ResumeTeX.</span>
                </a>

                {/* Desktop Menu */}
                <div className={`hidden md:flex items-center transition-all duration-500 ${scrolled ? 'gap-6' : 'gap-10'}`}>
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className={`text-sm font-medium transition-colors ${
                                link.highlight
                                    ? 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300'
                                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                            }`}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-4">
                     <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                        aria-label="Toggle theme"
                     >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                     </button>
                     <a href="/login" className="text-sm font-medium text-slate-900 hover:text-slate-600 dark:text-white dark:hover:text-slate-300 transition-colors">Log in</a>
                     <Button
                        href="/signup"
                        size="sm"
                        className={`transition-all duration-300 ${scrolled ? 'h-9 px-5 text-sm' : 'h-10 px-6'}`}
                    >
                        Get Started Free
                    </Button>
                </div>

                {/* Mobile Toggle */}
                <div className="flex md:hidden items-center gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        {isDark ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="text-slate-900 dark:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    >
                        {isOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Dropdown (Floating Glass Card) */}
            {isOpen && (
                <div className="pointer-events-auto absolute top-[calc(100%+0.5rem)] left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-2xl flex flex-col gap-4 animate-[fadeInUp_0.2s_ease-out_forwards] origin-top z-40">
                     {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className={`block text-lg font-medium py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                                link.highlight
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-slate-900 dark:text-white'
                            }`}
                        >
                            {link.label}
                        </a>
                    ))}
                    <div className="pt-2 space-y-3">
                        <a href="/login" className="block w-full text-center py-3 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">Log in</a>
                        <Button href="/signup" className="w-full justify-center py-3">Get Started Free</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
