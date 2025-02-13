import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prismaClient";
import {isAuthenticatedUserAdmin} from "@/utils/auth";

export async function GET(req: NextRequest, context: { params: { orderId: string } }) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { orderId } = await context.params;

        if (!orderId) {
            return NextResponse.json({ error: "ID commande manquant" }, { status: 400 });
        }

        // Récupérer la commande spécifique
        const order = await prisma.carts.findUnique({
            where: {
                id: orderId,
            },
            select: {
                id: true,
                created_at: true,
                status: true,
                amount: true,
                products: true,
                paid_at: true,
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                    }
                },
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
        console.error("❌ Erreur API /orders/[orderId] :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}