import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, LogOut, Heart } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { itemCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
  ];
  if (user && (user.isAdmin || user.role !== 'customer')) links.push({ to: '/admin', label: 'Admin' });

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Lumière" className="h-9 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm transition hover:text-gold ${isActive ? 'text-gold' : 'text-ink/70'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link to="/profile" className="text-sm text-ink/70 hover:text-gold">
                {user.name.split(' ')[0]}
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} aria-label="Log out" className="text-ink/60 hover:text-ink">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden items-center gap-1 text-sm text-ink/70 hover:text-gold md:flex">
              <User size={18} /> Sign in
            </Link>
          )}

          <Link to="/wishlist" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="Wishlist">
            <Heart size={20} className="text-ink/70 hover:text-gold" />
          </Link>

          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-ink/10 bg-cream px-6 py-4 md:hidden">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block py-2 text-ink/80"
            >
              {l.label}
            </NavLink>
          ))}
          <div className="mt-2 border-t border-ink/10 pt-2">
            {user ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="block py-2 text-ink/80">
                  Profile & Addresses
                </Link>
                <Link to="/orders" onClick={() => setOpen(false)} className="block py-2 text-ink/80">
                  My orders
                </Link>
                <Link to="/wishlist" onClick={() => setOpen(false)} className="block py-2 text-ink/80">
                  Wishlist
                </Link>
                <button onClick={() => { logout(); setOpen(false); navigate('/'); }} className="py-2 text-ink/80">
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="block py-2 text-ink/80">
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
