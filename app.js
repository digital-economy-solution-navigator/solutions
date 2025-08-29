/**
 * Global Call for Solutions Analytics Dashboard
 * Main application logic for data visualization and filtering
 */

// --- Constants & Configuration ---
const CONFIG = {
  MATURITY_ORDER: [
    "Idea/Concept",
    "Proof of Concept", 
    "MVP",
    "Pilot Stage",
    "Implemented at scale"
  ],
  CHART_COLORS: ['#2563eb', '#7c3aed', '#dc2626', '#059669', '#d97706', '#0891b2', '#be185d', '#65a30d'],
  MAX_TOP_SOLUTIONS: 10,
  CSV_FILENAME: 'global_solutions_export.csv'
};

// --- Utility Functions ---
const utils = {
  toArray: v => Array.isArray(v) ? v : (v ? [v] : []),
  unique: arr => [...new Set(arr)].filter(Boolean).sort(),
  safeNumber: v => {
    const num = Number(v);
    return isFinite(num) ? num : 0;
  },
  formatNumber: (num, decimals = 1) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toFixed(decimals);
  },
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// --- SDG Normalization ---
const sdgNormalize = (s) => {
  if (!s) return [];
  return s
    .split(";")
    .map(x => x.trim())
    .filter(Boolean)
    // Map Russian SDG entries to English equivalents
    .map(x => {
      // Map specific Russian SDG entries
      if (x.includes('ЦУР 10') || x.includes('сокращение неравенства')) return 'SDG 10';
      if (x.includes('ЦУР 12') || x.includes('Ответственное потребление и производство')) return 'SDG 12';
      if (x.includes('ЦУР 8') || x.includes('Достойный труд и экономический рост')) return 'SDG 8';
      
      // Handle standard SDG format
      return x.replace(/^SDG\s*/i, "SDG ").replace(/\s+/g, " ");
    })
    .map(x => x.replace(/^(SDG)?\s*(\d{1,2}).*$/i, (_, __, n) => `SDG ${n}`));
};

// --- DOM Utilities ---
const el = id => document.getElementById(id);
const createElement = (tag, className, textContent) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (textContent) element.textContent = textContent;
  return element;
};

// --- Application State ---
class AppState {
  constructor() {
    this.rawData = [];
    this.filteredData = [];
    this.filters = {
      region: new Set(),
      country: new Set(),
      org: new Set(),
      maturity: new Set(),
      sdg: new Set()
    };
    this.isLoading = false;
    this.error = null;
    this.countryRegionMapping = null; // Store the mapping data
  }

  setLoading(loading) {
    this.isLoading = loading;
    this.updateUI();
  }

  setError(error) {
    this.error = error;
    this.updateUI();
  }

  updateUI() {
    const loadingEl = el('kpis');
    if (this.isLoading) {
      loadingEl.innerHTML = '<div class="loading">🔄 Loading analytics...</div>';
    } else if (this.error) {
      loadingEl.innerHTML = `<div class="error">❌ Error: ${this.error}</div>`;
    }
  }

  clearFilters() {
    this.filters = {
      region: new Set(),
      country: new Set(),
      org: new Set(),
      maturity: new Set(),
      sdg: new Set()
    };
    this.updateFilterUI();
    
    // Reset region and country filters to show all options
    if (this.countryRegionMapping) {
      const allRegions = utils.unique(this.rawData.map(r => r._region));
      const allCountries = utils.unique(this.rawData.map(r => r._country));
      FilterManager.fillSelect("fRegion", allRegions);
      FilterManager.fillSelect("fCountry", allCountries);
    }
  }

  updateFilterUI() {
    Object.keys(this.filters).forEach(key => {
      const selectId = `f${key.charAt(0).toUpperCase() + key.slice(1)}`;
      const select = el(selectId);
      if (select) {
        [...select.options].forEach(option => option.selected = false);
      }
    });
  }

  getFilteredData() {
    return this.rawData.filter(row =>
      (this.filters.region.size === 0 || this.filters.region.has(row._region)) &&
      (this.filters.country.size === 0 || this.filters.country.has(row._country)) &&
      (this.filters.org.size === 0 || this.filters.org.has(row._org)) &&
      (this.filters.maturity.size === 0 || this.filters.maturity.has(row._maturity)) &&
      (this.filters.sdg.size === 0 || row._sdgs.some(s => this.filters.sdg.has(s)))
    );
  }
}

// --- Global State ---
const appState = new AppState();

