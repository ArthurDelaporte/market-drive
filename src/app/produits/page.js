"use client";

import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { FaShoppingCart } from 'react-icons/fa';

export default function BooksPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/products');
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
    }, []);

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

    const addToCart = async (productId) => {
        const quantity = quantities[productId] || 1;
        try {
            const res = await fetch('/api/carts/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ productId, quantity }),
            });
            if (!res.ok) throw new Error('Erreur lors de l\'ajout au panier');
            alert(`Produit ajouté au panier (Quantité: ${quantity})`);
        } catch (err) {
            alert(`Erreur : ${err.message}`);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-center mb-8">Nos Produits</h1>
            <button type="button"
                    className="bg-blue-500 text-white p-2 m-4 rounded hover:bg-blue-600 transition"
                    onClick={() => {
                        router.push('/produits/create');
                    }}>
                Créer un produit
            </button>

            {loading ? (
                <div className="text-center py-8 text-lg font-semibold">Chargement...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500 text-lg">Erreur : {error}</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.length ? (
                        products.map((product) => (
                            <div key={product.id}
                                 className="product-card p-4 border rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                                <div className="flex items-center justify-center w-full" style={{height: '200px'}}>
                                    <Image
                                        src={product.imgurl}
                                        alt={product.name}
                                        width={200}
                                        height={0}
                                        style={{height: 'auto'}}
                                        className="rounded-md mb-4 object-cover h-48"
                                    />
                                </div>
                                <div className="h-14 flex items-center">
                                    <h2 className="text-xl font-semibold mb-2 line-clamp-two">{product.name}</h2>
                                </div>
                                <p className="text-lg font-bold text-green-600 mb-2">{product.price} €</p>

                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex flex-col items-center space-y-1 ml-4" style={{ width: '70px' }}>
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
                                            className="border text-center w-full py-1 rounded"
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
                                        className="bg-blue-500 text-white mr-4 py-2 px-4 rounded hover:bg-blue-600 transition-colors flex items-center justify-center"
                                    >
                                        <FaShoppingCart className="h-8 w-8" />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="col-span-full text-center">Aucun produit trouvé</p>
                    )}
                </div>
            )}
        </div>
    );
}
