import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import Loader from '../components/Loader';
import Rating from '../components/Rating';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const [related, setRelated] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/api/products/${slug}`)
      .then(({ data }) => {
        setProduct(data);
        if (data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
        return api.get(`/api/products/${data._id}/recommendations`);
      })
      .then(({ data }) => setRelated(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };
  useEffect(load, [slug]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/products/${slug}/reviews`, review);
      toast.success('Thanks for your review!');
      setReview({ rating: 5, comment: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    }
  };

  if (loading) return <Loader />;
  if (!product) return <p className="py-24 text-center">Product not found.</p>;

  const onSale = product.compareAtPrice > product.price;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/shop" className="mb-6 inline-flex items-center gap-1 text-sm text-ink/50 hover:text-ink">
        <ChevronLeft size={16} /> Back to shop
      </Link>

      <div className="grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl bg-white">
          <img src={selectedVariant && selectedVariant.images && selectedVariant.images.length > 0 ? selectedVariant.images[0] : product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>

        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-gold">{product.brand}</span>
          <h1 className="mt-2 font-serif text-4xl">{product.name}</h1>
          <div className="mt-3"><Rating value={product.rating} count={product.numReviews} size={16} /></div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold">${(selectedVariant?.price || product.price).toFixed(2)}</span>
            {onSale && !selectedVariant && <span className="text-lg text-ink/40 line-through">${product.compareAtPrice.toFixed(2)}</span>}
          </div>

          <p className="mt-5 leading-relaxed text-ink/70">{product.description}</p>

          <div className="mt-6 flex items-center gap-2 text-sm">
            {(selectedVariant ? selectedVariant.countInStock : product.countInStock) > 0 ? (
              <span className="inline-flex items-center gap-1 text-green-700">
                <Check size={16} /> In stock ({(selectedVariant ? selectedVariant.countInStock : product.countInStock)})
              </span>
            ) : (
              <span className="text-red-600">Currently sold out</span>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-ink/70 mb-3">Select Variant</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v._id || v.name}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      selectedVariant?._id === v._id
                        ? 'border-gold bg-gold/5 text-gold'
                        : 'border-ink/15 text-ink/60 hover:border-ink/30'
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-ink/15">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-11 w-11 place-items-center"><Minus size={16} /></button>
              <span className="w-8 text-center">{qty}</span>
              <button onClick={() => setQty(Math.min((selectedVariant ? selectedVariant.countInStock : product.countInStock), qty + 1))} className="grid h-11 w-11 place-items-center"><Plus size={16} /></button>
            </div>
            <button
              onClick={() => {
                const itemToAdd = selectedVariant ? { ...product, price: selectedVariant.price, countInStock: selectedVariant.countInStock, image: selectedVariant.images?.[0] || product.image } : product;
                addToCart(itemToAdd, qty, selectedVariant?._id, selectedVariant?.name);
              }}
              disabled={(selectedVariant ? selectedVariant.countInStock : product.countInStock) === 0}
              className="btn-primary flex-1"
            >
              <ShoppingBag size={16} /> Add to cart
            </button>
          </div>

          {product.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="rounded-full bg-white px-3 py-1 text-xs text-ink/60">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Carousel */}
      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-serif text-2xl">Customers Also Bought</h2>
          <div className="mt-8 flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
            {related.map((p) => (
              <div key={p._id} className="min-w-[280px] max-w-[280px] snap-start">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="mt-20 max-w-3xl">
        <h2 className="font-serif text-2xl">Reviews ({product.numReviews})</h2>
        <div className="mt-6 space-y-5">
          {product.reviews.length === 0 && <p className="text-ink/50">No reviews yet — be the first.</p>}
          {product.reviews.map((r) => (
            <div key={r._id} className="rounded-2xl bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.name}</span>
                <Rating value={r.rating} />
              </div>
              <p className="mt-2 text-sm text-ink/70">{r.comment}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          {user ? (
            <form onSubmit={submitReview} className="rounded-2xl bg-white p-6">
              <h3 className="font-semibold">Write a review</h3>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-ink/60">Rating</span>
                <select
                  value={review.rating}
                  onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
                  className="rounded-lg border border-ink/15 px-3 py-1.5 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 && 's'}</option>)}
                </select>
              </div>
              <textarea
                className="input mt-3"
                rows={3}
                placeholder="Share your thoughts…"
                value={review.comment}
                onChange={(e) => setReview({ ...review, comment: e.target.value })}
                required
              />
              <button className="btn-primary mt-3">Submit review</button>
            </form>
          ) : (
            <p className="text-sm text-ink/50">
              <Link to="/login" className="text-gold underline">Sign in</Link> to write a review.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
