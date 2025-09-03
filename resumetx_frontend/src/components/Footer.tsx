import React from 'react';
import { HeartIcon, GithubIcon, TwitterIcon, CoffeeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Footer() {
  return <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
      {/* Grid background with low opacity */}
      <div className="absolute inset-0 grid-bg opacity-10 radial-blur"></div>
      {/* Backdrop blur */}
      <div className="absolute inset-0 backdrop-blur-40"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="opacity-0 animate-fade-in">
            <h3 className="text-lg resume-feature-title mb-4">ResumeTex</h3>
            <p className="text-gray-400 text-sm font-switzer-light">
              Optimize your LaTeX resume for job applications with AI-powered
              tools.
            </p>
            <div className="mt-4 flex items-center">
              <span className="text-gray-400 text-sm font-switzer-light">
                Made with
              </span>
              <HeartIcon className="h-4 w-4 text-red-500 mx-1" />
              <span className="text-gray-400 text-sm font-switzer-light">
                by the community
              </span>
            </div>
            <div className="mt-4">
              <a 
                href="https://buymeacoffee.com/samudhar" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black text-sm font-switzer-bold rounded-md transition-colors duration-200"
              >
                <CoffeeIcon className="h-4 w-4 mr-2" />
                Buy Me a Coffee
              </a>
            </div>
          </div>
          <div className="opacity-0 animate-fade-in delay-100">
            <h3 className="text-lg font-switzer-bold mb-4">Resources</h3>
            <ul className="space-y-2 text-gray-400 text-sm font-switzer-light">
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Documentation</a>
              </li>
              {/* <li className="hover:text-blue-400 transition-colors">
                <a href="#">LaTeX Templates</a>
              </li> */}
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">API Reference</a>
              </li>
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Resume Tips</a>
              </li>
            </ul>
          </div>
          <div className="opacity-0 animate-fade-in delay-200">
            <h3 className="text-lg font-switzer-bold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400 text-sm font-switzer-light">
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">About Us</a>
              </li>
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Blog</a>
              </li>
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Careers</a>
              </li>
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Contact</a>
              </li>
            </ul>
          </div>
          <div className="opacity-0 animate-fade-in delay-300">
            <h3 className="text-lg font-switzer-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-gray-400 text-sm font-switzer-light">
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Privacy Policy</a>
              </li>
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Terms of Service</a>
              </li>
              <li className="hover:text-blue-400 transition-colors">
                <a href="#">Cookie Policy</a>
              </li>
            </ul>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <GithubIcon className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a href="https://buymeacoffee.com/samudhar" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-yellow-400 transition-colors">
                <CoffeeIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center opacity-0 animate-fade-in delay-400">
          <p className="text-gray-400 text-sm font-switzer-light">
            &copy; {new Date().getFullYear()} ResumeTex. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link to="/dashboard" className="text-gray-400 hover:text-blue-400 text-sm font-switzer-light transition-colors">
              Dashboard
            </Link>
            <Link to="/login" className="text-gray-400 hover:text-blue-400 text-sm font-switzer-light transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>
    </footer>;
}