/**
 * Global Call for Solutions Analytics Dashboard
 * Main application logic for data visualization and filtering
 * 
 * Architecture Overview:
 * - CONFIG: Application configuration and constants
 * - Utils: Utility functions for data manipulation
 * - ThemeManager: Handles dark/light theme switching
 * - DataProcessor: Processes and normalizes raw data
 * - AppState: Manages application state and filtering
 * - Renderers: Functions for rendering charts and visualizations
 * - MapControls: Custom map controls (fullscreen, projection)
 * - FilterManager: Handles filter UI and logic
 * - ModalManager: Manages modal dialogs
 * 
 * DATA SOURCE UPDATES:
 * To update with new datasets, modify the DATA_SOURCES section in CONFIG:
 * 1. Update MAIN_DATA path to point to your new submissions data file
 * 2. Update COUNTRY_MAPPING path if you have new country-region mappings
 * 3. Ensure your data follows the same JSON structure as the original files
 * 4. The dashboard will automatically retry loading and provide helpful error messages
 */

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CONFIG = {
  // ============================================================================
  // DATA SOURCE CONFIGURATION
  // ============================================================================
  // To update with new datasets, simply change the file paths below:
  // - MAIN_DATA: Path to your primary submissions data (JSON format)
  // - COUNTRY_MAPPING: Path to country-region mapping file (optional)
  // 
  // Example: To use new data files, update like this:
  // MAIN_DATA: 'new_submissions_2025.json',
  // COUNTRY_MAPPING: 'updated_country_mapping.json'
  // ============================================================================
  
  MATURITY_ORDER: ["Idea/Concept", "Proof of Concept", "MVP", "Pilot Stage", "Implemented at scale"],
  CHART_COLORS: ['#00A3E0', '#45FFD3', '#F6C453', '#118E9C', '#1BC7BE'],
  MAX_TOP_SOLUTIONS: 10,
  CSV_FILENAME: 'global_solutions_export.csv',
  MAPBOX_TOKEN: 'pk.eyJ1Ijoiemlsb25nLXRlY2giLCJhIjoiY21mMmhvZWp0MXZtdjJpcXlzOWswZGM1ZiJ9.tk_JMGIpKj5KS4bSBEukqw',
  
  // Data source configuration - UPDATE THESE PATHS FOR NEW DATASETS
  DATA_SOURCES: {
    MAIN_DATA: 'data.json',                    // Primary submissions data
    COUNTRY_MAPPING: 'country_region_mapping.json'  // Optional country-region mappings
  },
  
  // Data loading configuration
  DATA_LOADING: {
    RETRY_ATTEMPTS: 3,                         // Number of retry attempts for failed loads
    RETRY_DELAY: 1000,                         // Delay between retry attempts (ms)
    TIMEOUT: 30000,                            // Request timeout (ms)
    ENABLE_CACHING: true,                      // Enable browser caching for data files
    SHOW_LOADING_INDICATOR: true               // Show loading indicator during data fetch
  },
  
  // Performance settings
  DEBOUNCE_DELAY: 300,
  RENDER_DEBOUNCE_DELAY: 250,
  
  // UI settings
  DEFAULT_KIOSK_MODE: true,
  DEFAULT_THEME: 'dark',
  DEFAULT_MAP_PROJECTION: 'equirectangular'
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Utility functions for data manipulation and common operations
 */
const utils = {
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

// ============================================================================
// SCORE DISPLAY UTILITIES
// ============================================================================

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
  
  // Alternative display options (uncomment one of these instead):
  
  // Option 2: Simple numeric with emoji
  // return `${utils.formatNumber(num)} ⭐`;
  
  // Option 3: Grade system
  // if (num >= 90) return 'A+';
  // if (num >= 80) return 'A';
  // if (num >= 70) return 'B+';
  // if (num >= 60) return 'B';
  // if (num >= 50) return 'C+';
  // if (num >= 40) return 'C';
  // if (num >= 30) return 'D';
  // return 'F';
  
  // Option 4: Performance level
  // if (num >= 80) return '🏆 Excellent';
  // if (num >= 60) return '🥈 Good';
  // if (num >= 40) return '🥉 Fair';
  // if (num >= 20) return '📈 Developing';
  // return '🌱 Early';
  
  // Option 5: Just the number with a subtle indicator
  // return `${utils.formatNumber(num)}`;
}

// Legacy alias for backward compatibility
const el = utils.el;

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

/**
 * Plotly.js theme configuration for charts
 */
const PlotTheme = {
  paper: 'rgba(0,0,0,0)',
  plot: 'rgba(0,0,0,0)',
  fontColor: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#EAF4FF',
  grid: 'rgba(255,255,255,.08)'
};

/**
 * Common layout configuration for all Plotly charts
 */
const commonLayout = {
  paper_bgcolor: PlotTheme.paper,
  plot_bgcolor: PlotTheme.plot,
  font: { color: PlotTheme.fontColor, size: 16 },
  margin: { t: 10, r: 10, b: 50, l: 60 },
  xaxis: { gridcolor: PlotTheme.grid, zeroline: false },
  yaxis: { gridcolor: PlotTheme.grid, zeroline: false },
};

/**
 * Manages application theme switching between dark and light modes
 */
const ThemeManager = {
  currentTheme: CONFIG.DEFAULT_THEME,
  
  /**
   * Initialize theme manager and load saved theme
   */
  init() {
    const savedTheme = localStorage.getItem('unga-theme');
    if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      this.setTheme(CONFIG.DEFAULT_THEME);
    }
  },
  
  /**
   * Set application theme
   * @param {string} theme - Theme name ('dark' or 'light')
   */
  setTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : 'dark');
    localStorage.setItem('unga-theme', theme);
    
    this._updateThemeButton();
    console.log(`Theme changed to ${theme}. Map will use ${theme} style on next creation.`);
  },
  
  /**
   * Toggle between dark and light themes
   */
  toggle() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    
    // Recreate map with new theme if it exists
    if (window.map) {
      console.log('Recreating map with new theme...');
      window.map.remove();
      window.map = null;
      setTimeout(() => {
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }, 100);
    }
  },
  
  /**
   * Update theme toggle button appearance
   * @private
   */
  _updateThemeButton() {
    const toggleBtn = utils.el('toggleTheme');
    if (toggleBtn) {
      toggleBtn.innerHTML = this.currentTheme === 'light' ? '🌙' : '☀️';
      toggleBtn.title = this.currentTheme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }
  }
};

// ============================================================================
// DATA PROCESSING
// ============================================================================

/**
 * Normalizes SDG strings from various formats to standard format
 * @param {string} s - SDG string to normalize
 * @returns {Array<string>} Array of normalized SDG strings
 */
