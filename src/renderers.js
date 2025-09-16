/**
 * Chart and visualization renderers
 */

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
  console.log(`🎯 Rendering ${data.length} solutions (filtered from ${appState.rawData.length} total)`);
  
  // Use requestAnimationFrame for better performance
  requestAnimationFrame(() => {
    // Render all visualizations
    renderKPIs(data);
    renderMap(data);
    renderSdgStack(data);
    renderOrgPie(data);
    renderScoreHist(data); // Hidden function - preserved for future use
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    renderKPIs, 
    renderSdgStack, 
    renderScoreHist, 
    renderOrgPie, 
    renderAll 
  };
}
