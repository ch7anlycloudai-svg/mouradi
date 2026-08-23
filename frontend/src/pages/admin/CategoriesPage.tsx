import { useState, useEffect, FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { Category } from '../../utils/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';

interface CategoryForm {
  name_ar: string;
  name_fr: string;
  sort_order: string;
}

const emptyForm: CategoryForm = { name_ar: '', name_fr: '', sort_order: '0' };

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  useEffect(() => {
    fetchCategories().finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImage(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name_ar: cat.name_ar, name_fr: cat.name_fr, sort_order: String(cat.sort_order) });
    setImage(null);
    setImagePreview(cat.image_url || '');
    setShowModal(true);
  };

  const handleImageChange = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name_ar', form.name_ar);
      fd.append('name_fr', form.name_fr);
      fd.append('sort_order', form.sort_order);
      if (image) fd.append('image', image);

      if (editing) {
        await adminApi.updateCategory(editing.id, fd);
      } else {
        await adminApi.createCategory(fd);
      }
      toast.success(editing ? t.admin.editCategory : t.admin.addCategory);
      setShowModal(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await adminApi.deleteCategory(id);
      toast.success(t.admin.deleteCategory);
      fetchCategories();
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
        <h2 className="text-xl font-bold" style={{ color: '#0A0A0A' }}>{t.admin.categories}</h2>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
          style={{ backgroundColor: '#FE8B7C' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F47768')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FE8B7C')}
        >
          <Plus className="w-4 h-4" />
          {t.admin.addCategory}
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#EDEDED' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#EDEDED' }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Image</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Name (AR)</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Name (FR)</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Sort Order</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center" style={{ color: '#555555' }}>
                    {t.common.noResults}
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors" style={{ borderColor: '#EDEDED' }}>
                    <td className="px-5 py-3">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: '#0A0A0A' }} dir="rtl">{cat.name_ar}</td>
                    <td className="px-5 py-3" style={{ color: '#0A0A0A' }}>{cat.name_fr}</td>
                    <td className="px-5 py-3" style={{ color: '#555555' }}>{cat.sort_order}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#555555' }}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EDEDED' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
                {editing ? t.admin.editCategory : t.admin.addCategory}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#555555' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Name (AR)</label>
                <input type="text" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Name (FR)</label>
                <input type="text" value={form.name_fr} onChange={(e) => setForm({ ...form, name_fr: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Sort Order</label>
                <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={{ border: '1px solid #EDEDED' }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0A0A0A' }}>Image</label>
                {imagePreview && (
                  <div className="mb-3">
                    <img src={imagePreview} alt="" className="w-24 h-24 rounded-lg object-cover" />
                  </div>
                )}
                <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#EDEDED' }}>
                  <Upload className="w-5 h-5" style={{ color: '#555555' }} />
                  <span className="text-sm" style={{ color: '#555555' }}>Upload Image</span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageChange(e.target.files)} className="hidden" />
                </label>
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
