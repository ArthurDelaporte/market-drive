// /api/categories

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';

// GET handler: Récupérer les catégories
export async function GET() {
    try {
        const categories = await prisma.categories.findMany();
        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}

// POST handler: Ajouter une ou plusieurs catégories
export async function POST(request: NextRequest) {
    try {
        const categories: { name: string; category_parent?: string }[] = await request.json();

        if (!categories.length) {
            return NextResponse.json({ error: 'At least one category is required' }, { status: 400 });
        }

        for (const category of categories) {
            if (!category.name) {
                return NextResponse.json({ error: 'Category name is required for all categories' }, { status: 400 });
            }
        }

        const createdCategories = await prisma.categories.createMany({
            data: categories,
            skipDuplicates: true,
        });

        return NextResponse.json(createdCategories, { status: 201 });
    } catch (err) {
        console.error('Unhandled error creating categories:', err);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
