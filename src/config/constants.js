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
    'preparation': 'en préparation',
    'prepared': 'préparée',
    'delivery': 'en cours de livraison',
    'delivered': 'livrée',
    'recovery': 'à récupérer',
    'recovered': 'récupérée'
}

export const STATUS_FLOW = {
    validated: ["preparation"],
    preparation: ["prepared"],
    prepared: ["delivery", "recovery"],
    delivery: ["delivered"],
    recovery: ["recovered"],
};