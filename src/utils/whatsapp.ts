import {
  BLUEPRINT_LIMITS,
  CustomerFormValues,
  OrderLineItem,
  StoreSettings,
} from '../types/store';

export function sanitizeWhatsappNumber(raw: string): string {
  return raw.replace(/[^0-9]/g, '').slice(0, 20);
}

export function generateOrderCode(): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${num}`;
}

export function calculateDeliveryFee(subtotal: number, settings: StoreSettings): number {
  if (subtotal <= 0) return 0;
  if (settings.freeDeliveryMin > 0 && subtotal >= settings.freeDeliveryMin) {
    return 0;
  }
  return Math.max(0, settings.deliveryFee);
}

export function validateCustomerForm(values: CustomerFormValues): string | null {
  const name = values.customerName.trim();
  const phone = values.customerPhone.trim();
  const address = values.customerAddress.trim();
  const notes = values.notes.trim();

  if (name.length < BLUEPRINT_LIMITS.customerNameMin || name.length > BLUEPRINT_LIMITS.customerNameMax) {
    return 'يرجى إدخال اسم صحيح (من 2 إلى 80 حرفاً).';
  }
  if (!BLUEPRINT_LIMITS.customerPhoneRegex.test(phone)) {
    return 'يرجى إدخال رقم هاتف صحيح (أرقام من 6 إلى 24 خانة).';
  }
  if (
    address.length < BLUEPRINT_LIMITS.customerAddressMin ||
    address.length > BLUEPRINT_LIMITS.customerAddressMax
  ) {
    return 'يرجى إدخال عنوان التوصيل بوضوح.';
  }
  if (notes.length > BLUEPRINT_LIMITS.notesMax) {
    return 'الملاحظات طويلة جداً (الحد الأقصى 300 حرف).';
  }
  return null;
}

export function formatWhatsAppOrderMessage(params: {
  orderCode: string;
  settings: StoreSettings;
  items: OrderLineItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  customer: CustomerFormValues;
}): string {
  const { orderCode, settings, items, subtotal, deliveryFee, total, customer } = params;

  const lines: string[] = [
    `*طلب جديد — ${settings.shopName}*`,
    `رقم الطلب: ${orderCode}`,
    `────────────────────`,
    `*الأصناف المطلوبة:*`,
  ];

  items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.name} (${item.unit}) × ${item.quantity} = ${item.lineTotal} ${settings.currency}`
    );
  });

  lines.push(`────────────────────`);
  lines.push(`المجموع الفرعي: ${subtotal} ${settings.currency}`);
  lines.push(
    `التوصيل: ${deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ${settings.currency}`}`
  );
  lines.push(`*الإجمالي المطلوب: ${total} ${settings.currency}*`);
  lines.push(`────────────────────`);
  lines.push(`*بيانات العميل:*`);
  lines.push(`الاسم: ${customer.customerName.trim()}`);
  lines.push(`الهاتف: ${customer.customerPhone.trim()}`);
  lines.push(`العنوان: ${customer.customerAddress.trim()}`);
  if (customer.notes.trim()) {
    lines.push(`ملاحظات: ${customer.notes.trim()}`);
  }

  return lines.join('\n');
}

export function buildWhatsAppLink(whatsappNumber: string, message: string): string {
  const cleanPhone = sanitizeWhatsappNumber(whatsappNumber).replace(/^00+/, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
