// /api/products

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { Prisma } from "@prisma/client";
import { supabase } from '@/supabaseClient';

// 📌 **GET Handler** : Récupérer la liste des produits
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

        if (categoryId) {
            conditions.where = { ...conditions.where, category_id: categoryId };
        }

        if (searchTerm) {
            conditions.where = {
                ...conditions.where,
                name: { contains: searchTerm, mode: "insensitive" },
            };
        }

        let products = await prisma.products.findMany(conditions);

        // ✅ Générer une URL publique pour chaque image stockée dans Supabase
        products = products.map((product) => ({
            ...product,
            imgurl: product.imgurl
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_images/${product.imgurl}`
                : null,
            totalPrice: parseFloat(((product.price || 1) * (product.quantity || 0)).toFixed(2)),
        }));

        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

// 📌 **POST Handler** : Ajouter un produit avec upload d’image
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const name = formData.get("name") as string;
        const unity = formData.get("unity") as string;
        const price = Number(formData.get("price"));
        const quantity = Number(formData.get("quantity")) || 1;
        const imageFile = formData.get("image") as File | null;

        if (!name || !unity || price == null) {
            return NextResponse.json({ error: 'Name, unity, and price are required' }, { status: 400 });
        }

        let imgUrl: string | null = null;

        // ✅ **Téléverser l'image sur Supabase**
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `product_images/${fileName}`;

            const { error } = await supabase.storage
                .from("product_images")
                .upload(filePath, imageFile, { contentType: imageFile.type });

            if (error) throw new Error(`Erreur upload Supabase: ${error.message}`);

            imgUrl = fileName; // On stocke le nom du fichier seulement
        }

        // ✅ **Créer le produit dans la DB**
        const newProduct = await prisma.products.create({
            data: { name, unity, price, quantity, imgurl: imgUrl },
        });

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}