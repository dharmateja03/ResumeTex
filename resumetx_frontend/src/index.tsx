import React from 'react';
import './index.css';
import { render } from 'react-dom';
import { AppRouter } from './AppRouter';
import { analytics } from './utils/analytics';

// Initialize analytics for returning users
analytics.initializeUserAnalytics();

render(<AppRouter />, document.getElementById('root'));