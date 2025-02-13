import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prismaClient";
import { getAuthenticatedUser } from "@/utils/auth";

export async function GET(req: NextRequest) {
    try {
        // Authentifier l'utilisateur
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Extraire userId et orderId depuis l'URL
        const pathSegments = req.nextUrl.pathname.split('/');
        const userId = pathSegments[pathSegments.length - 4]; // `/user/[userId]/orders/[orderId]`
        const orderId = pathSegments[pathSegments.length - 1];

        if (!userId || !orderId) {
            return NextResponse.json({ error: "ID utilisateur ou commande manquant" }, { status: 400 });
        }

        // Récupérer la commande spécifique
        const order = await prisma.carts.findUnique({
            where: {
                id: orderId,
                user_id: userId,
            },
            select: {
                id: true,
                created_at: true,
                status: true,
                amount: true,
                products: true,
                paid_at: true,
                appointments: {
                    select: {
                        date: true,
                        time: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        return NextResponse.json({ order });
    } catch (error) {
        console.error("❌ Erreur API /user/[userId]/orders/[orderId] :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
