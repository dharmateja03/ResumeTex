import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { analytics } from '../utils/analytics';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Google Sign-In when component mounts
    const initializeGoogleSignIn = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false,
          });
        } catch (error) {
          // Silent error handling
        }
      }
    };

    // Check if Google script is loaded
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      // Wait for Google script to load
      const checkGoogleLoaded = setInterval(() => {
        if (window.google) {
          initializeGoogleSignIn();
          clearInterval(checkGoogleLoaded);
        }
      }, 100);
      
      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkGoogleLoaded), 10000);
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    
    try {
      // Send the ID token to your backend
      const apiResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      });
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        
        // Track successful login
        analytics.trackLogin('google');
        
        // Store auth token and user info
        localStorage.setItem('auth_token', data.access_token);
        localStorage.setItem('user_info', JSON.stringify(data.user_info));
        
        // Check if user has LLM settings
        const hasLLMConfig = localStorage.getItem('llm_provider') && 
                           localStorage.getItem('llm_api_key');
        
        if (!hasLLMConfig) {
          // Redirect to LLM settings if not configured
          navigate('/llm_settings');
        } else {
          // Redirect to dashboard if already configured
          navigate('/dashboard');
        }
      } else {
        const error = await apiResponse.json();
        alert('Login failed: ' + (error.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Use OAuth redirect flow instead of JavaScript popup
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', import.meta.env.VITE_GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', window.location.origin + '/auth/callback');
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'online');
    googleAuthUrl.searchParams.set('prompt', 'select_account');
    
    // Redirect to Google OAuth
    window.location.href = googleAuthUrl.toString();
    return;
    
    if (window.google) {
      try {
        console.log('Attempting Google Sign-In with prompt...');
        
        // Try multiple approaches
        // 1. First try the one-tap prompt
        try {
          window.google.accounts.id.prompt();
        } catch (promptError) {
          console.log('One-tap prompt failed, trying renderButton approach');
          
          // 2. If that fails, try renderButton approach
          const buttonContainer = document.createElement('div');
          buttonContainer.style.position = 'fixed';
          buttonContainer.style.top = '50%';
          buttonContainer.style.left = '50%';
          buttonContainer.style.transform = 'translate(-50%, -50%)';
          buttonContainer.style.zIndex = '10000';
          buttonContainer.id = 'temp-google-signin-button';
          
          document.body.appendChild(buttonContainer);
          
          window.google.accounts.id.renderButton(buttonContainer, {
            theme: 'outline',
            size: 'large',
            type: 'standard',
            text: 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 300
          });
          
          // Auto-click the button after a short delay
          setTimeout(() => {
            const button = buttonContainer.querySelector('div[role="button"]');
            if (button) {
              (button as HTMLElement).click();
            }
          }, 100);
        }
        
      } catch (error) {
        console.error('Google Sign-In error:', error);
        alert('Google Sign-In failed: ' + error.message);
      }
    } else {
      alert('Google Sign-In is not loaded yet. Please refresh the page and try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center text-blue-600 hover:text-blue-700 mb-6 mx-auto w-fit">
          <ArrowLeftIcon size={16} className="mr-1" />
          <span>Back to home</span>
        </Link>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">ResumeTex</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to optimize your resume
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="space-y-6">
              <button 
                type="button" 
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className={`w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <div className="h-5 w-5 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.59 22.56 12.25Z" fill="#4285F4" />
                    <path d="M12 23C14.97 23 17.46 22 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.19 18.63 6.8 16.69 5.95 14.1H2.27V16.94C4.08 20.45 7.76 23 12 23Z" fill="#34A853" />
                    <path d="M5.95 14.1C5.75 13.47 5.63 12.79 5.63 12.09C5.63 11.39 5.75 10.71 5.95 10.09V7.25H2.27C1.46 8.68 1 10.35 1 12.09C1 13.83 1.46 15.5 2.27 16.94L5.95 14.1Z" fill="#FBBC05" />
                    <path d="M12 5.55C13.57 5.55 14.97 6.08 16.08 7.14L19.22 4C17.46 2.36 14.97 1.36 12 1.36C7.76 1.36 4.08 3.91 2.27 7.42L5.95 10.26C6.8 7.67 9.19 5.55 12 5.55Z" fill="#EA4335" />
                  </svg>
                )}
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}