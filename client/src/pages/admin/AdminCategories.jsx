import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Plus, Power, Tags, Users, Wrench } from 'lucide-react';
import { adminApi } from '../../services';
import { useToast } from '../../context/ToastContext';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { PageHeader } from '../../components/ui/Page';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import Modal from '../../components/ui/Modal';
import { Input, Textarea } from '../../components/ui/Fields';
import { EmptyState, PageLoader } from '../../components/ui/Feedback';
import { CategoryIcon } from '../../utils/categoryIcons';
import { SERVICE_ICONS } from '../../utils/constants';
import { getErrorMessage, getFieldErrors } from '../../utils/validation';

const emptyForm = {
  name: '',
  description: '',
  icon: 'Wrench',
  sortOrder: 0,
  isActive: true,
};

export default function AdminCategories() {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(null);

  useDocumentTitle('Service categories');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.categories();
      setCategories(response.data.categories);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load service categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(category) {
    setEditing(category);
    setForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'Wrench',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive,
    });
    setFormErrors({});
    setFormError('');
    setModalOpen(true);
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: '' }));
    setFormError('');
  }

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim() || form.name.trim().length < 2) {
      setFormErrors({ name: 'Category name must be at least 2 characters' });
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        icon: form.icon,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: Boolean(form.isActive),
      };
      const response = editing
        ? await adminApi.updateCategory(editing.id, payload)
        : await adminApi.createCategory(payload);
      toast.success(response.message || 'Service category saved.');
      setModalOpen(false);
      await load();
    } catch (err) {
      setFormErrors((current) => ({ ...current, ...getFieldErrors(err) }));
      setFormError(getErrorMessage(err, 'Could not save the category'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category) {
    setToggling(category.id);
    try {
      const response = await adminApi.updateCategory(category.id, { isActive: !category.isActive });
      toast.success(response.message || 'Category updated.');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the category'));
    } finally {
      setToggling(null);
    }
  }

  if (loading) return <PageLoader label="Loading service categories..." />;

  const activeCount = categories.filter((category) => category.isActive).length;
  const totalWorkers = categories.reduce((total, category) => total + (category.workerCount || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="Service catalogue"
        title="Service categories"
        description="Manage the trades customers can search and professionals can register under. Inactive categories are hidden from new registrations and bookings."
        actions={<Button icon={Plus} onClick={openCreate}>New category</Button>}
      />

      {error && (
        <Alert variant="error" className="mb-5" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Tags className="h-5 w-5" /></span>
          <div><p className="text-lg font-extrabold text-navy-900">{categories.length}</p><p className="text-[11px] text-navy-400">Total categories</p></div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><Power className="h-5 w-5" /></span>
          <div><p className="text-lg font-extrabold text-navy-900">{activeCount}</p><p className="text-[11px] text-navy-400">Active categories</p></div>
        </div>
        <div className="card flex items-center gap-3 p-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><Users className="h-5 w-5" /></span>
          <div><p className="text-lg font-extrabold text-navy-900">{totalWorkers}</p><p className="text-[11px] text-navy-400">Worker profiles assigned</p></div>
        </div>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="No service categories yet"
          description="Create the first category so professionals can register and customers can search."
          action={<Button icon={Plus} onClick={openCreate}>Create category</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <article key={category.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${category.isActive ? 'bg-brand-50 text-brand-700' : 'bg-navy-100 text-navy-400'}`}>
                    <CategoryIcon name={category.icon} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-navy-900">{category.name}</h2>
                    <p className="font-mono text-[10px] text-navy-400">/{category.slug}</p>
                  </div>
                </div>
                <span className={category.isActive ? 'badge-active' : 'badge-suspended'}>
                  {category.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-navy-500">
                {category.description || 'No description provided.'}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-navy-50/70 p-2.5 text-center">
                <div><p className="text-sm font-extrabold text-navy-900">{category.workerCount}</p><p className="text-[9px] text-navy-400">Workers</p></div>
                <div><p className="text-sm font-extrabold text-emerald-700">{category.approvedWorkerCount}</p><p className="text-[9px] text-navy-400">Approved</p></div>
                <div><p className="text-sm font-extrabold text-amber-700">{category.pendingWorkerCount}</p><p className="text-[9px] text-navy-400">Pending</p></div>
              </div>

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" icon={Edit3} className="flex-1" onClick={() => openEdit(category)}>
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Power}
                  className={`flex-1 ${category.isActive ? 'text-rose-600 hover:border-rose-200 hover:bg-rose-50' : 'text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50'}`}
                  loading={toggling === category.id}
                  onClick={() => toggleActive(category)}
                >
                  {category.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-navy-100 bg-navy-50/50 p-5">
        <p className="flex items-center gap-2 text-sm font-bold text-navy-900"><Wrench className="h-4 w-4 text-brand-600" /> How categories affect the marketplace</p>
        <p className="mt-1.5 text-xs leading-relaxed text-navy-500">
          Worker applications and booking requests are validated against active categories. Deactivating a category stops
          new registrations and bookings for that service without changing existing bookings. Category changes are written
          to the audit log.
        </p>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Create service category'}
        description={editing ? 'Update how this service appears across the marketplace.' : 'Add a new bookable service to the catalogue.'}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? 'Save changes' : 'Create category'}</Button>
          </>
        }
      >
        <form onSubmit={save} className="space-y-4" noValidate>
          {formError && <Alert variant="error" onDismiss={() => setFormError('')}>{formError}</Alert>}
          <Input
            label="Category name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            error={formErrors.name}
            placeholder="e.g. Electrical services"
            maxLength={80}
            required
          />
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder="Describe the services included in this category."
            maxLength={500}
            hint={`${form.description.length}/500 characters`}
          />
          <div>
            <p className="label">Icon</p>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {SERVICE_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => update('icon', icon)}
                  className={`flex h-10 items-center justify-center rounded-xl border transition ${
                    form.icon === icon
                      ? 'border-brand-300 bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                      : 'border-navy-200 bg-white text-navy-400 hover:border-navy-300'
                  }`}
                  aria-label={`Use ${icon} icon`}
                  aria-pressed={form.icon === icon}
                >
                  <CategoryIcon name={icon} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(event) => update('sortOrder', event.target.value)}
              hint="Lower numbers appear first."
            />
            <div>
              <p className="label">Status</p>
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-navy-200 px-3.5 py-2.5">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => update('isActive', event.target.checked)}
                  className="h-4 w-4 rounded border-navy-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-navy-800">Active and bookable</span>
              </label>
            </div>
          </div>
          <div className="rounded-xl bg-navy-50/70 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">Preview</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-brand-700 ring-1 ring-navy-100">
                <CategoryIcon name={form.icon} className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-navy-900">{form.name || 'Category name'}</p>
                <p className="text-[10px] text-navy-400">{form.description || 'Category description'}</p>
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
