import { Check, Copy, ExternalLink, MessageCircle, Minus, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { submitCustomerOrder } from '../services/storeService';
import {
  BLUEPRINT_LIMITS,
  CartItem,
  CustomerFormValues,
  OrderLineItem,
  StoreSettings,
} from '../types/store';
import {
  buildWhatsAppLink,
  calculateDeliveryFee,
  formatWhatsAppOrderMessage,
  generateOrderCode,
  validateCustomerForm,
} from '../utils/whatsapp';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onUpdateQuantity: (productId: string, nextQty: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

interface DispatchedOrderState {
  orderCode: string;
  waUrl: string;
  message: string;
  total: number;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  settings,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartDrawerProps) {
  const [form, setForm] = useState<CustomerFormValues>({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState<DispatchedOrderState | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const subtotal = items.reduce(
    (sum, entry) => sum + entry.product.price * entry.quantity,
    0
  );
  const deliveryFee = calculateDeliveryFee(subtotal, settings);
  const total = subtotal + deliveryFee;
  const remainingForFree =
    settings.freeDeliveryMin > 0 ? Math.max(0, settings.freeDeliveryMin - subtotal) : 0;

  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || !settings.isOpen) return;

    const validationError = validateCustomerForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const orderCode = generateOrderCode();
    const orderItems: OrderLineItem[] = items
      .slice(0, BLUEPRINT_LIMITS.maxOrderItems)
      .map((entry) => ({
        productId: entry.product.id,
        name: entry.product.name,
        unit: entry.product.unit,
        price: entry.product.price,
        quantity: entry.quantity,
        lineTotal: Number((entry.product.price * entry.quantity).toFixed(2)),
      }));

    try {
      await submitCustomerOrder({
        orderCode,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        notes: form.notes,
        items: orderItems,
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2)),
        orderType: 'cart',
      });

      const message = formatWhatsAppOrderMessage({
        orderCode,
        settings,
        items: orderItems,
        subtotal: Number(subtotal.toFixed(2)),
        deliveryFee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2)),
        customer: form,
      });

      const waUrl = buildWhatsAppLink(settings.whatsappNumber, message);
      setDispatched({
        orderCode,
        waUrl,
        message,
        total: Number(total.toFixed(2)),
      });
      onClearCart();
    } catch {
      setFormError('تعذر حفظ الطلب في السجل السحابي، يمكنك المحاولة مجدداً.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyMessage() {
    if (!dispatched) return;
    try {
      await navigator.clipboard.writeText(dispatched.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function handleCloseAndReset() {
    setDispatched(null);
    setFormError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-[1px]">
      <div
        className="w-full max-w-md bg-white h-full flex flex-col border-s border-zinc-200 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="سلة المشتريات وإرسال الطلب"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-900">
              {dispatched ? 'الطلب جاهز للإرسال' : 'سلة المشتريات'}
            </h2>
            <p className="text-xs text-zinc-500">
              {dispatched
                ? `مرجع الطلب ${dispatched.orderCode}`
                : `${items.reduce((acc, i) => acc + i.quantity, 0)} أصناف مختارة`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCloseAndReset}
            aria-label="إغلاق السلة"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {dispatched ? (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-zinc-900">
                <p className="font-display font-bold text-base text-[#15803D] mb-1">
                  تم تسجيل طلبك بنجاح ({dispatched.orderCode})
                </p>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  اضغط على الزر الأخضر بالأسفل لفتح محادثة واتساب مع البائع وإرسال الفاتورة الجاهزة مباشرة.
                </p>
              </div>

              <a
                href={dispatched.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>إرسال الطلب الآن إلى واتساب البائع</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <button
                type="button"
                onClick={handleCopyMessage}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 text-zinc-800 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ تفاصيل الطلب' : 'نسخ نص الطلب لإرساله يدوياً'}</span>
              </button>

              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50">
                <p className="text-xs font-semibold text-zinc-500 mb-2">معاينة الرسالة المرسلة للبائع:</p>
                <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {dispatched.message}
                </pre>
              </div>

              <button
                type="button"
                onClick={handleCloseAndReset}
                className="w-full py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
              >
                متابعة التسوق
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="font-display text-base font-bold text-zinc-800">السلة فارغة حالياً</p>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
                أضف احتياجاتك اليومية من القائمة أو استخدم زر الطلب السريع على أي منتج لإرساله مباشرة عبر واتساب.
              </p>
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="mt-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <>
              {/* Free Delivery Notice */}
              {settings.freeDeliveryMin > 0 && (
                <div className="px-4 py-3 rounded-lg bg-zinc-100 text-xs text-zinc-700 leading-relaxed">
                  {remainingForFree === 0 ? (
                    <span className="font-semibold text-[#15803D]">
                      طلبك مؤهل للتوصيل المجاني.
                    </span>
                  ) : (
                    <span>
                      أضف منتجات بقيمة{' '}
                      <strong className="tabular-nums font-mono">
                        {remainingForFree} {settings.currency}
                      </strong>{' '}
                      للحصول على توصيل مجاني.
                    </span>
                  )}
                </div>
              )}

              {/* Cart Items List */}
              <div className="divide-y divide-zinc-200 border-y border-zinc-200">
                {items.map(({ product, quantity }) => (
                  <div key={product.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-zinc-900 truncate">
                        {product.name}
                      </h4>
                      <div className="text-xs text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <span>{product.unit}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-mono">
                          {product.price} {settings.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-zinc-200 rounded-lg bg-zinc-50">
                        <button
                          type="button"
                          aria-label="زيادة"
                          onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                          className="w-7 h-8 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 rounded-r-lg cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-xs font-mono font-semibold tabular-nums">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="إنقاص"
                          onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                          className="w-7 h-8 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 rounded-l-lg cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        aria-label="حذف الصنف"
                        onClick={() => onRemoveItem(product.id)}
                        className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-zinc-600">
                  <span>المجموع الفرعي</span>
                  <span className="tabular-nums font-mono">
                    {subtotal.toFixed(2).replace(/\.00$/, '')} {settings.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-600">
                  <span>رسوم التوصيل</span>
                  <span className="tabular-nums font-mono">
                    {deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ${settings.currency}`}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 font-display text-base font-bold text-zinc-900">
                  <span>الإجمالي النهائي</span>
                  <span className="tabular-nums font-mono">
                    {total.toFixed(2).replace(/\.00$/, '')} {settings.currency}
                  </span>
                </div>
              </div>

              {/* Customer Delivery Form */}
              <form id="cart-checkout-form" onSubmit={handleSubmitOrder} className="space-y-3.5 pt-2">
                <h3 className="font-display text-sm font-bold text-zinc-900">
                  بيانات التوصيل وإرسال الطلب
                </h3>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.customerNameMax}
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="مثال: أحمد محمد"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    رقم الهاتف للتواصل *
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    maxLength={24}
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    placeholder="01012345678"
                    className="w-full h-10 px-3 text-sm text-right border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    العنوان بالتفصيل *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.customerAddressMax}
                    value={form.customerAddress}
                    onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                    placeholder="الحي، الشارع، رقم العمارة والشقة"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    ملاحظات إضافية للبائع (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={BLUEPRINT_LIMITS.notesMax}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="مثال: الخضار يكون متوسط النضج، أو الاتصال عند الوصول"
                    className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                {formError && (
                  <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                {!settings.isOpen && (
                  <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    المتجر مغلق حالياً لاستقبال الطلبات.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !settings.isOpen}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] disabled:bg-zinc-300 disabled:text-zinc-500 transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>{submitting ? 'جاري تجهيز الطلب...' : 'تأكيد وإرسال عبر واتساب'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
