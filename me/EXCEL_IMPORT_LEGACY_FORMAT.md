# Excel Import - Legacy Format Support

## Overview
The Daily Inspection module now supports importing Excel files in the legacy **horizontal format** (dates as columns, inspection items as rows), in addition to the standard vertical format with dot-notation headers.

## What Changed

### New Files Created
- **`frontend/src/utils/excelImportLegacy.js`** - Handles parsing and transformation of legacy horizontal Excel format

### Modified Files
- **`frontend/src/pages/DailyInspection.js`** - Updated to detect and handle both legacy and standard formats

## Supported Excel Formats

### Format 1: Legacy Horizontal Format (Your Current File)
**Structure:**
```
Row 1:  Date:           | 5-Jan  | 6-Jan  | 7-Jan  | ...
Row 2:  ITEM            | COMMENTS | COMMENTS | COMMENTS | ...
Row 3:  Cummins Generator Availability | Yes | Yes | Yes | ...
Row 4:  CAT Generator Availability | Yes | Yes | Yes | ...
...
Row 45: Ground Floor Reports: | [section header - skipped]
Row 46: Lighting | Ok | Ok | Ok | ...
...
```

**Format Details:**
- **Row 1:** Contains "Date:" label and Excel date numbers
- **Row 2:** Contains column headers (typically "ITEM" and "COMMENTS/OBSERVATIONS")
- **Rows 3+:** Items in column A, with data values in columns B onwards (one per date)
- **Section Headers:** "Ground Floor Reports:", "First Floor Reports:", "Second Floor Reports:" indicate context for ambiguous field names

### Format 2: Standard Vertical Format
**Structure:**
```
externalAssets.cumminsGeneratorAvailability | externalAssets.catGeneratorAvailability | ... | groundFloor.lighting | ...
Yes | Yes | ... | Ok | ...
```

**Format Details:**
- Headers use dot-notation: `section.fieldName`
- Each row represents one inspection
- Can also use JSON format in columns: `externalAssets`, `groundFloor`, `firstFloor`, `secondFloor`

## How It Works

### Legacy Format Detection
When you upload an Excel file, the system automatically:

1. **Detects format** by checking:
   - First row starts with "Date:" and contains numbers (Excel serial dates)
   - Second row contains "ITEM"
   - Pattern matches known legacy structure

2. **Extracts dates** from the first row using Excel date conversion

3. **Maps items to fields** using section context:
   - Identifies section headers to track context
   - Uses context-aware mapping for ambiguous field names (e.g., "Lighting" → different section for Ground Floor vs First Floor)
   - Transforms multi-line values (e.g., water tank levels)

4. **Converts to standard format** internally:
   - Creates one inspection object per date
   - Populates nested structure: `externalAssets`, `groundFloor`, `firstFloor`, `secondFloor`
   - Ready for preview and import

### Field Mapping

The legacy format mapper includes these mapped fields:

**External Assets Section:**
- Cummins/CAT Generator Availability, Running Hours, Remaining Hours
- Fuel levels, Radiator/Air Filter/Oil/Coolant conditions
- Battery voltage, Pending alarms, Drive belt damage
- Electrical connections, Unusual noise, Frequencies
- Water tank levels, Pump pressures
- Security Post, Driver's Room, Compound observations

**Ground Floor Section:**
- Lighting, Air Condition, Plumbing, Glazing
- Workstation/Office cleaning conditions
- Washrooms, Cafeteria
- General observations

**First Floor Section:**
- Lighting, Air Condition, Glazing
- Training Room, Emergency Command Centre
- Workstation/Office cleaning conditions
- Washrooms
- General observations

**Second Floor Section:**
- Lighting, Air Condition, Glazing
- Board Room, SMT Offices
- Various office and common areas
- Supervisor comments

## Using Your Excel File

### Step 1: Upload the File
1. Go to Daily Inspection page
2. Click "Import from Excel"
3. Select your `Accra HQ Daily Inspection Report  Updated_ JANUARY - MARCH 2026 (1).xlsx` file

### Step 2: Review Preview
The system will:
- Automatically detect the legacy format
- Extract all 60 dates from your file
- Parse all inspection items from each date
- Display a preview of the converted data

### Step 3: Confirm Import
- Review the preview
- Click "Confirm Import" to add all inspections to the database
- Each date becomes a separate inspection record

## Troubleshooting

### "Excel columns do not match the daily inspection format"
**Cause:** File is not recognized as legacy format and doesn't have dot-notation headers

**Solution:**
- Verify the file has "Date:" in first row with date values
- Ensure "ITEM" header is in second row
- Check that inspection items match expected names (see mapping above)

### Dates not parsed correctly
**Cause:** Excel file uses different date format

**Solution:**
- Ensure dates are stored as Excel date numbers (not text)
- If manual date entry was used, convert to proper Excel date format

### Some fields appear blank after import
**Cause:** Field name in Excel doesn't exactly match the mapping

**Solution:**
- Check spelling and spacing of field names in Excel
- Refer to the mapping list above for correct names
- Note: Some variations like "CAT Radiator  tank condition" (with 2 spaces) are handled

## Technical Details

### Section Detection Algorithm
```javascript
- If item name contains "Ground Floor" → activeSection = 'groundFloor'
- If item name contains "First Floor" → activeSection = 'firstFloor'
- If item name contains "Second Floor" → activeSection = 'secondFloor'
```

### Field Path Resolution
1. Check section-specific mapping first (handles ambiguous names)
2. Fall back to global mapping for unique field names
3. Return null for section headers (skipped)

### Date Conversion
Excel stores dates as serial numbers (days since 1900-01-01):
```javascript
jsDate = new Date((excelDate - 25569) * 86400 * 1000)
```

## File Structure

```
frontend/src/utils/
├── excelImport.js          (Original - handles standard format)
└── excelImportLegacy.js    (New - handles legacy format)

frontend/src/pages/
└── DailyInspection.js      (Updated - detects format and routes to correct parser)
```

## Notes

- The legacy format parser creates complete inspection objects ready for database storage
- All transformations happen client-side (in the browser) for better performance
- The system preserves the exact values from your Excel file
- Empty cells are stored as empty strings (required fields will still need values)
- The import preview shows all the data that will be imported before confirmation
