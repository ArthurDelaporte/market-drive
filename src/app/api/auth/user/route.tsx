// /api/auth/user

import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { supabase } from '@/supabaseClient';

export async function GET(request: Request) {
    try {
        // Récupérer le cookie access_token dans le header Authorization
        const accessToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token missing' }, { status: 401 });
        }

        // Vérifier l'utilisateur avec le token
        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error || !data?.user?.id) {
            return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
        }

        // Récupérer les informations utilisateur depuis la base de données Prisma
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
            return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
        }

        // Réponse avec les données utilisateur
        return NextResponse.json(dbUser, { status: 200 });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}