import { FileData, MatchOptions, ComparisonItem, ComparisonSummary, ParsedRow } from '../types';

export const DEFAULT_MATCH_OPTIONS: MatchOptions = {
  normalizeUnicode: true,   // Chuẩn hóa Unicode NFC (tổ hợp vs dựng sẵn)
  trimWhitespace: true,     // Bỏ khoảng trắng ở 2 đầu ô
  collapseSpaces: true,     // Gom khoảng trắng thừa giữa các từ thành 1 khoảng trắng
  ignoreCase: false,        // Mặc định: Phân biệt hoa thường để tuyệt đối chính xác (có nút bật tắt)
  stripPunctuation: false,  // Mặc định: Giữ nguyên ký tự đặc biệt
};

export function normalizeText(text: string | undefined | null, options: MatchOptions): string {
  if (text === undefined || text === null) return '';
  let res = String(text);

  if (options.normalizeUnicode) {
    res = res.normalize('NFC');
  }

  if (options.trimWhitespace) {
    res = res.trim();
  }

  if (options.collapseSpaces) {
    res = res.replace(/\s+/g, ' ');
  }

  if (options.ignoreCase) {
    res = res.toLowerCase();
  }

  if (options.stripPunctuation) {
    res = res.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
  }

  return res;
}

/**
 * Calculates string similarity between 0 and 100% using token overlap / character bigrams
 */
export function calculateSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;

  const t1 = s1.toLowerCase().trim();
  const t2 = s2.toLowerCase().trim();
  if (t1 === t2) return 100;

  // Word token set overlap (Jaccard similarity)
  const words1 = new Set(t1.split(/\s+/));
  const words2 = new Set(t2.split(/\s+/));
  
  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  const wordScore = (intersection.size / union.size) * 100;

  return Math.round(wordScore);
}

