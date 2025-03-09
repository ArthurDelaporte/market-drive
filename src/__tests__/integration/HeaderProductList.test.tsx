/// <reference types="@testing-library/jest-dom" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ProductsPage from '../../app/produits/page';
import React from 'react';
import '@testing-library/jest-dom';

// Mock react-modal
jest.mock('react-modal', () => {
  return function MockModal({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) {
    if (!isOpen) return null;
    return <div className="modal">{children}</div>;
  };
});

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  }
}));

// Mock pour next/image - correction pour éviter l'avertissement @next/next/no-img-element
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, width, height, ...props }: { 
    src: string, 
    alt: string, 
    width?: number, 
    height?: number,
    [key: string]: any
  }) => {
    // Créer un div au lieu d'une balise img pour éviter l'avertissement
    return (
      <div 
        data-testid="mock-image" 
        data-src={src} 
        data-alt={alt} 
        style={{ 
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height
        }}
        {...props}
      >
        {alt}
      </div>
    );
  }
}));

// Mock pour les icônes
jest.mock('react-icons/fa', () => ({
  FaShoppingCart: () => <span>Cart</span>,
  FaSlidersH: () => <span>Filter</span>
}));

// Mock pour Header
jest.mock('../../components/Header', () => {
  return function MockHeader() {
    return <header>Mock Header</header>;
  };
});

// Mock pour next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
};

const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/',
}));

// Mock pour typescript-cookie
jest.mock('typescript-cookie', () => ({
  getCookie: jest.fn().mockReturnValue('fake-token'),
  removeCookie: jest.fn()
}));

// Type pour le produit simulé
interface MockProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imgurl: string;
  unity: string;
  totalPrice: number;
}

describe('ProductsPage Integration', () => {
  const mockProducts: MockProduct[] = [
    { 
      id: '1', 
      name: 'Produit Test', 
      price: 10, 
      quantity: 5, 
      imgurl: '/test-image.jpg',
      unity: 'pièce',
      totalPrice: 50
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any) = jest.fn((url: string) => {
      if (url.includes('/api/auth/user')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'user1', role: 'user' })
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        });
      }
      return Promise.reject(new Error('Not Found'));
    });
  });

  it('should display products', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    await waitFor(() => {
      // @ts-ignore
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
      // @ts-ignore
      expect(screen.getByText('10 €/pièce')).toBeInTheDocument();
    });
  });

  it('should handle product filtering', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    // Ouvrir le modal de filtres
    const filterButton = screen.getByText('Filtres');
    fireEvent.click(filterButton);

    // Vérifier que le modal est affiché
    await waitFor(() => {
      // @ts-ignore
      expect(screen.getByText('Prix minimum (€)')).toBeInTheDocument();
    });
  });

  it('should add product to cart', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    await waitFor(() => {
      // @ts-ignore
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('Ajouter');
    fireEvent.click(addToCartButton);

    // Simplifié au maximum avec ts-ignore sur toute l'assertion
    await waitFor(() => {
      // @ts-ignore
      expect(global.fetch).toHaveBeenCalled();
      
      // Vérification manuelle que l'URL contient la chaîne recherchée
      const fetchCalls = (global.fetch as any).mock.calls;
      let foundCorrectCall = false;
      
      // @ts-ignore - Ignorer les erreurs TypeScript pour le code de vérification
      for (const call of fetchCalls) {
        if (typeof call[0] === 'string' && call[0].includes('/api/user/user1/carts')) {
          foundCorrectCall = true;
          break;
        }
      }
      
      // @ts-ignore
      expect(foundCorrectCall).toBe(true);
    });
  });
});