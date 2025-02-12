'use client';

import { useRouter } from "next/navigation";
import { removeCookie } from "typescript-cookie"; 
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            // 1️⃣ Déconnecter de Supabase (supprime la session côté serveur)
            await supabase.auth.signOut();
    
            // 2️⃣ Supprimer la session côté serveur (si le cookie est HttpOnly)
            await fetch("/api/auth/logout", { method: "POST" });
    
            // 3️⃣ Supprimer les cookies d'authentification (frontend)
            removeCookie("access_token");
    
            // 5️⃣ Rediriger vers la page de connexion
            router.replace("/connexion");
        } catch (error) {
            console.error("Erreur lors de la déconnexion :", error.message);
            alert("Erreur lors de la déconnexion.");
        }
    };    

    return (
        <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
            Se déconnecter
        </button>
    );
}
