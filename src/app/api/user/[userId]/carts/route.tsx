import { NextResponse, NextRequest } from "next/server";
import prisma from "@/prismaClient";

/**
 * ✅ 1️⃣ Récupérer le panier d'un utilisateur
 */
export async function GET(req: NextRequest, context: { params: { userId: string } }) {
    try {
        const { userId } = context.params;

        if (!userId) {
            return NextResponse.json({ error: "ID utilisateur manquant" }, { status: 400 });
        }

        // Vérifier si un panier "waiting" existe pour cet utilisateur
        const cart = await prisma.carts.findFirst({
            where: { user_id: userId, status: "waiting" },
            select: { id: true, created_at: true, amount: true, products: true },
        });

        if (!cart) {
            return NextResponse.json({ error: "Aucun panier trouvé" }, { status: 404 });
        }

        return NextResponse.json(cart);
    } catch (error) {
        console.error("❌ Erreur API /user/[userId]/carts :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * ✅ 2️⃣ Ajouter un produit au panier ou en créer un nouveau
 */
export async function POST(req: NextRequest, context: { params: { userId: string } }) {
    try {
        const { userId } = context.params;
        const { product_id, quantity } = await req.json();

        if (!userId || !product_id || !quantity) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        // Vérifier si un panier existe
        let cart = await prisma.carts.findFirst({
            where: { user_id: userId, status: "waiting" },
        });

        // Créer un panier si aucun n'existe
        if (!cart) {
            cart = await prisma.carts.create({
                data: {
                    user_id: userId,
                    products: [],
                    status: "waiting",
                    amount: 0,
                },
            });
        }

        // Vérifier si le produit existe
        const product = await prisma.products.findUnique({
            where: { id: product_id },
        });

        if (!product) {
            return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
        }

        // Mise à jour du panier
        const cartProducts = cart.products as any[];
        const existingProduct = cartProducts.find(p => p.product_id === product_id);

        if (existingProduct) {
            existingProduct.quantity += quantity;
        } else {
            cartProducts.push({ product_id, quantity });
        }

        // Recalcul du total
        const totalAmount = cartProducts.reduce((sum, item) => {
            const productPrice = parseFloat(((product.price || 1) * (product.quantity || 0)).toFixed(2))
            ;
            return sum + (productPrice * item.quantity);
        }, 0);

        // Mise à jour du panier en base
        const updatedCart = await prisma.carts.update({
            where: { id: cart.id },
            data: { products: cartProducts, amount: totalAmount },
        });

        return NextResponse.json(updatedCart, { status: 200 });
    } catch (error) {
        console.error("❌ Erreur API /user/[userId]/carts :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * ✅ 3️⃣ Mettre à jour la quantité d'un produit
 */
export async function PATCH(req: NextRequest, context: { params: { userId: string } }) {
    try {
        const { userId } = context.params;
        const { product_id, quantity } = await req.json();

        if (!userId || !product_id || quantity === undefined) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        const cart = await prisma.carts.findFirst({
            where: { user_id: userId, status: "waiting" },
        });

        if (!cart) {
            return NextResponse.json({ error: "Aucun panier trouvé" }, { status: 404 });
        }

        const cartProducts = cart.products as any[];
        const productIndex = cartProducts.findIndex(p => p.product_id === product_id);

        if (productIndex === -1) {
            return NextResponse.json({ error: "Produit introuvable dans le panier" }, { status: 404 });
        }

        cartProducts[productIndex].quantity = quantity;

        // Recalcul du total
        const totalAmount = cartProducts.reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);

        const updatedCart = await prisma.carts.update({
            where: { id: cart.id },
            data: { products: cartProducts, amount: totalAmount },
        });

        return NextResponse.json(updatedCart, { status: 200 });
    } catch (error) {
        console.error("❌ Erreur API /user/[userId]/carts :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

/**
 * ✅ 4️⃣ Supprimer un produit du panier
 */
export async function DELETE(req: NextRequest, context: { params: { userId: string } }) {
    try {
        const { userId } = context.params;
        const { product_id } = await req.json();

        if (!userId || !product_id) {
            return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
        }

        const cart = await prisma.carts.findFirst({
            where: { user_id: userId, status: "waiting" },
        });

        if (!cart) {
            return NextResponse.json({ error: "Aucun panier trouvé" }, { status: 404 });
        }

        let cartProducts = cart.products as any[];
        cartProducts = cartProducts.filter(p => p.product_id !== product_id);

        // Recalcul du total
        const totalAmount = cartProducts.reduce((sum, item) => {
            return sum + item.quantity;
        }, 0);

        const updatedCart = await prisma.carts.update({
            where: { id: cart.id },
            data: { products: cartProducts, amount: totalAmount },
        });

        return NextResponse.json(updatedCart, { status: 200 });
    } catch (error) {
        console.error("❌ Erreur API /user/[userId]/carts :", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
