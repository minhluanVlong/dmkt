import { Sliders, ShieldCheck, HelpCircle } from 'lucide-react';
import { MatchOptions } from '../types';

interface ComparisonSettingsProps {
  options: MatchOptions;
  onOptionsChange: (newOptions: MatchOptions) => void;
}

export function ComparisonSettings({ options, onOptionsChange }: ComparisonSettingsProps) {
  const toggle = (key: keyof MatchOptions) => {
    onOptionsChange({
      ...options,
      [key]: !options[key],
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Quy Tắc Đối Soát Tuyệt Đối Chính Xác
            </h3>
            <p className="text-xs text-slate-500">
              Thiết lập chuẩn hóa ký tự tiếng Việt và so sánh dữ liệu
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Thuật toán đối chiếu chuẩn
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* 1. Chuẩn hóa Unicode NFC */}
        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="setting-unicode-nfc"
            checked={options.normalizeUnicode}
            onChange={() => toggle('normalizeUnicode')}
            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-semibold text-slate-800 block">
              Chuẩn hóa Unicode (NFC)
            </span>
            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
              Đồng nhất dấu tiếng Việt (dựng sẵn & tổ hợp) để tránh lỗi lệch font Unikey.
            </span>
          </div>
        </label>

        {/* 2. Cắt khoảng trắng thừa */}
        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="setting-trim-spaces"
            checked={options.trimWhitespace}
            onChange={() => toggle('trimWhitespace')}
            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-semibold text-slate-800 block">
              Xóa khoảng trắng đầu/cuối ô (Trim)
            </span>
            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
              Loại bỏ dấu cách vô tình gõ dư ở đầu hoặc cuối nội dung ô Excel.
            </span>
          </div>
        </label>

        {/* 3. Gom nhiều dấu cách */}
        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="setting-collapse-spaces"
            checked={options.collapseSpaces}
            onChange={() => toggle('collapseSpaces')}
            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-semibold text-slate-800 block">
              Gom khoảng trắng giữa từ
            </span>
            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
              Chuyển 2 hoặc nhiều dấu cách liên tiếp giữa các từ thành 1 dấu cách duy nhất.
            </span>
          </div>
        </label>

        {/* 4. Không phân biệt chữ hoa / thường */}
        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
          <input
            type="checkbox"
            id="setting-ignore-case"
            checked={options.ignoreCase}
            onChange={() => toggle('ignoreCase')}
            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
          />
          <div>
            <span className="font-semibold text-slate-800 block">
              Bỏ qua chữ hoa / thường
            </span>
            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
              {options.ignoreCase
                ? 'Đang bỏ qua chữ hoa/thường (ví dụ "X-QUANG" khớp "X-quang").'
                : 'Đang phân biệt chữ hoa/thường (khớp tuyệt đối từng chữ).'}
            </span>
          </div>
        </label>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-500">
        <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          Cơ chế dò tìm sẽ chia làm 4 trạng thái rõ rệt: <strong>Trùng cả Mã & Tên</strong>, <strong>Trùng Mã nhưng Khác Tên</strong>, <strong>Trùng Tên nhưng Khác Mã</strong>, và <strong>Chỉ có ở File 1 hoặc File 2</strong>.
        </span>
      </div>
    </div>
  );
}
