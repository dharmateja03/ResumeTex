declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

interface GoogleUserInfo {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  auth_provider: string;
}

export const analytics = {
  // Set user ID for cross-session tracking
  setUserId: (userId: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-41WT0F9F0H', {
        user_id: userId
      });
    }
  },

  // Set user properties for enhanced analytics
  setUserProperties: (userInfo: GoogleUserInfo) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-41WT0F9F0H', {
        user_id: userInfo.user_id,
        custom_map: {
          user_email_domain: userInfo.email.split('@')[1],
          auth_provider: userInfo.auth_provider,
          user_name: userInfo.name
        }
      });
      
      // Set user properties
      window.gtag('set', {
        user_properties: {
          email_domain: userInfo.email.split('@')[1],
          auth_method: userInfo.auth_provider,
          user_type: 'authenticated'
        }
      });
    }
  },

  // Track page views with user context
  trackPageView: (page_title: string, page_location: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_title,
        page_location,
      });
    }
  },

  // Enhanced user authentication tracking
  trackLogin: (method: string, userInfo?: GoogleUserInfo) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const eventData: any = {
        method,
      };
      
      // Add user context if available
      if (userInfo) {
        eventData.user_id = userInfo.user_id;
        eventData.email_domain = userInfo.email.split('@')[1];
        
        // Set user properties for this session
        analytics.setUserProperties(userInfo);
      }
      
      window.gtag('event', 'login', eventData);
    }
  },

  trackSignUp: (method: string, userInfo?: GoogleUserInfo) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const eventData: any = {
        method,
      };
      
      if (userInfo) {
        eventData.user_id = userInfo.user_id;
        eventData.email_domain = userInfo.email.split('@')[1];
        
        // Set user properties for new user
        analytics.setUserProperties(userInfo);
      }
      
      window.gtag('event', 'sign_up', eventData);
    }
  },

  // Track resume optimization events
  trackResumeUpload: () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resume_upload', {
        event_category: 'engagement',
        event_label: 'resume_optimization',
      });
    }
  },

  trackJobDescriptionSubmit: () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'job_description_submit', {
        event_category: 'engagement',
        event_label: 'resume_optimization',
      });
    }
  },

  trackResumeOptimization: () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resume_optimization_start', {
        event_category: 'conversion',
        event_label: 'resume_optimization',
      });
    }
  },

  trackResumeDownload: () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'resume_download', {
        event_category: 'conversion',
        event_label: 'resume_optimization',
      });
    }
  },

  // Track settings and configuration
  trackLLMSettingsUpdate: (provider: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'llm_settings_update', {
        event_category: 'settings',
        event_label: provider,
      });
    }
  },

  // Track user retention and engagement
  trackFeatureUsage: (feature: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'feature_usage', {
        event_category: 'engagement',
        event_label: feature,
      });
    }
  },

  trackError: (error_message: string, error_location: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error_message,
        fatal: false,
        custom_map: {
          error_location,
        },
      });
    }
  },

  // Track user journey and conversion funnel
  trackFunnelStep: (step: string, step_number: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'funnel_step', {
        event_category: 'conversion_funnel',
        event_label: step,
        value: step_number,
      });
    }
  },

  // Initialize user analytics from stored user info
  initializeUserAnalytics: () => {
    try {
      const userInfo = localStorage.getItem('user_info');
      if (userInfo) {
        const userData = JSON.parse(userInfo) as GoogleUserInfo;
        analytics.setUserProperties(userData);
        analytics.setUserId(userData.user_id);
      }
    } catch (error) {
      // Silent error handling for invalid stored data
    }
  },

  // Clear user analytics (for logout)
  clearUserAnalytics: () => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-41WT0F9F0H', {
        user_id: null,
        user_properties: {
          user_type: 'anonymous'
        }
      });
    }
  },

  // Set user properties for retention analysis
  setUserProperty: (property: string, value: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'G-41WT0F9F0H', {
        custom_map: {
          [property]: value,
        },
      });
    }
  },
};