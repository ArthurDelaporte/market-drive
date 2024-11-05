"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProductPage() {
    const [name, setName] = useState('');
    const [unity, setUnity] = useState('');
    const [imgurl, setImgurl] = useState('');
    const [price, setPrice] = useState('');
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!name || !unity || !imgurl || !price) {
            setError('Tous les champs sont obligatoires');
            return;
        }

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, unity, imgurl, price: parseFloat(price) }),
            });

            if (!res.ok) throw new Error('Erreur lors de la création du produit');

            router.push('/produits');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Créer un produit</h1>

            {error && <p className="text-red-500 mb-4">{error}</p>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Nom</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Nom du produit"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Unité</label>
                    <input
                        type="text"
                        value={unity}
                        onChange={(e) => setUnity(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Unité (ex: kg, litre)"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Image URL</label>
                    <input
                        type="url"
                        value={imgurl}
                        onChange={(e) => setImgurl(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="URL de l'image"
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Prix (€)</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="Prix du produit"
                        step="0.01"
                        min="0"
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                >
                    Créer le produit
                </button>
            </form>
        </div>
    );
}
