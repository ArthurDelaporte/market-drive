"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';
import { FaShoppingCart, FaEdit, FaSlidersH } from 'react-icons/fa';
import Modal from 'react-modal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Header from "../../components/Header";
import {auto} from "openai/_shims/registry";
import { getCookie } from "typescript-cookie";
import { jwtDecode } from "jwt-decode";

export default function ProductsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantities, setQuantities] = useState({});
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isApplyFilterButtonDisabled, setIsApplyFilterButtonDisabled] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [tempMinPrice, setTempMinPrice] = useState('');
    const [tempMaxPrice, setTempMaxPrice] = useState('');
    const [priceError, setPriceError] = useState(null);
    const [sortOption, setSortOption] = useState('');
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [user, setUser] = useState(null);


    useEffect(() => {
        if (hasCheckedAuth) return;

        const fetchUser = async () => {
            try {
                const accessToken = getCookie("access_token");

                if (!accessToken) {
                    toast.error("Vous n'êtes pas connectés. Veuillez vous connecter.", { toastId: "missing-token" });
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
                toast.error("Erreur lors de la récupération de l'utilisateur.", { toastId: "fetch-error" });
                console.error("Error fetching user:", error);
            }
        };

        fetchUser();
    }, [hasCheckedAuth]);


    const addToCart = async (productId) => {
        try {
            if (!user) {
                toast.error("Vous devez être connecté pour ajouter un produit au panier !");
                return;
            }
    
            const quantity = quantities[productId] || 1;
    
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ product_id: productId, quantity }),
            });
    
            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }
    
            toast.success("Produit ajouté au panier !");
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout au panier :", error);
            toast.error("Une erreur est survenue. Réessayez plus tard.");
        }
    };    


    // Récupérer le paramètre categoryId depuis l'URL
    const categoryId = searchParams.get('categoryId');
    const productName = searchParams.get('productName');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);

                let url = `/api/products`;
                const queryParams = new URLSearchParams();

                if (categoryId) {
                    queryParams.append("categoryId", categoryId);
                }

                if (productName) {
                    queryParams.append("productName", productName);
                }

                if (queryParams.toString()) {
                    url += `?${queryParams.toString()}`;
                }

                const res = await fetch(url);
                if (!res.ok) throw new Error('Erreur de récupération des produits');
                const data = await res.json();
                setProducts(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };



        fetchProducts();
    }, [categoryId, productName]);

    useEffect(() => {
        if (tempMinPrice && tempMaxPrice && parseFloat(tempMinPrice) > parseFloat(tempMaxPrice)) {
            setPriceError('Le prix minimum ne peut pas être supérieur au prix maximum');
            toast.error('Le prix minimum ne peut pas être supérieur au prix maximum', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setIsApplyFilterButtonDisabled(true);
        } else {
            setPriceError(null);
        }
    }, [tempMinPrice, tempMaxPrice]);

    const handleQuantityChange = (productId, quantity) => {
        setQuantities((prev) => ({ ...prev, [productId]: Math.max(1, quantity) }));
    };

    const increaseQuantity = (productId) => {
        setQuantities((prev) => ({ ...prev, [productId]: (prev[productId] || 1) + 1 }));
    };

    const decreaseQuantity = (productId) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: Math.max(1, (prev[productId] || 1) - 1),
        }));
    };

    const openFilterModal = () => {
        setTempMinPrice(minPrice);
        setTempMaxPrice(maxPrice);
        setIsFilterModalOpen(true);
    };
    const closeFilterModal = () => setIsFilterModalOpen(false);

    const applyFilters = () => {
        setMinPrice(tempMinPrice);
        setMaxPrice(tempMaxPrice);
        closeFilterModal();
    };

    const resetFilters = () => {
        setTempMinPrice('');
        setTempMaxPrice('');
    };

    const sortedProducts = [...products].sort((a, b) => {
        if (sortOption === 'price-asc') {
            return a.price - b.price;
        } else if (sortOption === 'price-desc') {
            return b.price - a.price;
        }
        return 0; // Pas de tri si aucune option n'est sélectionnée
    });

    const filteredAndSortedProducts = sortedProducts.filter((product) => {
        const isInPriceRange =
            (!minPrice || product.price >= parseFloat(minPrice)) &&
            (!maxPrice || product.price <= parseFloat(maxPrice));

        return isInPriceRange;
    });

    return (
        <>
            <Header />
            <div className="ml-20 mr-20 pt-24 p-4">
                <ToastContainer/>
                <h1 className="text-2xl font-bold text-center mb-8">Nos Produits</h1>

                <div className="flex mb-6 w-full">
                    <button
                        type="button"
                        className="bg-gray-500 text-white w-[8vw] h-[42px] mr-4 rounded hover:bg-gray-600 transition flex items-center justify-center"
                        onClick={openFilterModal}
                    >
                        <FaSlidersH className="h-5 w-5 mr-2"/>
                        Filtres
                    </button>
                    <div className="">
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            className="w-[20vw] h-[42px] p-2 border border-gray-300 rounded text-[#212121]"
                        >
                            <option value="">Trier par</option>
                            <option value="price-asc">Prix : Croissant</option>
                            <option value="price-desc">Prix : Décroissant</option>
                        </select>
                    </div>
                </div>

                <Modal
                    isOpen={isFilterModalOpen}
                    onRequestClose={() => closeFilterModal}
                    ariaHideApp={false}
                    contentLabel="Filtres"
                    className="w-full max-w-md mx-auto mt-20 bg-white p-6 rounded-lg shadow-lg"
                    overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start"
                >
                    <h2 className="text-xl font-semibold mb-4">Filtres</h2>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Prix minimum (€)</label>
                        <input
                            type="number"
                            placeholder="Prix minimum"
                            value={tempMinPrice}
                            onChange={(e) => setTempMinPrice(e.target.value)}
                            className={`w-full p-2 border rounded ${priceError ? 'border-red-500' : 'border-gray-300'}`}
                            min="0"
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 font-medium mb-2">Prix maximum (€)</label>
                        <input
                            type="number"
                            placeholder="Prix maximum"
                            value={tempMaxPrice}
                            onChange={(e) => setTempMaxPrice(e.target.value)}
                            className={`w-full p-2 border rounded ${priceError ? 'border-red-500' : 'border-gray-300'}`}
                            min="0"
                        />
                    </div>
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            className="bg-gray-400 text-white p-2 rounded hover:bg-gray-500 transition"
                            onClick={closeFilterModal}
                        >
                            Annuler
                        </button>
                        <button
                            type="button"
                            className="bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 transition"
                            onClick={resetFilters}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                            onClick={applyFilters}
                            disabled={isApplyFilterButtonDisabled}
                        >
                            Appliquer
                        </button>
                    </div>
                </Modal>

                {loading ? (
                    <div className="text-center py-8 text-lg font-semibold">Chargement...</div>
                ) : error ? (
                    <div className="text-center py-8 text-red-500 text-lg">Erreur : {error}</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredAndSortedProducts.length ? (
                            filteredAndSortedProducts.map((product) => (
                                <div key={product.id}
                                     className="product-card p-4 border rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                    <div className="flex items-center justify-center">
                                        <Image
                                            src={product.imgurl}
                                            alt={product.name}
                                            width={200}
                                            height={0}
                                            className="rounded-md mb-4 object-cover"
                                        />
                                    </div>
                                    <div className="h-14 flex items-center">
                                        <h2 className="text-xl font-semibold mb-2 line-clamp-two">{product.name}</h2>
                                    </div>
                                    <p className="text-lg font-bold text-green-600 mb-2">{product.totalPrice} €</p>
                                    <p className="text-lg font-bold text-blue-600 mb-2">{product.price} €/{product.unity}</p>

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex flex-col items-center space-y-1 ml-4" style={{width: '70px'}}>
                                            <button
                                                onClick={() => increaseQuantity(product.id)}
                                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded w-full"
                                            >
                                                +
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={quantities[product.id] || 1}
                                                onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                                                onFocus={(e) => e.target.select()}
                                                className="border text-center w-full py-1 rounded text-[#212121]"
                                            />
                                            <button
                                                onClick={() => decreaseQuantity(product.id)}
                                                disabled={(quantities[product.id] || 1) <= 1}
                                                className="bg-gray-300 text-gray-700 px-2 py-1 rounded w-full"
                                            >
                                                -
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => addToCart(product.id)}
                                            className="mr-4 py-2 px-4 rounded transition-colors flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600"
                                        >
                                            Ajouter
                                            <FaShoppingCart className="h-8 w-8 ml-2" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="col-span-full text-center">Aucun produit correspondant trouvé</p>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}