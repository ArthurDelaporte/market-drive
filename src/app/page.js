'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
    const router = useRouter()
    return (
        <div>
            <button type="button"
                    className="bg-blue-500 text-white p-2 m-4 rounded hover:bg-blue-600 transition"
                    onClick={() => {
                router.push('/produits');
            }}>
                Voir les produits
            </button>
        </div>
    );
};

export default Home;
