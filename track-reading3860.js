(function () {
  "use strict";

  const TRACKING_INTERVAL = 30000; // 30 seconds for real-time updates
  const READING_TIMEOUT = 600000; // 10 minutes

  let currentSeriesId = null;
  let currentChapterId = null;
  let trackingInterval = null;
  let readingTimeout = null;

  function apiBase() {
    try {
      // Use a window-injected base URL if available, else default to same-origin
      return (typeof window !== 'undefined' && window.__API_URL__) || '';
    } catch (_) {
      return '';
    }
  }

  function trackReading(action, seriesId, chapterId = null) {
    const url = `${apiBase()}/api/track-reading`;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        seriesId,
        chapterId,
      }),
    }).catch((err) => console.error("Reading tracking error:", err));
  }

  function startReading(seriesId, chapterId = null) {
    // Stop previous tracking
    if (trackingInterval) {
      stopReading();
    }

    currentSeriesId = seriesId;
    currentChapterId = chapterId;

    // Start tracking
    trackReading("start-reading", seriesId, chapterId);

    // Set up periodic activity updates
    trackingInterval = setInterval(() => {
      trackReading("start-reading", seriesId, chapterId);
    }, TRACKING_INTERVAL);

    // Set timeout to automatically stop tracking
    readingTimeout = setTimeout(() => {
      stopReading();
    }, READING_TIMEOUT);
  }

  function stopReading() {
    if (currentSeriesId) {
      trackReading("stop-reading", currentSeriesId, currentChapterId);
      currentSeriesId = null;
      currentChapterId = null;
    }

    if (trackingInterval) {
      clearInterval(trackingInterval);
      trackingInterval = null;
    }

    if (readingTimeout) {
      clearTimeout(readingTimeout);
      readingTimeout = null;
    }
  }

  // Track page visibility changes
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopReading();
    } else if (document.visibilityState === "visible" && currentSeriesId) {
      startReading(currentSeriesId, currentChapterId);
    }
  });

  // Track page unload
  window.addEventListener("beforeunload", () => {
    stopReading();
  });

  // Expose functions globally
  window.readingTracker = {
    startReading,
    stopReading,
  };
})();
