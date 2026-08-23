import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { DashboardStats, OrderStatus } from '../../utils/types';
import toast from 'react-hot-toast';
import { ShoppingCart, Package, Users, DollarSign } from 'lucide-react';

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  shipped: { bg: '#EDE9FE', text: '#6D28D9' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getDashboard()
      .then((data) => setStats(data))
      .catch((err) => toast.error(err.message || t.common.error))
      .finally(() => setLoading(false));
  }, []);

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

  if (!stats) return null;

  const cards = [
    { label: t.admin.totalOrders, value: stats.totalOrders, icon: ShoppingCart, color: '#3B82F6' },
    { label: t.admin.totalProducts, value: stats.totalProducts, icon: Package, color: '#8B5CF6' },
    { label: t.admin.totalCustomers, value: stats.totalCustomers, icon: Users, color: '#10B981' },
    {
      label: t.admin.totalRevenue,
      value: `${stats.totalRevenue.toLocaleString()} ${t.common.currencyCode}`,
      icon: DollarSign,
      color: '#F59E0B',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl p-5 border"
            style={{ borderColor: '#EDEDED' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: '#555555' }}>
                {card.label}
              </span>
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: card.color + '15', color: card.color }}
              >
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#0A0A0A' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border" style={{ borderColor: '#EDEDED' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#EDEDED' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#0A0A0A' }}>
            {t.admin.recentOrders}
          </h2>
        </div>

        {stats.recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center" style={{ color: '#555555' }}>
            {t.admin.noOrders}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: '#EDEDED' }}>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                    {t.checkout.orderNumber}
                  </th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                    {t.checkout.fullName}
                  </th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                    {t.cart.total}
                  </th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                    {t.admin.orders}
                  </th>
                  <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => {
                  const sc = statusColors[order.status];
                  return (
                    <tr
                      key={order.id}
                      className="border-b last:border-b-0 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#EDEDED' }}
                    >
                      <td className="px-5 py-3 font-medium" style={{ color: '#0A0A0A' }}>
                        #{order.order_number}
                      </td>
                      <td className="px-5 py-3" style={{ color: '#555555' }}>
                        {order.customer_name}
                      </td>
                      <td className="px-5 py-3" style={{ color: '#0A0A0A' }}>
                        {order.total.toLocaleString()} {t.common.currencyCode}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: sc.bg, color: sc.text }}
                        >
                          {t.admin.orderStatus[order.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3" style={{ color: '#555555' }}>
                        {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
