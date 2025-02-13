// Liste des pages publiques accessibles sans authentification
export const PUBLIC_PAGES = [
    '/',
    '/connexion',
    '/inscription',
    '/produits',
    '/contact',
];

export const PRODUCTS_UNITIES = [
    'pièce',
    'kg', 'g', 'mg',
    'L', 'cL', 'mL',
]

export const PRODUCTS_STATUS = {
    'waiting': 'en attente',
    'paid': 'payée',
    'validated': 'validée et payée',
    'prepared': 'préparée',
    'finished': 'à récupérer',
    'recovered': 'récupérée'
}