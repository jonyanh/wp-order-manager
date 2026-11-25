import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  filters?: React.ReactNode;
  isFiltered?: boolean;
  onResetFilters?: () => void;
  className?: string;
  buttonText?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Tìm kiếm...',
  onClear,
  onSubmit,
  filters,
  isFiltered = false,
  onResetFilters,
  className = '',
  buttonText = 'Tìm',
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleClear = () => {
    onChange('');
    if (onClear) onClear();
  };

  return (
    <div
      className={`bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/85 shadow-2xs flex flex-wrap items-center justify-between gap-2 transition-all ${className}`}
    >
      {/* Compact Search Box (fixed width sm:w-64 md:w-72, never stretches wide) */}
      <form
        onSubmit={handleSubmit}
        className="relative w-full sm:w-64 md:w-72 flex items-center bg-slate-50 hover:bg-slate-50/80 focus-within:bg-white border border-slate-200/80 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 rounded-lg px-2 py-0.5 transition-all group shrink-0"
      >
        <Search className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-brand-600 shrink-0 transition-colors" />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent px-2 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
        />

        {/* Clear Button (X) */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors shrink-0 mr-1"
            title="Xóa nhanh"
          >
            <X className="w-3 h-3" />
          </button>
        )}

        {/* Ultra-compact Search Button */}
        <button
          type="submit"
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-[11px] font-semibold rounded-md shadow-2xs transition-all shrink-0"
        >
          <Search className="w-2.5 h-2.5" />
          <span>{buttonText}</span>
        </button>
      </form>

      {/* Filter dropdowns & Reset button */}
      {(filters || isFiltered) && (
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {filters}

          {/* Reset Filter Button */}
          {isFiltered && onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
