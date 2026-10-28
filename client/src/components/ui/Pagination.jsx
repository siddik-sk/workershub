import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page = 1, totalPages = 1, onChange, className = '' }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const start = Math.max(1, Math.min(page - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  for (let index = start; index <= end; index += 1) pages.push(index);

  return (
    <nav className={`flex flex-wrap items-center justify-between gap-3 ${className}`} aria-label="Pagination">
      <p className="text-sm text-navy-500">
        Page <span className="font-semibold text-navy-800">{page}</span> of{' '}
        <span className="font-semibold text-navy-800">{totalPages}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </button>
        {pages.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
              item === page
                ? 'bg-brand-600 text-white'
                : 'border border-navy-200 bg-white text-navy-600 hover:bg-navy-50'
            }`}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
