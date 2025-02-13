import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import prisma from "@/prismaClient";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia",
});

export async function POST(req: NextRequest) {
    const body = await req.text(); // Lire le corps brut
    const signature = (await headers()).get("stripe-signature") as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
        console.error("⚠️ Erreur de signature du webhook:", err);
        return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
    }

    // Gérer différents types d'événements Stripe
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object as Stripe.Checkout.Session;

            const cartId = session.metadata?.cartId;
            const userId = session.metadata?.userId;

            if (!cartId || !userId) {
                return NextResponse.json({ error: "Données de session invalides" }, { status: 400 });
            }

            // Vérifie que la session a bien été payée
            if (session.payment_status === "paid" && session.id) {
                try {
                    // Récupérer le panier correspondant avec le sessionId
                    await prisma.carts.update({
                        where: { id: cartId },
                        data: { status: "paid", payment_id: session.id, paid_at: new Date() },
                    });
                } catch (error) {
                    console.error("❌ Erreur lors de la mise à jour du panier:", error);
                    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
                }
            }
            break;

        default:
            console.warn(`ℹ️ Événement non géré : ${event.type}`);
    }

    return NextResponse.json({ received: true });
}