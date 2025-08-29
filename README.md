# 🌍 Global Call for Solutions Analytics Dashboard

A comprehensive, interactive analytics dashboard for visualizing and analyzing global solution submissions data.

## ✨ Features

### 📊 **Interactive Visualizations**
- **World Map**: Choropleth map showing submission distribution by country
- **Organization Types**: Horizontal bar chart of organization type distribution
- **Thematic Focus**: Treemap visualization of primary thematic areas
- **SDG Analysis**: Bar chart of Sustainable Development Goals addressed
- **Score Distribution**: Histogram of solution scores
- **Score vs Maturity**: Scatter plot showing relationship between scores and maturity stages
- **Top Solutions Table**: Ranked table of top 20 solutions by score

### 🔍 **Advanced Filtering**
- **Multi-select filters** for Region, Country, Organization Type, Maturity Stage, and SDG Focus
- **Real-time filtering** with debounced updates for better performance
- **Clear filters** button to reset all selections
- **Export functionality** to download filtered data as CSV

### 📱 **Responsive Design**
- **Mobile-friendly** layout that adapts to different screen sizes
- **Modern UI** with hover effects, smooth transitions, and professional styling
- **Accessibility features** including proper ARIA labels and keyboard navigation

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Local web server (for development)

### Installation
1. Clone or download the repository
2. Ensure all files are in the same directory:
   - `index.html` - Main dashboard interface
   - `app.js` - Application logic and visualization code
   - `iso3-map.js` - Country ISO3 code mappings
   - `data.json` - Your data file (should contain the refined JSON data)

### Running the Dashboard
1. **Option 1: Simple HTTP Server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

2. **Option 2: Live Server (VS Code)**
   - Install the "Live Server" extension
   - Right-click on `index.html` and select "Open with Live Server"

3. **Option 3: Any Web Server**
   - Place files on any web server (Apache, Nginx, etc.)
   - Access via web browser

4. **Open in Browser**
   - Navigate to `http://localhost:8000` (or your server URL)
   - The dashboard will load automatically

## 📁 File Structure

```
├── index.html              # Main HTML dashboard interface
├── app.js                  # Core application logic and visualizations
├── iso3-map.js            # Country ISO3 code mappings
├── data.json              # Your data file (refined JSON format)
├── excel_to_json_refined.py  # Excel to JSON conversion script
├── requirements.txt        # Python dependencies
└── README.md              # This documentation
```

## 🔧 Configuration

### Data Format
The dashboard expects a JSON file (`data.json`) with the following structure:
```json
[
  {
    "ID": "unique_id",
    "Country": "Country Name",
    "Region": "Region Name",
    "Name of your organization": "Organization Name",
    "Title": "Solution Title",
    "Maturity stage": "Concept|Prototype|Piloted|Implemented|Implemented at scale",
    "Total Score": 85.5,
    "SDGs addressed": "SDG 1; SDG 3; SDG 8",
    "Primary thematic focus area": "Theme Name",
    // ... other fields
  }
]
```

### Customization
- **Chart Colors**: Modify `CONFIG.CHART_COLORS` in `app.js`
- **Chart Limits**: Adjust `CONFIG.MAX_TOP_SOLUTIONS` for table display
- **CSV Export**: Customize `CONFIG.CSV_FILENAME` for export naming

## 🎨 Customization Options

### Styling
- **CSS Variables**: Modify colors and spacing in `:root` section
- **Responsive Breakpoints**: Adjust mobile layout in media queries
- **Chart Themes**: Customize Plotly.js chart appearances

### Functionality
- **Additional Filters**: Add new filter types in the `AppState` class
- **New Visualizations**: Create new chart functions in `UIComponents`
- **Data Processing**: Extend `DataProcessor` class for custom calculations

## 🐛 Troubleshooting

### Common Issues

1. **Charts Not Loading**
   - Check browser console for JavaScript errors
   - Ensure `data.json` is accessible and properly formatted
   - Verify Plotly.js library is loading correctly

2. **Map Not Displaying**
   - Check if country names in data match ISO3 mappings
   - Verify `iso3-map.js` is loaded before `app.js`

3. **Performance Issues**
   - Large datasets (>10,000 records) may cause slow rendering
   - Consider implementing data pagination or virtualization
   - Use browser developer tools to profile performance

4. **Export Not Working**
   - Ensure browser allows file downloads
   - Check if data contains special characters that need escaping

### Browser Compatibility
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Internet Explorer**: Not supported

## 🔄 Data Updates

### Adding New Data
1. Update your Excel file with new submissions
2. Run the conversion script:
   ```bash
   python excel_to_json_refined.py
   ```
3. Replace `data.json` with the new output
4. Refresh the dashboard

### Modifying Data Structure
1. Update the `DataProcessor.normalizeRow()` function in `app.js`
2. Adjust filter options and visualization logic as needed
3. Test with sample data before deploying

## 📈 Performance Tips

- **Debounced Filtering**: Filters update after 300ms of inactivity
- **Efficient Rendering**: Charts only re-render when data changes
- **Memory Management**: Large datasets are processed in chunks
- **Lazy Loading**: Consider implementing lazy loading for very large datasets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify data format matches expected structure
4. Create an issue in the repository

---

**Built with ❤️ using HTML5, CSS3, JavaScript (ES6+), and Plotly.js**