const sdgNormalize = (s) => {
  if (!s) return [];
  return s.split(';').map(x => x.trim()).filter(Boolean)
    .map(x => {
      // Handle Russian translations
      if (x.includes('ЦУР 10') || x.includes('сокращение неравенства')) return 'SDG 10';
      if (x.includes('ЦУР 12') || x.includes('Ответственное потребление и производство')) return 'SDG 12';
      if (x.includes('ЦУР 8') || x.includes('Достойный труд и экономический рост')) return 'SDG 8';
      return x.replace(/^SDG\s*/i, 'SDG ').replace(/\s+/g, ' ');
    })
    .map(x => x.replace(/^(SDG)?\s*(\d{1,2}).*$/i, (_, __, n) => `SDG ${n}`));
};

/**
 * Handles data processing, normalization, and KPI calculations
 */
const DataProcessor = {
  /**
   * Normalizes a raw data row to standardized format
   * @param {Object} row - Raw data row
   * @returns {Object} Normalized data row with computed fields
   */
  normalizeRow(row) {
    const country = (row['Country'] || '').trim();
    const iso3 = window.COUNTRY_TO_ISO3?.[country] || null;
    const sdgs = sdgNormalize(row['SDGs addressed']);
    
    // Normalize maturity stage
    let maturity = (row['Maturity stage'] || '').trim();
    if (maturity === 'Пилотный этап (мелкая реализация)') {
      maturity = 'Pilot stage (small-scale implementation)';
    }
    if (/Proof-of-Concept|Prototype/i.test(maturity)) {
      maturity = 'Proof of Concept';
    } else if (/Minimum Viable Product|MVP|Pilot-ready/i.test(maturity)) {
      maturity = 'MVP';
    } else if (/Pilot stage|small-scale implementation/i.test(maturity)) {
      maturity = 'Pilot Stage';
    }
    
    // Normalize organization type
    let org = (row['Please specify the type of organization you are representing.'] || '').replace(/\*+$/, '').trim();
    if (org === 'Частный сектор') {
      org = 'Private sector';
    }
    if (/Academia|university|think tank/i.test(org)) {
      org = 'Academia';
    } else if (/Civil society|NGO|community groups/i.test(org)) {
      org = 'Civil society';
    } else if (/International Organisation/i.test(org) && !/UN/i.test(org)) {
      org = 'International Organisation';
    }
    
    const region = (row['Region'] || '').trim();
    const score = utils.safeNumber(row['Total Score']);
    const theme = (row['Primary thematic focus area'] || '').trim();
    
    return {
      ...row,
      _country: country,
      _iso3: iso3,
      _sdgs: sdgs,
      _maturity: maturity,
      _org: org,
      _region: region,
      _score: score,
      _theme: theme
    };
  },
  
  /**
   * Calculates key performance indicators from data
   * @param {Array} data - Array of normalized data rows
   * @returns {Object} KPI metrics
   */
  kpis(data) {
    const countries = utils.unique(data.map(d => d._country));
    
    // Calculate implemented solutions (at scale, MVP, pilot stage)
    const implemented = data.filter(d => 
      d._maturity === 'Implemented at scale' || 
      d._maturity === 'MVP' || 
      d._maturity === 'Pilot Stage'
    ).length;
    
    // Calculate emerging solutions (ideas, proof of concept)
    const emerging = data.filter(d => 
      d._maturity === 'Idea/Concept' || 
      d._maturity === 'Proof of Concept'
    ).length;
    
    return { 
      submissions: data.length, 
      countries: countries.length, 
      implemented,
      emerging
    };
  }
};

// ============================================================================
// APPLICATION STATE
// ============================================================================

/**
 * Manages application state including data, filters, and UI state
 */
class AppState {
  constructor() {
    this.rawData = [];
    this.filters = {
      region: new Set(),
      country: new Set(),
      org: new Set(),
      maturity: new Set(),
      sdg: new Set()
    };
    this.countryRegionMapping = null;
    this.kiosk = CONFIG.DEFAULT_KIOSK_MODE; // Controls hidden initially
    this.mapProjection = localStorage.getItem('unga-map-projection') || CONFIG.DEFAULT_MAP_PROJECTION;
    this.selectedCountry = null; // Track currently selected country
    this.submissionsModal = null; // Reference to submissions modal
  }
  
  /**
   * Returns filtered data based on current filter settings
   * @returns {Array} Filtered data array
   */
  getFilteredData() {
    return this.rawData.filter(r =>
      (this.filters.region.size === 0 || this.filters.region.has(r._region)) &&
      (this.filters.country.size === 0 || this.filters.country.has(r._country)) &&
      (this.filters.org.size === 0 || this.filters.org.has(r._org)) &&
      (this.filters.maturity.size === 0 || this.filters.maturity.has(r._maturity)) &&
      (this.filters.sdg.size === 0 || r._sdgs.some(s => this.filters.sdg.has(s)))
    );
  }
  
  /**
   * Clears all active filters and resets filter UI
   */
  clearFilters() {
    this.filters = {
      region: new Set(),
      country: new Set(),
      org: new Set(),
      maturity: new Set(),
      sdg: new Set()
    };
    updateFilterUI(false);
    updateFilterDisplay();
  }
  
  /**
   * Toggles between 2D and 3D map projections
   * @returns {string} New projection type
   */
  toggleMapProjection() {
    this.mapProjection = this.mapProjection === 'equirectangular' ? 'globe' : 'equirectangular';
    this.updateMapProjectionButton();
    localStorage.setItem('unga-map-projection', this.mapProjection);
    return this.mapProjection;
  }
  
  /**
   * Updates map projection button appearance
   */
  updateMapProjectionButton() {
    const btn = utils.el('toggleMapView');
    if (btn) {
      btn.innerHTML = this.mapProjection === 'equirectangular' ? '🌍 2D' : '🌐 3D';
      btn.title = this.mapProjection === 'equirectangular' ? 'Switch to 3D Globe view' : 'Switch to 2D Flat view';
      btn.classList.toggle('active', this.mapProjection === 'globe');
    }
  }
  
  /**
   * Selects a country and shows its submissions
   * @param {string} countryName - Name of the country to select
   */
  selectCountry(countryName) {
    this.selectedCountry = countryName;
    this.showCountrySubmissions(countryName);
  }
  
  /**
   * Clears country selection and hides modal
   */
  clearCountrySelection() {
    this.selectedCountry = null;
    this.hideSubmissionsModal();
  }
  
  /**
   * Gets all submissions for a specific country
   * @param {string} countryName - Name of the country
   * @returns {Array} Array of submissions for the country
   */
  getCountrySubmissions(countryName) {
    return this.rawData.filter(r => r._country === countryName);
  }
  
  /**
   * Shows submissions modal for a specific country
   * @param {string} countryName - Name of the country
   */
  showCountrySubmissions(countryName) {
    const submissions = this.getCountrySubmissions(countryName);
    if (submissions.length === 0) return;
    
    this.createSubmissionsModal(countryName, submissions);
  }
  
