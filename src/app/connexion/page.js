'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from "../../components/Header";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
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

            // Vérification du rôle de l'utilisateur
            const userRole = data.user?.role;

            if (userRole === 'admin') {
                // Redirige vers le tableau de bord admin
                router.push('/admin/dashboard');
            } else {
                // Redirige vers la page demandée ou la page d'accueil
                router.push(redirectTo);
            }
        } catch (error) {
            console.error('Erreur lors de la connexion :', error.message);
            alert('Erreur lors de la connexion.');
        }
    };

    return (
        <>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
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