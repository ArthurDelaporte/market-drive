'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, User, LogOut } from 'lucide-react';
import LogoutButton from './LogoutButton';
import DialogCategory from './DialogCategory'; // Import du composant DialogCategory
import { PUBLIC_PAGES } from '@/config/constants';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaStream } from 'react-icons/fa';
import { useAuth } from "@/context/AuthContext"; // ✅ Utilisation du contexte Auth


export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const { user, loading, signOut } = useAuth();

    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    useEffect(() => {
        if (!user && !loading) {
            if (!PUBLIC_PAGES.includes(pathname)) {
                toast.error("Vous devez être connecté pour accéder à cette page.", { toastId: 'auth-required' });
                router.push('/connexion');
            }
        }
    }, [user, loading, pathname, router]);
    

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/produits?productName=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <>
            <ToastContainer />
            <header className="text-white p-4 rounded-b-lg shadow-md fixed h-20 w-full z-50">
                <div className="container mx-auto flex items-center justify-between gap-4">
                    {/* Left section with logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0">
                            <Image
                                src="/img/logo/logo.png"
                                alt="GIGA Drive Logo"
                                width={90}
                                height={90}
                                className="rounded-lg"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Center section with search */}
                    <div className="flex items-center">
                        {/* Categories Button */}
                        <button
                            onClick={() => {
                                setIsCategoryDialogOpen(true);
                            }}
                            className="px-4 py-2 rounded shadow transition flex justify-center items-center gap-2 btn-header"
                        >
                            <FaStream className="h-5 w-5" />
                            Rayons
                        </button>
                    </div>

                    {/* Center section with search */}
                    <div className="flex-1 max-w-2xl">
                        {/* Search bar */}
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher un produit..."
                                className="w-full px-4 py-2 rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-white search-bar-header"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Rechercher un produit"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 search-bar-header w-4 h-4" />
                            <X
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 search-bar-header w-4 h-4"
                                onClick={() => setSearchQuery('')}
                            />
                        </form>
                    </div>

                    {/* Right section with cart and auth */}
                    <div className="flex items-center gap-3">
                        {/* Cart Button avec lien vers le panier */}
                        <Link href="/panier">
                            <button
                                className="px-4 py-2 rounded shadow transition btn-header"
                                aria-label="Voir mon panier"
                            >
                                Mon Panier
                            </button>
                        </Link>

                        {/* Auth Buttons */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link href="/profile">
                                    <button className="px-4 py-2 rounded shadow transition btn-header mr-2">
                                        <div className="flex items-center gap-2">
                                            <User className="h-5 w-5" />
                                            Mon profil
                                        </div>
                                    </button>
                                </Link>
                                <button onClick={signOut} className="px-4 py-2 rounded shadow transition btn-header text-red-500">
                                    <div className="flex items-center gap-2">
                                        <LogOut className="h-5 w-5" />
                                        Se déconnecter
                                    </div>
                                </button>
                            </div>
                        ) : (
                            <Link href="/connexion">
                                <button className="px-4 py-2 rounded shadow transition btn-header">
                                    Se connecter
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            {/* DialogCategory */}
            <DialogCategory
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
            />
        </>
    );
}