// --- Data Processing ---
class DataProcessor {
  static normalizeRow(row) {
    const country = (row["Country"] || "").trim();
    const iso3 = window.COUNTRY_TO_ISO3[country] || null;
    const sdgs = sdgNormalize(row["SDGs addressed"]);
    
         // Normalize maturity stage with Russian mapping and consolidation
     let maturity = (row["Maturity stage"] || "").trim();
     if (maturity === "Пилотный этап (мелкая реализация)") {
       maturity = "Pilot stage (small-scale implementation)";
     }
     
     // Consolidate maturity stages
     if (maturity.includes("Proof-of-Concept") || maturity.includes("Prototype")) {
       maturity = "Proof of Concept";
     } else if (maturity.includes("Minimum Viable Product") || maturity.includes("MVP") || maturity.includes("Pilot-ready")) {
       maturity = "MVP";
     } else if (maturity.includes("Pilot stage") || maturity.includes("small-scale implementation")) {
       maturity = "Pilot Stage";
     }
    
         // Normalize organization type with Russian mapping and consolidation
     let org = (row["Please specify the type of organization you are representing."] || "").replace(/\*+$/, '').trim();
     if (org === "Частный сектор") {
       org = "Private sector";
     }
     
     // Consolidate similar organization types
     if (org.includes("Academia") || org.includes("university") || org.includes("think tank")) {
       org = "Academia";
     } else if (org.includes("Civil society") || org.includes("NGO") || org.includes("community groups")) {
       org = "Civil society";
     } else if (org.includes("International Organisation") && !org.includes("UN")) {
       org = "International Organisation";
     }
    
    const region = (row["Region"] || "").trim();
    const score = utils.safeNumber(row["Total Score"]);
    const theme = (row["Primary thematic focus area"] || "").trim();

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
  }

  static calculateKPIs(data) {
    const countries = utils.unique(data.map(d => d._country));
    const scores = data.map(d => d._score).filter(score => score > 0);
    
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const median = scores.length ? this.calculateMedian(scores) : 0;
    const topScore = Math.max(...scores, 0);
    
    return {
      submissions: data.length,
      countries: countries.length,
      avgScore: avg,
      medianScore: median,
      topScore: topScore
    };
  }

  static calculateMedian(arr) {
    const sorted = arr.sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
}

// --- UI Components ---
class UIComponents {
  static renderKPIs(data) {
    const kpis = DataProcessor.calculateKPIs(data);
    const kpiHtml = `
      <div class="card">
        <div class="kpi-label">Total Submissions</div>
        <div class="kpi-value">${utils.formatNumber(kpis.submissions, 0)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Countries Represented</div>
        <div class="kpi-value">${utils.formatNumber(kpis.countries, 0)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Average Score</div>
        <div class="kpi-value">${utils.formatNumber(kpis.avgScore)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Median Score</div>
        <div class="kpi-value">${utils.formatNumber(kpis.medianScore)}</div>
      </div>
      <div class="card">
        <div class="kpi-label">Top Score</div>
        <div class="kpi-value">${utils.formatNumber(kpis.topScore)}</div>
      </div>
    `;
    el('kpis').innerHTML = kpiHtml;
  }

  static renderMap(data) {
    try {
      const counts = {};
      data.forEach(d => {
        if (d._iso3) counts[d._iso3] = (counts[d._iso3] || 0) + 1;
      });

      const locations = Object.keys(counts);
      const values = locations.map(k => counts[k]);

      const trace = {
        type: 'choropleth',
        locations,
        z: values,
        locationmode: 'ISO-3',
        colorscale: 'Blues',
        colorbar: { title: 'Submissions' },
        hovertemplate: '<b>%{location}</b><br>Submissions: %{z}<extra></extra>'
      };

      const layout = {
        geo: {
          projection: { type: 'equirectangular' },
          showland: true,
          landcolor: '#f8fafc',
          coastlinecolor: '#64748b',
          showocean: true,
          oceancolor: '#e2e8f0'
        },
        margin: { t: 0, r: 0, b: 0, l: 0 },
        title: { text: 'Global Distribution of Solutions', font: { size: 16 } }
      };

      Plotly.newPlot('map', [trace], layout, {
        displayModeBar: false,
        responsive: true
      });
    } catch (error) {
      console.error('Error rendering map:', error);
      el('map').innerHTML = '<div class="error">Error rendering map</div>';
    }
  }

