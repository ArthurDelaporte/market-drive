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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        
        try {
            const res = await fetch('/api/auth/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                setErrorMessage(data.error || 'Erreur lors de la connexion');
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
            setErrorMessage('Erreur lors de la connexion.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <>
            <Header />
            <Suspense fallback={<p role="status">Chargement des paramètres...</p>}>
                <SearchParamsHandler setRedirectTo={setRedirectTo} />
            </Suspense>
            
            <main className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] pt-20">
                <form 
                    onSubmit={handleLogin} 
                    className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
                    aria-labelledby="login-heading"
                    noValidate
                >
                    <h1 id="login-heading" className="text-2xl font-bold mb-4" tabIndex="-1">Connexion</h1>
                    
                    {errorMessage && (
                        <div 
                            role="alert"
                            className="mb-4 p-2 text-red-700 bg-red-100 border border-red-400 rounded"
                            aria-live="assertive"
                        >
                            {errorMessage}
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            aria-required="true"
                            aria-invalid={!email}
                            aria-describedby={!email ? "email-error" : undefined}
                            autoComplete="email"
                        />
                        {!email && (
                            <span id="email-error" className="sr-only">
                                L&apos;email est requis
                            </span>
                        )}
                    </div>
                    
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                            Mot de passe
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                            aria-required="true"
                            aria-invalid={!password}
                            aria-describedby={!password ? "password-error" : undefined}
                            autoComplete="current-password"
                        />
                        {!password && (
                            <span id="password-error" className="sr-only">
                                Le mot de passe est requis
                            </span>
                        )}
                    </div>
                    
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                    >
                        {isSubmitting ? 'Connexion en cours...' : 'Se connecter'}
                    </button>
                </form>
                
                <p className="text-sm mt-2">
                    Pas encore de compte ?{' '}
                    <a
                        href={`/inscription?redirect=${encodeURIComponent(redirectTo)}`}
                        className="text-blue-500 hover:underline"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push(`/inscription?redirect=${encodeURIComponent(redirectTo)}`);
                        }}
                    >
                        Inscrivez-vous ici
                    </a>
                </p>
            </main>
        </>
    );
}