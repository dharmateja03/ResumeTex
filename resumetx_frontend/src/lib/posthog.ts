import posthog from 'posthog-js'

export const initPostHog = () => {
  const posthogKey = import.meta.env.VITE_POSTHOG_KEY
  const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

  if (posthogKey) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      session_recording: {
        recordCrossOriginIframes: true,
      },
    })

    // Capture UTM parameters and referrer on initialization
    const urlParams = new URLSearchParams(window.location.search)
    const utmParams: Record<string, string> = {}

    // Capture all UTM parameters
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    utmKeys.forEach(key => {
      const value = urlParams.get(key)
      if (value) {
        utmParams[key] = value
      }
    })

    // Capture referrer
    const referrer = document.referrer || 'direct'

    // Store UTM params and referrer as user properties
    if (Object.keys(utmParams).length > 0 || referrer !== 'direct') {
      posthog.register({
        initial_referrer: referrer,
        ...utmParams
      })

      // Also set as super properties for this session
      posthog.people?.set({
        $initial_referrer: referrer,
        ...utmParams
      })
    }

    console.log('✅ PostHog initialized successfully')
  } else {
    console.warn('⚠️ PostHog key not found. Analytics disabled.')
  }
}

export { posthog }

// Event tracking helpers
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (posthog.__loaded) {
    posthog.capture(eventName, properties)
  }
}

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (posthog.__loaded) {
    posthog.identify(userId, properties)
  }
}

export const resetUser = () => {
  if (posthog.__loaded) {
    posthog.reset()
  }
}
