// /api/products

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';

// GET handler: Récupérer la liste des produits
export async function GET() {
    try {
        const products = await prisma.products.findMany();
        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// POST handler: Ajouter un nouveau produit
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, unity, imgurl, price } = body;

        if (!name || !unity || price == null) {
            return NextResponse.json({ error: 'Name, unity, and price are required fields' }, { status: 400 });
        }

        const newProduct = await prisma.products.create({
            data: { name, unity, imgurl, price },
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
