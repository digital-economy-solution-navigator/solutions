/**
 * Global Call for Solutions Analytics Dashboard
 * Main application coordination file
 * 
 * This file coordinates all the modular components:
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
 * 1. Update MAIN_DATA path to point to your new solutions data file
 * 2. Update COUNTRY_MAPPING path if you have new country-region mappings
 * 3. Ensure your data follows the same JSON structure as the original files
 * 4. The dashboard will automatically retry loading and provide helpful error messages
 */

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
  console.log(`✅ Loaded ${raw.length} solutions from ${CONFIG.DATA_SOURCES.MAIN_DATA}`);

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
    initializeDisclaimer();
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
