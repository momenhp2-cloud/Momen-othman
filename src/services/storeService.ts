import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { SEED_PRODUCTS } from '../data/seedCatalog';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  BLUEPRINT_LIMITS,
  OrderLineItem,
  OrderRecord,
  OrderStatus,
  OrderType,
  Product,
  ProductCategory,
  StoreSettings,
} from '../types/store';

export function subscribeStoreSettings(
  onData: (settings: StoreSettings | null) => void
): () => void {
  const path = 'storeSettings/default';
  return onSnapshot(
    doc(db, 'storeSettings', 'default'),
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as StoreSettings);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

function toMillisSafe(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (val && typeof val === 'object' && 'toMillis' in val && typeof (val as { toMillis: unknown }).toMillis === 'function') {
    return (val as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function subscribeProducts(
  onData: (products: Product[], fromServer: boolean) => void
): () => void {
  const path = 'products';
  const q = query(collection(db, path), where('price', '>', 0));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Product[] = snapshot.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Product, 'id'>),
        }))
        .sort((a, b) => toMillisSafe(b.createdAt) - toMillisSafe(a.createdAt));
      onData(items, true);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export function subscribeOrders(onData: (orders: OrderRecord[]) => void): () => void {
  const path = 'orders';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: OrderRecord[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<OrderRecord, 'id'>),
      }));
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const path = 'storeSettings/default';
  const payload = {
    shopName: settings.shopName.trim().slice(0, BLUEPRINT_LIMITS.shopNameMax),
    shopSubtitle: (settings.shopSubtitle || '').trim().slice(0, BLUEPRINT_LIMITS.shopSubtitleMax),
    whatsappNumber: settings.whatsappNumber.replace(/[^0-9]/g, '').slice(0, 20),
    currency: settings.currency.trim().slice(0, BLUEPRINT_LIMITS.currencyMax) || 'ج.م',
    deliveryFee: Math.max(0, Math.min(5000, Number(settings.deliveryFee) || 0)),
    freeDeliveryMin: Math.max(0, Math.min(50000, Number(settings.freeDeliveryMin) || 0)),
    isOpen: Boolean(settings.isOpen),
    workingHours: (settings.workingHours || '').trim().slice(0, BLUEPRINT_LIMITS.workingHoursMax),
    address: (settings.address || '').trim().slice(0, BLUEPRINT_LIMITS.addressMax),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'storeSettings', 'default'), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface ProductInput {
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  imageUrl: string;
  description?: string;
  inStock: boolean;
  featured: boolean;
}

export async function createProduct(input: ProductInput): Promise<void> {
  const safeId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `products/${safeId}`;
  const payload = {
    name: input.name.trim().slice(0, BLUEPRINT_LIMITS.productNameMax),
    category: input.category,
    unit: input.unit.trim().slice(0, BLUEPRINT_LIMITS.unitMax),
    price: Math.max(0.5, Math.min(100000, Number(input.price))),
    imageUrl: input.imageUrl.trim().slice(0, BLUEPRINT_LIMITS.imageUrlMax),
    description: (input.description || '').trim().slice(0, BLUEPRINT_LIMITS.descriptionMax),
    inStock: Boolean(input.inStock),
    featured: Boolean(input.featured),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'products', safeId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateProduct(productId: string, input: ProductInput): Promise<void> {
  const path = `products/${productId}`;
  const payload = {
    name: input.name.trim().slice(0, BLUEPRINT_LIMITS.productNameMax),
    category: input.category,
    unit: input.unit.trim().slice(0, BLUEPRINT_LIMITS.unitMax),
    price: Math.max(0.5, Math.min(100000, Number(input.price))),
    imageUrl: input.imageUrl.trim().slice(0, BLUEPRINT_LIMITS.imageUrlMax),
    description: (input.description || '').trim().slice(0, BLUEPRINT_LIMITS.descriptionMax),
    inStock: Boolean(input.inStock),
    featured: Boolean(input.featured),
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'products', productId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function toggleProductStock(productId: string, inStock: boolean): Promise<void> {
  const path = `products/${productId}`;
  try {
    await updateDoc(doc(db, 'products', productId), {
      inStock,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  const path = `products/${productId}`;
  try {
    await deleteDoc(doc(db, 'products', productId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function seedDefaultCatalog(defaultSettings: StoreSettings): Promise<void> {
  try {
    const batch = writeBatch(db);
    SEED_PRODUCTS.forEach((item) => {
      const ref = doc(db, 'products', item.id);
      batch.set(ref, {
        name: item.name,
        category: item.category,
        unit: item.unit,
        price: item.price,
        imageUrl: item.imageUrl,
        description: item.description || '',
        inStock: item.inStock,
        featured: item.featured,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    const settingsRef = doc(db, 'storeSettings', 'default');
    batch.set(
      settingsRef,
      {
        shopName: defaultSettings.shopName,
        shopSubtitle: defaultSettings.shopSubtitle,
        whatsappNumber: defaultSettings.whatsappNumber,
        currency: defaultSettings.currency,
        deliveryFee: defaultSettings.deliveryFee,
        freeDeliveryMin: defaultSettings.freeDeliveryMin,
        isOpen: defaultSettings.isOpen,
        workingHours: defaultSettings.workingHours,
        address: defaultSettings.address,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'products/batch_seed');
  }
}

export async function submitCustomerOrder(params: {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
  items: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  orderType: OrderType;
}): Promise<string> {
  const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `orders/${orderId}`;
  const trimmedNotes = params.notes.trim().slice(0, BLUEPRINT_LIMITS.notesMax);

  const payload: Record<string, unknown> = {
    orderCode: params.orderCode.replace(/[^A-Z0-9-]/g, '').slice(0, 24),
    customerName: params.customerName.trim().slice(0, BLUEPRINT_LIMITS.customerNameMax),
    customerPhone: params.customerPhone.trim().slice(0, 24),
    customerAddress: params.customerAddress.trim().slice(0, BLUEPRINT_LIMITS.customerAddressMax),
    items: params.items.slice(0, BLUEPRINT_LIMITS.maxOrderItems),
    subtotal: Number(params.subtotal),
    deliveryFee: Number(params.deliveryFee),
    total: Number(params.total),
    status: 'new' as OrderStatus,
    orderType: params.orderType,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (trimmedNotes) {
    payload.notes = trimmedNotes;
  }

  try {
    await setDoc(doc(db, 'orders', orderId), payload);
    return orderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const path = `orders/${orderId}`;
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
