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
        console.log("📌 [Auth API] Refresh token reçu :", session?.refresh_token);

        if (!session || !user) {
            return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
        }

        // 🔹 Récupération des informations utilisateur depuis Prisma
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

        // ✅ Créer la réponse JSON avec le `access_token` et `refresh_token`
        const response = NextResponse.json({
            message: 'Login successful',
            user: { id: dbUser.id, role: dbUser.role },
            access_token: session.access_token,
            refresh_token: session.refresh_token, // 🔹 On renvoie aussi le refresh_token côté client
        });

        // ✅ Ajouter le `access_token` et `refresh_token` dans les cookies (⚠️ HttpOnly désactivé)
        response.cookies.set('access_token', session.access_token, { path: '/', maxAge: 3600 }); // 1h
        response.cookies.set('refresh_token', session.refresh_token, { path: '/', maxAge: 2592000 }); // 30 jours

        console.log("✅ [Auth API] Connexion réussie et tokens stockés en cookies.");

        return response;
    } catch (error) {
        console.error('Error during signin:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