export function compareCatalogs(
  file1: FileData,
  file2: FileData,
  options: MatchOptions = DEFAULT_MATCH_OPTIONS
): { items: ComparisonItem[]; summary: ComparisonSummary } {
  const items: ComparisonItem[] = [];

  const rows1 = file1.parsedRows;
  const rows2 = file2.parsedRows;

  // Check internal duplicates in File 1
  const file1CodeCounts = new Map<string, number>();
  rows1.forEach((r) => {
    const k = normalizeText(r.code, options);
    if (k) file1CodeCounts.set(k, (file1CodeCounts.get(k) || 0) + 1);
  });
  let duplicatesInFile1 = 0;
  file1CodeCounts.forEach((count) => {
    if (count > 1) duplicatesInFile1 += count - 1;
  });

  // Check internal duplicates in File 2
  const file2CodeCounts = new Map<string, number>();
  rows2.forEach((r) => {
    const k = normalizeText(r.code, options);
    if (k) file2CodeCounts.set(k, (file2CodeCounts.get(k) || 0) + 1);
  });
  let duplicatesInFile2 = 0;
  file2CodeCounts.forEach((count) => {
    if (count > 1) duplicatesInFile2 += count - 1;
  });

  // Build indexes for File 2
  // Map of Exact Key (normCode + ":::" + normName) -> ParsedRow[]
  const f2ExactMap = new Map<string, ParsedRow[]>();
  // Map of normCode -> ParsedRow[]
  const f2CodeMap = new Map<string, ParsedRow[]>();
  // Map of normName -> ParsedRow[]
  const f2NameMap = new Map<string, ParsedRow[]>();

  rows2.forEach((r) => {
    const c = normalizeText(r.code, options);
    const n = normalizeText(r.name, options);
    const exactKey = `${c}:::${n}`;

    if (!f2ExactMap.has(exactKey)) f2ExactMap.set(exactKey, []);
    f2ExactMap.get(exactKey)!.push(r);

    if (c) {
      if (!f2CodeMap.has(c)) f2CodeMap.set(c, []);
      f2CodeMap.get(c)!.push(r);
    }

    if (n) {
      if (!f2NameMap.has(n)) f2NameMap.set(n, []);
      f2NameMap.get(n)!.push(r);
    }
  });

  // Track matched rows in File 2 to know which ones remain "ONLY_IN_FILE_2"
  const matchedFile2Rows = new Set<ParsedRow>();

  let exactMatchCount = 0;
  let matchCodeDiffNameCount = 0;
  let matchNameDiffCodeCount = 0;
  let onlyInFile1Count = 0;

  // Process all rows from File 1
  rows1.forEach((r1, index) => {
    const c1 = normalizeText(r1.code, options);
    const n1 = normalizeText(r1.name, options);
    const exactKey = `${c1}:::${n1}`;

    // 1. Check EXACT MATCH (Trùng cả Mã và Tên)
    const exactMatches = f2ExactMap.get(exactKey);
    if (exactMatches && exactMatches.length > 0) {
      const r2 = exactMatches.find((cand) => !matchedFile2Rows.has(cand)) || exactMatches[0];
      matchedFile2Rows.add(r2);
      exactMatchCount++;

      items.push({
        id: `match-exact-${index}`,
        status: 'EXACT_MATCH',
        file1RowNumber: r1.rowNumber,
        file1Code: r1.code,
        file1Name: r1.name,
        file1Group: r1.group,
        file1Unit: r1.unit,
        file1Price: r1.price,
        file1FullData: r1.fullData,
        file2RowNumber: r2.rowNumber,
        file2Code: r2.code,
        file2Name: r2.name,
        file2Group: r2.group,
        file2Unit: r2.unit,
        file2Price: r2.price,
        file2FullData: r2.fullData,
        differenceNote: 'Trùng khớp 100% cả Mã và Tên danh mục kỹ thuật.',
        similarityScore: 100,
      });
      return;
    }

    // 2. Check MATCH CODE, DIFFERENT NAME (Trùng Mã nhưng Khác Tên)
    const codeMatches = c1 ? f2CodeMap.get(c1) : undefined;
    if (codeMatches && codeMatches.length > 0) {
      // Prioritize unmatched candidate if any
      const r2 = codeMatches.find((cand) => !matchedFile2Rows.has(cand)) || codeMatches[0];
      matchedFile2Rows.add(r2);
      matchCodeDiffNameCount++;

      const sim = calculateSimilarity(r1.name, r2.name);

      items.push({
        id: `match-code-diff-name-${index}`,
        status: 'MATCH_CODE_DIFF_NAME',
        file1RowNumber: r1.rowNumber,
        file1Code: r1.code,
        file1Name: r1.name,
        file1Group: r1.group,
        file1Unit: r1.unit,
        file1Price: r1.price,
        file1FullData: r1.fullData,
        file2RowNumber: r2.rowNumber,
        file2Code: r2.code,
        file2Name: r2.name,
        file2Group: r2.group,
        file2Unit: r2.unit,
        file2Price: r2.price,
        file2FullData: r2.fullData,
        differenceNote: `Cùng mã "${r1.code}", nhưng tên danh mục khác nhau. Độ tương đồng tên: ${sim}%.`,
        similarityScore: sim,
      });
      return;
    }

    // 3. Check MATCH NAME, DIFFERENT CODE (Trùng Tên nhưng Khác Mã)
    const nameMatches = n1 ? f2NameMap.get(n1) : undefined;
    if (nameMatches && nameMatches.length > 0) {
      const r2 = nameMatches.find((cand) => !matchedFile2Rows.has(cand)) || nameMatches[0];
      matchedFile2Rows.add(r2);
      matchNameDiffCodeCount++;

      items.push({
        id: `match-name-diff-code-${index}`,
        status: 'MATCH_NAME_DIFF_CODE',
        file1RowNumber: r1.rowNumber,
        file1Code: r1.code,
        file1Name: r1.name,
        file1Group: r1.group,
        file1Unit: r1.unit,
        file1Price: r1.price,
        file1FullData: r1.fullData,
        file2RowNumber: r2.rowNumber,
        file2Code: r2.code,
        file2Name: r2.name,
        file2Group: r2.group,
        file2Unit: r2.unit,
        file2Price: r2.price,
        file2FullData: r2.fullData,
        differenceNote: `Tên danh mục giống hệt nhau, nhưng File 1 mang mã "${r1.code}" còn File 2 mang mã "${r2.code}".`,
        similarityScore: 100,
      });
      return;
    }

    // 4. ONLY IN FILE 1 (Chỉ có trong File 1, không tìm thấy trong File 2)
    onlyInFile1Count++;
    items.push({
      id: `only-file1-${index}`,
      status: 'ONLY_IN_FILE_1',
      file1RowNumber: r1.rowNumber,
      file1Code: r1.code,
      file1Name: r1.name,
      file1Group: r1.group,
      file1Unit: r1.unit,
      file1Price: r1.price,
      file1FullData: r1.fullData,
      differenceNote: 'Danh mục này chỉ xuất hiện ở File 1, hoàn toàn không có trong File 2.',
      similarityScore: 0,
    });
  });

  // 5. Remaining rows in File 2 that weren't matched are ONLY IN FILE 2
  let onlyInFile2Count = 0;
  rows2.forEach((r2, index) => {
    if (!matchedFile2Rows.has(r2)) {
      onlyInFile2Count++;
      items.push({
        id: `only-file2-${index}`,
        status: 'ONLY_IN_FILE_2',
        file2RowNumber: r2.rowNumber,
        file2Code: r2.code,
        file2Name: r2.name,
        file2Group: r2.group,
        file2Unit: r2.unit,
        file2Price: r2.price,
        file2FullData: r2.fullData,
        differenceNote: 'Danh mục này chỉ xuất hiện ở File 2, hoàn toàn không có trong File 1.',
        similarityScore: 0,
      });
    }
  });

  const summary: ComparisonSummary = {
    totalRowsFile1: rows1.length,
    totalRowsFile2: rows2.length,
    exactMatchCount,
    matchCodeDiffNameCount,
    matchNameDiffCodeCount,
    onlyInFile1Count,
    onlyInFile2Count,
    duplicatesInFile1,
    duplicatesInFile2,
  };

  return { items, summary };
}
