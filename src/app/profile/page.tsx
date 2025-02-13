'use client';

import { useEffect, useState } from 'react';
import ProfileForm from '@/components/Profileform';
import { getCookie } from 'typescript-cookie';
import Header from '@/components/Header';

interface User {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  birthdate: Date | null;
  role: string | null;
  created_at: Date;
}

interface ProfileFormProps {
  user: User;
  onSubmit: (data: any) => Promise<void>;
  isAdmin: boolean;
  className?: string; 
  [key: string]: any;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie('access_token');
    if (token) setAccessToken(token);
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      const data = await response.json();
      setUser(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken, fetchProfile]);

  const handleProfileUpdate = async (data: any) => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      await fetchProfile(); // Refresh data after successful update
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  
  // Improved loading and error states with responsive design
  if (!accessToken) return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <p className="text-lg text-gray-600">Please log in to view your profile</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <p className="text-lg text-red-500">{error}</p>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center p-4 text-center">
      <p className="text-lg text-gray-600">No profile data found</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 pt-20">
        <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">
              Mon Profil
            </h1>
            <ProfileForm
              user={user}
              onSubmit={handleProfileUpdate}
              isAdmin={user?.role === 'admin'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}