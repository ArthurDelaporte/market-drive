import { NextResponse } from 'next/server';
import prisma from '@/prismaClient';
import { supabase } from '@/supabaseClient';

export async function GET(request: Request) {
    try {
        const accessToken = request.headers.get('Authorization')?.split(' ')[1];

        if (!accessToken) {
            return NextResponse.json({ error: 'Access token missing' }, { status: 401 });
        }

        const { data, error } = await supabase.auth.getUser(accessToken);

        if (error || !data?.user?.id) {
            return NextResponse.json({ error: 'Invalid or expired access token' }, { status: 401 });
        }

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

        return NextResponse.json(dbUser, { status: 200 });
    } catch (error) {
        console.error('Error fetching user data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}