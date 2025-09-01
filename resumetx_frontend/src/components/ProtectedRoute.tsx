import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireLLMConfig?: boolean;
}

export function ProtectedRoute({ children, requireLLMConfig = false }: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('auth_token');
    if (!authToken) {
      // Redirect to login if not authenticated
      navigate('/login');
      return;
    }

    // Check if LLM configuration is required and present
    if (requireLLMConfig) {
      const hasLLMConfig = localStorage.getItem('llm_provider') && 
                         localStorage.getItem('llm_api_key');
      
      if (!hasLLMConfig) {
        // Redirect to LLM settings if not configured
        navigate('/llm_settings');
        return;
      }
    }
  }, [navigate, requireLLMConfig]);

  // If we get here, user is authenticated (and has LLM config if required)
  return <>{children}</>;
}