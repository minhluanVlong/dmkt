import * as XLSX from 'xlsx';
import { FileData, ParsedRow } from '../types';

export function parseExcelBuffer(
  buffer: ArrayBuffer,
  fileName: string,
  fileSize: number,
  sheetName?: string,
  customHeaderIndex?: number,
  customCodeCol?: string,
  customNameCol?: string
): FileData {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetNames = workbook.SheetNames;
  const activeSheetName = sheetName && sheetNames.includes(sheetName) ? sheetName : sheetNames[0];
  const worksheet = workbook.Sheets[activeSheetName];

  // Convert to array of arrays
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    return {
      fileName,
      fileSize,
      sheetNames,
      selectedSheet: activeSheetName,
      headerRowIndex: 0,
      availableColumns: [],
      codeColumn: '',
      nameColumn: '',
      rawRows: [],
      parsedRows: [],
    };
  }

  // Determine header row index
  let headerRowIndex = customHeaderIndex ?? detectHeaderRow(rawRows);
  if (headerRowIndex < 0 || headerRowIndex >= rawRows.length) {
    headerRowIndex = 0;
  }

  const rawHeaders = rawRows[headerRowIndex] || [];
  const availableColumns: string[] = [];

  rawHeaders.forEach((col, idx) => {
    let colName = String(col ?? '').trim();
    if (!colName) {
      colName = `Cột ${idx + 1}`;
    }
    // ensure unique header names
    let uniqueCol = colName;
    let counter = 1;
    while (availableColumns.includes(uniqueCol)) {
      uniqueCol = `${colName} (${counter++})`;
    }
    availableColumns.push(uniqueCol);
  });

  // Auto-detect Code and Name column if not explicitly provided
  const detectedCode = customCodeCol && availableColumns.includes(customCodeCol)
    ? customCodeCol
    : detectCodeColumn(availableColumns);

  const detectedName = customNameCol && availableColumns.includes(customNameCol)
    ? customNameCol
    : detectNameColumn(availableColumns, detectedCode);

  const detectedGroup = detectGroupColumn(availableColumns);
  const detectedUnit = detectUnitColumn(availableColumns);
  const detectedPrice = detectPriceColumn(availableColumns);

  // Parse rows
  const parsedRows: ParsedRow[] = [];
  const codeColIdx = availableColumns.indexOf(detectedCode);
  const nameColIdx = availableColumns.indexOf(detectedName);
  const groupColIdx = detectedGroup ? availableColumns.indexOf(detectedGroup) : -1;
  const unitColIdx = detectedUnit ? availableColumns.indexOf(detectedUnit) : -1;
  const priceColIdx = detectedPrice ? availableColumns.indexOf(detectedPrice) : -1;

  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const rowObj: Record<string, any> = {};
    availableColumns.forEach((col, cIdx) => {
      rowObj[col] = row[cIdx] !== undefined ? String(row[cIdx]).trim() : '';
    });

    const codeVal = codeColIdx >= 0 && row[codeColIdx] !== undefined ? String(row[codeColIdx]).trim() : '';
    const nameVal = nameColIdx >= 0 && row[nameColIdx] !== undefined ? String(row[nameColIdx]).trim() : '';

    // Only skip if both code and name are completely blank
    if (!codeVal && !nameVal) continue;

    parsedRows.push({
      rowNumber: i + 1, // 1-based original Excel row
      code: codeVal,
      name: nameVal,
      group: groupColIdx >= 0 && row[groupColIdx] !== undefined ? String(row[groupColIdx]).trim() : undefined,
      unit: unitColIdx >= 0 && row[unitColIdx] !== undefined ? String(row[unitColIdx]).trim() : undefined,
      price: priceColIdx >= 0 && row[priceColIdx] !== undefined ? String(row[priceColIdx]).trim() : undefined,
      fullData: rowObj,
    });
  }

  return {
    fileName,
    fileSize,
    sheetNames,
    selectedSheet: activeSheetName,
    headerRowIndex,
    availableColumns,
    codeColumn: detectedCode,
    nameColumn: detectedName,
    groupColumn: detectedGroup,
    unitColumn: detectedUnit,
    priceColumn: detectedPrice,
    rawRows,
    parsedRows,
  };
}

/**
 * Heuristics to find the true header row in Vietnamese technical/medical tables
 */