  static renderOrgBar(data) {
    try {
      const byOrg = {};
      data.forEach(d => byOrg[d._org] = (byOrg[d._org] || 0) + 1);
      
      const sorted = Object.entries(byOrg)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15); // Top 15 org types

      const labels = sorted.map(([k]) => k);
      const values = sorted.map(([,v]) => v);

      const trace = {
        type: 'bar',
        x: values,
        y: labels,
        orientation: 'h',
        marker: { color: CONFIG.CHART_COLORS[0] }
      };

      const layout = {
        margin: { l: 120, r: 10, t: 10, b: 40 },
        xaxis: { title: 'Number of Organizations' },
        yaxis: { title: 'Organization Type' }
      };

      Plotly.newPlot('orgBar', [trace], layout, {
        displayModeBar: false,
        responsive: true
      });
    } catch (error) {
      console.error('Error rendering org bar:', error);
      el('orgBar').innerHTML = '<div class="error">Error rendering chart</div>';
    }
  }



  static renderSdgStack(data) {
    try {
      const allSdgs = utils.unique(data.flatMap(d => d._sdgs));
      const bySdg = Object.fromEntries(allSdgs.map(s => [s, 0]));
      
      data.forEach(d => d._sdgs.forEach(s => bySdg[s] = (bySdg[s] || 0) + 1));
      
      const sorted = Object.entries(bySdg)
        .sort(([a], [b]) => Number(a.split(' ')[1]) - Number(b.split(' ')[1]));

      const labels = sorted.map(([k]) => k);
      const parents = labels.map(() => '');
      const values = sorted.map(([,v]) => v);

      const trace = {
        type: 'treemap',
        labels,
        parents,
        values,
        marker: { colors: CONFIG.CHART_COLORS }
      };

      const layout = {
        margin: { t: 10, l: 10, r: 10, b: 10 },
        title: { text: '', font: { size: 16 } }
      };

      Plotly.newPlot('sdgStack', [trace], layout, {
        displayModeBar: false,
        responsive: true
      });
    } catch (error) {
      console.error('Error rendering SDG stack:', error);
      el('sdgStack').innerHTML = '<div class="error">Error rendering chart</div>';
    }
  }

  static renderScoreHist(data) {
    try {
      const scores = data.map(d => d._score).filter(score => score > 0);
      
      const trace = {
        type: 'histogram',
        x: scores,
        nbinsx: 20,
        marker: { color: CONFIG.CHART_COLORS[2] }
      };

      const layout = {
        margin: { t: 10, l: 40, r: 10, b: 40 },
        xaxis: { title: 'Score' },
        yaxis: { title: 'Count' },
        title: { text: '', font: { size: 16 } }
      };

      Plotly.newPlot('scoreHist', [trace], layout, {
        displayModeBar: false,
        responsive: true
      });
    } catch (error) {
      console.error('Error rendering score histogram:', error);
      el('scoreHist').innerHTML = '<div class="error">Error rendering chart</div>';
    }
  }

  static renderScoreScatter(data) {
    try {
      const validData = data.filter(d => d._score > 0 && d._maturity);
      const catIndex = d => Math.max(0, CONFIG.MATURITY_ORDER.indexOf(d._maturity));

      const trace = {
        mode: 'markers',
        x: validData.map(d => catIndex(d)),
        y: validData.map(d => d._score),
        text: validData.map(d => `${d["Name of your organization"]} — ${d["Title"]}`),
        hovertemplate: "<b>%{text}</b><br>Maturity: %{x}<br>Score: %{y}<extra></extra>",
        marker: {
          size: 8,
          color: validData.map(d => d._score),
          colorscale: 'Viridis',
          showscale: true,
          colorbar: { title: 'Score' }
        }
      };

      const layout = {
        xaxis: {
          tickmode: 'array',
          tickvals: CONFIG.MATURITY_ORDER.map((_, i) => i),
          ticktext: CONFIG.MATURITY_ORDER,
          title: 'Maturity Stage'
        },
        yaxis: { title: 'Score' },
        margin: { t: 10 },
        title: { text: '', font: { size: 16 } }
      };

      Plotly.newPlot('scoreScatter', [trace], layout, {
        displayModeBar: false,
        responsive: true
      });
    } catch (error) {
      console.error('Error rendering score scatter:', error);
      el('scoreScatter').innerHTML = '<div class="error">Error rendering chart</div>';
    }
  }

