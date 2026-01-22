import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { AppRouter } from './AppRouter';
import { analytics } from './utils/analytics';
import { ClerkProvider } from '@clerk/clerk-react';
import { initPostHog } from './lib/posthog';

// Initialize PostHog analytics
initPostHog();

// Initialize analytics for returning users
analytics.initializeUserAnalytics();

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

render(
  <ClerkProvider publishableKey={clerkPubKey}
     publishableKey={clerkPubKey}
    frontendApi={clerkFrontendApi}     
    domain="clerk.resumetex.tech" 
    >
    <AppRouter />
  </ClerkProvider>,
  document.getElementById('root')
);
