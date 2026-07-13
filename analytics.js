import * as amplitude from '@amplitude/unified';

// Ensure amplitude is only initialized once
if (!window.amplitudeInitialized) {
  amplitude.initAll('14586dd1995c00fb872ef2f483ef001a', {
    "analytics": {
      "autocapture": true
    },
    "sessionReplay": {
      "sampleRate": 1
    }
  });
  window.amplitudeInitialized = true;
  window.amplitude = amplitude;
  console.log('Amplitude Analytics and Session Replay initialized successfully.');
}

// Track key client-side interactions centralizing logic
document.addEventListener('DOMContentLoaded', () => {
  // 1. Track Download CTA button clicks
  document.addEventListener('click', (e) => {
    const downloadLink = e.target.closest('a[download]');
    if (downloadLink) {
      amplitude.track('Download Button Clicked', {
        file: downloadLink.getAttribute('href'),
        text: downloadLink.innerText.trim() || 'Download',
        page: window.location.pathname
      });
    }
  });

  // 2. Track FAQ accordion expands/collapses
  document.addEventListener('click', (e) => {
    const faqItem = e.target.closest('.faq-item');
    if (faqItem) {
      // Toggle logic trigger: it takes time to transition class, so check current state
      const questionText = faqItem.querySelector('.faq-question-text')?.innerText.trim();
      const isCurrentlyActive = faqItem.classList.contains('faq-active');
      amplitude.track('FAQ Accordion Clicked', {
        question: questionText || 'Unknown',
        action: isCurrentlyActive ? 'collapse' : 'expand',
        page: window.location.pathname
      });
    }
  });

  // 3. Track Theme switcher changes
  document.addEventListener('click', (e) => {
    const themeBtn = e.target.closest('.theme-btn');
    if (themeBtn) {
      const mode = themeBtn.id.includes('day') ? 'Day' : 'Space Night';
      amplitude.track('Theme Switched', {
        mode: mode,
        page: window.location.pathname
      });
    }
  });

  // 4. Track Navigation link clicks
  document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.nav-links a, .nav-logo-link, .footer-links a');
    if (navLink) {
      amplitude.track('Navigation Link Clicked', {
        text: navLink.innerText.trim() || 'Logo',
        destination: navLink.getAttribute('href'),
        page: window.location.pathname
      });
    }
  });
});
