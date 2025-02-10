"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCookie, removeCookie, setCookie } from "typescript-cookie";
import { useRouter } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        persistSession: false, // Désactive la persistance automatique
        autoRefreshToken: false, // On gère nous-mêmes le refresh token
    }
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // ✅ Fonction pour rafraîchir le token
    const refreshAccessToken = async () => {
        try {
            console.log("🔄 [AuthContext] Tentative de rafraîchissement du token...");

            const refreshToken = getCookie("refresh_token");
            if (!refreshToken) {
                console.warn("⚠️ [AuthContext] Aucun refresh token trouvé, déconnexion...");
                signOut();
                return;
            }

            const response = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh_token: refreshToken }),
            });

            if (!response.ok) {
                console.error("❌ [AuthContext] Erreur lors du rafraîchissement du token");
                signOut();
                return;
            }

            const data = await response.json();
            console.log("✅ [AuthContext] Token rafraîchi avec succès :", data.access_token);

            // 🔹 Mettre à jour les cookies
            setCookie("access_token", data.access_token, { path: "/" });

            await supabase.auth.setSession({
                access_token: data.access_token,
                refresh_token: getCookie("refresh_token") || "", // Récupérer le refresh token si disponible
            });

            // 🔹 Mettre à jour l’utilisateur avec Supabase
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                console.error("❌ [AuthContext] Erreur lors de la récupération de l'utilisateur");
                signOut();
                return;
            }

            setUser(user);
            console.log("✅ [AuthContext] Utilisateur mis à jour :", user.id);
        } catch (error) {
            console.error("❌ [AuthContext] Erreur inattendue :", error);
            signOut();
        }
    };

    useEffect(() => {
        console.log("🟢 [AuthContext] Vérification de la session en cours...");

        const checkSessionAndLogin = async () => {
            try {
                const accessToken = getCookie("access_token");

                if (!accessToken) {
                    console.warn("⚠️ [AuthContext] Aucun access_token trouvé, utilisateur non connecté.");
                    setUser(null);
                    setLoading(false);
                    return;
                }

                console.log("✅ [AuthContext] Access token détecté :", accessToken);

                // 🔄 Vérifier l'utilisateur avec Supabase
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error || !user) {
                    console.warn("⚠️ [AuthContext] Token expiré, tentative de rafraîchissement...");
                    await refreshAccessToken();
                } else {
                    console.log("✅ [AuthContext] Utilisateur connecté :", user.id);
                    setUser(user);
                }
            } catch (err) {
                console.error("❌ [AuthContext] Erreur inattendue :", err);
                setUser(null);
            }

            setLoading(false);
        };

        checkSessionAndLogin();

        // 🚀 Vérifier régulièrement si le token doit être rafraîchi
        const interval = setInterval(() => {
            refreshAccessToken();
        }, 30 * 60 * 1000); // 🔄 Rafraîchir toutes les 10 minutes

        return () => clearInterval(interval);
    }, []);

    // 🚪 Fonction pour gérer la déconnexion
    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            removeCookie("access_token");
            removeCookie("refresh_token");
            setUser(null);
            console.log("🚪 [AuthContext] Déconnexion réussie !");
            router.replace("/connexion");
        } catch (error) {
            console.error("❌ [AuthContext] Erreur lors de la déconnexion :", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
