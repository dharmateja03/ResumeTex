import React from 'react';

interface Testimonial {
    quote: string;
    author: string;
    role: string;
    avatar: string;
}

const testimonials: Testimonial[] = [
    {
        quote: "I applied to 50 jobs with no response. After using ResumeTeX, I got 3 interviews in a week. The difference in quality was immediate.",
        author: "Sarah Jenkins",
        role: "Product Manager at TechCorp",
        avatar: "https://picsum.photos/100/100?random=1"
    },
    {
        quote: "The keyword optimization feature is a game changer. I realized I was missing critical terms for my industry that ATS systems look for.",
        author: "Michael Chen",
        role: "Senior Software Engineer",
        avatar: "https://picsum.photos/100/100?random=2"
    },
    {
        quote: "Simple, fast, and effective. The AI suggestions were spot on and helped me rephrase my experience to sound much more impactful.",
        author: "Elena Rodriguez",
        role: "Marketing Director",
        avatar: "https://picsum.photos/100/100?random=3"
    }
];

export function Testimonials() {
    return (
        <section className="py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white font-display">Loved by job seekers</h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400">Join thousands of professionals who landed their dream jobs.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-8 rounded-xl border border-slate-100 dark:border-slate-800 relative transition-colors">
                            <p className="text-slate-700 dark:text-slate-300 mb-8 relative z-10 italic leading-relaxed">"{t.quote}"</p>

                            <div className="flex items-center">
                                <img src={t.avatar} alt={t.author} className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700 mr-4" />
                                <div>
                                    <h4 className="text-slate-900 dark:text-white font-bold text-sm">{t.author}</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs">{t.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
