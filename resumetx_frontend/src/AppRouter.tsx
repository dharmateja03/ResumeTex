import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App } from './App';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Optimize } from './pages/Optimize';
import { LLMSettings } from './pages/LLMSettings';
import { Results } from './pages/Results';
import { OAuthCallback } from './pages/OAuthCallback';
import { Docs } from './pages/Docs';
export function AppRouter() {
  return <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/optimize" element={<Optimize />} />
        <Route path="/llm_settings" element={<LLMSettings />} />
        <Route path="/results/:optimizationId" element={<Results />} />
        <Route path="/docs" element={<Docs />} />
      </Routes>
    </BrowserRouter>;
}