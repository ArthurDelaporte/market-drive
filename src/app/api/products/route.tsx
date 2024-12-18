// /api/products

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';

// GET handler: Récupérer la liste des produits
export async function GET() {
    try {
        const products = await prisma.products.findMany({
            select: {
                id: true,
                name: true,
                unity: true,
                price: true,
                quantity: true,
                imgurl: true,
                category_id: true,
            },
        });

        // Ajouter le champ `totalPrice` à chaque produit
        const productsWithTotalPrice = products.map((product) => ({
            ...product,
            totalPrice: parseFloat(
                ((product.price || 1) * (product.quantity || 0)).toFixed(2)
            ),
        }));

        return NextResponse.json(productsWithTotalPrice, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// POST handler: Ajouter un nouveau produit
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, unity, imgurl, price, quantity } = body;

        if (!name || !unity || price == null) {
            return NextResponse.json({ error: 'Name, unity, and price are required fields' }, { status: 400 });
        }

        const newProduct = await prisma.products.create({
            data: {
                name,
                unity,
                imgurl,
                price,
                quantity: quantity ?? 1
            },
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
