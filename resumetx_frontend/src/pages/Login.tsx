import React, { useEffect, useState } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';
import { trackEvent, identifyUser } from '../lib/posthog';

export function Login() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();
  const [devLoading, setDevLoading] = useState(false);

  useEffect(() => {
    // Redirect if already signed in
    if (isLoaded && isSignedIn) {
      // Always go to workspace now - LLM setup is inline there
      navigate('/workspace');
    }
  }, [isSignedIn, isLoaded, navigate]);

  // Development bypass login
  const handleDevLogin = async () => {
    setDevLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/dev/bypass`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Store auth token and user info
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));

        // Track login
        identifyUser(data.user_info.email || 'anonymous', {
          email: data.user_info.email,
          name: data.user_info.name,
        });
        trackEvent('user_logged_in', {
          method: 'dev_bypass',
        });

        // Redirect to workspace
        navigate('/workspace');
      } else {
        alert('Dev login failed');
      }
    } catch (error) {
      console.error('Dev login error:', error);
      alert('Dev login failed: ' + error.message);
    } finally {
      setDevLoading(false);
    }
  };

  const isDevelopment = import.meta.env.MODE === 'development';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700 mb-6 mx-auto w-fit">
          <ArrowLeftIcon size={16} className="mr-1" />
          <span>Back to home</span>
        </Link>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">ResumeTex</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to optimize your resume
          </p>
        </div>

        {/* Development Bypass Button */}
        {isDevelopment && (
          <div className="mb-6 text-center">
            <button
              onClick={handleDevLogin}
              disabled={devLoading}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50"
            >
              {devLoading ? '🔧 Logging in...' : '🔧 Dev Login (Bypass)'}
            </button>
            <p className="text-xs text-gray-500 mt-2">Development mode only</p>
          </div>
        )}

        {/* Clerk SignIn Component */}
        <div className="flex justify-center">
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/signup"
            afterSignInUrl="/workspace"
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-lg"
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}