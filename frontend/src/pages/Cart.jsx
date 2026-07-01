import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, updateQty, removeFromCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 9.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const total = +(subtotal + shipping + tax).toFixed(2);

  if (items.length === 0) {
    return (
      <div className="grid place-items-center py-28 text-center">
        <ShoppingBag size={48} className="text-ink/20" />
        <h1 className="mt-4 font-serif text-3xl">Your cart is empty</h1>
        <p className="mt-2 text-ink/50">Discover something you'll love.</p>
        <Link to="/shop" className="btn-primary mt-6">Browse the shop</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-serif text-4xl">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((i) => (
            <div key={i.product} className="flex gap-4 rounded-2xl bg-white p-4">
              <img src={i.image} alt={i.name} className="h-24 w-24 shrink-0 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                  <Link to={`/product/${i.slug}`} className="font-serif text-lg hover:text-gold">{i.name}</Link>
                  <button onClick={() => removeFromCart(i.product)} className="text-ink/40 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
                <span className="text-sm text-ink/50">${i.price.toFixed(2)} each</span>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button onClick={() => updateQty(i.product, Math.max(1, i.qty - 1))} className="grid h-9 w-9 place-items-center"><Minus size={14} /></button>
                    <span className="w-7 text-center text-sm">{i.qty}</span>
                    <button onClick={() => updateQty(i.product, Math.min(i.countInStock, i.qty + 1))} className="grid h-9 w-9 place-items-center"><Plus size={14} /></button>
                  </div>
                  <span className="font-semibold">${(i.price * i.qty).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl bg-white p-6">
          <h2 className="font-serif text-xl">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-ink/60">Subtotal</dt><dd>${subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Shipping</dt><dd>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</dd></div>
            <div className="flex justify-between"><dt className="text-ink/60">Tax (8%)</dt><dd>${tax.toFixed(2)}</dd></div>
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-3 text-base font-semibold">
              <dt>Total</dt><dd>${total.toFixed(2)}</dd>
            </div>
          </dl>
          <button
            onClick={() => navigate(user ? '/checkout' : '/login?redirect=/checkout')}
            className="btn-primary mt-6 w-full"
          >
            Checkout
          </button>
          <Link to="/shop" className="mt-3 block text-center text-sm text-ink/50 hover:text-ink">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
