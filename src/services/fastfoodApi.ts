// FastFood API endpoints needed by SkyPDV
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from "./api";

export interface FastFoodRestaurant {
  id: number;
  user_id: number;
  name: string;
  category: string | null;
  is_open: boolean;
  active: boolean;
  phone?: string;
  address?: string;
}

// Alias for consistency with Fastfood project type names
export type Restaurant = FastFoodRestaurant;

export interface OrderStatusUpdate {
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled" | "rejected";
}

export type TableShape = "square" | "rectangle" | "circle";
export type TableStatus = "available" | "occupied" | "reserved";

export interface OrderItemCreate {
  item_type: "menu_item" | "drink";
  item_id: number;
  quantity: number;
}

export interface OrderCreate {
  restaurant_id: number;
  order_type: "local" | "distance";
  payment_method: string;
  items: OrderItemCreate[];
  customer_name?: string;
  customer_phone?: string;
  tab_id?: number;
  table_id?: number;
}

export interface Order {
  id: number;
  restaurant_id: number;
  user_id: number;
  status: string;
  total_value: string;
  tab_id?: number;
  table_id?: number;
  created_at: string;
  customer_name?: string;
  items?: Array<{ product_name: string; quantity: number; price: string }>;
}

export type FastFoodOrder = Order;

export interface Tab {
  id: number;
  restaurant_id: number;
  client_name: string;
  client_phone?: string;
  status: "open" | "closed";
  current_balance: number;
  created_at: string;
}

export interface TabCreate {
  client_name: string;
  client_phone?: string;
}

export interface RestaurantTable {
  id: number;
  restaurant_id: number;
  table_number: string;
  seats: number;
  shape: TableShape;
  width: number;
  height: number;
  position_x: number;
  position_y: number;
  status: TableStatus;
  created_at: string;
  updated_at: string;
}

export interface TableCreate {
  table_number: string;
  seats: number;
  shape: TableShape;
  width?: number;
  height?: number;
  position_x?: number;
  position_y?: number;
}

export interface TableUpdate {
  table_number?: string;
  seats?: number;
  shape?: TableShape;
  width?: number;
  height?: number;
  position_x?: number;
  position_y?: number;
  status?: TableStatus;
}

export interface TablePositionUpdate {
  position_x: number;
  position_y: number;
}

export interface FastFoodProduct {
  id: number;
  name: string;
  category: string | null;
  price: number;
  image: string | null;
  emoji: string | null;
  description: string | null;
  is_active: boolean;
  is_fastfood: boolean;
}

export const fastfoodApi = {
  getMyRestaurants: () => apiGet<FastFoodRestaurant[]>("/fastfood/restaurants/mine"),
  getRestaurant: (id: number) => apiGet<FastFoodRestaurant>(`/fastfood/restaurants/${id}`),
  getMenus: (restaurantId: number) =>
    apiGet<Array<{ id: number; name: string; items: Array<{ id: number; name: string; price: string; emoji?: string }> }>>(
      `/fastfood/restaurants/${restaurantId}/menus/`
    ),
  getDrinks: (restaurantId: number) =>
    apiGet<Array<{ id: number; name: string; price: string; stock: number; emoji?: string }>>(
      `/fastfood/restaurants/${restaurantId}/drinks/`
    ),
  // Tables
  getTables: (restaurantId: number) => apiGet<RestaurantTable[]>(`/fastfood/restaurants/${restaurantId}/tables`),
  createTable: (restaurantId: number, data: TableCreate) =>
    apiPost<RestaurantTable>(`/fastfood/restaurants/${restaurantId}/tables`, data),
  updateTable: (restaurantId: number, tableId: number, data: TableUpdate) =>
    apiPut<RestaurantTable>(`/fastfood/restaurants/${restaurantId}/tables/${tableId}`, data),
  updateTablePosition: (restaurantId: number, tableId: number, position: TablePositionUpdate) =>
    apiPatch<RestaurantTable>(`/fastfood/restaurants/${restaurantId}/tables/${tableId}/position`, position),
  deleteTable: (restaurant_id: number, tableId: number) =>
    apiDelete<{ message: string; success: boolean }>(`/fastfood/restaurants/${restaurant_id}/tables/${tableId}`),

  // Orders
  createOrder: (data: OrderCreate) => apiPost<Order>("/fastfood/orders/", data),
  getRestaurantOrders: (restaurantId: number) =>
    apiGet<Order[]>(`/fastfood/restaurants/${restaurantId}/orders/`),

  // Tabs
  getTabs: (restaurantId: number, status?: "open" | "closed" | null) =>
    apiGet<Tab[]>(`/fastfood/restaurants/${restaurantId}/tabs${status ? `?status=${status}` : ""}`),
  createTab: (restaurantId: number, data: TabCreate) =>
    apiPost<Tab>(`/fastfood/restaurants/${restaurantId}/tabs`, data),
  getTab: (tabId: number) => apiGet<Tab>(`/fastfood/tabs/${tabId}`),
  updateTab: (restaurantId: number, tabId: number, data: { status?: "open" | "closed"; client_name?: string; client_phone?: string }, paymentMethod?: string) => {
    const url = `/fastfood/restaurants/${restaurantId}/tabs/${tabId}${paymentMethod ? `?payment_method=${paymentMethod}` : ""}`;
    return apiPut<Tab>(url, data);
  },
  getTabOrders: (restaurantId: number, tabId: number) =>
    apiGet<Order[]>(`/fastfood/restaurants/${restaurantId}/tabs/${tabId}/orders`),

  // Admin / Management
  updateOrderStatus: (orderId: number, data: OrderStatusUpdate) =>
    apiPut<Order>(`/fastfood/orders/${orderId}/status`, data),

  toggleRestaurantStatus: (restaurantId: number) =>
    apiPost<{ message: string; is_open: boolean }>(`/fastfood/restaurants/${restaurantId}/toggle`),

  // Products
  getFastfoodProducts: (restaurantId: number) =>
    apiGet<FastFoodProduct[]>(`/fastfood/restaurants/${restaurantId}/fastfood-products`),
};

