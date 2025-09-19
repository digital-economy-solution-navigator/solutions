/**
 * Filter management functionality
 */

/**
 * Fills a select element with options
 * @param {string} id - Element ID
 * @param {Array} values - Array of values to populate
 */
function fillSelect(id, values) { 
  const s = utils.el(id); 
  if (!s) return; 
  
  // Special handling for country filter with flags
  if (id === 'fCountry') {
    s.innerHTML = values.map(v => {
      // Extract clean country name by removing HTML flag code
      const cleanCountry = v.replace(/<[^>]*>/g, '').trim();
      return `<option value="${cleanCountry}">${v}</option>`;
    }).join('');
  } else {
    s.innerHTML = values.map(v => `<option value="${v}">${v}</option>`).join('');
  }
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
    // Create country options with flags for the filter dropdown
    const countryValues = utils.unique(appState.rawData.map(r => r._country));
    const countryOptions = countryValues.map(country => `${utils.getCountryFlag(country)}${country}`);
    fillSelect('fCountry', countryOptions);
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
  const selectedValues = [...s.selectedOptions].map(o => o.value);
  const selected = new Set(selectedValues);
  const key = id.replace('f', '').toLowerCase();
  
  if (key === 'region') { 
    appState.filters.region = selected; 
    updateCountryFilter(selected); 
  }
  if (key === 'country') {
    // Strip flag icons from country filter values for processing
    const cleanSelected = new Set(selectedValues.map(country => {
      // Remove flag HTML and extra spaces, keep only country name
      return country.replace(/<[^>]*>/g, '').trim();
    }));
    appState.filters.country = cleanSelected; 
    updateRegionFilter(cleanSelected); 
  }
  if (key === 'org') appState.filters.org = selected;
  if (key === 'maturity') appState.filters.maturity = selected;
  if (key === 'sdg') {
    // Strip emoji icons from SDG filter values for processing
    const cleanSelected = new Set(selectedValues.map(sdg => {
      // Remove emoji and extra spaces, keep only "SDG X" format
      return sdg.replace(/^[^\w\s]*\s*/, '').trim();
    }));
    appState.filters.sdg = cleanSelected;
  }
  
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
    // Create country options with flags for the filter dropdown
    const countryValues = utils.unique(appState.rawData.map(r => r._country));
    const countryOptions = countryValues.map(country => `${utils.getCountryFlag(country)}${country}`);
    fillSelect('fCountry', countryOptions); 
    return; 
  }
  const valid = new Set();
  selectedRegions.forEach(region => {
    (appState.countryRegionMapping.region_to_countries[region] || []).forEach(c => { 
      if (appState.rawData.some(r => r._country === c)) valid.add(c); 
    });
  });
  // Create country options with flags for the filter dropdown
  const countryOptions = Array.from(valid).sort().map(country => `${utils.getCountryFlag(country)}${country}`);
  fillSelect('fCountry', countryOptions); 
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    fillSelect, 
    clearSelect, 
    updateFilterUI, 
    updateFilterDisplay, 
    setFilterFromSelect, 
    updateCountryFilter, 
    updateRegionFilter, 
    toggleKioskMode 
  };
}
