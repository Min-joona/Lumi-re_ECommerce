import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'addresses'
  
  // Personal Info State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  // Addresses State
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '', address: '', city: '', postalCode: '', country: '', isDefault: false
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAddresses(user.addresses || []);
    }
  }, [user]);

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/api/auth/me', { name, email, password });
      setUser(data.user);
      toast.success('Profile updated');
      setPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { data } = await api.put(`/api/auth/addresses/${editingId}`, addressForm);
        setAddresses(data.addresses);
        setUser({ ...user, addresses: data.addresses });
        toast.success('Address updated');
      } else {
        const { data } = await api.post('/api/auth/addresses', addressForm);
        setAddresses(data.addresses);
        setUser({ ...user, addresses: data.addresses });
        toast.success('Address added');
      }
      setShowAddressForm(false);
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      const { data } = await api.delete(`/api/auth/addresses/${id}`);
      setAddresses(data.addresses);
      setUser({ ...user, addresses: data.addresses });
      toast.success('Address deleted');
    } catch (err) {
      toast.error('Failed to delete address');
    }
  };

  const openEdit = (addr) => {
    setAddressForm(addr);
    setEditingId(addr._id);
    setShowAddressForm(true);
  };

  const openNew = () => {
    setAddressForm({ fullName: '', address: '', city: '', postalCode: '', country: '', isDefault: false });
    setEditingId(null);
    setShowAddressForm(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-serif text-4xl mb-8">My Account</h1>
      
      <div className="flex gap-4 border-b border-ink/10 mb-8">
        <button 
          onClick={() => setActiveTab('info')} 
          className={`pb-3 text-sm font-medium transition ${activeTab === 'info' ? 'border-b-2 border-gold text-gold' : 'text-ink/60 hover:text-ink'}`}
        >
          Personal Info
        </button>
        <button 
          onClick={() => setActiveTab('addresses')} 
          className={`pb-3 text-sm font-medium transition ${activeTab === 'addresses' ? 'border-b-2 border-gold text-gold' : 'text-ink/60 hover:text-ink'}`}
        >
          Address Book
        </button>
      </div>

      {activeTab === 'info' && (
        <form onSubmit={handleUpdateInfo} className="max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-sm">
          <div>
            <label className="mb-1 block text-sm text-ink/70">Full Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">Email</label>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink/70">New Password (leave blank to keep current)</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} />
          </div>
          <button type="submit" className="btn-primary w-full">Save Changes</button>
        </form>
      )}

      {activeTab === 'addresses' && (
        <div>
          {!showAddressForm ? (
            <>
              <button onClick={openNew} className="btn-primary mb-6">Add New Address</button>
              {addresses.length === 0 ? (
                <p className="text-ink/50">You have no saved addresses.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {addresses.map(addr => (
                    <div key={addr._id} className="relative rounded-2xl bg-white p-6 shadow-sm border border-ink/5">
                      {addr.isDefault && <span className="absolute top-4 right-4 text-xs font-semibold text-gold bg-gold/10 px-2 py-1 rounded-full">Default</span>}
                      <h4 className="font-semibold">{addr.fullName}</h4>
                      <p className="text-sm text-ink/70 mt-2">{addr.address}</p>
                      <p className="text-sm text-ink/70">{addr.city}, {addr.postalCode}</p>
                      <p className="text-sm text-ink/70">{addr.country}</p>
                      
                      <div className="mt-4 flex gap-3 text-sm">
                        <button onClick={() => openEdit(addr)} className="text-gold hover:underline">Edit</button>
                        <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSaveAddress} className="max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="font-serif text-xl mb-4">{editingId ? 'Edit Address' : 'New Address'}</h3>
              <input className="input" placeholder="Full Name" value={addressForm.fullName} onChange={(e) => setAddressForm({...addressForm, fullName: e.target.value})} required />
              <input className="input" placeholder="Street Address" value={addressForm.address} onChange={(e) => setAddressForm({...addressForm, address: e.target.value})} required />
              <div className="flex gap-4">
                <input className="input" placeholder="City" value={addressForm.city} onChange={(e) => setAddressForm({...addressForm, city: e.target.value})} required />
                <input className="input" placeholder="Postal Code" value={addressForm.postalCode} onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})} required />
              </div>
              <input className="input" placeholder="Country" value={addressForm.country} onChange={(e) => setAddressForm({...addressForm, country: e.target.value})} required />
              
              <label className="flex items-center gap-2 text-sm mt-4">
                <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})} />
                Set as default shipping address
              </label>

              <div className="mt-6 flex gap-3">
                <button type="submit" className="btn-primary flex-1">Save Address</button>
                <button type="button" onClick={() => setShowAddressForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
