import { User, signInWithPopup, signOut } from 'firebase/auth';
import {
  Check,
  ExternalLink,
  LogIn,
  LogOut,
  MessageCircle,
  PackagePlus,
  Pencil,
  Plus,
  Settings,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import {
  CATEGORY_IMAGES,
  DEFAULT_STORE_SETTINGS,
  PRESET_IMAGE_OPTIONS,
} from '../data/seedCatalog';
import { auth, googleProvider } from '../lib/firebase';
import {
  createProduct,
  deleteProduct,
  ProductInput,
  saveStoreSettings,
  seedDefaultCatalog,
  subscribeOrders,
  toggleProductStock,
  updateOrderStatus,
  updateProduct,
} from '../services/storeService';
import {
  BLUEPRINT_LIMITS,
  CATEGORY_LABELS,
  ORDER_STATUS_LABELS,
  OrderRecord,
  OrderStatus,
  Product,
  ProductCategory,
  StoreSettings,
} from '../types/store';
import { buildWhatsAppLink, sanitizeWhatsappNumber } from '../utils/whatsapp';

interface MerchantDashboardProps {
  user: User | null;
  authReady: boolean;
  isAdmin: boolean;
  checkingAdmin: boolean;
  liveProducts: Product[];
  settings: StoreSettings;
  hasFirestoreSettings: boolean;
}

type DashboardTab = 'products' | 'orders' | 'settings';

const EMPTY_PRODUCT_FORM: ProductInput = {
  name: '',
  category: 'vegetables',
  unit: '1 كجم',
  price: 25,
  imageUrl: CATEGORY_IMAGES.vegetables,
  description: '',
  inStock: true,
  featured: false,
};

export function MerchantDashboard({
  user,
  authReady,
  isAdmin,
  checkingAdmin,
  liveProducts,
  settings,
  hasFirestoreSettings,
}: MerchantDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('products');
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [authError, setAuthError] = useState<string | null>(null);

  // Product Form Modal / Drawer State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductInput>(EMPTY_PRODUCT_FORM);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  // Store Settings Form State
  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  useEffect(() => {
    if (!authReady || !isAdmin) {
      setOrders([]);
      return;
    }
    const unsubscribe = subscribeOrders((nextOrders) => {
      setOrders(nextOrders);
    });
    return () => unsubscribe();
  }, [authReady, isAdmin]);

  async function handleSignIn() {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setAuthError('لم يكتمل تسجيل الدخول عبر Google. يرجى المحاولة مرة أخرى.');
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  function openNewProductModal() {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setProductError(null);
    setShowProductForm(true);
  }

  function openEditProductModal(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      category: product.category,
      unit: product.unit,
      price: product.price,
      imageUrl: product.imageUrl,
      description: product.description || '',
      inStock: product.inStock,
      featured: product.featured,
    });
    setProductError(null);
    setShowProductForm(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (productForm.name.trim().length < 2) {
      setProductError('اسم المنتج يجب أن يكون حرفين على الأقل.');
      return;
    }
    if (Number(productForm.price) <= 0) {
      setProductError('يرجى إدخال سعر صحيح أكبر من صفر.');
      return;
    }
    if (!productForm.imageUrl.trim()) {
      setProductError('يرجى اختيار صورة للمنتج أو إدخال رابط صورة.');
      return;
    }

    setProductSaving(true);
    setProductError(null);
    try {
      if (editingProductId) {
        await updateProduct(editingProductId, productForm);
      } else {
        await createProduct(productForm);
      }
      setShowProductForm(false);
      setEditingProductId(null);
    } catch {
      setProductError('تعذر حفظ المنتج. تأكد من الصلاحيات وصحة البيانات.');
    } finally {
      setProductSaving(false);
    }
  }

  async function handleSeedCatalog() {
    setSeeding(true);
    try {
      await seedDefaultCatalog(hasFirestoreSettings ? settings : DEFAULT_STORE_SETTINGS);
    } finally {
      setSeeding(false);
    }
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    const cleanedPhone = sanitizeWhatsappNumber(settingsForm.whatsappNumber);
    if (!BLUEPRINT_LIMITS.whatsappRegex.test(cleanedPhone)) {
      setSettingsError(
        'رقم واتساب البائع غير صالح. أدخل الرقم بالصيغة الدولية أرقاماً فقط (مثال: 201012345678 أو 966501234567).'
      );
      return;
    }
    if (settingsForm.shopName.trim().length < 2) {
      setSettingsError('اسم المحل يجب أن لا يقل عن حرفين.');
      return;
    }

    setSettingsError(null);
    setSettingsSaving(true);
    setSettingsSavedMsg(false);
    try {
      await saveStoreSettings({
        ...settingsForm,
        whatsappNumber: cleanedPhone,
      });
      setSettingsSavedMsg(true);
      setTimeout(() => setSettingsSavedMsg(false), 3000);
    } catch {
      setSettingsError('تعذر حفظ الإعدادات. يرجى المحاولة مرة أخرى.');
    } finally {
      setSettingsSaving(false);
    }
  }

  if (!authReady || checkingAdmin) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="bg-white border border-zinc-200 rounded-xl p-10 text-center text-sm text-zinc-600">
          جاري التحقق من صلاحيات حساب التاجر...
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-lg mx-auto bg-white border border-zinc-200 rounded-xl p-8 text-center space-y-5">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 text-[#15803D] flex items-center justify-center mx-auto">
            <Settings className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-zinc-900">
              لوحة تحكم صاحب المحل والبائع
            </h1>
            <p className="text-sm text-zinc-600 leading-relaxed">
              سجّل الدخول بحساب Google المعتمد لإدارة المنتجات والأسعار، تعديل رقم واتساب استلام الطلبات، ومتابعة طلبات العملاء.
            </p>
          </div>

          {authError && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              {authError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSignIn}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] transition-colors cursor-pointer"
          >
            <LogIn className="w-4 h-4 shrink-0" />
            <span>تسجيل الدخول بحساب Google</span>
          </button>
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="max-w-lg mx-auto bg-white border border-zinc-200 rounded-xl p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-zinc-900">
            الحساب غير مصرح له بإدارة المتجر
          </h1>
          <p className="text-sm text-zinc-600 leading-relaxed">
            أنت مسجل الدخول حالياً بالبريد الإلكتروني{' '}
            <span className="font-mono text-zinc-900">{user.email}</span>، وهذا الحساب لا يملك صلاحية التاجر لهذا المتجر.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج وتبديل الحساب</span>
          </button>
        </div>
      </section>
    );
  }

  const filteredOrders =
    orderFilter === 'all' ? orders : orders.filter((o) => o.status === orderFilter);

  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const activeProductsCount = liveProducts.filter((p) => p.inStock).length;

  return (
    <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Merchant Workspace Header */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
            <span>لوحة التاجر</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{user.email}</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">
            إدارة {settings.shopName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-5 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-600">
            <div>
              المنتجات المتاحة:{' '}
              <strong className="font-mono tabular-nums text-zinc-900">
                {activeProductsCount}/{liveProducts.length}
              </strong>
            </div>
            <span aria-hidden="true">·</span>
            <div>
              طلبات جديدة:{' '}
              <strong className="font-mono tabular-nums text-[#15803D]">
                {newOrdersCount}
              </strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Warning if WhatsApp is still placeholder */}
      {settings.whatsappNumber === '201000000000' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-amber-900">
            تنبيه: رقم واتساب البائع الحالي افتراضي. أدخل رقم هاتفك الفعلي في تبويب الإعدادات لتصلك طلبات العملاء مباشرة.
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="px-3.5 py-1.5 bg-amber-900 text-white text-xs font-semibold rounded-lg hover:bg-amber-800 whitespace-nowrap shrink-0 cursor-pointer"
          >
            تحديث رقم الواتساب
          </button>
        </div>
      )}

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-zinc-200/70 rounded-xl w-fit max-w-full overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'products'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>المنتجات ({liveProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>الطلبات المسجلة ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-600 hover:text-zinc-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات المحل والواتساب</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS MANAGEMENT */}
      {activeTab === 'products' && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900">كتالوج المنتجات السحابي</h2>
              <p className="text-xs text-zinc-500">
                أي إضافة أو تعديل هنا يظهر مباشرة لجميع المتسوقين في الصفحة الرئيسية.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {liveProducts.length === 0 && (
                <button
                  type="button"
                  disabled={seeding}
                  onClick={handleSeedCatalog}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 text-zinc-800 text-xs sm:text-sm font-semibold rounded-lg hover:bg-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <PackagePlus className="w-4 h-4" />
                  <span>{seeding ? 'جاري الاستيراد...' : 'تفعيل باقة المنتجات الافتراضية'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={openNewProductModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#15803D] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#166534] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج جديد</span>
              </button>
            </div>
          </div>

          {liveProducts.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <p className="font-display text-base font-bold text-zinc-900">
                لا توجد منتجات محفوظة في قاعدة البيانات السحابية بعد
              </p>
              <p className="text-sm text-zinc-600 max-w-md mx-auto">
                اضغط على &ldquo;تفعيل باقة المنتجات الافتراضية&rdquo; لإنشاء 10 منتجات بقالة جاهزة للتعديل، أو أضف منتجك الأول يدوياً.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                    <th className="py-3 px-5">المنتج</th>
                    <th className="py-3 px-4">القسم</th>
                    <th className="py-3 px-4">الوحدة</th>
                    <th className="py-3 px-4">السعر</th>
                    <th className="py-3 px-4">التوفر</th>
                    <th className="py-3 px-5 text-left">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 text-sm">
                  {liveProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50/80">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-lg object-cover bg-zinc-100 shrink-0"
                          />
                          <div>
                            <p className="font-semibold text-zinc-900">{product.name}</p>
                            {product.featured && (
                              <span className="text-xs text-[#15803D]">طازج اليوم</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">
                        {CATEGORY_LABELS[product.category]}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 whitespace-nowrap">{product.unit}</td>
                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-zinc-900 whitespace-nowrap">
                        {product.price} {settings.currency}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleProductStock(product.id, !product.inStock)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                            product.inStock
                              ? 'bg-emerald-50 text-[#15803D] border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-zinc-100 text-zinc-600 border border-zinc-200 hover:bg-zinc-200'
                          }`}
                        >
                          {product.inStock ? 'متوفر' : 'نفذت الكمية'}
                        </button>
                      </td>
                      <td className="py-3 px-5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProductModal(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-zinc-100 rounded-md hover:bg-zinc-200 cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          {confirmDeleteId === product.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await deleteProduct(product.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
                              >
                                تأكيد
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              aria-label="حذف المنتج"
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 rounded-md cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS TRACKING */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-zinc-900">سجل طلبات العملاء</h2>
              <p className="text-xs text-zinc-500">
                الطلبات المرسلة من الصفحة مسجلة هنا لمتابعة التجهيز والتوصيل.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg overflow-x-auto">
              {(['all', 'new', 'preparing', 'delivered', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setOrderFilter(status)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                    orderFilter === status
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {status === 'all' ? 'الكل' : ORDER_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-sm text-zinc-500">
              لا توجد طلبات ضمن هذا التصنيف حالياً.
            </div>
          ) : (
            <div className="divide-y divide-zinc-200">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono font-bold text-zinc-900">{order.orderCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.orderType === 'quick' ? 'طلب سريع' : 'سلة مشتريات'}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-zinc-800">{order.customerName}</span>
                      <span aria-hidden="true">·</span>
                      <span dir="ltr" className="font-mono">
                        {order.customerPhone}
                      </span>
                    </div>

                    <p className="text-sm text-zinc-700">
                      العنوان: {order.customerAddress}
                      {order.notes ? ` — ملاحظات: ${order.notes}` : ''}
                    </p>

                    <div className="text-xs text-zinc-600 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                      {order.items.map((item, idx) => (
                        <span key={`${order.id}_${idx}`}>
                          {item.name} × <strong className="font-mono">{item.quantity}</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="block text-xs text-zinc-500">الإجمالي</span>
                      <span className="font-display text-base font-bold font-mono tabular-nums text-zinc-900">
                        {order.total} {settings.currency}
                      </span>
                    </div>

                    <select
                      aria-label="تحديث حالة الطلب"
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="h-9 px-3 text-xs font-semibold border border-zinc-300 rounded-lg bg-white text-zinc-900 focus:outline-none focus:border-[#15803D]"
                    >
                      <option value="new">طلب جديد</option>
                      <option value="preparing">قيد التجهيز</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="cancelled">ملغي</option>
                    </select>

                    <a
                      href={buildWhatsAppLink(
                        order.customerPhone,
                        `مرحباً ${order.customerName}، بخصوص طلبك رقم ${order.orderCode} من ${settings.shopName}`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#15803D] bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 whitespace-nowrap"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>مراسلة العميل</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STORE & WHATSAPP SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 max-w-2xl space-y-5"
        >
          <div>
            <h2 className="font-display text-lg font-bold text-zinc-900">
              إعدادات المحل ورقم واتساب البائع
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              جميع الطلبات المرسلة من الصفحة ستُوجه مباشرة إلى رقم الواتساب المسجل أدناه.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                اسم السوبر ماركت / المحل *
              </label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.shopNameMax}
                value={settingsForm.shopName}
                onChange={(e) => setSettingsForm({ ...settingsForm, shopName: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                رقم واتساب صاحب المحل (بالصيغة الدولية بدون +) *
              </label>
              <input
                type="text"
                required
                dir="ltr"
                maxLength={20}
                value={settingsForm.whatsappNumber}
                onChange={(e) =>
                  setSettingsForm({
                    ...settingsForm,
                    whatsappNumber: sanitizeWhatsappNumber(e.target.value),
                  })
                }
                placeholder="201012345678"
                className="w-full h-10 px-3 text-sm font-mono text-left border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
              <span className="text-[11px] text-zinc-500 mt-1 block">
                مثال لمصر: 201012345678 · للسعودية: 966501234567
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
              الوصف التعريفي أسفل العنوان
            </label>
            <textarea
              rows={2}
              maxLength={BLUEPRINT_LIMITS.shopSubtitleMax}
              value={settingsForm.shopSubtitle}
              onChange={(e) => setSettingsForm({ ...settingsForm, shopSubtitle: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">العملة *</label>
              <input
                type="text"
                required
                maxLength={BLUEPRINT_LIMITS.currencyMax}
                value={settingsForm.currency}
                onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                رسوم التوصيل
              </label>
              <input
                type="number"
                min={0}
                max={5000}
                value={settingsForm.deliveryFee}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, deliveryFee: Number(e.target.value) })
                }
                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                التوصيل المجاني فوق
              </label>
              <input
                type="number"
                min={0}
                max={50000}
                value={settingsForm.freeDeliveryMin}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, freeDeliveryMin: Number(e.target.value) })
                }
                className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                ساعات العمل
              </label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.workingHoursMax}
                value={settingsForm.workingHours}
                onChange={(e) => setSettingsForm({ ...settingsForm, workingHours: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">عنوان المحل</label>
              <input
                type="text"
                maxLength={BLUEPRINT_LIMITS.addressMax}
                value={settingsForm.address}
                onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-800 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={settingsForm.isOpen}
              onChange={(e) => setSettingsForm({ ...settingsForm, isOpen: e.target.checked })}
              className="w-4 h-4 accent-[#15803D]"
            />
            <span>المتجر مفتوح حالياً ويستقبل الطلبات عبر واتساب</span>
          </label>

          {settingsError && (
            <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {settingsError}
            </p>
          )}

          {settingsSavedMsg && (
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D] bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <Check className="w-4 h-4" />
              <span>تم حفظ الإعدادات وتحديث رقم الواتساب للعملاء فوراً.</span>
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={settingsSaving}
              className="px-6 py-2.5 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] disabled:bg-zinc-300 cursor-pointer"
            >
              {settingsSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>

            <a
              href={buildWhatsAppLink(
                settingsForm.whatsappNumber,
                `رسالة تجريبية من متجر ${settingsForm.shopName}`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-zinc-100 text-zinc-800 text-xs font-semibold rounded-lg hover:bg-zinc-200"
            >
              <span>تجربة رقم الواتساب</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </form>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px]">
          <div className="w-full max-w-lg bg-white border border-zinc-200 rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-zinc-900">
                {editingProductId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
              </h3>
              <button
                type="button"
                onClick={() => setShowProductForm(false)}
                className="text-sm text-zinc-500 hover:text-zinc-900 cursor-pointer"
              >
                إغلاق
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 overflow-y-auto space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    اسم المنتج *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.productNameMax}
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="مثال: جبنة رومي قديمة"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">القسم *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => {
                      const nextCat = e.target.value as ProductCategory;
                      setProductForm({
                        ...productForm,
                        category: nextCat,
                        imageUrl: editingProductId
                          ? productForm.imageUrl
                          : CATEGORY_IMAGES[nextCat],
                      });
                    }}
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg bg-white focus:outline-none focus:border-[#15803D]"
                  >
                    {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    الوحدة / الوزن *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={BLUEPRINT_LIMITS.unitMax}
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    placeholder="مثال: 1 كجم أو عبوة 500 جم"
                    className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    السعر ({settings.currency}) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.5"
                    min="0.5"
                    max="100000"
                    value={productForm.price}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 text-sm font-mono border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  صورة المنتج (اختر صورة جاهزة أو أدخل رابطاً) *
                </label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {PRESET_IMAGE_OPTIONS.map((opt) => (
                    <button
                      key={opt.url}
                      type="button"
                      title={opt.label}
                      onClick={() => setProductForm({ ...productForm, imageUrl: opt.url })}
                      className={`aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer ${
                        productForm.imageUrl === opt.url
                          ? 'border-[#15803D]'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  dir="ltr"
                  maxLength={BLUEPRINT_LIMITS.imageUrlMax}
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full h-9 px-3 text-xs font-mono text-left border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  وصف مختصر (اختياري)
                </label>
                <input
                  type="text"
                  maxLength={BLUEPRINT_LIMITS.descriptionMax}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="وصف سريع يظهر تحت اسم المنتج"
                  className="w-full h-10 px-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="flex flex-wrap gap-6 pt-1">
                <label className="flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.inStock}
                    onChange={(e) => setProductForm({ ...productForm, inStock: e.target.checked })}
                    className="w-4 h-4 accent-[#15803D]"
                  />
                  <span>متوفر للطلب</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.featured}
                    onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                    className="w-4 h-4 accent-[#15803D]"
                  />
                  <span>تمييز كمنتج طازج اليوم</span>
                </label>
              </div>

              {productError && (
                <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {productError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProductForm(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-5 py-2.5 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] disabled:bg-zinc-300 cursor-pointer"
                >
                  {productSaving ? 'جاري الحفظ...' : editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
