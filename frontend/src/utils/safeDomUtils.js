// Safe DOM utility functions to prevent "Cannot read properties of undefined" errors

export const safeSetStyle = (element, property, value) => {
  try {
    if (element && element.style && typeof element.style === 'object') {
      element.style[property] = value;
    }
  } catch (error) {
    console.warn('SafeDomUtils: Failed to set style', { property, value, error });
  }
};

export const safeSetMultipleStyles = (element, styles) => {
  try {
    if (element && element.style && typeof element.style === 'object' && styles) {
      Object.entries(styles).forEach(([property, value]) => {
        element.style[property] = value;
      });
    }
  } catch (error) {
    console.warn('SafeDomUtils: Failed to set multiple styles', { styles, error });
  }
};

export const safeGetCurrentTarget = (event) => {
  try {
    return event && event.currentTarget ? event.currentTarget : null;
  } catch (error) {
    console.warn('SafeDomUtils: Failed to get currentTarget', error);
    return null;
  }
};

export const safeGetTarget = (event) => {
  try {
    return event && event.target ? event.target : null;
  } catch (error) {
    console.warn('SafeDomUtils: Failed to get target', error);
    return null;
  }
};

// Safe event handlers for common style manipulations
export const createSafeHoverHandlers = (enterStyles, leaveStyles) => {
  return {
    onMouseEnter: (e) => {
      const element = safeGetCurrentTarget(e);
      if (element && enterStyles) {
        safeSetMultipleStyles(element, enterStyles);
      }
    },
    onMouseLeave: (e) => {
      const element = safeGetCurrentTarget(e);
      if (element && leaveStyles) {
        safeSetMultipleStyles(element, leaveStyles);
      }
    }
  };
};

export const createSafeFocusHandlers = (focusStyles, blurStyles) => {
  return {
    onFocus: (e) => {
      const element = safeGetCurrentTarget(e);
      if (element && focusStyles) {
        safeSetMultipleStyles(element, focusStyles);
      }
    },
    onBlur: (e) => {
      const element = safeGetCurrentTarget(e);
      if (element && blurStyles) {
        safeSetMultipleStyles(element, blurStyles);
      }
    }
  };
};
