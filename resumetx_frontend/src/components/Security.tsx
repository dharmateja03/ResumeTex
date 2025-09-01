import React from 'react';
import { ShieldIcon, LockIcon, EyeOffIcon } from 'lucide-react';
export function Security() {
  return <section id="security" className="py-12 bg-blue-50 grid-bg radial-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center opacity-0 animate-fade-in">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
            Security
          </h2>
          <p className="mt-2 text-3xl leading-8 resume-feature-title tracking-tight sm:text-4xl">
            Your Data Is Safe With Us
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            We take security and privacy seriously
          </p>
        </div>
        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            <div className="relative opacity-0 animate-fade-in delay-100">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <ShieldIcon size={32} />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  End-to-End Encryption
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  Your resume data and API keys are encrypted in transit and at
                  rest. We use industry-standard encryption protocols.
                </p>
              </div>
            </div>
            <div className="relative opacity-0 animate-fade-in delay-200">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <LockIcon size={32} />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Secure Browser Storage
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  Your API keys are securely stored in your browser's cache and
                  are completely unnoticeable to others. No one will be able to
                  detect or access your API keys.
                </p>
              </div>
            </div>
            <div className="relative opacity-0 animate-fade-in delay-300">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                  <EyeOffIcon size={32} />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Privacy First
                </h3>
                <p className="mt-2 text-base text-gray-500">
                  We don't store your resume content after processing. Your
                  personal information remains private.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}