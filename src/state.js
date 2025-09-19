/**
 * Application state management
 */

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
   * Selects a country and shows its solutions
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
   * Gets all solutions for a specific country
   * @param {string} countryName - Name of the country
   * @returns {Array} Array of solutions for the country
   */
  getCountrySubmissions(countryName) {
    return this.rawData.filter(r => r._country === countryName);
  }
  
  /**
   * Shows solutions modal for a specific country
   * @param {string} countryName - Name of the country
   */
  showCountrySubmissions(countryName) {
    const submissions = this.getCountrySubmissions(countryName);
    if (submissions.length === 0) return;
    
    this.createSubmissionsModal(countryName, submissions);
  }
  
  /**
   * Creates and displays solutions modal for a country
   * @param {string} countryName - Name of the country
   * @param {Array} submissions - Array of solutions to display
   */
  createSubmissionsModal(countryName, submissions) {
    // Remove existing modal if any
    this.hideSubmissionsModal();
    
    const modal = document.createElement('div');
    modal.id = 'submissions-modal';
    modal.className = 'solutions-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${utils.getCountryFlag(countryName)}${countryName}: ${submissions.length} solution${submissions.length !== 1 ? 's' : ''}</h3>
          <!-- Hidden feature: Modal stats (preserved for future use) -->
          <!-- <div class="modal-stats">
            <span class="stat">${submissions.length} solution${submissions.length !== 1 ? 's' : ''}</span>
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
          <div class="solutions-list">
            ${submissions.map((submission, index) => `
              <div class="solution-card">
                <div class="solution-header">
                  <div class="solution-title">
                    ${submission['Title'] || 'Untitled Solution'}
                  </div>
                  <div class="solution-score" title="Solution Score: ${utils.formatNumber(submission._score)}">
                    ${getScoreDisplay(submission._score)}
                  </div>
                </div>
                <div class="solution-details">
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
                    <span class="value">${submission._sdgs.map(sdg => utils.formatSdgWithIcon(sdg)).join(', ')}</span>
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
   * Hides the solutions modal
   */
  hideSubmissionsModal() {
    if (this.submissionsModal) {
      // Remove event listeners to prevent memory leaks
      this.submissionsModal.removeEventListener('click', this.modalClickHandler);
      this.submissionsModal.remove();
      this.submissionsModal = null;
    }
  }
  
  /**
   * Filters data to show only solutions from a specific country
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
    this.showNotification(`Filtered to show solutions from ${countryName}`);
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

// Create global instance
const appState = new AppState();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AppState, appState };
}