  /**
   * Creates and displays submissions modal for a country
   * @param {string} countryName - Name of the country
   * @param {Array} submissions - Array of submissions to display
   */
  createSubmissionsModal(countryName, submissions) {
    // Remove existing modal if any
    this.hideSubmissionsModal();
    
    const modal = document.createElement('div');
    modal.id = 'submissions-modal';
    modal.className = 'submissions-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${countryName}: ${submissions.length} submission${submissions.length !== 1 ? 's' : ''}</h3>
          <!-- Hidden feature: Modal stats (preserved for future use) -->
          <!-- <div class="modal-stats">
            <span class="stat">${submissions.length} submission${submissions.length !== 1 ? 's' : ''}</span>
            <span class="stat">Avg Score: ${utils.formatNumber(submissions.reduce((sum, s) => sum + s._score, 0) / submissions.length)}</span>
          </div> -->
          <button class="modal-close" onclick="appState.hideSubmissionsModal()">×</button>
        </div>
        <div class="modal-body">
          <!-- Hidden feature: Modal actions (preserved for future use) -->
          <!-- <div class="modal-actions">
            <button class="btn primary" onclick="appState.filterByCountry('${countryName}')">
              🔍 Filter by ${countryName}
            </button>
            <button class="btn secondary" onclick="appState.clearCountrySelection()">
              🗑️ Clear Selection
            </button>
          </div> -->
          <div class="submissions-list">
            ${submissions.map((submission, index) => `
              <div class="submission-card">
                <div class="submission-header">
                  <div class="submission-title">
                    ${submission['Title'] || 'Untitled Solution'}
                  </div>
                  <div class="submission-score" title="Solution Score: ${utils.formatNumber(submission._score)}">
                    ${getScoreDisplay(submission._score)}
                  </div>
                </div>
                <div class="submission-details">
                  <div class="detail-row">
                    <span class="label">🏢 Organization:</span>
                    <span class="value">${submission._org}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">📈 Maturity:</span>
                    <span class="value">${submission._maturity}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">🎯 SDGs:</span>
                    <span class="value">${submission._sdgs.join(', ')}</span>
                  </div>
                  ${submission._theme ? `
                    <div class="detail-row">
                      <span class="label">🎨 Theme:</span>
                      <span class="value">${submission._theme}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.submissionsModal = modal;
    
    // Add click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideSubmissionsModal();
      }
    });
  }
  
  /**
   * Hides the submissions modal
   */
  hideSubmissionsModal() {
    if (this.submissionsModal) {
      this.submissionsModal.remove();
      this.submissionsModal = null;
    }
  }
  
  /**
   * Filters data to show only submissions from a specific country
   * @param {string} countryName - Name of the country to filter by
   */
  filterByCountry(countryName) {
    // Clear other filters and set country filter
    this.clearFilters();
    this.filters.country.add(countryName);
    
    // Update UI
    const countrySelect = utils.el('fCountry');
    if (countrySelect) {
      const option = Array.from(countrySelect.options).find(opt => opt.value === countryName);
      if (option) option.selected = true;
    }
    
    // Re-render everything
    renderAll();
    
    // Close modal
    this.hideSubmissionsModal();
    
    // Show a brief success message
    this.showNotification(`Filtered to show submissions from ${countryName}`);
  }
  
  /**
   * Shows a temporary notification message
   * @param {string} message - Message to display
   */
  showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      background: var(--brand); color: white; padding: 12px 20px;
      border-radius: 6px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transform: translateX(100%); transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

const appState = new AppState();

// ============================================================================
// UI RENDERERS
// ============================================================================

/**
 * Renders KPI cards with key metrics
 * @param {Array} data - Filtered data array
 */
function renderKPIs(data) {
  const { submissions, countries, implemented, emerging } = DataProcessor.kpis(data);
  utils.el('kpis').innerHTML = `
    <div class="kpi">
      <div class="label">Countries Represented</div>
      <div class="value">${utils.formatNumber(countries, 0)}</div>
      <div class="hint">unique countries</div>
    </div>
    <div class="kpi">
      <div class="label">Total Solutions</div>
      <div class="value">${utils.formatNumber(submissions, 0)}</div>
      <div class="hint">entries</div>
    </div>
    <div class="kpi">
      <div class="label">Implemented Solutions</div>
      <div class="value">${utils.formatNumber(implemented, 0)}</div>
      <div class="hint">at scale, MVP & pilot</div>
    </div>
    <div class="kpi">
      <div class="label">Emerging Solutions</div>
      <div class="value">${utils.formatNumber(emerging, 0)}</div>
      <div class="hint">ideas & concepts</div>
    </div>
  `;
}

/**
 * Renders SDG treemap visualization
 * @param {Array} data - Filtered data array
 */
function renderSdgStack(data) {
  const all = utils.unique(data.flatMap(d => d._sdgs));
  const by = Object.fromEntries(all.map(s => [s, 0]));
  data.forEach(d => d._sdgs.forEach(s => by[s] = (by[s] || 0) + 1));
  const sorted = Object.entries(by).sort(([a], [b]) => Number(a.split(' ')[1]) - Number(b.split(' ')[1]));
  const labels = sorted.map(([k]) => k);
  const parents = labels.map(() => '');
  const values = sorted.map(([, v]) => v);
  const trace = { 
    type: 'treemap', 
    labels, 
    parents, 
    values, 
    marker: { colors: CONFIG.CHART_COLORS } 
  };
  Plotly.newPlot('sdgStack', [trace], { ...commonLayout, margin: { t: 10, l: 10, r: 10, b: 10 } }, { displayModeBar: false, responsive: true });
}

/**
 * Renders score distribution histogram (HIDDEN FUNCTION - preserved for future use)
 * @param {Array} data - Filtered data array
 */
function renderScoreHist(data) {
  const scores = data.map(d => d._score).filter(s => s > 0);
  const trace = { 
    type: 'histogram', 
    x: scores, 
    nbinsx: 18, 
    marker: { color: '#1BC7BE', line: { width: 0 } } 
  };
  const layout = { 
    ...commonLayout, 
    xaxis: { ...commonLayout.xaxis, title: 'Score' }, 
    yaxis: { ...commonLayout.yaxis, title: 'Count' } 
  };
  Plotly.newPlot('scoreHist', [trace], layout, { displayModeBar: false, responsive: true });
}

/**
 * Renders organization type pie chart
 * @param {Array} data - Filtered data array
 */
