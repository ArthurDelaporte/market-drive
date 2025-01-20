'use client';

import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";

export default function DialogCategory({ isOpen, onClose }) {
    const router = useRouter();

    const [categoryTree, setCategoryTree] = useState([]); // Arbre complet des catégories
    const [currentCategoryLevel0, setCurrentCategoryLevel0] = useState(null);
    const [currentCategoryLevel1, setCurrentCategoryLevel1] = useState(null);

    const [categoriesLevel1, setCategoriesLevel1] = useState(null);
    const [lengthCategory1, setLengthCategory1] = useState(0);
    const [categoriesLevel2, setCategoriesLevel2] = useState(null);
    const [lengthCategory2, setLengthCategory2] = useState(0);

    const [isLevel1DialogOpen, setIsLevel1DialogOpen] = useState(false);
    const [isLevel2DialogOpen, setIsLevel2DialogOpen] = useState(false);


    // Construire l'arborescence des catégories
    useEffect(() => {
        const buildCategoryTree = async () => {
            try {
                // Récupérer les catégories de niveau 0
                const fetchCategories = async (parentId) => {
                    const res = await fetch(parentId ? `/api/categories/parent/${parentId}` : '/api/categories/parent');
                    return res.ok ? res.json() : [];
                };

                const categoriesLevel0 = await fetchCategories();

                const categoryTreeData = await Promise.all(
                    categoriesLevel0.map(async (category) => {
                        const level1 = await fetchCategories(category.id);

                        const level1WithChildren = await Promise.all(
                            level1.map(async (subcategory) => {
                                const level2 = await fetchCategories(subcategory.id);
                                return {
                                    ...subcategory,
                                    childrenCount: level2.length,
                                    children: level2,
                                };
                            })
                        );

                        return {
                            ...category,
                            childrenCount: level1WithChildren.length,
                            children: level1WithChildren,
                        };
                    })
                );

                setCategoryTree(categoryTreeData); // Enregistrer l’arborescence complète
            } catch (error) {
                console.error('Erreur lors de la construction de l’arborescence des catégories :', error);
            }
        };

        buildCategoryTree();
    }, []);

    const getCategoryInfo = (categoryId, level) => {
        for (const category of categoryTree) {
            if (level === 0) {
                if (category.id === categoryId) {
                    return category;
                }
            } else {
                if (category.id === currentCategoryLevel0.id) {
                    for (const subcategory of category.children) {
                        if (subcategory.id === categoryId) {
                            return subcategory;
                        }
                    }
                }
            }
        }
    }

    const clickCategory = (category, level) => {
        if (level === 0) {
            setCurrentCategoryLevel0(category);
            const categoryInfo = getCategoryInfo(category.id, level)
            if (categoryInfo.childrenCount > 0) {
                setCategoriesLevel1(categoryInfo.children)
                setLengthCategory1(categoryInfo.childrenCount);
                setIsLevel1DialogOpen(true);
            } else {
                closeAllDialogs(0);
                router.push(`/produits?categoryId=${category.id}`);
            }
        } else if (level === 1) {
            setCurrentCategoryLevel1(category);
            const categoryInfo = getCategoryInfo(category.id, level)
            if (categoryInfo.childrenCount > 0) {
                setCategoriesLevel2(categoryInfo.children)
                setLengthCategory2(categoryInfo.childrenCount);
                setIsLevel2DialogOpen(true);
            } else {
                closeAllDialogs(0);
                closeAllDialogs(1);
                router.push(`/produits?categoryId=${category.id}`);
            }
        } else {
            closeAllDialogs(0);
            closeAllDialogs(1);
            closeAllDialogs(2);
            router.push(`/produits?categoryId=${category.id}`);
        }
    };

    const closeAllDialogs = (level) => {
        if (level === 0) {
            setCurrentCategoryLevel0(null);
            onClose();
        }
        else if (level === 1) {
            setCurrentCategoryLevel0(null);
            setIsLevel1DialogOpen(false);
        }
        else if (level === 2) {
            setCurrentCategoryLevel1(null);
            setIsLevel2DialogOpen(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div>
            {/* Main categories */}
            <div
                className={`fixed inset-0 flex justify-center items-center z-50 w-full ${
                    (!isLevel1DialogOpen && !isLevel2DialogOpen) ? 'bg-black bg-opacity-50' : ''
                }`}
            >
                <div className="dialog-category p-6 rounded shadow-lg w-fit h-96 min-w-[300px]">
                    <div className="flex items-center justify-between">
                        <div className="w-full text-center">
                            <p className="font-bold text-lg">Rayons</p>
                        </div>
                        <button
                            onClick={() => {
                                closeAllDialogs(0)
                            }}
                            className="w-10 h-10 flex items-center justify-center ml-2.5"
                        >
                            ✖
                        </button>
                    </div>
                    {categoryTree.length >= 7 ? (
                        <div className="grid grid-cols-2 gap-4">
                            {categoryTree.map((category) => (
                                <div
                                    key={category.id}
                                    className="cursor-pointer p-2 category-0-selected"
                                    onClick={() => {
                                        clickCategory(category, 0);
                                    }}
                                >
                                    {category.name}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {categoryTree.map((category) => (
                                <div
                                    key={category.id}
                                    className="cursor-pointer p-2 category-0-selected"
                                    onClick={() => {
                                        clickCategory(category, 0);
                                    }}
                                >
                                    {category.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Level 1 Dialog */}
            {isLevel1DialogOpen && currentCategoryLevel0 && (
                <div
                    className={`fixed inset-0 flex justify-center items-center z-50 w-full ${
                        (!isLevel2DialogOpen) ? 'bg-black bg-opacity-50' : ''
                    }`}
                >
                    <div className="dialog-category p-6 rounded shadow-lg w-fit h-96 min-w-[300px]">
                        <div className="flex items-center justify-between">
                            <div className="w-full text-center">
                                <p className="font-bold text-lg">{currentCategoryLevel0?.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    closeAllDialogs(1)
                                }}
                                className="w-10 h-10 flex items-center justify-center ml-2.5"
                            >
                                ✖
                            </button>
                        </div>
                        {lengthCategory1 >= 7 ? (
                            <div className="grid grid-cols-2 gap-4">
                                {categoriesLevel1.map((category) => (
                                    <div
                                        key={category.id}
                                        className="cursor-pointer p-2 category-1-selected"
                                        onClick={() => {
                                            clickCategory(category, 1);
                                        }}
                                    >
                                        {category.name}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {categoriesLevel1.map((category) => (
                                    <div
                                        key={category.id}
                                        className="cursor-pointer p-2 category-1-selected"
                                        onClick={() => {
                                            clickCategory(category, 1);
                                        }}
                                    >
                                        {category.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Level 2 Dialog */}
            {isLevel2DialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 w-full">
                    <div className="dialog-category p-6 rounded shadow-lg w-fit h-96 min-w-[300px]">
                        <div className="flex items-center justify-between">
                            <div className="w-full text-center">
                                <p className="font-bold text-lg">{currentCategoryLevel1?.name}</p>
                            </div>
                            <button
                                onClick={() => {
                                    closeAllDialogs(2)
                                }}
                                className="w-10 h-10 flex items-center justify-center ml-2.5"
                            >
                                ✖
                            </button>
                        </div>
                        {lengthCategory2 >= 7 ? (
                            <div>
                                {lengthCategory2 >= 11 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {categoriesLevel2.map((category) => (
                                            <div
                                                key={category.id}
                                                className="cursor-pointer p-2 category-2-selected"
                                                onClick={() => clickCategory(category, 2)}
                                            >
                                                {category.name}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {categoriesLevel2.map((category) => (
                                            <div
                                                key={category.id}
                                                className="cursor-pointer p-2 category-2-selected"
                                                onClick={() => clickCategory(category, 2)}
                                            >
                                                {category.name}
                                            </div>
                                        ))}
                                    </div>
                                )
                                }
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {categoriesLevel2.map((category) => (
                                    <div
                                        key={category.id}
                                        className="cursor-pointer p-2 category-2-selected"
                                        onClick={() => clickCategory(category, 2)}
                                    >
                                        {category.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}