import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import prisma from "@/prismaClient";
import { jwtDecode } from "jwt-decode";

export async function POST(req: NextRequest) {
    try {
        // Authentification (votre code existant)
        const accessToken = req.cookies.get("access_token")?.value;
        if (!accessToken) {
            return NextResponse.json({ error: "Utilisateur non authentifié" }, { status: 401 });
        }

        const decoded = jwtDecode<{ sub: string }>(accessToken);
        const userId = decoded?.sub;

        if (!userId) {
            return NextResponse.json({ error: "ID utilisateur introuvable" }, { status: 400 });
        }

        // Récupérer l'image
        const formData = await req.formData();
        const image = formData.get('image') as File;

        if (!image) {
            return NextResponse.json({ error: "Aucune image reçue" }, { status: 400 });
        }

        // Convertir l'image en base64
        const arrayBuffer = await image.arrayBuffer();
        const base64Image = Buffer.from(arrayBuffer).toString('base64');

        // Appel à Claude Vision
        const response = await anthropic.messages.create({
            model: "claude-3-opus-20240229",
            max_tokens: 1024,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "image",
                            source: {
                                type: "base64",
                                media_type: image.type,
                                data: base64Image
                            }
                        },
                        {
                            type: "text",
                            text: `Analyse détaillée de l'image. 
                            Identifie précisément :
                            1. Le type de plat/aliment 
                            2. Tous les ingrédients visibles
                            3. Suggestions de noms de produits correspondants dans un supermarché
        
                            Format JSON strict :
                            {
                                "dish_type": "hamburger/salade/hot-dog",
                                "ingredients": ["ingredient1", "ingredient2"],
                                "potential_product_names": ["Nom produit 1", "Nom produit 2"]
                            }`
                        }
                    ]
                }
            ]
        });
        
        // Extraction du contenu JSON
        const analysisText = response.content[0].text;
        let analysis;
        try {
            // Parsez le texte JSON
            analysis = JSON.parse(analysisText);
        } catch (_) {
            console.error("Erreur de parsing JSON:", analysisText);
            return NextResponse.json({ 
                error: "Impossible de traiter l'analyse", 
                rawResponse: analysisText 
            }, { status: 500 });
        }

        // Vérifiez que l'analyse contient les champs attendus
        if (!analysis || !analysis.dish_type || !analysis.ingredients) {
            return NextResponse.json({ 
                error: "Format de réponse invalide", 
                rawResponse: analysis 
            }, { status: 500 });
        }

        const availableProducts = await prisma.products.findMany({
            where: {
                OR: [
                    // Recherche par type de plat
                    { name: { contains: analysis.dish_type, mode: 'insensitive' } },
                    
                    // Recherche par ingrédients
                    ...analysis.ingredients.map(ingredient => ({
                        name: { 
                            contains: ingredient, 
                            mode: 'insensitive' 
                        }
                    })),
                    
                    // Recherche par noms de produits potentiels
                    ...(analysis.potential_product_names || []).map(productName => ({
                        name: { contains: productName, mode: 'insensitive' }
                    }))
                ]
            },
            select: {
                id: true,
                name: true,
                price: true,
                imgurl: true
            }
        });

        return NextResponse.json({
            analysisDetails: analysis,
            products: availableProducts,
            success: true
        });

    } catch (error) {
        console.error("Erreur lors de l'analyse de l'image:", error);
        return NextResponse.json(
            { error: "Erreur lors de l'analyse de l'image" }, 
            { status: 500 }
        );
    }
}