// /api/products/[productId]

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { createClient } from '@supabase/supabase-js';

// ✅ Vérification des variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Les variables d\'environnement Supabase ne sont pas définies.');
}

// 📌 Initialisation du client Supabase
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'product_images';

// 📌 **GET Handler: Récupérer un produit par ID**
export async function GET(request: Request, context: { params: { productId: string } }) {
    const { productId } = await context.params;

    if (!productId) {
        return NextResponse.json({ error: 'ID du produit invalide' }, { status: 400 });
    }

    try {
        const product = await prisma.products.findUnique({ where: { id: productId } });

        if (!product) {
            return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// 📌 **PUT Handler: Modifier un produit (et gérer l’upload d’image)**
export async function PUT(request: Request, context: { params: { productId: string } }) {
    const { productId } = context.params;

    if (!productId) {
        return NextResponse.json({ error: 'ID du produit invalide' }, { status: 400 });
    }

    try {
        const formData = await request.formData();
        const name = formData.get("name") as string;
        const unity = formData.get("unity") as string;
        const price = parseFloat(formData.get("price") as string);
        const quantity = parseFloat(formData.get("quantity") as string);
        const image = formData.get("image") as File | null;

        if (!name || !unity || isNaN(price) || isNaN(quantity)) {
            return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
        }

        // 📌 **Récupérer l'ancien produit**
        const existingProduct = await prisma.products.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
        }

        let imgUrl = existingProduct.imgurl;

        // 📌 **Gestion de l’upload d’image**
        if (image) {
            const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
            if (!allowedTypes.includes(image.type)) {
                return NextResponse.json({ error: "Format d'image invalide. Utilisez JPG, PNG ou WebP." }, { status: 400 });
            }

            const fileExt = image.name.split('.').pop();
            const newImgUrl = `product_${productId}.${fileExt}`;

            // 🛑 **Supprimer l’ancienne image si elle existe**
            if (existingProduct.imgurl) {
                const { error: deleteError } = await supabase
                    .storage
                    .from(BUCKET_NAME)
                    .remove([existingProduct.imgurl]);

                if (deleteError) {
                    console.warn("Impossible de supprimer l'ancienne image:", deleteError.message);
                }
            }

            // 🚀 **Uploader la nouvelle image**
            const { data, error: uploadError } = await supabase
                .storage
                .from(BUCKET_NAME)
                .upload(newImgUrl, image, { upsert: true });

            if (uploadError) {
                console.error("Erreur upload Supabase:", uploadError.message);
                return NextResponse.json({ error: "Erreur lors de l'upload de l'image" }, { status: 500 });
            }

            imgUrl = data?.path;
        }

        // 📌 **Mise à jour du produit**
        const updatedProduct = await prisma.products.update({
            where: { id: productId },
            data: {
                name,
                unity,
                price,
                quantity,
                imgurl: imgUrl
            },
        });

        return NextResponse.json(updatedProduct, { status: 200 });

    } catch (error) {
        console.error('Erreur mise à jour produit:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}