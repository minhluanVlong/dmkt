import { X, FileSpreadsheet, Hash, Layers } from 'lucide-react';
import { FileData } from '../types';

interface FilePreviewModalProps {
  fileData: FileData | null;
  onClose: () => void;
}

export function FilePreviewModal({ fileData, onClose }: FilePreviewModalProps) {
  if (!fileData) return null;

  const previewRows = fileData.rawRows.slice(0, 30);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Xem trước file: {fileData.fileName}
              </h3>
              <p className="text-xs text-slate-500">
                Sheet: <strong>{fileData.selectedSheet}</strong> • Dòng tiêu đề: <strong>Dòng {fileData.headerRowIndex + 1}</strong> • Tổng cộng: <strong>{fileData.rawRows.length} dòng</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Column config chips */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Cột Mã:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-medium border border-emerald-200">
              {fileData.codeColumn || '(Chưa chọn)'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Cột Tên danh mục:</span>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium border border-indigo-200">
              {fileData.nameColumn || '(Chưa chọn)'}
            </span>
          </div>
          <div className="text-slate-500 text-[11px] ml-auto">
            (Hiển thị 30 dòng đầu tiên của bảng tính)
          </div>
        </div>

        {/* Modal Table Content */}
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse text-xs border border-slate-200">
            <thead>
              {previewRows.slice(0, fileData.headerRowIndex + 1).map((row, rIdx) => {
                const isHeader = rIdx === fileData.headerRowIndex;
                return (
                  <tr
                    key={rIdx}
                    className={isHeader ? 'bg-indigo-50 border-b-2 border-indigo-300 font-bold text-indigo-950' : 'bg-slate-50/60 text-slate-500 italic'}
                  >
                    <th className="p-2 border border-slate-200 text-center w-12 font-mono text-[11px]">
                      Dòng {rIdx + 1}
                    </th>
                    {fileData.availableColumns.map((col, cIdx) => (
                      <th
                        key={cIdx}
                        className={`p-2 border border-slate-200 text-left ${
                          isHeader && col === fileData.codeColumn
                            ? 'bg-emerald-100/80 text-emerald-900 ring-1 ring-emerald-400'
                            : isHeader && col === fileData.nameColumn
                            ? 'bg-indigo-100/80 text-indigo-900 ring-1 ring-indigo-400'
                            : ''
                        }`}
                      >
                        {row[cIdx] !== undefined && row[cIdx] !== '' ? String(row[cIdx]) : '(trống)'}
                      </th>
                    ))}
                  </tr>
                );
              })}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {previewRows.slice(fileData.headerRowIndex + 1).map((row, rIdx) => {
                const actualRowIdx = fileData.headerRowIndex + 1 + rIdx + 1;
                return (
                  <tr key={rIdx} className="hover:bg-slate-50">
                    <td className="p-2 border border-slate-200 text-center text-slate-400 font-mono text-[11px]">
                      {actualRowIdx}
                    </td>
                    {fileData.availableColumns.map((col, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-2 border border-slate-200 text-slate-700 ${
                          col === fileData.codeColumn
                            ? 'bg-emerald-50/40 font-mono font-medium text-emerald-900'
                            : col === fileData.nameColumn
                            ? 'bg-indigo-50/40 font-medium text-indigo-900'
                            : ''
                        }`}
                      >
                        {row[cIdx] !== undefined ? String(row[cIdx]) : ''}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  );
}
