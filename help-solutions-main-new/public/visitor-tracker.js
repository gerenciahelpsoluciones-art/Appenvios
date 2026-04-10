/**
 * Help Soluciones - Real-time Visitor Tracker
 * Lightweight script to capture page views and user engagement.
 */
(function() {
  const ANALYTICS_ENDPOINT = '/api/analytics'; // Internal proxy or external webhook
  
  function trackEvent(type, data = {}) {
    const payload = {
      type,
      path: window.location.pathname,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      screen: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent,
      ...data
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
    } else {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true
      }).catch(() => {});
    }
  }

  // Track initial page view
  trackEvent('pageview');

  // Track visibility changes (user leaving/returning to tab)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      trackEvent('heartbeat', { status: 'active' });
    }
  });

  console.log('🚀 Help Soluciones Visitor Tracker Initialized');
})();
