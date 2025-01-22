// /api/categories/parent/[parentId]/route.tsx

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';

export async function GET(request: Request, context: { params: { parentId: string } }) {
    try {
        const { parentId } = await context.params;

        const categories = await prisma.categories.findMany({
            where: { category_parent: parentId },
        });

        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}