import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/prismaClient";
import { jwtDecode } from "jwt-decode";

// Configuration de l'API OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        // 🔑 Récupération manuelle du cookie côté serveur
        const accessToken = req.cookies.get("access_token")?.value;

        if (!accessToken) {
            return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
        }

        // 🔍 Décodage du token JWT pour récupérer l'ID utilisateur
        const decoded = jwtDecode<{ sub: string }>(accessToken);
        const userId = decoded?.sub;

        if (!userId) {
            return NextResponse.json({ error: "ID utilisateur introuvable" }, { status: 400 });
        }

        // 🔹 Recherche du panier de l'utilisateur
        const cart = await prisma.carts.findFirst({
            where: { user_id: userId, status: "waiting" },
            select: { products: true },
        });

        if (!cart || !cart.products.length) {
            return NextResponse.json({ error: "Votre panier est vide." }, { status: 404 });
        }

        // 🔹 Extraction des noms des produits dans le panier
        const productIds = cart.products.map(p => p.product_id);
        const productsInCart = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: { name: true },
        });

        // 🔹 Requête GPT pour obtenir des recettes
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "Tu es un assistant culinaire. Propose 2 recettes en utilisant au mieux les ingrédients fournis.",
                },
                {
                    role: "user",
                    content: `Ingrédients disponibles : ${productsInCart.map(p => p.name).join(", ")}.  
                    Propose 2 recettes. Pour chaque recette, indique :  
                    - 🛒 Ingrédients disponibles (dans le panier)  
                    - 🚚 Ingrédients manquants mais disponibles au magasin  
                    - 🚫 Ingrédients totalement indisponibles (non vendus par le magasin)  
                    - 🔍 Instructions étape par étape  

                    🍽️ **Format attendu :**  
                    1️⃣ **Nom de la recette 1**  
                    - 🛒 **Disponibles :** ...  
                    - 🚚 **Manquants disponibles :** ...  
                    - 🚫 **Manquants indisponibles :** ...  
                    - 🔍 **Instructions :** ...  

                    2️⃣ **Nom de la recette 2**  
                    - 🛒 **Disponibles :** ...  
                    - 🚚 **Manquants disponibles :** ...  
                    - 🚫 **Manquants indisponibles :** ...  
                    - 🔍 **Instructions :** ...  

                    Sois clair et concis.  
                    Bon appétit ! 🍽️`
                }
            ],
        });

        // 🔹 Récupération de la réponse GPT
        const result = response.choices[0].message?.content;

        // 🔍 Analyse des ingrédients manquants
        const missingIngredients = result?.match(/Ingrédients manquants.*?: (.+)/g) || [];
        const extractedItems = missingIngredients.flatMap(line => 
            line.replace(/Ingrédients manquants.*?: /, '').split(',').map(item => item.trim())
        );

        // 🔹 Vérification des ingrédients dans la base de données
        const knownProducts = await prisma.products.findMany({ select: { name: true } });
        const knownNames = new Set(knownProducts.map(p => p.name));

        const missingAvailable = extractedItems.filter(item => knownNames.has(item));
        const missingUnavailable = extractedItems.filter(item => !knownNames.has(item));

        // 🔹 Réponse finale
        return NextResponse.json({
            recipe: result,
            ingredients: {
                produitsDansPanier: productsInCart.map(p => p.name),
                manquantsDisponibles: missingAvailable,
                manquantsIndisponibles: missingUnavailable
            }
        });

    } catch (error) {
        console.error("❌ Erreur avec OpenAI :", error);
        return NextResponse.json({ error: "Erreur lors de la génération de la recette avec OpenAI" }, { status: 500 });
    }
}
