"use client";

import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import Header from "@/components/Header"; // ✅ Importation du Header

export default function CartPage() {
    const { cart, increaseQuantity, decreaseQuantity, removeFromCart } = useCart();
    const router = useRouter();

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <>
            <Header /> {/* ✅ Ajout du Header */}
            <div className="container mx-auto p-6 pt-24">
                <h1 className="text-3xl font-bold mb-6 text-center">Mon Panier</h1>

                {cart.length === 0 ? (
                    <p className="text-center text-lg text-gray-500">Votre panier est vide.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full bg-white">
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
                                        <td className="px-6 py-3 text-left">{item.name}</td>
                                        <td className="px-6 py-3 text-center flex items-center justify-center space-x-2">
                                            <button
                                                onClick={() => decreaseQuantity(item.id)}
                                                className="px-2 py-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                                            >
                                                -
                                            </button>
                                            <span className="px-2">{item.quantity}</span>
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
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Total et bouton Checkout */}
                {cart.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                        <p className="text-xl font-bold">Total : {totalPrice.toFixed(2)} €</p>
                        <button
                            onClick={() => router.push("/checkout")} // Page fictive pour l'instant
                            className="px-6 py-3 bg-green-500 text-white text-lg rounded hover:bg-green-600 transition"
                        >
                            Passer à la commande
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
