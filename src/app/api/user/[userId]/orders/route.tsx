import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prismaClient";
import { getAuthenticatedUser } from "@/utils/auth";

export async function GET(req: NextRequest) {
    try {
        // Authentifier l'utilisateur
        const authenticatedUser = await getAuthenticatedUser(req);
        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Extraire userId depuis l'URL
        const pathSegments = req.nextUrl.pathname.split('/');
        const userId = pathSegments[pathSegments.length - 2]; // `/user/[userId]/orders`

        if (!userId) {
            return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
        }

        // Récupérer les commandes de l'utilisateur (hors "waiting")
        const orders = await prisma.carts.findMany({
            where: {
                user_id: userId,
                status: { not: "waiting" },
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
                        is_retrait: true,
                        address: true
                    },
                },
            },
            orderBy: { paid_at: "desc" },
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("❌ Erreur API /user/[userId]/orders :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
