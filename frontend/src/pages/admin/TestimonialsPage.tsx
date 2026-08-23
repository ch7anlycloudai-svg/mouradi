import { useState, useEffect, FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { Testimonial } from '../../utils/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Star } from 'lucide-react';

interface TestimonialForm {
  name_ar: string;
  name_fr: string;
  content_ar: string;
  content_fr: string;
  rating: number;
  is_active: boolean;
  sort_order: string;
}

const emptyForm: TestimonialForm = {
  name_ar: '', name_fr: '', content_ar: '', content_fr: '',
  rating: 5, is_active: true, sort_order: '0',
};

export default function TestimonialsPage() {
  const { t } = useLanguage();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<TestimonialForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const data = await adminApi.getTestimonials();
      setTestimonials(Array.isArray(data) ? data : data.testimonials || []);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: Testimonial) => {
    setEditing(item);
    setForm({
      name_ar: item.name_ar, name_fr: item.name_fr,
      content_ar: item.content_ar, content_fr: item.content_fr,
      rating: item.rating, is_active: item.is_active,
      sort_order: String(item.sort_order),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name_ar: form.name_ar,
        name_fr: form.name_fr,
        content_ar: form.content_ar,
        content_fr: form.content_fr,
        rating: form.rating,
        is_active: form.is_active,
        sort_order: parseInt(form.sort_order) || 0,
      };
      if (editing) {
        await adminApi.updateTestimonial(editing.id, payload);
      } else {
        await adminApi.createTestimonial(payload);
      }
      toast.success(t.admin.settingsSaved);
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await adminApi.deleteTestimonial(id);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8" style={{ color: '#FE8B7C' }} viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#0A0A0A' }}>{t.admin.testimonials}</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: '#FE8B7C' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F47768')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FE8B7C')}
        >
          <Plus className="w-4 h-4" />
          {t.common.add}
        </button>
      </div>

      <div className="space-y-3">
        {testimonials.map((item) => (
          <div key={item.id} className="p-4 bg-white rounded-xl border" style={{ borderColor: '#EDEDED' }}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className="w-4 h-4"
                      fill={n <= item.rating ? '#FE8B7C' : 'none'}
                      style={{ color: n <= item.rating ? '#FE8B7C' : '#D1D5DB' }}
                    />
                  ))}
                </div>
                <p className="font-medium text-sm" style={{ color: '#0A0A0A' }}>
                  {item.name_ar} / {item.name_fr}
                </p>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: '#555555' }}>
                  {item.content_ar}
                </p>
                <span
                  className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={
                    item.is_active
                      ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                      : { backgroundColor: '#FEE2E2', color: '#991B1B' }
                  }
                >
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-3">
                <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#555555' }}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <p className="text-sm text-center py-10" style={{ color: '#555555' }}>{t.common.noResults}</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EDEDED' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
                {editing ? t.common.edit : t.common.add} {t.admin.testimonials}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#555555' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Name (AR)</label>
                  <input type="text" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Name (FR)</label>
                  <input type="text" value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Content (AR)</label>
                <textarea value={form.content_ar} onChange={(e) => setForm({ ...form, content_ar: e.target.value })} required rows={3} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Content (FR)</label>
                <textarea value={form.content_fr} onChange={(e) => setForm({ ...form, content_fr: e.target.value })} required rows={3} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid #EDEDED' }} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Rating</label>
                  <select value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-white" style={{ border: '1px solid #EDEDED' }}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} Star{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded accent-[#FE8B7C]" />
                    <span className="text-sm" style={{ color: '#0A0A0A' }}>Active</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: '#EDEDED' }}>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: '#EDEDED', color: '#555555' }}>
                  {t.common.cancel}
                </button>
                <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60" style={{ backgroundColor: '#FE8B7C' }} onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#F47768')} onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#FE8B7C')}>
                  {saving ? t.common.loading : t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
