import { NextResponse } from 'next/server';
import { supabase } from '@/supabaseClient';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // 📌 Récupération des cookies
        const cookies = request.cookies.get('refresh_token');
        const refreshToken = cookies?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Aucun refresh_token trouvé' }, { status: 401 });
        }

        console.log("🔄 [Auth API] Tentative de rafraîchissement du token avec refresh_token :", refreshToken);

        // ✅ Demande de nouveaux tokens à Supabase
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (error || !data.session) {
            console.error("❌ [Auth API] Erreur lors du rafraîchissement du token :", error);
            return NextResponse.json({ error: 'Échec du rafraîchissement du token' }, { status: 401 });
        }

        const { session } = data;

        console.log("✅ [Auth API] Nouveau token généré :", session.access_token);

        // 📌 Mettre à jour les cookies avec les nouveaux tokens
        const response = NextResponse.json({
            message: 'Token rafraîchi avec succès',
            access_token: session.access_token,
        });

        response.cookies.set('access_token', session.access_token, { path: '/' });
        response.cookies.set('refresh_token', session.refresh_token, { path: '/' });

        return response;
    } catch (error) {
        console.error("❌ [Auth API] Erreur inattendue :", error);
        return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
}
