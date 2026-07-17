import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';

export default function Wishlist() {
  const { wishlist } = useWishlist() || { wishlist: [] };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-serif text-4xl">Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-lg text-ink/60">Your wishlist is currently empty.</p>
          <Link to="/shop" className="btn-primary mt-6 inline-flex">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
