import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ProductsPage from '../../app/produits/page';
import React from 'react';
// Import pour éviter la référence triple slash
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
    [key: string]: unknown
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

  // Sauvegarde du fetch original pour restauration
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Utiliser Object.defineProperty pour éviter les problèmes de typage
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockFetchImplementation = (url: string | URL | Request): Promise<any> => {
      const urlString = url.toString();
      if (urlString.includes('/api/auth/user')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'user1', role: 'user' })
        });
      }
      if (urlString.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProducts)
        });
      }
      return Promise.reject(new Error('Not Found'));
    };

    // Remplacer la fonction fetch de manière sûre
    Object.defineProperty(global, 'fetch', {
      value: jest.fn(mockFetchImplementation),
      writable: true
    });
  });

  // Restaurer fetch après les tests
  afterAll(() => {
    Object.defineProperty(global, 'fetch', {
      value: originalFetch,
      writable: true
    });
  });

  it('should display products', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    await waitFor(() => {
      // @ts-expect-error - Jest DOM types issue
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
      // @ts-expect-error - Jest DOM types issue
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
      // @ts-expect-error - Jest DOM types issue
      expect(screen.getByText('Prix minimum (€)')).toBeInTheDocument();
    });
  });

  it('should add product to cart', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    await waitFor(() => {
      // @ts-expect-error - Jest DOM types issue
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('Ajouter');
    fireEvent.click(addToCartButton);

    // Simplifié au maximum sans utiliser de matchers complexes
    await waitFor(() => {
      // @ts-expect-error - Jest mock types issue
      expect(global.fetch).toHaveBeenCalled();
      
      // Vérification manuelle que l'URL contient la chaîne recherchée
      let foundCorrectCall = false;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fetchCalls = (global.fetch as jest.Mock).mock.calls;
      
      for (const call of fetchCalls) {
        const url = call[0]?.toString() || '';
        if (url.includes('/api/user/user1/carts')) {
          foundCorrectCall = true;
          break;
        }
      }
      
      // @ts-expect-error - Jest assertion types issue
      expect(foundCorrectCall).toBe(true);
    });
  });
});