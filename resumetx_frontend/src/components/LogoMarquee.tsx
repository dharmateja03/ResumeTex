import React from 'react';

const LOGOS = [
    { name: "Google", url: "https://cdn.simpleicons.org/google/64748b" },
    { name: "Amazon", url: "https://cdn.simpleicons.org/amazon/64748b" },
    { name: "Netflix", url: "https://cdn.simpleicons.org/netflix/64748b" },
    { name: "Apple", url: "https://cdn.simpleicons.org/apple/64748b" },
    { name: "Meta", url: "https://cdn.simpleicons.org/meta/64748b" },
    { name: "Microsoft", url: "https://cdn.simpleicons.org/microsoft/64748b" },
    { name: "Nvidia", url: "https://cdn.simpleicons.org/nvidia/64748b" },
    { name: "Tesla", url: "https://cdn.simpleicons.org/tesla/64748b" },
    { name: "OpenAI", url: "https://cdn.simpleicons.org/openai/64748b" },
    { name: "Stripe", url: "https://cdn.simpleicons.org/stripe/64748b" }
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
                        <div key={`l1-${idx}`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0 cursor-default shrink-0">
                            <img src={logo.url} alt={logo.name} className="h-6 w-auto" />
                            <span className="text-xl font-bold text-slate-400 dark:text-slate-500 font-sans tracking-tight">
                                {logo.name}
                            </span>
                        </div>
                    ))}

                    {/* Duplicate set for infinite loop */}
                    {LOGOS.map((logo, idx) => (
                        <div key={`l2-${idx}`} className="flex items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0 cursor-default shrink-0">
                            <img src={logo.url} alt={logo.name} className="h-6 w-auto" />
                            <span className="text-xl font-bold text-slate-400 dark:text-slate-500 font-sans tracking-tight">
                                {logo.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
