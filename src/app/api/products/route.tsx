// /api/products

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';
import { Prisma } from "@prisma/client";
import { supabase } from '@/supabaseClient';
import { PRODUCTS_UNITIES } from "@/config/constants";
import {isAuthenticatedUserAdmin} from "@/utils/auth";

const BUCKET_NAME = "product_images";

// 📌 **GET Handler** : Récupérer la liste des produits
export async function GET(req: NextRequest) {
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
            unity: (product.unity && PRODUCTS_UNITIES.includes(product.unity)) ? product.unity : 'pièce',
            imgurl: product.imgurl
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${product.imgurl}`
                : null,
            totalPrice: parseFloat(((product.price || 1) * (product.quantity || 0)).toFixed(2)),
        }));

        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// 📌 **POST Handler** : Ajouter un produit et uploader l’image après insertion
export async function POST(req: NextRequest) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const unity = formData.get("unity") as string;
        const price = Number(formData.get("price"));
        const quantity = Number(formData.get("quantity")) || 1;
        const categoryId = formData.get("category_id") as string;
        const imageFile = formData.get("image") as File | null;

        if (!name || !unity || isNaN(price) || !categoryId) {
            return NextResponse.json({ error: 'Tous les champs sont obligatoires' }, { status: 400 });
        }

        // ✅ **Vérifier que la catégorie existe**
        const existingCategory = await prisma.categories.findUnique({ where: { id: categoryId } });
        if (!existingCategory) {
            return NextResponse.json({ error: "Catégorie introuvable." }, { status: 400 });
        }

        // ✅ **Créer le produit sans image**
        const newProduct = await prisma.products.create({
            data: {
                name,
                unity: PRODUCTS_UNITIES.includes(unity) ? unity : 'pièce',
                price,
                quantity,
                category_id: categoryId,
                imgurl: null, // L'image sera ajoutée après
            },
        });

        let imgUrl: string | null = null;

        // ✅ **Uploader l'image après la création du produit**
        if (imageFile) {
            const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
            if (!allowedTypes.includes(imageFile.type)) {
                return NextResponse.json({ error: "Format d'image invalide. Utilisez PNG, JPG ou WEBP." }, { status: 400 });
            }

            const fileExt = imageFile.name.split('.').pop();
            const fileName = `product_${newProduct.id}.${fileExt}`;

            // 🚀 **Uploader l’image sur Supabase**
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(fileName, imageFile, { contentType: imageFile.type });

            if (uploadError) {
                console.error("Erreur upload Supabase:", uploadError.message);
                return NextResponse.json({ error: "Erreur lors de l'upload de l'image" }, { status: 500 });
            }

            imgUrl = fileName; // On stocke uniquement le nom du fichier

            // 📌 **Mettre à jour le produit avec l’image**
            await prisma.products.update({
                where: { id: newProduct.id },
                data: { imgurl: imgUrl },
            });
        }

        return NextResponse.json({ ...newProduct, imgurl: imgUrl }, { status: 201 });

    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}