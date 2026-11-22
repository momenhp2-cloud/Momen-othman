import { ShoppingBag } from 'lucide-react';

export type ActiveView = 'store' | 'dashboard';

interface HeaderProps {
  shopName: string;
  activeView: ActiveView;
  onNavigateView: (view: ActiveView) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export function Header({
  shopName,
  activeView,
  onNavigateView,
  cartCount,
  onOpenCart,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          onClick={() => {
            onNavigateView('store');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap truncate max-w-[200px] sm:max-w-[340px] lg:max-w-none shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
        >
          {shopName}
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600">
          <a
            href="#catalog"
            onClick={() => onNavigateView('store')}
            className="hover:text-zinc-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            المنتجات
          </a>
          <a
            href="#how-it-works"
            onClick={() => onNavigateView('store')}
            className="hover:text-zinc-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            طريقة الطلب
          </a>
          <a
            href="#shop-info"
            onClick={() => onNavigateView('store')}
            className="hover:text-zinc-900 hover:underline underline-offset-8 transition-colors whitespace-nowrap shrink-0"
          >
            تواصل معنا
          </a>
          <button
            type="button"
            onClick={() => onNavigateView(activeView === 'dashboard' ? 'store' : 'dashboard')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:underline underline-offset-8 ${
              activeView === 'dashboard'
                ? 'text-[#15803D] font-semibold underline'
                : 'hover:text-zinc-900'
            }`}
          >
            {activeView === 'dashboard' ? 'واجهة المتجر' : 'لوحة التاجر'}
          </button>
        </nav>

        {/* Zone 3: Single primary action button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateView(activeView === 'dashboard' ? 'store' : 'dashboard')}
            className="md:hidden text-xs font-medium text-zinc-700 hover:text-zinc-900 px-2.5 py-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {activeView === 'dashboard' ? 'المتجر' : 'لوحة التاجر'}
          </button>
          <button
            type="button"
            onClick={onOpenCart}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#15803D] text-white text-sm font-semibold rounded-lg hover:bg-[#166534] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>السلة</span>
            <span className="tabular-nums font-mono text-xs bg-white/15 px-1.5 py-0.5 rounded">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
