import React from 'react';
import { CheckIcon, ZapIcon, MailIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase mb-2">
            Pricing
          </h2>
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h3>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free with 100 resumes per month. Need more? Contact us!
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Free</h3>
              <ZapIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mb-6">
              <div className="flex items-baseline mb-2">
                <span className="text-5xl font-bold text-gray-900">$0</span>
                <span className="text-gray-600 ml-2">/month</span>
              </div>
              <p className="text-gray-600">Perfect to get started</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">100 resume optimizations per month</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Full LaTeX template library</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Cold email & cover letter generation</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">ATS compatibility check</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Email support</span>
              </li>
            </ul>

            <Link
              to="/workspace"
              className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
            >
              Get Started Free
            </Link>
            <p className="text-sm text-gray-500 text-center mt-3">
              No credit card required
            </p>
          </div>

          {/* Need More? Contact Admin */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700 rounded-2xl p-8 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-white">Need More?</h3>
              <MailIcon className="h-8 w-8 text-blue-400" />
            </div>

            <div className="mb-6">
              <p className="text-gray-300 text-lg">
                Want to generate more than 100 resumes per month?
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
              <p className="text-white font-semibold mb-3">Contact our admin team for:</p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Custom plans for high-volume usage</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Enterprise solutions</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                  <span>Custom integrations</span>
                </li>
              </ul>
            </div>

            <a
              href="mailto:admin@resumetex.com?subject=Need%20More%20Than%20100%20Resumes"
              className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
            >
              Contact Admin
            </a>
            <p className="text-sm text-gray-400 text-center mt-3">
              We'll get back to you within 24 hours
            </p>
          </div>
        </div>

        {/* Pricing Details */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-sm max-w-3xl mx-auto">
            <strong>How it works:</strong> Everyone gets 100 free resume optimizations per month. Need more?
            Contact our admin team for custom plans tailored to your needs.
          </p>
        </div>
      </div>
    </section>
  );
}
