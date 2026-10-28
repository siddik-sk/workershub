import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';
import { categoryApi, publicApi, workerApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import WorkerCard from '../../components/workers/WorkerCard';
import RatingStars from '../../components/workers/RatingStars';
import Button from '../../components/ui/Button';
import { CategoryIcon } from '../../utils/categoryIcons';
import { EmptyState } from '../../components/ui/Feedback';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Search your service',
    description: 'Choose a profession and your city. Browse verified professionals with real experience, availability and starting charges.',
  },
  {
    icon: CalendarCheck,
    step: '02',
    title: 'Book an appointment',
    description: 'Describe the job, pick a time and send your request. You receive a unique booking reference and live status updates.',
  },
  {
    icon: BadgeCheck,
    step: '03',
    title: 'Get it done',
    description: 'Your professional accepts, arrives and completes the job. Follow every step and leave a review afterwards.',
  },
];

const reasons = [
  {
    icon: ShieldCheck,
    title: 'Verified professionals',
    text: 'Worker applications are reviewed by an administrator before profiles can appear in search or receive bookings.',
  },
  {
    icon: Zap,
    title: 'Real-time updates',
    text: 'Booking requests, acceptance and completion updates arrive instantly — and remain stored if you are offline.',
  },
  {
    icon: MapPin,
    title: 'Genuinely local',
    text: 'Search by city, locality, profession and experience to find skilled help close to home.',
  },
  {
    icon: Clock3,
    title: 'Clear records',
    text: 'Every booking has a reference, a timeline and a status that both sides can trust.',
  },
];

