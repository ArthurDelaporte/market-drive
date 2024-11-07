import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

export async function GET(request: Request, context: { params: { productId: string } }) {
    const { productId } = await context.params;

    if (!productId) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (error) {
            console.error("Error fetching product:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        console.error("Unhandled error fetching product:", err);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: { productId: string } }) {
    const { productId } = await context.params;

    if (!productId) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    try {
        const { name, unity, imgurl, price } = await request.json();

        if (!name || !unity || !imgurl || typeof price !== 'number') {
            return NextResponse.json({ error: 'Tous les champs sont obligatoires' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('products')
            .update({ name, unity, imgurl, price })
            .eq('id', productId);

        if (error) {
            console.error("Error updating product:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data }, { status: 200 });
    } catch (err) {
        console.error("Unhandled error updating product:", err);
        return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
    }
}
