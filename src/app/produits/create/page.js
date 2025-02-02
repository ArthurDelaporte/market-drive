"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "../../../components/Header";

export default function CreateProductPage() {
    const [name, setName] = useState('');
    const [unity, setUnity] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const [categoriesLevel0, setCategoriesLevel0] = useState([]);
    const [selectedCategory0, setSelectedCategory0] = useState(null);
    const [categoriesLevel1, setCategoriesLevel1] = useState([]);
    const [selectedCategory1, setSelectedCategory1] = useState(null);
    const [categoriesLevel2, setCategoriesLevel2] = useState([]);
    const [selectedCategory2, setSelectedCategory2] = useState(null);

    const router = useRouter();

    // 📌 **Charger les catégories de niveau 0 au montage**
    useEffect(() => {
        const fetchCategoriesLevel0 = async () => {
            try {
                const res = await fetch('/api/categories/parent');
                if (!res.ok) throw new Error("Erreur lors du chargement des catégories");
                const data = await res.json();
                setCategoriesLevel0(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchCategoriesLevel0();
    }, []);

    // 📌 **Gérer le changement de catégorie de niveau 0**
    const handleCategory0Change = async (e) => {
        const categoryId = e.target.value;
        setSelectedCategory0(categoryId);
        setSelectedCategory1(null);
        setSelectedCategory2(null);
        setCategoriesLevel1([]);
        setCategoriesLevel2([]);

        if (!categoryId) return;

        try {
            const res = await fetch(`/api/categories/parent/${categoryId}`);
            const data = await res.json();
            setCategoriesLevel1(data);
        } catch (err) {
            setError("Erreur lors du chargement des sous-catégories");
        }
    };

    // 📌 **Gérer le changement de catégorie de niveau 1**
    const handleCategory1Change = async (e) => {
        const categoryId = e.target.value;
        setSelectedCategory1(categoryId);
        setSelectedCategory2(null);
        setCategoriesLevel2([]);

        if (!categoryId) return;

        try {
            const res = await fetch(`/api/categories/parent/${categoryId}`);
            const data = await res.json();
            setCategoriesLevel2(data);
        } catch (err) {
            setError("Erreur lors du chargement des sous-catégories");
        }
    };

    // 📌 **Gérer le changement de catégorie de niveau 2**
    const handleCategory2Change = (e) => {
        setSelectedCategory2(e.target.value);
    };

    // 📌 **Gérer la sélection d'image**
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const validTypes = ["image/jpeg", "image/png", "image/webp"];
            if (!validTypes.includes(file.type)) {
                setError("Format d'image invalide. Utilisez JPG, PNG ou WebP.");
                return;
            }

            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError(null);
        }
    };

    // 📌 **Gérer la soumission du formulaire**
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!name || !unity || !price || !quantity || (!selectedCategory0 && !selectedCategory1 && !selectedCategory2)) {
            setError("Tous les champs sont obligatoires.");
            return;
        }

        const finalCategory = selectedCategory2 || selectedCategory1 || selectedCategory0;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("name", name);
            formData.append("unity", unity);
            formData.append("price", price);
            formData.append("quantity", quantity);
            formData.append("category_id", finalCategory);
            if (image) formData.append("image", image);

            const res = await fetch('/api/products', { method: 'POST', body: formData });

            if (!res.ok) throw new Error("Erreur lors de la création du produit");

            router.push('/produits');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-auto m-auto pt-20">
                <div className="py-4 px-12 bg-white rounded-lg shadow-md w-full max-w-md">
                    <h1 className="text-2xl font-bold mb-6 text-center text-[#424242]">Créer un produit</h1>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                               placeholder="Nom du produit" required
                               className="w-full p-2 border border-gray-300 rounded"/>
                        <input type="text" value={unity} onChange={(e) => setUnity(e.target.value)}
                               placeholder="Unité (ex: kg, litre)" required
                               className="w-full p-2 border border-gray-300 rounded"/>

                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                                   placeholder="Prix (€)" required
                                   className="w-full p-2 border border-gray-300 rounded"/>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                   placeholder="Quantité" className="w-full p-2 border border-gray-300 rounded"/>
                        </div>

                        {/* 📌 **Sélection des catégories** */}
                        <select onChange={handleCategory0Change} required
                                className="w-full p-2 border border-gray-300 rounded">
                            <option value="">Sélectionner une catégorie</option>
                            {categoriesLevel0.map((category) => (
                                <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                        </select>

                        {categoriesLevel1.length > 0 && (
                            <select onChange={handleCategory1Change} required
                                    className="w-full p-2 border border-gray-300 rounded">
                                <option value="">Sélectionner une sous-catégorie</option>
                                {categoriesLevel1.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        )}

                        {categoriesLevel2.length > 0 && (
                            <select onChange={handleCategory2Change} required
                                    className="w-full p-2 border border-gray-300 rounded">
                                <option value="">Sélectionner une sous-sous-catégorie</option>
                                {categoriesLevel2.map((category) => (
                                    <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                            </select>
                        )}

                        {/* 📌 **Champ Upload d'image** */}
                        <div className="border p-4 rounded-lg bg-gray-50">
                            <label className="block text-gray-700 font-medium mb-2">Image du produit</label>
                            <input type="file" accept="image/*" onChange={handleImageChange} className="w-full p-2 border border-gray-300 rounded" />

                            {preview && (
                                <div className="mt-4 flex justify-center">
                                    <Image src={preview} alt="Aperçu" width={150} height={150} className="rounded-md" />
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                                className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition">
                            {loading ? "Ajout en cours..." : "Créer le produit"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}