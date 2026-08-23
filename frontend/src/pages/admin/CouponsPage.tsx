import { useState, useEffect, FormEvent } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { Coupon } from '../../utils/types';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

interface CouponForm {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: string;
  min_order_amount: string;
  max_uses: string;
  is_active: boolean;
  expires_at: string;
}

const emptyForm: CouponForm = {
  code: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  is_active: true,
  expires_at: '',
};

export default function CouponsPage() {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const data = await adminApi.getCoupons();
      setCoupons(Array.isArray(data) ? data : data.coupons || []);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  useEffect(() => {
    fetchCoupons().finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value),
      min_order_amount: coupon.min_order_amount ? String(coupon.min_order_amount) : '',
      max_uses: coupon.max_uses ? String(coupon.max_uses) : '',
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.toUpperCase(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        is_active: form.is_active,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      };

      if (editing) {
        await adminApi.updateCoupon(editing.id, payload);
      } else {
        await adminApi.createCoupon(payload);
      }
      toast.success(t.admin.settingsSaved);
      setShowModal(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.admin.confirmDelete)) return;
    try {
      await adminApi.deleteCoupon(id);
      toast.success(t.common.delete);
      fetchCoupons();
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
        <h2 className="text-xl font-bold" style={{ color: '#0A0A0A' }}>{t.admin.coupons}</h2>
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

      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#EDEDED' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#EDEDED' }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Code</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Type</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Value</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Used / Max</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Status</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Expires</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center" style={{ color: '#555555' }}>
                    {t.common.noResults}
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors" style={{ borderColor: '#EDEDED' }}>
                    <td className="px-5 py-3 font-mono font-medium" style={{ color: '#0A0A0A' }}>
                      {coupon.code}
                    </td>
                    <td className="px-5 py-3 capitalize" style={{ color: '#555555' }}>
                      {coupon.discount_type}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#0A0A0A' }}>
                      {coupon.discount_type === 'percentage'
                        ? `${coupon.discount_value}%`
                        : `${coupon.discount_value.toLocaleString()} ${t.common.currencyCode}`}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#555555' }}>
                      {coupon.used_count} / {coupon.max_uses ?? '-'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                        style={
                          coupon.is_active
                            ? { backgroundColor: '#D1FAE5', color: '#065F46' }
                            : { backgroundColor: '#FEE2E2', color: '#991B1B' }
                        }
                      >
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#555555' }}>
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(coupon)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: '#555555' }}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(coupon.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-red-600">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#EDEDED' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
                {editing ? t.common.edit : t.common.add} {t.admin.coupons}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ color: '#555555' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  required
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono uppercase"
                  style={{ border: '1px solid #EDEDED' }}
                  placeholder="SUMMER25"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Discount Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none bg-white"
                    style={{ border: '1px solid #EDEDED' }}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ({t.common.currencyCode})</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Discount Value</label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                    required
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #EDEDED' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Min Order Amount</label>
                  <input
                    type="number"
                    value={form.min_order_amount}
                    onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #EDEDED' }}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Max Uses</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    min="0"
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ border: '1px solid #EDEDED' }}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Expires At</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ border: '1px solid #EDEDED' }}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded accent-[#FE8B7C]"
                />
                <span className="text-sm" style={{ color: '#0A0A0A' }}>Active</span>
              </label>

              <div className="flex items-center justify-end gap-3 pt-3 border-t" style={{ borderColor: '#EDEDED' }}>
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium border" style={{ borderColor: '#EDEDED', color: '#555555' }}>
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60"
                  style={{ backgroundColor: '#FE8B7C' }}
                  onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#F47768')}
                  onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#FE8B7C')}
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