function renderOrgPie(data) {
  // Count organization types
  const orgCounts = {};
  data.forEach(d => {
    const org = d._org || 'Unknown';
    orgCounts[org] = (orgCounts[org] || 0) + 1;
  });
  
  // Convert to arrays for Plotly
  const labels = Object.keys(orgCounts);
  const values = Object.values(orgCounts);
  
  // Calculate percentages for hover text
  const total = values.reduce((sum, val) => sum + val, 0);
  const percentages = values.map(val => ((val / total) * 100).toFixed(1));
  
  const trace = {
    type: 'pie',
    labels: labels,
    values: values,
    textinfo: 'label+percent',
    textposition: 'outside',
    textfont: {
      size: 15,
      color: ThemeManager.currentTheme === 'dark' ? '#FFFFFF' : '#0F172A',
      family: 'inherit'
    },
    hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>',
    marker: {
      colors: CONFIG.CHART_COLORS,
      line: {
        color: 'var(--bg)',
        width: 2
      }
    }
  };
  
  const layout = {
    ...commonLayout,
    margin: { t: 20, r: 20, b: 20, l: 20 },
    showlegend: false,
    font: {
      size: 15,
      color: ThemeManager.currentTheme === 'dark' ? '#FFFFFF' : '#0F172A',
      family: 'inherit'
    }
  };
  
  Plotly.newPlot('orgPie', [trace], layout, { displayModeBar: false, responsive: true });
}

/**
 * Main render function that updates all visualizations
 * Renders all charts and components with current filtered data
 * 
 * Performance Note: This function is called frequently during filtering.
 * Consider implementing render batching or virtualization for large datasets.
 */
function renderAll() {
  const data = appState.getFilteredData();
  console.log(`🎯 Rendering ${data.length} submissions (filtered from ${appState.rawData.length} total)`);
  
  // Render all visualizations
  renderKPIs(data);
  renderMap(data);
  renderSdgStack(data);
  renderOrgPie(data);
  renderScoreHist(data); // Hidden function - preserved for future use
}

// ============================================================================
// MAP CONTROLS
// ============================================================================

/**
 * Custom fullscreen control for map
 * Allows toggling map between embedded and fullscreen modes
 */
