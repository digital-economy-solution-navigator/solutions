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
  
  // Use official UN SDG colors and create labels with emoji icons
  const colors = labels.map(sdg => CONFIG.SDG_COLORS[sdg] || '#CCCCCC');
  const labelsWithIcons = labels.map(sdg => utils.formatSdgWithIcon(sdg));
  
  const trace = { 
    type: 'treemap', 
    labels: labelsWithIcons, 
    parents, 
    values, 
    marker: { colors: colors },
    textinfo: 'label+value',
    textfont: { size: 14, color: 'white' },
    hovertemplate: labels.map((sdg, i) => {
      const fullLabel = utils.formatSdgWithLabel(sdg);
      return `<span style="color: #ffffff;"><b>${fullLabel}</b><br>Solutions: ${values[i]}</span><extra></extra>`;
    })
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
  
  // Detect if we're on mobile for responsive adjustments
  const isMobile = window.innerWidth <= 767;
  
  // Create wrapped labels for mobile to handle long text
  const wrappedLabels = isMobile ? labels.map(label => {
    // Wrap long labels for better mobile display
    if (label.length > 20) {
      const words = label.split(' ');
      if (words.length > 2) {
        const mid = Math.ceil(words.length / 2);
        return words.slice(0, mid).join(' ') + '<br>' + words.slice(mid).join(' ');
      }
    }
    return label;
  }) : labels;
  
  const trace = {
    type: 'pie',
    labels: wrappedLabels,
    values: values,
    // Consistent text display across mobile and desktop
    textinfo: 'label+percent',
    textposition: 'outside',
    textfont: {
      size: isMobile ? 11 : 12,
      color: ThemeManager.currentTheme === 'dark' ? '#FFFFFF' : '#0F172A',
      family: 'inherit'
    },
    hovertemplate: '<b>%{label}</b><br>Count: %{value}<br>Percentage: %{percent}<extra></extra>',
    // Ensure small slices are always visible
    insidetextorientation: 'horizontal',
    texttemplate: '%{label}<br>%{percent}',
    // Make pie smaller on mobile by creating a donut chart
    ...(isMobile ? {
      hole: 0.3  // Create a donut chart with 30% hole on mobile
    } : {}),
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
    // Consistent margins with responsive adjustments - more space for mobile labels
    margin: isMobile ? { t: 30, r: 50, b: 30, l: 50 } : { t: 20, r: 20, b: 20, l: 20 },
    // No legend for cleaner display
    showlegend: false,
    font: {
      size: isMobile ? 11 : 12,
      color: ThemeManager.currentTheme === 'dark' ? '#FFFFFF' : '#0F172A',
      family: 'inherit'
    },
    // Ensure small slices are visible
    piecolorway: CONFIG.CHART_COLORS,
    // Add more space around the pie chart on mobile
    ...(isMobile ? {
      autosize: true,
      width: undefined,
      height: undefined
    } : {})
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