function detectHeaderRow(rows: any[][]): number {
  let maxScore = -1;
  let bestRowIdx = 0;

  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const row = rows[i];
    if (!row || !Array.isArray(row)) continue;

    let score = 0;
    const nonEmptyCells = row.filter((c) => c !== null && c !== undefined && String(c).trim().length > 0);
    
    // Header rows usually have multiple text columns
    score += nonEmptyCells.length * 2;

    const rowText = row.map((c) => String(c || '').toLowerCase()).join(' ');

    if (/mã|ma|code|kỹ thuật|dvkt|dịch vụ|stt/i.test(rowText)) score += 10;
    if (/tên|ten|quy trình|danh mục|nội dung/i.test(rowText)) score += 10;
    if (/đơn vị|gia|giá|ghi chú|nhóm|khoa|loại/i.test(rowText)) score += 5;

    // Check if cells look like metadata titles (e.g. "BỘ Y TẾ", "DANH MỤC...") that span only 1 cell
    if (nonEmptyCells.length <= 2 && /bộ y tế|sở y tế|bệnh viện|trung tâm y tế|báo cáo|danh mục kỹ thuật/i.test(rowText)) {
      score -= 8;
    }

    if (score > maxScore) {
      maxScore = score;
      bestRowIdx = i;
    }
  }

  return bestRowIdx;
}

function detectCodeColumn(columns: string[]): string {
  const codeKeywords = [
    /mã kỹ thuật/i,
    /mã dvkt/i,
    /mã dịch vụ/i,
    /mã tương đương/i,
    /mã danh mục/i,
    /mã số/i,
    /^mã$/i,
    /code/i,
    /ký hiệu/i,
    /ma_dvkt/i,
    /madvkt/i,
  ];

  for (const regex of codeKeywords) {
    const found = columns.find((c) => regex.test(c));
    if (found) return found;
  }

  // Fallback: any column with "mã"
  const anyMa = columns.find((c) => /mã/i.test(c) && !/tên/i.test(c));
  if (anyMa) return anyMa;

  // If first column is not STT, might be code
  const firstNonStt = columns.find((c) => !/^stt$/i.test(c.trim()));
  return firstNonStt || columns[0] || '';
}

function detectNameColumn(columns: string[], codeCol: string): string {
  const nameKeywords = [
    /tên danh mục kỹ thuật/i,
    /tên dịch vụ kỹ thuật/i,
    /tên danh mục/i,
    /tên dvkt/i,
    /tên dịch vụ/i,
    /tên kỹ thuật/i,
    /tên quy trình/i,
    /^tên$/i,
    /nội dung kỹ thuật/i,
    /danh mục kỹ thuật/i,
    /service_name/i,
    /name/i,
  ];

  for (const regex of nameKeywords) {
    const found = columns.find((c) => regex.test(c) && c !== codeCol);
    if (found) return found;
  }

  // Fallback: any column with "tên"
  const anyTen = columns.find((c) => /tên/i.test(c) && c !== codeCol);
  if (anyTen) return anyTen;

  // Next column after code
  const codeIdx = columns.indexOf(codeCol);
  if (codeIdx >= 0 && codeIdx + 1 < columns.length) {
    return columns[codeIdx + 1];
  }

  return columns[1] || columns[0] || '';
}

function detectGroupColumn(columns: string[]): string | undefined {
  return columns.find((c) => /khoa|phòng|chuyên khoa|nhóm|phân loại|loại kỹ thuật/i.test(c));
}

function detectUnitColumn(columns: string[]): string | undefined {
  return columns.find((c) => /đơn vị|dvt|đvt|unit/i.test(c));
}

function detectPriceColumn(columns: string[]): string | undefined {
  return columns.find((c) => /giá|đơn giá|price|chi phí/i.test(c));
}

/**
 * Generate Sample Realistic Data for 1-click testing
 * Simulates 2 Technical Service Catalogs (Danh mục kỹ thuật)
 * with overlapping, mismatched names, mismatched codes, and unique items
 */
