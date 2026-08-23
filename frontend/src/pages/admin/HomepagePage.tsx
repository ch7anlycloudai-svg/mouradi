import { useState, useEffect, FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { HeroBanner, PromoBanner } from '../../utils/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload } from 'lucide-react';

type Tab = 'hero' | 'promo';

export default function HomepagePage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>('hero');
  const [heroes, setHeroes] = useState<HeroBanner[]>([]);
  const [promos, setPromos] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);

  // Hero form state
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroBanner | null>(null);
  const [heroForm, setHeroForm] = useState({
    title_ar: '', title_fr: '', subtitle_ar: '', subtitle_fr: '',
    cta_text_ar: '', cta_text_fr: '', cta_link: '/products',
    is_active: true, sort_order: '0',
  });
  const [heroImage, setHeroImage] = useState<File | null>(null);
  const [heroPreview, setHeroPreview] = useState('');

  // Promo form state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoBanner | null>(null);
  const [promoForm, setPromoForm] = useState({
    title_ar: '', title_fr: '', link: '',
    is_active: true, sort_order: '0',
  });
  const [promoImage, setPromoImage] = useState<File | null>(null);
  const [promoPreview, setPromoPreview] = useState('');

  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [h, p] = await Promise.all([adminApi.getHeroBanners(), adminApi.getPromoBanners()]);
      setHeroes(Array.isArray(h) ? h : h.banners || []);
      setPromos(Array.isArray(p) ? p : p.banners || []);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Hero CRUD ---

  const openAddHero = () => {
    setEditingHero(null);
    setHeroForm({
      title_ar: '', title_fr: '', subtitle_ar: '', subtitle_fr: '',
      cta_text_ar: '', cta_text_fr: '', cta_link: '/products',
      is_active: true, sort_order: '0',
    });
    setHeroImage(null);
    setHeroPreview('');
    setShowHeroModal(true);
  };

  const openEditHero = (h: HeroBanner) => {
    setEditingHero(h);
    setHeroForm({
      title_ar: h.title_ar || '', title_fr: h.title_fr || '',
      subtitle_ar: h.subtitle_ar || '', subtitle_fr: h.subtitle_fr || '',
      cta_text_ar: h.cta_text_ar || '', cta_text_fr: h.cta_text_fr || '',
      cta_link: h.cta_link || '/products',
      is_active: h.is_active, sort_order: String(h.sort_order),
    });
    setHeroImage(null);
    setHeroPreview(h.image_url);
    setShowHeroModal(true);
  };

  const submitHero = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title_ar', heroForm.title_ar);
      fd.append('title_fr', heroForm.title_fr);
      fd.append('subtitle_ar', heroForm.subtitle_ar);
      fd.append('subtitle_fr', heroForm.subtitle_fr);
      fd.append('cta_text_ar', heroForm.cta_text_ar);
      fd.append('cta_text_fr', heroForm.cta_text_fr);
      fd.append('cta_link', heroForm.cta_link);
      fd.append('is_active', String(heroForm.is_active));
      fd.append('sort_order', heroForm.sort_order);
      if (heroImage) fd.append('image', heroImage);

      if (editingHero) {
        await adminApi.updateHeroBanner(editingHero.id, fd);
      } else {
        await adminApi.createHeroBanner(fd);
      }
      toast.success(t.admin.settingsSaved);
      setShowHeroModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const deleteHero = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await adminApi.deleteHeroBanner(id);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  // --- Promo CRUD ---

  const openAddPromo = () => {
    setEditingPromo(null);
    setPromoForm({ title_ar: '', title_fr: '', link: '', is_active: true, sort_order: '0' });
    setPromoImage(null);
    setPromoPreview('');
    setShowPromoModal(true);
  };

  const openEditPromo = (p: PromoBanner) => {
    setEditingPromo(p);
    setPromoForm({
      title_ar: p.title_ar || '', title_fr: p.title_fr || '',
      link: p.link || '', is_active: p.is_active, sort_order: String(p.sort_order),
    });
    setPromoImage(null);
    setPromoPreview(p.image_url);
    setShowPromoModal(true);
  };

  const submitPromo = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title_ar', promoForm.title_ar);
      fd.append('title_fr', promoForm.title_fr);
      fd.append('link', promoForm.link);
      fd.append('is_active', String(promoForm.is_active));
      fd.append('sort_order', promoForm.sort_order);
      if (promoImage) fd.append('image', promoImage);

      if (editingPromo) {
        await adminApi.updatePromoBanner(editingPromo.id, fd);
      } else {
        await adminApi.createPromoBanner(fd);
      }
      toast.success(t.admin.settingsSaved);
      setShowPromoModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const deletePromo = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await adminApi.deletePromoBanner(id);
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
      <h2 className="text-xl font-bold mb-6" style={{ color: '#0A0A0A' }}>{t.admin.homepage}</h2>

      {/* Tabs */}
      <div className="flex border-b mb-6" style={{ borderColor: '#EDEDED' }}>
        <button
          onClick={() => setTab('hero')}
          className="px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
          style={tab === 'hero'
            ? { borderColor: '#FE8B7C', color: '#FE8B7C' }
            : { borderColor: 'transparent', color: '#555555' }}
        >
          {t.admin.heroManagement}
        </button>
        <button
          onClick={() => setTab('promo')}
          className="px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
          style={tab === 'promo'
            ? { borderColor: '#FE8B7C', color: '#FE8B7C' }
            : { borderColor: 'transparent', color: '#555555' }}
        >
          {t.admin.bannerManagement}
        </button>
      </div>

      {/* Hero Tab */}
      {tab === 'hero' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddHero}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: '#FE8B7C' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F47768')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FE8B7C')}
            >
              <Plus className="w-4 h-4" /> {t.common.add}
            </button>
          </div>
          <div className="space-y-3">
            {heroes.map((h) => (
              <div key={h.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border" style={{ borderColor: '#EDEDED' }}>
                <div className="w-28 h-16 bg-gray-100 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={h.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: '#0A0A0A' }}>
                    {h.title_ar || h.title_fr || 'Banner'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#555555' }}>
                    {h.is_active ? 'Active' : 'Inactive'} | Sort: {h.sort_order}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEditHero(h)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#555555' }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteHero(h.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {heroes.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: '#555555' }}>{t.common.noResults}</p>
            )}
          </div>
        </>
      )}

      {/* Promo Tab */}
      {tab === 'promo' && (
        <>
          <div className="flex justify-end mb-4">
            <button
              onClick={openAddPromo}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: '#FE8B7C' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F47768')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FE8B7C')}
            >
              <Plus className="w-4 h-4" /> {t.common.add}
            </button>
          </div>
          <div className="space-y-3">
            {promos.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border" style={{ borderColor: '#EDEDED' }}>
                <div className="w-28 h-16 bg-gray-100 flex-shrink-0 overflow-hidden rounded-lg">
                  <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" style={{ color: '#0A0A0A' }}>
                    {p.title_ar || p.title_fr || 'Promo'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#555555' }}>
                    {p.is_active ? 'Active' : 'Inactive'} | Sort: {p.sort_order}
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEditPromo(p)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#555555' }}>
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deletePromo(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {promos.length === 0 && (
              <p className="text-sm text-center py-10" style={{ color: '#555555' }}>{t.common.noResults}</p>
            )}
          </div>
        </>
      )}

      {/* Hero Modal */}
      {showHeroModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EDEDED' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
                {editingHero ? t.common.edit : t.common.add} Hero Banner
              </h3>
              <button onClick={() => setShowHeroModal(false)} style={{ color: '#555555' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitHero} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Title (AR)</label>
                  <input type="text" value={heroForm.title_ar} onChange={(e) => setHeroForm({ ...heroForm, title_ar: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Title (FR)</label>
                  <input type="text" value={heroForm.title_fr} onChange={(e) => setHeroForm({ ...heroForm, title_fr: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Subtitle (AR)</label>
                  <textarea value={heroForm.subtitle_ar} onChange={(e) => setHeroForm({ ...heroForm, subtitle_ar: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Subtitle (FR)</label>
                  <textarea value={heroForm.subtitle_fr} onChange={(e) => setHeroForm({ ...heroForm, subtitle_fr: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>CTA Text (AR)</label>
                  <input type="text" value={heroForm.cta_text_ar} onChange={(e) => setHeroForm({ ...heroForm, cta_text_ar: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>CTA Text (FR)</label>
                  <input type="text" value={heroForm.cta_text_fr} onChange={(e) => setHeroForm({ ...heroForm, cta_text_fr: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>CTA Link</label>
                <input type="text" value={heroForm.cta_link} onChange={(e) => setHeroForm({ ...heroForm, cta_link: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Sort Order</label>
                  <input type="number" value={heroForm.sort_order} onChange={(e) => setHeroForm({ ...heroForm, sort_order: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={heroForm.is_active} onChange={(e) => setHeroForm({ ...heroForm, is_active: e.target.checked })} className="w-4 h-4 rounded accent-[#FE8B7C]" />
                    <span className="text-sm" style={{ color: '#0A0A0A' }}>Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0A0A0A' }}>Image</label>
                {heroPreview && <img src={heroPreview} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />}
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#EDEDED' }}>
                  <Upload className="w-5 h-5" style={{ color: '#555555' }} />
                  <span className="text-sm" style={{ color: '#555555' }}>Upload Image</span>
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setHeroImage(f); setHeroPreview(URL.createObjectURL(f)); } }} className="hidden" />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: '#EDEDED' }}>
                <button type="button" onClick={() => setShowHeroModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: '#EDEDED', color: '#555555' }}>
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

      {/* Promo Modal */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EDEDED' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
                {editingPromo ? t.common.edit : t.common.add} Promo Banner
              </h3>
              <button onClick={() => setShowPromoModal(false)} style={{ color: '#555555' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitPromo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Title (AR)</label>
                  <input type="text" value={promoForm.title_ar} onChange={(e) => setPromoForm({ ...promoForm, title_ar: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Title (FR)</label>
                  <input type="text" value={promoForm.title_fr} onChange={(e) => setPromoForm({ ...promoForm, title_fr: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Link</label>
                <input type="text" value={promoForm.link} onChange={(e) => setPromoForm({ ...promoForm, link: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} placeholder="/products?category=..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Sort Order</label>
                  <input type="number" value={promoForm.sort_order} onChange={(e) => setPromoForm({ ...promoForm, sort_order: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={promoForm.is_active} onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })} className="w-4 h-4 rounded accent-[#FE8B7C]" />
                    <span className="text-sm" style={{ color: '#0A0A0A' }}>Active</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0A0A0A' }}>Image</label>
                {promoPreview && <img src={promoPreview} alt="" className="w-full h-32 object-cover rounded-lg mb-3" />}
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#EDEDED' }}>
                  <Upload className="w-5 h-5" style={{ color: '#555555' }} />
                  <span className="text-sm" style={{ color: '#555555' }}>Upload Image</span>
                  <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPromoImage(f); setPromoPreview(URL.createObjectURL(f)); } }} className="hidden" />
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: '#EDEDED' }}>
                <button type="button" onClick={() => setShowPromoModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: '#EDEDED', color: '#555555' }}>
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
