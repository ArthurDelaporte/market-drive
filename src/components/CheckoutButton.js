"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {getCookie} from "typescript-cookie";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

export default function CheckoutButton({ cart, produits, currentUser }) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);

        const cartItems = cart.products.map((item) => {
            const produit = produits.find((prod) => prod.id === item.product_id);
            return {
                'name': produit.name,
                'total_price': produit.total_price,
                'quantity': item.quantity,
            }
        })

        const res = await fetch("/api/checkout/session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getCookie('access_token')}`
            },
            body: JSON.stringify({ items: cartItems, userId: currentUser.id, cartId: cart.id }),
        });

        const { sessionId } = await res.json();
        const stripe = await stripePromise;

        if (stripe) {
            await stripe.redirectToCheckout({ sessionId });
        }

        setLoading(false);
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            className="px-6 py-3 bg-green-500 text-white text-lg rounded hover:bg-green-600 transition disabled:opacity-50"
        >
            {loading ? "Chargement..." : "Passer à la commande"}
        </button>
    );
}