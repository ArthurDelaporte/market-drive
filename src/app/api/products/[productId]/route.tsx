// /api/products/[productId]

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';

// GET handler: Récupérer un produit par ID
export async function GET(request: Request, context: { params: { productId: string } }) {
    const { productId } = context.params;

    if (!productId) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const product = await prisma.products.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Unhandled error fetching product:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// PUT handler: Mettre à jour un produit par ID
export async function PUT(request: Request, context: { params: { productId: string } }) {
    const { productId } = context.params;

    if (!productId) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const { name, unity, imgurl, price } = await request.json();

        if (!name || !unity || !imgurl || typeof price !== 'number') {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const updatedProduct = await prisma.products.update({
            where: { id: productId },
            data: { name, unity, imgurl, price },
        });

        return NextResponse.json(updatedProduct, { status: 200 });
    } catch (error) {
        console.error('Unhandled error updating product:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
