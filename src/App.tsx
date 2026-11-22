/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { CartDrawer } from './components/CartDrawer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ActiveView, Header } from './components/Header';
import { MerchantDashboard } from './components/MerchantDashboard';
import { QuickOrderModal } from './components/QuickOrderModal';
import { Storefront } from './components/Storefront';
import { DEFAULT_STORE_SETTINGS, SEED_PRODUCTS } from './data/seedCatalog';
import { auth, BOOTSTRAPPED_ADMIN_EMAIL, db } from './lib/firebase';
import { subscribeProducts, subscribeStoreSettings } from './services/storeService';
import { CartItem, Product, StoreSettings } from './types/store';

const CART_STORAGE_KEY = 'whatsapp_grocery_cart_v1';

function AppContent() {
  const [activeView, setActiveView] = useState<ActiveView>('store');
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const [firestoreSettings, setFirestoreSettings] = useState<StoreSettings | null>(null);
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as CartItem[]) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [quickOrderProduct, setQuickOrderProduct] = useState<Product | null>(null);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartItems]);

  // Listen to Firebase Auth state & resolve admin privilege
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser || !nextUser.emailVerified) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        setAuthReady(true);
        return;
      }

      if (nextUser.email === BOOTSTRAPPED_ADMIN_EMAIL) {
        setIsAdmin(true);
        setCheckingAdmin(false);
        setAuthReady(true);
        return;
      }

      setCheckingAdmin(true);
      try {
        const adminSnap = await getDoc(doc(db, 'admins', nextUser.uid));
        setIsAdmin(adminSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
        setAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to public StoreSettings and Products
  useEffect(() => {
    const unsubSettings = subscribeStoreSettings((nextSettings) => {
      setFirestoreSettings(nextSettings);
    });

    const unsubProducts = subscribeProducts((items) => {
      setLiveProducts(items);
      setLoadingProducts(false);
    });

    return () => {
      unsubSettings();
      unsubProducts();
    };
  }, []);

  const effectiveSettings = firestoreSettings || DEFAULT_STORE_SETTINGS;

  // Show Firestore live products when populated; fallback to starter catalog before merchant seeds DB
  const displayProducts = useMemo(() => {
    if (liveProducts.length > 0) return liveProducts;
    return SEED_PRODUCTS;
  }, [liveProducts]);

  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  function handleAddToCart(product: Product) {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function handleUpdateQuantity(productId: string, nextQty: number) {
    if (nextQty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity: nextQty } : i))
    );
  }

  function handleRemoveItem(productId: string) {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId));
  }

  function handleClearCart() {
    setCartItems([]);
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#18181B]">
      <Header
        shopName={effectiveSettings.shopName}
        activeView={activeView}
        onNavigateView={setActiveView}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <div className="flex-1">
        {activeView === 'dashboard' ? (
          <MerchantDashboard
            user={user}
            authReady={authReady}
            isAdmin={isAdmin}
            checkingAdmin={checkingAdmin}
            liveProducts={liveProducts}
            settings={effectiveSettings}
            hasFirestoreSettings={Boolean(firestoreSettings)}
          />
        ) : (
          <Storefront
            products={displayProducts}
            loadingProducts={loadingProducts}
            settings={effectiveSettings}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onQuickOrder={(product) => setQuickOrderProduct(product)}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}
      </div>

      {/* Minimal Footer */}
      <footer className="border-t border-zinc-200 bg-white mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} {effectiveSettings.shopName}. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => {
                setActiveView('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-zinc-900 cursor-pointer"
            >
              واجهة المتجر
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('dashboard');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-zinc-900 cursor-pointer"
            >
              إدارة المحل
            </button>
          </div>
        </div>
      </footer>

      {/* Slide-over Cart & Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        settings={effectiveSettings}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Quick Single-Product WhatsApp Order Modal */}
      <QuickOrderModal
        product={quickOrderProduct}
        settings={effectiveSettings}
        onClose={() => setQuickOrderProduct(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
