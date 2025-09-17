/**
 * Theme management for dark/light mode switching
 */

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
    this._updateAILogo();
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
  },
  
  /**
   * Update AI logo based on current theme
   */
  _updateAILogo() {
    const aiLogo = document.querySelector('.ai-logo');
    if (aiLogo) {
      const logoPath = this.currentTheme === 'dark' 
        ? 'assets/Claude_AI_logo_dark.png' 
        : 'assets/Claude_AI_logo.png';
      aiLogo.src = logoPath;
    }
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ThemeManager, PlotTheme, commonLayout };
}
