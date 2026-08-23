import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { adminApi } from '../../services/api';
import { Order, OrderStatus } from '../../utils/types';
import toast from 'react-hot-toast';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';

const statusColors: Record<OrderStatus, { bg: string; text: string }> = {
  pending: { bg: '#FEF3C7', text: '#92400E' },
  confirmed: { bg: '#DBEAFE', text: '#1E40AF' },
  shipped: { bg: '#EDE9FE', text: '#6D28D9' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B' },
};

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const { t, lang } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set('search', search);
      const data = await adminApi.getOrders(params.toString());
      setOrders(data.orders || data || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const toggleExpand = async (order: Order) => {
    if (expandedId === order.id) {
      setExpandedId(null);
      setExpandedOrder(null);
      return;
    }
    try {
      const data = await adminApi.getOrder(order.id);
      setExpandedOrder(data.order || data);
      setExpandedId(order.id);
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, status);
      toast.success(t.admin.settingsSaved);
      fetchOrders();
      if (expandedOrder?.id === orderId) {
        setExpandedOrder((prev) => (prev ? { ...prev, status: status as OrderStatus } : null));
      }
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading && orders.length === 0) {
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
        {t.admin.orders}
      </h2>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder={`${t.checkout.orderNumber} / ${t.checkout.phone}...`}
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
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>#</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.checkout.fullName}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.checkout.phone}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>{t.cart.total}</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Status</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}>Date</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: '#555555' }}></th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center" style={{ color: '#555555' }}>
                    {t.admin.noOrders}
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const sc = statusColors[order.status];
                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className="border-b hover:bg-gray-50 transition-colors cursor-pointer"
                        style={{ borderColor: '#EDEDED' }}
                        onClick={() => toggleExpand(order)}
                      >
                        <td className="px-5 py-3 font-mono text-xs font-medium" style={{ color: '#0A0A0A' }}>
                          {order.order_number}
                        </td>
                        <td className="px-5 py-3" style={{ color: '#0A0A0A' }}>
                          {order.customer_name}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs" style={{ color: '#555555' }}>
                          {order.customer_phone}
                        </td>
                        <td className="px-5 py-3 font-medium" style={{ color: '#0A0A0A' }}>
                          {order.total.toLocaleString()} {t.common.currencyCode}
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateStatus(order.id, e.target.value);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs font-medium px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer"
                            style={{ backgroundColor: sc.bg, color: sc.text }}
                          >
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {t.admin.orderStatus[s]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: '#555555' }}>
                          {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-MA' : 'fr-FR')}
                        </td>
                        <td className="px-5 py-3">
                          {expandedId === order.id ? (
                            <ChevronUp className="w-4 h-4" style={{ color: '#555555' }} />
                          ) : (
                            <ChevronDown className="w-4 h-4" style={{ color: '#555555' }} />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Detail */}
                      {expandedId === order.id && expandedOrder && (
                        <tr>
                          <td colSpan={7} className="p-5 bg-gray-50 border-b" style={{ borderColor: '#EDEDED' }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                              <div>
                                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: '#555555' }}>
                                  {t.checkout.customerInfo}
                                </h4>
                                <div className="space-y-1 text-sm" style={{ color: '#0A0A0A' }}>
                                  <p><span className="font-medium">{t.checkout.fullName}:</span> {expandedOrder.customer_name}</p>
                                  <p><span className="font-medium">{t.checkout.phone}:</span> {expandedOrder.customer_phone}</p>
                                  <p><span className="font-medium">{t.checkout.province}:</span> {expandedOrder.customer_province}</p>
                                  <p><span className="font-medium">{t.checkout.address}:</span> {expandedOrder.customer_address}</p>
                                  {expandedOrder.customer_notes && (
                                    <p><span className="font-medium">{t.checkout.notes}:</span> {expandedOrder.customer_notes}</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: '#555555' }}>
                                  {t.checkout.orderSummary}
                                </h4>
                                <div className="space-y-1 text-sm" style={{ color: '#0A0A0A' }}>
                                  <p><span className="font-medium">{t.cart.subtotal}:</span> {expandedOrder.subtotal.toLocaleString()} {t.common.currencyCode}</p>
                                  {expandedOrder.discount_amount > 0 && (
                                    <p className="text-red-600">
                                      <span className="font-medium">{t.product.discount}:</span> -{expandedOrder.discount_amount.toLocaleString()} {t.common.currencyCode}
                                    </p>
                                  )}
                                  {expandedOrder.coupon_code && (
                                    <p><span className="font-medium">{t.checkout.couponCode}:</span> {expandedOrder.coupon_code}</p>
                                  )}
                                  <p className="font-bold">{t.cart.total}: {expandedOrder.total.toLocaleString()} {t.common.currencyCode}</p>
                                </div>
                              </div>
                            </div>

                            {/* Order Items */}
                            <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: '#555555' }}>
                              {t.admin.products}
                            </h4>
                            <div className="space-y-2">
                              {expandedOrder.items?.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border" style={{ borderColor: '#EDEDED' }}>
                                  <div className="w-12 h-14 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    {item.product_image && (
                                      <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate" style={{ color: '#0A0A0A' }}>
                                      {lang === 'ar' ? item.product_name_ar : item.product_name_fr}
                                    </p>
                                    <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: '#555555' }}>
                                      {item.color_name_ar && (
                                        <span className="flex items-center gap-1">
                                          <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.color_hex || '#ccc' }} />
                                          {lang === 'ar' ? item.color_name_ar : item.color_name_fr}
                                        </span>
                                      )}
                                      {item.size && <span>{item.size}</span>}
                                    </div>
                                  </div>
                                  <div className="text-sm text-right flex-shrink-0">
                                    <p style={{ color: '#555555' }}>{item.price.toLocaleString()} x {item.quantity}</p>
                                    <p className="font-medium" style={{ color: '#0A0A0A' }}>
                                      {(item.price * item.quantity).toLocaleString()} {t.common.currencyCode}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#EDEDED', color: '#555555' }}
          >
            {t.common.previous}
          </button>
          <span className="text-sm" style={{ color: '#555555' }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-lg text-sm font-medium border disabled:opacity-30 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#EDEDED', color: '#555555' }}
          >
            {t.common.next}
          </button>
        </div>
      )}
    </div>
  );
}
