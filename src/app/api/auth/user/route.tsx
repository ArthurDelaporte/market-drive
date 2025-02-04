import { NextResponse } from "next/server";
import prisma from "@/prismaClient";
import { supabase } from "@/supabaseClient";
import { jwtDecode } from "jwt-decode";

export async function GET(request: Request) {
    try {
        // ✅ 1️⃣ Récupérer l'access_token depuis les cookies (CORRIGÉ)
        const accessToken = request.cookies.get("access_token")?.value;

        if (!accessToken) {
            console.error("❌ [Auth API] Aucun access_token trouvé dans les cookies !");
            return NextResponse.json({ error: "Access token missing" }, { status: 401 });
        }

        console.log("📌 [Auth API] Access token détecté :", accessToken);

        // ✅ 2️⃣ Vérifier que le token est valide
        try {
            const decodedToken = jwtDecode<{ exp: number }>(accessToken);
            const currentTime = Math.floor(Date.now() / 1000);

            if (decodedToken.exp <= currentTime) {
                console.warn("⚠️ [Auth API] Token expiré !");
                return NextResponse.json({ error: "Access token expired" }, { status: 401 });
            }
        } catch (decodeError) {
            console.error("❌ [Auth API] Erreur lors du décodage du token :", decodeError);
            return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
        }

        // ✅ 3️⃣ Vérifier l'utilisateur avec Supabase
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error || !data?.user?.id) {
            console.error("❌ [Auth API] Erreur avec Supabase :", error);
            return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 });
        }

        console.log("✅ [Auth API] Utilisateur trouvé via Supabase :", data.user.id);

        // ✅ 4️⃣ Récupérer les informations utilisateur depuis Prisma
        const dbUser = await prisma.users.findUnique({
            where: { id: data.user.id },
            select: {
                id: true,
                firstname: true,
                lastname: true,
                birthdate: true,
                email: true,
                role: true,
            },
        });

        if (!dbUser) {
            console.error("❌ [Auth API] Utilisateur introuvable en base de données !");
            return NextResponse.json({ error: "User not found in database" }, { status: 404 });
        }

        console.log("✅ [Auth API] Données utilisateur trouvées :", dbUser);

        // ✅ 5️⃣ Réponse avec les données utilisateur
        return NextResponse.json(dbUser, { status: 200 });

    } catch (error) {
        console.error("❌ [Auth API] Erreur serveur :", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
