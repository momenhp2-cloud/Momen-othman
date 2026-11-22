import { MessageCircle, Minus, Package, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { CATEGORY_LABELS, Product } from '../types/store';

interface ProductCardProps {
  product: Product;
  currency: string;
  cartQuantity: number;
  storeOpen: boolean;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, nextQty: number) => void;
  onQuickOrder: (product: Product) => void;
}

export function ProductCard({
  product,
  currency,
  cartQuantity,
  storeOpen,
  onAddToCart,
  onUpdateQuantity,
  onQuickOrder,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <article className="group bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5">
      {/* Image Container - 65-70% visual presence with consistent 4:3 aspect ratio */}
      <div className="relative aspect-[4/3] bg-zinc-100 overflow-hidden">
        {!imageError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
              !product.inStock ? 'opacity-55 grayscale-[35%]' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-500 p-4 text-center">
            <Package className="w-8 h-8 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-600 line-clamp-1">{product.name}</span>
          </div>
        )}
      </div>

      {/* Card Body - Clean unboxed metadata, crisp title, tabular price, and dual ordering controls */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 text-xs text-zinc-500 mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span>{CATEGORY_LABELS[product.category]}</span>
            <span aria-hidden="true">·</span>
            <span>{product.unit}</span>
          </div>
          {!product.inStock ? (
            <span className="text-red-700 font-medium whitespace-nowrap shrink-0">نفذت الكمية</span>
          ) : product.featured ? (
            <span className="text-[#15803D] font-medium whitespace-nowrap shrink-0">طازج اليوم</span>
          ) : null}
        </div>

        <h3 className="font-display text-lg font-bold text-zinc-900 leading-snug mb-1.5">
          {product.name}
        </h3>

        {product.description ? (
          <p className="text-sm text-zinc-600 line-clamp-2 mb-4 leading-relaxed">
            {product.description}
          </p>
        ) : (
          <div className="mb-4" />
        )}

        <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between gap-3 mb-3.5">
          <span className="text-xs text-zinc-500">السعر للوحدة</span>
          <div className="font-display text-lg font-bold text-zinc-900 tabular-nums">
            {product.price}{' '}
            <span className="text-sm font-medium text-zinc-600">{currency}</span>
          </div>
        </div>

        {/* Dual Action Row: Add to Cart (or inline stepper) + Quick WhatsApp Order */}
        <div className="grid grid-cols-2 gap-2.5">
          {cartQuantity > 0 ? (
            <div className="flex items-center justify-between border border-zinc-300 rounded-lg bg-zinc-50 px-1.5 h-10">
              <button
                type="button"
                aria-label="زيادة الكمية"
                onClick={() => onUpdateQuantity(product.id, cartQuantity + 1)}
                disabled={!product.inStock || !storeOpen}
                className="w-8 h-8 flex items-center justify-center rounded text-zinc-700 hover:bg-zinc-200 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="tabular-nums font-mono text-sm font-semibold text-zinc-900">
                {cartQuantity}
              </span>
              <button
                type="button"
                aria-label="تقليل الكمية"
                onClick={() => onUpdateQuantity(product.id, cartQuantity - 1)}
                className="w-8 h-8 flex items-center justify-center rounded text-zinc-700 hover:bg-zinc-200 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={!product.inStock || !storeOpen}
              onClick={() => onAddToCart(product)}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-zinc-900 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>أضف للسلة</span>
            </button>
          )}

          <button
            type="button"
            disabled={!product.inStock || !storeOpen}
            onClick={() => onQuickOrder(product)}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 bg-[#15803D] text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-[#166534] disabled:bg-zinc-200 disabled:text-zinc-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>طلب سريع</span>
          </button>
        </div>
      </div>
    </article>
  );
}
