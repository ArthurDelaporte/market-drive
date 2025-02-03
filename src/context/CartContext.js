"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext"; // ✅ Intégration de l'authentification
import { Users } from "lucide-react";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user, loading } = useAuth(); // ✅ Utilisation du contexte Auth
    const [cart, setCart] = useState([]);

    // 🔄 Vérifier et créer un panier si besoin
    const ensureUserCartExists = async (userId) => {
      if (!userId) return;
  
      console.log("🔍 Vérification du panier pour :", userId);
  
      const { data: existingCart, error } = await supabase
          .from("carts")
          .select("*")
          .eq("user_id", userId)
          .single();
  
      if (error) {
          console.error("⚠️ Erreur lors de la récupération du panier :", error);
          return;
      }
  
      if (!existingCart) {
          console.log("🛒 Aucun panier trouvé, création d'un nouveau pour:", userId);
  
          const { error: createError } = await supabase
              .from("carts")
              .insert([{ user_id: userId, products: [], status: "waiting", amount: 0 }]);
  
          if (createError) {
              console.error("❌ Erreur lors de la création du panier:", createError);
          } else {
              console.log("✅ Panier créé avec succès !");
          }
      } else {
          console.log("✅ Panier déjà existant :", existingCart);
      }
  };
  

    // 🛍 Charger le panier de l'utilisateur depuis Supabase
    const fetchCart = async (userId) => {
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
      if (loading || !user || !user.id) return; // ⏳ Attendre que l'utilisateur soit bien chargé avec un ID valide
  
      console.log("🔄 Utilisateur détecté:", user);
  
      (async () => {
          await ensureUserCartExists(user.id);
          await fetchCart(user.id);
      })();
  }, [user, loading]);
  

    // 🛒 Ajouter un produit au panier (et créer un panier si besoin)
const addToCart = async (product, quantity = 1) => {

  console.log("➕ Tentative d'ajout au panier :", product);

  // 1️⃣ Vérifier si l'utilisateur a un panier
  let { data: cart, error } = await supabase
      .from("carts")
      .select("products")
      .eq("user_id", Users.id)
      .single();

  if (error || !cart) {
      console.log("🚨 Aucun panier trouvé, création d'un nouveau panier...");

      // 2️⃣ Créer un panier vide pour l'utilisateur
      const { data: newCart, error: createError } = await supabase
          .from("carts")
          .insert([{ user_id: Users.id, products: [] }])
          .select()
          .single();

      if (createError) {
          console.error("❌ Erreur lors de la création du panier:", createError);
          return;
      }

      cart = newCart;
      console.log("✅ Panier créé avec succès !");
  }

  // 3️⃣ Ajouter le produit au panier existant
  const updatedCart = [...cart.products]; 
  const existingProduct = updatedCart.find((item) => item.product_id === product.id);

  if (existingProduct) {
      existingProduct.quantity += quantity;
  } else {
      updatedCart.push({ product_id: product.id, quantity });
  }

  console.log("📦 Mise à jour du panier avec :", updatedCart);

  // 4️⃣ Mettre à jour le panier dans Supabase
  const { error: updateError } = await supabase
      .from("carts")
      .update({ products: updatedCart })
      .eq("user_id", Users.id);

  if (updateError) {
      console.error("❌ Erreur lors de la mise à jour du panier :", updateError);
  } else {
      console.log("✅ Panier mis à jour avec succès !");
      setCart(updatedCart);
  }
};

  

    // 🗑 Supprimer un produit du panier
    const removeFromCart = async (productId) => {
        const newCart = cart.filter((item) => item.product_id !== productId);
        setCart(newCart);

        await supabase
            .from("carts")
            .update({ products: newCart })
            .eq("user_id", Users.id);
    };

    // 🔼 Augmenter la quantité
    const increaseQuantity = async (productId) => {
        const newCart = cart.map((item) =>
            item.product_id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
        setCart(newCart);

        await supabase
            .from("carts")
            .update({ products: newCart })
            .eq("user_id", Users.id);
    };

    // 🔽 Réduire la quantité
    const decreaseQuantity = async (productId) => {
        const newCart = cart.map((item) =>
            item.product_id === productId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
        );
        setCart(newCart);

        await supabase
            .from("carts")
            .update({ products: newCart })
            .eq("user_id", Users.id);
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
