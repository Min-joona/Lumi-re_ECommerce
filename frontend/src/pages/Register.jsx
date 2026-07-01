import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6">
      <div className="w-full">
        <h1 className="font-serif text-4xl">Create account</h1>
        <p className="mt-2 text-sm text-ink/50">Join Lumière in seconds.</p>
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input className="input" placeholder="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" type="email" placeholder="Email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="input" type="password" placeholder="Password (min 6 chars)" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <button disabled={busy} className="btn-primary w-full">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="mt-6 text-sm text-ink/60">
          Already have an account? <Link to="/login" className="text-gold underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
