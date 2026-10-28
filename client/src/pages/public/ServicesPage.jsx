import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Filter, MapPin, RotateCcw, Search, SlidersHorizontal, Sparkles, Wrench, X } from 'lucide-react';
import { categoryApi, workerApi } from '../../services';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import WorkerCard from '../../components/workers/WorkerCard';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/Feedback';
import { WEEK_DAYS } from '../../utils/constants';

const initialDraft = {
  search: '',
  profession: '',
  city: '',
  locality: '',
  minExperience: '',
  maxPrice: '',
  minRating: '',
  day: '',
  sort: '',
};

function paramsToDraft(params) {
  return {
    search: params.get('search') || '',
    profession: params.get('profession') || '',
    city: params.get('city') || '',
    locality: params.get('locality') || '',
    minExperience: params.get('minExperience') || '',
    maxPrice: params.get('maxPrice') || '',
    minRating: params.get('minRating') || '',
    day: params.get('day') || '',
    sort: params.get('sort') || '',
  };
}

export default function ServicesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(() => paramsToDraft(searchParams));
  const [showFilters, setShowFilters] = useState(false);
  const activeQuery = searchParams.toString();

  useDocumentTitle('Find local professionals');

  useEffect(() => {
    categoryApi.list().then((response) => setCategories(response.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = Object.fromEntries(new URLSearchParams(activeQuery).entries());
    setDraft(paramsToDraft(new URLSearchParams(activeQuery)));
    setLoading(true);
    setError('');
    workerApi
      .search({ ...params, limit: 9 })
      .then((response) => {
        setWorkers(response.data.workers);
        setPagination(response.data.pagination);
      })
      .catch((err) => setError(err.message || 'Could not load professionals'))
      .finally(() => setLoading(false));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeQuery]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.slug === searchParams.get('profession')),
    [categories, searchParams]
  );

  function update(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function applyFilters(event) {
    event?.preventDefault();
    const next = new URLSearchParams();
    Object.entries(draft).forEach(([key, value]) => {
      if (String(value).trim()) next.set(key, String(value).trim());
    });
    next.set('page', '1');
    setSearchParams(next);
  }

  function clearFilters() {
    setDraft(initialDraft);
    setSearchParams({ page: '1' });
  }

  function changePage(page) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  const activeFilterCount = Object.entries(paramsToDraft(searchParams)).filter(
    ([key, value]) => value && !(key === 'sort' && false)
  ).length;

  return (
    <>
      <section className="border-b border-navy-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="page-container py-10 sm:py-14">
          <span className="eyebrow"><Sparkles className="h-3.5 w-3.5" /> Browse professionals</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
            {activeCategory ? `${activeCategory.name}s near you` : 'Find the right local professional'}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-500">
            Search verified electricians, plumbers, carpenters, cleaners and more by city, locality, experience,
            availability and starting price.
          </p>

          <form onSubmit={applyFilters} className="mt-6 card p-3 sm:p-4">
            <div className="grid gap-2.5 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  value={draft.search}
                  onChange={(event) => update('search', event.target.value)}
                  placeholder="Search by name or keyword"
                  className="input pl-10"
                  aria-label="Search professionals"
                />
              </div>
              <select value={draft.profession} onChange={(event) => update('profession', event.target.value)} className="select" aria-label="Profession">
                <option value="">All professions</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>{category.name}</option>
                ))}
              </select>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                <input
                  value={draft.city}
                  onChange={(event) => update('city', event.target.value)}
                  placeholder="City"
                  className="input pl-10"
                  aria-label="City"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" icon={Search} className="flex-1 lg:flex-none">Search</Button>
                <button type="button" className="btn-outline lg:hidden" onClick={() => setShowFilters((value) => !value)}>
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                  {activeFilterCount > 0 && <span className="rounded-full bg-brand-600 px-1.5 text-[10px] text-white">{activeFilterCount}</span>}
                </button>
              </div>
            </div>

            <div className={`${showFilters ? 'grid' : 'hidden'} mt-3 gap-3 border-t border-navy-100 pt-3 sm:grid sm:grid-cols-2 lg:grid-cols-6`}>
              <div>
                <label className="label text-xs">Locality</label>
                <input value={draft.locality} onChange={(event) => update('locality', event.target.value)} placeholder="e.g. Gulberg" className="input py-2 text-xs" />
              </div>
              <div>
                <label className="label text-xs">Min. experience</label>
                <select value={draft.minExperience} onChange={(event) => update('minExperience', event.target.value)} className="select py-2 text-xs">
                  <option value="">Any</option>
                  <option value="1">1+ years</option>
                  <option value="3">3+ years</option>
                  <option value="5">5+ years</option>
                  <option value="10">10+ years</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Max. starting charge</label>
                <input type="number" min="0" value={draft.maxPrice} onChange={(event) => update('maxPrice', event.target.value)} placeholder="Any" className="input py-2 text-xs" />
              </div>
              <div>
                <label className="label text-xs">Minimum rating</label>
                <select value={draft.minRating} onChange={(event) => update('minRating', event.target.value)} className="select py-2 text-xs">
                  <option value="">Any rating</option>
                  <option value="3">3+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="4.5">4.5+ stars</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">Available on</label>
                <select value={draft.day} onChange={(event) => update('day', event.target.value)} className="select py-2 text-xs">
                  <option value="">Any day</option>
                  {WEEK_DAYS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs">Sort by</label>
                <select value={draft.sort} onChange={(event) => update('sort', event.target.value)} className="select py-2 text-xs">
                  <option value="">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="experience">Most experienced</option>
                  <option value="price_low">Lowest charge</option>
                  <option value="price_high">Highest charge</option>
                  <option value="newest">Newest</option>
                </select>
              </div>
              <div className="flex items-end lg:col-span-6">
                <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-navy-500 hover:text-navy-800">
                  <RotateCcw className="h-3.5 w-3.5" /> Reset all filters
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section className="page-container py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-navy-900">
              {loading ? 'Finding professionals...' : `${pagination?.total || 0} professional${pagination?.total === 1 ? '' : 's'} found`}
            </h2>
            <p className="mt-0.5 text-xs text-navy-400">
              {searchParams.get('city') ? `Showing results in ${searchParams.get('city')}` : 'All approved and active professionals'}
            </p>
          </div>
          {activeFilterCount > 0 && (
            <button type="button" onClick={clearFilters} className="btn-ghost btn-sm">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-72" />)}
          </div>
        ) : workers.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={Wrench}
            title="No professionals match your search"
            description="Try a different city, widen your price range, or remove some filters. New professionals join regularly."
            action={<Button variant="outline" icon={RotateCcw} onClick={clearFilters}>Reset filters</Button>}
          />
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workers.map((worker) => <WorkerCard key={worker.id} worker={worker} />)}
            </div>
            <Pagination
              className="mt-8"
              page={pagination?.page || 1}
              totalPages={pagination?.totalPages || 1}
              onChange={changePage}
            />
          </>
        )}

        <div className="mt-12 rounded-2xl border border-navy-100 bg-navy-50/50 p-6 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-700 shadow-sm"><Filter className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-bold text-navy-900">Didn’t find what you need?</p>
              <p className="mt-0.5 text-xs text-navy-500">Tell us what service you are looking for and we will help you find the right professional.</p>
            </div>
          </div>
          <Link to="/support" className="btn-outline btn-sm mt-3 sm:mt-0">Contact support</Link>
        </div>
      </section>
    </>
  );
}
