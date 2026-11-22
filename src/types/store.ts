export type ProductCategory =
  | 'vegetables'
  | 'dairy'
  | 'bakery'
  | 'pantry'
  | 'drinks'
  | 'household';

export type OrderStatus = 'new' | 'preparing' | 'delivered' | 'cancelled';
export type OrderType = 'cart' | 'quick';

export interface StoreSettings {
  shopName: string;
  shopSubtitle: string;
  whatsappNumber: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryMin: number;
  isOpen: boolean;
  workingHours: string;
  address: string;
  updatedAt?: unknown;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  price: number;
  imageUrl: string;
  description?: string;
  inStock: boolean;
  featured: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderLineItem {
  productId: string;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  items: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  orderType: OrderType;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CustomerFormValues {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes: string;
}

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  vegetables: 'خضروات وفواكه',
  dairy: 'ألبان وأجبان',
  bakery: 'مخبوزات طازجة',
  pantry: 'بقالة ومعلبات',
  drinks: 'عصائر ومشروبات',
  household: 'منظفات وعناية',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'طلب جديد',
  preparing: 'قيد التجهيز',
  delivered: 'تم التسليم',
  cancelled: 'ملغي',
};

export const BLUEPRINT_LIMITS = {
  shopNameMin: 2,
  shopNameMax: 80,
  shopSubtitleMax: 180,
  whatsappRegex: /^[0-9]{7,20}$/,
  currencyMax: 12,
  workingHoursMax: 80,
  addressMax: 160,
  productNameMin: 2,
  productNameMax: 100,
  unitMax: 40,
  imageUrlMax: 500,
  descriptionMax: 300,
  customerNameMin: 2,
  customerNameMax: 80,
  customerPhoneRegex: /^[0-9+\-\s]{6,24}$/,
  customerAddressMin: 3,
  customerAddressMax: 220,
  notesMax: 300,
  maxOrderItems: 50,
} as const;
