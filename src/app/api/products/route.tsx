// /api/products

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import {Prisma} from "@prisma/client";

// Récupérer les catégories descendantes
const getDescendantCategories = async (parentId: string): Promise<string[]> => {
    const childCategories = await prisma.categories.findMany({
        where: { category_parent: parentId },
        select: { id: true },
    });

    const childIds = childCategories.map((child) => child.id);

    // Récursivité : chercher les descendants des enfants
    const descendantIds = await Promise.all(
        childIds.map((childId) => getDescendantCategories(childId))
    );

    return [parentId, ...descendantIds.flat()];
};

// GET handler: Récupérer la liste des produits
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const categoryId = searchParams.get("categoryId");
        const searchTerm = searchParams.get("productName");

        const conditions: Prisma.productsFindManyArgs = {
            select: {
                id: true,
                name: true,
                unity: true,
                price: true,
                quantity: true,
                imgurl: true,
                category_id: true,
            },
        };

        // Ajouter la condition pour la catégorie
        if (categoryId) {
            const allCategoryIds = await getDescendantCategories(categoryId);

            conditions.where = {
                ...conditions.where,
                category_id: {
                    in: allCategoryIds,
                },
            };
        }

        // Ajouter la condition pour le nom
        if (searchTerm) {
            conditions.where = {
                ...conditions.where,
                name: {
                    contains: searchTerm,
                    mode: "insensitive"
                }
            }
        }

        const products = await prisma.products.findMany(conditions);

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
