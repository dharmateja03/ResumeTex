import React, { useEffect, useState } from 'react';
import { MenuIcon, XIcon, BookOpenIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  return <nav className={`bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl font-gambarino text-blue-600">
                ResumeTex
              </span>
            </div>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                How It Works
              </a>
              <a href="#security" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                Security
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
                Pricing
              </a>
              <a 
                href="#documentation" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium flex items-center"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('/docs', '_blank');
                }}
              >
                <BookOpenIcon size={16} className="mr-1" />
                Docs
              </a>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2 font-medium">
              Log in
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors">
              Sign up
            </Link>
          </div>
          <div className="flex md:hidden items-center">
            <button className="p-2 rounded-md text-gray-700 hover:text-blue-600" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </div>
      {isOpen && <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">
              Features
            </a>
            <a href="#how-it-works" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">
              How It Works
            </a>
            <a href="#security" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">
              Security
            </a>
            <a href="#pricing" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">
              Pricing
            </a>
            <a 
              href="#documentation" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium flex items-center"
              onClick={(e) => {
                e.preventDefault();
                window.open('/docs', '_blank');
                setIsOpen(false);
              }}
            >
              <BookOpenIcon size={16} className="mr-2" />
              Documentation
            </a>
            <Link to="/login" className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium">
              Log in
            </Link>
            <Link to="/signup" className="block px-3 py-2 mt-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-center">
              Sign up
            </Link>
          </div>
        </div>}
    </nav>;
}