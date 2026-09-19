import * as XLSX from 'xlsx';
import { ComparisonItem, ComparisonSummary, FileData, MatchOptions } from '../types';

export function exportComparisonToExcel(
  items: ComparisonItem[],
  summary: ComparisonSummary,
  file1: FileData,
  file2: FileData,
  options: MatchOptions
) {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Tổng Hợp
  const summarySheetData = [
    ['BÁO CÁO ĐỐI SOÁT & DÒ TRÙNG DANH MỤC KỸ THUẬT'],
    ['Ngày xuất báo cáo:', new Date().toLocaleString('vi-VN')],
    [''],
    ['THÔNG TIN FILE ĐỐI SOÁT'],
    ['File 1:', file1.fileName, `(Sheet: ${file1.selectedSheet})`, `Tổng số danh mục: ${summary.totalRowsFile1}`],
    ['File 2:', file2.fileName, `(Sheet: ${file2.selectedSheet})`, `Tổng số danh mục: ${summary.totalRowsFile2}`],
    ['Cột Mã sử dụng:', `File 1: [${file1.codeColumn}]`, `File 2: [${file2.codeColumn}]`],
    ['Cột Tên sử dụng:', `File 1: [${file1.nameColumn}]`, `File 2: [${file2.nameColumn}]`],
    [''],
    ['CẤU HÌNH DÒ TÌM ĐỘ CHÍNH XÁC'],
    ['Chuẩn hóa Unicode (NFC):', options.normalizeUnicode ? 'Có (bảo đảm khớp dấu Tiếng Việt)' : 'Không'],
    ['Cắt khoảng trắng thừa (Trim):', options.trimWhitespace ? 'Có' : 'Không'],
    ['Gom khoảng trắng (Collapse spaces):', options.collapseSpaces ? 'Có' : 'Không'],
    ['Phân biệt HOA / thường:', options.ignoreCase ? 'Không (Bỏ qua hoa thường)' : 'Có (Khớp chính xác hoa/thường)'],
    [''],
    ['KẾT QUẢ ĐỐI SOÁT CHI TIẾT', 'SỐ LƯỢNG', 'TỶ LỆ FILE 1', 'TỶ LỆ FILE 2'],
    [
      '1. Trùng khớp tuyệt đối (Trùng cả Mã và Tên)',
      summary.exactMatchCount,
      summary.totalRowsFile1 > 0 ? `${((summary.exactMatchCount / summary.totalRowsFile1) * 100).toFixed(1)}%` : '0%',
      summary.totalRowsFile2 > 0 ? `${((summary.exactMatchCount / summary.totalRowsFile2) * 100).toFixed(1)}%` : '0%',
    ],
    [
      '2. Trùng Mã nhưng Khác Tên danh mục',
      summary.matchCodeDiffNameCount,
      summary.totalRowsFile1 > 0 ? `${((summary.matchCodeDiffNameCount / summary.totalRowsFile1) * 100).toFixed(1)}%` : '0%',
      summary.totalRowsFile2 > 0 ? `${((summary.matchCodeDiffNameCount / summary.totalRowsFile2) * 100).toFixed(1)}%` : '0%',
    ],
    [
      '3. Trùng Tên nhưng Khác Mã danh mục',
      summary.matchNameDiffCodeCount,
      summary.totalRowsFile1 > 0 ? `${((summary.matchNameDiffCodeCount / summary.totalRowsFile1) * 100).toFixed(1)}%` : '0%',
      summary.totalRowsFile2 > 0 ? `${((summary.matchNameDiffCodeCount / summary.totalRowsFile2) * 100).toFixed(1)}%` : '0%',
    ],
    [
      '4. Danh mục chỉ có ở File 1 (Khác biệt)',
      summary.onlyInFile1Count,
      summary.totalRowsFile1 > 0 ? `${((summary.onlyInFile1Count / summary.totalRowsFile1) * 100).toFixed(1)}%` : '0%',
      '-',
    ],
    [
      '5. Danh mục chỉ có ở File 2 (Khác biệt)',
      summary.onlyInFile2Count,
      '-',
      summary.totalRowsFile2 > 0 ? `${((summary.onlyInFile2Count / summary.totalRowsFile2) * 100).toFixed(1)}%` : '0%',
    ],
    [''],
    ['CẢNH BÁO NỘI BỘ TỪNG FILE'],
    ['Số bản ghi trùng lặp mã nội bộ trong File 1:', summary.duplicatesInFile1],
    ['Số bản ghi trùng lặp mã nội bộ trong File 2:', summary.duplicatesInFile2],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Tổng Hợp Đối Soát');

  // Helper to format table rows
  const formatTable = (itemList: ComparisonItem[]) => {
    const headers = [
      'STT',
      'Trạng Thái Đối Soát',
      'Dòng F1',
      'Mã (File 1)',
      'Tên Danh Mục Kỹ Thuật (File 1)',
      'Khoa/Nhóm (F1)',
      'ĐVT (F1)',
      'Dòng F2',
      'Mã (File 2)',
      'Tên Danh Mục Kỹ Thuật (File 2)',
      'Khoa/Nhóm (F2)',
      'Độ tương đồng tên',
      'Ghi Chú Đối Soát',
    ];

    const dataRows = itemList.map((item, idx) => {
      let statusLabel = '';
      if (item.status === 'EXACT_MATCH') statusLabel = 'Trùng cả Mã và Tên';
      else if (item.status === 'MATCH_CODE_DIFF_NAME') statusLabel = 'Trùng Mã - Khác Tên';
      else if (item.status === 'MATCH_NAME_DIFF_CODE') statusLabel = 'Trùng Tên - Khác Mã';
      else if (item.status === 'ONLY_IN_FILE_1') statusLabel = 'Chỉ có ở File 1';
      else if (item.status === 'ONLY_IN_FILE_2') statusLabel = 'Chỉ có ở File 2';

      return [
        idx + 1,
        statusLabel,
        item.file1RowNumber ?? '',
        item.file1Code ?? '',
        item.file1Name ?? '',
        item.file1Group ?? '',
        item.file1Unit ?? '',
        item.file2RowNumber ?? '',
        item.file2Code ?? '',
        item.file2Name ?? '',
        item.file2Group ?? '',
        item.similarityScore !== undefined ? `${item.similarityScore}%` : '',
        item.differenceNote ?? '',
      ];
    });

    return [headers, ...dataRows];
  };

  // 2. Sheet Trùng khớp tuyệt đối
  const exactItems = items.filter((i) => i.status === 'EXACT_MATCH');
  const wsExact = XLSX.utils.aoa_to_sheet(formatTable(exactItems));
  XLSX.utils.book_append_sheet(wb, wsExact, 'Trùng Cả Mã & Tên');

  // 3. Sheet Trùng Mã - Khác Tên
  const codeDiffNameItems = items.filter((i) => i.status === 'MATCH_CODE_DIFF_NAME');
  const wsCodeDiff = XLSX.utils.aoa_to_sheet(formatTable(codeDiffNameItems));
  XLSX.utils.book_append_sheet(wb, wsCodeDiff, 'Trùng Mã - Khác Tên');

  // 4. Sheet Trùng Tên - Khác Mã
  const nameDiffCodeItems = items.filter((i) => i.status === 'MATCH_NAME_DIFF_CODE');
  const wsNameDiff = XLSX.utils.aoa_to_sheet(formatTable(nameDiffCodeItems));
  XLSX.utils.book_append_sheet(wb, wsNameDiff, 'Trùng Tên - Khác Mã');

  // 5. Sheet Chỉ có ở File 1
  const onlyF1Items = items.filter((i) => i.status === 'ONLY_IN_FILE_1');
  const wsF1 = XLSX.utils.aoa_to_sheet(formatTable(onlyF1Items));
  XLSX.utils.book_append_sheet(wb, wsF1, 'Chỉ Có Ở File 1');

  // 6. Sheet Chỉ có ở File 2
  const onlyF2Items = items.filter((i) => i.status === 'ONLY_IN_FILE_2');
  const wsF2 = XLSX.utils.aoa_to_sheet(formatTable(onlyF2Items));
  XLSX.utils.book_append_sheet(wb, wsF2, 'Chỉ Có Ở File 2');

  // 7. Sheet Toàn bộ danh mục
  const wsAll = XLSX.utils.aoa_to_sheet(formatTable(items));
  XLSX.utils.book_append_sheet(wb, wsAll, 'Toàn Bộ Kết Quả');

  // Trigger download
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  XLSX.writeFile(wb, `Ket_qua_doi_soat_danh_muc_${timestamp}.xlsx`);
}
