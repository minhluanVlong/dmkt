import { useState, useRef, type DragEvent } from 'react';
import { UploadCloud, FileSpreadsheet, Check, Eye, Trash2 } from 'lucide-react';
import { FileData } from '../types';
import { parseExcelBuffer } from '../utils/excelParser';

interface FileUploadCardProps {
  idPrefix: string;
  title: string;
  subtitle: string;
  badgeText: string;
  badgeColor: string;
  fileData: FileData | null;
  onFileParsed: (data: FileData) => void;
  onClearFile: () => void;
  onPreview: (data: FileData) => void;
}

export function FileUploadCard({
  idPrefix,
  title,
  subtitle,
  badgeText,
  badgeColor,
  fileData,
  onFileParsed,
  onClearFile,
  onPreview,
}: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [rawBuffer, setRawBuffer] = useState<ArrayBuffer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      setRawBuffer(buffer);
      const parsed = parseExcelBuffer(buffer, file.name, file.size);
      onFileParsed(parsed);
    } catch (err) {
      console.error('Error parsing file:', err);
      alert('Không thể đọc file này. Vui lòng kiểm tra file Excel (.xlsx, .xls, .csv) có đúng định dạng.');
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Re-parse with custom sheet or custom header row
  const reparseWithConfig = (
    sheet?: string,
    headerIdx?: number,
    codeCol?: string,
    nameCol?: string
  ) => {
    if (!rawBuffer || !fileData) return;
    const reloaded = parseExcelBuffer(
      rawBuffer,
      fileData.fileName,
      fileData.fileSize,
      sheet ?? fileData.selectedSheet,
      headerIdx ?? fileData.headerRowIndex,
      codeCol ?? fileData.codeColumn,
      nameCol ?? fileData.nameColumn
    );
    onFileParsed(reloaded);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-full overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${badgeColor}`}>
              {badgeText}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        </div>

        {fileData && (
          <button
            id={`${idPrefix}-remove-btn`}
            type="button"
            onClick={() => {
              setRawBuffer(null);
              onClearFile();
            }}
            className="text-slate-400 hover:text-rose-600 transition-colors p-1.5 rounded-md hover:bg-rose-50 cursor-pointer"
            title="Xóa file này"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5 flex-1 flex flex-col">
        {!fileData ? (
          <div
            id={`${idPrefix}-dropzone`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 flex-1 min-h-[220px] ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 bg-slate-50/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800">
              Kéo thả file Excel vào đây hoặc <span className="text-indigo-600 underline">chọn từ máy tính</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">Hỗ trợ định dạng .xlsx, .xls, .csv</p>
          </div>
        ) : (
          <div className="space-y-4 flex-1">
            {/* File info pill */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate" title={fileData.fileName}>
                    {fileData.fileName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(fileData.fileSize)} • {fileData.parsedRows.length} dòng danh mục
                  </p>
                </div>
              </div>

              <button
                type="button"
                id={`${idPrefix}-preview-btn`}
                onClick={() => onPreview(fileData)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors shrink-0 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Xem trước
              </button>
            </div>

            {/* Sheet selector if multiple */}
            {fileData.sheetNames.length > 1 && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Chọn Sheet dữ liệu:
                </label>
                <select
                  id={`${idPrefix}-sheet-select`}
                  value={fileData.selectedSheet}
                  onChange={(e) => reparseWithConfig(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {fileData.sheetNames.map((sheet) => (
                    <option key={sheet} value={sheet}>
                      {sheet}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Header row selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700">
                  Dòng tiêu đề cột (Header Row):
                </label>
                <span className="text-[11px] text-slate-500">
                  Dòng {fileData.headerRowIndex + 1}
                </span>
              </div>
              <select
                id={`${idPrefix}-header-row-select`}
                value={fileData.headerRowIndex}
                onChange={(e) => reparseWithConfig(undefined, parseInt(e.target.value, 10))}
                className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {fileData.rawRows.slice(0, 10).map((row, idx) => {
                  const preview = row
                    .filter((c) => c !== '' && c !== null && c !== undefined)
                    .slice(0, 3)
                    .join(' | ');
                  return (
                    <option key={idx} value={idx}>
                      Dòng {idx + 1}: {preview || '(Dòng trống)'}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Crucial: Code Column and Name Column */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Cột Mã Danh Mục Kỹ Thuật (Bắt buộc):
                  </label>
                  {fileData.codeColumn && (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã chọn
                    </span>
                  )}
                </div>
                <select
                  id={`${idPrefix}-code-col-select`}
                  value={fileData.codeColumn}
                  onChange={(e) => reparseWithConfig(undefined, undefined, e.target.value, undefined)}
                  className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50/20 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn cột mã --</option>
                  {fileData.availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Cột Tên Danh Mục Kỹ Thuật (Bắt buộc):
                  </label>
                  {fileData.nameColumn && (
                    <span className="text-[11px] text-indigo-700 font-medium flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã chọn
                    </span>
                  )}
                </div>
                <select
                  id={`${idPrefix}-name-col-select`}
                  value={fileData.nameColumn}
                  onChange={(e) => reparseWithConfig(undefined, undefined, undefined, e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50/20 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Chọn cột tên danh mục --</option>
                  {fileData.availableColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status note if missing mapping */}
              {(!fileData.codeColumn || !fileData.nameColumn) && (
                <div className="p-2 rounded-md bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
                  Vui lòng chọn cả cột <strong>Mã</strong> và cột <strong>Tên danh mục</strong> để bắt đầu dò trùng chính xác.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
