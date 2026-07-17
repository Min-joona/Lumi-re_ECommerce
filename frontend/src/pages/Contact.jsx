import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin } from 'lucide-react';
import api from '../api/client';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/contact', form);
      toast.success('Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="font-serif text-4xl mb-4 text-center">Contact Us</h1>
      <p className="text-center text-ink/60 mb-12">We'd love to hear from you. Please fill out the form below or reach out via our contact info.</p>
      
      <div className="grid md:grid-cols-3 gap-12">
        <div className="md:col-span-1 space-y-8">
          <div>
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2"><MapPin size={20} className="text-gold" /> Address</h3>
            <p className="text-ink/70">Bole Road, Dembel City Center<br/>Addis Ababa, Ethiopia</p>
          </div>
          <div>
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2"><Phone size={20} className="text-gold" /> Phone</h3>
            <p className="text-ink/70">+251 911 234 567</p>
          </div>
          <div>
            <h3 className="font-serif text-xl mb-4 flex items-center gap-2"><Mail size={20} className="text-gold" /> Email</h3>
            <p className="text-ink/70">support@lumierestore.com</p>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm mb-2 text-ink/70">Name</label>
                <input required className="input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm mb-2 text-ink/70">Email</label>
                <input required type="email" className="input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm mb-2 text-ink/70">Subject</label>
              <input required className="input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm mb-2 text-ink/70">Message</label>
              <textarea required className="input min-h-[150px]" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
            </div>
            <button disabled={loading} type="submit" className="btn-primary w-full md:w-auto">
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
