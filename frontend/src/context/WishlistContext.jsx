import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      api.get('/api/auth/wishlist')
        .then(res => setWishlist(res.data))
        .catch(console.error);
    } else {
      setWishlist([]);
    }
  }, [user]);

  const toggleWishlist = async (product) => {
    if (!user) {
      toast.error('Please sign in to save items.');
      return;
    }
    const isSaved = wishlist.some(item => item._id === product._id);
    try {
      if (isSaved) {
        setWishlist(wishlist.filter(item => item._id !== product._id));
        await api.delete(`/api/auth/wishlist/${product._id}`);
      } else {
        setWishlist([...wishlist, product]);
        await api.post('/api/auth/wishlist', { productId: product._id });
        toast.success('Saved to wishlist!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update wishlist');
      // Revert optimism if failed
      api.get('/api/auth/wishlist').then(res => setWishlist(res.data));
    }
  };

  const isWishlisted = (productId) => {
    return wishlist.some(item => item._id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
