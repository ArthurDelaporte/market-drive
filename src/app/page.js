'use client';

import { useRouter } from 'next/navigation';
import Head from 'next/head'
import styles from './globals.css'

export default function Accueil() {
const router = useRouter(); 

return (
  <div className="container mx-auto">
    <Head>
      <title>Drive Courses - Faites vos courses en ligne</title>
      <meta name="description" content="Commandez vos courses en ligne et récupérez-les à votre drive. Livraison rapide et facile." />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <header className="bg-teal-500 text-white p-8 text-center rounded-b-lg shadow-md">
      <h1 className="text-4xl font-bold mb-4">Bienvenue sur le GIGA Drive !</h1>
      <p className="text-lg mb-8">Vos courses en ligne, prêtes à être récupérées ou livrées en un clin d'œil.</p>
    </header>

    <main className="py-12 px-4">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Choisissez vos produits</h2>
          <p className="text-gray-600">Parcourez notre large sélection de produits, de l'épicerie aux produits frais, directement en ligne.</p>
        </div>
      </section>

      <section className="mt-12 text-center">
        <h2 className="text-3xl font-bold text-teal-600">Prêt à faire vos courses ?</h2>
        <p className="text-lg text-gray-700 mt-2">Rejoignez notre service dès aujourd'hui et profitez de la simplicité d'un drive pour vos courses.</p>
        <button
          onClick={() => router.push('/produits')}
          className="bg-teal-600 text-white py-2 px-6 rounded-lg shadow-md hover:bg-teal-700 transition ease-in-out duration-300 transform hover:scale-105 mt-4"
        >
          Voir les produits
        </button>
      </section>
    </main>
    <footer className={styles.footer}>
        <p>Made with 🤬 by 🦧</p>
    </footer>
    </div>
    
  )
}


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



