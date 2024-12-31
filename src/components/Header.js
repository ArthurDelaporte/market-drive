'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { getCookie } from "typescript-cookie";

export default function Header() {
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
            
                <div className="flex items-center space-x-4">
                    <img src="img/logo/Logo.png" alt="Logo GIGA Drive" className="h-20" />
                </div>
                {user ? (
                        <div>
                            <span className="text-2xl">Bonjour {user.firstname} {user.lastname} !</span>
                        </div>
                    ) :
                    <div>
                        <span className="text-2xl">Bonjour !</span>
                    </div>
                }
            <div className="flex items-center space-x-4">
                <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}  // Utilise la variable d'état `searchTerm`
                    onChange={(e) => setSearchTerm(e.target.value)} // Met à jour la valeur avec `setSearchTerm`
                    className="w-[38vw] h-[42px] p-2 border border-gray-300 rounded"  // Personnalisation de la barre de recherche
                />
            </div>
                <div className="flex space-x-4">
                    {/*<Link href="/panier">*/}
                        <button className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
                            Mon Panier
                        </button>
                    {/*</Link>*/}
                    {user ? (
                        <>
                            <LogoutButton />
                        </>
                    ) : (
                        <Link href="/connexion">
                            <button className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
                                Se connecter
                            </button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}