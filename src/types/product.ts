export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
  // FastFood integration fields
  source_type?: "local" | "fastfood" | "skyvenda";
  external_product_id?: number | null;
  // Store original product ID for PDV products
  pdv_product_id?: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}
