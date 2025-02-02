"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error("⚠️ Erreur lors de la récupération de l'utilisateur :", error.message);
            return;
        }

        if (user) {
            console.log("✅ Utilisateur connecté :", user);
            setUserId(user.id);
            console.log("🛒 ID utilisateur enregistré :", user.id);
            fetchCart(user.id);
        } else {
            console.warn("⚠️ Aucun utilisateur trouvé dans Supabase !");
        }
    };

    fetchUser();
}, []);


  // Charger le panier de la base de données
  const fetchCart = async (userId) => {
    const { data, error } = await supabase
      .from("carts")
      .select("products")
      .eq("user_id", userId)
      .single();

    if (data) {
      setCart(data.products || []);
    }
  };

  // Ajouter un produit au panier
  const addToCart = async (product, quantity = 1) => {
    console.log("Tentative d'ajout au panier pour l'utilisateur :", userId);

    if (!userId) {
        alert("Vous devez être connecté pour ajouter un produit au panier.");
        return;
    }
    
    const newCart = [...cart];
    const existingProduct = newCart.find((item) => item.product_id === product.id);

    if (existingProduct) {
        existingProduct.quantity += quantity;
    } else {
        newCart.push({ product_id: product.id, quantity });
    }

    setCart(newCart);

    await supabase
        .from("carts")
        .update({ products: newCart })
        .eq("user_id", userId);
};


  // Supprimer un produit du panier
  const removeFromCart = async (productId) => {
    const newCart = cart.filter((item) => item.product_id !== productId);
    setCart(newCart);

    await supabase
      .from("carts")
      .update({ products: newCart })
      .eq("user_id", userId);
  };

  // Augmenter la quantité
  const increaseQuantity = async (productId) => {
    const newCart = cart.map((item) =>
      item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item
    );
    setCart(newCart);

    await supabase
      .from("carts")
      .update({ products: newCart })
      .eq("user_id", userId);
  };

  // Réduire la quantité
  const decreaseQuantity = async (productId) => {
    const newCart = cart.map((item) =>
      item.product_id === productId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    );
    setCart(newCart);

    await supabase
      .from("carts")
      .update({ products: newCart })
      .eq("user_id", userId);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
