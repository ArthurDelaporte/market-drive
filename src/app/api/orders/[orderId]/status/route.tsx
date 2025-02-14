import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prismaClient";
import { isAuthenticatedUserAdmin } from "@/utils/auth";
import { sendStatusUpdateEmail } from "@/utils/email";

const STATUS_FLOW: Record<string, string | string[]> = {
    validated: "preparation",
    preparation: "prepared",
    prepared: ["delivery", "recovery"], // Dépend de is_retrait
    delivery: "delivered",
    recovery: "recovered",
};

/**
 * ✅ Met à jour le statut d'une commande (admin uniquement)
 */
export async function PATCH(req: NextRequest) {
    try {
        // 🛡 Vérifier si l'utilisateur est admin
        const authenticatedUser = await isAuthenticatedUserAdmin(req);
        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const authHeader = req.headers.get("authorization");
        const access_token = authHeader?.split(" ")[1] || "";

        const pathSegments = req.nextUrl.pathname.split('/');
        const orderId = pathSegments[pathSegments.length - 2];

        const { newStatus } = await req.json();

        if (!orderId || !newStatus) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        // 🔍 Récupérer la commande avec son statut actuel et `is_retrait`
        const cart = await prisma.carts.findUnique({
            where: { id: orderId },
            select: {
                status: true,
                users: {
                    select: { email: true, firstname: true },
                },
                appointments: {
                    select: { is_retrait: true },
                },
            },
        });

        if (!cart) {
            return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
        }

        const { status, users, appointments } = cart;

        // 🚨 Vérifier si le statut est valide
        if (!status || typeof status !== "string" || !(status in STATUS_FLOW)) {
            return NextResponse.json({ error: "Statut actuel invalide" }, { status: 400 });
        }

        // ✅ Vérification sécurisée de `is_retrait`
        const isRetrait = appointments?.[0]?.is_retrait ?? true;

        // 🔄 Vérifier la transition de statut
        const allowedNextStatus = STATUS_FLOW[status];

        if (status === "prepared") {
            // On détermine le statut final en fonction de is_retrait
            if (newStatus === "delivery" && isRetrait) {
                return NextResponse.json({ error: "Transition de statut invalide : la commande est en retrait." }, { status: 400 });
            }
            if (newStatus === "recovery" && !isRetrait) {
                return NextResponse.json({ error: "Transition de statut invalide : la commande est en livraison." }, { status: 400 });
            }
        } else if (allowedNextStatus !== newStatus) {
            return NextResponse.json({ error: "Transition de statut invalide" }, { status: 400 });
        }

        // 📝 Mettre à jour la commande et enregistrer l'historique
        const updatedCart = await prisma.carts.update({
            where: { id: orderId },
            data: {
                status: newStatus,
            },
        });

        if (users?.email) {
            await sendStatusUpdateEmail(access_token, users.email, users.firstname, newStatus);
        }

        return NextResponse.json({ message: "Statut mis à jour", updatedCart }, { status: 200 });

    } catch (error) {
        console.error("❌ Erreur API /orders/[orderId]/status :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}