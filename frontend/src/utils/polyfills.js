// Browser Polyfills for older browsers

// Object.assign polyfill (IE 11)
if (!Object.assign) {
  Object.assign = function(target, ...sources) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    
    const to = Object(target);
    
    sources.forEach(source => {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key];
          }
        }
      }
    });
    
    return to;
  };
}

// Array.from polyfill (IE 11)
if (!Array.from) {
  Array.from = function(arrayLike, mapFn, thisArg) {
    const C = this;
    const items = Object(arrayLike);
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object - not null or undefined');
    }
    
    const mapFunction = mapFn === undefined ? undefined : mapFn;
    if (typeof mapFunction !== 'undefined' && typeof mapFunction !== 'function') {
      throw new TypeError('Array.from: when provided, the second argument must be a function');
    }
    
    const len = parseInt(items.length);
    const A = typeof C === 'function' ? Object(new C(len)) : new Array(len);
    let k = 0;
    
    while (k < len) {
      const kValue = items[k];
      const mappedValue = mapFunction ? mapFunction.call(thisArg, kValue, k) : kValue;
      A[k] = mappedValue;
      k += 1;
    }
    
    A.length = len;
    return A;
  };
}

// Array.find polyfill (IE 11)
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    
    const o = Object(this);
    const len = parseInt(o.length) || 0;
    
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    
    const thisArg = arguments[1];
    let k = 0;
    
    while (k < len) {
      const kValue = o[k];
      if (predicate.call(thisArg, kValue, k, o)) {
        return kValue;
      }
      k++;
    }
    
    return undefined;
  };
}

// Array.includes polyfill (IE 11)
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    
    const o = Object(this);
    const len = parseInt(o.length) || 0;
    
    if (len === 0) {
      return false;
    }
    
    const n = parseInt(fromIndex) || 0;
    let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    
    while (k < len) {
      if (o[k] === searchElement) {
        return true;
      }
      k++;
    }
    
    return false;
  };
}

// String.includes polyfill (IE 11)
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// String.startsWith polyfill (IE 11)
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

// String.endsWith polyfill (IE 11)
if (!String.prototype.endsWith) {
  String.prototype.endsWith = function(searchString, length) {
    if (length === undefined || length > this.length) {
      length = this.length;
    }
    return this.substring(length - searchString.length, length) === searchString;
  };
}

// Promise polyfill check (IE 11)
if (typeof Promise === 'undefined') {
  console.warn('Promise is not supported in this browser. Consider adding a Promise polyfill.');
}

// fetch polyfill check (IE 11)
if (typeof fetch === 'undefined') {
  console.warn('fetch is not supported in this browser. Consider adding a fetch polyfill.');
}

// URLSearchParams polyfill check (IE 11)
if (typeof URLSearchParams === 'undefined') {
  console.warn('URLSearchParams is not supported in this browser. Consider adding a URLSearchParams polyfill.');
}

// IntersectionObserver polyfill check (IE 11, older Safari)
if (typeof IntersectionObserver === 'undefined') {
  console.warn('IntersectionObserver is not supported in this browser. Consider adding an IntersectionObserver polyfill.');
}

// CustomEvent polyfill (IE 11)
if (typeof CustomEvent !== 'function') {
  function CustomEvent(event, params) {
    params = params || { bubbles: false, cancelable: false, detail: undefined };
    const evt = document.createEvent('CustomEvent');
    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  }
  
  CustomEvent.prototype = window.Event.prototype;
  window.CustomEvent = CustomEvent;
}

// Element.closest polyfill (IE 11)
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    let el = this;
    
    do {
      if (Element.prototype.matches.call(el, s)) return el;
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    
    return null;
  };
}

// Element.matches polyfill (IE 11)
if (!Element.prototype.matches) {
  Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}

export default {};
