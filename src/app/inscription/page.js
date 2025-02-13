'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [birthdate, setBirthdate] = useState("");
    const [passwordChecklist, setPasswordChecklist] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });

    const redirectTo = searchParams.get('redirect') || '/';

    const validatePassword = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|]/.test(password),
        };
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordChecklist(validatePassword(value));
    };

    const isPasswordValid = Object.values(passwordChecklist).every(Boolean);

    const handleSignup = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, firstname, lastname, birthdate }),
            });

            const data = await response.json();

            if (response.ok) {
                router.push(`/connexion?redirect=${encodeURIComponent(redirectTo)}`);
            } else {
                alert(data.error || "Une erreur est survenue.");
            }
        } catch (error) {
            console.error("Erreur lors de l'inscription :", error.message);
            alert("Erreur : " + error.message);
        }
    };

    return (
        <>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-24">
                <h1 className="text-2xl font-bold mb-4">Inscription</h1>
                <form
                    onSubmit={handleSignup}
                    className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
                >
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
                            onChange={handlePasswordChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                        <ul className="text-sm mt-2">
                            <li className={passwordChecklist.length ? "text-green-600" : "text-red-600"}>
                                Minimum 8 caractères
                            </li>
                            <li className={passwordChecklist.uppercase ? "text-green-600" : "text-red-600"}>
                                Au moins une lettre majuscule
                            </li>
                            <li className={passwordChecklist.lowercase ? "text-green-600" : "text-red-600"}>
                                Au moins une lettre minuscule
                            </li>
                            <li className={passwordChecklist.number ? "text-green-600" : "text-red-600"}>
                                Au moins un chiffre
                            </li>
                            <li className={passwordChecklist.special ? "text-green-600" : "text-red-600"}>
                                Au moins un caractère spécial (!@#$%^&*(),.?&#34;:{}|)
                            </li>
                        </ul>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Prénom</label>
                        <input
                            type="text"
                            value={firstname}
                            onChange={(e) => setFirstname(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Nom</label>
                        <input
                            type="text"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">Date de naissance</label>
                        <input
                            type="date"
                            value={birthdate}
                            onChange={(e) => setBirthdate(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                            !isPasswordValid && "opacity-50 cursor-not-allowed"
                        }`}
                        disabled={!isPasswordValid}
                    >
                        S&#39;inscrire
                    </button>
                </form>
                <p className="text-sm mt-2">
                    Déjà un compte ?{' '}
                    <span
                        onClick={() => router.push(`/connexion?redirect=${encodeURIComponent(redirectTo)}`)}
                        className="text-blue-500 hover:underline"
                    >
                        Connectez-vous ici
                    </span>
                </p>
            </div>
        </>
    );
}