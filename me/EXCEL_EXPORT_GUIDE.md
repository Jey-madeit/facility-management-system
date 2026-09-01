# EXCEL EXPORT FEATURE DOCUMENTATION

## 📊 Overview

The Facility Management System now includes comprehensive **Excel export functionality** that allows users to export their data to Excel spreadsheets for printing, sharing, and analysis.

## 🎯 Features

### Export Options Available

#### 1. **Test Run Data Export**
- **Endpoint**: `GET /api/testruns/export/excel`
- **Format**: Excel (.xlsx)
- **Filename**: `test-runs.xlsx`
- **Columns**: 
  - ID
  - User
  - Test Name
  - Description
  - Status
  - Result
  - Notes
  - Date
- **Access**: All authenticated users (see own data), Admins (see all data)

#### 2. **Test Run Report Export (Admin Only)**
- **Endpoint**: `GET /api/testruns/export/report`
- **Format**: Excel (.xlsx) with multiple sheets
- **Filename**: `test-runs-report.xlsx`
- **Sheets**:
  - **Summary Sheet**:
    - Total count
    - Status breakdown
    - User breakdown
  - **Detailed Sheet**:
    - Full test run data
- **Access**: Admin only

#### 3. **Booster Pump Data Export**
- **Endpoint**: `GET /api/boosterpumps/export/excel`
- **Format**: Excel (.xlsx)
- **Filename**: `booster-pumps.xlsx`
- **Columns**:
  - ID
  - User
  - Pump Name
  - Location
  - Pressure (bar)
  - Flow (L/min)
  - Temperature (°C)
  - Status
  - Notes
  - Date
- **Access**: All authenticated users (see own data), Admins (see all data)

#### 4. **Daily Inspection Data Export**
- **Endpoint**: `GET /api/dailyinspections/export/excel`
- **Format**: Excel (.xlsx)
- **Filename**: `daily-inspections.xlsx`
- **Columns**:
  - ID
  - User
  - Inspection Date
  - Lighting
  - Cleanliness
  - Safety
  - Ground Floor Condition
  - First Floor Condition
  - Second Floor Condition
  - Status
- **Access**: All authenticated users (see own data), Admins (see all data)

## 🖱️ How to Use

### Using the Web Interface

#### Step 1: Navigate to Data Section
1. Login to the application
2. Click on one of the three main sections:
   - Generate Test Run
   - Booster Pumps
   - Daily Inspection

#### Step 2: Find Export Button
Look for the **"📊 Export to Excel"** button
- Located next to "Add New" button (or similar)
- Only appears when data exists
- Blue/teal colored button

#### Step 3: Click Export
- Single click downloads the file
- File automatically saves to your Downloads folder
- Filename indicates data type

#### Step 4: Open in Excel
- Open the downloaded file in Microsoft Excel
- All data is formatted and ready to print
- Columns are auto-sized for readability

### Admin-Only Features

**Test Run Report Export:**
1. Login as admin
2. Go to Generate Test Run section
3. Click "Generate Report" first
4. Click "📋 Export Report" button
5. Receives multi-sheet report with summary

## 📋 Excel File Formats

### Sheet Design

All exported Excel files include:
- **Column Headers**: Clearly labeled
- **Data Rows**: All records visible
- **Formatting**: Professional appearance
- **Auto-fit Columns**: Readable content

#### Test Run Export Example
```
ID | User | Test Name | Description | Status | Result | Notes | Date
---|------|-----------|-------------|--------|--------|-------|------
... | john | API Test  | Testing API | passed | Success| None  | 1/15/24
```

#### Report Export - Multiple Sheets
```
Sheet 1 - Summary:
  Total Test Runs: 15
  
  Status Breakdown:
  - Pending: 5
  - Completed: 8
  - Failed: 2
  
  User Breakdown:
  - john: 7 tests
  - jane: 8 tests

Sheet 2 - Detailed:
  Full data table with all tests
```

## 🔐 Security & Permissions

### Data Access Rules

| User Type | Can Export | Can See |
|-----------|-----------|---------|
| Regular User | ✅ Yes | Own data only |
| Admin | ✅ Yes | All users' data |

### Authentication
- All export endpoints require valid JWT token
- Token included automatically via interceptor
- Unauthorized requests return 401

## 🛠️ Technical Implementation

### Backend (Node.js)

**Library Used**: `xlsx` (npm package)

**Export Utility** (`backend/utils/excelExport.js`):
```javascript
exports.exportTestRunsToExcel = (testRuns) => {
  // Converts array of records to Excel buffer
  // Returns binary file data ready for download
};
```

**Controller Implementation**:
```javascript
exports.exportToExcel = async (req, res) => {
  // Fetch data based on user role
  // Generate Excel buffer
  // Set HTTP headers for download
  // Send file as response
};
```

**HTTP Headers**:
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename=test-runs.xlsx
```

### Frontend (React)

**API Service** (`frontend/src/services/apiService.js`):
```javascript
exportToExcel: async () => {
  const response = await apiClient.get('/testruns/export/excel', {
    responseType: 'blob'
  });
  
  // Create download link
  // Trigger browser download
  // Clean up resources
};
```

**Usage in Components**:
```javascript
<button onClick={() => testRunService.exportToExcel()}>
  📊 Export to Excel
