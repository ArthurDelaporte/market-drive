// Mock next/server avant les imports
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: jest.fn((data, options) => ({ ...data, ...options }))
  }
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn()
}));

jest.mock('@/prismaClient', () => ({
  __esModule: true,
  default: {
    users: {
      findUnique: jest.fn()
    }
  }
}));

jest.mock('@/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    }
  }
}));

import { getAuthenticatedUser } from '../utils/auth';
import { jwtDecode } from 'jwt-decode';
import prisma from '@/prismaClient';
import { supabase } from '@/supabaseClient';
import { NextResponse } from 'next/server';

describe('getAuthenticatedUser', () => {
  let mockRequest;
  let mockHeaders;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Créer un mock simple des headers
    mockHeaders = {
      authorization: null
    };

    // Créer le mock de la requête
    mockRequest = {
      headers: {
        get: (name) => mockHeaders[name]
      }
    };
  });

  it('should return null when no token is provided', async () => {
    const userOrResponse = await getAuthenticatedUser(mockRequest);
    expect(userOrResponse).toBeNull();
  });

  it('should return error response when token is expired', async () => {
    // Configurer le token dans les headers
    mockHeaders.authorization = 'Bearer valid_token';
    
    // Simuler un token expiré
    jwtDecode.mockReturnValue({ 
      exp: Math.floor(Date.now() / 1000) - 3600 // expiré il y a 1 heure
    });
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Access token expired" },
      { status: 401 }
    );
  });

  it('should return user data for valid token', async () => {
    // Configurer un token valide
    mockHeaders.authorization = 'Bearer valid_token';
    
    // Simuler un token valide
    jwtDecode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600 // valide pour 1 heure
    });

    // Simuler une réponse Supabase valide
    const mockSupabaseUser = { id: '123' };
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockSupabaseUser },
      error: null
    });

    // Simuler une réponse Prisma valide
    const mockPrismaUser = {
      id: '123',
      role: 'user'
    };
    prisma.users.findUnique.mockResolvedValue(mockPrismaUser);

    const userOrResponse = await getAuthenticatedUser(mockRequest);
    expect(userOrResponse).toEqual(mockPrismaUser);
  });

  it('should handle invalid token format', async () => {
    mockHeaders.authorization = 'Bearer invalid_token';
    
    jwtDecode.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Invalid access token" },
      { status: 401 }
    );
  });

  it('should handle Supabase authentication error', async () => {
    mockHeaders.authorization = 'Bearer valid_token';
    
    jwtDecode.mockReturnValue({
      exp: Math.floor(Date.now() / 1000) + 3600
    });

    supabase.auth.getUser.mockResolvedValue({
      data: null,
      error: new Error('Authentication error')
    });

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Invalid or expired access token" },
      { status: 401 }
    );
  });
});