// Browser compatibility utilities

/**
 * Detect browser and version
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const isIE = /MSIE|Trident/.test(userAgent);
  const isEdge = /Edge/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isOpera = /Opera|OPR/.test(userAgent);
  
  // Mobile detection
  const isMobile = /Mobi|Android/i.test(userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  
  return {
    isIE,
    isEdge,
    isChrome,
    isFirefox,
    isSafari,
    isOpera,
    isMobile,
    isIOS,
    isAndroid,
    userAgent
  };
};

/**
 * Check if a feature is supported
 */
export const supports = {
  flexbox: () => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    return div.style.display === 'flex';
  },
  
  grid: () => {
    const div = document.createElement('div');
    div.style.display = 'grid';
    return div.style.display === 'grid';
  },
  
  objectFit: () => {
    return 'objectFit' in document.documentElement.style;
  },
  
  webp: () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  },
  
  intersectionObserver: () => {
    return 'IntersectionObserver' in window;
  },
  
  resizeObserver: () => {
    return 'ResizeObserver' in window;
  },
  
  mutationObserver: () => {
    return 'MutationObserver' in window;
  },
  
  serviceWorker: () => {
    return 'serviceWorker' in navigator;
  },
  
  localStorage: () => {
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  sessionStorage: () => {
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  },
  
  geolocation: () => {
    return 'geolocation' in navigator;
  },
  
  touch: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  promises: () => {
    return 'Promise' in window;
  },
  
  fetch: () => {
    return 'fetch' in window;
  }
};

/**
 * Add CSS class based on browser
 */
export const addBrowserClasses = () => {
  const html = document.documentElement;
  const browser = getBrowserInfo();
  
  // Add browser classes
  if (browser.isIE) html.classList.add('ie');
  if (browser.isEdge) html.classList.add('edge');
  if (browser.isChrome) html.classList.add('chrome');
  if (browser.isFirefox) html.classList.add('firefox');
  if (browser.isSafari) html.classList.add('safari');
  if (browser.isOpera) html.classList.add('opera');
  
  // Add mobile classes
  if (browser.isMobile) html.classList.add('mobile');
  if (browser.isIOS) html.classList.add('ios');
  if (browser.isAndroid) html.classList.add('android');
  
  // Add feature support classes
  if (!supports.flexbox()) html.classList.add('no-flexbox');
  if (!supports.grid()) html.classList.add('no-grid');
  if (!supports.objectFit()) html.classList.add('no-object-fit');
  if (!supports.webp()) html.classList.add('no-webp');
  if (supports.touch()) html.classList.add('touch');
  
  return browser;
};

/**
 * Safe localStorage wrapper
 */
export const safeStorage = {
  get: (key, defaultValue = null) => {
    if (!supports.localStorage()) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    if (!supports.localStorage()) return false;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Error writing to localStorage:', e);
      return false;
    }
  },
  
  remove: (key) => {
    if (!supports.localStorage()) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('Error removing from localStorage:', e);
      return false;
    }
  }
};

/**
 * Polyfill for requestAnimationFrame
 */
export const requestAnimationFrame = window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout(callback, 1000 / 60);
  };

/**
 * Safe feature detection and fallback
 */
export const withFallback = (feature, callback, fallback) => {
  if (feature()) {
    return callback();
  } else {
    return fallback ? fallback() : null;
  }
};

/**
 * Initialize browser compatibility
 */
export const initCompatibility = () => {
  // Add browser classes
  const browser = addBrowserClasses();
  
  // Log browser info in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Browser info:', browser);
    console.log('Feature support:', {
      flexbox: supports.flexbox(),
      grid: supports.grid(),
      objectFit: supports.objectFit(),
      webp: supports.webp(),
      intersectionObserver: supports.intersectionObserver(),
      localStorage: supports.localStorage(),
      geolocation: supports.geolocation(),
      touch: supports.touch(),
      promises: supports.promises(),
      fetch: supports.fetch()
    });
  }
  
  return browser;
};

export default {
  getBrowserInfo,
  supports,
  addBrowserClasses,
  safeStorage,
  requestAnimationFrame,
  withFallback,
  initCompatibility
};
