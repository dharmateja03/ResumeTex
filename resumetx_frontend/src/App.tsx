import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { LogoMarquee } from './components/LogoMarquee';
import { ATSChecker } from './components/ATSChecker';
import { Features } from './components/Features';
import { ProductShowcase } from './components/ProductShowcase';
import { HowItWorks } from './components/HowItWorks';
import { Testimonials } from './components/Testimonials';
import { Footer } from './components/Footer';

export function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      <Navbar />
      <main>
        <Hero />
        <LogoMarquee />
        <ATSChecker />
        <Features />
        <ProductShowcase />
        <HowItWorks />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
