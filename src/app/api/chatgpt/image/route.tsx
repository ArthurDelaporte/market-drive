import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/prismaClient";
import formidable from "formidable-serverless";

// 🟢 Initialisation OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ⚡️ Désactiver l'analyse par défaut de Next.js (important pour gérer les fichiers)
export const config = {
  api: {
    bodyParser: false,
  },
};

// 📤 Fonction pour traiter l'image et interroger OpenAI
export async function POST(req) {
    try {
        // 🟢 Gestion du fichier image
        const form = new formidable.IncomingForm();
        const [fields, files] = await form.parse(req);
        const imageFile = files.file;

        if (!imageFile) {
            return NextResponse.json({ error: "Aucune image reçue" }, { status: 400 });
        }

        // 📤 Envoi de l'image à OpenAI pour reconnaissance
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview", // Nécessite GPT-4 avec vision
            messages: [
                {
                    role: "system",
                    content: "Tu es un assistant culinaire qui reconnaît les plats à partir d'images.",
                },
                {
                    role: "user",
                    content: "Analyse cette image et dis-moi quel est le plat, ainsi que les ingrédients nécessaires.",
                },
            ],
            images: [imageFile.path], // Envoi du fichier
        });

        const resultText = response.choices[0].message?.content;
        const parsedResult = parseAIResponse(resultText);

        // 🏪 Vérification des ingrédients en base de données
        const availableIngredients = await checkIngredientsInStore(parsedResult.ingredients);

        return NextResponse.json({
            dish: parsedResult.dish,
            ingredients: parsedResult.ingredients,
            availableIngredients,
        });
    } catch (error) {
        console.error("❌ Erreur OpenAI :", error);
        return NextResponse.json({ error: "Erreur lors de l'analyse de l'image" }, { status: 500 });
    }
}

// 🟢 Fonction pour extraire le plat et les ingrédients depuis la réponse OpenAI
function parseAIResponse(responseText) {
    const lines = responseText.split("\n");
    const dish = lines[0]?.replace("Plat :", "").trim() || "Inconnu";
    const ingredients = lines.slice(1).map(line => line.replace("•", "").trim()).filter(Boolean);
    return { dish, ingredients };
}

// 🏪 Vérifier la disponibilité des ingrédients en base de données (via Prisma)
async function checkIngredientsInStore(ingredients) {
    const availableProducts = await prisma.products.findMany({
        where: {
            name: {
                in: ingredients,
            },
        },
        select: { name: true },
    });

    return availableProducts.map(p => p.name);
}
