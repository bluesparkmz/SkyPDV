// IndexedDB helper para pedidos de cozinha locais (sem API).
// Guarda os pedidos no browser por pelo menos 24 horas.

export interface KitchenOrder {
  id: string; // UUID gerado localmente
  ticketNumber: number;
  tableOrClient: string; // nome do cliente ou mesa
  items: string[]; // lista de itens/instruções livres
  notes: string; // observações gerais
  status: "pending" | "preparing" | "done";
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

const DB_NAME = "skypdv_kitchen";
const STORE_NAME = "orders";
const DB_VERSION = 1;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
        store.createIndex("status", "status", { unique: false });
      }
    };

    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db!);
    };

    req.onerror = () => reject(req.error);
  });
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function createKitchenOrder(
  data: Omit<KitchenOrder, "id" | "createdAt" | "updatedAt" | "status" | "ticketNumber">
): Promise<KitchenOrder> {
  const db = await openDB();

  // Determinar próximo número de ticket do dia
  const today = new Date().toISOString().slice(0, 10);
  const all = await listKitchenOrders();
  const todayOrders = all.filter((o) => o.createdAt.startsWith(today));
  const ticketNumber = todayOrders.length + 1;

  const now = new Date().toISOString();
  const order: KitchenOrder = {
    id: generateId(),
    ticketNumber,
    tableOrClient: data.tableOrClient,
    items: data.items,
    notes: data.notes,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).add(order);
    req.onsuccess = () => resolve(order);
    req.onerror = () => reject(req.error);
  });
}

export async function listKitchenOrders(): Promise<KitchenOrder[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => {
      const all: KitchenOrder[] = req.result || [];
      // Filtrar apenas últimas 24h
      const cutoff = Date.now() - TTL_MS;
      resolve(all.filter((o) => new Date(o.createdAt).getTime() >= cutoff));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function updateKitchenOrderStatus(
  id: string,
  status: KitchenOrder["status"]
): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const order: KitchenOrder = getReq.result;
      if (!order) return reject(new Error("Pedido não encontrado"));
      order.status = status;
      order.updatedAt = new Date().toISOString();
      const putReq = store.put(order);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export async function deleteKitchenOrder(id: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/** Remove pedidos mais antigos que 24h (limpeza automática). */
export async function purgeOldKitchenOrders(): Promise<void> {
  const db = await openDB();
  const cutoff = Date.now() - TTL_MS;

  const all: KitchenOrder[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const old = all.filter((o) => new Date(o.createdAt).getTime() < cutoff);

  for (const o of old) {
    await deleteKitchenOrder(o.id);
  }
}
