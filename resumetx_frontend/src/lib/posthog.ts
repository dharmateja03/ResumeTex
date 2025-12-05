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

    // Capture UTM parameters, referral info, and referrer on initialization
    const urlParams = new URLSearchParams(window.location.search)
    const trackingParams: Record<string, string> = {}

    // Capture all UTM parameters
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
    utmKeys.forEach(key => {
      const value = urlParams.get(key)
      if (value) {
        trackingParams[key] = value
      }
    })

    // Capture referral parameters (ref = referrer username, ref_id = referrer user id)
    const refName = urlParams.get('ref')
    const refId = urlParams.get('ref_id')
    if (refName) {
      trackingParams['referred_by'] = refName
      trackingParams['referrer_name'] = refName
    }
    if (refId) {
      trackingParams['referrer_id'] = refId
    }

    // Capture referrer
    const referrer = document.referrer || 'direct'

    // Store tracking params and referrer as user properties
    if (Object.keys(trackingParams).length > 0 || referrer !== 'direct') {
      posthog.register({
        initial_referrer: referrer,
        ...trackingParams
      })

      // Also set as super properties for this session
      posthog.people?.set({
        $initial_referrer: referrer,
        ...trackingParams
      })

      // Track referral visit event if coming from a referral link
      if (refName || refId) {
        posthog.capture('referral_visit', {
          referrer_name: refName,
          referrer_id: refId,
          landing_page: window.location.pathname
        })
      }
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