class FullscreenControl {
  constructor() {
    this._isFullscreen = false;
    this._originalStyle = null;
    this._originalParent = null;
    this._originalPosition = null;
    this._originalZIndex = null;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      margin: 10px;
    `;

    this._button = document.createElement('button');
    this._button.className = 'mapboxgl-ctrl-icon fullscreen-control';
    this._button.type = 'button';
    this._button.title = 'Toggle fullscreen view';
    this._button.innerHTML = '⛶'; // Fullscreen icon
    this._button.style.cssText = `
      width: 30px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;

    this._button.addEventListener('click', () => {
      this._toggleFullscreen();
    });

    this._container.appendChild(this._button);

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this._updateButton();
    });

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }

  _toggleFullscreen() {
    if (!this._isFullscreen) {
      this._enterFullscreen();
    } else {
      this._exitFullscreen();
    }
  }

  _enterFullscreen() {
    const mapContainer = this._map.getContainer();
    
    // Store original styles
    this._originalStyle = mapContainer.style.cssText;
    this._originalParent = mapContainer.parentNode;
    this._originalPosition = mapContainer.style.position;
    this._originalZIndex = mapContainer.style.zIndex;

    // Create fullscreen container
    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.id = 'map-fullscreen-container';
    fullscreenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: var(--bg);
      z-index: 9999;
      display: flex;
      flex-direction: column;
    `;

    // Move map to fullscreen container
    fullscreenContainer.appendChild(mapContainer);

    // Update map container styles
    mapContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    `;

    // Add to document
    document.body.appendChild(fullscreenContainer);

    // Resize map
    setTimeout(() => {
      this._map.resize();
    }, 100);

    this._isFullscreen = true;
    this._updateButton();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  _exitFullscreen() {
    const fullscreenContainer = document.getElementById('map-fullscreen-container');
    if (fullscreenContainer) {
      const mapContainer = this._map.getContainer();
      
      // Restore original parent and styles
      this._originalParent.appendChild(mapContainer);
      mapContainer.style.cssText = this._originalStyle;

      // Remove fullscreen container
      fullscreenContainer.remove();

      // Resize map
      setTimeout(() => {
        this._map.resize();
      }, 100);

      this._isFullscreen = false;
      this._updateButton();

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  _updateButton() {
    if (this._button) {
      this._button.innerHTML = this._isFullscreen ? '⛶' : '⛶';
      this._button.title = this._isFullscreen ? 'Exit fullscreen view' : 'Enter fullscreen view';
    }
  }
}

/**
 * Custom map projection control
 * Allows toggling between 2D flat and 3D globe projections
 */
class MapProjectionControl {
  constructor() {
    this._isGlobe = false;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      margin: 10px;
    `;

    this._button = document.createElement('button');
    this._button.className = 'mapboxgl-ctrl-icon projection-control';
    this._button.type = 'button';
    this._button.title = 'Toggle between 2D and 3D view';
    this._button.innerHTML = '🌍 2D';
    this._button.style.cssText = `
      width: 30px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-weight: 600;
    `;

    this._button.addEventListener('click', () => {
      this._toggleProjection();
    });

    this._container.appendChild(this._button);

    // Initialize button state
    this._updateButton();

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }

  _toggleProjection() {
    if (!window.map) return;
    
    const newProjection = appState.toggleMapProjection();
    console.log(`Switching to ${newProjection} projection`);
    
    try {
      window.map.setProjection(newProjection);
      
      if (newProjection === 'globe') {
        const currentZoom = window.map.getZoom();
        if (currentZoom < 1.5) {
          window.map.setZoom(1.5);
        }
      }
      
      this._updateButton();
      
      // Show feedback
      const originalText = this._button.innerHTML;
      this._button.innerHTML = newProjection === 'equirectangular' ? '✅ 2D' : '✅ 3D';
      setTimeout(() => {
        this._button.innerHTML = originalText;
      }, 1000);
    } catch (err) {
      console.error('Error changing projection:', err);
      console.log('Recreating map with new projection...');
      window.map.remove();
      window.map = null;
      setTimeout(() => {
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }, 100);
    }
  }

  _updateButton() {
    if (this._button) {
      const isGlobe = appState.mapProjection === 'globe';
      this._button.innerHTML = isGlobe ? '🌐 3D' : '🌍 2D';
      this._button.title = isGlobe ? 'Switch to 2D Flat view' : 'Switch to 3D Globe view';
      this._button.classList.toggle('active', isGlobe);
    }
  }
}

// ============================================================================
// MAP FUNCTIONALITY
// ============================================================================

/**
 * Gets coordinates for a country by name
 * @param {string} countryName - Name of the country
 * @returns {Array<number>} [longitude, latitude] coordinates
 */
const getCountryCoordinates = (countryName) => {
  const countryCoords = {
    'United States': [-95.7129, 37.0902],
    'Canada': [-106.3468, 56.1304],
    'United Kingdom': [-3.4360, 55.3781],
    'Germany': [10.4515, 51.1657],
    'France': [2.2137, 46.2276],
    'Italy': [12.5674, 41.8719],
    'Spain': [-3.7492, 40.4637],
    'Netherlands': [5.2913, 52.1326],
    'Sweden': [18.6435, 60.1282],
    'Norway': [8.4689, 60.4720],
    'Denmark': [9.5018, 56.2639],
    'Finland': [25.7482, 61.9241],
    'Australia': [133.7751, -25.2744],
    'Japan': [138.2529, 36.2048],
    'South Korea': [127.7669, 35.9078],
    'China': [104.1954, 35.8617],
    'India': [78.9629, 20.5937],
    'Brazil': [-51.9253, -14.2350],
    'Mexico': [-102.5528, 23.6345],
    'Argentina': [-63.6167, -38.4161],
    'South Africa': [22.9375, -30.5595],
    'Nigeria': [8.6753, 9.0820],
    'Kenya': [37.9062, -0.0236],
    'Egypt': [30.8025, 26.8206],
    'Turkey': [35.2433, 38.9637],
    'Russia': [105.3188, 61.5240],
    'Ukraine': [31.1656, 48.3794],
    'Poland': [19.1451, 51.9194],
    'Czech Republic': [15.4730, 49.8175],
    'Austria': [14.5501, 47.5162],
    'Switzerland': [8.2275, 46.8182],
    'Belgium': [4.4699, 50.5039],
    'Ireland': [-8.2439, 53.4129],
    'Portugal': [-8.2245, 39.3999],
    'Greece': [21.8243, 39.0742],
    'Israel': [34.8516, 31.0461],
    'United Arab Emirates': [53.8478, 23.4241],
    'Saudi Arabia': [45.0792, 23.8859],
    'Thailand': [100.9925, 15.8700],
    'Vietnam': [108.2772, 14.0583],
    'Philippines': [121.7740, 12.8797],
    'Indonesia': [113.9213, -0.7893],
    'Malaysia': [101.9758, 4.2105],
    'Singapore': [103.8198, 1.3521],
    'New Zealand': [174.8860, -40.9006],
    'Chile': [-71.5430, -35.6751],
    'Colombia': [-74.2973, 4.5709],
    'Peru': [-75.0152, -9.1900],
    'Venezuela': [-66.5897, 6.4238],
    'Ecuador': [-78.1834, -1.8312],
    'Uruguay': [-55.7658, -32.5228],
    'Paraguay': [-58.4438, -23.4425],
    'Bolivia': [-63.5887, -16.2902],
    'Guyana': [-58.9302, 4.8604],
    'Suriname': [-56.0278, 3.9193],
    'French Guiana': [-53.1258, 3.9339],
    'Algeria': [1.6596, 28.0339],
    'Libya': [17.2283, 26.3351],
    'Democratic Republic of the Congo': [21.7587, -4.0383],
    'Uganda': [32.2903, 1.3733],
    'Cameroon': [12.3547, 7.3697],
    'Senegal': [-14.4524, 14.4974],
    'Guinea': [-9.6966, 9.6412],
    'Mali': [-3.9962, 17.5707],
    'South Africa': [22.9375, -30.5595],
    'Zambia': [27.8493, -13.1339],
    'Ethiopia': [40.4897, 9.1450],
    'Togo': [0.8248, 8.6195],
    'Tunisia': [9.5375, 33.8869],
    'Ghana': [-1.0232, 7.9465],
    'Rwanda': [29.8739, -1.9403],
    'Tanzania': [34.8888, -6.3690],
    'Chad': [18.7322, 15.4542],
    'Niger': [8.0817, 16.0000],
    'Burkina Faso': [-2.1976, 12.2383],
    'Sierra Leone': [-11.7799, 8.4606],
    'Benin': [2.3158, 9.3077],
    'Côte d\'Ivoire': [-5.5471, 7.5400],
    'Bangladesh': [90.3563, 23.6850],
    'Afghanistan': [67.7099, 33.9391],
    'Armenia': [45.0382, 40.0691],
    'Bhutan': [90.4336, 27.5142],
    'Bosnia and Herzegovina': [17.6791, 43.9159],
    'Botswana': [22.3394, -22.3285],
    'Burundi': [29.8739, -3.3731],
    'Cabo Verde': [-24.0132, 16.5388],
    'Cambodia': [104.9910, 12.5657],
    'Cuba': [-77.7812, 21.5218],
    'Djibouti': [42.5903, 11.8251],
    'Dominican Republic': [-70.1627, 18.7357],
    'Gabon': [11.6094, -0.8037],
    'Hong Kong SAR, China': [114.1694, 22.3193],
    'Iran': [53.6880, 32.4279],
    'Iraq': [43.6793, 33.2232],
    'Jordan': [36.2384, 30.5852],
    'Kyrgyzstan': [74.7661, 41.2044],
    'Lebanon': [35.8623, 33.8547],
    'Liberia': [-9.4295, 6.4281],
    'Madagascar': [46.8691, -18.7669],
    'Malawi': [34.3015, -13.2543],
    'Mozambique': [35.5296, -18.6657],
    'Namibia': [18.4904, -22.9576],
    'Somalia': [46.1996, 5.1521],
    'South Sudan': [31.3070, 6.8770],
    'Uzbekistan': [64.5853, 41.3775],
    'Yemen': [48.5164, 15.5527],
    'Zimbabwe': [29.1549, -19.0154],
    'Pakistan': [69.3451, 30.3753],
    'Sri Lanka': [80.7718, 7.8731],
    'Mauritania': [-10.9408, 21.0079],
    'Moldova': [28.3699, 47.4116],
    'Mongolia': [103.8467, 46.8625],
    'Morocco': [-7.0926, 31.6295],
    'Oman': [55.9233, 21.4735],
    'Republic of Korea': [127.7669, 35.9078],
    'Republic of Palau': [134.5825, 7.5150],
    'Saint Kitts and Nevis': [-62.7829, 17.3578],
    'Slovenia': [14.9955, 46.1512]
  };
  return countryCoords[countryName] || [0, 0];
};

/**
 * Renders the interactive world map with submission data
 * @param {Array} data - Filtered data array
 */
function renderMap(data) {
  try {
    const hasToken = CONFIG.MAPBOX_TOKEN && !/example$/.test(CONFIG.MAPBOX_TOKEN);
    const mapEl = utils.el('map');
    const HINT_ID = 'map-hint';

    const showHint = (html) => {
      if (!mapEl) return;
      let hint = document.getElementById(HINT_ID);
      if (!hint) {
        hint = document.createElement('div');
        hint.id = HINT_ID;
        hint.style.cssText = `
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          color: var(--muted); pointer-events: none; z-index: 2; text-align: center; padding: 24px;
          background: none;
        `;
        mapEl.appendChild(hint);
      }
      hint.innerHTML = html;
    };
    
    const hideHint = () => {
      const hint = document.getElementById(HINT_ID);
      if (hint && hint.parentNode) {
        hint.parentNode.removeChild(hint);
      }
    };

    if (!hasToken) {
      if (!window.map || !window.map.getStyle) {
        mapEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">⚠️ Mapbox token missing. Update CONFIG.MAPBOX_TOKEN.</div>';
      }
      el('mapbox-note').style.display = 'block';
      return;
    }

    // Aggregate counts by ISO3
    const counts = {};
    for (const d of data) if (d._iso3) {
      counts[d._iso3] = (counts[d._iso3] || 0) + 1;
    }
    const maxCount = Math.max(0, ...Object.values(counts));

    // Build expressions
    const countExpr = ['match', ['get', 'iso_3166_1_alpha_3']];
    for (const [iso3, c] of Object.entries(counts)) countExpr.push(iso3, c);
    countExpr.push(0);

    const colorExpr = ['case',
      ['==', countExpr, 0], '#D0D0D0',
      ['interpolate', ['linear'], countExpr,
        1, '#E8F5E8',
        Math.max(1, maxCount * 0.20), '#B3E6B3',
        Math.max(1, maxCount * 0.40), '#7ED67E',
        Math.max(1, maxCount * 0.60), '#4AC64A',
        Math.max(1, maxCount * 0.80), '#16B616',
        Math.max(1, maxCount), '#0B7A0B',
      ]
    ];

    const ensureLayers = () => {
      if (!window.map.getSource('country-bounds')) {
        window.map.addSource('country-bounds', { type: 'vector', url: 'mapbox://mapbox.country-boundaries-v1' });
      }
      if (!window.map.getLayer('submissions-fill')) {
        window.map.addLayer({
          id: 'submissions-fill',
          type: 'fill',
          source: 'country-bounds',
          'source-layer': 'country_boundaries',
          paint: { 'fill-color': colorExpr, 'fill-opacity': 0.75 }
        });
      } else {
        window.map.setPaintProperty('submissions-fill', 'fill-color', colorExpr);
      }
      if (!window.map.getLayer('submissions-outline')) {
        window.map.addLayer({
          id: 'submissions-outline',
          type: 'line',
          source: 'country-bounds',
          'source-layer': 'country_boundaries',
          paint: { 'line-color': '#0E1A2F', 'line-width': 0.5 }
        });
      }

      // Add clustered markers
      if (!window.map.getSource('submissions')) {
        const geoJsonData = {
          type: 'FeatureCollection',
          features: data.map(d => {
            const coords = getCountryCoordinates(d._country);
            return {
              type: 'Feature',
              properties: {
                country: d._country,
                iso3: d._iso3,
                score: d._score,
                org: d._org,
                maturity: d._maturity,
                id: Math.random()
              },
              geometry: {
                type: 'Point',
                coordinates: coords
              }
            };
          }).filter(f => f.geometry.coordinates[0] !== 0 || f.geometry.coordinates[1] !== 0)
        };

        window.map.addSource('submissions', {
          type: 'geojson',
          data: geoJsonData,
          cluster: true,
          clusterMaxZoom: 4,
          clusterRadius: 20
        });

        // Add cluster circles
        window.map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'submissions',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#e3f2fd',
              10, '#81d4fa',
              20, '#29b6f6',
              30, '#0277bd'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15,
              10, 20,
              20, 30
            ]
          }
        });

        // Add cluster count labels
        window.map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'submissions',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        });

        // Add unclustered points
        window.map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'submissions',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': 8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        });

        // Add click handlers for country boundaries
        window.map.on('click', 'submissions-fill', (e) => {
          const features = window.map.queryRenderedFeatures(e.point, { layers: ['submissions-fill'] });
          if (features.length > 0) {
            const feature = features[0];
            const iso3 = feature.properties.iso_3166_1_alpha_3;
            
            // Find country name from ISO3 code
            const countryName = Object.keys(window.COUNTRY_TO_ISO3 || {}).find(
              country => window.COUNTRY_TO_ISO3[country] === iso3
            );
            
            if (countryName) {
              appState.selectCountry(countryName);
            }
          }
        });

        // Add click handlers for clusters
        window.map.on('click', 'clusters', (e) => {
          const features = window.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          const clusterId = features[0].properties.cluster_id;
          window.map.getSource('submissions').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            window.map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          });
        });

        // Add click handlers for individual submission points
        window.map.on('click', 'unclustered-point', (e) => {
          // Prevent all default behaviors
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Temporarily disable zoom to prevent unwanted zoom behavior
          window.map.scrollZoom.disable();
          window.map.doubleClickZoom.disable();
          
          const coordinates = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div style="font-weight:700">${props.country}</div>
              <div style="color:var(--muted)">Organization: ${props.org}</div>
              <div style="color:var(--muted)">Maturity: ${props.maturity}</div>
              <div style="color:var(--muted)">Score: ${props.score}</div>
              <div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">
                <button onclick="appState.selectCountry('${props.country}')" 
                        style="background:var(--brand); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">
                  View All Submissions
                </button>
              </div>
            `)
            .addTo(window.map);
          
          // Re-enable zoom after a short delay
          setTimeout(() => {
            window.map.scrollZoom.enable();
            window.map.doubleClickZoom.enable();
          }, 100);
        });

        // Change cursor on hover
        window.map.on('mouseenter', 'submissions-fill', () => {
          window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'submissions-fill', () => {
          window.map.getCanvas().style.cursor = '';
        });
        window.map.on('mouseenter', 'clusters', () => {
          window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'clusters', () => {
          window.map.getCanvas().style.cursor = '';
        });
        window.map.on('mouseenter', 'unclustered-point', () => {
          window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'unclustered-point', () => {
          window.map.getCanvas().style.cursor = '';
        });
      }
    };

    // Create or update map
    if (!window.map || !window.map.getStyle) {
      showHint('🌍 Initializing map…');

      mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
      const mapStyle = ThemeManager.currentTheme === 'light' 
        ? 'mapbox://styles/mapbox/outdoors-v12' 
        : 'mapbox://styles/mapbox/outdoors-v12';
      
      window.map = new mapboxgl.Map({
        container: 'map',
        style: mapStyle,
        center: [0, 20],
        zoom: 1,
        minZoom: 1,              // Minimum zoom level
        maxZoom: 4,              // Maximum zoom level
        projection: appState.mapProjection,
        doubleClickZoom: true,   // Enable double-click zoom
        scrollZoom: true,        // Enable scroll zoom
        boxZoom: false,          // Disable box zoom
        dragRotate: false,       // Disable drag rotate
        dragPan: true,           // Keep drag pan enabled
        keyboard: true,          // Enable keyboard zoom
        touchZoomRotate: true    // Enable touch zoom
      });
      
      // Add navigation control with zoom buttons
      window.map.addControl(new mapboxgl.NavigationControl({
        showZoom: true,     // Show zoom buttons
        showCompass: false  // Hide compass
      }), 'top-right');

      // Add custom fullscreen control
      window.map.addControl(new FullscreenControl(), 'top-right');

      // Add custom 2D/3D toggle control
      window.map.addControl(new MapProjectionControl(), 'top-right');

      window.map.on('error', (e) => {
        console.error('Mapbox error:', e);
        showHint('❌ Map error<br><small>Check token or style</small>');
      });

      window.map.on('load', () => {
        hideHint();
        ensureLayers();
      });
    } else {
      if (window.map.isStyleLoaded) {
        ensureLayers();
      } else {
        showHint('🌍 Updating map…');
        if (!window.__pending_style_load_handler) {
          window.__pending_style_load_handler = true;
          window.map.on('load', () => {
            ensureLayers();
            hideHint();
            window.__pending_style_load_handler = false;
          });
        }
      }
    }
  } catch (err) {
    console.error('Error rendering map:', err);
    const mapEl = el('map');
    if (mapEl) {
      let hint = document.getElementById('map-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'map-hint';
        hint.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);pointer-events:none;z-index:2;text-align:center;padding:24px;';
        mapEl.appendChild(hint);
      }
      hint.innerHTML = '❌ Map error<br><small>See console for details</small>';
    }
  }
}


