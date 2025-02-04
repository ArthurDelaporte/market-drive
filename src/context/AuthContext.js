"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

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

        const checkSessionAndLogin = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                console.warn("⚠️ [AuthContext] Aucune session active détectée.");
                setUser(null);
                setLoading(false);
                return;
            }

            console.log("✅ [AuthContext] Session active détectée :", session);

            const { data: userData, error: userError } = await supabase.auth.getUser();

            if (userError || !userData?.user) {
                console.warn("⚠️ [AuthContext] Impossible de récupérer l'utilisateur.");
                setUser(null);
            } else {
                console.log("✅ [AuthContext] Utilisateur reconnecté :", userData.user.id);
                setUser(userData.user);
            }

            setLoading(false);
        };

        checkSessionAndLogin();

        // Écoute les changements d'état d'authentification
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("🔄 [AuthContext] Changement d'état de l'auth :", event, session);
        
            if (session?.user) {
                console.log("✅ [AuthContext] Connexion détectée, utilisateur :", session.user.id);
                setUser(session.user);
            } else {
                console.warn("⚠️ [AuthContext] Déconnexion détectée !");
                setUser(null);
            }
        });
        
        console.log("🛑 [AuthContext] Listener sur l'authentification initialisé !");
        
        
        

        return () => authListener.subscription.unsubscribe();
    }, []);

    // 🚀 Fonction pour gérer la déconnexion proprement
    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        console.log("🚪 [AuthContext] Utilisateur déconnecté et token supprimé !");
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
