"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from "next/navigation";

export default function EditProductPage() {
    const router = useRouter();
    const { productId } = useParams();
    const [name, setName] = useState('');
    const [unity, setUnity] = useState('');
    const [imgurl, setImgurl] = useState('');
    const [price, setPrice] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (productId) {
            const fetchProduct = async () => {
                try {
                    setLoading(true);
                    const res = await fetch(`/api/products/${productId}`);
                    if (!res.ok) throw new Error('Erreur de récupération du produit');
                    const data = await res.json();

                    // Pré-remplir les champs avec les données du produit
                    setName(data.name);
                    setUnity(data.unity);
                    setImgurl(data.imgurl);
                    setPrice(data.price);
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchProduct();
        } else {
            console.log("productId is not available yet");
        }
    }, [productId]);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const res = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, unity, imgurl, price: parseFloat(price) }),
            });

            if (!res.ok) throw new Error('Erreur lors de la mise à jour du produit');

            // Redirection vers la liste des produits après mise à jour réussie
            router.push('/produits');
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <div className="text-center py-8 text-lg font-semibold">Chargement...</div>;
    if (error) return <div className="text-center py-8 text-red-500 text-lg">Erreur : {error}</div>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6 text-center">Modifier le produit</h1>

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
                    Mettre à jour le produit
                </button>
            </form>
        </div>
    );
}
