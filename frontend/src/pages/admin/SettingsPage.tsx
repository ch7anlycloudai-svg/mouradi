import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { StoreSettings } from '../../utils/types';
import toast from 'react-hot-toast';
import { Save, Upload } from 'lucide-react';

export default function SettingsPage() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    adminApi
      .getSettings()
      .then((data) => {
        const s = data.settings || data;
        setSettings(s);
        setLogoPreview(s?.logo_url || '');
      })
      .catch((err: any) => toast.error(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, []);

  const update = (field: keyof StoreSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('store_name', settings.store_name || '');
      fd.append('whatsapp_number', settings.whatsapp_number || '');
      fd.append('phone_number', settings.phone_number || '');
      fd.append('email', settings.email || '');
      fd.append('address_ar', settings.address_ar || '');
      fd.append('address_fr', settings.address_fr || '');
      fd.append('facebook_url', settings.facebook_url || '');
      fd.append('instagram_url', settings.instagram_url || '');
      fd.append('tiktok_url', settings.tiktok_url || '');
      if (logo) fd.append('logo', logo);

      await adminApi.updateSettings(fd);
      toast.success(t.admin.settingsSaved);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setSaving(false);
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

  if (!settings) {
    return (
      <p className="text-center py-20" style={{ color: '#555555' }}>{t.common.error}</p>
    );
  }

  const inputStyle = { border: '1px solid #EDEDED' };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: '#0A0A0A' }}>{t.admin.settings}</h2>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Logo */}
        <div className="p-5 bg-white rounded-xl border" style={{ borderColor: '#EDEDED' }}>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#555555' }}>
            Logo
          </label>
          <div className="flex items-center gap-4">
            {logoPreview && (
              <div className="w-20 h-20 bg-gray-100 overflow-hidden rounded-lg flex items-center justify-center">
                <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderColor: '#EDEDED' }}>
              <Upload className="w-5 h-5" style={{ color: '#555555' }} />
              <span className="text-sm" style={{ color: '#555555' }}>Upload Logo</span>
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>
        </div>

        {/* Store Info */}
        <div className="p-5 bg-white rounded-xl border space-y-4" style={{ borderColor: '#EDEDED' }}>
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#555555' }}>
            {t.admin.contactInfo}
          </label>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>{t.admin.storeName}</label>
            <input
              type="text"
              value={settings.store_name || ''}
              onChange={(e) => update('store_name', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>{t.admin.whatsappNumber}</label>
              <input
                type="text"
                value={settings.whatsapp_number || ''}
                onChange={(e) => update('whatsapp_number', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
                placeholder="+22247305955"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>{t.contact.phone}</label>
              <input
                type="text"
                value={settings.phone_number || ''}
                onChange={(e) => update('phone_number', e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>{t.admin.email}</label>
            <input
              type="email"
              value={settings.email || ''}
              onChange={(e) => update('email', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Address */}
        <div className="p-5 bg-white rounded-xl border space-y-4" style={{ borderColor: '#EDEDED' }}>
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#555555' }}>
            Address
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Address (AR)</label>
              <textarea
                value={settings.address_ar || ''}
                onChange={(e) => update('address_ar', e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={inputStyle}
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Address (FR)</label>
              <textarea
                value={settings.address_fr || ''}
                onChange={(e) => update('address_fr', e.target.value)}
                rows={2}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none resize-none"
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="p-5 bg-white rounded-xl border space-y-4" style={{ borderColor: '#EDEDED' }}>
          <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: '#555555' }}>
            Social Media
          </label>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Facebook</label>
            <input
              type="url"
              value={settings.facebook_url || ''}
              onChange={(e) => update('facebook_url', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="https://facebook.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>Instagram</label>
            <input
              type="url"
              value={settings.instagram_url || ''}
              onChange={(e) => update('instagram_url', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="https://instagram.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#0A0A0A' }}>TikTok</label>
            <input
              type="url"
              value={settings.tiktok_url || ''}
              onChange={(e) => update('tiktok_url', e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={inputStyle}
              placeholder="https://tiktok.com/..."
            />
          </div>
        </div>

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60"
          style={{ backgroundColor: '#FE8B7C' }}
          onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#F47768')}
          onMouseLeave={(e) => !saving && (e.currentTarget.style.backgroundColor = '#FE8B7C')}
        >
          <Save className="w-4 h-4" />
          {saving ? t.common.loading : t.admin.saveSettings}
        </button>
      </form>
    </div>
  );
}
