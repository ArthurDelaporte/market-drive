"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminHeader from "../../../../../components/AdminHeader";
import Image from "next/image";
import {getCookie} from "typescript-cookie";
import { PRODUCTS_UNITIES } from "@/config/constants";

export default function EditProductPage() {
    const router = useRouter();
    const { productId } = useParams();

    const [name, setName] = useState('');
    const [unity, setUnity] = useState(null);
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [existingImgUrl, setExistingImgUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 📌 **États pour les catégories**
    const [categoriesLevel0, setCategoriesLevel0] = useState([]);
    const [selectedCategory0, setSelectedCategory0] = useState('');
    const [categoriesLevel1, setCategoriesLevel1] = useState([]);
    const [selectedCategory1, setSelectedCategory1] = useState('');
    const [categoriesLevel2, setCategoriesLevel2] = useState([]);
    const [selectedCategory2, setSelectedCategory2] = useState('');

    useEffect(() => {
        const fetchProductAndCategories = async () => {
            try {
                setLoading(true);
                const res = await fetch(`/api/products/${productId}`);
                if (!res.ok) throw new Error('Erreur de récupération du produit');
                const product = await res.json();

                // 📌 **Pré-remplissage des champs**
                setName(product.name);
                setUnity(product.unity);
                setPrice(product.price);
                setQuantity(product.quantity);

                if (product.imgurl) {
                    setExistingImgUrl(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_images/${product.imgurl}`);
                }

                // 📌 **Charger les catégories de niveau 0**
                const resCategories = await fetch('/api/categories/parent');
                if (!resCategories.ok) throw new Error('Erreur de récupération des catégories');
                const dataCategories = await resCategories.json();
                setCategoriesLevel0(dataCategories);

                // 📌 **Gérer la hiérarchie des catégories**
                if (product.category_id) {
                    let currentCategory = await fetch(`/api/categories/${product.category_id}`).then(res => res.json());
                    setSelectedCategory2(currentCategory.id);

                    const resLevel2 = await fetch(`/api/categories/parent/${currentCategory.category_parent}`);
                    setCategoriesLevel2(await resLevel2.json());

                    if (currentCategory.category_parent) {
                        let parentCategory = await fetch(`/api/categories/${currentCategory.category_parent}`).then(res => res.json());
                        setSelectedCategory1(parentCategory.id);

                        const resLevel1 = await fetch(`/api/categories/parent/${parentCategory.category_parent}`);
                        setCategoriesLevel1(await resLevel1.json());

                        if (parentCategory.category_parent) {
                            let grandParentCategory = await fetch(`/api/categories/${parentCategory.category_parent}`).then(res => res.json());
                            setSelectedCategory0(grandParentCategory.id);

                            const resLevel0 = await fetch(`/api/categories/parent`);
                            setCategoriesLevel0(await resLevel0.json());
                        } else {
                            setSelectedCategory0(selectedCategory1);
                            setSelectedCategory1(selectedCategory2)
                            setSelectedCategory2(null);
                            setCategoriesLevel0(categoriesLevel1);
                            setCategoriesLevel1(categoriesLevel2);
                            setCategoriesLevel2([]);
                        }
                    } else {
                        setSelectedCategory0(selectedCategory2);
                        setSelectedCategory2(null);
                        setCategoriesLevel0(categoriesLevel2);
                        setCategoriesLevel2([]);
                    }
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProductAndCategories();
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

    // 📌 **Gestion dynamique des catégories**
    const handleCategory0Change = async (e) => {
        const categoryId = e.target.value;
        setSelectedCategory0(categoryId);
        setSelectedCategory1('');
        setSelectedCategory2('');
        setCategoriesLevel1([]);
        setCategoriesLevel2([]);

        if (!categoryId) return;

        const res = await fetch(`/api/categories/parent/${categoryId}`);
        if (!res.ok) return;
        setCategoriesLevel1(await res.json());
    };

    const handleCategory1Change = async (e) => {
        const categoryId = e.target.value;
        setSelectedCategory1(categoryId);
        setSelectedCategory2('');
        setCategoriesLevel2([]);

        if (!categoryId) return;

        const res = await fetch(`/api/categories/parent/${categoryId}`);
        if (!res.ok) return;
        setCategoriesLevel2(await res.json());
    };

    const handleCategory2Change = (e) => {
        setSelectedCategory2(e.target.value);
    };

    // 📌 **Soumission du formulaire**
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
            formData.append("category_id", selectedCategory2 || selectedCategory1 || selectedCategory0);
            if (image) formData.append("image", image);

            const res = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${getCookie('access_token')}`
                },
                body: formData
            });

            if (!res.ok) throw new Error("Erreur lors de la mise à jour du produit");

            router.push('/admin/produits');
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
            <AdminHeader/>
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-auto m-auto pt-20">
                <div className="py-4 px-12 bg-white rounded-lg shadow-md w-full max-w-md">
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

                        {/* 📌 **Sélection de l'unité** */}
                        <select onChange={(e) => setUnity(e.target.value)}
                                required className="w-full p-2 border border-gray-300 rounded" value={unity}>
                            <option value="">--- Sélectionner une unité ---</option>
                            {PRODUCTS_UNITIES.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>

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

                        {/* 📌 Sélection des catégories */}
                        <select onChange={handleCategory0Change} value={selectedCategory0}
                                className="w-full p-2 border border-gray-300 rounded">
                            <option value="">--- Sélectionner une catégorie ---</option>
                            {categoriesLevel0.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>

                        {categoriesLevel1.length > 0 &&
                            <select onChange={handleCategory1Change} value={selectedCategory1}
                                    className="w-full p-2 border border-gray-300 rounded">
                                <option value="">--- Sélectionner une sous-catégorie ---</option>
                                {categoriesLevel1.map(cat =>
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                )}
                            </select>
                        }
                        {categoriesLevel2.length > 0 &&
                            <select onChange={handleCategory2Change} value={selectedCategory2}
                                    className="w-full p-2 border border-gray-300 rounded">
                                <option value="">--- Sélectionner une sous-sous-catégorie ---</option>
                                {categoriesLevel2.map(cat =>
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                )}
                            </select>
                        }

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