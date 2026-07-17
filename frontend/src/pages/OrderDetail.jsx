import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, MapPin } from 'lucide-react';
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

      {['Pending', 'Confirmed', 'Paid', 'Packed', 'Shipped', 'Delivered'].includes(order.status) && (
        <div className="mt-6 rounded-2xl bg-white p-6">
          <h2 className="font-serif text-xl mb-6">Tracking</h2>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-ink/5 rounded-full" />
            <div 
              className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-gold rounded-full transition-all duration-500" 
              style={{
                width: 
                  order.status === 'Pending' ? '0%' :
                  order.status === 'Confirmed' || order.status === 'Paid' ? '25%' :
                  order.status === 'Packed' ? '50%' :
                  order.status === 'Shipped' ? '75%' :
                  order.status === 'Delivered' ? '100%' : '0%'
              }}
            />
            
            <div className="relative flex justify-between z-10 text-xs sm:text-sm font-medium">
              {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((step, i) => {
                const isCompleted = ['Pending', 'Confirmed', 'Paid', 'Packed', 'Shipped', 'Delivered'].indexOf(order.status === 'Paid' ? 'Confirmed' : order.status) >= i;
                return (
                  <div key={step} className="flex flex-col items-center gap-2 w-16 sm:w-24">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isCompleted ? 'bg-gold text-white' : 'bg-white border-2 border-ink/10 text-ink/30'}`}>
                      {isCompleted && <CheckCircle2 size={14} />}
                    </div>
                    <span className={`text-center ${isCompleted ? 'text-ink' : 'text-ink/40'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
              <span className="font-semibold">ETB {(i.price * i.qty).toFixed(2)}</span>
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
            <div className="flex justify-between"><dt className="text-ink/60">Items</dt><dd>ETB {order.itemsPrice?.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>ETB {order.shippingPrice?.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Tax</dt><dd>ETB {order.taxPrice?.toFixed(2)}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-2 font-semibold"><dt>Total</dt><dd>ETB {order.totalPrice?.toFixed(2)}</dd></div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6">
        <div className="flex items-center justify-between gap-4"><h2 className="font-serif text-xl">Order timeline</h2>{order.trackingNumber && <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"><MapPin size={14} /> {order.trackingNumber}</span>}</div>
        <ol className="mt-5 space-y-4 border-l border-gold/30 pl-5">
          {(order.timeline?.length ? [...order.timeline].reverse() : [{ status: order.status, createdAt: order.createdAt }]).map((event, index) => (
            <li key={`${event.createdAt}-${index}`} className="relative"><span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full bg-gold ring-4 ring-cream" /><p className="text-sm font-medium">{event.status}</p>{event.note && <p className="mt-0.5 text-sm text-ink/55">{event.note}</p>}<p className="mt-1 text-xs text-ink/40">{new Date(event.createdAt).toLocaleString()}</p></li>
          ))}
        </ol>
      </div>

      <Link to="/orders" className="mt-8 block text-center text-sm text-ink/50 hover:text-ink">← Back to my orders</Link>
    </div>
  );
}
