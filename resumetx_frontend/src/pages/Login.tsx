import React, { useEffect } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SignIn, useUser } from '@clerk/clerk-react';

export function Login() {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Redirect if already signed in
    if (isLoaded && isSignedIn) {
      // Always go to workspace now - LLM setup is inline there
      navigate('/workspace');
    }
  }, [isSignedIn, isLoaded, navigate]);

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