import React from 'react';
import { FileTextIcon, KeyIcon, ZapIcon, CheckCircleIcon, BriefcaseIcon, ClipboardListIcon } from 'lucide-react';
export function Features() {
  return <section id="features" className="py-12 bg-gray-50 grid-bg radial-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center opacity-0 animate-fade-in">
          <h2 className="text-base text-blue-600 font-switzer-bold tracking-wide uppercase">
            Features
          </h2>
          <p className="mt-2 text-3xl leading-8 resume-feature-title tracking-tight sm:text-4xl">
            Why choose ResumeTex?
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 font-switzer-light lg:mx-auto">
            Our platform offers everything you need to create the perfect
            resume.
          </p>
        </div>
        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            <div className="relative opacity-0 animate-fade-in delay-100">
              <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <FileTextIcon size={24} />
              </div>
              <p className="ml-16 text-lg leading-6 font-switzer-bold text-gray-900">
                LaTeX Optimization
              </p>
              <p className="mt-2 ml-16 text-base font-switzer-light text-gray-500">
                Upload your .tex file and our AI will analyze and optimize your
                resume structure, content, and formatting.
              </p>
            </div>
            <div className="relative opacity-0 animate-fade-in delay-200">
              <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <BriefcaseIcon size={24} />
              </div>
              <p className="ml-16 text-lg leading-6 font-switzer-bold text-gray-900">
                Job Description Matching
              </p>
              <p className="mt-2 ml-16 text-base font-switzer-light text-gray-500">
                Tailor your resume to specific job descriptions by highlighting
                relevant skills and experience that match what employers are
                seeking.
              </p>
            </div>
            <div className="relative opacity-0 animate-fade-in delay-300">
              <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <ClipboardListIcon size={24} />
              </div>
              <p className="ml-16 text-lg leading-6 font-switzer-bold text-gray-900">
                Project Optimization
              </p>
              <p className="mt-2 ml-16 text-base font-switzer-light text-gray-500">
                Have multiple projects but limited space? Our AI helps you
                select and highlight the most relevant projects for each
                application.
              </p>
            </div>
            <div className="relative opacity-0 animate-fade-in delay-400">
              <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                <CheckCircleIcon size={24} />
              </div>
              <p className="ml-16 text-lg leading-6 font-switzer-bold text-gray-900">
                ATS Compatibility
              </p>
              <p className="mt-2 ml-16 text-base font-switzer-light text-gray-500">
                Ensure your resume passes through Applicant Tracking Systems
                with our specialized optimization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}