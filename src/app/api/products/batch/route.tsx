// /api/products/batch

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';
import {getAuthenticatedUser, isAuthenticatedUserAdmin} from "@/utils/auth";

// 📌 **API POST pour récupérer plusieurs produits en un seul appel**
export async function POST(request: NextRequest) {
    try {
        const authenticatedUser = await getAuthenticatedUser(request);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { productIds } = await request.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Aucun ID de produit fourni' }, { status: 400 });
        }

        // 🔍 **Récupération des produits demandés**
        const products = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                name: true,
                price: true,
                quantity: true,
                unity: true,
                imgurl: true,
                category_id: true,
            },
        });

        if (products.length === 0) {
            return NextResponse.json({ error: "Aucun produit trouvé" }, { status: 404 });
        }

        // 🛒 **Ajout de `total_price` pour chaque produit**
        const productsWithTotalPrice = products.map((product) => ({
            ...product,
            total_price: parseFloat(((product.price || 1) * (product.quantity || 0)).toFixed(2)), // Assure qu'il n'y a pas d'erreur si `price` ou `quantity` est `null`
        }));

        return NextResponse.json({ success: true, products: productsWithTotalPrice }, { status: 200 });
    } catch (error) {
        console.error('Erreur récupération multiple:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// 📌 **API DELETE pour supprimer plusieurs produits en un seul appel**
export async function DELETE(request: NextRequest) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(request);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { productIds } = await request.json();

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'Aucun produit sélectionné' }, { status: 400 });
        }

        // 🔥 **Suppression des produits en une seule requête**
        const deletedProducts = await prisma.products.deleteMany({
            where: { id: { in: productIds } },
        });

        if (deletedProducts.count === 0) {
            return NextResponse.json({ error: "Aucun produit n'a été supprimé" }, { status: 404 });
        }

        return NextResponse.json({ success: true, deletedCount: deletedProducts.count }, { status: 200 });
    } catch (error) {
        console.error('Erreur suppression multiple:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}