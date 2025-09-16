/**
 * Data processing and normalization functions
 */

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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataProcessor, sdgNormalize };
}
