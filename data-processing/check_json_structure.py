import json

def check_json_structure(filename):
    """Check the structure of a JSON file."""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print(f"\n=== {filename} ===")
        print(f"Data type: {type(data)}")
        
        if isinstance(data, dict):
            print(f"Number of keys: {len(data)}")
            print(f"Keys: {list(data.keys())}")
            if data:
                first_key = list(data.keys())[0]
                first_value = data[first_key]
                print(f"First key '{first_key}' contains: {type(first_value)} with {len(first_value)} items")
                if first_value and isinstance(first_value, list):
                    print(f"First item keys: {list(first_value[0].keys()) if first_value else 'No items'}")
        elif isinstance(data, list):
            print(f"Number of records: {len(data)}")
            if data:
                print(f"First record keys: {list(data[0].keys()) if data else 'No data'}")
                
                # Additional analysis for dashboard data
                if filename == "data.json" and data:
                    # Check for common dashboard fields
                    sample_record = data[0]
                    dashboard_fields = {
                        'Country': 'Country name for map visualization',
                        'Region': 'Region for filtering',
                        'Title': 'Solution title',
                        'Total Score': 'Numeric score for rating',
                        'SDGs addressed': 'SDG list for treemap',
                        'Maturity stage': 'Maturity level for filtering',
                        'Please specify the type of organization you are representing.': 'Organization type'
                    }
                    
                    print(f"\n📋 Dashboard Field Analysis:")
                    for field, description in dashboard_fields.items():
                        if field in sample_record:
                            value = sample_record[field]
                            print(f"   ✅ {field}: {type(value).__name__} - {description}")
                        else:
                            print(f"   ❌ {field}: Missing - {description}")
        
        return data
        
    except Exception as e:
        print(f"Error reading {filename}: {str(e)}")
        return None

if __name__ == "__main__":
    print("🔍 UNGA Dashboard Data Structure Analysis")
    print("=" * 50)
    
    # Check main data file
    main_data = check_json_structure("data.json")
    
    # Check country mapping file
    mapping_data = check_json_structure("country_region_mapping.json")
    
    print("\n=== DASHBOARD DATA ANALYSIS ===")
    if main_data and mapping_data:
        print("✅ Both data files loaded successfully")
        
        # Analyze main data structure
        if isinstance(main_data, list) and main_data:
            print(f"\n📊 Main Data Analysis:")
            print(f"   Total submissions: {len(main_data)}")
            
            # Check for required fields
            first_record = main_data[0]
            required_fields = ['Country', 'Region', 'Title', 'Total Score', 'SDGs addressed']
            missing_fields = [field for field in required_fields if field not in first_record]
            
            if missing_fields:
                print(f"   ⚠️  Missing required fields: {missing_fields}")
            else:
                print(f"   ✅ All required fields present")
            
            # Sample data preview
            print(f"   📋 Sample record fields: {list(first_record.keys())[:10]}...")
            
        # Analyze mapping data structure
        if isinstance(mapping_data, dict):
            print(f"\n🗺️  Country Mapping Analysis:")
            print(f"   Mapping keys: {list(mapping_data.keys())}")
            if 'region_to_countries' in mapping_data:
                print(f"   Regions: {len(mapping_data['region_to_countries'])}")
            if 'country_to_region' in mapping_data:
                print(f"   Countries: {len(mapping_data['country_to_region'])}")
        
        print(f"\n🎯 Dashboard Status: Ready to load!")
        
    else:
        print("❌ Could not read one or both files")
        print("   Make sure data.json and country_region_mapping.json exist")
        print("   Run excel_to_json_refined.py if you need to convert Excel data")
