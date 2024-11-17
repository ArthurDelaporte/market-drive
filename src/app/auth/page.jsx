'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';

export default function AuthPage() {
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [birthdate, setBirthdate] = useState('');
    const [showPopup, setShowPopup] = useState(false);

    const [passwordChecklist, setPasswordChecklist] = useState({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
    });

    const [isSignUp, setIsSignUp] = useState(false);

    const validatePassword = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        };
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordChecklist(validatePassword(value));
    };

    const isPasswordValid = Object.values(passwordChecklist).every(Boolean);

    const handleSignUp = async (e) => {
        e.preventDefault();

        try {
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                alert("Cette adresse email est déjà utilisée. Veuillez vous connecter.");
                return;
            }

            if (checkError && checkError.code !== 'PGRST116') {
                throw checkError;
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            const { user } = data;
            const { error: insertError } = await supabase.from('users').insert([
                {
                    id: user.id,
                    email,
                    firstname,
                    lastname,
                    birthdate,
                    role: 'client',
                },
            ]);

            if (insertError) throw insertError;

            setShowPopup(true);
        } catch (error) {
            console.error('Erreur lors de l’inscription :', error.message);
            alert('Erreur : ' + error.message);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            alert('Connexion réussie !');
            router.push('/');
        } catch (error) {
            console.error('Erreur lors de la connexion :', error.message);
            alert('Erreur : ' + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <h1 className="text-2xl font-bold mb-4">
                {isSignUp ? 'Inscription' : 'Connexion'}
            </h1>
            <form
                onSubmit={isSignUp ? handleSignUp : handleSignIn}
                className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-md"
            >
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Mot de passe
                    </label>
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
                            Au moins un caractère spécial (!@#$%^&amp;*(),.?&quot;:{}|&lt;&gt;)
                        </li>
                    </ul>
                </div>
                {isSignUp && (
                    <>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Prénom
                            </label>
                            <input
                                type="text"
                                value={firstname}
                                onChange={(e) => setFirstname(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Nom
                            </label>
                            <input
                                type="text"
                                value={lastname}
                                onChange={(e) => setLastname(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Date de naissance
                            </label>
                            <input
                                type="date"
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value)}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                required
                            />
                        </div>
                    </>
                )}
                <button
                    type="submit"
                    className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                        !isPasswordValid && "opacity-50 cursor-not-allowed"
                    }`}
                    disabled={!isPasswordValid}
                >
                    {isSignUp ? "S'inscrire" : 'Se connecter'}
                </button>
            </form>
            <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-blue-500 hover:underline"
            >
                {isSignUp
                    ? 'Déjà un compte ? Connectez-vous'
                    : "Pas encore de compte ? Inscrivez-vous"}
            </button>
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md text-center">
                        <h2 className="text-xl font-bold mb-4">Vérifiez votre email</h2>
                        <p>Un email de confirmation a été envoyé à {email}. Veuillez vérifier votre boîte mail avant de vous connecter.</p>
                        <button
                            onClick={() => {
                                setShowPopup(false);
                                router.push('/auth');
                            }}
                            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
