import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, SignUp, useUser } from '@clerk/clerk-react';
import { App } from './App';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Workspace } from './pages/Workspace';
import { Optimize } from './pages/Optimize';
import { LLMSettings } from './pages/LLMSettings';
import { Results } from './pages/Results';
import { History } from './pages/History';
import { Analytics } from './pages/Analytics';
import { Docs } from './pages/Docs';
import { Blog } from './pages/Blog';
import { BlogPost } from './pages/BlogPost';
import { isAuthenticated } from './utils/auth';

// Protected Route Component - Supports both Clerk and dev bypass
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();

  // Check for dev bypass authentication
  const hasDevAuth = isAuthenticated();

  // If using dev bypass, just render the children
  if (hasDevAuth) {
    return <>{children}</>;
  }

  // Otherwise, use Clerk authentication
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If Clerk user is signed in, render children
  if (isSignedIn) {
    return <>{children}</>;
  }

  // If not signed in with either method, redirect to login
  return <RedirectToSignIn />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/signup"
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <SignUp
                routing="path"
                path="/signup"
                signInUrl="/login"
                afterSignUpUrl="/workspace"
              />
            </div>
          }
        />
        <Route path="/docs" element={<Docs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />

        {/* Protected Routes */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />
        {/* Redirect /dashboard to /workspace */}
        <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
        <Route
          path="/optimize"
          element={
            <ProtectedRoute>
              <Optimize />
            </ProtectedRoute>
          }
        />
        <Route
          path="/llm_settings"
          element={
            <ProtectedRoute>
              <LLMSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:optimizationId"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* Clerk SSO Callback Routes */}
        <Route path="/login/sso-callback" element={<Navigate to="/workspace" replace />} />
        <Route path="/signup/sso-callback" element={<Navigate to="/workspace" replace />} />

        {/* Redirect old OAuth callback to login */}
        <Route path="/auth/callback" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}