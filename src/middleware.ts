import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { PUBLIC_PAGES } from '@/config/constants';

export async function middleware(request: NextRequest) {
    const accessToken = request.cookies.get("access_token")?.value;
    const pathname = request.nextUrl.pathname;

    // Exclure les fichiers statiques (CSS, JS, images, icônes, etc.) et API
    if (
        pathname.startsWith("/api") ||
        pathname.startsWith("/_next/") || // Next.js fichiers statiques
        pathname.startsWith("/favicon.ico") || // Favicon
        pathname.startsWith("/public/") || // Ressources publiques
        pathname.endsWith(".css") || // Feuilles de style
        pathname.endsWith(".js") || // JavaScript
        pathname.endsWith(".png") || // Images
        pathname.endsWith(".jpg") || // Images
        pathname.endsWith(".svg") // SVG
    ) {
        return NextResponse.next();
    }

    try {
        if (accessToken) {
            // Déchiffrer le token pour vérifier son expiration
            const decodedToken = jwtDecode<{ exp: number }>(accessToken);
            const currentTime = Math.floor(Date.now() / 1000);

            if (decodedToken && decodedToken.exp > currentTime) {
                // Token valide, accès autorisé
                return NextResponse.next();
            } else {
                console.error("Access token expired, redirecting to login");
            }
        }

        // Si l'accessToken est invalide ou absent
        if (!PUBLIC_PAGES.includes(pathname)) {
            const redirectUrl = new URL("/connexion", request.url);
            redirectUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Pour les pages publiques
        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);
    }

    // En cas d'erreur inattendue, rediriger vers la page de connexion si la page n'est pas publique
    if (!PUBLIC_PAGES.includes(pathname)) {
        const redirectUrl = new URL("/connexion", request.url);
        redirectUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
}

// Configuration pour matcher toutes les routes
export const config = {
    matcher: "/:path*",
};