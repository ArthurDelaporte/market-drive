import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';

// 📌 **API DELETE pour supprimer plusieurs produits en un seul appel**
export async function DELETE(request: Request) {
    try {
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