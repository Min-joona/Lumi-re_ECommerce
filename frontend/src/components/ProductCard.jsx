import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Heart } from 'lucide-react';
import Rating from './Rating';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist, isWishlisted } = useWishlist() || {};
  const onSale = product.compareAtPrice > product.price;
  const saved = isWishlisted ? isWishlisted(product._id) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group relative flex flex-col"
    >
      <Link to={`/product/${product.slug}`} className="relative block overflow-hidden rounded-2xl bg-white">
        <div className="aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        </div>
        {onSale && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 text-[11px] font-semibold text-white">
            Sale
          </span>
        )}
        {product.countInStock === 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-[11px] font-semibold text-white">
            Sold out
          </span>
        )}
      </Link>
      
      <button 
        onClick={(e) => { e.preventDefault(); toggleWishlist && toggleWishlist(product); }}
        className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white text-ink shadow-sm transition hover:scale-110"
        aria-label="Save to wishlist"
      >
        <Heart size={16} className={saved ? "fill-gold text-gold" : ""} />
      </button>

      <div className="mt-4 flex flex-1 flex-col">
        <span className="text-[11px] uppercase tracking-widest text-ink/40">{product.category}</span>
        <Link to={`/product/${product.slug}`}>
          <h3 className="mt-1 font-serif text-lg leading-snug hover:text-gold">{product.name}</h3>
        </Link>
        <div className="mt-1">
          <Rating value={product.rating} count={product.numReviews} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">ETB {product.price.toFixed(2)}</span>
            {onSale && (
              <span className="text-sm text-ink/40 line-through">
                ETB {product.compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            disabled={product.countInStock === 0}
            aria-label="Add to cart"
            className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition hover:bg-gold disabled:opacity-30"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
