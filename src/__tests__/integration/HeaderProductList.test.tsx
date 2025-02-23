import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import ProductsPage from '../../app/produits/page';
import React from 'react';
import '@testing-library/jest-dom';

// Mock react-modal
jest.mock('react-modal', () => {
  return function MockModal({ children, isOpen }) {
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

// Mock pour next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />
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

describe('ProductsPage Integration', () => {
  const mockProducts = [
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
    global.fetch = jest.fn((url) => {
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
    }) as jest.Mock;
  });

  it('should display products', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
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
      expect(screen.getByText('Prix minimum (€)')).toBeInTheDocument();
    });
  });

  it('should add product to cart', async () => {
    await act(async () => {
      render(<ProductsPage />);
    });

    await waitFor(() => {
      expect(screen.getByText('Produit Test')).toBeInTheDocument();
    });

    const addToCartButton = screen.getByText('Ajouter');
    fireEvent.click(addToCartButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/user/user1/carts'),
        expect.any(Object)
      );
    });
  });
});