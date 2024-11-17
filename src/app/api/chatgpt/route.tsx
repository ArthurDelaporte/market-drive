import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Configuration de l'API OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Exemple d'ingrédients statiques
const staticBasketItems = ["tomates", "poulet", "fromage", "oignons"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const basketItems = body.basketItems || staticBasketItems;

    // Requête à OpenAI pour utiliser gpt-3.5-turbo
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Forcer l'utilisation de ChatGPT 3.5
      messages: [
        {
          role: "system",
          content:
            "Tu es un assistant culinaire. Propose une recette avec les ingrédients fournis et indique ceux qui manquent si nécessaire.",
        },
        {
          role: "user",
          content: `Voici les ingrédients disponibles : ${basketItems.join(
            ", "
          )}. Propose une recette avec ces ingrédients et précise les ingrédients manquants.`,
        },
      ],
    });

    const result = response.choices[0].message?.content;
    return NextResponse.json({ recipe: result });
  } catch (error) {
    console.error("Erreur avec OpenAI :", error);
    return NextResponse.json(
      { error: "Erreur dans la génération de la recette avec OpenAI" },
      { status: 500 }
    );
  }
}
