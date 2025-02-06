"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { getCookie, removeCookie } from "typescript-cookie";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("🟢 [AuthContext] Vérification de la session en cours...");

        (async () => {
            const session = await supabase.auth.getSession();
            console.log("🔍 [Auth Debug] Session récupérée au chargement :", session);
        })();        

        console.log("🔍 [Auth Debug] Refresh Token dans les cookies :", getCookie("refresh_token"));


        const checkSessionAndLogin = async () => {
            try {
                // 🔍 Vérifier si un token est dans les cookies
                const accessToken = getCookie("access_token");
        
                if (!accessToken) {
                    console.warn("⚠️ [AuthContext] Aucun access_token trouvé, utilisateur non connecté.");
                    setUser(null);
                    setLoading(false);
                    return;
                }
        
                console.log("✅ [AuthContext] Access token détecté :", accessToken);
        
                // 🔄 Récupérer l'utilisateur avec Supabase
                let { data: { user }, error } = await supabase.auth.getUser();
        
                if (error || !user) {
                    console.warn("⚠️ [AuthContext] Session absente ou invalide, tentative de rafraîchissement...");
        
                    // 🌟 Rafraîchir la session si elle est expirée ou absente
                    const response = await fetch("/api/auth/refresh", { method: "POST" });
                    const refreshedSession = await response.json();
        
                    if (refreshedSession.error || !refreshedSession.session) {
                        console.error("❌ [AuthContext] Impossible de récupérer une session valide après rafraîchissement :", refreshedSession.error);
                        removeCookie("access_token");
                        setUser(null);
                    } else {
                        console.log("✅ [AuthContext] Session rafraîchie avec succès !");
                        setUser(refreshedSession.session.user);
                    }
                    
                } else {
                    console.log("✅ [AuthContext] Utilisateur reconnecté :", user.id);
                    setUser(user);
                }
            } catch (err) {
                console.error("❌ [AuthContext] Erreur inattendue :", err);
                setUser(null);
            }
        
            setLoading(false);
        };
        

        checkSessionAndLogin();

        (async () => {
            const { data, error } = await supabase.auth.refreshSession();
            console.log("🔄 [Auth Debug] Tentative de rafraîchissement de la session :", data, error);
        })();
        

        // 🚀 Gestion des changements d'état d'authentification
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("🔄 [AuthContext] Changement d'état :", event);
        
            if (session?.user) {
                console.log("✅ [AuthContext] Connexion détectée, récupération de l'utilisateur...");
                const { data: userData, error } = await supabase.auth.getUser();
                
                if (error || !userData?.user) {
                    console.warn("⚠️ [AuthContext] Impossible de récupérer l'utilisateur.");
                    setUser(null);
                } else {
                    console.log("✅ [AuthContext] Utilisateur mis à jour :", userData.user.id);
                    setUser(userData.user);
                }
            } else {
                console.warn("⚠️ [AuthContext] Déconnexion détectée !");
                
                // 🔄 Demander au serveur de supprimer les cookies (si HttpOnly)
                await fetch("/api/auth/logout", { method: "POST" });
        
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
            await supabase.auth.signOut();
            removeCookie("access_token");
            setUser(null);
            console.log("🚪 [AuthContext] Déconnexion réussie, token supprimé !");
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
