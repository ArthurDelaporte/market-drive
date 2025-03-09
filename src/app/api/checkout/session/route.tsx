import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import prisma from "@/prismaClient";
import { getAuthenticatedUser } from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia",
});

export async function POST(req: NextRequest) {
    try {
        const authenticatedUser = await getAuthenticatedUser(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { cartId, userId } = await req.json();
        if (!cartId) {
            return NextResponse.json({ error: "ID du panier requis." }, { status: 400 });
        }

        // 🔍 **Récupérer le panier depuis la base de données**
        const cart = await prisma.carts.findUnique({
            where: { id: cartId, user_id: userId },
            select: { products: true }, // Les produits sont stockés sous forme de JSON
        });

        if (!cart || !cart.products) {
            return NextResponse.json({ error: "Le panier est vide ou introuvable." }, { status: 400 });
        }

        // 🛒 **Parser les produits stockés en JSON**
        let cartProducts;
        try {
            cartProducts = typeof cart.products === "string"
                ? JSON.parse(cart.products)
                : cart.products;

            if (!Array.isArray(cartProducts)) {
                throw new Error("Format de produits invalide");
            }
        } catch (parseError) {
            return NextResponse.json({ error: "Erreur de format des produits." }, { status: 500 });
        }

        if (cartProducts.length === 0) {
            return NextResponse.json({ error: "Le panier est vide." }, { status: 400 });
        }

        // 🔹 **Récupérer les détails des produits en base**
        const productIds = cartProducts.map((p) => p.product_id);
        const products = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, price: true, quantity: true },
        });

        // **Créer les éléments de la commande Stripe**
        const lineItems = cartProducts.map((cartItem) => {
            const product = products.find((p) => p.id === cartItem.product_id);
            if (!product) return null;

            return {
                price_data: {
                    currency: "eur",
                    product_data: { name: (product.name || "") },
                    unit_amount: Math.round((product.price || 0) * (product?.quantity || 1) * 100), // Convertir en centimes
                },
                quantity: cartItem.quantity,
            };
        }).filter(Boolean); // Filtrer les produits null

        if (lineItems.length === 0) {
            return NextResponse.json({ error: "Aucun produit valide dans le panier." }, { status: 400 });
        }

        // Supprime les valeurs nulles
        const validLineItems = lineItems.filter((item) => item !== null);

        if (validLineItems.length === 0) {
            return NextResponse.json({ error: "Aucun produit valide dans le panier." }, { status: 400 });
        }

        // ✅ **Créer la session Stripe**
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: validLineItems,
            metadata: { userId: userId, cartId },
            success_url: `${process.env.NEXT_PUBLIC_API_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&userId=${userId}&cartId=${cartId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_API_URL}/payment/cancel`,
        });

        // **Mettre à jour l'ID de paiement du panier**
        await prisma.carts.update({
            where: { id: cartId },
            data: { payment_id: session.id },
        });

        return NextResponse.json({ sessionId: session.id });
    } catch (stripeError) {
        console.error("Erreur Stripe:", stripeError);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}