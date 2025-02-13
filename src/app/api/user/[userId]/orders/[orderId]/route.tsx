import {NextRequest, NextResponse} from "next/server";
import prisma from "@/prismaClient";
import { getAuthenticatedUser } from "@/utils/auth";

export async function GET(req: NextRequest, context: { params: { userId: string, orderId: string } }) {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const user = await getAuthenticatedUser(req);

        if (!user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { userId, orderId } = await context.params;

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