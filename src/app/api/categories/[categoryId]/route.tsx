// /api/categories/[categoryId]

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { NextRequest } from 'next/server';

interface ContextParams {
    params: {
        categoryId: string;
    };
}

// PUT handler: Modifier une catégorie
export async function PUT(request: NextRequest, context: ContextParams) {
    const { categoryId } = context.params;

    if (!categoryId) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    try {
        const { name, category_parent }: { name: string; category_parent?: string } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
        }

        const updatedCategory = await prisma.categories.update({
            where: { id: categoryId },
            data: { name, category_parent },
        });

        return NextResponse.json(updatedCategory, { status: 200 });
    } catch (error) {
        console.error('Unhandled error updating category:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// DELETE handler: Supprimer une catégorie
export async function DELETE(request: NextRequest, context: ContextParams) {
    const { categoryId } = context.params;

    if (!categoryId) {
        return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    try {
        const deletedCategory = await prisma.categories.delete({
            where: { id: categoryId },
        });

        return NextResponse.json(deletedCategory, { status: 200 });
    } catch (error) {
        console.error('Unhandled error deleting category:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
