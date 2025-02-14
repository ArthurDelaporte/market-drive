import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';
import { supabase } from '@/supabaseClient';
import { PRODUCTS_UNITIES } from "@/config/constants";
import { isAuthenticatedUserAdmin } from "@/utils/auth";

// ✅ Vérification des variables d'environnement
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Les variables d\'environnement Supabase ne sont pas définies.');
}

const BUCKET_NAME = 'product_images';

// 📌 **GET Handler: Récupérer un produit par ID**
export async function GET(request: NextRequest) {
    try {
        // Extraire productId depuis l'URL
        const pathSegments = request.nextUrl.pathname.split('/');
        const productId = pathSegments[pathSegments.length - 1];

        if (!productId) {
            return NextResponse.json({ error: 'ID du produit invalide' }, { status: 400 });
        }

        const product = await prisma.products.findUnique({ where: { id: productId } });

        if (!product) {
            return NextResponse.json({ error: 'Produit introuvable' }, { status: 404 });
        } else {
            product.unity = (product.unity && PRODUCTS_UNITIES.includes(product.unity)) ? product.unity : 'pièce';
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        console.error('Erreur lors de la récupération du produit:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// 📌 **PUT Handler: Modifier un produit (et gérer l’upload d’image)**
export async function PUT(request: NextRequest) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(request);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Extraire productId depuis l'URL
        const pathSegments = request.nextUrl.pathname.split('/');
        const productId = pathSegments[pathSegments.length - 1];

        if (!productId) {
            return NextResponse.json({ error: 'ID du produit invalide' }, { status: 400 });
        }

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
                unity: (unity && PRODUCTS_UNITIES.includes(unity)) ? unity : 'pièce',
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

// 🗑️ **DELETE Handler: Supprimer un produit**
export async function DELETE(request: NextRequest) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(request);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // Extraire productId depuis l'URL
        const pathSegments = request.nextUrl.pathname.split('/');
        const productId = pathSegments[pathSegments.length - 1];

        if (!productId) {
            return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
        }

        const deletedProduct = await prisma.products.delete({
            where: { id: productId },
        });

        return NextResponse.json(deletedProduct, { status: 200 });
    } catch (error) {
        console.error('Unhandled error deleting product:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
