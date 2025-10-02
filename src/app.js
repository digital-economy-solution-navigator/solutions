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
  
  // Ensure AI logo is updated after DOM is ready
  setTimeout(() => {
    ThemeManager._updateAILogo();
  }, 100);
  
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
  
  // Add window resize listener to re-render charts for responsive behavior
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderAll(); // Re-render all charts to adapt to new screen size
    }, 250); // Debounce resize events
  });

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
  
  // Create country options with flags for the filter dropdown
  const countryValues = utils.unique(appState.rawData.map(r => r._country));
  const countryOptions = countryValues.map(country => `${utils.getCountryFlag(country)}${country}`);
  fillSelect('fCountry', countryOptions);
  
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
  
  // Sort SDGs numerically (SDG 1, SDG 2, ..., SDG 17) with emoji icons
  const sdgValues = utils.unique(appState.rawData.flatMap(r => r._sdgs)).sort((a, b) => {
    const aNum = parseInt(a.replace(/SDG\s*(\d+)/i, '$1'));
    const bNum = parseInt(b.replace(/SDG\s*(\d+)/i, '$1'));
    return aNum - bNum;
  });
  
  // Create SDG options with emoji icons for the filter dropdown
  const sdgOptions = sdgValues.map(sdg => utils.formatSdgWithIcon(sdg));
  
  fillSelect('fSDG', sdgOptions);

  // Initial render
  renderAll();
  
  // Update filter display
  updateFilterDisplay();
  
  // Sync mobile filters after desktop filters are populated
  if (typeof syncMobileFilters === 'function') {
    syncMobileFilters();
  }
  
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
// Hamburger Menu Functionality
function initHamburgerMenu() {
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const mobileMenu = document.getElementById('mobileMenu');
  
  if (!hamburgerMenu || !mobileMenu) return;
  
  // Toggle menu visibility
  function toggleMenu() {
    const isActive = hamburgerMenu.classList.contains('active');
    
    if (isActive) {
      closeMenu();
    } else {
      openMenu();
    }
  }
  
  function openMenu() {
    hamburgerMenu.classList.add('active');
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
  
  function closeMenu() {
    hamburgerMenu.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
  
  // Event listeners
  hamburgerMenu.addEventListener('click', toggleMenu);
  
  // Close menu when clicking outside
  mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
      closeMenu();
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
      closeMenu();
    }
  });
  
  // Connect mobile buttons to desktop functionality
  const mobileButtons = {
    'mobileToggleTheme': 'toggleTheme',
    'mobileShowExplanation': 'showExplanation', 
    'mobileShowQRCode': 'showQRCode',
    'mobileToggleKiosk': 'toggleKiosk'
  };
  
  Object.entries(mobileButtons).forEach(([mobileId, desktopId]) => {
    const mobileBtn = document.getElementById(mobileId);
    const desktopBtn = document.getElementById(desktopId);
    
    if (mobileBtn && desktopBtn) {
      mobileBtn.addEventListener('click', () => {
        desktopBtn.click(); // Trigger the desktop button's functionality
        closeMenu(); // Close the mobile menu
      });
    }
  });
  
  // Handle mobile close controls button separately
  const mobileCloseBtn = document.getElementById('mobileCloseControls');
  if (mobileCloseBtn) {
    console.log('Mobile close button found and event listener attached');
    mobileCloseBtn.addEventListener('click', () => {
      console.log('Mobile close button clicked');
      // Call toggleKioskMode directly since it should be in global scope
      if (typeof toggleKioskMode === 'function') {
        toggleKioskMode(); // Hide the controls
      } else {
        console.error('toggleKioskMode function not found');
        // Fallback: manually toggle the controls
        const controls = document.getElementById('controls');
        if (controls) {
          controls.classList.toggle('show');
        }
      }
      closeMenu(); // Close the mobile menu if open
    });
  } else {
    console.warn('Mobile close button not found');
  }
  
  // Initialize mobile collapsible filters
  initMobileFilters();
  
  // Update mobile theme button icon when theme changes
  const updateMobileThemeButton = () => {
    const mobileThemeBtn = document.getElementById('mobileToggleTheme');
    if (mobileThemeBtn) {
      const icon = mobileThemeBtn.querySelector('.btn-icon');
      if (icon) {
        icon.textContent = ThemeManager.currentTheme === 'light' ? '🌙' : '☀️';
      }
    }
  };
  
  // Listen for theme changes
  document.addEventListener('themeChanged', updateMobileThemeButton);
  
  // Initial theme button update
  updateMobileThemeButton();
}

