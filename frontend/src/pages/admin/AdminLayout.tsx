import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import {
  LayoutDashboard,
  Package,
  Grid3x3,
  ShoppingCart,
  Users,
  Ticket,
  Home,
  Star,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export default function AdminLayout() {
  const { t, lang, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('wwenatou_admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    adminApi
      .verifyToken()
      .then(() => setAuthChecked(true))
      .catch(() => {
        localStorage.removeItem('wwenatou_admin_token');
        navigate('/admin/login', { replace: true });
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('wwenatou_admin_token');
    navigate('/admin/login', { replace: true });
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: t.admin.dashboard, end: true },
    { to: '/admin/products', icon: Package, label: t.admin.products },
    { to: '/admin/categories', icon: Grid3x3, label: t.admin.categories },
    { to: '/admin/orders', icon: ShoppingCart, label: t.admin.orders },
    { to: '/admin/customers', icon: Users, label: t.admin.customers },
    { to: '/admin/coupons', icon: Ticket, label: t.admin.coupons },
    { to: '/admin/homepage', icon: Home, label: t.admin.homepage },
    { to: '/admin/testimonials', icon: Star, label: t.admin.testimonials },
    { to: '/admin/settings', icon: Settings, label: t.admin.settings },
  ];

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <svg className="animate-spin h-8 w-8" style={{ color: '#FE8B7C' }} viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="ltr">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r flex flex-col transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ borderColor: '#EDEDED' }}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b" style={{ borderColor: '#EDEDED' }}>
          <span className="text-lg font-bold" style={{ color: '#0A0A0A' }}>
            WWenatou
          </span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden" style={{ color: '#555555' }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : ''
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { backgroundColor: '#FE8B7C', color: '#fff' }
                  : { color: '#555555' }
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t" style={{ borderColor: '#EDEDED' }}>
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(lang === 'ar' ? 'fr' : 'ar')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 mb-1"
            style={{ color: '#555555' }}
          >
            <span className="w-5 h-5 flex items-center justify-center text-xs font-bold">
              {lang === 'ar' ? 'FR' : 'AR'}
            </span>
            {lang === 'ar' ? 'Francais' : 'العربية'}
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-red-50 text-red-600"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {t.admin.logout}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b flex items-center px-4 lg:px-6 sticky top-0 z-30" style={{ borderColor: '#EDEDED' }}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden mr-3" style={{ color: '#555555' }}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
            {t.admin.dashboard}
          </h1>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
