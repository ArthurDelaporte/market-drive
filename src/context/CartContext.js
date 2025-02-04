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
    const { user, loading } = useAuth(); // ✅ Récupération de l'utilisateur connecté
    const [cart, setCart] = useState([]);
    const [userId, setUserId] = useState(null); // ✅ Stocker l'ID de la table `users`
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
            console.error("❌ Erreur lors de la récupération de l'utilisateur dans la DB :", error);
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
        console.error("⚠️ Erreur lors de la récupération des paniers :", error);
        return;
    }

    const waitingCarts = carts.filter(cart => cart.status === "waiting");

    if (waitingCarts.length > 1) {
        console.log("🛑 Trop de paniers 'waiting', suppression des doublons...");

        // Conserve uniquement le plus récent
        const cartsToDelete = waitingCarts.slice(1).map(cart => cart.id);

        await supabase
            .from("carts")
            .delete()
            .in("id", cartsToDelete);

        console.log("✅ Doublons supprimés !");
    }
};


    // 🛒 Vérifier et créer un panier si besoin
    const ensureUserCartExists = async (userId) => {
        if (!userId) return;
    
        console.log("🔍 Vérification des paniers existants pour :", userId);
    
        // 🛑 Récupérer TOUS les paniers de l'utilisateur
        const { data: carts, error } = await supabase
            .from("carts")
            .select("*")
            .eq("user_id", userId);
    
        if (error) {
            console.error("⚠️ Erreur lors de la récupération des paniers :", error);
            return;
        }
    
        // 🔍 Filtrer uniquement les paniers en statut "waiting"
        const existingWaitingCarts = carts.filter(cart => cart.status === "waiting");
    
        // ✅ Si plusieurs paniers "waiting" existent, supprimer les doublons AVANT d'en créer un nouveau
        if (existingWaitingCarts.length > 1) {
            console.log("🛑 Trop de paniers 'waiting', suppression des doublons...");
            await cleanDuplicateCarts(userId);
        }
    
        // 🔍 Vérifier de nouveau après nettoyage
        const { data: refreshedCarts } = await supabase
            .from("carts")
            .select("*")
            .eq("user_id", userId);
    
        const updatedWaitingCarts = refreshedCarts.filter(cart => cart.status === "waiting");
    
        // ✅ Si après nettoyage un panier "waiting" existe déjà, ne rien faire
        if (updatedWaitingCarts.length > 0) {
            console.log("✅ Panier 'waiting' déjà existant :", updatedWaitingCarts[0]);
            return;
        }
    
        console.log("🛒 Aucun panier 'waiting' trouvé, création d'un nouveau panier...");
    
        // 🚀 Créer un seul panier "waiting"
        const { data: newCart, error: createError } = await supabase
            .from("carts")
            .insert([{ user_id: userId, products: [], status: "waiting", amount: 0 }])
            .select()
            .single();
    
        if (createError) {
            console.error("❌ Erreur lors de la création du panier:", createError);
        } else {
            console.log("✅ Nouveau panier 'waiting' créé :", newCart);
        }
    };
    
    

    // 🛍 Charger le panier de l'utilisateur depuis Supabase
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
                console.log("📦 Panier récupéré depuis la base :", data.products);
                setCart(data.products || []);
            }
        } catch (err) {
            console.error("⚠️ Erreur lors de la récupération du panier:", err);
        }
    };

    // ✅ useEffect pour charger le panier de l'utilisateur
    useEffect(() => {
        if (loading || !user || !user.id || hasCheckedCart) return; // ⏳ Vérifier que l'utilisateur est bien chargé
    
        console.log("🔄 Utilisateur détecté (auth.users.id):", user.id);
    
        (async () => {
            const dbUserId = await fetchUserFromDatabase(user.id);
            if (dbUserId) {
                setUserId(dbUserId);
    
                // 🛑 Vérification avant de créer un panier
                await ensureUserCartExists(dbUserId);
                await fetchCart(dbUserId);
    
                setHasCheckedCart(true); // ✅ Marque comme vérifié pour éviter la double exécution
            } else {
                console.error("⚠️ Impossible de récupérer l'ID utilisateur depuis la DB.");
            }
        })();
    }, [user, loading]);
    

    // 🛒 Ajouter un produit au panier
    const addToCart = async (product, quantity = 1) => {
        if (!userId) {
            alert("❌ Vous devez être connecté pour ajouter un produit au panier.");
            return;
        }
    
        console.log("🛒 Tentative d'ajout au panier pour :", product);

        await ensureUserCartExists(userId); // Vérification du panier avant d'ajouter un produit

        let { data: cart, error } = await supabase
            .from("carts")
            .select("id, products, amount")
            .eq("user_id", userId)
            .single();

        if (error || !cart) {
            console.error("❌ Impossible de récupérer le panier après la création !");
            return;
        }

        // 🔄 Mise à jour du panier
        const updatedCart = [...cart.products];
        const existingProduct = updatedCart.find((item) => item.product_id === product.id);

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            updatedCart.push({ product_id: product.id, quantity });
        }

        // 💰 Recalcul du montant total
        const totalAmount = updatedCart.reduce((sum, item) => sum + product.price * item.quantity, 0);

        console.log("📦 Mise à jour du panier :", updatedCart);
        console.log("💰 Nouveau montant total :", totalAmount);

        // 📝 Enregistrement dans Supabase
        const { error: updateError } = await supabase
            .from("carts")
            .update({ products: updatedCart, amount: totalAmount })
            .eq("user_id", userId);

        if (updateError) {
            console.error("❌ Erreur lors de la mise à jour du panier :", updateError);
        } else {
            console.log("✅ Panier mis à jour !");
            setCart(updatedCart);
        }
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
