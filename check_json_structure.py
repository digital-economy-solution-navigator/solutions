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
        
        return data
        
    except Exception as e:
        print(f"Error reading {filename}: {str(e)}")
        return None

if __name__ == "__main__":
    # Check both JSON files
    original_data = check_json_structure("Further analysis.json")
    refined_data = check_json_structure("Further analysis_refined.json")
    
    print("\n=== COMPARISON ===")
    if original_data and refined_data:
        if isinstance(original_data, dict) and isinstance(refined_data, list):
            print("✅ SUCCESS: Original has sheet wrapper, refined is direct array")
            print(f"   Original: {len(original_data)} sheets")
            print(f"   Refined: {len(refined_data)} records directly")
        else:
            print("❌ Structure mismatch")
    else:
        print("❌ Could not read one or both files")
