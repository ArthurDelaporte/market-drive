import { useState } from 'react';

interface ProfileFormProps {
  user: any; // We'll use the type from your API response
  onSubmit: (data: any) => void;
  isAdmin?: boolean;
}

export default function ProfileForm({ user, onSubmit, isAdmin = false }: ProfileFormProps) {
  const [formData, setFormData] = useState(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const changedData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== user[key]) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
    
    onSubmit(changedData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            value={formData.firstname ?? ''}
            onChange={(e) => setFormData({...formData, firstname: e.target.value})}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={formData.lastname ?? ''}
            onChange={(e) => setFormData({...formData, lastname: e.target.value})}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email ?? ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Birthdate</label>
          <input
            type="date"
            value={formData.birthdate ? new Date(formData.birthdate).toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        
        {/* Only show role field for admin users */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              value={formData.role ?? 'client'}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              className="w-full p-2 border rounded-lg"
            >
              <option value="client">Client</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
        
        <button type="submit">
          Save Changes
        </button>
      </div>
    </form>
  );
}