// ============================================================================
// FILTER MANAGEMENT
// ============================================================================

/**
 * Fills a select element with options
 * @param {string} id - Element ID
 * @param {Array} values - Array of values to populate
 */
function fillSelect(id, values) { 
  const s = utils.el(id); 
  if (!s) return; 
  s.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join(''); 
}

/**
 * Clears all selected options in a select element
 * @param {string} id - Element ID
 */
function clearSelect(id) { 
  const s = utils.el(id); 
  if (!s) return; 
  [...s.options].forEach(o => o.selected = false); 
}

/**
 * Updates filter UI elements
 * @param {boolean} resetCountries - Whether to reset country/region options
 */
function updateFilterUI(resetCountries = true) {
  ['fRegion', 'fCountry', 'fOrg', 'fMaturity', 'fSDG'].forEach(id => clearSelect(id));
  if (resetCountries) {
    fillSelect('fRegion', utils.unique(appState.rawData.map(r => r._region)));
    fillSelect('fCountry', utils.unique(appState.rawData.map(r => r._country)));
  }
  updateFilterDisplay();
}

/**
 * Updates the visual display of filter selections
 * Shows count of selected items instead of "0 Items"
 */
function updateFilterDisplay() {
  const filterConfigs = [
    { id: 'fRegion', key: 'region', label: 'Region' },
    { id: 'fCountry', key: 'country', label: 'Country' },
    { id: 'fOrg', key: 'org', label: 'Organization' },
    { id: 'fMaturity', key: 'maturity', label: 'Maturity' },
    { id: 'fSDG', key: 'sdg', label: 'SDG' }
  ];

  filterConfigs.forEach(config => {
    const select = utils.el(config.id);
    if (!select) return;

    const selectedCount = appState.filters[config.key].size;
    
    // Add a custom attribute to track selection count on both select and label
    select.setAttribute('data-selected-count', selectedCount);
    
    // Also set the attribute on the parent label for the visual indicator
    const label = select.closest('label');
    if (label) {
      label.setAttribute('data-selected-count', selectedCount);
    }
    
    // Update the title attribute for better accessibility
    if (selectedCount === 0) {
      select.title = `Select ${config.label} to filter`;
    } else if (selectedCount === 1) {
      const selectedValue = Array.from(appState.filters[config.key])[0];
      select.title = `Selected: ${selectedValue}`;
    } else {
      select.title = `${selectedCount} ${config.label.toLowerCase()}s selected`;
    }
  });
}

