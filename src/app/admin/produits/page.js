"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import Image from 'next/image';
import { FaEdit, FaSlidersH } from 'react-icons/fa';
import Modal from 'react-modal';
import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import Header from "@/components/Header";
import {getCookie} from "typescript-cookie";

export default function ProductsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState(new Set());
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isApplyFilterButtonDisabled, setIsApplyFilterButtonDisabled] = useState(false);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [tempMinPrice, setTempMinPrice] = useState('');
    const [tempMaxPrice, setTempMaxPrice] = useState('');
    const [priceError, setPriceError] = useState(null);
    const [sortOption, setSortOption] = useState('');

    // Récupérer le paramètre categoryId depuis l'URL
    const categoryId = searchParams.get('categoryId');
    const productName = searchParams.get('productName');

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

            const res = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${getCookie('access_token')}`,
                }
            });
            if (!res.ok) throw new Error('Erreur de récupération des produits');
            const data = await res.json();
            setProducts(data);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [categoryId, productName, fetchProducts]);

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

    // 📌 **Gestion du mode suppression**
    const toggleProductSelection = (productId) => {
        setSelectedProducts((prevSelected) => {
            const newSelection = new Set(prevSelected);
            if (newSelection.has(productId)) {
                newSelection.delete(productId);
            } else {
                newSelection.add(productId);
            }
            return newSelection;
        });
    };

    const resetSelection = () => setSelectedProducts(new Set([]));

    const handleDeleteSelectedProducts = async () => {
        if (selectedProducts.size === 0) return;

        const confirmed = window.confirm("Êtes-vous sûr de vouloir supprimer ces produits ?");
        if (!confirmed) return;

        try {
            const res = await fetch('/api/products/batch', {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${getCookie('access_token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productIds: Array.from(selectedProducts) }),
            });

            if (!res.ok) throw new Error("Erreur lors de la suppression");

            // 🔄 Mettre à jour la liste des produits
            await fetchProducts();
            resetSelection();
            setIsDeleteMode(false);
            toast.success("Produits supprimés avec succès !");
        } catch (error) {
            toast.error("Une erreur est survenue lors de la suppression.");
            console.error(error);
        }
    }

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
                <h1 className="text-2xl font-bold text-center mb-8">Nos Produits</h1>

                <div className="flex mb-6 w-full space-x-4">
                    <button type="button"
                            className="bg-blue-500 text-white p-2 ml-0 rounded hover:bg-blue-600 transition"
                            onClick={() => {
                                router.push('/admin/produits/create');
                            }}>
                        Créer un produit
                    </button>

                    <button
                        type="button"
                        className={`p-2 rounded transition ${isDeleteMode ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white hover:text-gray-100`}
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                    >
                        {isDeleteMode ? "Désactiver le mode suppression" : "Supprimer des produits"}
                    </button>

                    {isDeleteMode && (
                        <div className="space-x-4">
                            <button
                                type="button"
                                className="p-2 rounded transition bg-gray-500 hover:bg-gray-600 text-white"
                                disabled={selectedProducts.size === 0}
                                onClick={resetSelection}
                            >
                                Annuler la sélection
                            </button>

                            <button
                                type="button"
                                className="p-2 rounded transition bg-red-500 hover:bg-red-600 text-white"
                                disabled={selectedProducts.size === 0}
                                onClick={handleDeleteSelectedProducts}
                            >
                                Supprimer la sélection
                            </button>
                        </div>
                    )}
                </div>

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
                                    {isDeleteMode && (
                                        <input
                                            type="checkbox"
                                            className="h-5 w-5 mb-2"
                                            checked={selectedProducts?.has(product.id) || false}
                                            onChange={() => toggleProductSelection(product.id)}
                                        />
                                    )}
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

                                    {/*<div className="flex justify-between items-center mt-4">*/}
                                    {/*    <div className="flex flex-col items-center space-y-1 ml-4" style={{width: '70px'}}>*/}
                                    {/*        <button*/}
                                    {/*            onClick={() => increaseQuantity(product.id)}*/}
                                    {/*            className="bg-gray-300 text-gray-700 px-2 py-1 rounded w-full"*/}
                                    {/*        >*/}
                                    {/*            +*/}
                                    {/*        </button>*/}
                                    {/*        <input*/}
                                    {/*            type="number"*/}
                                    {/*            min="1"*/}
                                    {/*            value={quantities[product.id] || 1}*/}
                                    {/*            onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}*/}
                                    {/*            onFocus={(e) => e.target.select()}*/}
                                    {/*            className="border text-center w-full py-1 rounded text-[#212121]"*/}
                                    {/*        />*/}
                                    {/*        <button*/}
                                    {/*            onClick={() => decreaseQuantity(product.id)}*/}
                                    {/*            disabled={(quantities[product.id] || 1) <= 1}*/}
                                    {/*            className="bg-gray-300 text-gray-700 px-2 py-1 rounded w-full"*/}
                                    {/*        >*/}
                                    {/*            -*/}
                                    {/*        </button>*/}
                                    {/*    </div>*/}

                                    {/*    <button*/}
                                    {/*        className="mr-4 py-2 px-4 rounded transition-colors flex items-center justify-center"*/}
                                    {/*    >*/}
                                    {/*        <FaShoppingCart className="h-8 w-8"/>*/}
                                    {/*    </button>*/}
                                    {/*</div>*/}

                                    <button
                                        onClick={() => router.push(`/admin/produits/edit/${product.id}`)}
                                        className="bg-gray-500 text-white mt-4 py-2 px-4 rounded hover:bg-gray-600 transition-colors flex items-center justify-center w-full"
                                    >
                                        <FaEdit className="h-5 w-5 mr-2"/>
                                        Modifier
                                    </button>
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
