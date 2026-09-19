import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileMinus,
  FilePlus,
  FileSpreadsheet,
  ArrowRightLeft,
  Filter,
  Check,
  Copy,
} from 'lucide-react';
import { ComparisonItem, ComparisonSummary, MatchStatus } from '../types';

interface ComparisonTableProps {
  items: ComparisonItem[];
  summary: ComparisonSummary;
  activeFilter: MatchStatus | 'ALL';
  onFilterChange: (filter: MatchStatus | 'ALL') => void;
  onExportExcel: () => void;
  file1Name: string;
  file2Name: string;
}

export function ComparisonTable({
  items,
  summary,
  activeFilter,
  onFilterChange,
  onExportExcel,
  file1Name,
  file2Name,
}: ComparisonTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter items based on active tab and search term
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Status Filter
      if (activeFilter !== 'ALL' && item.status !== activeFilter) {
        return false;
      }

      // 2. Search Term
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();

      const matchF1Code = item.file1Code?.toLowerCase().includes(term);
      const matchF1Name = item.file1Name?.toLowerCase().includes(term);
      const matchF2Code = item.file2Code?.toLowerCase().includes(term);
      const matchF2Name = item.file2Name?.toLowerCase().includes(term);
      const matchNote = item.differenceNote?.toLowerCase().includes(term);

      return matchF1Code || matchF1Name || matchF2Code || matchF2Name || matchNote;
    });
  }, [items, activeFilter, searchTerm]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, validCurrentPage, pageSize]);

  const handleCopyRow = (item: ComparisonItem) => {
    const text = `F1: [${item.file1Code || '-'}] ${item.file1Name || '-'} | F2: [${item.file2Code || '-'}] ${item.file2Name || '-'}`;
    navigator.clipboard?.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const getStatusBadge = (status: MatchStatus) => {
    switch (status) {
      case 'EXACT_MATCH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Trùng cả Mã & Tên
          </span>
        );
      case 'MATCH_CODE_DIFF_NAME':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Trùng Mã - Khác Tên
          </span>
        );
      case 'MATCH_NAME_DIFF_CODE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
            Trùng Tên - Khác Mã
          </span>
        );
      case 'ONLY_IN_FILE_1':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <FileMinus className="w-3.5 h-3.5 text-purple-600" />
            Chỉ có ở File 1
          </span>
        );
      case 'ONLY_IN_FILE_2':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <FilePlus className="w-3.5 h-3.5 text-rose-600" />
            Chỉ có ở File 2
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-comparison-input"
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Tìm kiếm theo mã kỹ thuật, tên danh mục..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-end">
            <span className="text-xs text-slate-500">
              Hiển thị <strong>{filteredItems.length}</strong> / {items.length} bản ghi
            </span>

            <button
              id="export-excel-btn"
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Xuất File Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => {
              onFilterChange('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'ALL'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({items.length})
          </button>

          <button
            type="button"
            onClick={() => {
              onFilterChange('EXACT_MATCH');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'EXACT_MATCH'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            Trùng cả Mã & Tên ({summary.exactMatchCount})
          </button>

          <button
            type="button"
            onClick={() => {
              onFilterChange('MATCH_CODE_DIFF_NAME');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'MATCH_CODE_DIFF_NAME'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            Trùng Mã - Khác Tên ({summary.matchCodeDiffNameCount})
          </button>

          <button
            type="button"
            onClick={() => {
              onFilterChange('MATCH_NAME_DIFF_CODE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'MATCH_NAME_DIFF_CODE'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'bg-white text-sky-800 hover:bg-sky-50 border border-sky-200'
            }`}
          >
            Trùng Tên - Khác Mã ({summary.matchNameDiffCodeCount})
          </button>

          <button
            type="button"
            onClick={() => {
              onFilterChange('ONLY_IN_FILE_1');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'ONLY_IN_FILE_1'
                ? 'bg-purple-700 text-white shadow-2xs'
                : 'bg-white text-purple-800 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            Chỉ có ở File 1 ({summary.onlyInFile1Count})
          </button>

          <button
            type="button"
            onClick={() => {
              onFilterChange('ONLY_IN_FILE_2');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeFilter === 'ONLY_IN_FILE_2'
                ? 'bg-rose-700 text-white shadow-2xs'
                : 'bg-white text-rose-800 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            Chỉ có ở File 2 ({summary.onlyInFile2Count})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 text-xs font-semibold">
              <th className="py-3 px-3 w-12 text-center">STT</th>
              <th className="py-3 px-3 w-40">Trạng Thái</th>
              <th className="py-3 px-3 bg-emerald-50/50 border-r border-slate-200">
                <div className="text-emerald-900 font-bold">FILE 1: {file1Name}</div>
                <div className="text-[11px] text-emerald-700 font-normal">Mã • Tên danh mục kỹ thuật</div>
              </th>
              <th className="py-3 px-3 bg-sky-50/50 border-r border-slate-200">
                <div className="text-sky-900 font-bold">FILE 2: {file2Name}</div>
                <div className="text-[11px] text-sky-700 font-normal">Mã • Tên danh mục kỹ thuật</div>
              </th>
              <th className="py-3 px-3 w-64">Ghi Chú Đối Soát</th>
              <th className="py-3 px-3 w-16 text-center">Sao chép</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">Không tìm thấy danh mục nào phù hợp</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác
                  </p>
                </td>
              </tr>
            ) : (
              paginatedItems.map((item, idx) => {
                const globalIndex = (validCurrentPage - 1) * pageSize + idx + 1;
                const isExact = item.status === 'EXACT_MATCH';
                const isCodeDiffName = item.status === 'MATCH_CODE_DIFF_NAME';
                const isNameDiffCode = item.status === 'MATCH_NAME_DIFF_CODE';
                const isOnlyF1 = item.status === 'ONLY_IN_FILE_1';
                const isOnlyF2 = item.status === 'ONLY_IN_FILE_2';

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isCodeDiffName
                        ? 'bg-amber-50/20'
                        : isNameDiffCode
                        ? 'bg-sky-50/20'
                        : isOnlyF1
                        ? 'bg-purple-50/20'
                        : isOnlyF2
                        ? 'bg-rose-50/20'
                        : ''
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center text-slate-400 font-medium">
                      {globalIndex}
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      {getStatusBadge(item.status)}
                      {item.similarityScore !== undefined && item.similarityScore < 100 && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Tương đồng tên: <strong>{item.similarityScore}%</strong>
                        </div>
                      )}
                    </td>

                    {/* File 1 Data */}
                    <td className="py-3 px-3 align-top bg-emerald-50/20 border-r border-slate-200">
                      {item.file1Code || item.file1Name ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                              {item.file1Code || '(Chưa có mã)'}
                            </span>
                            {item.file1RowNumber && (
                              <span className="text-[11px] text-slate-400">
                                (Dòng {item.file1RowNumber})
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-slate-800">
                            {item.file1Name}
                          </div>
                          {(item.file1Group || item.file1Unit) && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              {item.file1Group && <span>Khoa: {item.file1Group}</span>}
                              {item.file1Unit && <span>• ĐVT: {item.file1Unit}</span>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">
                          (Không có trong File 1)
                        </span>
                      )}
                    </td>

                    {/* File 2 Data */}
                    <td className="py-3 px-3 align-top bg-sky-50/20 border-r border-slate-200">
                      {item.file2Code || item.file2Name ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                              {item.file2Code || '(Chưa có mã)'}
                            </span>
                            {item.file2RowNumber && (
                              <span className="text-[11px] text-slate-400">
                                (Dòng {item.file2RowNumber})
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-slate-800">
                            {item.file2Name}
                          </div>
                          {(item.file2Group || item.file2Unit) && (
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              {item.file2Group && <span>Khoa: {item.file2Group}</span>}
                              {item.file2Unit && <span>• ĐVT: {item.file2Unit}</span>}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">
                          (Không có trong File 2)
                        </span>
                      )}
                    </td>

                    {/* Difference Notes / Highlights */}
                    <td className="py-3 px-3 align-top text-xs text-slate-600">
                      {isExact && (
                        <span className="text-emerald-700 font-medium">
                          Khớp hoàn toàn 100% cả mã và tên danh mục.
                        </span>
                      )}
                      {isCodeDiffName && (
                        <div className="space-y-1">
                          <div className="text-amber-800 font-medium flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                            Cùng mã, tên khác nhau:
                          </div>
                          <div className="text-[11px] text-slate-600 pl-4 border-l-2 border-amber-300">
                            <div>F1: &quot;{item.file1Name}&quot;</div>
                            <div>F2: &quot;{item.file2Name}&quot;</div>
                          </div>
                        </div>
                      )}
                      {isNameDiffCode && (
                        <div className="space-y-1">
                          <div className="text-sky-800 font-medium flex items-center gap-1">
                            <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-sky-600" />
                            Cùng tên, mã khác nhau:
                          </div>
                          <div className="text-[11px] text-slate-600 pl-4 border-l-2 border-sky-300">
                            <div>Mã F1: <strong>{item.file1Code}</strong></div>
                            <div>Mã F2: <strong>{item.file2Code}</strong></div>
                          </div>
                        </div>
                      )}
                      {isOnlyF1 && (
                        <span className="text-purple-700">
                          Chỉ có ở File 1. Không tìm thấy mã hoặc tên tương ứng trong File 2.
                        </span>
                      )}
                      {isOnlyF2 && (
                        <span className="text-rose-700">
                          Chỉ có ở File 2. Không tìm thấy mã hoặc tên tương ứng trong File 1.
                        </span>
                      )}
                    </td>

                    {/* Copy action */}
                    <td className="py-3 px-3 text-center align-top">
                      <button
                        type="button"
                        onClick={() => handleCopyRow(item)}
                        className="text-slate-400 hover:text-slate-700 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Sao chép dòng đối soát này"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredItems.length > 0 && (
        <div className="p-3 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Hiển thị mỗi trang:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded border border-slate-300 bg-white font-medium"
            >
              <option value={25}>25 dòng</option>
              <option value={50}>50 dòng</option>
              <option value={100}>100 dòng</option>
              <option value={250}>250 dòng</option>
            </select>
            <span>
              (Đang xem {((validCurrentPage - 1) * pageSize) + 1} - {Math.min(validCurrentPage * pageSize, filteredItems.length)} trong tổng số {filteredItems.length})
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(1)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              « Đầu
            </button>
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              ‹ Trước
            </button>
            <span className="px-3 py-1 font-semibold text-slate-800">
              Trang {validCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              Sau ›
            </button>
            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 cursor-pointer"
            >
              Cuối »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
