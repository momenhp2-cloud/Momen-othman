import { Check, Copy, ExternalLink, MessageCircle, Minus, Plus, X } from 'lucide-react';
import React, { useState } from 'react';
import { submitCustomerOrder } from '../services/storeService';
import {
  BLUEPRINT_LIMITS,
  CustomerFormValues,
  OrderLineItem,
  Product,
  StoreSettings,
} from '../types/store';
import {
  buildWhatsAppLink,
  calculateDeliveryFee,
  formatWhatsAppOrderMessage,
  generateOrderCode,
  validateCustomerForm,
} from '../utils/whatsapp';

interface QuickOrderModalProps {
  product: Product | null;
  settings: StoreSettings;
  onClose: () => void;
}

export function QuickOrderModal({ product, settings, onClose }: QuickOrderModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [form, setForm] = useState<CustomerFormValues>({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dispatched, setDispatched] = useState<{
    orderCode: string;
    waUrl: string;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const subtotal = Number((product.price * quantity).toFixed(2));
  const deliveryFee = calculateDeliveryFee(subtotal, settings);
  const total = Number((subtotal + deliveryFee).toFixed(2));

  async function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !settings.isOpen) return;

    const validationError = validateCustomerForm(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError(null);
    setSubmitting(true);

    const orderCode = generateOrderCode();
    const orderItems: OrderLineItem[] = [
      {
        productId: product.id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity,
        lineTotal: subtotal,
      },
    ];

    try {
      await submitCustomerOrder({
        orderCode,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerAddress: form.customerAddress,
        notes: form.notes,
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        orderType: 'quick',
      });

      const message = formatWhatsAppOrderMessage({
        orderCode,
        settings,
        items: orderItems,
        subtotal,
        deliveryFee,
        total,
        customer: form,
      });

      setDispatched({
        orderCode,
        waUrl: buildWhatsAppLink(settings.whatsappNumber, message),
        message,
      });
    } catch {
      setFormError('تعذر إرسال الطلب للسجل، يرجى المحاولة مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!dispatched) return;
    try {
      await navigator.clipboard.writeText(dispatched.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  function handleResetClose() {
    setDispatched(null);
    setQuantity(1);
    setFormError(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]">
      <div
        className="w-full max-w-md bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="طلب سريع عبر واتساب"
      >
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-900">
              {dispatched ? 'الطلب جاهز للإرسال' : 'طلب سريع إلى واتساب البائع'}
            </h2>
            <p className="text-xs text-zinc-500">
              {dispatched ? `رقم الطلب ${dispatched.orderCode}` : product.name}
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetClose}
            aria-label="إغلاق النافذة"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {dispatched ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <p className="font-display font-bold text-sm text-[#15803D] mb-1">
                  تم تجهيز طلبك السريع بنجاح
                </p>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  اضغط بالأسفل لإرسال رسالة الطلب مباشرة إلى واتساب صاحب المحل.
                </p>
              </div>

              <a
                href={dispatched.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>فتح واتساب وإرسال الطلب الآن</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-100 text-zinc-800 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-[#15803D]" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'تم نسخ نص الطلب' : 'نسخ نص الطلب'}</span>
              </button>

              <div className="border border-zinc-200 rounded-lg p-3 bg-zinc-50">
                <pre className="text-xs text-zinc-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {dispatched.message}
                </pre>
              </div>
            </div>
          ) : (
            <form onSubmit={handleQuickSubmit} className="space-y-4">
              {/* Product Summary + Stepper */}
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-zinc-900 truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {product.unit} ·{' '}
                    <span className="tabular-nums font-mono">
                      {product.price} {settings.currency}
                    </span>
                  </p>
                </div>

                <div className="flex items-center border border-zinc-300 rounded-lg bg-white shrink-0">
                  <button
                    type="button"
                    aria-label="زيادة الكمية"
                    onClick={() => setQuantity((q) => Math.min(50, q + 1))}
                    className="w-8 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-r-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-mono font-semibold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="تقليل الكمية"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-9 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 rounded-l-lg cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-600 px-1">
                <span>
                  التوصيل: {deliveryFee === 0 ? 'مجاني' : `${deliveryFee} ${settings.currency}`}
                </span>
                <span className="font-display text-sm font-bold text-zinc-900 tabular-nums">
                  الإجمالي: {total} {settings.currency}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">الاسم *</label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.customerNameMax}
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    placeholder="اكتب اسمك"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    رقم الهاتف *
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
                    عنوان التوصيل *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.customerAddressMax}
                    value={form.customerAddress}
                    onChange={(e) => setForm({ ...form, customerAddress: e.target.value })}
                    placeholder="الحي، الشارع، رقم المنزل"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    ملاحظات (اختياري)
                  </label>
                  <input
                    type="text"
                    maxLength={BLUEPRINT_LIMITS.notesMax}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="أي تفاصيل إضافية للبائع"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !settings.isOpen}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] disabled:bg-zinc-300 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>{submitting ? 'جاري التجهيز...' : 'إرسال الطلب عبر واتساب'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