  static renderTopTable(data) {
    try {
      const top = data
        .filter(d => d._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, CONFIG.MAX_TOP_SOLUTIONS);

      const rows = top.map((d, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${d._score.toFixed(1)}</td>
          <td>${d["Name of your organization"] || ""}</td>
          <td>${d["Title"] || ""}</td>
          <td>${d._country || ""}</td>
          <td>${d._org || ""}</td>
          <td>${d._theme || ""}</td>
        </tr>`).join('');

      el('topTable').innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Score</th>
              <th>Organization</th>
              <th>Title</th>
              <th>Country</th>
              <th>Org Type</th>
                             <th>Thematic Focus</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;
    } catch (error) {
      console.error('Error rendering top table:', error);
      el('topTable').innerHTML = '<div class="error">Error rendering table</div>';
    }
  }
}

// --- Filter Management ---
class FilterManager {
  static fillSelect(id, values) {
    const select = el(id);
    if (!select) return;
    
    select.innerHTML = values.map(v => 
      `<option value="${v}">${v}</option>`
    ).join('');
  }

  static clearSelect(id) {
    const select = el(id);
    if (!select) return;
    
    [...select.options].forEach(option => option.selected = false);
  }

  static setFilterFromSelect(id) {
    const select = el(id);
    if (!select) return;

    const selected = new Set([...select.selectedOptions].map(o => o.value));
    const filterKey = id.replace('f', '').toLowerCase();
    
    if (filterKey === 'region') {
      appState.filters.region = selected;
      // Update country filter based on region selection
      FilterManager.updateCountryFilter(selected);
    }
    if (filterKey === 'country') {
      appState.filters.country = selected;
      // Update region filter based on country selection
      FilterManager.updateRegionFilter(selected);
    }
    if (filterKey === 'org') appState.filters.org = selected;
    if (filterKey === 'maturity') appState.filters.maturity = selected;
    if (filterKey === 'sdg') appState.filters.sdg = selected;
  }

  static populateFilters() {
    // Get unique values from data
    const regions = utils.unique(appState.rawData.map(r => r._region));
    const countries = utils.unique(appState.rawData.map(r => r._country));
    const orgs = utils.unique(appState.rawData.map(r => r._org));
    
    // Populate region filter
    FilterManager.fillSelect("fRegion", regions);
    
    // Populate country filter (initially all countries)
    FilterManager.fillSelect("fCountry", countries);
    
    // Populate other filters
    FilterManager.fillSelect("fOrg", orgs);
    
    // Get actual maturity values from data and sort them logically
    const actualMaturityValues = utils.unique(appState.rawData.map(r => r._maturity));
    const sortedMaturity = actualMaturityValues.sort((a, b) => {
      const aIndex = CONFIG.MATURITY_ORDER.indexOf(a);
      const bIndex = CONFIG.MATURITY_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return 0;
      return aIndex - bIndex;
    });
    
    FilterManager.fillSelect("fMaturity", sortedMaturity);
    FilterManager.fillSelect("fSDG", utils.unique(appState.rawData.flatMap(r => r._sdgs)));
  }

  static updateCountryFilter(selectedRegions) {
    if (!appState.countryRegionMapping) return;
    
    const countrySelect = el('fCountry');
    if (!countrySelect) return;
    
    if (selectedRegions.size === 0) {
      // If no regions selected, show all countries
      const allCountries = utils.unique(appState.rawData.map(r => r._country));
      FilterManager.fillSelect("fCountry", allCountries);
      return;
    }
    
    // Get countries that belong to selected regions
    const validCountries = new Set();
    selectedRegions.forEach(region => {
      const countriesInRegion = appState.countryRegionMapping.region_to_countries[region] || [];
      countriesInRegion.forEach(country => {
        // Only add countries that exist in our data
        if (appState.rawData.some(r => r._country === country)) {
          validCountries.add(country);
        }
      });
    });
    
    // Update country filter with only valid countries
    const sortedCountries = Array.from(validCountries).sort();
    FilterManager.fillSelect("fCountry", sortedCountries);
    
    // Clear any country selections that are no longer valid
    appState.filters.country.clear();
    [...countrySelect.options].forEach(option => option.selected = false);
  }

  static updateRegionFilter(selectedCountries) {
    if (!appState.countryRegionMapping) return;
    
    const regionSelect = el('fRegion');
    if (!regionSelect) return;
    
    if (selectedCountries.size === 0) {
      // If no countries selected, show all regions
      const allRegions = utils.unique(appState.rawData.map(r => r._region));
      FilterManager.fillSelect("fRegion", allRegions);
      return;
    }
    
    // Get regions that contain selected countries
    const validRegions = new Set();
    selectedCountries.forEach(country => {
      const region = appState.countryRegionMapping.country_to_region[country];
      if (region) {
        validRegions.add(region);
      }
    });
    
    // Update region filter with only valid regions
    const sortedRegions = Array.from(validRegions).sort();
    FilterManager.fillSelect("fRegion", sortedRegions);
    
    // Clear any region selections that are no longer valid
    appState.filters.region.clear();
    [...regionSelect.options].forEach(option => option.selected = false);
  }
}

// --- CSV Export ---
class CSVExporter {
  static exportCSV(data) {
    try {
      const cols = [
        "ID", "Country", "Region", "Name of your organization",
        "Please specify the type of organization you are representing.",
        "Title", "Primary thematic focus area", "Maturity stage",
        "Total Score", "SDGs addressed"
      ];
      
      const header = cols.join(",");
      const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const lines = data.map(r => cols.map(c => esc(r[c])).join(","));
      const csvContent = header + "\n" + lines.join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = createElement('a');
      a.href = url;
      a.download = CONFIG.CSV_FILENAME;
      a.click();
      URL.revokeObjectURL(url);
      
      // Show success message
      this.showExportSuccess();
    } catch (error) {
      console.error('Export error:', error);
      this.showExportError();
    }
  }

  static showExportSuccess() {
    const button = el('exportCsv');
    const originalText = button.textContent;
    button.textContent = '✅ Exported!';
    button.style.background = CONFIG.CHART_COLORS[3];
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }

  static showExportError() {
    const button = el('exportCsv');
    const originalText = button.textContent;
    button.textContent = '❌ Export Failed';
    button.style.background = CONFIG.CHART_COLORS[2];
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }
}

// --- Main Application ---
class AnalyticsApp {
  constructor() {
    this.initializeEventListeners();
  }

  async initialize() {
    try {
      appState.setLoading(true);
      
      // Load country-region mapping first
      try {
        const mappingResponse = await fetch('country_region_mapping.json');
        if (mappingResponse.ok) {
          appState.countryRegionMapping = await mappingResponse.json();
          console.log('Loaded country-region mapping');
        }
      } catch (mappingError) {
        console.warn('Could not load country-region mapping:', mappingError.message);
      }
      
      // Load data
      const response = await fetch('data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      let rawData;
      try {
        rawData = await response.json();
      } catch (jsonError) {
        throw new Error(`Invalid JSON data: ${jsonError.message}`);
      }
      
      if (!Array.isArray(rawData)) {
        throw new Error('Data must be an array of records');
      }
      
      if (rawData.length === 0) {
        throw new Error('No data found in the file');
      }
      
      console.log(`Loaded ${rawData.length} records from data.json`);
      
      appState.rawData = rawData.map(DataProcessor.normalizeRow);
      
      // Initialize UI
      FilterManager.populateFilters();
      this.renderAll();
      
      appState.setLoading(false);
    } catch (error) {
      console.error('Initialization error:', error);
      appState.setError(`Failed to load data: ${error.message}`);
    }
  }

  initializeEventListeners() {
    // Filter change events
    ["fRegion", "fCountry", "fOrg", "fMaturity", "fSDG"].forEach(id => {
      el(id)?.addEventListener('change', utils.debounce(() => {
        FilterManager.setFilterFromSelect(id);
        this.renderAll();
      }, 300));
    });

    // Button events
    el('clear')?.addEventListener('click', () => {
      appState.clearFilters();
      this.renderAll();
    });

    el('exportCsv')?.addEventListener('click', () => {
      CSVExporter.exportCSV(appState.getFilteredData());
    });
  }

  renderAll() {
    try {
      appState.filteredData = appState.getFilteredData();
      
      UIComponents.renderKPIs(appState.filteredData);
      UIComponents.renderMap(appState.filteredData);
      // UIComponents.renderOrgBar(appState.filteredData);
      UIComponents.renderSdgStack(appState.filteredData);
      UIComponents.renderScoreHist(appState.filteredData);
      UIComponents.renderScoreScatter(appState.filteredData);
      // UIComponents.renderTopTable(appState.filteredData);
    } catch (error) {
      console.error('Render error:', error);
      appState.setError(`Rendering error: ${error.message}`);
    }
  }
}

// --- Application Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  const app = new AnalyticsApp();
  app.initialize();
});