</button>
```

## 📥 Download & File Management

### Browser Download

When you click "Export to Excel":
1. Browser makes API request
2. Backend generates Excel file
3. File streams to browser
4. Browser's download manager receives file
5. File saves to default Downloads folder

### Default Filenames

Each export creates a file with descriptive name:
- `test-runs.xlsx` → Test run data
- `test-runs-report.xlsx` → Admin test run report
- `booster-pumps.xlsx` → Pump monitoring data
- `daily-inspections.xlsx` → Inspection records

### File Size

Typical file sizes:
- Small dataset (< 100 records): 50-100 KB
- Medium dataset (100-1000 records): 200-500 KB
- Large dataset (> 1000 records): 500 KB - 2 MB

## 🖨️ Printing Guide

### From Excel

1. **Open the downloaded file in Excel**
2. **Prepare for printing**:
   - Go to: File → Print
   - Select: Print Layout
   - Choose: Landscape (for wide data)
3. **Format options**:
   - Fit to one page width
   - Print gridlines for clarity
   - Include header rows on each page
4. **Print**:
   - Select printer
   - Click "Print"

### From Browser (Without Excel)

If Excel not installed:
1. Right-click downloaded .xlsx file
2. Select "Open with"
3. Choose Google Sheets / LibreOffice
4. File → Print
5. Configure print settings
6. Print

### Print Formatting Tips

- **Landscape orientation**: Better for wide data tables
- **Fit to page**: Reduces column width for single-page printing
- **Grid lines**: Enable to show cell borders
- **Header repetition**: Repeats headers on each page for multi-page prints

## 📊 Use Cases

### For Regular Users

**Scenario 1: Backup Personal Data**
```
Action: Export all test runs
Result: Safe backup copy maintained locally
Format: Excel for easy storage
```

**Scenario 2: Create Report for Manager**
```
Action: Export pump data
Result: Professional-looking report
Use: Present to supervisor
```

**Scenario 3: Data Analysis**
```
Action: Export inspection data
Result: Use Excel formulas for analysis
Create: Charts and pivot tables
```

### For Administrators

**Scenario 1: Comprehensive Audit**
```
Action: Export all data (all users)
Result: Full system snapshot
Purpose: Compliance & documentation
```

**Scenario 2: Generate Official Report**
```
Action: Export test run report
Result: Multi-sheet summary report
Use: Executive presentation
```

**Scenario 3: Data Migration**
```
Action: Export all collections
Result: Complete system backup
Use: Move to new system/database
```

## 🔄 API Endpoints Reference

### Detailed Endpoint Information

#### Test Run Export
```
GET /api/testruns/export/excel
Authorization: Bearer {JWT_TOKEN}

Response:
- Status: 200
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Body: Binary Excel file
```

#### Test Run Report Export (Admin)
```
GET /api/testruns/export/report
Authorization: Bearer {ADMIN_JWT_TOKEN}

Response:
- Status: 200
- 2 sheets: Summary, Detailed
- Body: Binary Excel file
```

#### Booster Pump Export
```
GET /api/boosterpumps/export/excel
Authorization: Bearer {JWT_TOKEN}

Response:
- Status: 200
- All pump data
- Body: Binary Excel file
```

#### Daily Inspection Export
```
GET /api/dailyinspections/export/excel
Authorization: Bearer {JWT_TOKEN}

Response:
- Status: 200
- All inspection data
- Body: Binary Excel file
```

## 🐛 Troubleshooting

### Issue: Export Button Not Appearing
**Solution**: 
- Ensure you have data to export
- Button only shows when records exist
- Refresh page if needed

### Issue: File Won't Download
**Solution**:
- Check internet connection
- Verify JWT token is valid
- Clear browser cache
- Try different browser
- Check browser download settings

### Issue: File Opens with Error
**Solution**:
- File is corrupted: Try export again
- Excel version incompatible: Use newer version
- Try opening in Google Sheets first
- Check file isn't corrupted: Delete and re-download

### Issue: Data Missing from Export
**Solution**:
- Check user role permissions
- Regular users see only own data
- Admins see all data
- Filter settings may hide records
- Refresh data before export

### Issue: Excel File Unreadable
**Solution**:
- File format correct (.xlsx)
- Binary data corruption: Download again
- Try LibreOffice / Google Sheets
- Restore from backup if needed

## 💾 Installation Requirements

### Backend
**Already installed** in package.json:
```json
"xlsx": "^0.18.5"
```

If needed to reinstall:
```bash
npm install xlsx --save
```

### Frontend
No additional installation needed - uses native browser APIs for file downloads

## 📈 Future Enhancements

Planned features for Excel export:
- [ ] Custom column selection
- [ ] Data filtering before export
- [ ] Scheduled automated exports
- [ ] Email export delivery
- [ ] CSV format option
- [ ] PDF export option
- [ ] Pivot table generation
- [ ] Charts and visualizations

## 📞 Support

### Common Questions

**Q: Can I edit the exported file?**
A: Yes! Download the .xlsx file and edit it in Excel, Google Sheets, or any spreadsheet application.

**Q: Is my data secure when exporting?**
A: Yes. Export only sends to your own browser's download folder. No external uploads.

**Q: Can I schedule automatic exports?**
A: Not yet. Manual export available now. Automation coming in future version.

**Q: What Excel versions support this?**
A: Excel 2007 and newer (.xlsx format). Also works with Google Sheets, LibreOffice, etc.

**Q: Can I export to CSV instead?**
A: Currently .xlsx only. CSV option coming in next update.

---

## 📋 Quick Reference

| Action | Button | File | Access |
|--------|--------|------|--------|
| Export Test Runs | 📊 Export to Excel | test-runs.xlsx | All users |
| Export Report | 📋 Export Report | test-runs-report.xlsx | Admin only |
| Export Pumps | 📊 Export to Excel | booster-pumps.xlsx | All users |
| Export Inspections | 📊 Export to Excel | daily-inspections.xlsx | All users |

---

**Version**: 1.0.0  
**Last Updated**: April 2, 2026  
**Feature Status**: ✅ Ready for Production
