"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from "next/navigation";
import Header from "../../../../components/Header";

export default function EditProductPage() {
    const router = useRouter();
    const { productId } = useParams();
    const [name, setName] = useState('');
    const [unity, setUnity] = useState('');
    const [imgurl, setImgurl] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
                setQuantity(data.quantity);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
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
                body: JSON.stringify({
                    name,
                    unity,
                    imgurl,
                    price: parseFloat(price),
                    quantity: parseFloat(quantity)
                }),
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
        <>
            <Header/>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-auto m-auto pt-20">
                <div className="py-4 px-12 bg-white rounded-lg shadow-md">
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
                        
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Prix unitaire (€)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Prix du produit"
                                    step="0.001"
                                    min="0"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Quantité</label>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded"
                                    placeholder="Quantité du produit"
                                    step="0.001"
                                    min="0"
                                    required
                                />
                            </div>
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

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
                        >
                            Mettre à jour le produit
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}
