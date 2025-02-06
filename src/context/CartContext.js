"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext"; // ✅ Intégration du contexte Auth

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

    // ✅ Récupérer l'ID de l'utilisateur depuis la table `users`
    const fetchUserFromDatabase = async (authUserId) => {
        if (!authUserId) return null;
        
        const { data: userRecord, error } = await supabase
            .from("users")
            .select("id")
            .eq("id", authUserId)
            .single();

        if (error) {
            console.error("❌ [CartContext] Erreur récupération utilisateur :", error);
            return null;
        }

        return userRecord ? userRecord.id : null;
    };

    // 🚀 Nettoyer les paniers en double avant de créer un nouveau
    const cleanDuplicateCarts = async (userId) => {
        const { data: carts, error } = await supabase
            .from("carts")
            .select("*")
            .eq("user_id", userId);

        if (error) {
            console.error("⚠️ [CartContext] Erreur récupération paniers :", error);
            return;
        }

        const waitingCarts = carts.filter(cart => cart.status === "waiting");

        if (waitingCarts.length > 1) {
            console.log("🛑 [CartContext] Trop de paniers 'waiting', suppression des doublons...");

            const cartsToDelete = waitingCarts.slice(1).map(cart => cart.id);

            await supabase
                .from("carts")
                .delete()
                .in("id", cartsToDelete);

            console.log("✅ [CartContext] Doublons supprimés !");
        }
    };

    // 🛒 Vérifier et créer un panier si besoin
    const ensureUserCartExists = async (userId) => {
        if (!userId) return;
    
        console.log("🔍 [CartContext] Vérification des paniers pour :", userId);
    
        const { data: carts, error } = await supabase
            .from("carts")
            .select("*")
            .eq("user_id", userId);
    
        if (error) {
            console.error("⚠️ [CartContext] Erreur récupération paniers :", error);
            return;
        }

        const existingWaitingCarts = carts.filter(cart => cart.status === "waiting");

        if (existingWaitingCarts.length > 1) {
            console.log("🛑 [CartContext] Trop de paniers 'waiting', suppression...");
            await cleanDuplicateCarts(userId);
        }

        // Vérification après nettoyage
        const { data: refreshedCarts } = await supabase
            .from("carts")
            .select("*")
            .eq("user_id", userId);
    
        const updatedWaitingCarts = refreshedCarts.filter(cart => cart.status === "waiting");

        if (updatedWaitingCarts.length > 0) {
            console.log("✅ [CartContext] Panier 'waiting' déjà existant :", updatedWaitingCarts[0]);
            return;
        }

        console.log("🛒 [CartContext] Aucun panier trouvé, création d'un nouveau...");

        // 🚀 Créer un seul panier "waiting"
        const { data: newCart, error: createError } = await supabase
            .from("carts")
            .insert([{ user_id: userId, products: [], status: "waiting", amount: 0 }])
            .select()
            .single();

        if (createError) {
            console.error("❌ [CartContext] Erreur création panier:", createError);
        } else {
            console.log("✅ [CartContext] Nouveau panier créé :", newCart);
        }
    };

    // 🛍 Charger le panier après connexion manuelle
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
                console.log("📦 [CartContext] Panier récupéré depuis la base :", data.products);
                setCart(data.products || []);
            }
        } catch (err) {
            console.error("⚠️ [CartContext] Erreur récupération panier:", err);
        }
    };

    // ✅ useEffect pour charger le panier après connexion manuelle
    useEffect(() => {
        if (loading) return;
    
        if (!user) {
            console.log("🚪 [CartContext] Utilisateur déconnecté, réinitialisation du panier !");
            setCart([]);  // Vider le panier en local
            setUserId(null);
            setHasCheckedCart(false);
            return;
        }
    
        if (user && !hasCheckedCart) {
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
        }
    }, [user, loading]);
    

    // 🛒 Ajouter un produit au panier
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

        // Récupérer les IDs des produits dans le panier
        const productIds = updatedCart.map(item => item.product_id);

        // Aller chercher les prix des produits en base de données
        const { data: productPrices, error: priceError } = await supabase
            .from("products")
            .select("id, price")
            .in("id", productIds);

        if (priceError) {
            console.error("❌ [CartContext] Erreur récupération prix :", priceError);
            return;
        }

        // Construire un dictionnaire des prix
        const priceMap = productPrices.reduce((acc, p) => {
            acc[p.id] = p.price;
            return acc;
        }, {});

        // Calculer le total
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
        <CartContext.Provider value={{ cart, setCart, fetchCart, addToCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
