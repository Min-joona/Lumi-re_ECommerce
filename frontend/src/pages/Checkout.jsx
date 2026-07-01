import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useCart } from '../context/CartContext';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);
  const [addr, setAddr] = useState({
    fullName: '', address: '', city: '', postalCode: '', country: '',
  });

  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const { data } = await api.post('/api/orders', {
        orderItems: items.map((i) => ({ product: i.product, qty: i.qty })),
        shippingAddress: addr,
        paymentMethod: 'Card (Demo)',
      });
      clearCart();
      toast.success('Order placed!');
      navigate(`/orders/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-4xl">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-2xl bg-white p-6">
            <h2 className="font-serif text-xl">Shipping address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input className="input sm:col-span-2" placeholder="Full name" required value={addr.fullName} onChange={(e) => setAddr({ ...addr, fullName: e.target.value })} />
              <input className="input sm:col-span-2" placeholder="Street address" required value={addr.address} onChange={(e) => setAddr({ ...addr, address: e.target.value })} />
              <input className="input" placeholder="City" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
              <input className="input" placeholder="Postal code" required value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} />
              <input className="input sm:col-span-2" placeholder="Country" required value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6">
            <h2 className="font-serif text-xl">Payment</h2>
            <p className="mt-2 text-sm text-ink/50">
              This is a demo store — no real payment is processed. Your order is marked paid instantly.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input className="input sm:col-span-2" placeholder="Card number (4242 4242 4242 4242)" defaultValue="4242 4242 4242 4242" />
              <input className="input" placeholder="MM / YY" defaultValue="12 / 28" />
              <input className="input" placeholder="CVC" defaultValue="123" />
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-6">
          <h2 className="font-serif text-xl">Your order</h2>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.product} className="flex justify-between text-sm">
                <span className="text-ink/70">{i.name} × {i.qty}</span>
                <span>${(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>${subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Tax</dt><dd>${tax.toFixed(2)}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold"><dt>Total</dt><dd>${total.toFixed(2)}</dd></div>
          </dl>
          <button disabled={placing} className="btn-primary mt-6 w-full">
            {placing ? 'Placing order…' : `Pay $${total.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
