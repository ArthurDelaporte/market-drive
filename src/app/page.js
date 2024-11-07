'use client';

import { useRouter } from 'next/navigation';
import Head from 'next/head'
import styles from './globals.css'

export default function Accueil() {
const router = useRouter(); 

  return (
    <div className={styles.container}>
      <Head>
        <title>Drive Courses - Faites vos courses en ligne</title>
        <meta name="description" content="Commandez vos courses en ligne et récupérez-les à votre drive. Livraison rapide et facile." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h1>Bienvenue sur Drive Courses !</h1>
        <p>Vos courses en ligne, prêtes à être récupérées ou livrées en un clin d'œil.</p>
        <a href="#commencer" className={styles.button}>Commencez vos courses</a>
      </header>

      <main className={styles.main}>
        <section className={styles.features}>
          <div className={styles.feature}>
            <h2>Choisissez vos produits</h2>
            <p>Parcourez notre large sélection de produits, de l'épicerie aux produits frais, directement en ligne.</p>
          </div>
        </section>
        <section id="commencer" className={styles.callToAction}>
          <h2>Prêt à faire vos courses ?</h2>
          <p>Rejoignez notre service dès aujourd'hui et profitez de la simplicité d'un drive pour vos courses.</p>
          <button
            type="button"
            className="bg-blue-500 text-white p-2 m-4 rounded hover:bg-blue-600 transition"
            onClick={() => {
              router.push('/produits'); // redirige vers la page des produits
            }}
          >
            Voir les produits
          </button>
        </section>
      </main>
    <footer className={styles.footer}>
        <p>Made with ❤️ by You. &copy; 2024</p>
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



