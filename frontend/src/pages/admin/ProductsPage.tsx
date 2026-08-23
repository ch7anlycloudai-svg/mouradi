import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { Product, Category } from '../../utils/types';
import { formatPrice } from '../../utils/helpers';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

interface ColorEntry {
  name_ar: string;
  name_fr: string;
  hex_code: string;
}

interface ProductForm {
  name_ar: string;
  name_fr: string;
  description_ar: string;
  description_fr: string;
  price: string;
  old_price: string;
  category_id: string;
  is_available: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_on_sale: boolean;
  colors: ColorEntry[];
  sizes: string[];
}

const emptyForm: ProductForm = {
  name_ar: '',
  name_fr: '',
  description_ar: '',
  description_fr: '',
  price: '',
  old_price: '',
  category_id: '',
  is_available: true,
  is_featured: false,
  is_new_arrival: false,
  is_on_sale: false,
  colors: [],
  sizes: [],
};

export default function ProductsPage() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; image_url: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const data = await adminApi.getProducts();
      setProducts(Array.isArray(data) ? data : data.products || []);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await adminApi.getCategories();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => setLoading(false));
  }, []);

  /* ─── Modal open helpers ─── */

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setImages([]);
    setImagePreviews([]);
    setExistingImages([]);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name_ar: product.name_ar,
      name_fr: product.name_fr,
      description_ar: product.description_ar,
      description_fr: product.description_fr,
      price: String(product.price),
      old_price: product.old_price ? String(product.old_price) : '',
      category_id: product.category_id,
      is_available: product.is_available,
      is_featured: product.is_featured,
      is_new_arrival: product.is_new_arrival,
      is_on_sale: product.is_on_sale,
      colors:
        product.colors?.map((c) => ({
          name_ar: c.name_ar,
          name_fr: c.name_fr,
          hex_code: c.hex_code,
        })) || [],
      sizes: product.sizes?.map((s) => s.size) || [],
    });
    setImages([]);
    setImagePreviews([]);
    setExistingImages(
      product.images?.map((img) => ({ id: img.id, image_url: img.image_url })) || []
    );
    setShowModal(true);
  };

  /* ─── Image helpers ─── */

  const handleImageChange = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files);
    setImages((prev) => [...prev, ...newFiles]);
    const previews = newFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const removeNewImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = async (imageId: string) => {
    try {
      await adminApi.deleteProductImage(imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.success('Image deleted');
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  /* ─── Color helpers ─── */

  const addColor = () => {
    setForm((prev) => ({
      ...prev,
      colors: [...prev.colors, { name_ar: '', name_fr: '', hex_code: '#000000' }],
    }));
  };

  const updateColor = (index: number, field: keyof ColorEntry, value: string) => {
    setForm((prev) => {
      const colors = [...prev.colors];
      colors[index] = { ...colors[index], [field]: value };
      return { ...prev, colors };
    });
  };

  const removeColor = (index: number) => {
    setForm((prev) => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index),
    }));
  };

  /* ─── Size helper ─── */

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  /* ─── Submit ─── */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const fd = new FormData();
      fd.append('name_ar', form.name_ar);
      fd.append('name_fr', form.name_fr);
      fd.append('description_ar', form.description_ar);
      fd.append('description_fr', form.description_fr);
      fd.append('price', form.price);
      if (form.old_price) fd.append('old_price', form.old_price);
      fd.append('category_id', form.category_id);
      fd.append('is_available', String(form.is_available));
      fd.append('is_featured', String(form.is_featured));
      fd.append('is_new_arrival', String(form.is_new_arrival));
      fd.append('is_on_sale', String(form.is_on_sale));
      fd.append('colors', JSON.stringify(form.colors));
      fd.append('sizes', JSON.stringify(form.sizes));
      images.forEach((file) => fd.append('images', file));

      if (editing) {
        await adminApi.updateProduct(editing.id, fd);
        toast.success(t.admin.editProduct);
      } else {
        await adminApi.createProduct(fd);
        toast.success(t.admin.addProduct);
      }

      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  /* ─── Delete ─── */

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await adminApi.deleteProduct(id);
      toast.success(t.admin.deleteProduct);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  /* ─── Loading state ─── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: '#0A0A0A' }}>
          {t.admin.products}
        </h2>
        <button
          onClick={openAdd}
          className="btn-primary inline-flex items-center gap-2 rounded-lg text-sm !px-4 !py-2.5"
        >
          <Plus className="w-4 h-4" />
          {t.admin.addProduct}
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#EDEDED' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#EDEDED' }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                  Image
                </th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                  {t.admin.products}
                </th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                  {t.product.price}
                </th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                  {t.product.category}
                </th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                  Status
                </th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center" style={{ color: '#555555' }}>
                    {t.product.noProducts}
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const primaryImage =
                    product.images?.find((i) => i.is_primary) || product.images?.[0];
                  return (
                    <tr
                      key={product.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#EDEDED' }}
                    >
                      {/* Thumbnail */}
                      <td className="px-5 py-3">
                        {primaryImage ? (
                          <img
                            src={primaryImage.image_url}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </td>

                      {/* Name (AR primary, secondary underneath) */}
                      <td className="px-5 py-3">
                        <p className="font-medium" style={{ color: '#0A0A0A' }}>
                          {product.name_ar}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: '#555555' }}>
                          {product.name_fr}
                        </p>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3" style={{ color: '#0A0A0A' }}>
                        {formatPrice(product.price)} {t.common.currencyCode}
                        {product.old_price && (
                          <span
                            className="block text-xs line-through"
                            style={{ color: '#555555' }}
                          >
                            {formatPrice(product.old_price)}
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3" style={{ color: '#555555' }}>
                        {product.category
                          ? lang === 'ar'
                            ? product.category.name_ar
                            : product.category.name_fr
                          : '-'}
                      </td>

                      {/* Status badges: is_available + is_featured */}
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                            style={
                              product.is_available
                                ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                                : { backgroundColor: '#FEE2E2', color: '#991B1B' }
                            }
                          >
                            {product.is_available ? t.product.available : t.product.unavailable}
                          </span>
                          {product.is_featured && (
                            <span
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}
                            >
                              {t.product.featured}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ color: '#555555' }}
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl my-8 shadow-xl">
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: '#EDEDED' }}
            >
              <h3 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
                {editing ? t.admin.editProduct : t.admin.addProduct}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#555555' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (scrollable) */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* ── Names ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    Name (AR)
                  </label>
                  <input
                    type="text"
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    required
                    className="input-field"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    Name (FR)
                  </label>
                  <input
                    type="text"
                    value={form.name_fr}
                    onChange={(e) => setForm({ ...form, name_fr: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              {/* ── Descriptions ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    Description (AR)
                  </label>
                  <textarea
                    value={form.description_ar}
                    onChange={(e) => setForm({ ...form, description_ar: e.target.value })}
                    rows={3}
                    className="input-field resize-none"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    Description (FR)
                  </label>
                  <textarea
                    value={form.description_fr}
                    onChange={(e) => setForm({ ...form, description_fr: e.target.value })}
                    rows={3}
                    className="input-field resize-none"
                  />
                </div>
              </div>

              {/* ── Price / Old Price / Category ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    {t.product.price}
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    min="0"
                    step="any"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    Old Price
                  </label>
                  <input
                    type="number"
                    value={form.old_price}
                    onChange={(e) => setForm({ ...form, old_price: e.target.value })}
                    min="0"
                    step="any"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>
                    {t.product.category}
                  </label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    required
                    className="input-field bg-white"
                  >
                    <option value="">--</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {lang === 'ar' ? cat.name_ar : cat.name_fr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Toggles ── */}
              <div className="flex flex-wrap gap-6">
                {(
                  [
                    { key: 'is_available', label: t.product.available },
                    { key: 'is_featured', label: t.product.featured },
                    { key: 'is_new_arrival', label: t.product.newArrival },
                    { key: 'is_on_sale', label: t.product.sale },
                  ] as const
                ).map((toggle) => (
                  <label key={toggle.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                    {/* Toggle switch */}
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={form[toggle.key]}
                        onChange={(e) => setForm({ ...form, [toggle.key]: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-primary transition-colors" />
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm" style={{ color: '#0A0A0A' }}>
                      {toggle.label}
                    </span>
                  </label>
                ))}
              </div>

              {/* ── Sizes ── */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0A0A0A' }}>
                  {t.product.sizes}
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_SIZES.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className="px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-colors"
                      style={
                        form.sizes.includes(size)
                          ? { backgroundColor: '#FE8B7C', borderColor: '#FE8B7C', color: '#fff' }
                          : { borderColor: '#EDEDED', color: '#555555' }
                      }
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Colors ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: '#0A0A0A' }}>
                    {t.product.colors}
                  </label>
                  <button
                    type="button"
                    onClick={addColor}
                    className="text-sm font-medium inline-flex items-center gap-1"
                    style={{ color: '#FE8B7C' }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.common.add}
                  </button>
                </div>

                {form.colors.length === 0 && (
                  <p className="text-xs" style={{ color: '#555555' }}>
                    No colors added yet.
                  </p>
                )}

                <div className="space-y-2">
                  {form.colors.map((color, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Name AR"
                        value={color.name_ar}
                        onChange={(e) => updateColor(i, 'name_ar', e.target.value)}
                        className="input-field !py-2"
                        dir="rtl"
                      />
                      <input
                        type="text"
                        placeholder="Name FR"
                        value={color.name_fr}
                        onChange={(e) => updateColor(i, 'name_fr', e.target.value)}
                        className="input-field !py-2"
                      />
                      <input
                        type="color"
                        value={color.hex_code}
                        onChange={(e) => updateColor(i, 'hex_code', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => removeColor(i)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Images ── */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#0A0A0A' }}>
                  Images
                </label>

                {/* Existing images (edit mode) */}
                {existingImages.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative group w-20 h-20">
                        <img
                          src={img.image_url}
                          alt=""
                          className="w-full h-full object-cover rounded-lg border"
                          style={{ borderColor: '#EDEDED' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New image previews */}
                {imagePreviews.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative group w-20 h-20">
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover rounded-lg border"
                          style={{ borderColor: '#EDEDED' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label
                  className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#EDEDED' }}
                >
                  <Upload className="w-5 h-5" style={{ color: '#555555' }} />
                  <span className="text-sm" style={{ color: '#555555' }}>
                    Upload Images
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageChange(e.target.files)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* ── Form Footer ── */}
              <div
                className="flex items-center justify-end gap-3 pt-4 border-t"
                style={{ borderColor: '#EDEDED' }}
              >
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#EDEDED', color: '#555555' }}
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary rounded-lg text-sm !px-5 !py-2.5 disabled:opacity-60"
                >
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
