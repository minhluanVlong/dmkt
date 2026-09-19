import { FileSpreadsheet, RotateCcw, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  hasData: boolean;
  onLoadSample: () => void;
  onReset: () => void;
  onExport?: () => void;
}

export function Header({ hasData, onLoadSample, onReset, onExport }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Dò Trùng Danh Mục Kỹ Thuật
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" />
                Độ chính xác tuyệt đối
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Đối soát 2 file Excel theo cột Mã và Tên danh mục kỹ thuật
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
          <button
            id="load-sample-btn"
            type="button"
            onClick={onLoadSample}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200 cursor-pointer"
            title="Nạp dữ liệu mẫu danh mục kỹ thuật y tế (BV vs BHYT) để thử ngay"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Nạp dữ liệu mẫu thử nghiệm
          </button>

          {hasData && (
            <>
              {onExport && (
                <button
                  id="header-export-btn"
                  type="button"
                  onClick={onExport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Xuất file Excel báo cáo
                </button>
              )}

              <button
                id="reset-all-btn"
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                title="Xóa dữ liệu để tải file mới"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm mới
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
