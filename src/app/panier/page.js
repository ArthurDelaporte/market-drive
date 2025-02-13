"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { ToastContainer, toast } from "react-toastify";
import { getCookie } from "typescript-cookie";
import "react-toastify/dist/ReactToastify.css";
import CheckoutButton from "@/components/CheckoutButton";

export default function CartPage() {
    const [user, setUser] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [setError] = useState(null);

    useEffect(() => {
        if (hasCheckedAuth) return;

        const fetchUser = async () => {
            try {
                const accessToken = getCookie("access_token");

                if (!accessToken) {
                    toast.error("Vous devez être connecté pour voir votre panier !");
                    return;
                }

                try {
                    const response = await fetch("/api/auth/user", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });

                    if (!response.ok) {
                        const { error } = await response.json();
                        toast.error(`Erreur : ${error}`);
                        return;
                    }

                    const userData = await response.json();
                    setUser(userData);
                    setHasCheckedAuth(true);
                    fetchCart(userData.id);
                } catch (decodeError) {
                    toast.error("Erreur lors du décodage du token.");
                    console.error("Token decode error:", decodeError);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'utilisateur :", error);
                toast.error("Impossible de récupérer l'utilisateur.");
            }
        };

        fetchUser();
    }, [hasCheckedAuth], fetchCart);

    const fetchProducts = async (cartProducts) => {
        if (!cartProducts.length) return;

        // Extraire les IDs uniques des produits
        const productIds = [...new Set(cartProducts.map((p) => p.product_id))];

        try {
            const response = await fetch("/api/products/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCookie("access_token")}`,
                },
                body: JSON.stringify({ productIds }),
            });

            if (!response.ok) throw new Error("Impossible de récupérer les produits");

            const data = await response.json();
            setProducts(data.products);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Erreur lors de la récupération des produits");
        }
    };

    const fetchCart = async (userId) => {
        try {
            const response = await fetch(`/api/user/${userId}/carts`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                }
            });
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération du panier");
            }
            const cartData = await response.json();
            fetchProducts(cartData.products)
            setCart(cartData || []);
        } catch (error) {
            console.error("Erreur récupération du panier :", error);
            toast.error("Erreur lors du chargement du panier.");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ product_id: productId, quantity: newQuantity }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }

            fetchCart(user.id);
        } catch (error) {
            console.error("Erreur mise à jour quantité :", error);
            toast.error("Impossible de mettre à jour la quantité.");
        }
    };

    const removeFromCart = async (productId) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ product_id: productId }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }

            fetchCart(user.id);
        } catch (error) {
            console.error("Erreur suppression produit :", error);
            toast.error("Impossible de supprimer le produit.");
        }
    };

    return (
        <>
            <Header />
            <ToastContainer />
            <div className="container mx-auto p-6 pt-24">
                <h1 className="text-3xl font-bold mb-6 text-center">Mon Panier</h1>

                {loading ? (
                    <p className="text-center text-lg text-gray-500">Chargement du panier...</p>
                ) : cart.length === 0 ? (
                    <p className="text-center text-lg text-gray-500">Votre panier est vide.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full bg-white">
                            <thead className="bg-teal-500 text-white uppercase text-sm leading-normal">
                                <tr>
                                    <th className="text-left px-6 py-3">Produit</th>
                                    <th className="text-center px-6 py-3">Quantité</th>
                                    <th className="text-right px-6 py-3">Prix</th>
                                    <th className="text-right px-6 py-3">Total</th>
                                    <th className="text-center px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {cart.products.map((item) => {
                                    const product = products.find(prod => prod.id === item.product_id);
                                    return product ? (
                                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="px-6 py-3 text-left">{product.name}</td>
                                            <td className="px-6 py-3 text-center flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(product.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="px-2 py-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(product.id, item.quantity + 1)}
                                                    className="px-2 py-1 text-white bg-teal-500 rounded hover:bg-teal-600 transition"
                                                >
                                                    +
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-right">{(product.total_price || 0).toFixed(2)} €</td>
                                            <td className="px-6 py-3 text-right">{(parseFloat((product.total_price || 0)) * item.quantity).toFixed(2)} €</td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => removeFromCart(product.id)}
                                                    className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded hover:bg-red-600 transition"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ) : null;
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {products.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                        <p className="text-xl font-bold">Total : {cart.amount.toFixed(2)} €</p>
                        <CheckoutButton cart={cart} produits={products} currentUser={user}/>
                    </div>
                )}
            </div>
        </>
    );
}
