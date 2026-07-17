import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowUpRight, DollarSign, Package, RefreshCw, ShoppingCart, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const statuses = ['Pending', 'Confirmed', 'Paid', 'Packed', 'Shipped', 'Delivered', 'Returned', 'Refunded', 'Cancelled'];
const money = (value) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

function CardSkeleton() {
  return <div className="h-32 animate-pulse rounded-3xl bg-white/70" />;
}

function StatusPill({ status }) {
  const color = status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : status === 'Cancelled' || status === 'Refunded' ? 'bg-rose-100 text-rose-700' : status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700';
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>{status}</span>;
}

export default function Admin() {
  const { user, updateUser } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboardResponse, ordersResponse] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/orders', { params: { limit: 12, status: statusFilter } }),
      ]);
      setDashboard(dashboardResponse.data);
      setOrders(ordersResponse.data.orders);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not load the dashboard');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    const previous = orders.find((order) => order._id === id)?.status;
    setUpdating(id);
    setOrders((current) => current.map((order) => (order._id === id ? { ...order, status } : order)));
    try {
      await api.put(`/api/orders/${id}/status`, { status, note: 'Updated from the dashboard' });
      toast.success('Order updated');
    } catch (error) {
      setOrders((current) => current.map((order) => (order._id === id ? { ...order, status: previous } : order)));
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/api/auth/me', profileForm);
      updateUser(data.user);
      setProfileForm({ ...profileForm, password: '' });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const metrics = dashboard?.metrics;
  const cards = metrics && [
    { label: 'Revenue today', value: money(metrics.today), hint: `${metrics.monthChange >= 0 ? '+' : ''}${metrics.monthChange.toFixed(1)}% vs. last month`, icon: DollarSign, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Orders needing action', value: metrics.attention, hint: 'Pending or confirmed', icon: ShoppingCart, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Catalogue items', value: metrics.products, hint: `${dashboard.lowStock.length} low-stock alert${dashboard.lowStock.length === 1 ? '' : 's'}`, icon: Package, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Customers', value: metrics.customers, hint: 'Registered shoppers', icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
  ];

  const tabs = ['Overview', 'Orders', 'Products', 'Customers', 'Settings'];
  const [activeTab, setActiveTab] = useState('Overview');

  const [customers, setCustomers] = useState([]);
  const [productsList, setProductsList] = useState([]);

  const loadCustomers = async () => {
    try {
      const { data } = await api.get('/api/admin/customers');
      setCustomers(data);
    } catch (err) { toast.error('Failed to load customers'); }
  };

  const loadProductsList = async () => {
    try {
      const { data } = await api.get('/api/products?limit=100');
      setProductsList(data.products);
    } catch (err) { toast.error('Failed to load products'); }
  };

  useEffect(() => {
    if (activeTab === 'Customers' && !customers.length) loadCustomers();
    if (activeTab === 'Products' && !productsList.length) loadProductsList();
  }, [activeTab]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-gold">Operations</p>
          <h1 className="mt-1 font-serif text-4xl sm:text-5xl">Store overview</h1>
          <p className="mt-2 text-sm text-ink/55">The work that needs your attention, without the noise.</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost self-start px-4 py-2.5 sm:self-auto"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      <div className="mt-8 flex gap-4 overflow-x-auto border-b border-ink/10 pb-1">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-gold text-gold' : 'text-ink/60 hover:text-ink'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <>
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy={loading}>
            {loading ? Array.from({ length: 4 }, (_, index) => <CardSkeleton key={index} />) : cards?.map(({ label, value, hint, icon: Icon, tone }) => (
              <div key={label} className="rounded-3xl bg-white p-5 shadow-[0_12px_30px_-20px_rgba(17,24,39,.35)]">
                <div className="flex items-start justify-between"><span className="text-sm text-ink/55">{label}</span><span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}><Icon size={18} /></span></div>
                <p className="mt-5 font-serif text-3xl">{value}</p><p className="mt-1 text-xs text-ink/45">{hint}</p>
              </div>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="min-h-[320px] rounded-3xl bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><h2 className="font-serif text-2xl">Revenue trend</h2><p className="mt-1 text-sm text-ink/45">Paid orders from the last seven days</p></div><span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">This week {money(metrics?.week)}</span></div>
              {loading ? <div className="mt-8 h-52 animate-pulse rounded-2xl bg-ink/5" /> : dashboard?.trend?.length ? (
                <div className="mt-6 h-52"><ResponsiveContainer width="100%" height="100%"><AreaChart data={dashboard.trend.map((point) => ({ ...point, label: new Date(`${point._id}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' }) }))}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#c9a24b" stopOpacity={0.32} /><stop offset="95%" stopColor="#c9a24b" stopOpacity={0} /></linearGradient></defs><XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} /><YAxis hide /><Tooltip formatter={(value) => money(value)} contentStyle={{ borderRadius: 14, border: '1px solid #eee' }} /><Area type="monotone" dataKey="revenue" stroke="#b68e35" strokeWidth={2.5} fill="url(#revenueFill)" /></AreaChart></ResponsiveContainer></div>
              ) : <div className="grid h-52 place-items-center text-center text-sm text-ink/45">No paid orders in this period yet.</div>}
            </div>

            <div className="rounded-3xl bg-ink p-5 text-white sm:p-6">
              <div className="flex items-center gap-2"><AlertTriangle size={18} className="text-gold" /><h2 className="font-serif text-2xl">Low stock</h2></div>
              <p className="mt-1 text-sm text-white/55">Restock these before the next sale.</p>
              <div className="mt-5 space-y-3">{loading ? <div className="h-24 animate-pulse rounded-2xl bg-white/10" /> : dashboard?.lowStock?.length ? dashboard.lowStock.map((product) => <div key={product._id} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3"><img src={product.image} alt="" className="h-10 w-10 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-0.5 text-xs text-white/55">Threshold: {product.lowStockThreshold}</p></div><span className="text-sm font-semibold text-gold">{product.countInStock} left</span></div>) : <p className="rounded-2xl bg-white/10 p-4 text-sm text-white/65">All active products are above their stock threshold.</p>}</div>
            </div>
          </section>

          {!loading && <section className="mt-6 rounded-3xl bg-white p-5 sm:p-6"><h2 className="font-serif text-2xl">Recent staff activity</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{dashboard?.recentActivity?.length ? dashboard.recentActivity.map((event) => <div key={event._id} className="flex items-center gap-3 rounded-2xl bg-cream p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-gold"><ArrowUpRight size={17} /></span><div><p className="text-sm font-medium">{event.action.replaceAll('.', ' ')}</p><p className="mt-0.5 text-xs text-ink/50">{event.actorId?.name || 'Staff'} · {new Date(event.createdAt).toLocaleString()}</p></div></div>) : <p className="text-sm text-ink/45">Activity will appear here as staff make changes.</p>}</div></section>}
        </>
      )}

      {activeTab === 'Orders' && (
        <section className="mt-6 rounded-3xl bg-white">
          <div className="flex flex-col gap-3 border-b border-ink/8 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-serif text-2xl">Orders</h2><p className="mt-1 text-sm text-ink/45">Updates are saved instantly and logged.</p></div><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold"><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-sm"><thead className="sticky top-0 bg-cream/70 text-left text-xs uppercase tracking-wider text-ink/45"><tr><th className="px-6 py-4 font-medium">Order</th><th className="px-4 py-4 font-medium">Customer</th><th className="px-4 py-4 font-medium">Placed</th><th className="px-4 py-4 font-medium">Total</th><th className="px-4 py-4 font-medium">Status</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className="p-8"><div className="h-16 animate-pulse rounded-xl bg-ink/5" /></td></tr> : orders.map((order) => <tr key={order._id} className="border-t border-ink/6 transition hover:bg-cream/45"><td className="px-6 py-4 font-mono text-xs font-medium">#{order._id.slice(-8).toUpperCase()}</td><td className="px-4 py-4"><p className="font-medium">{order.user?.name || order.shippingAddress?.fullName || 'Guest'}</p><p className="mt-0.5 text-xs text-ink/45">{order.user?.email}</p></td><td className="px-4 py-4 text-ink/60">{new Date(order.createdAt).toLocaleDateString()}</td><td className="px-4 py-4 font-medium">{money(order.totalPrice)}</td><td className="px-4 py-4"><div className="flex items-center gap-2"><StatusPill status={order.status} /><select aria-label={`Change status for order ${order._id}`} value={order.status} disabled={updating === order._id} onChange={(event) => updateStatus(order._id, event.target.value)} className="rounded-lg border border-ink/12 bg-white px-2 py-1 text-xs outline-none"><option value={order.status}>Change…</option>{statuses.filter((status) => status !== order.status).map((status) => <option key={status}>{status}</option>)}</select></div></td></tr>)}{!loading && !orders.length && <tr><td colSpan="5" className="p-12 text-center text-ink/45">No orders match this filter.</td></tr>}</tbody></table></div>
        </section>
      )}

      {activeTab === 'Products' && (
        <section className="mt-6 rounded-3xl bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl">Products Catalogue</h2>
            <button className="btn-primary py-2 text-xs">Add Product</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {productsList.map((p) => (
              <div key={p._id} className="rounded-2xl border border-ink/10 p-3 flex items-center gap-3">
                 <img src={p.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                 <div className="min-w-0 flex-1">
                   <p className="truncate text-sm font-medium">{p.name}</p>
                   <p className="mt-0.5 text-xs text-ink/55">{money(p.price)} &middot; {p.countInStock} in stock</p>
                 </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'Customers' && (
        <section className="mt-6 rounded-3xl bg-white p-5 sm:p-6">
          <h2 className="font-serif text-2xl mb-6">Registered Customers</h2>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-cream/70 text-left text-xs uppercase text-ink/45"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Orders</th><th className="px-4 py-3 font-medium">LTV</th><th className="px-4 py-3 font-medium">Status</th></tr></thead><tbody>
            {customers.map((c) => (
              <tr key={c._id} className="border-t border-ink/6">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-ink/60">{c.email}</td>
                <td className="px-4 py-3 font-medium">{c.orders}</td>
                <td className="px-4 py-3 font-medium text-gold">{money(c.lifetimeValue)}</td>
                <td className="px-4 py-3 capitalize"><StatusPill status={c.status} /></td>
              </tr>
            ))}
          </tbody></table></div>
        </section>
      )}

      {activeTab === 'Settings' && !loading && (
        <section className="mt-6 rounded-3xl bg-white p-5 sm:p-6">
          <h2 className="font-serif text-2xl">Admin Settings</h2>
          <p className="mt-1 text-sm text-ink/45">Update your account credentials here.</p>
          <form onSubmit={handleProfileUpdate} className="mt-6 max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">Name</label>
              <input type="text" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} className="input" placeholder="Your name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">Email / Username</label>
              <input type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="input" placeholder="Your email" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/80 mb-1">New Password (leave blank to keep current)</label>
              <input type="password" value={profileForm.password} onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })} className="input" placeholder="New password" />
            </div>
            <button type="submit" disabled={savingProfile} className="btn-primary w-full">{savingProfile ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </section>
      )}
    </div>
  );
}