/**
 * Sets filter values from select element
 * @param {string} id - Element ID of the select
 */
function setFilterFromSelect(id) {
  const s = utils.el(id); 
  const selected = new Set([...s.selectedOptions].map(o => o.value));
  const key = id.replace('f', '').toLowerCase();
  
  if (key === 'region') { 
    appState.filters.region = selected; 
    updateCountryFilter(selected); 
  }
  if (key === 'country') { 
    appState.filters.country = selected; 
    updateRegionFilter(selected); 
  }
  if (key === 'org') appState.filters.org = selected;
  if (key === 'maturity') appState.filters.maturity = selected;
  if (key === 'sdg') appState.filters.sdg = selected;
  
  // Update the visual display
  updateFilterDisplay();
}

/**
 * Updates country filter options based on selected regions
 * @param {Set} selectedRegions - Set of selected region names
 */
function updateCountryFilter(selectedRegions) {
  if (!appState.countryRegionMapping) return;
  if (selectedRegions.size === 0) { 
    fillSelect('fCountry', utils.unique(appState.rawData.map(r => r._country))); 
    return; 
  }
  const valid = new Set();
  selectedRegions.forEach(region => {
    (appState.countryRegionMapping.region_to_countries[region] || []).forEach(c => { 
      if (appState.rawData.some(r => r._country === c)) valid.add(c); 
    });
  });
  fillSelect('fCountry', Array.from(valid).sort()); 
  appState.filters.country.clear(); 
  clearSelect('fCountry');
}

/**
 * Updates region filter options based on selected countries
 * @param {Set} selectedCountries - Set of selected country names
 */
function updateRegionFilter(selectedCountries) {
  if (!appState.countryRegionMapping) return;
  if (selectedCountries.size === 0) { 
    fillSelect('fRegion', utils.unique(appState.rawData.map(r => r._region))); 
    return; 
  }
  const valid = new Set();
  selectedCountries.forEach(country => { 
    const region = appState.countryRegionMapping.country_to_region[country]; 
    if (region) valid.add(region); 
  });
  fillSelect('fRegion', Array.from(valid).sort()); 
  appState.filters.region.clear(); 
  clearSelect('fRegion');
}

// ============================================================================
// UI CONTROLS
// ============================================================================

/**
 * Toggles kiosk mode (shows/hides filter controls)
 */
