// /api/users

import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/prismaClient';
import {isAuthenticatedUserAdmin} from "@/utils/auth";

// GET handler: Récupérer les users
export async function GET(req: NextRequest) {
    try {
        const authenticatedUser = await isAuthenticatedUserAdmin(req);

        if (!authenticatedUser) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        const users = await prisma.users.findMany();
        return NextResponse.json(users, { status: 200 });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
    }
}