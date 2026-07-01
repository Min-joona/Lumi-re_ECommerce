import { useEffect, useState } from 'react';
import { Package, ShoppingCart, DollarSign, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Loader from '../components/Loader';

const statuses = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      api.get('/api/orders'),
      api.get('/api/products?limit=100'),
    ])
      .then(([o, p]) => {
        setOrders(o.data);
        setProducts(p.data.products);
      })
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/api/orders/${id}/status`, { status });
      toast.success('Order updated');
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    } catch {
      toast.error('Update failed');
    }
  };

  if (loading) return <Loader />;

  const revenue = orders.filter((o) => o.isPaid).reduce((a, o) => a + o.totalPrice, 0);
  const stats = [
    { label: 'Revenue', value: `$${revenue.toFixed(2)}`, icon: DollarSign },
    { label: 'Orders', value: orders.length, icon: ShoppingCart },
    { label: 'Products', value: products.length, icon: Package },
    { label: 'Customers', value: new Set(orders.map((o) => o.user?._id)).size, icon: Users },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-4xl">Admin dashboard</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink/50">{label}</span>
              <Icon size={18} className="text-gold" />
            </div>
            <p className="mt-2 font-serif text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 font-serif text-2xl">Recent orders</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-ink/10 text-left text-ink/50">
            <tr>
              <th className="p-4">Order</th><th className="p-4">Customer</th>
              <th className="p-4">Date</th><th className="p-4">Total</th><th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id} className="border-b border-ink/5">
                <td className="p-4 font-mono text-xs">#{o._id.slice(-8).toUpperCase()}</td>
                <td className="p-4">{o.user?.name || '—'}</td>
                <td className="p-4">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="p-4 font-semibold">${o.totalPrice.toFixed(2)}</td>
                <td className="p-4">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o._id, e.target.value)}
                    className="rounded-lg border border-ink/15 px-2 py-1 text-xs"
                  >
                    {statuses.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ink/40">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