function toggleKioskMode() {
  appState.kiosk = !appState.kiosk;
  const controls = utils.el('controls');
  
  if (appState.kiosk) {
    controls.classList.remove('show');
    utils.el('toggleKiosk').textContent = 'Show Controls';
    utils.el('toggleKiosk').title = 'Show filter controls';
  } else {
    controls.classList.add('show');
    utils.el('toggleKiosk').textContent = 'Hide Controls';
    utils.el('toggleKiosk').title = 'Hide filter controls';
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the application
 * Sets up event listeners, loads data, and renders initial state
 */
async function init() {
  // Initialize theme manager
  ThemeManager.init();
  
  // Set up event listeners with debounced updates
  ['fRegion', 'fCountry', 'fOrg', 'fMaturity', 'fSDG'].forEach(id => {
    utils.el(id)?.addEventListener('change', utils.debounce(() => { 
      setFilterFromSelect(id); 
      renderAll(); 
    }, CONFIG.RENDER_DEBOUNCE_DELAY));
  });
  
  // Set up control button event listeners
  utils.el('clear')?.addEventListener('click', () => { 
    appState.clearFilters(); 
    renderAll(); 
  });
  utils.el('toggleKiosk')?.addEventListener('click', toggleKioskMode);
  utils.el('toggleTheme')?.addEventListener('click', () => { ThemeManager.toggle(); });

  // Load mapping data (optional)
  try { 
    appState.countryRegionMapping = await utils.loadDataWithRetry(CONFIG.DATA_SOURCES.COUNTRY_MAPPING);
    console.log('✅ Country region mapping loaded successfully');
  } catch (error) { 
    console.warn(`⚠️ Could not load country region mapping from ${CONFIG.DATA_SOURCES.COUNTRY_MAPPING}:`, error.message);
    console.log('ℹ️ Dashboard will work without country-region filter interdependencies');
  }

  // Load main data
  console.log(`🔄 Loading main data from ${CONFIG.DATA_SOURCES.MAIN_DATA}...`);
  const raw = await utils.loadDataWithRetry(CONFIG.DATA_SOURCES.MAIN_DATA);
  if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty or invalid data');
  console.log(`✅ Loaded ${raw.length} submissions from ${CONFIG.DATA_SOURCES.MAIN_DATA}`);

  appState.rawData = raw.map(DataProcessor.normalizeRow);
  
  // Populate filter selects
  fillSelect('fRegion', utils.unique(appState.rawData.map(r => r._region)));
  fillSelect('fCountry', utils.unique(appState.rawData.map(r => r._country)));
  fillSelect('fOrg', utils.unique(appState.rawData.map(r => r._org)));
  
  // Sort maturity values according to CONFIG order
  const maturityValues = utils.unique(appState.rawData.map(r => r._maturity)).sort((a, b) => {
    const ai = CONFIG.MATURITY_ORDER.indexOf(a);
    const bi = CONFIG.MATURITY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  fillSelect('fMaturity', maturityValues);
  
  // Sort SDGs numerically (SDG 1, SDG 2, ..., SDG 17)
  const sdgValues = utils.unique(appState.rawData.flatMap(r => r._sdgs)).sort((a, b) => {
    const aNum = parseInt(a.replace(/SDG\s*(\d+)/i, '$1'));
    const bNum = parseInt(b.replace(/SDG\s*(\d+)/i, '$1'));
    return aNum - bNum;
  });
  fillSelect('fSDG', sdgValues);

  // Initial render
  renderAll();
  
  // Update filter display
  updateFilterDisplay();
  
  // Update map projection button text
  appState.updateMapProjectionButton();
  
  // Apply initial kiosk state (hide controls by default)
  // Don't call toggleKioskMode() as it would flip the default state
  // Instead, directly apply the kiosk state
  const controls = utils.el('controls');
  if (appState.kiosk) {
    controls.classList.remove('show');
    utils.el('toggleKiosk').textContent = 'Show Controls';
    utils.el('toggleKiosk').title = 'Show filter controls';
  } else {
    controls.classList.add('show');
    utils.el('toggleKiosk').textContent = 'Hide Controls';
    utils.el('toggleKiosk').title = 'Hide filter controls';
  }
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================

/**
 * Initializes modal functionality for explanation dialog
 * Sets up event listeners for show/hide/close actions
 */
function initializeModal() {
  const modal = utils.el('explanationModal');
  const showBtn = utils.el('showExplanation');
  const closeBtn = utils.el('closeExplanation');

  if (!modal || !showBtn || !closeBtn) {
    console.warn('Modal elements not found');
    return;
  }

  // Show modal
  showBtn.addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });

  // Close modal
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

/**
 * Initializes QR code modal functionality
 * Sets up event listeners for show/hide/close actions
 */
function initializeQRCodeModal() {
  const modal = utils.el('qrCodeModal');
  const showBtn = utils.el('showQRCode');
  const closeBtn = utils.el('closeQRCode');

  if (!modal || !showBtn || !closeBtn) {
    console.warn('QR Code modal elements not found');
    return;
  }

  // Show modal
  showBtn.addEventListener('click', function() {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });

  // Close modal
  closeBtn.addEventListener('click', function() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restore scrolling
  });

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && modal.style.display === 'block') {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });
}

// ============================================================================
// APPLICATION STARTUP
// ============================================================================

/**
 * Application entry point
 * Initializes the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
  try {
    init();
    initializeModal();
    initializeQRCodeModal();
    console.log('✅ UNGA Analytics Dashboard initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    // Show user-friendly error message
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      background: #ff4444; color: white; padding: 20px; border-radius: 8px;
      z-index: 10000; text-align: center; max-width: 400px;
    `;
    errorDiv.innerHTML = `
      <h3>⚠️ Application Error</h3>
      <p>Failed to load the dashboard. Please check the console for details.</p>
      <p><small>Error: ${error.message}</small></p>
    `;
    document.body.appendChild(errorDiv);
  }
});

// ===================== LANDSCAPE MODE SUGGESTION =====================

// Landscape mode suggestion functionality
function showLandscapeSuggestion() {
  const banner = document.getElementById('landscapeSuggestion');
  if (banner && !localStorage.getItem('landscapeSuggestionDismissed')) {
    banner.classList.add('show');
    document.body.classList.add('landscape-banner-shown');
  }
}

function hideLandscapeSuggestion() {
  const banner = document.getElementById('landscapeSuggestion');
  if (banner) {
    banner.classList.remove('show');
    document.body.classList.remove('landscape-banner-shown');
    localStorage.setItem('landscapeSuggestionDismissed', 'true');
  }
}

// Check if device is in portrait mode on mobile
function checkOrientation() {
  const isMobile = window.innerWidth <= 768;
  const isPortrait = window.innerHeight > window.innerWidth;
  
  if (isMobile && isPortrait) {
    // Show suggestion after a short delay to avoid being too aggressive
    setTimeout(showLandscapeSuggestion, 2000);
  } else {
    // Hide suggestion if in landscape
    const banner = document.getElementById('landscapeSuggestion');
    if (banner) {
      banner.classList.remove('show');
      document.body.classList.remove('landscape-banner-shown');
    }
  }
}

// Listen for orientation changes
window.addEventListener('orientationchange', () => {
  // Small delay to allow orientation change to complete
  setTimeout(checkOrientation, 100);
});

// Listen for window resize (handles both orientation and window resize)
window.addEventListener('resize', checkOrientation);

// Check orientation on page load
document.addEventListener('DOMContentLoaded', checkOrientation);