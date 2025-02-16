'use client';

import { useState, useEffect } from 'react';
import { getCookie } from 'typescript-cookie';
import { toast } from 'react-toastify';
import Header from '@/components/Header';
import { Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

export default function AnalyseImagePage() {
    const router = useRouter();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [detectedProducts, setDetectedProducts] = useState([]);
    const [user, setUser] = useState(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Dans le useEffect pour vérifier l'authentification
    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = getCookie("access_token");
            if (!accessToken) {
                toast.error("Vous devez être connecté pour accéder à cette page");
                router.push("/connexion");
                return;
            }

            try {
                const response = await fetch("/api/auth/user", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error("Non autorisé");
                }

                const userData = await response.json();
                setUser(userData);
            } catch (error) {
                toast.error("Vous devez être connecté pour accéder à cette page");
                router.push("/connexion");
            }
        };

        checkAuth();
    }, []);

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        setSelectedImage(imageUrl);
    
        const formData = new FormData();
        formData.append('image', file);
    
        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/vision', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                },
                body: formData
            });
    
            const data = await response.json();
            console.log("Réponse complète de l'API:", data);
    
            const productsDetected = data.products || data.availableProducts || [];
            
            setDetectedProducts(productsDetected);
            
            if (productsDetected.length === 0) {
                toast.info("Aucun produit détecté. Essayez une autre image.");
            } else {
                toast.success(`${productsDetected.length} produit(s) détecté(s) !`);
            }
        } catch (error) {
            console.error('Erreur complète:', error);
            toast.error("Une erreur est survenue lors de l'analyse de l'image");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const addToCart = async (productId) => {
        try {
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ product_id: productId, quantity: 1 }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }

            toast.success("Produit ajouté au panier !");
        } catch (error) {
            console.error("Erreur lors de l'ajout au panier :", error);
            toast.error("Une erreur est survenue. Réessayez plus tard.");
        }
    };

    // Dans votre composant React
    return (
        <>
            <Header />
            <div className="container mx-auto p-6 pt-24">
                <h1 className="text-3xl font-bold text-center mb-8">Analyse d'image</h1>

                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-8">
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageUpload}
                            className="hidden"
                            id="camera-input"
                        />
                        <label
                            htmlFor="camera-input"
                            className="bg-teal-500 text-white px-6 py-3 rounded-lg cursor-pointer inline-flex items-center gap-2 hover:bg-teal-600 transition"
                        >
                            <Camera className="h-6 w-6" />
                            {isAnalyzing ? "Analyse en cours..." : "Prendre une photo"}
                        </label>
                    </div>

                    {selectedImage && (
                        <div className="mb-6 flex justify-center">
                            <img 
                                src={selectedImage} 
                                alt="Image uploadée" 
                                className="max-w-full h-auto max-h-96 rounded-lg shadow-md object-cover"
                            />
                        </div>
                    )}

                    {detectedProducts.length > 0 && (
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-teal-500 text-white px-4 py-3 font-semibold">
                                Produits détectés
                            </div>
                            
                            {detectedProducts.map((product) => (
                                <div 
                                    key={product.id} 
                                    className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50 transition"
                                >
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">
                                            {product.name}
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            Prix : {product.price.toFixed(2)} €
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => addToCart(product.id)}
                                        className="bg-teal-500 text-white px-4 py-2 rounded-md hover:bg-teal-600 transition flex items-center gap-2"
                                    >
                                        <ShoppingCart className="h-5 w-5" />
                                        Ajouter au panier
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {detectedProducts.length === 0 && !isAnalyzing && (
                        <div className="text-center text-gray-500 bg-gray-100 rounded-lg p-6">
                            <p>Aucun produit détecté</p>
                            <p className="mt-2 text-sm">Essayez de prendre une autre photo</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}