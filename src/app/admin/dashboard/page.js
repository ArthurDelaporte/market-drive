'use client';

import { useEffect, useState } from 'react';
import { getCookie } from 'typescript-cookie';

export default function AdminDashboardPage() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const accessToken = getCookie('access_token');
                if (!accessToken) {
                    return;
                }

                const response = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                } else {
                    console.error('Error fetching user data');
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, []);

    if (!user) {
        return <p>Chargement...</p>;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <h1 className="text-4xl font-bold">Bonjour {user.firstname} {user.lastname} !</h1>
        </div>
    );
}