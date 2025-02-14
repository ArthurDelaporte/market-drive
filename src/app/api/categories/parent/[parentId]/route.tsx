import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';

export async function GET(request: NextRequest) {
    try {
        // Extraire parentId depuis l'URL
        const pathSegments = request.nextUrl.pathname.split('/');
        const parentId = pathSegments[pathSegments.length - 1];

        if (!parentId) {
            return NextResponse.json({ error: 'Parent ID is required' }, { status: 400 });
        }

        const categories = await prisma.categories.findMany({
            where: { category_parent: parentId },
        });

        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}
