import pandas as pd
import json
import sys

def excel_to_json_refined(excel_file, output_file=None):
    """
    Convert Excel file to JSON format with refined structure for single sheets.
    
    Args:
        excel_file (str): Path to the Excel file
        output_file (str): Path for the output JSON file (optional)
    """
    try:
        # Column mapping for cleaner names
        column_mapping = {
            'Please indicate the maturity stage of your solution.': 'Maturity stage',
            'If the solution has already been implemented, please specify the location(s). Alternatively, please enter "not applicable".': 'Implementation location(s)',
            'If the solution has already been implemented, please specify the related timeline(s). Alternatively, please enter "not applicable".': 'Implementation timeline(s)',
            'What is the estimated duration to pilot your solution in a new geography?': 'Duration to pilot in a new geography',
            'Which SDGs are addressed by your solution?': 'SDGs addressed',
            'What is the desired impact of your solution?': 'Desired impact',
            'What are the key technology(ies) used for your solution?': 'Key technologies',
            'What are the unique/differentiated characteristics of your solution?': 'Unique Characteristics',
            'How does your solution contribute to create sustainable, systemic change? ': 'Sustainable Change'
        }
        
        # Read all sheets from the Excel file
        excel_data = pd.read_excel(excel_file, sheet_name=None)
        
        # If only one sheet, output the data directly without sheet wrapper
        if len(excel_data) == 1:
            sheet_name = list(excel_data.keys())[0]
            df = excel_data[sheet_name]
            
            # Rename columns using the mapping
            df = df.rename(columns=column_mapping)
            
            # Convert DataFrame to records (list of dictionaries)
            json_data = df.to_dict('records')
            
            print(f"Found single sheet '{sheet_name}' with {len(df)} rows and {len(df.columns)} columns")
            print("Outputting data directly without sheet wrapper for cleaner JSON structure")
            print("Applied column mapping for cleaner names")
        else:
            # Multiple sheets - keep the original structure
            json_data = {}
            for sheet_name, df in excel_data.items():
                # Rename columns using the mapping
                df = df.rename(columns=column_mapping)
                json_data[sheet_name] = df.to_dict('records')
            
            print(f"Found {len(excel_data)} sheets:")
            for sheet_name, df in excel_data.items():
                print(f"  - {sheet_name}: {len(df)} rows, {len(df.columns)} columns")
        
        # If no output file specified, create one based on input filename
        if output_file is None:
            output_file = excel_file.replace('.xlsx', '_refined.json')
        
        # Write to JSON file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"Successfully converted {excel_file} to {output_file}")
        return json_data
        
    except Exception as e:
        print(f"Error converting Excel file: {str(e)}")
        return None

if __name__ == "__main__":
    # Convert the specific Excel file
    excel_file = "Further analysis.xlsx"
    result = excel_to_json_refined(excel_file)
    
    if result:
        print("\nConversion completed successfully!")
        print(f"Output saved to: {excel_file.replace('.xlsx', '_refined.json')}")
    else:
        print("Conversion failed!")
