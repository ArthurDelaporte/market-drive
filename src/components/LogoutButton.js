'use client';

import { useRouter } from "next/navigation";

export default function LogoutButton() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Erreur inconnue");
                return;
            }

            alert("Déconnexion réussie !");
            router.push("/connexion");
        } catch (error) {
            console.error("Erreur lors de la déconnexion :", error.message);
            alert("Erreur lors de la déconnexion.");
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="logoutbutton bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
            Se déconnecter
        </button>
    );
}