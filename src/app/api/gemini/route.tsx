import { NextRequest, NextResponse } from "next/server";

// Route pour interagir avec l'API Vertex AI
export async function POST(req: NextRequest) {
  try {
    // Lire le contenu de la requête (par exemple, une liste d'ingrédients)
    const body = await req.json();
    const basketItems = body.basketItems || ["tomates", "poulet", "fromage"]; // Valeurs par défaut si aucune donnée n'est envoyée

    // Préparer la requête pour Vertex AI
    const vertexAiUrl =
      "https://generativelanguage.googleapis.com/v1beta2/models/gemini-1.5-flash-002:generateText";

    // Logs pour le débogage
    console.log("Requête envoyée à Vertex AI :", {
      url: vertexAiUrl,
      body: {
        prompt: {
          text: `Voici les ingrédients disponibles : ${basketItems.join(
            ", "
          )}. Propose une recette et précise les ingrédients manquants pour compléter la recette.`,
        },
        temperature: 0.7, // Température pour ajuster la créativité de la réponse
      },
    });

    // Envoyer la requête à Vertex AI
    const response = await fetch(vertexAiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // Type de contenu JSON
        Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`, // Utiliser la clé API Google depuis .env.local
      },
      body: JSON.stringify({
        prompt: {
          text: `Voici les ingrédients disponibles : ${basketItems.join(
            ", "
          )}. Propose une recette et précise les ingrédients manquants pour compléter la recette.`,
        },
        temperature: 0.7, // Ajuste la créativité des réponses
      }),
    });

    // Si l'API retourne une erreur HTTP, afficher plus de détails
    if (!response.ok) {
      const errorDetails = await response.json(); // Récupérer les détails de l'erreur
      console.error("Détails de l'erreur avec Vertex AI :", errorDetails);
      throw new Error("Erreur avec l'API Vertex AI");
    }

    // Récupérer les données de la réponse JSON
    const data = await response.json();

    // Extraire la recette générée ou renvoyer un message par défaut
    const recipe = data.candidates?.[0]?.output || "Aucune recette générée.";

    // Retourner la réponse en JSON
    return NextResponse.json({ recipe });
  } catch (error) {
    // En cas d'erreur, logguer l'erreur pour le débogage
    console.error("Erreur avec l'API Gemini :", error);

    // Retourner une réponse JSON avec un message d'erreur et un statut HTTP 500
    return NextResponse.json(
      { error: "Une erreur est survenue avec Gemini." },
      { status: 500 }
    );
  }
}
