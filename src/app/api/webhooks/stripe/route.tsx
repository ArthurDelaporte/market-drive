import { NextResponse, NextRequest } from "next/server";
import Stripe from "stripe";
import prisma from "@/prismaClient";
import { headers } from "next/headers";
import { sendEmail } from "@/utils/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: "2025-01-27.acacia",
});

interface Product {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
}

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

    switch (event.type) {
        case "checkout.session.completed":
            await handleCheckoutSessionCompleted(req as NextRequest, event.data.object as Stripe.Checkout.Session);
            break;

        default:
            console.warn(`ℹ️ Événement non géré : ${event.type}`);
    }

    return NextResponse.json({ received: true });
}

/**
 * ✅ Gère le paiement validé
 */
async function handleCheckoutSessionCompleted(req: NextRequest, session: Stripe.Checkout.Session) {
    const cartId = session.metadata?.cartId;
    const userId = session.metadata?.userId;

    if (!cartId || !userId) {
        console.error("❌ Données de session invalides : cartId ou userId manquant.");
        return;
    }

    try {
        // 🔍 Récupérer le panier
        const cart = await prisma.carts.findUnique({
            where: { id: cartId },
            select: { products: true, amount: true, user_id: true },
        });

        if (!cart) {
            console.error("❌ Panier introuvable :", cartId);
            return;
        }

        // 🔍 Récupérer les infos utilisateur
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: { email: true, firstname: true },
        });

        if (!user) {
            console.error("❌ Utilisateur introuvable :", userId);
            return;
        }

        // ✅ Convertir les produits du panier de `JsonValue` à un tableau `Product[]`
        const parsedProducts: Product[] = (() => {
            if (Array.isArray(cart.products)) return cart.products as unknown as Product[];
            if (typeof cart.products === "string") return JSON.parse(cart.products) as Product[];
            return [];
        })();

        // ✅ Mettre à jour le panier comme payé
        await prisma.carts.update({
            where: { id: cartId },
            data: { status: "paid", payment_id: session.id, paid_at: new Date() },
        });

        // ✅ Envoyer un e-mail de confirmation au client
        await sendPaymentConfirmationEmail(req as NextRequest, user.email ?? "", user.firstname, {
            products: parsedProducts,
            amount: cart.amount ?? 0,
            user_id: cart.user_id
        },);

    } catch (error) {
        console.error("❌ Erreur lors du traitement du paiement :", error);
    }
}

/**
 * ✅ Envoie un email de confirmation de paiement
 */
async function sendPaymentConfirmationEmail( req: NextRequest, email: string, firstname: string | null, cart: { products: Product[]; amount: number; user_id: string | null }) {
    const subject = "Confirmation de votre paiement";

    const cartProducts = (() => {
        if (Array.isArray(cart.products)) return cart.products;
        return [];
    })();

    const productIds = [...new Set(cartProducts.map((p: { product_id: string }) => p.product_id))] as string[];

    if (productIds.length === 0) {
        console.error("❌ Aucun produit dans le panier.");
        return;
    }

    // ✅ Récupérer les détails des produits
    const products = await prisma.products.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, price: true, quantity: true },
    });

    // ✅ Calculer les prix des produits
    const productsWithTotalPrice = products.map((product) => ({
        ...product,
        total_price: (product.price ?? 0) * (product.quantity ?? 1),
    }));

    // ✅ Construire la liste des produits en HTML
    const rows = cartProducts.map((p: { product_id: string; quantity: number }) => {
        const product = productsWithTotalPrice.find(prod => prod.id === p.product_id);
        return product
            ? `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${product.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.total_price.toFixed(2)}€</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${(product.total_price * p.quantity).toFixed(2)}€</td>
            </tr>`
            : `<tr>
                <td style="border: 1px solid #ddd; padding: 8px;">Produit inconnu</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">0.00€</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">0.00€</td>
            </tr>`;
    }).join("");

    const html = `
        <center>
            <img src="${process.env.NEXT_PUBLIC_API_URL}/img/logo/Logo_Gigadrive_color.png" alt="Logo GigaDrive"
             style="width:80px; height: 80px;">
        </center>
        <h2>Bonjour ${firstname || "Client"},</h2>
        <p>Votre paiement a bien été reçu ! Merci pour votre commande.</p>
        <h3>🛒 Récapitulatif de votre commande :</h3>
        <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
            <thead>
                <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Produit</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Prix</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantité</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <p>💰<strong>Total payé :</strong> ${cart.amount.toFixed(2)} €</p>
        <p>Merci pour votre confiance et à bientôt !</p>
    `;

    // 🔗 Envoyer l'e-mail via l'API d'envoi d'e-mail
    await sendEmail(email, subject, html);
}