function HeroPreview({ stats, featured }) {
  const worker = featured[0];
  return (
    <div className="relative mx-auto w-full max-w-md lg:ml-auto">
      <div className="absolute -right-8 -top-10 h-48 w-48 rounded-full bg-brand-200/40 blur-2xl" />
      <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-sky-200/30 blur-2xl" />

      <div className="relative card overflow-hidden p-0 shadow-lift">
        <div className="flex items-center justify-between border-b border-navy-100 bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
              <Wrench className="h-4 w-4 text-brand-300" />
            </span>
            <div>
              <p className="text-xs font-bold text-navy-900">WorkConnect</p>
              <p className="text-[10px] text-navy-400">Verified local professionals</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
            <ShieldCheck className="h-3 w-3" /> {stats?.approvedWorkers || 0} verified
          </span>
        </div>

        <div className="bg-gradient-to-b from-brand-50/70 to-white p-5">
          {worker ? (
            <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-800 ring-4 ring-white">
                  {worker.profileImage ? (
                    <img src={worker.profileImage} alt={worker.name} className="h-full w-full rounded-full object-cover" />
                  ) : (
                    worker.name.split(' ').map((part) => part[0]).slice(0, 2).join('')
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="truncate text-sm font-bold text-navy-900">{worker.name}</p>
                      <p className="mt-0.5 text-xs font-semibold text-brand-700">{worker.profession}</p>
                    </div>
                    {worker.totalReviews > 0 ? (
                      <span className="flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                        <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                        {Number(worker.averageRating).toFixed(1)}
                      </span>
                    ) : (
                      <span className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[10px] font-bold text-navy-500">New</span>
                    )}
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-navy-500">
                    <MapPin className="h-3 w-3" /> {worker.locality}, {worker.city}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-navy-50/80 px-3 py-2">
                <span className="text-[10px] text-navy-400">Starting charge</span>
                <span className="text-xs font-bold text-navy-900">
                  ${Number(worker.serviceCharge || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white/80 p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <BadgeCheck className="h-7 w-7" />
              </div>
              <p className="mt-3 text-sm font-bold text-navy-900">Verified professionals, ready to help</p>
              <p className="mt-1 text-xs text-navy-500">
                New worker applications appear here after administrator approval.
              </p>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {[
              { icon: CalendarCheck, title: 'Booking request sent', text: 'Reference and status created instantly' },
              { icon: Zap, title: 'Live notifications', text: 'Updates delivered and stored securely' },
              { icon: CheckCircle2, title: 'Job completed', text: 'Review your professional afterwards' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 rounded-xl border border-navy-100/80 bg-white/80 px-3 py-2.5 backdrop-blur">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-navy-800">{item.title}</p>
                  <p className="truncate text-[10px] text-navy-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-navy-100 bg-white px-4 py-3 shadow-lift sm:flex sm:items-center sm:gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <TrendingUp className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-navy-400">Platform activity</p>
          <p className="text-xs font-bold text-navy-900">{stats?.completedBookings || 0} completed bookings</p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  useDocumentTitle('Find trusted local professionals');
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchForm, setSearchForm] = useState({ profession: '', city: '' });

  useEffect(() => {
    let mounted = true;
    Promise.allSettled([categoryApi.list(), workerApi.featured(6), publicApi.stats()]).then((results) => {
      if (!mounted) return;
      if (results[0].status === 'fulfilled') setCategories(results[0].value.data.categories);
      if (results[1].status === 'fulfilled') setFeatured(results[1].value.data.workers);
      if (results[2].status === 'fulfilled') setStats(results[2].value.data);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const popularCategories = useMemo(() => categories.slice(0, 10), [categories]);

  function handleSearch(event) {
    event?.preventDefault();
    if (!searchForm.profession && !searchForm.city.trim()) {
      toast.info('Choose a service or enter your city to start searching.');
      navigate('/services');
      return;
    }
    const params = new URLSearchParams();
    if (searchForm.profession) params.set('profession', searchForm.profession);
    if (searchForm.city.trim()) params.set('city', searchForm.city.trim());
    navigate(`/services?${params.toString()}`);
  }

  return (
    <>
      <section className="relative overflow-hidden border-b border-navy-100 bg-gradient-to-b from-brand-50/60 via-white to-white">
        <div className="pointer-events-none absolute -right-40 -top-32 h-[32rem] w-[32rem] rounded-full bg-brand-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 top-40 h-[26rem] w-[26rem] rounded-full bg-sky-100/40 blur-3xl" />
        <div className="page-container relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Trusted local services</span>
            <h1 className="mt-5 max-w-2xl text-4xl font-extrabold leading-[1.08] tracking-tight text-navy-900 text-balance sm:text-5xl lg:text-6xl">
              Find trusted local professionals for every home service.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-navy-500 sm:text-lg">
              Book skilled electricians, carpenters, plumbers, and other professionals in your area with ease.
              Verified profiles, transparent charges and booking updates you can rely on.
            </p>

            <form onSubmit={handleSearch} className="mt-7 max-w-xl rounded-2xl border border-navy-100 bg-white p-2 shadow-soft sm:flex sm:items-center">
              <label className="sr-only" htmlFor="hero-service">Service</label>
              <div className="relative flex-1">
                <Wrench className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <select
                  id="hero-service"
                  value={searchForm.profession}
                  onChange={(event) => setSearchForm((current) => ({ ...current, profession: event.target.value }))}
                  className="w-full appearance-none rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-8 text-sm font-medium text-navy-800 focus:ring-0"
                >
                  <option value="">All services</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div className="my-1 h-px bg-navy-100 sm:mx-1 sm:my-0 sm:h-8 sm:w-px" />
              <label className="sr-only" htmlFor="hero-city">City</label>
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  id="hero-city"
                  value={searchForm.city}
                  onChange={(event) => setSearchForm((current) => ({ ...current, city: event.target.value }))}
                  placeholder="Your city"
                  className="w-full rounded-xl border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-navy-800 placeholder:text-navy-300 focus:ring-0"
                />
              </div>
              <Button type="submit" icon={Search} className="mt-2 w-full sm:mt-0 sm:w-auto">
                Find a professional
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-navy-500">
              <span className="font-semibold text-navy-700">Popular:</span>
              {popularCategories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  to={`/services?profession=${category.slug}`}
                  className="rounded-full border border-navy-200 bg-white/70 px-2.5 py-1 font-medium transition hover:border-brand-300 hover:text-brand-800"
                >
                  {category.name}
                </Link>
              ))}
              {popularCategories.length === 0 && <span className="text-navy-400">Services loading...</span>}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-navy-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Admin-reviewed professionals</span>
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-brand-600" /> Real-time booking updates</span>
              <Link to="/worker/register" className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800">
                Join as a worker <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <HeroPreview stats={stats} featured={featured} />
        </div>

        <div className="border-t border-navy-100 bg-white/70">
          <div className="page-container grid grid-cols-2 gap-4 py-6 sm:grid-cols-4">
            {[
              { label: 'Verified professionals', value: stats?.approvedWorkers ?? 0, icon: BadgeCheck },
              { label: 'Completed bookings', value: stats?.completedBookings ?? 0, icon: CheckCircle2 },
              { label: 'Service categories', value: stats?.activeCategories ?? 0, icon: Wrench },
              {
                label: stats?.totalReviews ? 'Average rating' : 'Customer accounts',
                value: stats?.totalReviews ? `${stats.averageRating.toFixed(1)} / 5` : stats?.customers ?? 0,
                icon: stats?.totalReviews ? Star : Users,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <item.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-lg font-extrabold leading-none text-navy-900">{loading ? '—' : item.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-navy-400">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="section-pad">
        <div className="page-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">Popular services</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">What do you need help with?</h2>
              <p className="mt-2 text-sm text-navy-500">Explore the services local professionals offer on WorkConnect.</p>
            </div>
            <Link to="/services" className="btn-outline btn-sm">View all professionals <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {loading
              ? Array.from({ length: 10 }).map((_, index) => <div key={index} className="skeleton h-32" />)
              : popularCategories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/services?profession=${category.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-navy-100 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                      <CategoryIcon name={category.icon} className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-sm font-bold text-navy-900">{category.name}</p>
                    <p className="mt-0.5 text-[11px] text-navy-400">
                      {category.workerCount ? `${category.workerCount} professional${category.workerCount === 1 ? '' : 's'}` : 'Be the first professional'}
                    </p>
                    <ArrowRight className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-navy-200 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                  </Link>
                ))}
          </div>
          {!loading && popularCategories.length === 0 && (
            <EmptyState className="mt-8" icon={Wrench} title="Service categories are being set up" description="An administrator needs to add active service categories before professionals can be listed." />
          )}
        </div>
      </section>

      <section id="how-it-works" className="section-pad border-y border-navy-100 bg-navy-50/40">
        <div className="page-container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">How it works</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">From search to service in three steps</h2>
            <p className="mt-2 text-sm text-navy-500">A simple, transparent booking flow for customers and professionals.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative card p-6">
                <span className="absolute right-5 top-5 text-sm font-extrabold tracking-wider text-navy-100">{step.step}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-900 text-brand-300">
                  <step.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-navy-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-navy-500">{step.description}</p>
                {index < steps.length - 1 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-navy-300 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad">
        <div className="page-container">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="eyebrow">Featured professionals</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Available, reviewed and ready to help</h2>
              <p className="mt-2 text-sm text-navy-500">Only approved, active professionals can appear in search results.</p>
            </div>
            <Link to="/services" className="btn-outline btn-sm">Browse all <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-72" />)
              : featured.map((worker) => <WorkerCard key={worker.id} worker={worker} />)}
          </div>
          {!loading && featured.length === 0 && (
            <EmptyState
              className="mt-8"
              icon={Users}
              title="No approved professionals yet"
              description="Once a worker application is approved by an administrator, their profile will appear here and in search results."
              action={<Link to="/worker/register" className="btn-primary btn-sm">Apply as a professional</Link>}
            />
          )}
        </div>
      </section>

      <section className="section-pad border-y border-navy-100 bg-gradient-to-b from-white to-brand-50/40">
        <div className="page-container grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="eyebrow">Why WorkConnect</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">A safer way to book local help</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-navy-500">
              WorkConnect is designed around verification, clear records and responsible access. Customers can book with
              confidence and professionals can focus on doing great work.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/services" className="btn-primary">Find a professional</Link>
              <Link to="/worker/register" className="btn-outline">Join as a worker</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div key={reason.title} className="card p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <reason.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-navy-900">{reason.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-navy-500">{reason.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {stats?.totalReviews > 0 && stats.recentReviews?.length > 0 && (
        <section className="section-pad">
          <div className="page-container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">Customer reviews</span>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">Genuine feedback from completed jobs</h2>
                <p className="mt-2 flex items-center gap-2 text-sm text-navy-500">
                  <RatingStars rating={stats.averageRating} showValue />
                  <span>from {stats.totalReviews} verified review{stats.totalReviews === 1 ? '' : 's'}</span>
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stats.recentReviews.map((review) => (
                <article key={review.id} className="card flex flex-col p-5">
                  <Quote className="h-5 w-5 text-brand-300" />
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-navy-600">“{review.comment}”</p>
                  <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-navy-900">{review.customerName}</p>
                      <p className="text-[10px] text-navy-400">{review.profession} · {review.workerName}</p>
                    </div>
                    <RatingStars rating={review.rating} size="h-3.5 w-3.5" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="pb-16 sm:pb-24">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-3xl bg-navy-950 px-6 py-12 sm:px-12 sm:py-16">
            <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
            <div className="absolute -bottom-24 left-1/4 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-300">
                  <Sparkles className="h-3.5 w-3.5" /> Ready when you are
                </span>
                <h2 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl">
                  The right local professional is a booking away.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-navy-300">
                  Find skilled help for your home, manage every request from your dashboard, and stay informed with
                  real-time booking notifications.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
                <Link to="/services" className="btn-primary btn-lg">Find a professional <ArrowRight className="h-4 w-4" /></Link>
                <Link to="/worker/register" className="btn-lg inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-base font-semibold text-white transition hover:bg-white/10">
                  Join as a worker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
