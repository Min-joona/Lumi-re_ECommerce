export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <h4 className="font-serif text-xl">Lumière<span className="text-gold">.</span></h4>
          <p className="mt-2 text-sm text-ink/60">
            Considered goods for a considered life. Built on the MERN stack.
          </p>
        </div>
        <div>
          <h5 className="text-sm font-semibold">Shop</h5>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li>New arrivals</li><li>Best sellers</li><li>On sale</li>
          </ul>
        </div>
        <div>
          <h5 className="text-sm font-semibold">Support</h5>
          <ul className="mt-3 space-y-2 text-sm text-ink/60">
            <li>Shipping</li><li>Returns</li><li>Contact</li>
          </ul>
        </div>
        <div>
          <h5 className="text-sm font-semibold">Newsletter</h5>
          <p className="mt-3 text-sm text-ink/60">Join for early access to drops.</p>
          <div className="mt-3 flex gap-2">
            <input className="input" placeholder="Email address" />
            <button className="btn-primary shrink-0">Join</button>
          </div>
        </div>
      </div>
      <div className="border-t border-ink/10 py-6 text-center text-xs text-ink/40">
        © {new Date().getFullYear()} Lumière — Designed & built by Amar Hassen Mohammednur.
      </div>
    </footer>
  );
}
