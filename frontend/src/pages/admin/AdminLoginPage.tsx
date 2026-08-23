import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import toast from 'react-hot-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      const data = await adminApi.login(email, password);
      localStorage.setItem('wwenatou_admin_token', data.token);
      toast.success(t.admin.login);
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.message || t.admin.invalidCredentials);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo / Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#FE8B7C' }}>
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#0A0A0A' }}>
              WWenatou Shopping
            </h1>
            <p className="mt-1" style={{ color: '#555555' }}>
              {t.admin.dashboard}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0A0A0A' }}>
                {t.admin.email}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{ border: '1px solid #EDEDED', color: '#0A0A0A' }}
                onFocus={(e) => (e.target.style.borderColor = '#FE8B7C')}
                onBlur={(e) => (e.target.style.borderColor = '#EDEDED')}
                placeholder="admin@wwenatou.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#0A0A0A' }}>
                {t.admin.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                  style={{ border: '1px solid #EDEDED', color: '#0A0A0A' }}
                  onFocus={(e) => (e.target.style.borderColor = '#FE8B7C')}
                  onBlur={(e) => (e.target.style.borderColor = '#EDEDED')}
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 -translate-y-1/2 right-3 rtl:right-auto rtl:left-3"
                  style={{ color: '#555555' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-white font-medium text-sm transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#FE8B7C' }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#F47768')}
              onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#FE8B7C')}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t.common.loading}
                </span>
              ) : (
                t.admin.loginButton
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
