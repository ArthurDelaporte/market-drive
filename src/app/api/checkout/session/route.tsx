import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import prisma from "@/prismaClient";
import {getAuthenticatedUser} from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2024-06-20",
});

export async function POST(req: NextRequest) {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { items, userId, cartId } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Aucun produit sélectionné." }, { status: 400 });
        }

        const lineItems = items.map((item: { id: string, name: string, total_price: number, quantity: number }) => ({
            price_data: {
                currency: "eur",
                product_data: {
                    name: item.name,
                },
                unit_amount: Math.round(item.total_price * 100), // Convertir en centimes
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: lineItems,
            metadata: { userId, cartId },
            success_url: `${process.env.NEXT_PUBLIC_API_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&cartId=${cartId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/payment/cancel`,
        });

        await prisma.carts.update({
            where: { id: cartId },
            data: { payment_id: session.id },
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (error) {
        console.error("Erreur Stripe:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}