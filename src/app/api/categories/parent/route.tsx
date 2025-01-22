// /api/categories/parent/route.tsx

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';

export async function GET() {
    try {
        const categories = await prisma.categories.findMany({
            where: { category_parent: null },
        });

        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        console.error('Error fetching root categories:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}