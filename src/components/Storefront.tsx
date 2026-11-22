import { ArrowDown, ExternalLink, MessageCircle, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HERO_BANNER_IMAGE } from '../data/seedCatalog';
import {
  CATEGORY_LABELS,
  CartItem,
  Product,
  ProductCategory,
  StoreSettings,
} from '../types/store';
import { buildWhatsAppLink } from '../utils/whatsapp';
import { ProductCard } from './ProductCard';

interface StorefrontProps {
  products: Product[];
  loadingProducts: boolean;
  settings: StoreSettings;
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, nextQty: number) => void;
  onQuickOrder: (product: Product) => void;
  onOpenCart: () => void;
}

export function Storefront({
  products,
  loadingProducts,
  settings,
  cartItems,
  onAddToCart,
  onUpdateQuantity,
  onQuickOrder,
  onOpenCart,
}: StorefrontProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        CATEGORY_LABELS[p.category].toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    cartItems.forEach((item) => map.set(item.product.id, item.quantity));
    return map;
  }, [cartItems]);

  const directShopWhatsappUrl = buildWhatsAppLink(
    settings.whatsappNumber,
    `مرحباً ${settings.shopName}، أرغب في الاستفسار عن المنتجات المتاحة حالياً.`
  );

  return (
    <main>
      {/* SECTION 1: HERO (Split-Column Balanced Showcase + 4-Column Service Strip) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 pb-10">
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden grid lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-7 sm:p-10 lg:p-12 flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 mb-4">
              <span>{settings.isOpen ? 'مفتوح لاستقبال الطلبات' : 'مغلق مؤقتاً'}</span>
              <span aria-hidden="true">·</span>
              <span>{settings.workingHours}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-zinc-900 leading-[1.2] text-balance mb-4">
              مقاضي محلك لكل أنواع البقالة تصلك بسرعة عبر واتساب
            </h1>

            <p className="text-base text-zinc-600 leading-relaxed max-w-xl mb-7">
              {settings.shopSubtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#catalog"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0"
              >
                <span>تصفح المنتجات واطلب الآن</span>
                <ArrowDown className="w-4 h-4 shrink-0" />
              </a>

              <a
                href={directShopWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-zinc-100 text-zinc-800 text-sm font-semibold rounded-lg hover:bg-zinc-200 transition-colors whitespace-nowrap shrink-0"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>مراسلة البائع</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[420px] bg-zinc-100">
            <img
              src={HERO_BANNER_IMAGE}
              alt={`${settings.shopName} - كراتين زيت وأرز ومكرونة وشيبس وبسكوت وحلويات`}
              referrerPolicy="no-referrer"
              className="w-full h-full lg:h-full object-cover"
            />
          </div>
        </div>

        {/* 4-Column Store Highlights Strip below the Hero Split */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 bg-white border border-zinc-200 rounded-xl divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-zinc-200">
          <div className="p-4 sm:px-6">
            <p className="text-xs text-zinc-500">آلية الإرسال</p>
            <p className="font-display text-sm font-bold text-zinc-900 mt-0.5">
              طلب مباشر لواتساب المحل
            </p>
          </div>
          <div className="p-4 sm:px-6">
            <p className="text-xs text-zinc-500">رسوم التوصيل</p>
            <p className="font-display text-sm font-bold text-zinc-900 mt-0.5 tabular-nums">
              {settings.deliveryFee === 0
                ? 'توصيل مجاني'
                : `${settings.deliveryFee} ${settings.currency}`}
            </p>
          </div>
          <div className="p-4 sm:px-6">
            <p className="text-xs text-zinc-500">التوصيل المجاني</p>
            <p className="font-display text-sm font-bold text-zinc-900 mt-0.5 tabular-nums">
              {settings.freeDeliveryMin > 0
                ? `للطلبات فوق ${settings.freeDeliveryMin} ${settings.currency}`
                : 'متاح على جميع الطلبات'}
            </p>
          </div>
          <div className="p-4 sm:px-6">
            <p className="text-xs text-zinc-500">الدفع</p>
            <p className="font-display text-sm font-bold text-zinc-900 mt-0.5">
              نقداً أو تحويل عند الاستلام
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 2: LIVE PRODUCT CATALOG & FILTERS */}
      <section id="catalog" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-zinc-900">
              قائمة المنتجات المتوفرة
            </h2>
            <p className="text-sm text-zinc-600 mt-1">
              أضف منتجاتك للسلة لإرسالها في رسالة واحدة، أو اضغط &ldquo;طلب سريع&rdquo; لطلب أي صنف فوراً.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن طماطم، حليب، خبز..."
              className="w-full h-10 pr-10 pl-3 text-sm bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-[#15803D]"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-zinc-200/60 rounded-xl overflow-x-auto mb-8">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-zinc-900 shadow-sm'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            كل الأقسام
          </button>

          {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-zinc-200 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-zinc-200" />
                <div className="p-5 space-y-3">
                  <div className="h-3 w-24 bg-zinc-200 rounded" />
                  <div className="h-5 w-48 bg-zinc-200 rounded" />
                  <div className="h-10 w-full bg-zinc-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center space-y-3">
            <p className="font-display text-lg font-bold text-zinc-900">
              لا توجد منتجات مطابقة لبحثك
            </p>
            <p className="text-sm text-zinc-500">
              جرّب تغيير كلمة البحث أو اختيار &ldquo;كل الأقسام&rdquo; لعرض كامل القائمة.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 cursor-pointer"
            >
              عرض كل المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-7">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                currency={settings.currency}
                cartQuantity={cartQtyMap.get(product.id) || 0}
                storeOpen={settings.isOpen}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                onQuickOrder={onQuickOrder}
              />
            ))}
          </div>
        )}
      </section>

      {/* SECTION 3: HOW IT WORKS + DIRECT SELLER CONTACT */}
      <section
        id="how-it-works"
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 border-t border-zinc-200 mt-8"
      >
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900">
                كيف يصل طلبك إلى صاحب المحل؟
              </h2>
              <p className="text-sm text-zinc-600 mt-1">
                ثلاث خطوات بسيطة بدون تسجيل حساب أو إجراءات دفع معقدة.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <span className="font-mono text-xs font-semibold text-[#15803D]">01.</span>
                <h3 className="font-display text-base font-bold text-zinc-900 mt-2 mb-1">
                  اختر منتجاتك
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  أضف أصناف البقالة إلى السلة أو اضغط طلب سريع على أي منتج تريده فوراً.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <span className="font-mono text-xs font-semibold text-[#15803D]">02.</span>
                <h3 className="font-display text-base font-bold text-zinc-900 mt-2 mb-1">
                  اكتب عنوان التوصيل
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  أدخل اسمك ورقم هاتفك والعنوان ليتم حساب الإجمالي وتجهيز الفاتورة تلقائياً.
                </p>
              </div>

              <div className="bg-white border border-zinc-200 rounded-xl p-5">
                <span className="font-mono text-xs font-semibold text-[#15803D]">03.</span>
                <h3 className="font-display text-base font-bold text-zinc-900 mt-2 mb-1">
                  أرسل عبر واتساب
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed">
                  تفتح محادثة البائع برسالة مرتبة تحتوي على كل التفاصيل جاهزة للإرسال.
                </p>
              </div>
            </div>
          </div>

          <div
            id="shop-info"
            className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 space-y-4"
          >
            <h3 className="font-display text-lg font-bold text-zinc-900">
              بيانات {settings.shopName} والتواصل المباشر
            </h3>

            <dl className="space-y-2.5 text-sm border-y border-zinc-100 py-4">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">العنوان</dt>
                <dd className="text-zinc-900 font-medium text-left">{settings.address}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">ساعات العمل</dt>
                <dd className="text-zinc-900 font-medium text-left">{settings.workingHours}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-zinc-500">واتساب البائع</dt>
                <dd dir="ltr" className="font-mono text-zinc-900 font-semibold">
                  {settings.whatsappNumber.startsWith('00')
                    ? settings.whatsappNumber
                    : `+${settings.whatsappNumber}`}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={directShopWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-[#15803D] text-white text-sm font-bold rounded-lg hover:bg-[#166534] transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>تواصل عبر واتساب</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="py-2.5 px-4 bg-zinc-900 text-white text-sm font-semibold rounded-lg hover:bg-zinc-800 whitespace-nowrap cursor-pointer"
                >
                  إتمام السلة ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
