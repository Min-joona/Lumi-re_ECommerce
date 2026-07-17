import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VoxideClient, VoxideWidget } from '@voxide/react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const voiceKey = import.meta.env.VITE_VOXIDE_PUBLIC_KEY;

/**
 * Kept at the app root so the live voice connection survives every route change.
 * Voxide only receives useful, live storefront state—never an access token.
 */
export default function Assistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const cart = useCart();
  const live = useRef({ user: null, cart: null, navigate });
  live.current = { user, cart, navigate };

  const ai = useMemo(() => {
    if (!voiceKey) return null;
    const client = new VoxideClient({
      publicKey: voiceKey,
      language: 'en-US',
      ui: {
        accentColor: '#c9a24b',
        title: 'Amar concierge',
        launcherLabel: 'Ask Amar',
        skin: 'glass',
        starters: ['Find a gift', 'What is in my cart?', 'Track my order'],
      },
    });

    client.enableNavigation({ push: (path) => live.current.navigate(path) });
    client.register({
      searchCatalog: {
        description: 'Search the Amar product catalogue and show matching products.',
        params: { query: { type: 'string', required: true, description: 'Product name, material, category, or keyword' } },
        handler: async ({ query }) => {
          const { data } = await api.get('/api/products', { params: { search: query, limit: 6 } });
          live.current.navigate(`/shop?search=${encodeURIComponent(query)}`);
          return { matches: data.count, products: data.products.map((p) => ({ name: p.name, price: p.price, inStock: p.countInStock > 0 })) };
        },
      },
      addMatchingProductToCart: {
        description: 'Find a product by name and add the best matching in-stock item to the cart.',
        params: { query: { type: 'string', required: true }, quantity: { type: 'number', required: false } },
        handler: async ({ query, quantity = 1 }) => {
          const { data } = await api.get('/api/products', { params: { search: query, limit: 8 } });
          const product = data.products.find((p) => p.countInStock > 0);
          if (!product) return { status: 'not_found', message: `No in-stock product matched “${query}”.` };
          live.current.cart.addToCart(product, Math.max(1, Math.floor(quantity)));
          return { status: 'ok', product: product.name, quantity: Math.max(1, Math.floor(quantity)), cartItems: live.current.cart.itemCount + Math.max(1, Math.floor(quantity)) };
        },
      },
      viewCart: {
        description: 'Open the shopping cart and summarize its current items and subtotal.',
        handler: async () => {
          const { cart: currentCart } = live.current;
          live.current.navigate('/cart');
          return { items: currentCart.itemCount, subtotal: currentCart.subtotal, products: currentCart.items.map((item) => ({ name: item.name, quantity: item.qty })) };
        },
      },
      beginCheckout: {
        description: 'Take the customer to checkout for the items currently in their cart.',
        scope: '/cart',
        handler: async () => {
          if (!live.current.user) return { status: 'login_required', message: 'Please sign in before checkout.' };
          if (!live.current.cart.items.length) return { status: 'empty_cart', message: 'The cart is empty.' };
          live.current.navigate('/checkout');
          return { status: 'ok', message: 'Checkout is ready.' };
        },
      },
      lookUpMyOrder: {
        description: 'Look up the current customer’s order by its order ID and report its shipping and payment status.',
        params: { orderId: { type: 'string', required: true } },
        handler: async ({ orderId }) => {
          if (!live.current.user) return { status: 'login_required', message: 'Please sign in to see an order.' };
          const { data: order } = await api.get(`/api/orders/${orderId}`);
          live.current.navigate(`/orders/${order._id}`);
          return { order: order._id.slice(-8).toUpperCase(), status: order.status, trackingNumber: order.trackingNumber || 'Not yet assigned' };
        },
      },
      openSupport: {
        description: 'Open the sign-in or orders page so a customer can get account or order help.',
        handler: async () => {
          const path = live.current.user ? '/orders' : '/login';
          live.current.navigate(path);
          return { status: 'ok', destination: path };
        },
      },
      clearCart: {
        description: 'Remove every item from the customer’s shopping cart.',
        dangerous: true,
        handler: async () => {
          live.current.cart.clearCart();
          toast.success('Cart cleared');
          return { status: 'ok' };
        },
      },
      updateOrderStatus: {
        description: 'For authorized staff, update an order status from the admin dashboard workflow.',
        scope: '/admin',
        dangerous: true,
        params: {
          orderId: { type: 'string', required: true },
          status: { type: 'string', required: true, enum: ['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'] },
          trackingNumber: { type: 'string', required: false },
        },
        handler: async ({ orderId, status, trackingNumber }) => {
          const staff = live.current.user?.isAdmin || (live.current.user?.role && live.current.user.role !== 'customer');
          if (!staff) return { status: 'forbidden', message: 'Only authorized staff can update an order.' };
          const { data } = await api.put(`/api/orders/${orderId}/status`, { status, trackingNumber, note: 'Updated through the voice assistant' });
          return { status: 'ok', order: data._id.slice(-8).toUpperCase(), orderStatus: data.status, trackingNumber: data.trackingNumber || null };
        },
      },
    });
    client.bindState(() => ({
      currentPage: window.location.pathname,
      signedIn: Boolean(live.current.user),
      isStaff: Boolean(live.current.user?.isAdmin || (live.current.user?.role && live.current.user.role !== 'customer')),
      customerName: live.current.user?.name || null,
      cartItemCount: live.current.cart?.itemCount || 0,
      cartSubtotal: live.current.cart?.subtotal || 0,
      cartProducts: live.current.cart?.items.map((item) => ({ name: item.name, quantity: item.qty })) || [],
    }));
    return client;
  }, []);

  useEffect(() => {
    if (!ai) return;
    ai.setActiveRoute(location.pathname);
    ai.setUser(user ? { userId: user._id, email: user.email, name: user.name } : null);
  }, [ai, location.pathname, user]);

  if (!ai) return null;
  return <VoxideWidget client={ai} theme="auto" accentColor="#c9a24b" title="Amar concierge" />;
}
