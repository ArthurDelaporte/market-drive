import ProductsList from './ProductsList';

export default function BooksPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold text-center mb-8">Nos Produits</h1>
            <ProductsList />
        </div>
    );
}
