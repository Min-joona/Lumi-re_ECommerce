import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
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
  const page = Number(params.get('page')) || 1;

  useEffect(() => {
    api.get('/api/products/categories').then(({ data }) => setCategories(['All', ...data]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ category, sort, page });
    if (search) q.set('search', search);
    api
      .get(`/api/products?${q.toString()}`)
      .then(({ data }) => {
        setProducts(data.products);
        setPages(data.pages);
      })
      .finally(() => setLoading(false));
  }, [category, sort, search, page]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'All') next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
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

      {/* Category pills */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setParam('category', c)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
              category === c ? 'border-ink bg-ink text-white' : 'border-ink/15 text-ink/70 hover:border-ink/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <p className="py-24 text-center text-ink/50">No products found.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
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
  );
}
