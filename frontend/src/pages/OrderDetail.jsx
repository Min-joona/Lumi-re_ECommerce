import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import api from '../api/client';
import Loader from '../components/Loader';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/orders/${id}`).then(({ data }) => setOrder(data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!order) return <p className="py-24 text-center">Order not found.</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl bg-white p-6 text-center">
        <CheckCircle2 size={48} className="mx-auto text-green-600" />
        <h1 className="mt-3 font-serif text-3xl">Thank you for your order</h1>
        <p className="mt-1 text-sm text-ink/50">Order #{order._id.slice(-8).toUpperCase()} · {order.status}</p>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6">
        <h2 className="font-serif text-xl">Items</h2>
        <div className="mt-4 space-y-3">
          {order.orderItems.map((i, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <img src={i.image} alt={i.name} className="h-16 w-16 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium">{i.name}</p>
                <p className="text-sm text-ink/50">Qty {i.qty}</p>
              </div>
              <span className="font-semibold">${(i.price * i.qty).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6">
          <h2 className="font-serif text-xl">Shipping</h2>
          <div className="mt-3 text-sm text-ink/70">
            <p>{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.address}</p>
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.postalCode}</p>
            <p>{order.shippingAddress?.country}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-6">
          <h2 className="font-serif text-xl">Summary</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Items</dt><dd>${order.itemsPrice?.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>${order.shippingPrice?.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Tax</dt><dd>${order.taxPrice?.toFixed(2)}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-2 font-semibold"><dt>Total</dt><dd>${order.totalPrice?.toFixed(2)}</dd></div>
          </dl>
        </div>
      </div>

      <Link to="/orders" className="mt-8 block text-center text-sm text-ink/50 hover:text-ink">← Back to my orders</Link>
    </div>
  );
}
