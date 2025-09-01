import React from 'react';
import { FileTextIcon, ZapIcon, BriefcaseIcon } from 'lucide-react';
export function Hero() {
  return <div className="relative overflow-hidden gradient-bg">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 lg:mt-16 lg:px-8 xl:mt-20">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-gambarino text-gray-900 sm:text-5xl md:text-6xl opacity-0 animate-fade-in">
                <span className="block">Optimize your resume with</span>
                <span className="block text-blue-600 font-switzer-bold">
                  ResumeTex
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 font-switzer-light sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-auto opacity-0 animate-fade-in delay-200">
                Transform your .tex resume into an ATS-friendly document
                tailored to specific job descriptions. Showcase your most
                relevant projects and experience to get more interviews.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start opacity-0 animate-fade-in delay-300">
                <div className="rounded-md shadow">
                  <a href="#" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-switzer-bold rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-300">
                    Get started
                  </a>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a href="#how-it-works" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-switzer-bold rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10 transition-all duration-300">
                    Learn more
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>;
}