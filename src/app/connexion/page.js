'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from "../../components/Header";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const { user, loading } = useAuth();
    const { fetchCart, setCart, ensureUserCartExists } = useCart();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const redirectTo = searchParams.get('redirect') || '/';

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
    
            const data = await res.json();
    
            if (!res.ok) {
                alert(data.error);
                return;
            }
    
            console.log("✅ [Connexion] Connexion réussie, récupération de l'utilisateur...");
    
            // ✅ Récupération immédiate de l'utilisateur après connexion
            const userResponse = await fetch('/api/auth/user', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${data.user.access_token}`,
                },
            });
    
            const userData = await userResponse.json();
    
            if (userResponse.ok) {
                console.log("✅ [Connexion] Utilisateur récupéré :", userData);
    
                // 🔵 Appel forcé de ensureUserCartExists
                console.log("🔵 [Connexion] Appel forcé de ensureUserCartExists avec userId:", userData.id);
                await ensureUserCartExists(userData.id);
    
                // ✅ Réinitialiser et charger le panier
                setCart([]);
                fetchCart(userData.id);
    
                // ✅ Redirection en fonction du rôle
                if (userData.role === 'admin') {
                    router.push('/admin/dashboard');
                } else {
                    router.push(redirectTo);
                }
            } else {
                console.error("❌ [Connexion] Erreur récupération utilisateur après connexion :", userData.error);
                alert("Erreur lors de la récupération des informations utilisateur.");
            }
        } catch (error) {
            console.error('❌ [Connexion] Erreur lors de la connexion :', error.message);
            alert('Erreur lors de la connexion.');
        }
    };
    

    return (
        <>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <h1 className="text-2xl font-bold mb-4">Connexion</h1>
                <form onSubmit={handleLogin} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        Se connecter
                    </button>
                </form>
                <p className="text-sm mt-2">
                    Pas encore de compte ?{' '}
                    <span
                        onClick={() => router.push(`/inscription?redirect=${encodeURIComponent(redirectTo)}`)}
                        className="text-blue-500 hover:underline cursor-pointer"
                    >
                        Inscrivez-vous ici
                    </span>
                </p>
            </div>
        </>
    );
}
