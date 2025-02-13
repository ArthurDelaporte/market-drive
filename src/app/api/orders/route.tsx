import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prismaClient";
import { isAuthenticatedUserAdmin} from "@/utils/auth";

export async function GET(req: NextRequest) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Récupérer les commandes (hors "waiting")
        const orders = await prisma.carts.findMany({
            where: {
                status: { not: "waiting" },
            },
            select: {
                id: true,
                created_at: true,
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstname: true,
                        lastname: true,
                    }
                },
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
            orderBy: { paid_at: "desc" },
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("❌ Erreur API /orders :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}