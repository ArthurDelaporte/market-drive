'use client';

import { useRouter } from "next/navigation";
import { removeCookie } from "typescript-cookie"; 
import { createClient } from "@supabase/supabase-js";
import { FaSignOutAlt } from 'react-icons/fa';

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
            className="logoutbutton w-full px-4 py-2 text-left flex items-center gap-2
            bg-red-500 hover:bg-red-700 text-white hover:text-gray-100"
        >
            <FaSignOutAlt className="h-5 w-5" />
            Se déconnecter
        </button>
    );
}
