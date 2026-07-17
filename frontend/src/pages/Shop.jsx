import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Star } from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Loader from '../components/Loader';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || 'All';
  const sort = params.get('sort') || 'newest';
  const search = params.get('search') || '';
  const minRating = params.get('minRating') || '';
  const page = Number(params.get('page')) || 1;

  useEffect(() => {
    api.get('/api/products/categories').then(({ data }) => setCategories(['All', ...data]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ category, sort, page });
    if (search) q.set('search', search);
    if (minRating) q.set('minRating', minRating);
    api
      .get(`/api/products?${q.toString()}`)
      .then(({ data }) => {
        setProducts(data.products);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [category, sort, search, minRating, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'All') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl">The Shop</h1>
          <p className="mt-1 text-sm text-ink/50">
            {category === 'All' ? 'All products' : category}
            {search && ` · “${search}”`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-ink/40" />
          <select
            value={sort}
            onChange={(e) => setParam('sort', e.target.value)}
            className="rounded-full border border-ink/15 bg-white px-4 py-2 text-sm outline-none"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-8 md:flex-row">
        {/* Sidebar */}
        <aside className="w-full shrink-0 md:w-64 space-y-8">
          <div>
            <h3 className="font-serif text-lg mb-3">Categories</h3>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c}>
                  <button
                    onClick={() => setParam('category', c)}
                    className={`text-sm transition-colors hover:text-gold ${
                      category === c ? 'font-semibold text-gold' : 'text-ink/70'
                    }`}
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-serif text-lg mb-3">Customer Reviews</h3>
            <ul className="space-y-2">
              {[4, 3, 2, 1].map((rating) => (
                <li key={rating}>
                  <button
                    onClick={() => setParam('minRating', String(rating))}
                    className={`flex items-center gap-1 text-sm transition-colors hover:text-gold ${
                      minRating === String(rating) ? 'font-semibold text-gold' : 'text-ink/70'
                    }`}
                  >
                    <div className="flex text-gold">
                      {Array.from({ length: rating }).map((_, i) => <Star key={i} size={14} className="fill-gold" />)}
                      {Array.from({ length: 5 - rating }).map((_, i) => <Star key={i} size={14} className="text-gold/30" />)}
                    </div>
                    <span>& Up</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => setParam('minRating', '')}
                  className={`text-sm transition-colors hover:text-gold ${
                    !minRating ? 'font-semibold text-gold' : 'text-ink/70'
                  }`}
                >
                  All Reviews
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <Loader />
          ) : products.length === 0 ? (
            <div className="py-24 text-center rounded-2xl bg-white">
              <p className="text-ink/50 text-lg">No products found matching your filters.</p>
              <button onClick={() => { setParams(new URLSearchParams()); }} className="mt-4 text-gold hover:underline">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-12 flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setParam('page', String(p))}
                  className={`h-10 w-10 rounded-full text-sm ${
                    p === page ? 'bg-ink text-white' : 'border border-ink/15 hover:border-ink/40'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
