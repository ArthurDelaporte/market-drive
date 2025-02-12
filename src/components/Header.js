'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, User, LogOut, Menu, ShoppingBag } from 'lucide-react';
import LogoutButton from './LogoutButton';
import DialogCategory from './DialogCategory';
import { getCookie, removeCookie } from "typescript-cookie";
import { PUBLIC_PAGES } from '@/config/constants';
import { toast, ToastContainer } from 'react-toastify';
import { FaStream } from 'react-icons/fa';
import { jwtDecode } from "jwt-decode";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();
    const menuRef = useRef(null);

    const [user, setUser] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);

    // Gestion du clic en dehors du menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsDesktopMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Chargement des données utilisateur au montage du composant
    useEffect(() => {
        if (hasCheckedAuth) return;

        const fetchUser = async () => {
            try {
                const accessToken = getCookie("access_token");

                if (!accessToken) {
                    if (!PUBLIC_PAGES.includes(pathname)) {
                        toast.error("Vous n'êtes pas connectés. Veuillez vous connecter.", { toastId: "missing-token" });
                        router.push("/connexion");
                    }
                    return;
                }

                try {
                    const { exp } = jwtDecode(accessToken);
                    const now = Date.now() / 1000;

                    if (exp && exp < now) {
                        removeCookie("access_token");
                        setUser(null);
                        return;
                    }

                    const response = await fetch("/api/auth/user", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });

                    if (!response.ok) {
                        const { error } = await response.json();
                        const messages = {
                            "Access token expired": "Votre session a expiré. Veuillez vous reconnecter.",
                            "Invalid access token": "Token invalide. Veuillez vous reconnecter.",
                            "User not found in database": "Utilisateur introuvable.",
                        };

                        toast.error(messages[error] || "Une erreur inconnue est survenue.", { toastId: error || "unknown-error" });

                        if (!PUBLIC_PAGES.includes(pathname)) router.push("/connexion");
                        return;
                    }

                    const userData = await response.json();
                    setUser(userData);
                    setHasCheckedAuth(true);
                } catch (decodeError) {
                    toast.error("Erreur lors du décodage du token.", { toastId: "token-decode-error" });
                    console.error("Token decode error:", decodeError);
                }
            } catch (error) {
                toast.error("Une erreur est survenue lors de récupération des données utilisateur.", { toastId: "fetch-error" });
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, [hasCheckedAuth, pathname, router]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/produits?productName=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <>
            <ToastContainer />
            <header className="text-white p-4 rounded-b-lg shadow-md fixed w-full z-50">
                {/* Desktop Navigation */}
                <div className="container mx-auto hidden md:block">
                    <div className="flex items-center justify-between gap-10 ml-10 mr-10">
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

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="flex-grow mx-4 relative">
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

                        <div className="flex items-center gap-3 relative" ref={menuRef}>
                            <button
                                onClick={() => setIsCategoryDialogOpen(true)}
                                className="px-5 py-3 rounded shadow transition btn-header flex items-center gap-2"
                            >
                                <FaStream className="h-6 w-7" />
                                Rayons
                            </button>
                            <button
                                onClick={() => setIsDesktopMenuOpen(!isDesktopMenuOpen)}
                                className="px-5 py-3 rounded shadow transition btn-header"
                            >
                                <Menu className="h-6 w-7" />
                            </button>

                            {/* Dropdown Modal */}
                            {isDesktopMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 bg-white text-black rounded-lg shadow-lg border">
                                    <Link href="/panier">
                                        <button
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                            aria-label="Voir mon panier"
                                        >
                                            Mon Panier
                                        </button>
                                    </Link>

                                    {user ? (
                                        <>
                                            <Link href="/profile" className="block">
                                                <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                                                    <User className="h-5 w-5" />
                                                    Mon profil
                                                </button>
                                            </Link>
                                            <Link href="/commandes" className="block">
                                                <button className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                                                    <ShoppingBag className="h-5 w-5" />
                                                    Mes commandes
                                                </button>
                                            </Link>
                                        <div className='block test'>
                                            <LogoutButton className="logoutbutton">
                                                <button className="logoutbutton w-full px-4 py-2 text-left hover:bg-gray-100 text-red-500 flex items-center gap-2">
                                                    <LogOut className="h-5 w-5" />
                                                    Se déconnecter
                                                </button>
                                            </LogoutButton>
                                            </div>
                                        </>
                                    ) : (
                                        <Link href="/connexion" className="block">
                                            <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                                Se connecter
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="container mx-auto md:hidden block">
                    <div className="flex justify-between items-center mb-4">
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
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCategoryDialogOpen(true)}
                                className="px-5 py-3 rounded shadow transition btn-header"
                            >
                                <FaStream className="h-6 w-7" />
                            </button>
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="px-5 py-3 rounded shadow transition btn-header"
                            >
                                <Menu className="h-6 w-7" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    <form onSubmit={handleSearch} className="relative mb-4">
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

                    {/* Mobile Menu */}
                    {isMobileMenuOpen && (
                        <div className="flex flex-col gap-2">
                            <button
                                className="px-4 py-2 rounded shadow transition btn-header"
                                aria-label="Voir mon panier"        
                            >
                                Mon Panier
                            </button>

                            {user ? (
                                <>
                                    <Link href="/profile">
                                        <button className="px-4 py-2 rounded shadow transition btn-header w-full">
                                            <div className="flex items-center gap-2">
                                                <User className="h-5 w-5" />
                                                Mon profil
                                            </div>
                                        </button>
                                    </Link>
                                    <Link href="/commandes">
                                        <button className="px-4 py-2 rounded shadow transition btn-header w-full">
                                            <div className="flex items-center gap-2">
                                                <ShoppingBag className="h-5 w-5" />
                                                Mes commandes
                                            </div>
                                        </button>
                                    </Link>
                                    <LogoutButton>
                                        <button className="px-4 py-2 rounded shadow transition btn-header text-red-500 w-full">
                                            <div className="flex items-center gap-2">
                                                <LogOut className="h-5 w-5" />
                                                Se déconnecter
                                            </div>
                                        </button>
                                    </LogoutButton>
                                </>
                            ) : (
                                <Link href="/connexion">
                                    <button className="px-4 py-2 rounded shadow transition btn-header w-full">
                                        Se connecter
                                    </button>
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* DialogCategory */}
            <DialogCategory
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
                isAdmin={false}
            />
        </>
    );
}
