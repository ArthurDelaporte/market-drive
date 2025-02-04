'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

export default function DialogCategory({ isOpen, onClose }) {
    const router = useRouter();

    const [categoriesLevel0, setCategoriesLevel0] = useState([]);
    const [categoriesLevel1, setCategoriesLevel1] = useState([]);
    const [categoriesLevel2, setCategoriesLevel2] = useState([]);

    const [currentCategoryLevel0, setCurrentCategoryLevel0] = useState(null);
    const [currentCategoryLevel1, setCurrentCategoryLevel1] = useState(null);

    const [isLevel1DialogOpen, setIsLevel1DialogOpen] = useState(false);
    const [isLevel2DialogOpen, setIsLevel2DialogOpen] = useState(false);

    // Fonction pour récupérer les catégories depuis l'API
    const fetchCategories = async (parentId = null) => {
        const url = parentId ? `/api/categories/parent/${parentId}` : '/api/categories/parent';
        const res = await fetch(url);
        return res.ok ? res.json() : [];
    };

    // Charger les catégories niveau 0 et les stocker dans le localStorage
    useEffect(() => {
        const loadCategoriesLevel0 = async () => {
            const storedData = localStorage.getItem('categoriesLevel0');
            const lastFetch = localStorage.getItem('categoriesLastFetch');

            // Vérifier si les catégories sont déjà en cache et si elles sont récentes (< 5 min)
            if (storedData && lastFetch && (Date.now() - lastFetch < 5 * 60 * 1000)) {
                setCategoriesLevel0(JSON.parse(storedData));
                return;
            }

            // Sinon, récupérer les nouvelles données
            const categories = await fetchCategories();
            setCategoriesLevel0(categories);

            // Stocker dans le localStorage
            localStorage.setItem('categoriesLevel0', JSON.stringify(categories));
            localStorage.setItem('categoriesLastFetch', Date.now().toString());
        };

        loadCategoriesLevel0();
    }, []);

    // Fonction pour charger les sous-catégories au clic
    const handleCategoryClick = async (category, level) => {
        if (level === 0) {
            setCurrentCategoryLevel0(category);
            setIsLevel1DialogOpen(true);
            const subcategories = await fetchCategories(category.id);
            if (subcategories.length >= 1) {
                setCategoriesLevel1(subcategories);
            } else {
                await handleCategoryClick(category, 2);
            }
        } else if (level === 1) {
            setCurrentCategoryLevel1(category);
            setIsLevel2DialogOpen(true);
            const subcategories = await fetchCategories(category.id);
            if (subcategories.length >= 1) {
                setCategoriesLevel2(subcategories);
            } else {
                await handleCategoryClick(category, 2);
            }
        } else {
            router.push(`/admin/produits?categoryId=${category.id}`);
            closeAllDialogs();
        }
    };

    const closeAllDialogs = () => {
        setIsLevel1DialogOpen(false);
        setIsLevel2DialogOpen(false);
        setCurrentCategoryLevel0(null);
        setCurrentCategoryLevel1(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div>
            {/* Niveau 0 */}
            <div className={`fixed inset-0 flex justify-center items-center z-50 w-full ${!isLevel1DialogOpen && !isLevel2DialogOpen ? 'bg-black bg-opacity-50' : ''}`}>
                <div className="dialog-category p-6 rounded shadow-lg w-fit h-96 min-w-[300px]">
                    <div className="flex items-center justify-between">
                        <p className="font-bold text-lg w-full text-center">Rayons</p>
                        <button onClick={closeAllDialogs} className="w-10 h-10 flex items-center justify-center ml-2.5 closeDialogCategories">✖</button>
                    </div>
                    <div className={`grid ${categoriesLevel0.length >= 7 ? 'grid-cols-2 gap-4' : 'space-y-4'}`}>
                        {categoriesLevel0.map((category) => (
                            <div key={category.id} className="cursor-pointer p-2 category-0-selected" onClick={() => handleCategoryClick(category, 0)}>
                                {category.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Niveau 1 */}
            {isLevel1DialogOpen && currentCategoryLevel0 && (
                <div className={`fixed inset-0 flex justify-center items-center z-50 w-full ${!isLevel2DialogOpen ? 'bg-black bg-opacity-50' : ''}`}>
                    <div className="dialog-category p-6 rounded shadow-lg w-fit h-96 min-w-[300px]">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-lg w-full text-center">{currentCategoryLevel0?.name}</p>
                            <button onClick={() => setIsLevel1DialogOpen(false)} className="w-10 h-10 flex items-center justify-center ml-2.5 closeDialogCategories">✖</button>
                        </div>
                        <div className={`grid ${categoriesLevel1.length >= 7 ? 'grid-cols-2 gap-4' : 'space-y-4'}`}>
                            {categoriesLevel1.map((category) => (
                                <div key={category.id} className="cursor-pointer p-2 category-1-selected" onClick={() => handleCategoryClick(category, 1)}>
                                    {category.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Niveau 2 */}
            {isLevel2DialogOpen && currentCategoryLevel1 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 w-full">
                    <div className="dialog-category p-6 rounded shadow-lg w-fit h-96 min-w-[300px]">
                        <div className="flex items-center justify-between">
                            <p className="font-bold text-lg w-full text-center">{currentCategoryLevel1?.name}</p>
                            <button onClick={() => setIsLevel2DialogOpen(false)} className="w-10 h-10 flex items-center justify-center ml-2.5 closeDialogCategories">✖</button>
                        </div>
                        <div className={`grid ${categoriesLevel2.length >= 7 ? (categoriesLevel2.length >= 11 ? 'grid-cols-3 gap-4' : 'grid-cols-2 gap-4') : 'space-y-4'}`}>
                            {categoriesLevel2.map((category) => (
                                <div key={category.id} className="cursor-pointer p-2 category-2-selected" onClick={() => handleCategoryClick(category, 2)}>
                                    {category.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}