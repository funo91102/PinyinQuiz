
interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));

  return (
    <div className="w-full bg-stone-100 border-b border-stone-200/60 p-4 sm:px-6 flex items-center justify-between shadow-sm">
      <div className="flex-1 max-w-xl bg-stone-200 h-3.5 rounded-full overflow-hidden relative shadow-inner">
        <div
          className="bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="ml-4 flex items-center space-x-2 shrink-0">
        <span className="text-xs text-stone-400 font-bold tracking-wide uppercase">進度</span>
        <span className="text-base font-extrabold text-stone-750">
          第 {current} / {total} 題
        </span>
      </div>
    </div>
  );
}
