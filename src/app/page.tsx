'use client';

import { useRouter } from 'next/navigation';

const Home = () => {
    const router = useRouter()
    return (
        <div>
            <button type="button" onClick={() => {
                router.push('/produits');
            }}>
                Voir les produits
            </button>
        </div>
    );
};

export default Home;
