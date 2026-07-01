import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import api from '../api/client';
import Loader from '../components/Loader';

const statusColor = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Paid: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/orders/mine').then(({ data }) => setOrders(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-4xl">My orders</h1>
      {orders.length === 0 ? (
        <div className="mt-10 grid place-items-center rounded-2xl bg-white py-16 text-center">
          <Package size={40} className="text-ink/20" />
          <p className="mt-3 text-ink/50">You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn-primary mt-4">Start shopping</Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`} className="block rounded-2xl bg-white p-5 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ink/50">Order #{o._id.slice(-8).toUpperCase()}</p>
                  <p className="mt-1 text-sm">{new Date(o.createdAt).toLocaleDateString()} · {o.orderItems.length} item(s)</p>
                </div>
                <div className="text-right">
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColor[o.status]}`}>{o.status}</span>
                  <p className="mt-1 font-semibold">${o.totalPrice.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
