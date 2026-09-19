export type MatchStatus = 
  | 'EXACT_MATCH'             // Trùng cả Mã và Tên
  | 'MATCH_CODE_DIFF_NAME'    // Trùng Mã - Khác Tên
  | 'MATCH_NAME_DIFF_CODE'    // Trùng Tên - Khác Mã
  | 'ONLY_IN_FILE_1'          // Chỉ có ở File 1
  | 'ONLY_IN_FILE_2';         // Chỉ có ở File 2

export interface FileData {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  headerRowIndex: number;
  availableColumns: string[];
  codeColumn: string;
  nameColumn: string;
  groupColumn?: string; // Optional: Khoa/Phòng/Nhóm
  unitColumn?: string;  // Optional: Đơn vị tính
  priceColumn?: string; // Optional: Giá
  rawRows: any[][];
  parsedRows: ParsedRow[];
}

export interface ParsedRow {
  rowNumber: number; // Row index in original sheet (1-based)
  code: string;
  name: string;
  group?: string;
  unit?: string;
  price?: string;
  fullData: Record<string, any>;
}

export interface MatchOptions {
  normalizeUnicode: boolean; // NFC unicode normalization (quan trọng cho tiếng Việt gõ Unikey dựng sẵn/tổ hợp)
  trimWhitespace: boolean;   // Bỏ khoảng trắng thừa ở đầu/cuối
  collapseSpaces: boolean;   // Chuyển nhiều dấu cách liên tiếp thành 1 dấu cách
  ignoreCase: boolean;       // Không phân biệt chữ hoa / chữ thường
  stripPunctuation: boolean; // Loại bỏ dấu câu phụ (, . - _) khi dò tên
}

export interface ComparisonItem {
  id: string;
  status: MatchStatus;
  
  // Dữ liệu từ File 1
  file1RowNumber?: number;
  file1Code?: string;
  file1Name?: string;
  file1Group?: string;
  file1Unit?: string;
  file1Price?: string;
  file1FullData?: Record<string, any>;

  // Dữ liệu từ File 2
  file2RowNumber?: number;
  file2Code?: string;
  file2Name?: string;
  file2Group?: string;
  file2Unit?: string;
  file2Price?: string;
  file2FullData?: Record<string, any>;

  // Ghi chú chi tiết về khác biệt
  differenceNote?: string;
  similarityScore?: number; // 0 - 100% nếu cùng mã nhưng khác tên
}

export interface ComparisonSummary {
  totalRowsFile1: number;
  totalRowsFile2: number;
  exactMatchCount: number;         // Trùng cả Mã và Tên
  matchCodeDiffNameCount: number;  // Trùng Mã nhưng Khác Tên
  matchNameDiffCodeCount: number;  // Trùng Tên nhưng Khác Mã
  onlyInFile1Count: number;        // Chỉ có ở File 1
  onlyInFile2Count: number;        // Chỉ có ở File 2
  duplicatesInFile1: number;       // Mã bị trùng nội bộ File 1
  duplicatesInFile2: number;       // Mã bị trùng nội bộ File 2
}
