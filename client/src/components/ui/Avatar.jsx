import { User } from 'lucide-react';
import { assetUrl, initials } from '../../utils/format';

const sizeClasses = {
  xs: 'h-8 w-8 text-[10px]',
  sm: 'h-10 w-10 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

export default function Avatar({ name = '', src = '', size = 'md', className = '', ring = false }) {
  const sizes = sizeClasses[size] || sizeClasses.md;
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-100 to-brand-50 font-bold text-brand-800 ${sizes} ${ring ? 'ring-4 ring-white shadow-card' : ''} ${className}`}
      aria-hidden={!name}
    >
      {src ? (
        <img src={assetUrl(src)} alt={name || 'Profile photo'} className="h-full w-full object-cover" />
      ) : name ? (
        <span>{initials(name)}</span>
      ) : (
        <User className="h-1/2 w-1/2" />
      )}
    </div>
  );
}
