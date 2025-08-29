import json
import re

def fix_json_complete(input_file, output_file=None):
    """
    Completely fix JSON file by replacing all NaN values and invalid characters.
    
    Args:
        input_file (str): Path to the input JSON file
        output_file (str): Path for the output fixed JSON file (optional)
    """
    try:
        print(f"Reading {input_file}...")
        
        # Read the JSON file as text first
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"File size: {len(content)} characters")
        
        # Count initial NaN occurrences
        initial_nan_count = content.count('NaN')
        print(f"Found {initial_nan_count} NaN values")
        
        # Comprehensive cleaning - replace all forms of NaN with null
        # This handles various patterns that might appear in the JSON
        
        # Pattern 1: "field": NaN
        content = re.sub(r':\s*NaN\s*([,}])', r': null\1', content)
        
        # Pattern 2: "field": "NaN"
        content = re.sub(r':\s*"NaN"\s*([,}])', r': null\1', content)
        
        # Pattern 3: "field": 'NaN'
        content = re.sub(r':\s*\'NaN\'\s*([,}])', r': null\1', content)
        
        # Pattern 4: "field": NaN, (with comma)
        content = re.sub(r':\s*NaN\s*,', r': null,', content)
        
        # Pattern 5: "field": NaN} (with closing brace)
        content = re.sub(r':\s*NaN\s*}', r': null}', content)
        
        # Pattern 6: "field": NaN\n (with newline)
        content = re.sub(r':\s*NaN\s*\n', r': null\n', content)
        
        # Pattern 7: "field": NaN\r (with carriage return)
        content = re.sub(r':\s*NaN\s*\r', r': null\r', content)
        
        # Also handle undefined values
        content = re.sub(r':\s*undefined\s*([,}])', r': null\1', content)
        content = re.sub(r':\s*"undefined"\s*([,}])', r': null\1', content)
        
        # Handle any remaining NaN that might be in different contexts
        content = re.sub(r'NaN', 'null', content)
        
        # Count remaining NaN occurrences
        remaining_nan_count = content.count('NaN')
        print(f"After cleaning: {remaining_nan_count} NaN values remain")
        
        # Try to parse the cleaned content
        try:
            data = json.loads(content)
            print(f"✅ Successfully parsed cleaned JSON")
            print(f"   Records: {len(data)}")
            
        except json.JSONDecodeError as e:
            print(f"❌ Still has JSON errors: {e}")
            print("Attempting manual inspection and cleaning...")
            
            # Find the problematic line
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if 'NaN' in line:
                    print(f"Line {i+1}: {line.strip()}")
            
            # Try more aggressive cleaning
            content = re.sub(r'[^"]*NaN[^"]*', 'null', content)
            
            try:
                data = json.loads(content)
                print(f"✅ Successfully parsed after aggressive cleaning")
            except json.JSONDecodeError as e2:
                print(f"❌ Still failing: {e2}")
                return None
        
        # If no output file specified, create one
        if output_file is None:
            output_file = input_file.replace('.json', '_fixed.json')
        
        # Write the cleaned JSON with proper formatting
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"✅ Successfully saved fixed JSON to {output_file}")
        
        # Verify the output file can be parsed
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                verification_data = json.load(f)
            print(f"✅ Verification: Output file contains {len(verification_data)} valid records")
            return data
        except Exception as verify_error:
            print(f"❌ Verification failed: {verify_error}")
            return None
        
    except Exception as e:
        print(f"❌ Error fixing JSON: {str(e)}")
        return None

if __name__ == "__main__":
    # Fix the data.json file
    input_file = "data.json"
    result = fix_json_complete(input_file)
    
    if result:
        print("\n🎉 JSON file has been completely fixed!")
        print(f"Original file: {input_file}")
        print(f"Fixed file: {input_file.replace('.json', '_fixed.json')}")
        print("\nNext steps:")
        print("1. Replace the original data.json with the fixed version")
        print("2. Refresh your dashboard")
    else:
        print("\n❌ Failed to fix JSON file completely")
        print("Please check the file manually for syntax errors")
