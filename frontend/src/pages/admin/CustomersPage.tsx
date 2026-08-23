import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { Customer } from '../../utils/types';
import toast from 'react-hot-toast';
import { Search, Users } from 'lucide-react';

export default function CustomersPage() {
  const { t, lang } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async (searchTerm?: string) => {
    setLoading(true);
    try {
      const params = searchTerm ? `search=${encodeURIComponent(searchTerm)}` : '';
      const data = await adminApi.getCustomers(params);
      setCustomers(Array.isArray(data) ? data : data.customers || []);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(search);
  };

  if (loading && customers.length === 0) {
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
      <h2 className="text-xl font-bold mb-6" style={{ color: '#0A0A0A' }}>
        {t.admin.customers}
      </h2>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder={`${t.checkout.fullName} / ${t.checkout.phone}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2.5 pr-10 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #EDEDED' }}
          />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#555555' }} />
        </div>
        <button
          type="submit"
          className="px-4 py-2.5 rounded-lg text-white text-sm font-medium"
          style={{ backgroundColor: '#FE8B7C' }}
        >
          {t.common.search}
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#EDEDED' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: '#EDEDED' }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.checkout.fullName}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.checkout.phone}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.checkout.province}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.admin.totalOrders}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.admin.totalRevenue}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center" style={{ color: '#555555' }}>
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    {t.admin.noCustomers}
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#EDEDED' }}
                  >
                    <td className="px-5 py-3 font-medium" style={{ color: '#0A0A0A' }}>
                      {customer.name}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs" style={{ color: '#555555' }}>
                      {customer.phone}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#555555' }}>
                      {customer.province || '-'}
                    </td>
                    <td className="px-5 py-3" style={{ color: '#0A0A0A' }}>
                      {customer.total_orders}
                    </td>
                    <td className="px-5 py-3 font-medium" style={{ color: '#0A0A0A' }}>
                      {customer.total_spent.toLocaleString()} {t.common.currencyCode}
                    </td>
                    <td className="px-5 py-3 text-xs" style={{ color: '#555555' }}>
                      {new Date(customer.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
