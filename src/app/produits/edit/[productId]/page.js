"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from "next/navigation";
import Header from "../../../../components/Header";
import Image from "next/image";
import {getCookie} from "typescript-cookie";

export default function EditProductPage() {
    const router = useRouter();
    const { productId } = useParams();

    const [name, setName] = useState('');
    const [unity, setUnity] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [existingImgUrl, setExistingImgUrl] = useState(null);
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
                setPrice(data.price);
                setQuantity(data.quantity);

                if (data.imgurl) {
                    setExistingImgUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_images/${data.imgurl}`);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    // 📌 Gérer la sélection d'une nouvelle image
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
            if (!validTypes.includes(file.type)) {
                setError("Format d'image invalide. Utilisez JPG, PNG ou WebP.");
                return;
            }

            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    // 📌 Gérer la soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", name);
            formData.append("unity", unity);
            formData.append("price", price);
            formData.append("quantity", quantity);
            if (image) formData.append("image", image);

            const res = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getCookie('access_token')}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Erreur lors de la mise à jour du produit");

            // Redirection vers la liste des produits après mise à jour réussie
            router.push('/produits');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
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

                    {error && <p className="text-red-500 text-center mb-4">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nom du produit"
                            required
                            className="w-full p-2 border border-gray-300 rounded"
                        />

                        <input
                            type="text"
                            value={unity}
                            onChange={(e) => setUnity(e.target.value)}
                            placeholder="Unité (ex: kg, litre)"
                            required
                            className="w-full p-2 border border-gray-300 rounded"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                placeholder="Prix (€)"
                                required
                                className="w-full p-2 border border-gray-300 rounded"
                            />

                            <input
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                placeholder="Quantité"
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>

                        {/* 📌 Aperçu et modification d’image */}
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <label className="block text-gray-700 font-medium mb-2">Image du produit</label>

                            {existingImgUrl && !preview && (
                                <div className="mt-4 flex justify-center">
                                    <Image src={existingImgUrl} alt="Produit" width={150} height={150} className="rounded-md" />
                                </div>
                            )}

                            {preview && (
                                <div className="mt-4 flex justify-center">
                                    <Image src={preview} alt="Nouvelle image" width={150} height={150} className="rounded-md" />
                                </div>
                            )}

                            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border border-gray-300 rounded mt-4" />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 hover:text-[#CFCFCF] transition flex items-center justify-center"
                        >
                            {loading ? "Mise à jour en cours..." : "Mettre à jour le produit"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}