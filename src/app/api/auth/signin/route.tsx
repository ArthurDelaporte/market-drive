import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';
import prisma from '@/prismaClient';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { email, password }: { email: string; password: string } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 401 });
        }

        const { session, user } = data;

        console.log("📌 [Auth API] Session reçue :", session);
        console.log("📌 [Auth API] Access token reçu :", session?.access_token);


        if (!session || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        // Récupération des informations utilisateur depuis Prisma
        const dbUser = await prisma.users.findUnique({
            where: { id: user.id },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                role: true, // Assurez-vous que votre table users inclut un champ `role`
            },
        });

        console.log("🔍 ID trouvé dans la table users :", dbUser?.id);

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        const response = NextResponse.json({
            message: 'Login successful',
            user: { id: dbUser.id, role: dbUser.role },
        });

        // ✅ Ajouter le cookie access_token
        response.cookies.set('access_token', session.access_token, { path: '/' });

        // ✅ Forcer Supabase à rafraîchir la session après connexion
        await supabase.auth.getSession();

        console.log("✅ [Auth API] Connexion réussie et session mise à jour.");

        return response;
    } catch (error) {
        console.error('Error during signin:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
