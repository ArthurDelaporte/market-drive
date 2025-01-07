'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import LogoutButton from './LogoutButton';
import { getCookie } from "typescript-cookie";
import { PUBLIC_PAGES } from '@/config/constants';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false); // Empêche les vérifications multiples

    useEffect(() => {
        if (hasCheckedAuth) return; // Vérifie si l'authentification a déjà été contrôlée
        setHasCheckedAuth(true);

        const fetchUser = async () => {
            try {
                const accessToken = getCookie('access_token');

                if (!accessToken) {
                    toast.error("Vous n'êtes pas connectés. Veuillez vous connecter.", { toastId: 'missing-token' });
                    if (!PUBLIC_PAGES.includes(pathname)) router.push('/connexion');
                    return;
                }

                const response = await fetch('/api/auth/user', {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    const errorMessage = errorData.error;

                    if (errorMessage === 'Access token expired') {
                        toast.error('Votre session a expiré. Veuillez vous reconnecter.', { toastId: 'session-expired' });
                    } else if (errorMessage === 'Invalid access token') {
                        toast.error('Token invalide. Veuillez vous reconnecter.', { toastId: 'invalid-token' });
                    } else if (errorMessage === 'User not found in database') {
                        toast.error('Utilisateur introuvable.', { toastId: 'user-not-found' });
                    } else {
                        toast.error('Une erreur inconnue est survenue.', { toastId: 'unknown-error' });
                    }

                    if (!PUBLIC_PAGES.includes(pathname)) router.push('/connexion');
                } else {
                    const userData = await response.json();
                    setUser(userData);
                }
            } catch (error) {
                toast.error('Une erreur est survenue lors de la récupération des données utilisateur.', { toastId: 'fetch-error' });
                console.error('Error fetching user:', error);
            }
        };

        fetchUser();
    }, [hasCheckedAuth, pathname, router]);

    return (
        <>
            <ToastContainer />
            <header className="bg-teal-500 text-white p-8 rounded-b-lg shadow-md relative">
                <div className="container mx-auto flex justify-between items-center">
                    {user ? (
                        <div>
                            <span className="text-2xl">Bonjour {user.firstname} {user.lastname} !</span>
                        </div>
                    ) : (
                        <div>
                            <span className="text-2xl">Bonjour !</span>
                        </div>
                    )}
                    <Link href="/" className="flex-1">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold mb-2">Bienvenue sur le GIGA Drive !</h1>
                            <p className="text-lg">Vos courses en ligne prêtes en un clin d'œil.</p>
                        </div>
                    </Link>
                    <div className="flex space-x-4">
                        <button className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
                            Mon Panier
                        </button>
                        {user ? (
                            <LogoutButton />
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
        </>
    );
}