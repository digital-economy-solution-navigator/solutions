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
  
  // Official UN SDG Colors - 17 Sustainable Development Goals
  SDG_COLORS: {
    'SDG 1': '#E5243B',  // No Poverty - Intense Red
    'SDG 2': '#DDA63A',  // Zero Hunger - Mustard Yellow
    'SDG 3': '#4C9F38',  // Good Health and Well-being - Bright Green
    'SDG 4': '#C5192D',  // Quality Education - Burgundy Red
    'SDG 5': '#FF3A21',  // Gender Equality - Strong Orange
    'SDG 6': '#26BDE2',  // Clean Water and Sanitation - Light Blue
    'SDG 7': '#FCC30B',  // Affordable and Clean Energy - Bright Yellow
    'SDG 8': '#A21942',  // Decent Work and Economic Growth - Dark Red
    'SDG 9': '#FD6925',  // Industry, Innovation, and Infrastructure - Intense Orange
    'SDG 10': '#DD1367', // Reduced Inequalities - Fuchsia Pink
    'SDG 11': '#FD9D24', // Sustainable Cities and Communities - Ochre Yellow
    'SDG 12': '#BF8B2E', // Responsible Consumption and Production - Sandy Gold
    'SDG 13': '#3F7E44', // Climate Action - Dark Green
    'SDG 14': '#0A97D9', // Life Below Water - Navy Blue
    'SDG 15': '#56C02B', // Life on Land - Light Green
    'SDG 16': '#00689D', // Peace, Justice, and Strong Institutions - Cobalt Blue
    'SDG 17': '#19486A'  // Partnerships for the Goals - Sky Blue
  },
  
  // SDG Emoji Icons and Labels
  SDG_INFO: {
    'SDG 1': { emoji: '🌍', label: 'No Poverty', color: '#E5243B' },
    'SDG 2': { emoji: '🍽️', label: 'Zero Hunger', color: '#DDA63A' },
    'SDG 3': { emoji: '🏥', label: 'Good Health and Well-being', color: '#4C9F38' },
    'SDG 4': { emoji: '📚', label: 'Quality Education', color: '#C5192D' },
    'SDG 5': { emoji: '👥', label: 'Gender Equality', color: '#FF3A21' },
    'SDG 6': { emoji: '💧', label: 'Clean Water and Sanitation', color: '#26BDE2' },
    'SDG 7': { emoji: '⚡', label: 'Affordable and Clean Energy', color: '#FCC30B' },
    'SDG 8': { emoji: '💼', label: 'Decent Work and Economic Growth', color: '#A21942' },
    'SDG 9': { emoji: '🏭', label: 'Industry, Innovation, and Infrastructure', color: '#FD6925' },
    'SDG 10': { emoji: '⚖️', label: 'Reduced Inequalities', color: '#DD1367' },
    'SDG 11': { emoji: '🏙️', label: 'Sustainable Cities and Communities', color: '#FD9D24' },
    'SDG 12': { emoji: '♻️', label: 'Responsible Consumption and Production', color: '#BF8B2E' },
    'SDG 13': { emoji: '🌱', label: 'Climate Action', color: '#3F7E44' },
    'SDG 14': { emoji: '🐠', label: 'Life Below Water', color: '#0A97D9' },
    'SDG 15': { emoji: '🌳', label: 'Life on Land', color: '#56C02B' },
    'SDG 16': { emoji: '⚖️', label: 'Peace, Justice, and Strong Institutions', color: '#00689D' },
    'SDG 17': { emoji: '🤝', label: 'Partnerships for the Goals', color: '#19486A' }
  },
  
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
