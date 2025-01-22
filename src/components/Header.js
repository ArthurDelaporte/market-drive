'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';
import LogoutButton from './LogoutButton';
import DialogCategory from './DialogCategory'; // Import du composant DialogCategory
import { getCookie } from "typescript-cookie";
import { useCart } from '@/context/CartContext'; // Import du hook du panier
import { PUBLIC_PAGES } from '@/config/constants';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaStream } from 'react-icons/fa';

export default function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const { cart, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();
    const [showCart, setShowCart] = useState(false); // État pour afficher/masquer le panier

    const [user, setUser] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    useEffect(() => {
        if (hasCheckedAuth) return;
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

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/produits?productName=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <>
            <ToastContainer />
            <header className="bg-teal-500 text-white p-4 rounded-b-lg shadow-md fixed h-20 w-full z-50">
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
                            className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 hover:text-teal-500 transition flex justify-center items-center gap-2"
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
                                type="search"
                                placeholder="Rechercher un produit..."
                                className="w-full px-4 py-2 text-gray-800 bg-white rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-teal-600"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                aria-label="Rechercher un produit"
                            />
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        </form>
                    </div>

                    {/* Right section with cart and auth */}
                    <div className="flex items-center gap-3">
                        {/* Cart Button */}
                        <button
                            onClick={() => setShowCart(!showCart)}
                            className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition"
                            aria-label="Voir mon panier"
                        >
                            Mon Panier ({cart.length})
                        </button>

                        {/* Auth Button */}
                        {user ? (
                            <LogoutButton />
                        ) : (
                            <Link href="/connexion">
                                <button
                                    className="bg-white text-teal-500 px-4 py-2 rounded shadow hover:bg-gray-100 transition">
                                    Se connecter
                                </button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Display Cart Items */}
                {showCart && cart.length > 0 && (
                  <div className="mt-6">
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-300">
                      <table className="min-w-full bg-white rounded-lg">
                        <thead className="bg-teal-500 text-white uppercase text-sm leading-normal">
                          <tr>
                            <th className="text-left px-6 py-3">Produit</th>
                            <th className="text-center px-6 py-3">Quantité</th>
                            <th className="text-right px-6 py-3">Prix unitaire</th>
                            <th className="text-right px-6 py-3">Prix total</th>
                            <th className="text-center px-6 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                          {cart.map((item) => (
                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-100">
                              <td className="px-6 py-3 whitespace-normal text-left">{item.name}</td>
                              <td className="px-6 py-3 text-center flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => decreaseQuantity(item.id)}
                                  className="px-2 py-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                                >
                                  -
                                </button>
                                <span>{item.quantity}</span>
                                <button
                                  onClick={() => increaseQuantity(item.id)}
                                  className="px-2 py-1 text-white bg-teal-500 rounded hover:bg-teal-600 transition"
                                >
                                  +
                                </button>
                              </td>
                              <td className="px-6 py-3 text-right">{item.price.toFixed(2)} €</td>
                              <td className="px-6 py-3 text-right">{(item.price * item.quantity).toFixed(2)} €</td>
                              <td className="px-6 py-3 text-center">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded hover:bg-red-600 transition"
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          ))}
                          {/* Total Row */}
                          <tr>
                            <td colSpan={5} className="px-6 py-3">
                              <div className="flex justify-between items-center">
                                <div className="text-lg font-bold text-teal-600">
                                  Total :{" "}
                                  {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} €
                                </div>
                                <button
                                  onClick={() => alert("Redirection vers le paiement...")}
                                  className="px-4 py-2 text-sm font-bold text-white bg-blue-500 rounded hover:bg-blue-600 transition"
                                >
                                  Passer au paiement
                                </button>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
         </header>
            {/* DialogCategory */}
            <DialogCategory
                isOpen={isCategoryDialogOpen}
                onClose={() => setIsCategoryDialogOpen(false)}
            />
        </>
    );
}
