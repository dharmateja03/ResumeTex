import React, { useState } from 'react';
import { CheckIcon, CoffeeIcon } from 'lucide-react';
export function Pricing() {
  const [activeCoffeeButton, setActiveCoffeeButton] = useState<number | null>(null);
  const tiers = [{
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to optimize your resume',
    features: ['Unlimited resume optimizations', 'Full LaTeX template library', 'ATS compatibility check', 'Industry-specific optimizations', 'Email support'],
    cta: 'Get Started',
    mostPopular: true
  }];
  return <section id="pricing" className="py-12 bg-gray-50 grid-bg radial-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center opacity-0 animate-fade-in">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
            Pricing
          </h2>
          <p className="mt-2 text-3xl leading-8 resume-feature-title tracking-tight sm:text-4xl">
            Completely Free
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            ResumeTex is 100% free to use, but we appreciate your support to
            help maintain the service
          </p>
        </div>
        <div className="mt-10 lg:grid lg:grid-cols-3 lg:gap-x-8">
          <div className="col-span-2 opacity-0 animate-fade-in delay-100">
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col ring-2 ring-blue-600">
              <div className="absolute top-0 p-1 px-4 transform -translate-y-1/2 bg-blue-600 rounded-full text-white text-sm font-semibold">
                Free Forever
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {tiers[0].name}
                </h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-4xl font-extrabold tracking-tight">
                    {tiers[0].price}
                  </span>
                  <span className="ml-1 text-xl font-semibold">
                    {tiers[0].period}
                  </span>
                </p>
                <p className="mt-2 text-gray-500">{tiers[0].description}</p>
                <ul className="mt-6 space-y-4">
                  {tiers[0].features.map((feature, index) => <li key={feature} className="flex opacity-0 animate-fade-in" style={{
                  animationDelay: `${(index + 3) * 0.1}s`
                }}>
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                      <span className="ml-3 text-gray-500">{feature}</span>
                    </li>)}
                </ul>
              </div>
              <div className="mt-8 opacity-0 animate-fade-in delay-500">
                <button className="block w-full py-3 px-6 border border-transparent rounded-xl text-center font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 hover:shadow-glow-blue transform hover:scale-105">
                  {tiers[0].cta}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-10 lg:mt-0 opacity-0 animate-fade-in delay-300">
            <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <div className="flex items-center justify-center mb-4">
                  <CoffeeIcon className="h-10 w-10 text-amber-600 animate-pulse" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center">
                  Buy Admin a Coffee
                </h3>
                <p className="mt-4 text-gray-500 text-center">
                  ResumeTex is maintained by volunteers. Your donations help us
                  keep the service running and add new features.
                </p>
                <div className="mt-8 space-y-4">
                  <a href="https://buymeacoffee.com/samudhar" target="_blank" rel="noopener noreferrer" className={`block w-full py-2 px-6 border border-transparent rounded-xl text-center font-medium transition-all duration-300 transform ${activeCoffeeButton === 0 ? 'scale-105 shadow-glow-amber' : ''} bg-amber-100 text-amber-700 hover:bg-amber-200 opacity-0 animate-fade-in delay-400`} onMouseEnter={() => setActiveCoffeeButton(0)} onMouseLeave={() => setActiveCoffeeButton(null)}>
                    $5 - Small Coffee
                  </a>
                  <a href="https://buymeacoffee.com/samudhar" target="_blank" rel="noopener noreferrer" className={`block w-full py-2 px-6 border border-transparent rounded-xl text-center font-medium transition-all duration-300 transform ${activeCoffeeButton === 1 ? 'scale-105 shadow-glow-amber' : ''} bg-amber-500 text-white hover:bg-amber-600 opacity-0 animate-fade-in delay-500`} onMouseEnter={() => setActiveCoffeeButton(1)} onMouseLeave={() => setActiveCoffeeButton(null)}>
                    $10 - Large Coffee
                  </a>
                  <a href="https://buymeacoffee.com/samudhar" target="_blank" rel="noopener noreferrer" className={`block w-full py-2 px-6 border border-transparent rounded-xl text-center font-medium transition-all duration-300 transform ${activeCoffeeButton === 2 ? 'scale-105 shadow-glow-amber' : ''} bg-amber-700 text-white hover:bg-amber-800 opacity-0 animate-fade-in delay-600`} onMouseEnter={() => setActiveCoffeeButton(2)} onMouseLeave={() => setActiveCoffeeButton(null)}>
                    $25 - Coffee for the Team
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
}