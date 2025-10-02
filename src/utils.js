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
   * Convert ISO3 country code to ISO2 code for flag CSS
   * @param {string} iso3 - ISO3 country code (e.g., "CHN")
   * @returns {string} ISO2 country code (e.g., "cn")
   */
  iso3ToIso2(iso3) {
    const iso3ToIso2Map = {
      'AFG': 'af', 'ALB': 'al', 'DZA': 'dz', 'AND': 'ad', 'AGO': 'ao', 'ATG': 'ag', 'ARG': 'ar', 'ARM': 'am', 'AUS': 'au', 'AUT': 'at',
      'AZE': 'az', 'BHS': 'bs', 'BHR': 'bh', 'BGD': 'bd', 'BRB': 'bb', 'BLR': 'by', 'BEL': 'be', 'BLZ': 'bz', 'BEN': 'bj', 'BTN': 'bt',
      'BOL': 'bo', 'BIH': 'ba', 'BWA': 'bw', 'BRA': 'br', 'BRN': 'bn', 'BGR': 'bg', 'BFA': 'bf', 'BDI': 'bi', 'KHM': 'kh', 'CMR': 'cm',
      'CAN': 'ca', 'CPV': 'cv', 'CAF': 'cf', 'TCD': 'td', 'CHL': 'cl', 'CHN': 'cn', 'COL': 'co', 'COM': 'km', 'COG': 'cg', 'CRI': 'cr',
      'HRV': 'hr', 'CUB': 'cu', 'CYP': 'cy', 'CZE': 'cz', 'COD': 'cd', 'DNK': 'dk', 'DJI': 'dj', 'DMA': 'dm', 'DOM': 'do', 'TLS': 'tl',
      'ECU': 'ec', 'EGY': 'eg', 'SLV': 'sv', 'GNQ': 'gq', 'ERI': 'er', 'EST': 'ee', 'SWZ': 'sz', 'ETH': 'et', 'FJI': 'fj', 'FIN': 'fi',
      'FRA': 'fr', 'GAB': 'ga', 'GMB': 'gm', 'GEO': 'ge', 'DEU': 'de', 'GHA': 'gh', 'GRC': 'gr', 'GRD': 'gd', 'GTM': 'gt', 'GIN': 'gn',
      'GNB': 'gw', 'GUY': 'gy', 'HTI': 'ht', 'HND': 'hn', 'HUN': 'hu', 'ISL': 'is', 'IND': 'in', 'IDN': 'id', 'IRN': 'ir', 'IRQ': 'iq',
      'IRL': 'ie', 'ISR': 'il', 'ITA': 'it', 'CIV': 'ci', 'JAM': 'jm', 'JPN': 'jp', 'JOR': 'jo', 'KAZ': 'kz', 'KEN': 'ke', 'KIR': 'ki',
      'KWT': 'kw', 'KGZ': 'kg', 'LAO': 'la', 'LVA': 'lv', 'LBN': 'lb', 'LSO': 'ls', 'LBR': 'lr', 'LBY': 'ly', 'LIE': 'li', 'LTU': 'lt',
      'LUX': 'lu', 'MKD': 'mk', 'MDG': 'mg', 'MWI': 'mw', 'MYS': 'my', 'MDV': 'mv', 'MLI': 'ml', 'MLT': 'mt', 'MHL': 'mh', 'MRT': 'mr',
      'MUS': 'mu', 'MEX': 'mx', 'FSM': 'fm', 'MDA': 'md', 'MCO': 'mc', 'MNG': 'mn', 'MNE': 'me', 'MAR': 'ma', 'MOZ': 'mz', 'MMR': 'mm',
      'NAM': 'na', 'NRU': 'nr', 'NPL': 'np', 'NLD': 'nl', 'NZL': 'nz', 'NIC': 'ni', 'NER': 'ne', 'NGA': 'ng', 'PRK': 'kp', 'NOR': 'no',
      'OMN': 'om', 'PAK': 'pk', 'PLW': 'pw', 'PSE': 'ps', 'PAN': 'pa', 'PNG': 'pg', 'PRY': 'py', 'PER': 'pe', 'PHL': 'ph', 'POL': 'pl',
      'PRT': 'pt', 'QAT': 'qa', 'ROU': 'ro', 'RUS': 'ru', 'RWA': 'rw', 'KNA': 'kn', 'LCA': 'lc', 'VCT': 'vc', 'WSM': 'ws', 'SMR': 'sm',
      'STP': 'st', 'SAU': 'sa', 'SEN': 'sn', 'SRB': 'rs', 'SYC': 'sc', 'SLE': 'sl', 'SGP': 'sg', 'SVK': 'sk', 'SVN': 'si', 'SLB': 'sb',
      'SOM': 'so', 'ZAF': 'za', 'KOR': 'kr', 'SSD': 'ss', 'ESP': 'es', 'LKA': 'lk', 'SDN': 'sd', 'SUR': 'sr', 'SWE': 'se', 'CHE': 'ch',
      'SYR': 'sy', 'TWN': 'tw', 'TJK': 'tj', 'TZA': 'tz', 'THA': 'th', 'TGO': 'tg', 'TON': 'to', 'TTO': 'tt', 'TUN': 'tn', 'TUR': 'tr',
      'TKM': 'tm', 'TUV': 'tv', 'UGA': 'ug', 'UKR': 'ua', 'ARE': 'ae', 'GBR': 'gb', 'USA': 'us', 'URY': 'uy', 'UZB': 'uz', 'VUT': 'vu',
      'VAT': 'va', 'VEN': 've', 'VNM': 'vn', 'YEM': 'ye', 'ZMB': 'zm', 'ZWE': 'zw'
    };
    return iso3ToIso2Map[iso3] || 'xx';
  },

  /**
   * Get country flag HTML element
   * @param {string} countryName - Full country name
   * @returns {string} HTML string for country flag
   */
  getCountryFlag(countryName) {
    const iso3 = window.COUNTRY_TO_ISO3[countryName];
    if (!iso3) return '';
    
    const iso2 = this.iso3ToIso2(iso3);
    return `<span class="fi fi-${iso2} flag" style="margin-right: 8px; font-size: 16px;"></span>`;
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
  el: id => document.getElementById(id),

  /**
   * Truncate text to specified length with ellipsis
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength = 200) {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Toggle solution details visibility
   * @param {string} expandableId - ID of the expandable container
   */
  toggleSolutionDetails(expandableId) {
    const expandable = document.getElementById(expandableId);
    const toggleBtn = expandable?.parentElement?.querySelector('.toggle-details-btn');
    
    if (!expandable || !toggleBtn) return;
    
    const isExpanded = expandable.classList.contains('expanded');
    const toggleText = toggleBtn.querySelector('.toggle-text');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    
    if (isExpanded) {
      expandable.classList.remove('expanded');
      toggleText.textContent = 'Show Details';
      toggleIcon.textContent = '▼';
    } else {
      expandable.classList.add('expanded');
      toggleText.textContent = 'Hide Details';
      toggleIcon.textContent = '▲';
    }
  },

  /**
   * Toggle read more/less for specific text content
   * @param {string} expandableId - ID of the expandable container
   * @param {string} sectionType - Type of section (problem, solution, impact, etc.)
   */
  toggleReadMore(expandableId, sectionType) {
    const expandable = document.getElementById(expandableId);
    if (!expandable) return;
    
    const section = expandable.querySelector(`[data-section="${sectionType}"]`) || 
                   expandable.querySelector(`.expandable-section:nth-child(${this.getSectionIndex(sectionType)})`);
    
    if (!section) return;
    
    const textContent = section.querySelector('.text-content');
    const readMoreBtn = section.querySelector('.read-more-btn');
    
    if (!textContent || !readMoreBtn) return;
    
    const fullText = textContent.getAttribute('data-full-text');
    const isExpanded = textContent.classList.contains('expanded');
    
    if (isExpanded) {
      textContent.innerHTML = this.truncateText(fullText, 200);
      textContent.classList.remove('expanded');
      readMoreBtn.textContent = 'Read More';
    } else {
      textContent.innerHTML = fullText;
      textContent.classList.add('expanded');
      readMoreBtn.textContent = 'Read Less';
    }
  },

  /**
   * Get section index based on section type
   * @param {string} sectionType - Type of section
   * @returns {number} Section index
   */
  getSectionIndex(sectionType) {
    const sectionMap = {
      'summary': 1,
      'problem': 2,
      'solution': 3,
      'implementation': 4,
      'impact': 5,
      'technologies': 6,
      'duration': 7,
      'unique': 8,
      'testimonials': 9
    };
    return sectionMap[sectionType] || 1;
  }
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
