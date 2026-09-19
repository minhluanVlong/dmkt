import { CheckCircle2, AlertTriangle, HelpCircle, FileMinus, FilePlus, Layers } from 'lucide-react';
import { ComparisonSummary, MatchStatus } from '../types';

interface SummaryCardsProps {
  summary: ComparisonSummary;
  activeFilter: MatchStatus | 'ALL';
  onSelectFilter: (filter: MatchStatus | 'ALL') => void;
  file1Name: string;
  file2Name: string;
}

export function SummaryCards({
  summary,
  activeFilter,
  onSelectFilter,
  file1Name,
  file2Name,
}: SummaryCardsProps) {
  const totalCombined =
    summary.exactMatchCount +
    summary.matchCodeDiffNameCount +
    summary.matchNameDiffCodeCount +
    summary.onlyInFile1Count +
    summary.onlyInFile2Count;

  const cards = [
    {
      id: 'ALL' as const,
      label: 'Tất Cả Danh Mục',
      count: totalCombined,
      subText: `F1: ${summary.totalRowsFile1} dòng | F2: ${summary.totalRowsFile2} dòng`,
      icon: Layers,
      bgColor: 'bg-slate-50',
      activeBorder: 'border-slate-800 ring-2 ring-slate-800/10',
      textColor: 'text-slate-800',
      iconColor: 'text-slate-600',
      badgeBg: 'bg-slate-200 text-slate-800',
    },
    {
      id: 'EXACT_MATCH' as const,
      label: 'Trùng Khớp Tuyệt Đối',
      description: 'Trùng cả Mã và Tên',
      count: summary.exactMatchCount,
      subText: `${summary.totalRowsFile1 > 0 ? ((summary.exactMatchCount / summary.totalRowsFile1) * 100).toFixed(1) : 0}% danh mục F1`,
      icon: CheckCircle2,
      bgColor: 'bg-emerald-50/50',
      activeBorder: 'border-emerald-600 ring-2 ring-emerald-600/10',
      textColor: 'text-emerald-900',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      id: 'MATCH_CODE_DIFF_NAME' as const,
      label: 'Trùng Mã - Khác Tên',
      description: 'Cùng mã kỹ thuật nhưng tên khác',
      count: summary.matchCodeDiffNameCount,
      subText: 'Cần kiểm tra lại tên danh mục',
      icon: AlertTriangle,
      bgColor: 'bg-amber-50/50',
      activeBorder: 'border-amber-600 ring-2 ring-amber-600/10',
      textColor: 'text-amber-900',
      iconColor: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'MATCH_NAME_DIFF_CODE' as const,
      label: 'Trùng Tên - Khác Mã',
      description: 'Cùng tên kỹ thuật nhưng mã khác',
      count: summary.matchNameDiffCodeCount,
      subText: 'Cần kiểm tra quy chuẩn mã số',
      icon: HelpCircle,
      bgColor: 'bg-sky-50/50',
      activeBorder: 'border-sky-600 ring-2 ring-sky-600/10',
      textColor: 'text-sky-900',
      iconColor: 'text-sky-600',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    },
    {
      id: 'ONLY_IN_FILE_1' as const,
      label: 'Chỉ Có Ở File 1',
      description: `Thiếu trong ${file2Name || 'File 2'}`,
      count: summary.onlyInFile1Count,
      subText: 'Không tìm thấy ở File 2',
      icon: FileMinus,
      bgColor: 'bg-purple-50/50',
      activeBorder: 'border-purple-600 ring-2 ring-purple-600/10',
      textColor: 'text-purple-900',
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    },
    {
      id: 'ONLY_IN_FILE_2' as const,
      label: 'Chỉ Có Ở File 2',
      description: `Thiếu trong ${file1Name || 'File 1'}`,
      count: summary.onlyInFile2Count,
      subText: 'Không tìm thấy ở File 1',
      icon: FilePlus,
      bgColor: 'bg-rose-50/50',
      activeBorder: 'border-rose-600 ring-2 ring-rose-600/10',
      textColor: 'text-rose-900',
      iconColor: 'text-rose-600',
      badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isSelected = activeFilter === card.id;

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onSelectFilter(card.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                card.bgColor
              } ${
                isSelected
                  ? card.activeBorder + ' shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-xs font-semibold text-slate-700 leading-tight">
                    {card.label}
                  </span>
                  <Icon className={`w-4 h-4 shrink-0 ${card.iconColor}`} />
                </div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
                  {card.count.toLocaleString()}
                </div>
              </div>
              <div className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                {card.subText}
              </div>
            </button>
          );
        })}
      </div>

      {/* Internal Duplicate Warning Banner if any */}
      {(summary.duplicatesInFile1 > 0 || summary.duplicatesInFile2 > 0) && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cảnh báo trùng lặp nội bộ:</strong>{' '}
              {summary.duplicatesInFile1 > 0 && (
                <span>File 1 có {summary.duplicatesInFile1} bản ghi trùng mã lặp lại. </span>
              )}
              {summary.duplicatesInFile2 > 0 && (
                <span>File 2 có {summary.duplicatesInFile2} bản ghi trùng mã lặp lại. </span>
              )}
              (Đã tự động gom nhóm để so sánh chính xác).
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
