/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { FileUploadCard } from './components/FileUploadCard';
import { ComparisonSettings } from './components/ComparisonSettings';
import { SummaryCards } from './components/SummaryCards';
import { ComparisonTable } from './components/ComparisonTable';
import { FilePreviewModal } from './components/FilePreviewModal';
import { FileData, MatchOptions, MatchStatus } from './types';
import { DEFAULT_MATCH_OPTIONS, compareCatalogs } from './utils/matcher';
import { generateSampleData } from './utils/excelParser';
import { exportComparisonToExcel } from './utils/excelExporter';
import { FileSpreadsheet, ArrowRight, ShieldCheck, CheckCircle2, Sparkles, HelpCircle } from 'lucide-react';

export default function App() {
  const [file1, setFile1] = useState<FileData | null>(null);
  const [file2, setFile2] = useState<FileData | null>(null);
  const [matchOptions, setMatchOptions] = useState<MatchOptions>(DEFAULT_MATCH_OPTIONS);
  const [activeFilter, setActiveFilter] = useState<MatchStatus | 'ALL'>('ALL');
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);

  // Auto compute comparison results whenever files or match options change
  const comparisonResult = useMemo(() => {
    if (!file1 || !file2) return null;
    if (!file1.codeColumn || !file1.nameColumn || !file2.codeColumn || !file2.nameColumn) {
      return null;
    }
    return compareCatalogs(file1, file2, matchOptions);
  }, [file1, file2, matchOptions]);

  // Load realistic sample data
  const handleLoadSample = () => {
    const { file1: s1, file2: s2 } = generateSampleData();
    setFile1(s1);
    setFile2(s2);
    setActiveFilter('ALL');
  };

  const handleReset = () => {
    setFile1(null);
    setFile2(null);
    setActiveFilter('ALL');
  };

  const handleExportExcel = () => {
    if (!comparisonResult || !file1 || !file2) return;
    exportComparisonToExcel(
      comparisonResult.items,
      comparisonResult.summary,
      file1,
      file2,
      matchOptions
    );
  };

  const isReadyToCompare = file1 && file2 && file1.codeColumn && file1.nameColumn && file2.codeColumn && file2.nameColumn;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Header */}
      <Header
        hasData={Boolean(file1 || file2)}
        onLoadSample={handleLoadSample}
        onReset={handleReset}
        onExport={comparisonResult ? handleExportExcel : undefined}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Intro banner if no data */}
        {!file1 && !file2 && (
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                <ShieldCheck className="w-4 h-4" />
                Dò trùng & Khác biệt danh mục kỹ thuật tuyệt đối chính xác
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                So Sánh Đối Chiếu 2 File Excel Danh Mục Kỹ Thuật
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Tải lên 2 file danh mục kỹ thuật (ví dụ: Danh mục Bệnh viện / Trung tâm Y tế và Danh mục Cổng BHYT / Quyết định 437 / TT39). 
                Hệ thống sẽ tự động quét cột <strong>Mã</strong> và cột <strong>Tên danh mục kỹ thuật</strong>, chuẩn hóa tiếng Việt, và phân loại thành 4 nhóm kết quả: 
                <span className="text-emerald-300 font-medium"> Trùng cả Mã & Tên</span>, 
                <span className="text-amber-300 font-medium"> Trùng Mã - Khác Tên</span>, 
                <span className="text-sky-300 font-medium"> Trùng Tên - Khác Mã</span>, và 
                <span className="text-purple-300 font-medium"> Chỉ có ở 1 trong 2 file</span>.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Nạp dữ liệu mẫu thử ngay (1 click)
                </button>
                <span className="text-xs text-slate-400">
                  Hoặc kéo thả 2 file Excel của bạn vào 2 khung bên dưới
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 2 File Upload Cards */}
        <section aria-label="Khu vực tải file">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* File 1 Card */}
            <FileUploadCard
              idPrefix="file1"
              title="FILE 1: Danh Mục Kỹ Thuật Gốc"
              subtitle="File danh mục thứ nhất cần so sánh (ví dụ: Danh mục nội bộ đơn vị)"
              badgeText="File 1 (Chuẩn)"
              badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
              fileData={file1}
              onFileParsed={(data) => setFile1(data)}
              onClearFile={() => setFile1(null)}
              onPreview={(data) => setPreviewFile(data)}
            />

            {/* File 2 Card */}
            <FileUploadCard
              idPrefix="file2"
              title="FILE 2: Danh Mục Kỹ Thuật Đối Chiếu"
              subtitle="File danh mục thứ hai để dò trùng (ví dụ: Cổng BHYT, Danh mục liên viện)"
              badgeText="File 2 (Đối chiếu)"
              badgeColor="bg-sky-50 text-sky-700 border-sky-200"
              fileData={file2}
              onFileParsed={(data) => setFile2(data)}
              onClearFile={() => setFile2(null)}
              onPreview={(data) => setPreviewFile(data)}
            />
          </div>
        </section>

        {/* Matching Rules & Settings */}
        <ComparisonSettings
          options={matchOptions}
          onOptionsChange={(newOptions) => setMatchOptions(newOptions)}
        />

        {/* Comparison Results Section */}
        {isReadyToCompare && comparisonResult && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Executive Summary Cards */}
            <SummaryCards
              summary={comparisonResult.summary}
              activeFilter={activeFilter}
              onSelectFilter={(filter) => setActiveFilter(filter)}
              file1Name={file1?.fileName || 'File 1'}
              file2Name={file2?.fileName || 'File 2'}
            />

            {/* Side-by-Side Detailed Comparison Table */}
            <ComparisonTable
              items={comparisonResult.items}
              summary={comparisonResult.summary}
              activeFilter={activeFilter}
              onFilterChange={(filter) => setActiveFilter(filter)}
              onExportExcel={handleExportExcel}
              file1Name={file1?.fileName || 'File 1'}
              file2Name={file2?.fileName || 'File 2'}
            />
          </div>
        )}

        {/* Empty / Incomplete prompt */}
        {(!file1 || !file2) && (
          <div className="p-8 rounded-xl border border-dashed border-slate-300 bg-white text-center text-slate-500">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              Vui lòng tải lên cả 2 file Excel để hệ thống tự động dò trùng và tìm khác biệt
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Bạn cũng có thể bấm nút <strong>&quot;Nạp dữ liệu mẫu thử nghiệm&quot;</strong> ở góc trên bên phải để xem kết quả đối soát ngay lập tức.
            </p>
          </div>
        )}

        {file1 && file2 && !isReadyToCompare && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong>Chưa hoàn tất chọn cột đối soát:</strong> Hãy chọn đủ <strong>Cột Mã</strong> và <strong>Cột Tên danh mục kỹ thuật</strong> ở cả 2 file phía trên để ứng dụng bắt đầu so sánh.
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        Công cụ đối soát và dò trùng danh mục kỹ thuật tuyệt đối chính xác • Hỗ trợ chuẩn hóa tiếng Việt Unicode NFC
      </footer>

      {/* Raw Data Preview Modal */}
      {previewFile && (
        <FilePreviewModal
          fileData={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
