export interface Cart {
    id: string;
    user_id: string | null;
    products: [] | null;
    status: string | null;
    amount: number | null;
}