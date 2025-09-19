/**
 * Utility functions for data manipulation and common operations
 */

const utils = {
  /**
   * Get SDG information including emoji, label, and color
   * @param {string} sdg - SDG identifier (e.g., "SDG 1")
   * @returns {Object} SDG information object
   */
  getSdgInfo(sdg) {
    return CONFIG.SDG_INFO[sdg] || { emoji: '❓', label: sdg, color: '#CCCCCC' };
  },

  /**
   * Format SDG with emoji icon
   * @param {string} sdg - SDG identifier (e.g., "SDG 1")
   * @returns {string} Formatted SDG with emoji
   */
  formatSdgWithIcon(sdg) {
    const info = this.getSdgInfo(sdg);
    return `${info.emoji} ${sdg}`;
  },

  /**
   * Format SDG with emoji and full label
   * @param {string} sdg - SDG identifier (e.g., "SDG 1")
   * @returns {string} Formatted SDG with emoji and label
   */
  formatSdgWithLabel(sdg) {
    const info = this.getSdgInfo(sdg);
    return `${info.emoji} ${sdg}: ${info.label}`;
  },

  /**
   * Converts value to array if not already an array
   * @param {*} v - Value to convert
   * @returns {Array} Array representation of the value
   */
  toArray: v => Array.isArray(v) ? v : (v ? [v] : []),
  
  /**
   * Returns unique, sorted array of non-empty values
   * @param {Array} arr - Input array
   * @returns {Array} Unique, sorted array
   */
  unique: arr => [...new Set(arr)].filter(Boolean).sort(),
  
  /**
   * Safely converts value to number, returns 0 for invalid numbers
   * @param {*} v - Value to convert
   * @returns {number} Safe number value
   */
  safeNumber: v => { 
    const n = Number(v); 
    return isFinite(n) ? n : 0; 
  },
  
  /**
   * Formats number with appropriate suffixes (K, M)
   * @param {number} num - Number to format
   * @param {number} decimals - Number of decimal places
   * @returns {string} Formatted number string
   */
  formatNumber: (num, decimals = 1) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return (+num).toFixed(decimals);
  },
  
  /**
   * Creates debounced function to limit execution frequency
   * @param {Function} fn - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce: (fn, wait = CONFIG.DEBOUNCE_DELAY) => { 
    let t; 
    return (...a) => { 
      clearTimeout(t); 
      t = setTimeout(() => fn(...a), wait); 
    }; 
  },
  
  /**
   * Throttles function execution to limit frequency
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Time limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle: (fn, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        fn.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  /**
   * Loads data from a URL with retry logic and error handling
   * @param {string} url - URL to fetch data from
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Parsed JSON data
   */
  async loadDataWithRetry(url, options = {}) {
    const { RETRY_ATTEMPTS, RETRY_DELAY, TIMEOUT } = CONFIG.DATA_LOADING;
    
    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          cache: CONFIG.DATA_LOADING.ENABLE_CACHING ? 'default' : 'no-cache'
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Successfully loaded data from ${url} (attempt ${attempt})`);
        return data;
        
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt}/${RETRY_ATTEMPTS} failed for ${url}:`, error.message);
        
        if (attempt === RETRY_ATTEMPTS) {
          throw new Error(`Failed to load ${url} after ${RETRY_ATTEMPTS} attempts: ${error.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  },
  
  /**
   * DOM element selector helper
   * @param {string} id - Element ID
   * @returns {HTMLElement|null} DOM element
   */
  el: id => document.getElementById(id)
};

/**
 * Converts numeric score to visual star rating display
 * @param {number|string} score - Score value
 * @returns {string} Star rating string
 */
function getScoreDisplay(score) {
  const num = utils.safeNumber(score);
  
  // Star rating system (1-5 stars)
  if (num >= 90) return '⭐⭐⭐⭐⭐';
  if (num >= 80) return '⭐⭐⭐⭐☆';
  if (num >= 70) return '⭐⭐⭐☆☆';
  if (num >= 50) return '⭐⭐☆☆☆';
  if (num > 0) return '⭐☆☆☆☆';
  return '☆☆☆☆☆';
}

// Legacy alias for backward compatibility
const el = utils.el;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { utils, getScoreDisplay, el };
}
