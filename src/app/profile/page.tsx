'use client';

import { useEffect, useState } from 'react';
import ProfileForm from '@/components/Profileform';
import {getCookie} from "typescript-cookie";

interface User {
  id: string;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  birthdate: Date | null;
  role: string | null;
  created_at: Date;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    // You might want to get this token from your auth context or localStorage
    const token = getCookie('access_token');
    if (token) setAccessToken(token);
  }, []);

  useEffect(() => {
    if (accessToken) {
      fetchProfile();
    }
  }, [accessToken]);

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

  if (!accessToken) return <div className="text-center p-8">Please log in to view your profile</div>;
  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;
  if (!user) return <div className="text-center p-8">No profile data found</div>;

  return (
    <div className="main">
      <h1 className="text-2xl font-bold text-center mb-8">My Profile</h1>
        <ProfileForm 
          user={user} 
          onSubmit={handleProfileUpdate}
          isAdmin={user?.role === 'admin'} 
        />
    </div>
  );
}