export function generateSampleData(): { file1: FileData; file2: FileData } {
  const catalog1 = [
    ['BỘ Y TẾ', '', '', '', ''],
    ['BỆNH VIỆN ĐA KHOA TỈNH', '', '', '', ''],
    ['DANH MỤC KỸ THUẬT PHÊ DUYỆT - NĂM 2024 (FILE 1)', '', '', '', ''],
    ['STT', 'Mã Kỹ Thuật', 'Tên Danh Mục Kỹ Thuật', 'Đơn Vị Tính', 'Chuyên Khoa'],
    [1, '01.0001', 'Chụp X-quang tim phổi thẳng', 'Lần', 'Chẩn đoán hình ảnh'],
    [2, '01.0002', 'Chụp X-quang cột sống cổ nghiêng', 'Lần', 'Chẩn đoán hình ảnh'],
    [3, '01.0003', 'Siêu âm tim màu qua thành ngực', 'Lần', 'Thăm dò chức năng'],
    [4, '01.0004', 'Điện tâm đồ thông thường (ECG)', 'Lần', 'Thăm dò chức năng'],
    [5, '02.0010', 'Nội soi dạ dày can thiệp cầm máu', 'Lần', 'Thăm dò chức năng'],
    [6, '02.0011', 'Nội soi phế quản ống mềm có gây mê', 'Lần', 'Hô hấp'],
    [7, '03.0025', 'Xét nghiệm tổng phân tích tế bào máu bằng laser', 'Lần', 'Huyết học'],
    [8, '03.0026', 'Định lượng Glucose trong máu', 'Lần', 'Sinh hóa'],
    [9, '04.0050', 'Phẫu thuật cắt ruột thừa nội soi', 'Ca', 'Ngoại khoa'],
    [10, '04.0051', 'Phẫu thuật thay khớp háng nhân tạo toàn phần', 'Ca', 'Chấn thương chỉnh hình'],
    [11, '05.0080', 'Thận nhân tạo chu kỳ (1 lần lọc máu)', 'Lần', 'Thận - Lọc máu'],
    [12, '06.0100', 'Đặt catheter tĩnh mạch trung tâm 2 nòng', 'Lần', 'Hồi sức cấp cứu'],
    [13, '07.0200', 'Kỹ thuật giảm đau sau mổ bằng PCA (File 1 độc quyền)', 'Lần', 'Gây mê hồi sức'],
    [14, '07.0201', 'Theo dõi huyết áp động mạch xâm lấn liên tục', 'Ngày', 'Hồi sức cấp cứu'],
  ];

  const catalog2 = [
    ['CỔNG GIÁM ĐỊNH BHYT / BỆNH VIỆN ĐỐI CHIẾU', '', '', ''],
    ['DANH MỤC KỸ THUẬT ÁP DỤNG THANH TOÁN (FILE 2)', '', '', ''],
    ['STT', 'Mã Danh Mục DVKT', 'Tên Danh Mục Kỹ Thuật (BHYT)', 'Khoa Phòng Áp Dụng'],
    // 1. Trùng tuyệt đối cả Mã và Tên
    [1, '01.0001', 'Chụp X-quang tim phổi thẳng', 'CĐHA'],
    // 2. Trùng tuyệt đối cả Mã và Tên
    [2, '01.0003', 'Siêu âm tim màu qua thành ngực', 'TDCN'],
    // 3. Trùng Mã nhưng Khác Tên (File 1 có chữ "thông thường (ECG)", File 2 chỉ ghi "Điện tâm đồ")
    [3, '01.0004', 'Điện tâm đồ', 'TDCN'],
    // 4. Trùng Mã nhưng Khác Tên (File 1: "Nội soi dạ dày can thiệp cầm máu", File 2: "Nội soi thực quản - dạ dày can thiệp cầm máu")
    [4, '02.0010', 'Nội soi thực quản - dạ dày can thiệp cầm máu', 'Nội tiêu hóa'],
    // 5. Trùng Tên nhưng Khác Mã (Cùng là Chụp X-quang cột sống cổ nghiêng nhưng File 2 ghi mã 01.0002.B)
    [5, '01.0002.B', 'Chụp X-quang cột sống cổ nghiêng', 'CĐHA'],
    // 6. Trùng Tên nhưng Khác Mã (Cùng là Định lượng Glucose trong máu nhưng File 2 ghi mã 03.0026.1)
    [6, '03.0026.1', 'Định lượng Glucose trong máu', 'Xét nghiệm'],
    // 7. Trùng tuyệt đối
    [7, '04.0050', 'Phẫu thuật cắt ruột thừa nội soi', 'Ngoại'],
    // 8. Trùng tuyệt đối
    [8, '05.0080', 'Thận nhân tạo chu kỳ (1 lần lọc máu)', 'Thận nhân tạo'],
    // 9. Trùng tuyệt đối
    [9, '06.0100', 'Đặt catheter tĩnh mạch trung tâm 2 nòng', 'HSCC'],
    // 10. File 2 có nhưng File 1 không có
    [10, '08.0300', 'Siêu âm Doppler mạch máu chi dưới (Chỉ có ở File 2)', 'CĐHA'],
    // 11. File 2 có nhưng File 1 không có
    [11, '08.0301', 'Chụp cắt lớp vi tính lồng ngực không tiêm thuốc (Chỉ có ở File 2)', 'CĐHA'],
  ];

  const wb1 = XLSX.utils.book_new();
  const ws1 = XLSX.utils.aoa_to_sheet(catalog1);
  XLSX.utils.book_append_sheet(wb1, ws1, 'DMKT_BV');
  const buf1 = XLSX.write(wb1, { type: 'array', bookType: 'xlsx' });

  const wb2 = XLSX.utils.book_new();
  const ws2 = XLSX.utils.aoa_to_sheet(catalog2);
  XLSX.utils.book_append_sheet(wb2, ws2, 'DMKT_BHYT');
  const buf2 = XLSX.write(wb2, { type: 'array', bookType: 'xlsx' });

  const file1 = parseExcelBuffer(buf1, 'Danh_muc_ky_thuat_BV_File1.xlsx', buf1.byteLength);
  const file2 = parseExcelBuffer(buf2, 'Danh_muc_ky_thuat_BHYT_File2.xlsx', buf2.byteLength);

  return { file1, file2 };
}
