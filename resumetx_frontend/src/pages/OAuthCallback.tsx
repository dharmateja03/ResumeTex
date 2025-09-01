import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analytics } from '../utils/analytics';

export function OAuthCallback() {
  const [status, setStatus] = useState('Processing...');
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          setStatus('Authentication failed. Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        if (!code) {
          setStatus('No authorization code received. Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        setStatus('Exchanging authorization code...');

        // Send the authorization code to your backend
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001'}/auth/google/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code,
            redirect_uri: window.location.origin + '/auth/callback'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Track successful login with Google user data
          analytics.trackLogin('google', data.user_info);
          
          // Set user ID for cross-session tracking
          analytics.setUserId(data.user_info.user_id);
          
          // Store auth token and user info
          localStorage.setItem('auth_token', data.access_token);
          localStorage.setItem('user_info', JSON.stringify(data.user_info));
          
          setStatus('Authentication successful! Redirecting...');
          
          // Check if user has LLM settings
          const hasLLMConfig = localStorage.getItem('llm_provider') && 
                             localStorage.getItem('llm_api_key');
          
          setTimeout(() => {
            if (!hasLLMConfig) {
              navigate('/llm_settings');
            } else {
              navigate('/dashboard');
            }
          }, 1000);
        } else {
          setStatus('Authentication failed. Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
        }
      } catch (error) {
        setStatus('Authentication error. Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">ResumeTex</h2>
          <p className="mt-2 text-sm text-gray-600">{status}</p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}