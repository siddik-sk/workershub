import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Wrench,
} from 'lucide-react';
import { workerApi } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import RatingStars from '../../components/workers/RatingStars';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { formatCurrency, formatDate, formatTime } from '../../utils/format';
import { WEEK_DAYS } from '../../utils/constants';

const dayFull = Object.fromEntries(WEEK_DAYS.map((day) => [day.value, day.label.replace('Mon', 'Monday').replace('Tue', 'Tuesday').replace('Wed', 'Wednesday').replace('Thu', 'Thursday').replace('Fri', 'Friday').replace('Sat', 'Saturday').replace('Sun', 'Sunday')]));

export default function WorkerPublicPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useDocumentTitle(worker?.name ? `${worker.name} · ${worker.profession}` : 'Professional profile');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    workerApi
      .get(id)
      .then((response) => {
        if (!mounted) return;
        setWorker(response.data.worker);
        setReviews(response.data.reviews);
      })
      .catch((err) => {
        if (mounted) setError(err.status === 404 ? 'This professional profile is no longer available.' : err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id]);

  function handleBook() {
    if (!worker) return;
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

  if (loading) return <div className="page-container py-12"><PageLoader label="Loading professional profile..." /></div>;

  if (error || !worker) {
    return (
      <div className="page-container py-16">
        <EmptyState
          icon={Wrench}
          title="Professional not found"
          description={error || 'This profile may be pending review or no longer active.'}
          action={<Link to="/services" className="btn-primary">Browse professionals</Link>}
        />
      </div>
    );
  }

  const availability = worker.availability || {};
  const availableDays = (availability.days || []).map((day) => dayFull[day] || day);
  const offeredServices = [
    { id: worker.categoryId, name: worker.profession, icon: worker.categoryIcon },
    ...(worker.additionalServices || []),
  ];

  return (
    <>
      <section className="border-b border-navy-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="page-container py-8">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800">
            <ArrowLeft className="h-4 w-4" /> Back to professionals
          </Link>
          <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={worker.name} src={worker.profileImage} size="xl" ring />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-navy-900">{worker.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified professional
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                  <CategoryIcon name={worker.categoryIcon} className="h-4 w-4" /> {worker.profession}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-navy-500">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {worker.locality}, {worker.city}</span>
                  <span className="inline-flex items-center gap-1.5"><Wrench className="h-4 w-4" /> {worker.experienceYears} years experience</span>
                  <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> {worker.completedJobs} jobs completed</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <RatingStars rating={worker.averageRating} showValue={worker.totalReviews > 0} />
                  <span className="text-xs text-navy-400">
                    {worker.totalReviews > 0 ? `(${worker.totalReviews} review${worker.totalReviews === 1 ? '' : 's'})` : 'No reviews yet'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBook} size="lg" disabled={availability.isAvailable === false}>
                Book now
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="page-container grid gap-6 py-10 lg:grid-cols-[1.55fr_0.75fr] lg:items-start">
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-bold text-navy-900">About {worker.name.split(' ')[0]}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-navy-600">
              {worker.description || `I am a professional ${worker.profession.toLowerCase()} with ${worker.experienceYears} years of experience serving customers in ${worker.city}.`}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400"><MapPin className="h-3.5 w-3.5" /> Service area</p>
                <p className="mt-1.5 text-sm font-medium text-navy-800">{worker.city}</p>
                <p className="mt-0.5 text-xs text-navy-500">{[worker.locality, ...(worker.serviceAreas || [])].filter((item, index, arr) => arr.indexOf(item) === index).join(' · ')}</p>
              </div>
              <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy-400"><CalendarDays className="h-3.5 w-3.5" /> Availability</p>
                <p className="mt-1.5 text-sm font-medium text-navy-800">
                  {availability.isAvailable === false ? 'Not accepting bookings' : 'Accepting bookings'}
                </p>
                <p className="mt-0.5 text-xs text-navy-500">
                  {availableDays.length ? availableDays.join(', ') : 'Contact for availability'}
                  {availability.startTime && availability.endTime ? ` · ${formatTime(availability.startTime)}–${formatTime(availability.endTime)}` : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-navy-900">Services offered</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {offeredServices.map((service, index) => (
                <div key={`${service.id}-${index}`} className="flex items-center gap-3 rounded-xl border border-navy-100 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <CategoryIcon name={service.icon || 'Wrench'} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy-800">{service.name}</p>
                    <p className="text-[11px] text-navy-400">{index === 0 ? 'Primary profession' : 'Additional service'}</p>
                  </div>
                  <span className="text-xs font-semibold text-navy-700">from {formatCurrency(worker.serviceCharge)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-navy-900">Customer reviews</h2>
              {worker.totalReviews > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(worker.averageRating).toFixed(1)} average
                </span>
              )}
            </div>
            {reviews.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-5 py-8 text-center">
                <MessageCircle className="mx-auto h-7 w-7 text-navy-300" />
                <p className="mt-2 text-sm font-medium text-navy-700">No reviews yet</p>
                <p className="mt-1 text-xs text-navy-400">Reviews appear after a customer completes and reviews a booking.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-navy-100 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-800">
                          {review.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-navy-900">{review.customerName}</p>
                          <p className="text-[10px] text-navy-400">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <RatingStars rating={review.rating} size="h-3.5 w-3.5" />
                    </div>
                    {review.comment && <p className="mt-3 text-sm leading-relaxed text-navy-600">{review.comment}</p>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24">
          <div className="card overflow-hidden">
            <div className="border-b border-navy-100 bg-gradient-to-br from-brand-50 to-white p-5">
              <p className="text-xs font-medium text-navy-500">Starting service charge</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-navy-900">{formatCurrency(worker.serviceCharge)}</p>
              <p className="mt-1 text-[11px] text-navy-400">Final cost depends on the work required.</p>
            </div>
            <div className="p-5">
              <div className="space-y-3 text-sm">
                <p className="flex items-start gap-2 text-navy-600">
                  <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>{availability.isAvailable === false ? 'Currently not accepting bookings' : `${availableDays.join(', ')}${availability.startTime ? ` · ${formatTime(availability.startTime)}–${formatTime(availability.endTime)}` : ''}`}</span>
                </p>
                <p className="flex items-start gap-2 text-navy-600">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Admin-verified professional profile</span>
                </p>
                <p className="flex items-start gap-2 text-navy-600">
                  <CalendarCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                  <span>Real-time booking status updates</span>
                </p>
              </div>
              <Button className="mt-5 w-full" size="lg" onClick={handleBook} disabled={availability.isAvailable === false}>
                {availability.isAvailable === false ? 'Not available' : 'Book this professional'}
              </Button>
              {!user && (
                <p className="mt-2 text-center text-[11px] text-navy-400">You will be asked to sign in or create a free customer account.</p>
              )}
              <p className="mt-4 border-t border-navy-100 pt-3 text-center text-[10px] leading-relaxed text-navy-400">
                Booking requests are sent only to this professional. Your contact details are shared to fulfil the service.
              </p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-navy-900 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Need help choosing?</p>
            <p className="mt-1.5 text-sm leading-relaxed text-navy-300">Compare profiles, charges and reviews. You can cancel a pending request at any time.</p>
            <Link to="/support" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">
              Contact support <ArrowLeft className="h-3 w-3 rotate-180" />
            </Link>
          </div>
        </aside>
      </section>
    </>
  );
}
