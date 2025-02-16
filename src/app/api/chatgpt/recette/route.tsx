import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/prismaClient";
import { jwtDecode } from "jwt-decode";

interface CartProducts {
    products: {
        product_id: string;
    }[];
}

interface CatalogProduct {
    name: string | null;
}

interface Recipe {
    name: string;
    required_ingredients: string[];
    preparation_time: string;
    difficulty: string;
    instructions: string[];
}

interface CategorizedIngredients {
    available: string[];
    missing_available: string[];
    missing_unavailable: string[];
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const accessToken = req.cookies.get("access_token")?.value;

        if (!accessToken) {
            return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
        }

        const decoded = jwtDecode<{ sub: string }>(accessToken);
        const userId = decoded?.sub;

        if (!userId) {
            return NextResponse.json({ error: "ID utilisateur introuvable" }, { status: 400 });
        }

        // Recherche du panier
        const cart = await prisma.carts.findFirst({
            where: { user_id: userId, status: "waiting" },
            select: { products: true },
        }) as CartProducts | null;

        if (!cart?.products || cart.products.length === 0) {
            return NextResponse.json({ error: "Votre panier est vide." }, { status: 404 });
        }

        // Récupération des produits
        const productIds = cart.products.map(p => p.product_id);
        const productsInCart = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: { name: true },
        });

        // Requête GPT avec format JSON structuré
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: `Tu es un assistant culinaire qui génère des recettes en JSON structuré. Utilise les ingrédients fournis quand c'est possible.`
                },
                {
                    role: "user",
                    content: `Génère 2 recettes en utilisant si possible ces ingrédients : ${productsInCart.map(p => p.name).join(", ")}.
                    Pour chaque recette, liste TOUS les ingrédients nécessaires, qu'ils soient disponibles ou non.
                    Format JSON attendu:
                    {
                        "recipes": [
                            {
                                "name": "Nom de la recette",
                                "preparation_time": "temps en minutes",
                                "difficulty": "niveau de difficulté",
                                "required_ingredients": [
                                    "ingrédient 1 avec quantité",
                                    "ingrédient 2 avec quantité"
                                ],
                                "instructions": [
                                    "étape 1",
                                    "étape 2"
                                ]
                            }
                        ]
                    }`
                }
            ],
            response_format: { type: "json_object" }
        });
        
        const messageContent = response.choices[0].message.content;
        if (!messageContent) {
            return NextResponse.json({ error: "Erreur de génération de recette: réponse vide" }, { status: 500 });
        }
        
        const result = JSON.parse(messageContent);

        // Récupérer tous les produits du catalogue
        const catalogProducts = await prisma.products.findMany({
            select: { name: true }
        }) as CatalogProduct[];

        const catalogProductNames = new Set(catalogProducts.map((p: CatalogProduct) => p.name?.toLowerCase() ?? ''));
        const cartProductNames = new Set(productsInCart.map((p: CatalogProduct) => p.name?.toLowerCase() ?? ''));

        // Traiter chaque recette pour catégoriser les ingrédients
        const processedRecipes = result.recipes.map((recipe: Recipe) => {
            const categorizedIngredients: CategorizedIngredients = {
                available: [],
                missing_available: [],
                missing_unavailable: []
            };
        
            recipe.required_ingredients.forEach((ingredient: string) => {
                const ingredientName = ingredient.toLowerCase();
                
                if (cartProductNames.has(ingredientName)) {
                    categorizedIngredients.available.push(ingredient);
                } else if (catalogProductNames.has(ingredientName)) {
                    categorizedIngredients.missing_available.push(ingredient);
                } else {
                    categorizedIngredients.missing_unavailable.push(ingredient);
                }
            });
        
            return {
                ...recipe,
                ingredients: categorizedIngredients
            };
        });

        return NextResponse.json({
            recipes: processedRecipes
        });

    } catch (error) {
        console.error("❌ Erreur avec OpenAI :", error);
        return NextResponse.json({ error: "Erreur lors de la génération de la recette avec OpenAI" }, { status: 500 });
    }
}