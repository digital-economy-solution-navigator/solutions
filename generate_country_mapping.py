#!/usr/bin/env python3
"""
Generate country_region_mapping.json from data.json
This script analyzes the data.json file and creates a mapping between countries and regions.
"""

import json
from collections import defaultdict

def generate_country_mapping(data_file='data.json', output_file='country_region_mapping.json'):
    """
    Generate country-region mapping from the main data file.
    
    Args:
        data_file (str): Path to the main data JSON file
        output_file (str): Path to output the country-region mapping JSON file
    """
    print(f"🔄 Loading data from {data_file}...")
    
    try:
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            raise ValueError("Data must be a list of records")
        
        print(f"✅ Loaded {len(data)} records")
        
        # Extract unique country-region pairs
        country_region_pairs = set()
        country_to_region = {}
        region_to_countries = defaultdict(set)
        
        for record in data:
            country = record.get('Country', '').strip()
            region = record.get('Region', '').strip()
            
            if country and region:
                country_region_pairs.add((country, region))
                country_to_region[country] = region
                region_to_countries[region].add(country)
        
        # Convert sets to sorted lists for consistent output
        region_to_countries = {
            region: sorted(list(countries)) 
            for region, countries in region_to_countries.items()
        }
        
        # Create the mapping structure
        mapping = {
            "region_to_countries": region_to_countries,
            "country_to_region": country_to_region
        }
        
        # Write to output file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(mapping, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Generated {output_file}")
        print(f"📊 Summary:")
        print(f"   - Unique countries: {len(country_to_region)}")
        print(f"   - Unique regions: {len(region_to_countries)}")
        print(f"   - Country-region pairs: {len(country_region_pairs)}")
        
        # Show region breakdown
        print(f"\n🗺️  Region breakdown:")
        for region, countries in sorted(region_to_countries.items()):
            print(f"   {region}: {len(countries)} countries")
        
        return mapping
        
    except FileNotFoundError:
        print(f"❌ Error: {data_file} not found")
        return None
    except json.JSONDecodeError as e:
        print(f"❌ Error: Invalid JSON in {data_file}: {e}")
        return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def validate_mapping(mapping_file='country_region_mapping.json'):
    """
    Validate the generated mapping file.
    
    Args:
        mapping_file (str): Path to the mapping file to validate
    """
    print(f"\n🔍 Validating {mapping_file}...")
    
    try:
        with open(mapping_file, 'r', encoding='utf-8') as f:
            mapping = json.load(f)
        
        # Check structure
        if 'region_to_countries' not in mapping:
            print("❌ Missing 'region_to_countries' key")
            return False
        
        if 'country_to_region' not in mapping:
            print("❌ Missing 'country_to_region' key")
            return False
        
        region_to_countries = mapping['region_to_countries']
        country_to_region = mapping['country_to_region']
        
        # Validate consistency
        all_countries_in_regions = set()
        for countries in region_to_countries.values():
            all_countries_in_regions.update(countries)
        
        all_countries_in_mapping = set(country_to_region.keys())
        
        if all_countries_in_regions != all_countries_in_mapping:
            missing_in_regions = all_countries_in_mapping - all_countries_in_regions
            missing_in_mapping = all_countries_in_regions - all_countries_in_mapping
            
            if missing_in_regions:
                print(f"⚠️  Countries in mapping but not in regions: {missing_in_regions}")
            if missing_in_mapping:
                print(f"⚠️  Countries in regions but not in mapping: {missing_in_mapping}")
        else:
            print("✅ Country-region mapping is consistent")
        
        print(f"✅ Validation complete")
        return True
        
    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False

if __name__ == "__main__":
    print("🌍 Country-Region Mapping Generator")
    print("=" * 40)
    
    # Generate the mapping
    mapping = generate_country_mapping()
    
    if mapping:
        # Validate the generated mapping
        validate_mapping()
        print(f"\n🎯 Ready! Your dashboard can now use the updated country-region mapping.")
    else:
        print(f"\n❌ Failed to generate mapping. Please check your data.json file.")