// Footer Links Toggle Functionality
function initFooterLinksToggle() {
  const toggleBtn = document.getElementById('toggleFooterLinks');
  const linksContent = document.querySelector('.footer-links-content');
  
  if (!toggleBtn || !linksContent) return;
  
  let isExpanded = false;
  
  function toggleLinks() {
    isExpanded = !isExpanded;
    
    if (isExpanded) {
      linksContent.classList.add('expanded');
      toggleBtn.classList.remove('collapsed');
      toggleBtn.title = 'Hide Reports & Insights';
    } else {
      linksContent.classList.remove('expanded');
      toggleBtn.classList.add('collapsed');
      toggleBtn.title = 'Show Reports & Insights';
    }
  }
  
  // Set initial state (collapsed on mobile)
  if (window.innerWidth <= 768) {
    toggleBtn.classList.add('collapsed');
    toggleBtn.title = 'Show Reports & Insights';
  }
  
  toggleBtn.addEventListener('click', toggleLinks);
  
  // Handle window resize
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // Desktop: always show links, hide toggle button
      linksContent.classList.remove('expanded');
      toggleBtn.classList.remove('collapsed');
      isExpanded = false;
    } else {
      // Mobile: reset to collapsed state
      if (!isExpanded) {
        linksContent.classList.remove('expanded');
        toggleBtn.classList.add('collapsed');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    init();
    initializeAboutToggle();
    initializeModal();
    initializeQRCodeModal();
    initializeDisclaimer();
    console.log('✅ UNGA Analytics Dashboard initialized successfully');
  // Initialize hamburger menu functionality
  initHamburgerMenu();
  
  // Initialize footer links toggle functionality
  initFooterLinksToggle();
  
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


/**
 * Initialize mobile collapsible filters
 */
function initMobileFilters() {
  // Set up toggle buttons for collapsible sections
  const toggleButtons = document.querySelectorAll('.filter-toggle');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const content = document.getElementById(targetId);
      
      if (content) {
        // Toggle the active state
        button.classList.toggle('active');
        content.classList.toggle('active');
      }
    });
  });
  
  // Sync mobile filters with desktop filters
  syncMobileFilters();
}

/**
 * Sync mobile filter values with desktop filters
 */
function syncMobileFilters() {
  const filterMappings = {
    'fRegion': 'fRegionMobile',
    'fCountry': 'fCountryMobile', 
    'fOrg': 'fOrgMobile',
    'fMaturity': 'fMaturityMobile',
    'fSDG': 'fSDGMobile'
  };
  
  // Copy values from desktop to mobile filters
  Object.entries(filterMappings).forEach(([desktopId, mobileId]) => {
    const desktopSelect = document.getElementById(desktopId);
    const mobileSelect = document.getElementById(mobileId);
    
    if (desktopSelect && mobileSelect) {
      // Copy options
      mobileSelect.innerHTML = desktopSelect.innerHTML;
      
      // Copy selected values
      const selectedValues = Array.from(desktopSelect.selectedOptions).map(opt => opt.value);
      Array.from(mobileSelect.options).forEach(option => {
        option.selected = selectedValues.includes(option.value);
      });
      
      // Add change listener to sync back to desktop
      mobileSelect.addEventListener('change', () => {
        const selectedValues = Array.from(mobileSelect.selectedOptions).map(opt => opt.value);
        Array.from(desktopSelect.options).forEach(option => {
          option.selected = selectedValues.includes(option.value);
        });
        
        // Trigger change event on desktop select
        desktopSelect.dispatchEvent(new Event('change'));
      });
    }
  });
  
  // Update filter counts
  updateMobileFilterCounts();
}

/**
 * Update mobile filter counts display
 */
function updateMobileFilterCounts() {
  const countMappings = {
    'region': 'region-count',
    'country': 'country-count',
    'org': 'org-count', 
    'maturity': 'maturity-count',
    'sdg': 'sdg-count'
  };
  
  Object.entries(countMappings).forEach(([filterKey, countId]) => {
    const countElement = document.getElementById(countId);
    if (countElement && appState.filters[filterKey]) {
      countElement.textContent = appState.filters[filterKey].size;
    }
  });
}
