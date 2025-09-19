/**
 * Map functionality and controls
 */

/**
 * Custom fullscreen control for map
 * Allows toggling map between embedded and fullscreen modes
 */
class FullscreenControl {
  constructor() {
    this._isFullscreen = false;
    this._originalStyle = null;
    this._originalParent = null;
    this._originalPosition = null;
    this._originalZIndex = null;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      margin: 10px;
    `;

    this._button = document.createElement('button');
    this._button.className = 'mapboxgl-ctrl-icon fullscreen-control';
    this._button.type = 'button';
    this._button.title = 'Toggle fullscreen view';
    this._button.innerHTML = '⛶'; // Fullscreen icon
    this._button.style.cssText = `
      width: 30px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    `;

    this._button.addEventListener('click', () => {
      this._toggleFullscreen();
    });

    this._container.appendChild(this._button);

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', () => {
      this._updateButton();
    });

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }

  _toggleFullscreen() {
    if (!this._isFullscreen) {
      this._enterFullscreen();
    } else {
      this._exitFullscreen();
    }
  }

  _enterFullscreen() {
    const mapContainer = this._map.getContainer();
    
    // Store original styles
    this._originalStyle = mapContainer.style.cssText;
    this._originalParent = mapContainer.parentNode;
    this._originalPosition = mapContainer.style.position;
    this._originalZIndex = mapContainer.style.zIndex;

    // Create fullscreen container
    const fullscreenContainer = document.createElement('div');
    fullscreenContainer.id = 'map-fullscreen-container';
    fullscreenContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: var(--bg);
      z-index: 9999;
      display: flex;
      flex-direction: column;
    `;

    // Move map to fullscreen container
    fullscreenContainer.appendChild(mapContainer);

    // Update map container styles
    mapContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    `;

    // Add to document
    document.body.appendChild(fullscreenContainer);

    // Resize map
    setTimeout(() => {
      this._map.resize();
    }, 100);

    this._isFullscreen = true;
    this._updateButton();

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  _exitFullscreen() {
    const fullscreenContainer = document.getElementById('map-fullscreen-container');
    if (fullscreenContainer) {
      const mapContainer = this._map.getContainer();
      
      // Restore original parent and styles
      this._originalParent.appendChild(mapContainer);
      mapContainer.style.cssText = this._originalStyle;

      // Remove fullscreen container
      fullscreenContainer.remove();

      // Resize map
      setTimeout(() => {
        this._map.resize();
      }, 100);

      this._isFullscreen = false;
      this._updateButton();

      // Restore body scroll
      document.body.style.overflow = '';
    }
  }

  _updateButton() {
    if (this._button) {
      this._button.innerHTML = this._isFullscreen ? '⛶' : '⛶';
      this._button.title = this._isFullscreen ? 'Exit fullscreen view' : 'Enter fullscreen view';
    }
  }
}

/**
 * Custom map projection control
 * Allows toggling between 2D flat and 3D globe projections
 */
class MapProjectionControl {
  constructor() {
    this._isGlobe = false;
  }

  onAdd(map) {
    this._map = map;
    this._container = document.createElement('div');
    this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
    this._container.style.cssText = `
      position: relative;
      display: flex;
      flex-direction: column;
      margin: 10px;
    `;

    this._button = document.createElement('button');
    this._button.className = 'mapboxgl-ctrl-icon projection-control';
    this._button.type = 'button';
    this._button.title = 'Toggle between 2D and 3D view';
    this._button.innerHTML = '🌍 2D';
    this._button.style.cssText = `
      width: 30px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: none;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      font-weight: 600;
    `;

    this._button.addEventListener('click', () => {
      this._toggleProjection();
    });

    this._container.appendChild(this._button);

    // Initialize button state
    this._updateButton();

    return this._container;
  }

  onRemove() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
  }

  _toggleProjection() {
    if (!window.map) return;
    
    const newProjection = appState.toggleMapProjection();
    console.log(`Switching to ${newProjection} projection`);
    
    try {
      window.map.setProjection(newProjection);
      
      if (newProjection === 'globe') {
        const currentZoom = window.map.getZoom();
        if (currentZoom < 1.5) {
          window.map.setZoom(1.5);
        }
      }
      
      this._updateButton();
      
      // Show feedback
      const originalText = this._button.innerHTML;
      this._button.innerHTML = newProjection === 'equirectangular' ? '✅ 2D' : '✅ 3D';
      setTimeout(() => {
        this._button.innerHTML = originalText;
      }, 1000);
    } catch (err) {
      console.error('Error changing projection:', err);
      console.log('Recreating map with new projection...');
      window.map.remove();
      window.map = null;
      setTimeout(() => {
        if (typeof renderAll === 'function') {
          renderAll();
        }
      }, 100);
    }
  }

  _updateButton() {
    if (this._button) {
      const isGlobe = appState.mapProjection === 'globe';
      this._button.innerHTML = isGlobe ? '🌐 3D' : '🌍 2D';
      this._button.title = isGlobe ? 'Switch to 2D Flat view' : 'Switch to 3D Globe view';
      this._button.classList.toggle('active', isGlobe);
    }
  }
}

/**
 * Gets coordinates for a country by name
 * @param {string} countryName - Name of the country
 * @returns {Array<number>} [longitude, latitude] coordinates
 */
const getCountryCoordinates = (countryName) => {
  const countryCoords = {
    'United States': [-95.7129, 37.0902],
    'Canada': [-106.3468, 56.1304],
    'United Kingdom': [-3.4360, 55.3781],
    'Germany': [10.4515, 51.1657],
    'France': [2.2137, 46.2276],
    'Italy': [12.5674, 41.8719],
    'Spain': [-3.7492, 40.4637],
    'Netherlands': [5.2913, 52.1326],
    'Sweden': [18.6435, 60.1282],
    'Norway': [8.4689, 60.4720],
    'Denmark': [9.5018, 56.2639],
    'Finland': [25.7482, 61.9241],
    'Australia': [133.7751, -25.2744],
    'Japan': [138.2529, 36.2048],
    'South Korea': [127.7669, 35.9078],
    'China': [104.1954, 35.8617],
    'India': [78.9629, 20.5937],
    'Brazil': [-51.9253, -14.2350],
    'Mexico': [-102.5528, 23.6345],
    'Argentina': [-63.6167, -38.4161],
    'South Africa': [22.9375, -30.5595],
    'Nigeria': [8.6753, 9.0820],
    'Kenya': [37.9062, -0.0236],
    'Egypt': [30.8025, 26.8206],
    'Turkey': [35.2433, 38.9637],
    'Russia': [105.3188, 61.5240],
    'Ukraine': [31.1656, 48.3794],
    'Poland': [19.1451, 51.9194],
    'Czech Republic': [15.4730, 49.8175],
    'Austria': [14.5501, 47.5162],
    'Switzerland': [8.2275, 46.8182],
    'Belgium': [4.4699, 50.5039],
    'Ireland': [-8.2439, 53.4129],
    'Portugal': [-8.2245, 39.3999],
    'Greece': [21.8243, 39.0742],
    'Israel': [34.8516, 31.0461],
    'United Arab Emirates': [53.8478, 23.4241],
    'Saudi Arabia': [45.0792, 23.8859],
    'Thailand': [100.9925, 15.8700],
    'Vietnam': [108.2772, 14.0583],
    'Philippines': [121.7740, 12.8797],
    'Indonesia': [113.9213, -0.7893],
    'Malaysia': [101.9758, 4.2105],
    'Singapore': [103.8198, 1.3521],
    'New Zealand': [174.8860, -40.9006],
    'Chile': [-71.5430, -35.6751],
    'Colombia': [-74.2973, 4.5709],
    'Peru': [-75.0152, -9.1900],
    'Venezuela': [-66.5897, 6.4238],
    'Ecuador': [-78.1834, -1.8312],
    'Uruguay': [-55.7658, -32.5228],
    'Paraguay': [-58.4438, -23.4425],
    'Bolivia': [-63.5887, -16.2902],
    'Guyana': [-58.9302, 4.8604],
    'Suriname': [-56.0278, 3.9193],
    'French Guiana': [-53.1258, 3.9339],
    'Algeria': [1.6596, 28.0339],
    'Libya': [17.2283, 26.3351],
    'Democratic Republic of the Congo': [21.7587, -4.0383],
    'Uganda': [32.2903, 1.3733],
    'Cameroon': [12.3547, 7.3697],
    'Senegal': [-14.4524, 14.4974],
    'Guinea': [-9.6966, 9.6412],
    'Mali': [-3.9962, 17.5707],
    'South Africa': [22.9375, -30.5595],
    'Zambia': [27.8493, -13.1339],
    'Ethiopia': [40.4897, 9.1450],
    'Togo': [0.8248, 8.6195],
    'Tunisia': [9.5375, 33.8869],
    'Ghana': [-1.0232, 7.9465],
    'Rwanda': [29.8739, -1.9403],
    'Tanzania': [34.8888, -6.3690],
    'Chad': [18.7322, 15.4542],
    'Niger': [8.0817, 16.0000],
    'Burkina Faso': [-2.1976, 12.2383],
    'Sierra Leone': [-11.7799, 8.4606],
    'Benin': [2.3158, 9.3077],
    'Côte d\'Ivoire': [-5.5471, 7.5400],
    'Bangladesh': [90.3563, 23.6850],
    'Afghanistan': [67.7099, 33.9391],
    'Armenia': [45.0382, 40.0691],
    'Bhutan': [90.4336, 27.5142],
    'Bosnia and Herzegovina': [17.6791, 43.9159],
    'Botswana': [22.3394, -22.3285],
    'Burundi': [29.8739, -3.3731],
    'Cabo Verde': [-24.0132, 16.5388],
    'Cambodia': [104.9910, 12.5657],
    'Cuba': [-77.7812, 21.5218],
    'Djibouti': [42.5903, 11.8251],
    'Dominican Republic': [-70.1627, 18.7357],
    'Gabon': [11.6094, -0.8037],
    'Hong Kong SAR, China': [114.1694, 22.3193],
    'Iran': [53.6880, 32.4279],
    'Iraq': [43.6793, 33.2232],
    'Jordan': [36.2384, 30.5852],
    'Kyrgyzstan': [74.7661, 41.2044],
    'Lebanon': [35.8623, 33.8547],
    'Liberia': [-9.4295, 6.4281],
    'Madagascar': [46.8691, -18.7669],
    'Malawi': [34.3015, -13.2543],
    'Mozambique': [35.5296, -18.6657],
    'Namibia': [18.4904, -22.9576],
    'Somalia': [46.1996, 5.1521],
    'South Sudan': [31.3070, 6.8770],
    'Uzbekistan': [64.5853, 41.3775],
    'Yemen': [48.5164, 15.5527],
    'Zimbabwe': [29.1549, -19.0154],
    'Pakistan': [69.3451, 30.3753],
    'Sri Lanka': [80.7718, 7.8731],
    'Mauritania': [-10.9408, 21.0079],
    'Moldova': [28.3699, 47.4116],
    'Mongolia': [103.8467, 46.8625],
    'Morocco': [-7.0926, 31.6295],
    'Oman': [55.9233, 21.4735],
    'Republic of Korea': [127.7669, 35.9078],
    'Republic of Palau': [134.5825, 7.5150],
    'Saint Kitts and Nevis': [-62.7829, 17.3578],
    'Slovenia': [14.9955, 46.1512]
  };
  return countryCoords[countryName] || [0, 0];
};

/**
 * Renders the interactive world map with solution data
 * @param {Array} data - Filtered data array
 */
function renderMap(data) {
  try {
    const hasToken = CONFIG.MAPBOX_TOKEN && !/example$/.test(CONFIG.MAPBOX_TOKEN);
    const mapEl = utils.el('map');
    const HINT_ID = 'map-hint';

    const showHint = (html) => {
      if (!mapEl) return;
      let hint = document.getElementById(HINT_ID);
      if (!hint) {
        hint = document.createElement('div');
        hint.id = HINT_ID;
        hint.style.cssText = `
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          color: var(--muted); pointer-events: none; z-index: 2; text-align: center; padding: 24px;
          background: none;
        `;
        mapEl.appendChild(hint);
      }
      hint.innerHTML = html;
    };
    
    const hideHint = () => {
      const hint = document.getElementById(HINT_ID);
      if (hint && hint.parentNode) {
        hint.parentNode.removeChild(hint);
      }
    };

    if (!hasToken) {
      if (!window.map || !window.map.getStyle) {
        mapEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)">⚠️ Mapbox token missing. Update CONFIG.MAPBOX_TOKEN.</div>';
      }
      el('mapbox-note').style.display = 'block';
      return;
    }

    // Aggregate counts by ISO3
    const counts = {};
    for (const d of data) if (d._iso3) {
      counts[d._iso3] = (counts[d._iso3] || 0) + 1;
    }
    const maxCount = Math.max(0, ...Object.values(counts));

    // Build expressions
    const countExpr = ['match', ['get', 'iso_3166_1_alpha_3']];
    for (const [iso3, c] of Object.entries(counts)) countExpr.push(iso3, c);
    countExpr.push(0);

    const colorExpr = ['case',
      ['==', countExpr, 0], '#D0D0D0',
      ['interpolate', ['linear'], countExpr,
        1, '#E8F5E8',
        Math.max(1, maxCount * 0.20), '#B3E6B3',
        Math.max(1, maxCount * 0.40), '#7ED67E',
        Math.max(1, maxCount * 0.60), '#4AC64A',
        Math.max(1, maxCount * 0.80), '#16B616',
        Math.max(1, maxCount), '#0B7A0B',
      ]
    ];

    const ensureLayers = () => {
      if (!window.map.getSource('country-bounds')) {
        window.map.addSource('country-bounds', { type: 'vector', url: 'mapbox://mapbox.country-boundaries-v1' });
      }
      if (!window.map.getLayer('submissions-fill')) {
        window.map.addLayer({
          id: 'submissions-fill',
          type: 'fill',
          source: 'country-bounds',
          'source-layer': 'country_boundaries',
          paint: { 'fill-color': colorExpr, 'fill-opacity': 0.75 }
        });
      } else {
        window.map.setPaintProperty('submissions-fill', 'fill-color', colorExpr);
      }
      if (!window.map.getLayer('submissions-outline')) {
        window.map.addLayer({
          id: 'submissions-outline',
          type: 'line',
          source: 'country-bounds',
          'source-layer': 'country_boundaries',
          paint: { 'line-color': '#0E1A2F', 'line-width': 0.5 }
        });
      }

      // Add clustered markers
      if (!window.map.getSource('submissions')) {
        const geoJsonData = {
          type: 'FeatureCollection',
          features: data.map(d => {
            const coords = getCountryCoordinates(d._country);
            return {
              type: 'Feature',
              properties: {
                country: d._country,
                iso3: d._iso3,
                score: d._score,
                org: d._org,
                maturity: d._maturity,
                id: Math.random()
              },
              geometry: {
                type: 'Point',
                coordinates: coords
              }
            };
          }).filter(f => f.geometry.coordinates[0] !== 0 || f.geometry.coordinates[1] !== 0)
        };

        window.map.addSource('submissions', {
          type: 'geojson',
          data: geoJsonData,
          cluster: true,
          clusterMaxZoom: 4,
          clusterRadius: 20
        });

        // Add cluster circles
        window.map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'submissions',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step',
              ['get', 'point_count'],
              '#e3f2fd',
              10, '#81d4fa',
              20, '#29b6f6',
              30, '#0277bd'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              15,
              10, 20,
              20, 30
            ]
          }
        });

        // Add cluster count labels
        window.map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'submissions',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12
          }
        });

        // Add unclustered points
        window.map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'submissions',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': '#11b4da',
            'circle-radius': 8,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#fff'
          }
        });

        // Add click handlers for country boundaries
        window.map.on('click', 'submissions-fill', (e) => {
          const features = window.map.queryRenderedFeatures(e.point, { layers: ['submissions-fill'] });
          if (features.length > 0) {
            const feature = features[0];
            const iso3 = feature.properties.iso_3166_1_alpha_3;
            
            // Find country name from ISO3 code
            const countryName = Object.keys(window.COUNTRY_TO_ISO3 || {}).find(
              country => window.COUNTRY_TO_ISO3[country] === iso3
            );
            
            if (countryName) {
              appState.selectCountry(countryName);
            }
          }
        });

        // Add click handlers for clusters
        window.map.on('click', 'clusters', (e) => {
          // Prevent default behavior that could cause page reload
          e.preventDefault();
          e.stopPropagation();
          
          const features = window.map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
          if (features.length === 0) return;
          
          const clusterId = features[0].properties.cluster_id;
          window.map.getSource('submissions').getClusterExpansionZoom(clusterId, (err, zoom) => {
            if (err) return;
            window.map.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom
            });
          });
        });

        // Add click handlers for individual submission points
        window.map.on('click', 'unclustered-point', (e) => {
          // Prevent all default behaviors
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Temporarily disable zoom to prevent unwanted zoom behavior
          window.map.scrollZoom.disable();
          window.map.doubleClickZoom.disable();
          
          const coordinates = e.features[0].geometry.coordinates.slice();
          const props = e.features[0].properties;
          
          new mapboxgl.Popup()
            .setLngLat(coordinates)
            .setHTML(`
              <div style="font-weight:700; display:flex; align-items:center; margin-bottom:8px;">
                ${utils.getCountryFlag(props.country)}${props.country}
              </div>
              <div style="color:var(--muted)">Organization: ${props.org}</div>
              <div style="color:var(--muted)">Maturity: ${props.maturity}</div>
              <div style="color:var(--muted)">Score: ${props.score}</div>
              <div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">
                <button onclick="appState.selectCountry('${props.country}')" 
                        style="background:var(--brand); color:white; border:none; padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">
                  View All Solutions
                </button>
              </div>
            `)
            .addTo(window.map);
          
          // Re-enable zoom after a short delay
          setTimeout(() => {
            window.map.scrollZoom.enable();
            window.map.doubleClickZoom.enable();
          }, 100);
        });

        // Change cursor on hover
        window.map.on('mouseenter', 'submissions-fill', () => {
          window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'submissions-fill', () => {
          window.map.getCanvas().style.cursor = '';
        });
        window.map.on('mouseenter', 'clusters', () => {
          window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'clusters', () => {
          window.map.getCanvas().style.cursor = '';
        });
        window.map.on('mouseenter', 'unclustered-point', () => {
          window.map.getCanvas().style.cursor = 'pointer';
        });
        window.map.on('mouseleave', 'unclustered-point', () => {
          window.map.getCanvas().style.cursor = '';
        });
      }
    };

    // Create or update map
    if (!window.map || !window.map.getStyle) {
      showHint('🌍 Initializing map…');

      mapboxgl.accessToken = CONFIG.MAPBOX_TOKEN;
      const mapStyle = ThemeManager.currentTheme === 'light' 
        ? 'mapbox://styles/mapbox/outdoors-v12' 
        : 'mapbox://styles/mapbox/outdoors-v12';
      
      window.map = new mapboxgl.Map({
        container: 'map',
        style: mapStyle,
        center: [0, 20],
        zoom: 1,
        minZoom: 1,              // Minimum zoom level
        maxZoom: 4,              // Maximum zoom level
        projection: appState.mapProjection,
        doubleClickZoom: true,   // Enable double-click zoom
        scrollZoom: true,        // Enable scroll zoom
        boxZoom: false,          // Disable box zoom
        dragRotate: false,       // Disable drag rotate
        dragPan: true,           // Keep drag pan enabled
        keyboard: true,          // Enable keyboard zoom
        touchZoomRotate: true    // Enable touch zoom
      });
      
      // Add navigation control with zoom buttons
      window.map.addControl(new mapboxgl.NavigationControl({
        showZoom: true,     // Show zoom buttons
        showCompass: false  // Hide compass
      }), 'top-right');

      // Add custom fullscreen control
      window.map.addControl(new FullscreenControl(), 'top-right');

      // Add custom 2D/3D toggle control
      window.map.addControl(new MapProjectionControl(), 'top-right');

      window.map.on('error', (e) => {
        console.error('Mapbox error:', e);
        showHint('❌ Map error<br><small>Check token or style</small>');
      });

      window.map.on('load', () => {
        hideHint();
        ensureLayers();
      });
    } else {
      if (window.map.isStyleLoaded) {
        ensureLayers();
      } else {
        showHint('🌍 Updating map…');
        if (!window.__pending_style_load_handler) {
          window.__pending_style_load_handler = true;
          window.map.on('load', () => {
            ensureLayers();
            hideHint();
            window.__pending_style_load_handler = false;
          });
        }
      }
    }
  } catch (err) {
    console.error('Error rendering map:', err);
    const mapEl = el('map');
    if (mapEl) {
      let hint = document.getElementById('map-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'map-hint';
        hint.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--muted);pointer-events:none;z-index:2;text-align:center;padding:24px;';
        mapEl.appendChild(hint);
      }
      hint.innerHTML = '❌ Map error<br><small>See console for details</small>';
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    FullscreenControl, 
    MapProjectionControl, 
    getCountryCoordinates, 
    renderMap 
  };
}
