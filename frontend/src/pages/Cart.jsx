import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, BookmarkPlus, ShoppingCart } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Cart() {
  const { items, updateQty, removeFromCart, addToCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedItems, setSavedItems] = useState([]);

  useEffect(() => {
    if (user) {
      api.get('/api/auth/saved-for-later')
        .then(res => setSavedItems(res.data))
        .catch(console.error);
    }
  }, [user]);

  const handleSaveForLater = async (item) => {
    if (!user) {
      toast.error('Please log in to save items for later');
      return;
    }
    try {
      await api.post('/api/auth/saved-for-later', { productId: item.product });
      removeFromCart(item.product);
      toast.success('Saved for later');
      const res = await api.get('/api/auth/saved-for-later');
      setSavedItems(res.data);
    } catch (err) {
      toast.error('Could not save item');
    }
  };

  const handleMoveToCart = async (product) => {
    try {
      addToCart(product);
      await api.delete(`/api/auth/saved-for-later/${product._id}`);
      setSavedItems(savedItems.filter(i => i._id !== product._id));
    } catch (err) {
      toast.error('Could not move item to cart');
    }
  };

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
        
        {savedItems.length > 0 && (
          <div className="mt-20 w-full max-w-4xl text-left">
            <h2 className="font-serif text-2xl mb-6 border-b border-ink/10 pb-4">Saved for later ({savedItems.length} items)</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedItems.map((item) => (
                <div key={item._id} className="rounded-2xl bg-white p-4 shadow-sm border border-ink/5 flex flex-col gap-3">
                  <div className="flex gap-4">
                    <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-serif hover:text-gold block">{item.name}</Link>
                      <span className="font-semibold text-sm">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleMoveToCart(item)} className="btn-secondary w-full text-xs py-2 flex justify-center gap-1"><ShoppingCart size={14} /> Move to cart</button>
                </div>
              ))}
            </div>
          </div>
        )}
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
                  <Link to={`/product/${i.slug}`} className="font-serif text-lg hover:text-gold">{i.name} {i.variantName && <span className="text-sm font-sans text-ink/50 ml-2">({i.variantName})</span>}</Link>
                  <div className="flex gap-3">
                    <button onClick={() => handleSaveForLater(i)} className="text-ink/40 hover:text-gold" title="Save for later">
                      <BookmarkPlus size={18} />
                    </button>
                    <button onClick={() => removeFromCart(i.product, i.variantId)} className="text-ink/40 hover:text-red-600" title="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <span className="text-sm text-ink/50">${i.price.toFixed(2)} each</span>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink/15">
                    <button onClick={() => updateQty(i.product, i.variantId, Math.max(1, i.qty - 1))} className="grid h-9 w-9 place-items-center"><Minus size={14} /></button>
                    <span className="w-7 text-center text-sm">{i.qty}</span>
                    <button onClick={() => updateQty(i.product, i.variantId, Math.min(i.countInStock, i.qty + 1))} className="grid h-9 w-9 place-items-center"><Plus size={14} /></button>
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

      {savedItems.length > 0 && (
        <div className="mt-16 border-t border-ink/10 pt-10">
          <h2 className="font-serif text-2xl mb-6">Saved for later ({savedItems.length} items)</h2>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
            {savedItems.map((item) => (
              <div key={item._id} className="rounded-2xl bg-white p-4 shadow-sm border border-ink/5 flex flex-col gap-3">
                <div className="flex gap-4">
                  <img src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div>
                    <Link to={`/product/${item.slug}`} className="font-serif hover:text-gold block leading-tight">{item.name}</Link>
                    <span className="font-semibold text-sm mt-1 block">${item.price.toFixed(2)}</span>
                  </div>
                </div>
                <button onClick={() => handleMoveToCart(item)} className="btn-secondary w-full text-xs py-2 flex justify-center gap-1 mt-auto">
                  <ShoppingCart size={14} /> Move to cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
