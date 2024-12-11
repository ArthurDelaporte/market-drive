import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
    const token = request.cookies.get("access_token")?.value;

    const publicPages = ["/", "/connexion", "/inscription", "/produits"];
    const pathname = request.nextUrl.pathname;

    // Exclure les fichiers statiques (CSS, JS, images, icônes, etc.)
    if (
        pathname.startsWith('/api') ||
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

    // Autoriser l'accès aux pages publiques
    if (publicPages.includes(pathname)) {
        return NextResponse.next();
    }

    // Rediriger vers la page de connexion si pas de token
    if (!token) {
        return NextResponse.redirect(new URL("/connexion", request.url));
    }

    return NextResponse.next();
}

// Configuration pour matcher toutes les routes
export const config = {
    matcher: "/:path*",
};