import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, MapPin, ShieldCheck, Star, Wrench } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const dayLabels = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

export default function WorkerCard({ worker, compact = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const availability = worker.availability || {};
  const days = (availability.days || []).map((day) => dayLabels[day] || day);
  const availabilityText = !availability.isAvailable
    ? 'Not accepting bookings'
    : days.length >= 6
      ? 'Available 6 days a week'
      : days.length
        ? `Available ${days.slice(0, 3).join(', ')}${days.length > 3 ? ' +' : ''}`
        : 'Availability on request';

  function handleBook() {
    if (!user) {
      navigate('/login', { state: { from: `/app/book/${worker.id}` } });
      return;
    }
    if (user.role !== 'customer') {
      toast.info('Only customer accounts can make bookings.', { title: 'Customer account required' });
      return;
    }
    navigate(`/app/book/${worker.id}`);
  }

  return (
    <article className="card-hover flex h-full flex-col p-5">
      <div className="flex items-start gap-3.5">
        <Avatar name={worker.name} src={worker.profileImage} size="lg" ring />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-bold text-navy-900">{worker.name}</h3>
              <p className="mt-0.5 flex items-center gap-1 text-xs font-semibold text-brand-700">
                <Wrench className="h-3 w-3" /> {worker.profession || 'Local professional'}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 rounded-lg bg-amber-50 px-1.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
              {worker.totalReviews > 0 ? Number(worker.averageRating).toFixed(1) : 'New'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-500">
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {worker.locality}, {worker.city}</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-600" /> Verified</span>
          </div>
        </div>
      </div>

      {!compact && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-navy-500">
          {worker.description || `${worker.experienceYears || 0} years of professional experience serving local customers.`}
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-navy-50/70 p-3 text-xs">
        <div>
          <p className="text-navy-400">Experience</p>
          <p className="mt-0.5 font-semibold text-navy-800">{worker.experienceYears || 0} years</p>
        </div>
        <div>
          <p className="text-navy-400">Starting from</p>
          <p className="mt-0.5 font-semibold text-navy-800">{formatCurrency(worker.serviceCharge)}</p>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-navy-500">
        <CalendarCheck className="h-3.5 w-3.5 text-brand-600" />
        {availabilityText}
        {worker.totalReviews > 0 && <span className="ml-auto text-navy-400">{worker.totalReviews} review{worker.totalReviews === 1 ? '' : 's'}</span>}
      </p>

      <div className="mt-4 flex gap-2 pt-1">
        <Link to={`/workers/${worker.id}`} className="btn-outline btn-sm flex-1">
          View profile
        </Link>
        <button
          type="button"
          onClick={handleBook}
          disabled={availability.isAvailable === false}
          className="btn-primary btn-sm flex-1"
        >
          Book now
        </button>
      </div>
    </article>
  );
}
