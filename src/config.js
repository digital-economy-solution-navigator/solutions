/**
 * Global Call for Solutions Analytics Dashboard
 * Configuration and constants
 */

const CONFIG = {
  // ============================================================================
  // DATA SOURCE CONFIGURATION
  // ============================================================================
  // To update with new datasets, simply change the file paths below:
  // - MAIN_DATA: Path to your primary solutions data (JSON format)
  // - COUNTRY_MAPPING: Path to country-region mapping file (optional)
  // 
  // Example: To use new data files, update like this:
  // MAIN_DATA: 'new_solutions_2025.json',
  // COUNTRY_MAPPING: 'updated_country_mapping.json'
  // ============================================================================
  
  MATURITY_ORDER: ["Idea/Concept", "Proof of Concept", "MVP", "Pilot Stage", "Implemented at scale"],
  CHART_COLORS: ['#00A3E0', '#45FFD3', '#F6C453', '#118E9C', '#1BC7BE'],
  MAX_TOP_SOLUTIONS: 10,
  CSV_FILENAME: 'global_solutions_export.csv',
  MAPBOX_TOKEN: 'pk.eyJ1Ijoiemlsb25nLXRlY2giLCJhIjoiY21mMmhvZWp0MXZtdjJpcXlzOWswZGM1ZiJ9.tk_JMGIpKj5KS4bSBEukqw',
  
  // Data source configuration - UPDATE THESE PATHS FOR NEW DATASETS
  DATA_SOURCES: {
    MAIN_DATA: 'data/data.json',                    // Primary solutions data
    COUNTRY_MAPPING: 'data/country_region_mapping.json'  // Optional country-region mappings
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
  RENDER_DEBOUNCE_DELAY: 500, // Increased for better performance
  MODAL_VIRTUALIZATION_THRESHOLD: 50, // Use virtualization for >50 items
  
  // UI settings
  DEFAULT_KIOSK_MODE: true,
  DEFAULT_THEME: 'light',
  DEFAULT_MAP_PROJECTION: 'globe'
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
