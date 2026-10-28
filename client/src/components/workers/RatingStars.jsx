import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, size = 'h-4 w-4', showValue = false, className = '' }) {
  const rounded = Math.round(Number(rating) || 0);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating || 0} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`${size} ${value <= rounded ? 'fill-amber-400 text-amber-400' : 'fill-navy-100 text-navy-200'}`}
        />
      ))}
      {showValue && <span className="ml-1 text-xs font-semibold text-navy-700">{Number(rating || 0).toFixed(1)}</span>}
    </span>
  );
}
