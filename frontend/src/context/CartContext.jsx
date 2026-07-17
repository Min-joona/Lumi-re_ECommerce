import { createContext, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product, qty = 1, variantId = null, variantName = null) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product === product._id && i.variantId === variantId);
      if (existing) {
        return prev.map((i) =>
          i.product === product._id && i.variantId === variantId
            ? { ...i, qty: Math.min(i.qty + qty, product.countInStock) }
            : i
        );
      }
      return [
        ...prev,
        {
          product: product._id,
          slug: product.slug,
          name: product.name,
          image: product.image,
          price: product.price,
          countInStock: product.countInStock,
          qty,
          variantId,
          variantName,
        },
      ];
    });
    toast.success(`${product.name}${variantName ? ` (${variantName})` : ''} added to cart`);
  };

  const updateQty = (productId, variantId, qty) =>
    setItems((prev) => prev.map((i) => (i.product === productId && i.variantId === variantId ? { ...i, qty } : i)));

  const removeFromCart = (productId, variantId) =>
    setItems((prev) => prev.filter((i) => !(i.product === productId && i.variantId === variantId)));

  const clearCart = () => setItems([]);

  const itemCount = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQty, removeFromCart, clearCart, itemCount, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}
