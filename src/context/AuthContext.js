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
        console.log("🟢 [AuthContext] useEffect lancé !");

        const fetchUser = async () => {
            console.log("🔄 [AuthContext] Tentative de récupération de session...");
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error) {
                console.error("❌ [AuthContext] Erreur récupération session :", error);
                return;
            }

            console.log("📌 [AuthContext] Session trouvée :", session);

            if (session) {
                setUser(session.user);
                console.log("✅ [AuthContext] Utilisateur connecté :", session.user.id);
            } else {
                console.warn("⚠️ [AuthContext] Aucun utilisateur connecté !");
            }

            setLoading(false);
        };

        fetchUser();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("🔄 [AuthContext] Changement d'état de l'auth :", event, session);

            if (session) {
                setUser(session.user);
                console.log("✅ [AuthContext] Connexion détectée, utilisateur :", session.user.id);
            } else {
                setUser(null);
                console.warn("⚠️ [AuthContext] Déconnexion détectée !");
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
