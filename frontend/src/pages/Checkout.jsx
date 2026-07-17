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

  const [couponCode, setCouponCode] = useState('');
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [applying, setApplying] = useState(false);

  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  let discount = 0;
  if (activeCoupon) {
    discount = activeCoupon.discountType === 'percentage' 
      ? subtotal * (activeCoupon.discountValue / 100) 
      : activeCoupon.discountValue;
  }
  const total = Math.max(0, +(subtotal + shipping + tax - discount).toFixed(2));

  const applyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setApplying(true);
    try {
      const { data } = await api.post('/api/coupons/validate', { code: couponCode });
      setActiveCoupon(data);
      toast.success('Coupon applied!');
    } catch (err) {
      setActiveCoupon(null);
      toast.error(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setApplying(false);
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setPlacing(true);
    try {
      const { data } = await api.post('/api/orders', {
        orderItems: items.map((i) => ({ product: i.product, qty: i.qty })),
        shippingAddress: addr,
        paymentMethod: 'Chapa',
        couponCode: activeCoupon ? activeCoupon.code : undefined,
      });
      clearCart();
      toast.success('Order placed! Redirecting to payment...');
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        navigate(`/orders/${data.order._id}`);
      }
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
      <form className="mt-8 grid gap-8 lg:grid-cols-3">
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
            <div className="mt-4 flex items-center gap-4 rounded-xl border border-gold/30 bg-gold/5 p-4">
               <img src="https://chapa.co/images/logo.png" alt="Chapa" className="h-6 object-contain" onError={(e) => e.target.style.display = 'none'} />
               <p className="text-sm text-ink/70">
                 You will be redirected securely to Chapa to complete your payment via Telebirr, CBE Birr, Awash, or Card.
               </p>
            </div>
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-6">
          <h2 className="font-serif text-xl">Your order</h2>
          <div className="mt-4 space-y-3">
            {items.map((i) => (
              <div key={i.product} className="flex justify-between text-sm">
                <span className="text-ink/70">{i.name} × {i.qty}</span>
                <span>ETB {(i.price * i.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <dl className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>ETB {subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>{shipping === 0 ? 'Free' : `ETB ${shipping.toFixed(2)}`}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Tax</dt><dd>ETB {tax.toFixed(2)}</dd></div>
            {activeCoupon && (
              <div className="flex justify-between text-green-600">
                <dt>Discount ({activeCoupon.code})</dt>
                <dd>- ETB {discount.toFixed(2)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold"><dt>Total</dt><dd>ETB {total.toFixed(2)}</dd></div>
          </dl>

          <div className="mt-6 border-t border-ink/10 pt-4">
            <label className="text-sm text-ink/70">Promo Code</label>
            <div className="mt-2 flex gap-2">
              <input 
                className="input text-sm uppercase" 
                placeholder="Enter code" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                disabled={activeCoupon}
              />
              {activeCoupon ? (
                <button type="button" onClick={() => { setActiveCoupon(null); setCouponCode(''); }} className="btn-secondary shrink-0">Remove</button>
              ) : (
                <button type="button" onClick={applyCoupon} disabled={applying || !couponCode} className="btn-secondary shrink-0">Apply</button>
              )}
            </div>
          </div>

          <button disabled={placing} className="btn-primary mt-6 w-full" onClick={placeOrder}>
            {placing ? 'Redirecting…' : `Pay ETB ${total.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
