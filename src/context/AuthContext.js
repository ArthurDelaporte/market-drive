"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCookie, removeCookie } from "typescript-cookie";
import { useRouter } from "next/navigation";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
        persistSession: false, // 🔹 Désactiver la persistance automatique
        autoRefreshToken: false, // 🔹 Supprimer toute gestion automatique de refresh token
    }
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("🟢 [AuthContext] Vérification de la session en cours...");

        const checkSessionAndLogin = async () => {
            try {
                // 🔍 Vérifier si un access_token est stocké en cookie
                const accessToken = getCookie("access_token");

                if (!accessToken) {
                    console.warn("⚠️ [AuthContext] Aucun access_token trouvé, utilisateur non connecté.");
                    setUser(null);
                    setLoading(false);
                    return;
                }

                console.log("✅ [AuthContext] Access token détecté :", accessToken);

                // 🔄 Récupérer l'utilisateur avec Supabase
                const { data: { user }, error } = await supabase.auth.getUser();

                if (error || !user) {
                    console.error("❌ [AuthContext] Session expirée ou invalide. L'utilisateur doit se reconnecter.");
                    removeCookie("access_token"); // 🔹 Supprimer le cookie expiré
                    setUser(null);
                } else {
                    console.log("✅ [AuthContext] Utilisateur valide :", user.id);
                    setUser(user);
                }
            } catch (err) {
                console.error("❌ [AuthContext] Erreur inattendue :", err);
                setUser(null);
            }

            setLoading(false);
        };

        checkSessionAndLogin();

        // 🚀 Écoute les changements d'état d'authentification
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("🔄 [AuthContext] Changement d'état :", event);

            if (session?.user) {
                console.log("✅ [AuthContext] Connexion détectée :", session.user.id);
                setUser(session.user);
            } else {
                console.warn("⚠️ [AuthContext] Déconnexion détectée !");
                removeCookie("access_token");
                setUser(null);
            }
        });

        console.log("🛑 [AuthContext] Listener sur l'authentification initialisé !");

        return () => {
            if (authListener && authListener.subscription) {
                authListener.subscription.unsubscribe();
                console.log("🔌 [AuthContext] Listener nettoyé.");
            }
        };
    }, []);

    // 🚪 Fonction propre pour gérer la déconnexion
    const signOut = async () => {
        try {
            const router = useRouter();
            await supabase.auth.signOut();
            removeCookie("access_token");
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
