'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { getCookie } from "typescript-cookie";

export default function Header() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const accessToken = getCookie('access_token');

                if (!accessToken) {
                    console.error('Access token missing');
                    return;
                }

                const response = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const userData = await response.json();
                setUser(userData);
            } catch {
                console.error('Error fetching user:');
            }
        };

        fetchUser();
    }, []);

    return (
        <header className="bg-teal-500 text-white p-8 rounded-b-lg shadow-md relative">
            <div className="container mx-auto flex justify-between items-center">
                {user ? (
                        <div>
                            <span className="text-2xl">Bonjour {user.firstname} {user.lastname} !</span>
                        </div>
                    ) :
                    <div>
                        <span className="text-2xl">Bonjour !</span>
                    </div>
                }
                <Link href="/" className="flex-1">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold mb-2">Bienvenue sur le GIGA Drive !</h1>
                        <p className="text-lg">Vos courses en ligne prêtes en un clin d'œil.</p>
                    </div>
                </Link>
                <div className="flex space-x-4">
                    {/*<Link href="/panier">*/}
                        <button className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
                            Panier
                        </button>
                    {/*</Link>*/}
                    {user ? (
                        <>
                            <LogoutButton />
                        </>
                    ) : (
                        <Link href="/connexion">
                            <button className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
                                Connexion
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}