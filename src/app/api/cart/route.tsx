import { NextResponse } from "next/server";
import prisma from "@/prismaClient";
import { getUserFromToken } from "@/utils/auth";

// 📌 **Récupérer le panier**
export async function GET(req) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const cart = await prisma.carts.findFirst({
            where: { user_id: user.id },
        });

        return NextResponse.json(cart || { products: [] }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// 📌 **Ajouter un produit au panier**
export async function POST(req) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const { productId, quantity } = await req.json();

        let cart = await prisma.carts.findFirst({ where: { user_id: user.id } });

        if (!cart) {
            cart = await prisma.carts.create({
                data: { user_id: user.id, products: [{ product_id: productId, quantity }] },
            });
        } else {
            const updatedProducts = [...cart.products];
            const existingProduct = updatedProducts.find(p => p.product_id === productId);

            if (existingProduct) {
                existingProduct.quantity += quantity;
            } else {
                updatedProducts.push({ product_id: productId, quantity });
            }

            cart = await prisma.carts.update({
                where: { id: cart.id },
                data: { products: updatedProducts },
            });
        }

        return NextResponse.json(cart, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// 📌 **Modifier la quantité d'un produit**
export async function PUT(req) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const { productId, quantity } = await req.json();

        let cart = await prisma.carts.findFirst({ where: { user_id: user.id } });
        if (!cart) return NextResponse.json({ error: "Panier introuvable" }, { status: 404 });

        const updatedProducts = cart.products.map(p =>
            p.product_id === productId ? { ...p, quantity } : p
        );

        cart = await prisma.carts.update({
            where: { id: cart.id },
            data: { products: updatedProducts },
        });

        return NextResponse.json(cart, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

// 📌 **Supprimer un produit du panier**
export async function DELETE(req) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const productId = searchParams.get("productId");

        let cart = await prisma.carts.findFirst({ where: { user_id: user.id } });
        if (!cart) return NextResponse.json({ error: "Panier introuvable" }, { status: 404 });

        const updatedProducts = cart.products.filter(p => p.product_id !== productId);

        cart = await prisma.carts.update({
            where: { id: cart.id },
            data: { products: updatedProducts },
        });

        return NextResponse.json(cart, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
