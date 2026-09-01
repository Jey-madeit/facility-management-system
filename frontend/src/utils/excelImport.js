import * as XLSX from 'xlsx';

const normalizeHeader = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

export async function parseExcelFileToRows(file) {
  if (!file) return { rows: [], headers: [] };

  const name = file.name?.toLowerCase?.() || '';
  const isExcel = name.endsWith('.xlsx') || name.endsWith('.xls');
  if (!isExcel) {
    throw new Error('Only Excel files (.xlsx, .xls) are supported.');
  }

  const arrayBuffer = await file.arrayBuffer();
  // Enable cellComments to read comments from cells
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellComments: true });
  if (!Array.isArray(workbook.SheetNames) || workbook.SheetNames.length === 0 ) {
    return { rows: [], headers: [] };
  }

  const firstSheetName = workbook.SheetNames.find((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return false;
    const preview = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
    return Array.isArray(preview) && preview.length > 1;
  }) || workbook.SheetNames[0];

  const worksheet = workbook.Sheets[firstSheetName];
  const sheet = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: false, defval: '' });
  if (!Array.isArray(sheet) || sheet.length < 2) return { rows: [], headers: [] };

  const headerRowIndex = sheet.findIndex(
    (row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
  );
  if (headerRowIndex === -1) return { rows: [], headers: [] };

  const headers = (sheet[headerRowIndex] || []).map(normalizeHeader).filter(Boolean);
  if (headers.length === 0) return { rows: [], headers: [] };

  const rows = sheet
    .slice(headerRowIndex + 1)
    .map((values, rowIndex) => {
      const obj = {};
      const actualRowIndex = headerRowIndex + 1 + rowIndex;
      
      headers.forEach((header, idx) => {
        const value = values?.[idx];
        if (value === undefined || value === null) {
          obj[header] = '';
          return;
        }

        obj[header] = typeof value === 'string' ? value.trim() : value;
      });
      
      // Extract cell comments if they exist
      const comments = [];
      headers.forEach((header, colIdx) => {
        const cellAddress = XLSX.utils.encode_cell({ r: actualRowIndex, c: colIdx });
        const cell = worksheet[cellAddress];
        if (cell?.c) { // cell.c contains comments
          const comment = cell.c.map(c => c.t || c).join('\n');
          if (comment.trim()) {
            comments.push(`${header}: ${comment}`);
          }
        }
      });
      
      // Append comments to the row's comments field
      if (comments.length > 0) {
        const existingComment = obj[headers.find(h => h.toLowerCase().includes('comment'))] || '';
        const allComments = [existingComment, ...comments].filter(c => c).join(' | ');
        const commentHeader = headers.find(h => h.toLowerCase().includes('comment'));
        if (commentHeader) {
          obj[commentHeader] = allComments;
        } else {
          obj['Comments'] = comments.join(' | ');
        }
      }
      
      return obj;
    })
    .filter((row) => Object.values(row).some((v) => String(v).trim() !== ''));

  return { rows, headers };
}

