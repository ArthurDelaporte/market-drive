import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_PAGES } from "@/config/constants";

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
            // Appeler l'API pour récupérer les informations utilisateur
            const userResponse = await fetch(new URL("/api/auth/user", request.url), {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            const data = await userResponse.json();

            if (userResponse.ok) {

                // Si l'utilisateur essaie d'accéder à une page admin
                if (pathname.startsWith("/admin") && data.role !== "admin") {
                    console.error("Non-admin user attempting to access admin page");
                    return NextResponse.redirect(new URL("/", request.url)); // Rediriger les non-admins vers la page d'accueil
                }

                // Accès autorisé pour les autres pages
                return NextResponse.next();
            }

            // Si l'API retourne une erreur, rediriger vers la page de connexion
            console.error("Error from /api/auth/user :", data.error);

            const redirectUrl = new URL("/connexion", request.url);
            redirectUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Si l'utilisateur n'est pas connecté et tente d'accéder à une page non publique
        if (!PUBLIC_PAGES.includes(pathname)) {
            const redirectUrl = new URL("/connexion", request.url);
            redirectUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        // Autoriser l'accès aux pages publiques
        return NextResponse.next();
    } catch (error) {
        console.error("Middleware error:", error);

        // Rediriger vers la page de connexion en cas d'erreur inattendue
        if (!PUBLIC_PAGES.includes(pathname)) {
            const redirectUrl = new URL("/connexion", request.url);
            redirectUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(redirectUrl);
        }

        return NextResponse.next();
    }
}

// Configuration pour matcher toutes les routes
export const config = {
    matcher: "/:path*",
};