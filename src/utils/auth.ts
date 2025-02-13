import {NextRequest, NextResponse} from "next/server";
import { jwtDecode } from "jwt-decode";
import prisma from "@/prismaClient";
import {supabase} from "@/supabaseClient";

/**
 * Vérifie l'authentification de l'utilisateur à partir du token Bearer.
 * @param req La requête Next.js contenant l'en-tête Authorization
 * @returns L'objet user si authentifié, sinon null
 */
export async function getAuthenticatedUser(req: NextRequest) {
    try {
        // 🔹 Vérifier si le token est présent dans les cookies ou l'en-tête Authorization
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.split(" ")[1];

        if (!token) {
            return null; // Aucun token trouvé
        }

        // 🔹 Décoder le token
        try {
            const decodedToken = jwtDecode<{ exp: number }>(token);
            const currentTime = Math.floor(Date.now() / 1000);

            if (decodedToken.exp <= currentTime) {
                // Token expiré
                return NextResponse.json({ error: "Access token expired" }, { status: 401 });
            }
        } catch (decodeError) {
            console.error("Error decoding token:", decodeError);
            return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
        }

        // Vérifier l'utilisateur avec Supabase
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data?.user?.id) {
            return NextResponse.json({ error: "Invalid or expired access token" }, { status: 401 });
        }

        // 🔹 Rechercher l'utilisateur dans la base de données
        const user = await prisma.users.findUnique({
            where: { id: data.user.id },
            select: { id: true, role: true },
        });

        return user || null;
    } catch (error) {
        console.error("❌ Erreur lors de l'authentification:", error);
        return null;
    }
}

/**
 * Vérifie si l'utilisateur connecté est un administrateur.
 * @param req La requête Next.js contenant l'en-tête Authorization
 * @returns L'objet user si c'est un admin, sinon null
 */
export async function isAuthenticatedUserAdmin(req: NextRequest) {
    const user = await getAuthenticatedUser(req);

    if (!user || "error" in user) return null;

    if (user.role !== "admin") return null;

    return user;
}