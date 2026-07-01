import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Truck, ShieldCheck, RefreshCw } from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

const categories = [
  { name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=600&fit=crop' },
  { name: 'Fashion', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=600&fit=crop' },
  { name: 'Home', image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=600&fit=crop' },
  { name: 'Accessories', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&h=600&fit=crop' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/products?featured=true&limit=8')
      .then(({ data }) => setFeatured(data.products))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-gold">New Season · 2026</span>
            <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-6xl">
              Considered goods for a considered life.
            </h1>
            <p className="mt-5 max-w-md text-ink/60">
              A curated edit of electronics, fashion, and home essentials — chosen for
              craft, longevity, and quiet good taste.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">
                Shop the collection <ArrowRight size={16} />
              </Link>
              <Link to="/shop?sort=rating" className="btn-ghost">Best sellers</Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative aspect-[4/5] overflow-hidden rounded-3xl"
          >
            <img
              src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&h=1100&fit=crop"
              alt="Featured"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 sm:grid-cols-3">
          {[
            { icon: Truck, t: 'Free shipping over $100', s: 'Fast, tracked delivery' },
            { icon: RefreshCw, t: '30-day returns', s: 'No-questions-asked' },
            { icon: ShieldCheck, t: 'Secure checkout', s: 'Your data, protected' },
          ].map(({ icon: Icon, t, s }) => (
            <div key={t} className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-cream text-gold">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">{t}</p>
                <p className="text-xs text-ink/50">{s}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-serif text-3xl">Shop by category</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.name}
              to={`/shop?category=${c.name}`}
              className="group relative aspect-square overflow-hidden rounded-2xl"
            >
              <img src={c.image} alt={c.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
              <span className="absolute bottom-4 left-4 font-serif text-xl text-white">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl">Featured pieces</h2>
          <Link to="/shop" className="text-sm text-ink/60 hover:text-gold">View all →</Link>
        </div>
        {loading ? (
          <Loader />
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
