'use client'

import { useRouter } from 'next/navigation';
import Header from "@/components/Header";

export default function Accueil() {
  const router = useRouter();

  return (
      <>
        <Header />
        <div className="container mx-auto">
          <main className="py-12 px-4 md:mt-12 mt-40">
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <h2 className="text-xl font-semibold text-[#424242] mb-4">Choisissez vos produits</h2>
                <p className="text-[#424242]">
                  Parcourez notre large sélection de produits, de l&apos;épicerie aux produits frais, directement en ligne.
                </p>
              </div>
            </section>

            <section className="mt-12 text-center">
              <h2 className="text-3xl font-bold text-[#F57C00]">Prêt à faire vos courses ?</h2>
              <p className="text-lg mt-2">
                Rejoignez notre service dès aujourd&apos;hui et profitez de la simplicité d&apos;un drive pour vos courses.
              </p>
              <button
                  type="button"
                  onClick={() => router.push('/produits')}
                  className="bg-[#F57C00] text-white py-2 px-6 rounded-lg shadow-md hover:bg-[#E65100] hover:text-[#F9F9F9] transition ease-in-out duration-300 transform hover:scale-105 mt-4"
              >
                Voir les produits
              </button>
            </section>
          </main>
        </div>
      </>
  );
}