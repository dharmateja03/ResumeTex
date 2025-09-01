import React, { useState } from 'react';
import { UploadCloudIcon, CodeIcon, EditIcon, DownloadIcon, FileTextIcon, BriefcaseIcon, PlayIcon } from 'lucide-react';
export function HowItWorks() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isVideoHovered, setIsVideoHovered] = useState(false);
  const steps = [{
    icon: <UploadCloudIcon size={24} />,
    title: 'Upload your files',
    description: 'Upload your LaTeX resume, job descriptions, and past project details.'
  }, {
    icon: <BriefcaseIcon size={24} />,
    title: 'Specify target job',
    description: "Tell us which job you, re, applying, for: to, tailor, your, resume, accordingly, : ., ',:"
  }, {
    icon: <EditIcon size={24} />,
    title: 'Review suggestions',
    description: 'Our AI analyzes your resume and provides targeted improvements based on the job requirements.'
  }, {
    icon: <DownloadIcon size={24} />,
    title: 'Download optimized resume',
    description: 'Get your enhanced resume in .tex format, ready to compile and send.'
  }];
  return <section id="how-it-works" className="py-12 bg-white grid-bg radial-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center opacity-0 animate-fade-in">
          <h2 className="text-base text-blue-600 font-switzer-bold tracking-wide uppercase">
            Process
          </h2>
          <p className="mt-2 text-3xl leading-8 resume-feature-title tracking-tight sm:text-4xl">
            How ResumeTex Works
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 font-switzer-light lg:mx-auto">
            Four simple steps to transform your resume
          </p>
        </div>
        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-4 md:gap-x-8 md:gap-y-10">
            {steps.map((step, index) => <div key={index} className="relative opacity-0 animate-fade-in" style={{
            animationDelay: `${(index + 1) * 0.1}s`
          }} onMouseEnter={() => setActiveStep(index)} onMouseLeave={() => setActiveStep(null)}>
                <div className="flex flex-col items-center group">
                  <div className={`flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500 text-white mb-4 transition-all duration-300 transform ${activeStep === index ? 'scale-110 shadow-glow-blue' : ''}`}>
                    {step.icon}
                  </div>
                  <div className={`text-center transition-all duration-300 ${activeStep === index ? 'transform translate-y-1' : ''}`}>
                    <p className={`text-lg leading-6 font-switzer-bold ${activeStep === index ? 'text-blue-600' : 'text-gray-900'} transition-colors duration-300`}>
                      {step.title}
                    </p>
                    <p className="mt-2 text-base font-switzer-light text-gray-500">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && <div className={`hidden md:block absolute top-6 right-0 w-8 h-0.5 ${activeStep === index || activeStep === index + 1 ? 'bg-blue-400' : 'bg-gray-200'} transform translate-x-full transition-colors duration-300`}></div>}
              </div>)}
          </div>
        </div>
        {/* Video Demo Section */}
        <div className="mt-16 opacity-0 animate-fade-in delay-500">
          <div className="lg:text-center mb-8">
            <h3 className="text-2xl font-switzer-bold text-gray-900">
              See ResumeTex in Action
            </h3>
            <p className="mt-2 text-lg font-switzer-light text-gray-500 max-w-2xl mx-auto">
              Watch our demo video to see how ResumeTex transforms your resume
            </p>
          </div>
          <div className="relative max-w-4xl mx-auto rounded-xl overflow-hidden shadow-xl" onMouseEnter={() => setIsVideoHovered(true)} onMouseLeave={() => setIsVideoHovered(false)}>
            {/* Video Placeholder - Replace with actual video embed */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&h=675&q=80" alt="ResumeTex Demo Video" className="w-full h-full object-cover" />
              {/* Play Button Overlay */}
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isVideoHovered ? 'bg-black bg-opacity-40' : 'bg-black bg-opacity-30'}`}>
                <div className={`flex items-center justify-center h-20 w-20 rounded-full bg-blue-600 text-white transition-all duration-300 transform ${isVideoHovered ? 'scale-110 shadow-glow-blue' : ''}`}>
                  <PlayIcon size={40} className="ml-1" />
                </div>
              </div>
            </div>
            {/* Video Caption */}
            <div className="bg-white p-4 border-t border-gray-200">
              <h4 className="font-switzer-bold text-gray-900">
                Complete Resume Optimization Walkthrough
              </h4>
              <p className="text-sm font-switzer-light text-gray-500 mt-1">
                Learn how to upload your resume, select a job description, and
                receive AI-powered optimization suggestions
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>;
}