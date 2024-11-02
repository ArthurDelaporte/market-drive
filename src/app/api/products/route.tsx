import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';

// GET handler: Récupérer la liste des produits
export async function GET() {
    const { data, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
}

// POST handler: Ajouter un nouveau produit
export async function POST(req: Request) {
    const body = await req.json();

    const { name, unity, imgurl, price } = body;

    const { data, error } = await supabase
        .from('products')
        .insert([{ name, unity, imgurl, price }]);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
}
