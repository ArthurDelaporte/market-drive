"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from "@/components/Header";

function SearchParamsHandler({ setRedirectTo }) {
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get('redirect');

    useEffect(() => {
        setRedirectTo(redirectParam || '/');
    }, [redirectParam, setRedirectTo]);

    return null;
}

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirectTo, setRedirectTo] = useState('/');

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

            const userRole = data.user?.role;

            if (userRole === 'admin') {
                router.push('/admin');
            } else {
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
            <Suspense fallback={<p>Chargement des paramètres...</p>}>
                <SearchParamsHandler setRedirectTo={setRedirectTo} />
            </Suspense>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <form onSubmit={handleLogin} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-4">Connexion</h1>
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
