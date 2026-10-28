import { Link } from 'react-router-dom';

export default function Logo({ to = '/', size = 'md', light = false, className = '' }) {
  const markSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-9 w-9';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 ${className}`} aria-label="WorkConnect home">
      <span className={`${markSize} grid shrink-0 place-items-center rounded-xl bg-navy-900 shadow-sm`}>
        <svg viewBox="0 0 64 64" className="h-[62%] w-[62%]" role="img" aria-label="WorkConnect mark">
          <path d="M18 19h8l6 20 6-20h8l-9 27H27z" fill="#58dfc9" />
          <circle cx="47" cy="18" r="4" fill="#ffffff" />
        </svg>
      </span>
      <span className={`${textSize} font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy-900'}`}>
        Work<span className="text-brand-500">Connect</span>
      </span>
    </Link>
  );
}
