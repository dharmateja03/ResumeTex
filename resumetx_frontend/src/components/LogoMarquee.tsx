import React from 'react';

const LOGOS = [
    { name: "Google" },
    { name: "Amazon" },
    { name: "Netflix" },
    { name: "Apple" },
    { name: "Meta" },
    { name: "Microsoft" },
    { name: "Nvidia" },
    { name: "Tesla" },
    { name: "OpenAI" },
    { name: "Stripe" }
];

export const LogoMarquee: React.FC = () => {
    return (
        <div className="w-full py-24 border-t border-slate-100 dark:border-slate-900 bg-white dark:bg-slate-950 overflow-hidden relative transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Trusted by engineers at
                </p>
            </div>

            <div className="flex w-full overflow-hidden mask-linear-gradient">
                {/*
                   Using a larger width and gap to ensure smooth scrolling without overlap.
                   The gap is handled by the parent flex container and padding on items.
                */}
                <div className="flex w-[200%] animate-scroll hover:pause gap-24 items-center">
                    {/* First set of logos */}
                    {LOGOS.map((logo, idx) => (
                        <div key={`l1-${idx}`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default shrink-0">
                            <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 font-sans tracking-tight">
                                {logo.name}
                            </span>
                        </div>
                    ))}

                    {/* Duplicate set for infinite loop */}
                    {LOGOS.map((logo, idx) => (
                        <div key={`l2-${idx}`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-default shrink-0">
                            <span className="text-2xl font-bold text-slate-400 dark:text-slate-500 font-sans tracking-tight">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
