'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, User, Menu, ShoppingBag } from 'lucide-react';
import LogoutButton from './LogoutButton';
import DialogCategory from './DialogCategory';
import { getCookie, removeCookie } from "typescript-cookie";
import { PUBLIC_PAGES } from '@/config/constants';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import {FaStream, FaShoppingCart, FaProductHunt, FaUsers, FaShoppingBasket} from 'react-icons/fa';
import { jwtDecode } from "jwt-decode";

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const menuRefDesktop = useRef(null);
    const menuRefMobile = useRef(null);
    const menuButtonRefMobile = useRef(null);

    const [user, setUser] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
    const [pathnameDebut, setPathnameDebut] = useState('');

    // Gestion du clic en dehors du menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Vérifie si le clic est à l'extérieur ET qu'un menu est ouvert
            if (
                menuRefDesktop.current &&
                !menuRefDesktop.current.contains(event.target) &&
                isDesktopMenuOpen
            ) {
                setIsDesktopMenuOpen(false);
            }
            if (
                menuRefMobile.current &&
                !menuRefMobile.current.contains(event.target) &&
                menuButtonRefMobile.current &&
                !menuButtonRefMobile.current.contains(event.target) &&
                isMobileMenuOpen
            ) {
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isDesktopMenuOpen, isMobileMenuOpen]);

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
                    if (userData.role === "admin") setPathnameDebut('/admin')
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
            router.push(`${pathnameDebut}/produits?productName=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <>
            <header className="text-white p-4 rounded-b-lg shadow-md fixed w-full z-50">
                {/* Desktop Navigation */}
                <div className="container mx-auto hidden md:block">
                    <div className="flex items-center justify-between gap-10 ml-10 mr-10">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="flex-shrink-0">
                                <Image
                                    src="/img/logo/Logo.png"
                                    alt="GIGA Drive Logo"
                                    width={90}
                                    height={90}
                                    className="rounded-lg"
                                    priority
                                />
                            </Link>

                            {user && user.role === "admin" && (
                                <Link href="/admin" className="flex-shrink-0">
                                    <button
                                        className="px-5 py-3 rounded shadow transition btn-header flex items-center gap-2"
                                    >
                                        <p className="text-lg text-[#F57C00] font-bold">ADMIN</p>
                                    </button>
                                </Link>
                            )}
                        </div>

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
                            <Search
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 search-bar-header w-4 h-4"/>
                            <X
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 search-bar-header w-4 h-4"
                                onClick={() => setSearchQuery('')}
                            />
                        </form>

                        <div className="flex items-center gap-3 relative">
                            <button
                                onClick={() => setIsCategoryDialogOpen(true)}
                                className="px-5 py-3 rounded shadow transition btn-header flex items-center gap-2"
                            >
                                <FaStream className="h-6 w-7"/>
                                Rayons
                            </button>
                            <div ref={menuRefDesktop}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // Empêche le clic de fermer immédiatement le menu
                                        setIsDesktopMenuOpen(prev => !prev);
                                    }}
                                    className="px-5 py-3 rounded shadow transition btn-header flex items-center gap-2"
                                >
                                    <Menu className="h-6 w-7"/>
                                    Menu
                                </button>

                                {/* Dropdown Modal */}
                                {isDesktopMenuOpen && (
                                    <div
                                        className="absolute top-full right-0 mt-2 w-64 bg-white text-black rounded-lg shadow-lg border">
                                        {user ? (
                                            <>
                                                <Link href="/profile" className="block">
                                                    <button
                                                        className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                                                        <User className="h-5 w-5"/>
                                                        Mon profil
                                                    </button>
                                                </Link>
                                                {user.role !== "admin" ? (
                                                    <>
                                                        <Link href="/panier" className="block">
                                                            <button
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                                                aria-label="Voir mon panier"
                                                            >
                                                                <FaShoppingCart className="h-5 w-5"/>
                                                                Mon Panier
                                                            </button>
                                                        </Link>
                                                        <Link href="/commandes" className="block">
                                                            <button
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2">
                                                                <ShoppingBag className="h-5 w-5"/>
                                                                Mes commandes
                                                            </button>
                                                        </Link>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Link href="/admin/produits">
                                                            <button
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <FaProductHunt className="h-5 w-5"/>
                                                                    Les produits
                                                                </div>
                                                            </button>
                                                        </Link>
                                                        <Link href="/admin/users">
                                                            <button
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <FaUsers className="h-5 w-5"/>
                                                                    Les utilisateurs
                                                                </div>
                                                            </button>
                                                        </Link>
                                                        <Link href="/admin/commandes">
                                                            <button
                                                                className="w-full px-4 py-2 text-left hover:bg-gray-100">
                                                                <div className="flex items-center gap-2">
                                                                    <FaShoppingBasket className="h-5 w-5"/>
                                                                    Les commandes
                                                                </div>
                                                            </button>
                                                        </Link>
                                                    </>
                                                )}
                                                <div className='block'>
                                                    <LogoutButton/>
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
                </div>

                {/* Mobile Navigation */}
                <div className="container mx-auto md:hidden block">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
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

                            {user && user.role === "admin" && (
                                <Link href="/admin" className="flex-shrink-0">
                                    <button
                                        className="px-5 py-3 rounded shadow transition btn-header flex items-center gap-2"
                                    >
                                        <p className="text-lg text-[#F57C00] font-bold">ADMIN</p>
                                    </button>
                                </Link>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsCategoryDialogOpen(true)}
                                className="px-5 py-3 rounded shadow transition btn-header"
                            >
                                <FaStream className="h-6 w-7"/>
                            </button>
                            <div ref={menuButtonRefMobile}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMobileMenuOpen(prev => !prev);
                                    }}
                                    className="px-5 py-3 rounded shadow transition btn-header"
                                >
                                    <Menu className="h-6 w-7"/>
                                </button>
                            </div>
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
                        <Search
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 search-bar-header w-4 h-4"/>
                        <X
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 search-bar-header w-4 h-4"
                            onClick={() => setSearchQuery('')}
                        />
                    </form>

                    {/* Dropdown Modal */}
                    {isMobileMenuOpen && (
                        <div className="flex flex-col gap-2" ref={menuRefMobile}>
                            {user ? (
                                <>
                                    <Link href="/profile">
                                        <button className="px-4 py-2 rounded shadow transition btn-header w-full">
                                            <div className="flex items-center gap-2">
                                                <User className="h-5 w-5"/>
                                                Mon profil
                                            </div>
                                        </button>
                                    </Link>
                                    {user.role !== "admin" && (
                                        <>
                                            <Link href="/panier">
                                                <button
                                                    className="px-4 py-2 rounded shadow transition btn-header w-full">
                                                    <div className="flex items-center gap-2">
                                                        <FaShoppingCart className="h-5 w-5"/>
                                                        Mon Panier
                                                    </div>
                                                </button>
                                            </Link>
                                            <Link href="/commandes">
                                                <button
                                                    className="px-4 py-2 rounded shadow transition btn-header w-full">
                                                    <div className="flex items-center gap-2">
                                                        <ShoppingBag className="h-5 w-5"/>
                                                        Mes commandes
                                                    </div>
                                                </button>
                                            </Link>
                                        </>
                                    )}
                                    <div className='block'>
                                        <LogoutButton/>
                                    </div>
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
