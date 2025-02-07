"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user, loading } = useAuth();
    const [cart, setCart] = useState([]); 
    const [userId, setUserId] = useState(null);
    const [hasCheckedCart, setHasCheckedCart] = useState(false);

    // ✅ Récupérer `userId` depuis la table `users`
    const fetchUserFromDatabase = async (authUserId) => {
        if (!authUserId) return null;
        
        const { data: userRecord, error } = await supabase
            .from("users")
            .select("id")
            .eq("id", authUserId)
            .single();

        if (error) {
            console.error("❌ [CartContext] Erreur récupération utilisateur DB :", error);
            return null;
        }

        return userRecord?.id || null;
    };

    // ✅ Vérifier et créer un panier si besoin (éviter les doublons)
    const ensureUserCartExists = async (userId) => {
        if (!userId) return;

        console.log("🔍 [CartContext] Vérification du panier pour :", userId);

        const { data: existingCart, error } = await supabase
            .from("carts")
            .select("id")
            .eq("user_id", userId)
            .single();

        if (error) {
            console.error("❌ [CartContext] Erreur récupération panier :", error);
        }

        if (!existingCart) {
            console.log("🚨 [CartContext] Aucun panier trouvé, création...");

            const { data: newCart, error: createError } = await supabase
                .from("carts")
                .insert([{ user_id: userId, products: [], status: "waiting", amount: 0 }])
                .select()
                .single();

            if (createError) {
                console.error("❌ [CartContext] Erreur création panier :", createError);
                return;
            }

            console.log("✅ [CartContext] Panier créé !");
        } else {
            console.log("✅ [CartContext] Panier déjà existant :", existingCart);
        }
    };

    // ✅ Charger le panier utilisateur
    const fetchCart = async (userId) => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from("carts")
                .select("products")
                .eq("user_id", userId)
                .single();

            if (error) throw error;

            if (data) {
                console.log("📦 [CartContext] Panier récupéré :", data.products);
                setCart(data.products || []);
            }
        } catch (err) {
            console.error("⚠️ [CartContext] Erreur récupération panier :", err);
        }
    };

    // ✅ useEffect pour gérer le panier après connexion
    useEffect(() => {
        if (loading || !user || !user.id || hasCheckedCart) return;

        console.log("🔄 [CartContext] Utilisateur détecté :", user.id);

        (async () => {
            const dbUserId = await fetchUserFromDatabase(user.id);
            if (dbUserId) {
                setUserId(dbUserId);

                await ensureUserCartExists(dbUserId);
                await fetchCart(dbUserId);

                setHasCheckedCart(true);
            } else {
                console.error("⚠️ [CartContext] Impossible de récupérer l'ID utilisateur.");
            }
        })();
    }, [user, loading]);

    // ✅ Ajouter un produit au panier
    const addToCart = async (product, quantity = 1) => {
        if (!userId) {
            alert("❌ Vous devez être connecté pour ajouter un produit.");
            return;
        }

        console.log("🛒 [CartContext] Ajout au panier :", product);

        await ensureUserCartExists(userId);

        let { data: cart, error } = await supabase
            .from("carts")
            .select("id, products, amount")
            .eq("user_id", userId)
            .single();

        if (error || !cart) {
            console.error("❌ [CartContext] Impossible de récupérer le panier !");
            return;
        }

        const updatedCart = [...cart.products];
        const existingProduct = updatedCart.find((item) => item.product_id === product.id);

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            updatedCart.push({ product_id: product.id, quantity });
        }

        const productIds = updatedCart.map(item => item.product_id);
        const { data: productPrices, error: priceError } = await supabase
            .from("products")
            .select("id, price")
            .in("id", productIds);

        if (priceError) {
            console.error("❌ [CartContext] Erreur récupération prix :", priceError);
            return;
        }

        const priceMap = productPrices.reduce((acc, p) => {
            acc[p.id] = p.price;
            return acc;
        }, {});

        const totalAmount = updatedCart.reduce((sum, item) => sum + (priceMap[item.product_id] || 0) * item.quantity, 0);

        console.log("📦 [CartContext] Mise à jour panier :", updatedCart);
        console.log("💰 [CartContext] Nouveau total :", totalAmount);

        const { error: updateError } = await supabase
            .from("carts")
            .update({ products: updatedCart, amount: totalAmount })
            .eq("user_id", userId);

        if (updateError) {
            console.error("❌ [CartContext] Erreur mise à jour panier :", updateError);
        } else {
            console.log("✅ [CartContext] Panier mis à jour !");
            setCart(updatedCart);
        }
    };

    return (
        <CartContext.Provider value={{ cart, setCart, addToCart, fetchCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
