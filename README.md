# 🌍 Global Call for Solutions Analytics Dashboard

Interactive analytics dashboard for visualizing global solution submissions data.

## ✨ Features
- **Interactive visualizations**: World map, charts, and data tables
- **Advanced filtering**: Multi-select filters with real-time updates
- **Export functionality**: Download filtered data as CSV
- **Responsive design**: Works on desktop and mobile
- **Theme toggle**: Dark/Light mode
- **QR Code integration**: Easy solution submission access

## 🚀 Quick Start

1. **Start the server:**
   ```bash
   python -m http.server 8000
   ```

2. **Open browser:** Navigate to `http://localhost:8000`

3. **Dashboard loads automatically** with all visualizations

## 📁 Key Files

| File | Purpose |
|------|---------|
| `index.html` | Main dashboard interface |
| `app.js` | Application logic and visualizations |
| `data.json` | Main submissions data |
| `country_region_mapping.json` | Country-region mapping |
| `excel_to_json_refined.py` | Convert Excel to JSON |
| `generate_country_mapping.py` | Generate country-region mapping |
| `check_json_structure.py` | Validate data structure |

## 🔧 Configuration

### Data Sources
Update file paths in `app.js` CONFIG object:
```javascript
DATA_SOURCES: {
  MAIN_DATA: 'data.json',
  COUNTRY_MAPPING: 'country_region_mapping.json'
}
```

### Required Data Fields
- `Country`, `Region`, `Title`, `Total Score`, `SDGs addressed`
- `Maturity stage`, `Primary thematic focus area`
- `Please specify the type of organization you are representing.`

## 🎨 Customization
- **Colors**: Modify CSS variables in `styles.css`
- **Charts**: Adjust `CONFIG.CHART_COLORS` in `app.js`
- **Data Sources**: Update `CONFIG.DATA_SOURCES` for different files

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Charts not loading | Run `python check_json_structure.py` |
| Map not displaying | Run `python generate_country_mapping.py` |
| Data loading errors | Check `CONFIG.DATA_SOURCES` paths |
| Performance issues | Check data size (>10k records may be slow) |
| Export not working | Check browser download permissions |

**Browser Support:** Chrome, Firefox, Safari (IE not supported)

## 🔄 Data Updates

### **Complete Workflow:**
1. **Update Excel:** Edit `data-processing/Further analysis.xlsx`
2. **Convert to JSON:** `python data-processing/excel_to_json_refined.py`
3. **Generate mapping:** `python data-processing/generate_country_mapping.py`
4. **Validate data:** `python data-processing/check_json_structure.py`
5. **Deploy:** Replace files and refresh dashboard

### **Scripts:**
| Script | Purpose |
|--------|---------|
| `data-processing/excel_to_json_refined.py` | Convert Excel to JSON |
| `data-processing/generate_country_mapping.py` | Generate country-region mapping |
| `data-processing/check_json_structure.py` | Validate data structure |
| `data-processing/fix_json_complete.py` | Fix corrupted JSON |

### **Quick Fixes:**
- **Corrupted data:** `python data-processing/fix_json_complete.py`
- **Mapping issues:** `python data-processing/generate_country_mapping.py`
- **Validation:** `python data-processing/check_json_structure.py`

## 🆘 Support

### **For IT Support:**
- **Start:** `python -m http.server 8000` → `http://localhost:8000`
- **Update data:** Follow "Data Updates" workflow above
- **Issues:** Check troubleshooting table, run diagnostic scripts

### **Emergency:**
- **Won't load:** Run `python check_json_structure.py`
- **Wrong data:** Re-run conversion scripts
- **Performance:** Check data size

---

**Built with HTML5, CSS3, JavaScript, Plotly.js, Python**  
**Version:** 2.0 | **Maintained by:** UNIDO TCS/DAI