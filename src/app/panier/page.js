"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { toast } from "react-toastify";
import { getCookie } from "typescript-cookie";
import "react-toastify/dist/ReactToastify.css";
import CheckoutButton from "@/components/CheckoutButton";

export default function CartPage() {
    const [user, setUser] = useState(null);
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recipe, setRecipe] = useState(null);
    const [isLoadingRecipe, setIsLoadingRecipe] = useState(false);
    const [ingredientsInfo, setIngredientsInfo] = useState({});

    const fetchProducts = async (cartProducts) => {
        if (!cartProducts.length) return;

        // Extraire les IDs uniques des produits
        const productIds = [...new Set(cartProducts.map((p) => p.product_id))];

        try {
            const response = await fetch("/api/products/batch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getCookie("access_token")}`,
                },
                body: JSON.stringify({ productIds }),
            });

            if (!response.ok) throw new Error("Impossible de récupérer les produits");

            const data = await response.json();
            setProducts(data.products);
        } catch (error) {
            console.error("Erreur lors de la récupération des produits :", error);
            toast.error("Erreur lors du chargement des produits.");
        }
    };

    const fetchCart = async (userId) => {
        try {
            const response = await fetch(`/api/user/${userId}/carts`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                }
            });
            if (!response.ok) {
                throw new Error("Erreur lors de la récupération du panier");
            }
            const cartData = await response.json();
            await fetchProducts(cartData.products)
            setCart(cartData || []);
        } catch (error) {
            console.error("Erreur récupération du panier :", error);
            toast.error("Erreur lors du chargement du panier.");
        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        if (hasCheckedAuth) return;

        const fetchUser = async () => {
            try {
                const accessToken = getCookie("access_token");

                if (!accessToken) {
                    toast.error("Vous devez être connecté pour voir votre panier !");
                    return;
                }

                try {
                    const response = await fetch("/api/auth/user", {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });

                    if (!response.ok) {
                        const { error } = await response.json();
                        toast.error(`Erreur : ${error}`);
                        return;
                    }

                    const userData = await response.json();
                    setUser(userData);
                    setHasCheckedAuth(true);
                    fetchCart(userData.id);
                } catch (decodeError) {
                    toast.error("Erreur lors du décodage du token.");
                    console.error("Token decode error:", decodeError);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération de l'utilisateur :", error);
                toast.error("Impossible de récupérer l'utilisateur.");
            }
        };

        fetchUser();
    }, [hasCheckedAuth]);

    const updateQuantity = async (productId, newQuantity) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ product_id: productId, quantity: newQuantity }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }

            fetchCart(user.id);
        } catch (error) {
            console.error("Erreur mise à jour quantité :", error);
            toast.error("Impossible de mettre à jour la quantité.");
        }
    };

    const removeFromCart = async (productId) => {
        if (!user) return;

        try {
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ product_id: productId }),
            });

            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }

            fetchCart(user.id);
        } catch (error) {
            console.error("Erreur suppression produit :", error);
            toast.error("Impossible de supprimer le produit.");
        }
    };

    const addToCart = async (productId) => {
        try {
            if (!user) {
                toast.error("Vous devez être connecté pour ajouter un produit au panier !");
                return;
            }
    
            const response = await fetch(`/api/user/${user.id}/carts`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ product_id: productId, quantity: 1 }), // On met 1 par défaut
            });
    
            if (!response.ok) {
                const { error } = await response.json();
                toast.error(`Erreur : ${error}`);
                return;
            }
    
            toast.success("Produit ajouté au panier !");
        } catch (error) {
            console.error("❌ Erreur lors de l'ajout au panier :", error);
            toast.error("Une erreur est survenue. Réessayez plus tard.");
        }
    };

    const addAllMissingToCart = async (missingIngredients) => {
        try {
            if (!user) {
                toast.error("Vous devez être connecté pour ajouter des produits au panier !");
                return;
            }
    
            // Récupérer le catalogue de produits
            const catalogResponse = await fetch("/api/products", {
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                }
            });
    
            if (!catalogResponse.ok) {
                toast.error("Erreur lors de la récupération des produits");
                return;
            }
    
            const catalogProducts = await catalogResponse.json();
    
            // Pour chaque ingrédient manquant, trouver le produit correspondant et l'ajouter
            for (const ingredient of missingIngredients) {
                const matchingProduct = catalogProducts.find(product => 
                    product.name.toLowerCase().includes(ingredient.toLowerCase())
                );
    
                if (matchingProduct) {
                    // Utiliser l'ID du produit
                    await addToCart(matchingProduct.id);
                }
            }

            await fetchCart(user.id);
    
            toast.success("Tous les ingrédients manquants ont été ajoutés au panier !");
        } catch (error) {
            console.error("Erreur lors de l'ajout des ingrédients :", error);
            toast.error("Une erreur est survenue lors de l'ajout des ingrédients");
        }
    };

    // 🔹 Générer des recettes en utilisant GPT
    const handleGenerateRecipe = async () => {
        setIsLoadingRecipe(true);
        setRecipe(null);
    
        try {
            if (!cart.products || !products.length) {
                toast.error("Votre panier est vide");
                return;
            }
    
            const recipeResponse = await fetch("/api/chatgpt/recette", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                    "Content-Type": "application/json"
                }
            });
    
            const recipeResult = await recipeResponse.json();
            console.log("Réponse de l'API:", recipeResult);
    
            if (!recipeResponse.ok) {
                toast.error(recipeResult.error || "Impossible de générer les recettes.");
                return;
            }
    
            if (!recipeResult.recipes || !Array.isArray(recipeResult.recipes)) {
                toast.error("Format de recette invalide");
                return;
            }
    
            const catalogResponse = await fetch("/api/products", {
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                }
            });
    
            if (!catalogResponse.ok) {
                toast.error("Erreur lors de la vérification des produits disponibles");
                return;
            }
    
            const catalogProducts = await catalogResponse.json();
    
            // Nouvelle logique de traitement des noms de produits
            const catalogProductNames = catalogProducts.map(p => ({
                fullName: p.name?.toLowerCase().trim() || '',
                simpleName: p.name?.toLowerCase().trim().split(' ')[0] || ''
            }));
    
            const cartProductNames = products.map(p => ({
                fullName: p.name?.toLowerCase().trim() || '',
                simpleName: p.name?.toLowerCase().trim().split(' ')[0] || ''
            }));
    
            // Fonction helper pour vérifier la disponibilité d'un ingrédient
            const isIngredientInList = (ingredientName, productList) => {
                const ingName = ingredientName.toLowerCase().trim();
                const simpleIngName = ingName.split(' ')[0];
                return productList.some(product => 
                    product.fullName.includes(ingName) || 
                    product.simpleName === simpleIngName ||
                    ingName.includes(product.simpleName)
                );
            };
    
            const processedRecipes = recipeResult.recipes.map(recipe => {
                const requiredIngredients = Array.isArray(recipe.required_ingredients) 
                    ? recipe.required_ingredients 
                    : [];
    
                const categorizedIngredients = {
                    available: requiredIngredients.filter(ing => {
                        const ingredientName = typeof ing === 'string' 
                            ? ing
                            : ing?.name || '';
                        return isIngredientInList(ingredientName, cartProductNames);
                    }),
                    missing_available: requiredIngredients.filter(ing => {
                        const ingredientName = typeof ing === 'string' 
                            ? ing
                            : ing?.name || '';
                        return !isIngredientInList(ingredientName, cartProductNames) && 
                               isIngredientInList(ingredientName, catalogProductNames);
                    }),
                    missing_unavailable: requiredIngredients.filter(ing => {
                        const ingredientName = typeof ing === 'string' 
                            ? ing
                            : ing?.name || '';
                        return !isIngredientInList(ingredientName, cartProductNames) && 
                               !isIngredientInList(ingredientName, catalogProductNames);
                    })
                };
    
                return {
                    ...recipe,
                    ingredients: categorizedIngredients
                };
            });
    
            setRecipe(processedRecipes);
            toast.success("Recettes générées avec succès !");
    
        } catch (error) {
            console.error("Erreur lors de la génération des recettes:", error);
            toast.error("Erreur lors de la génération des recettes.");
        } finally {
            setIsLoadingRecipe(false);
        }
    };

    const findAndAddProductToCart = async (ingredientName) => {
        try {
            // Récupérer le catalogue de produits
            const catalogResponse = await fetch("/api/products", {
                headers: {
                    Authorization: `Bearer ${getCookie("access_token")}`,
                }
            });
    
            if (!catalogResponse.ok) {
                toast.error("Erreur lors de la récupération des produits");
                return;
            }
    
            const catalogProducts = await catalogResponse.json();
    
            // Trouver le produit correspondant à l'ingrédient
            const matchingProduct = catalogProducts.find(product => 
                product.name.toLowerCase().includes(ingredientName.toLowerCase())
            );
    
            if (!matchingProduct) {
                toast.error("Produit non trouvé dans le catalogue");
                return;
            }
    
            // Ajouter le produit au panier en utilisant son ID
            await addToCart(matchingProduct.id);
            await fetchCart(user.id);
    
        } catch (error) {
            console.error("Erreur lors de l'ajout au panier :", error);
            toast.error("Une erreur est survenue lors de l'ajout au panier");
        }
    };


    return (
        <>
            <Header />
            <div className="container mx-auto p-6 pt-24">
                <h1 className="text-3xl font-bold mb-6 text-center">Mon Panier</h1>

                {loading ? (
                    <p className="text-center text-lg text-gray-500">Chargement du panier...</p>
                ) : cart.length === 0 ? (
                    <p className="text-center text-lg text-gray-500">Votre panier est vide.</p>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full bg-white">
                            <thead className="bg-teal-500 text-white uppercase text-sm leading-normal">
                                <tr>
                                    <th className="text-left px-6 py-3">Produit</th>
                                    <th className="text-center px-6 py-3">Quantité</th>
                                    <th className="text-right px-6 py-3">Prix</th>
                                    <th className="text-right px-6 py-3">Total</th>
                                    <th className="text-center px-6 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {cart.products.map((item) => {
                                    const product = products.find(prod => prod.id === item.product_id);
                                    return product ? (
                                        <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="px-6 py-3 text-left">{product.name}</td>
                                            <td className="px-6 py-3 text-center flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => updateQuantity(product.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="px-2 py-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(product.id, item.quantity + 1)}
                                                    className="px-2 py-1 text-white bg-teal-500 rounded hover:bg-teal-600 transition"
                                                >
                                                    +
                                                </button>
                                            </td>
                                            <td className="px-6 py-3 text-right">{(product.total_price || 0).toFixed(2)} €</td>
                                            <td className="px-6 py-3 text-right">{(parseFloat((product.total_price || 0)) * item.quantity).toFixed(2)} €</td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => removeFromCart(product.id)}
                                                    className="px-4 py-2 text-sm font-bold text-white bg-red-500 rounded hover:bg-red-600 transition"
                                                >
                                                    Supprimer
                                                </button>
                                            </td>
                                        </tr>
                                    ) : null;
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {products.length > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                        <p className="text-xl font-bold">Total : {cart.amount.toFixed(2)} €</p>
                        <CheckoutButton cart={cart} produits={products} currentUser={user}/>
                    </div>
                )}
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={handleGenerateRecipe}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
                            disabled={isLoadingRecipe}
                        >
                            {isLoadingRecipe ? "Génération en cours..." : "Proposer des recettes 🍳"}
                        </button>
                    </div>
                    {recipe && (
                        <div className="mt-6 p-4 border border-gray-300 rounded-lg bg-gray-100">
                            <h2 className="text-xl font-bold mb-4">🍽️ Recettes suggérées :</h2>
                            
                            {recipe.map((recette, index) => (
                                <div key={index} className="mb-6 p-4 bg-white rounded-lg">
                                    <h3 className="text-lg font-bold mb-2">{recette.name}</h3>
                                    
                                    <div className="mb-4">
                                        <h4 className="font-semibold">⏱️ Temps de préparation :</h4>
                                        <p>{recette.preparation_time}</p>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold">📝 Difficulté :</h4>
                                        <p>{recette.difficulty}</p>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold">📝 Ingrédients nécessaires :</h4>
                                        <ul className="list-disc ml-6">
                                            {recette.required_ingredients.map((ingredient, idx) => (
                                                <li key={idx}>{ingredient}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold">🛒 Ingrédients disponibles dans votre panier :</h4>
                                        <ul className="list-disc ml-6 text-green-600">
                                            {recette.ingredients.available.length > 0 ? (
                                                recette.ingredients.available.map((ingredient, idx) => (
                                                    <li key={idx}>{ingredient}</li>
                                                ))
                                            ) : (
                                                <li>Aucun ingrédient du panier utilisé</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold">🚚 Ingrédients manquants mais disponibles :</h4>
                                        <ul className="list-disc ml-6 text-orange-600">
                                            {recette.ingredients.missing_available.length > 0 ? (
                                                recette.ingredients.missing_available.map((ingredient, idx) => (
                                                    <li key={idx} className="flex items-center justify-between">
                                                        <span>{ingredient}</span>
                                                        <button 
                                                            onClick={() => findAndAddProductToCart(ingredient)}
                                                            className="ml-2 px-2 py-1 bg-teal-500 text-white rounded-md hover:bg-teal-600"
                                                        >
                                                            Ajouter au panier
                                                        </button>
                                                    </li>
                                                ))
                                            ) : (
                                                <li>Aucun ingrédient supplémentaire nécessaire</li>
                                            )}
                                        </ul>

                                        {/* Bouton pour tout ajouter */}
                                        {recette.ingredients.missing_available.length > 0 && (
                                            <button 
                                                onClick={() => addAllMissingToCart(recette.ingredients.missing_available)}
                                                className="mt-4 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                                            >
                                                Ajouter tous les ingrédients manquants au panier
                                            </button>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold">❌ Ingrédients non disponibles :</h4>
                                        <ul className="list-disc ml-6 text-red-600">
                                            {recette.ingredients.missing_unavailable.length > 0 ? (
                                                recette.ingredients.missing_unavailable.map((ingredient, idx) => (
                                                    <li key={idx}>{ingredient}</li>
                                                ))
                                            ) : (
                                                <li>Tous les ingrédients sont disponibles</li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="mb-4">
                                        <h4 className="font-semibold">📋 Instructions :</h4>
                                        <ol className="list-decimal ml-6">
                                            {recette.instructions.map((step, stepIndex) => (
                                                <li key={stepIndex}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
            </div>
        </>
    );
}
