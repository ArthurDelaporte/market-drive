// /api/categories/[categoryId]

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { NextRequest } from 'next/server';
import {isAuthenticatedUserAdmin} from "@/utils/auth";

// 📌 **GET Handler** : Récupérer une catégorie par ID
export async function GET(request: NextRequest, { params }: { params: { categoryId: string } }) {
    try {
        const { categoryId } = params;

        if (!categoryId) {
            return NextResponse.json({ error: 'ID de catégorie invalide' }, { status: 400 });
        }

        const category = await prisma.categories.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            return NextResponse.json({ error: 'Catégorie introuvable' }, { status: 404 });
        }

        return NextResponse.json(category, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT handler: Modifier une catégorie
export async function PUT(request: NextRequest, { params }: { params: { categoryId: string } }) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(request);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { categoryId } = params;

        if (!categoryId) {
            return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
        }

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
export async function DELETE(request: NextRequest, { params }: { params: { categoryId: string } }) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(request);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const { categoryId } = params;

        if (!categoryId) {
            return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
        }

        const deletedCategory = await prisma.categories.delete({
            where: { id: categoryId },
        });

        return NextResponse.json(deletedCategory, { status: 200 });
    } catch (error) {
        console.error('Unhandled error deleting category:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
