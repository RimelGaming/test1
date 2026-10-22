import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HeroBanner } from './components/storefront/HeroBanner';
import { ProductCard } from './components/storefront/ProductCard';
import { ProductDetailModal } from './components/storefront/ProductDetailModal';
import { CartDrawer } from './components/cart/CartDrawer';
import { CheckoutView } from './components/checkout/CheckoutView';
import { OrderConfirmationModal } from './components/checkout/OrderConfirmationModal';
import { CustomerPortal } from './components/account/CustomerPortal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { ForcePasswordChangeModal } from './components/auth/ForcePasswordChangeModal';
import { NewsView } from './components/storefront/NewsView';
import { StaticPageView } from './components/storefront/StaticPageView';
import { OrderTrackingView } from './components/storefront/OrderTrackingView';
import { SEOManager } from './components/common/SEOManager';
import { Order } from './types';
import { Filter, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

function MainApp() {
  const {
    products,
    categories,
    siteSettings,
    currentUser,
    cart,
  } = useStore();

  // Navigation view: 'home' | 'shop' | 'news' | 'page' | 'checkout' | 'admin'
  const [currentView, setCurrentView] = useState<string>('home');
  const [staticPageSlug, setStaticPageSlug] = useState<string>('about-us');

  // Modals & Drawers
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [accountInitialOrderId, setAccountInitialOrderId] = useState<string | null>(null);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(null);

  // Shop filter & sort
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'newest'>('featured');

  // Enforce strict admin route protection
  React.useEffect(() => {
    if (currentView === 'admin' && (!currentUser || currentUser.role !== 'admin')) {
      setCurrentView('home');
    }
  }, [currentView, currentUser]);

  // Handle navigation
  const handleNavigate = (view: string, param?: string) => {
    if (view === 'admin') {
      if (!currentUser || currentUser.role !== 'admin') {
        setAuthOpen(true);
        return;
      }
      if (currentUser.mustChangePassword) {
        return;
      }
    }
    if (view === 'product' && param) {
      setSelectedProductId(param);
      return;
    }
    if (view === 'track-order') {
      setTrackingOrderNumber(param || null);
      setCurrentView('track-order');
    } else if (view === 'page' && param) {
      setStaticPageSlug(param);
      setCurrentView(`page-${param}`);
    } else {
      setCurrentView(view);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered and sorted products
  const filteredProducts = products.filter(p => {
    if (p.status !== 'published') return false;
    if (selectedCategorySlug === 'all') return true;
    const cat = categories.find(c => c.slug === selectedCategorySlug);
    return cat ? p.categoryId === cat.id : true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-asc') return a.basePrice - b.basePrice;
    if (sortBy === 'price-desc') return b.basePrice - a.basePrice;
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
  });

  return (
    <>
      <SEOManager
        currentView={currentView}
        selectedProductId={selectedProductId}
        staticPageSlug={staticPageSlug}
      />

      {/* Mandatory First-Login Password Update Modal */}
      <ForcePasswordChangeModal />

      {currentView === 'admin' && currentUser?.role === 'admin' && !currentUser.mustChangePassword ? (
        <AdminDashboard onBackToStore={() => setCurrentView('home')} />
      ) : (
        <div
          className="min-h-screen w-full overflow-x-hidden flex flex-col bg-stone-50 text-stone-900"
          style={{
            fontFamily: siteSettings.theme.fontFamily
              ? `'${siteSettings.theme.fontFamily}', sans-serif`
              : 'inherit',
          }}
        >
      {/* Global Navigation */}
      <Navbar
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenAccount={() => setAccountOpen(true)}
        onNavigate={handleNavigate}
        currentView={currentView}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {/* TRACK ORDER VIEW */}
            {currentView === 'track-order' ? (
              <OrderTrackingView
                initialOrderNumber={trackingOrderNumber}
                onBack={() => setCurrentView('home')}
                onExploreShop={() => handleNavigate('shop')}
              />
            ) : currentView === 'checkout' ? (
              <CheckoutView
                onBack={() => setCurrentView('home')}
                onOrderPlaced={order => {
                  setConfirmedOrder(order);
                  setCurrentView('home');
                }}
              />
            ) : currentView === 'news' ? (
          /* NEWS & JOURNAL VIEW */
          <NewsView onBack={() => setCurrentView('home')} />
        ) : currentView.startsWith('page-') ? (
          /* STATIC CONTENT PAGES */
          <StaticPageView
            slug={staticPageSlug}
            onBack={() => setCurrentView('home')}
          />
        ) : currentView === 'shop' ? (
          /* CATALOG / SHOP ALL VIEW */
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-10 space-y-6 sm:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
                  Full Catalog
                </span>
                <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-stone-900 tracking-tight mt-1">
                  Heavyweight T-Shirt Collection
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Showing {sortedProducts.length} published products with independent color & size variants.
                </p>
              </div>

              {/* Sorting */}
              <div className="flex items-center justify-between sm:justify-start gap-2 text-xs">
                <span className="text-stone-500 font-medium shrink-0">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 border border-stone-300 rounded-md bg-white font-medium text-stone-800 outline-none"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="newest">Newest Arrivals</option>
                </select>
              </div>
            </div>

            {/* Category Filter Tabs (Zero-pill styled buttons) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 text-xs font-semibold">
              <button
                onClick={() => setSelectedCategorySlug('all')}
                className={`px-3.5 py-2 rounded-md transition-all shrink-0 ${
                  selectedCategorySlug === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-900'
                }`}
              >
                All Garments ({products.filter(p => p.status === 'published').length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`px-3.5 py-2 rounded-md transition-all shrink-0 ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-900'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 2xl:gap-8">
              {sortedProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={id => setSelectedProductId(id)}
                />
              ))}
            </div>
          </div>
        ) : (
          /* HOME STOREFRONT VIEW */
          <div className="space-y-12 sm:space-y-16 pb-12 sm:pb-16">
            {/* Hero Section */}
            <HeroBanner
              onExplore={() => handleNavigate('shop')}
              onJournal={() => handleNavigate('news')}
            />

            {/* Featured Collection Section */}
            <section className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-stone-200">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-600">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Drop 01 · Autumn 2026</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-stone-900 tracking-tight mt-1">
                    Signature 240 GSM Heavyweights
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-lg">
                    Every garment is constructed from 26/1s combed long-staple organic cotton with 1.25" memory-rib collars.
                  </p>
                </div>

                <button
                  onClick={() => handleNavigate('shop')}
                  className="text-xs font-bold text-stone-900 hover:text-rose-600 transition-colors flex items-center gap-1 group self-start sm:self-auto"
                >
                  <span>View Full Catalog ({products.length})</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Category Filter Pills on Home */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4 text-xs font-semibold">
                <button
                  onClick={() => setSelectedCategorySlug('all')}
                  className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
                    selectedCategorySlug === 'all'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-900'
                  }`}
                >
                  All Silhouettes
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
                      selectedCategorySlug === cat.slug
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:text-stone-900'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 2xl:gap-8 pt-2">
                {sortedProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={id => setSelectedProductId(id)}
                  />
                ))}
              </div>
            </section>

            {/* Textile Engineering Featurette */}
            <section className="bg-stone-950 text-white py-12 sm:py-16 2xl:py-20">
              <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 2xl:gap-16 items-center">
                  <div className="space-y-5 sm:space-y-6">
                    <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
                      Material Architecture
                    </span>
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-black tracking-tight leading-tight">
                      Why Fast Fashion T-Shirts Deform, and How We Engineered The Solution.
                    </h2>
                    <p className="text-stone-300 text-xs sm:text-sm 2xl:text-base leading-relaxed">
                      Standard industry t-shirts use 140–160 GSM carded open-end yarns that collapse after minimal washing. ThreadCraft V2 uses 240 GSM proprietary combed ring-spun jersey woven in Dhaka with zero-bacon memory ribbing.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2">
                      <div className="border border-stone-800 p-4 rounded-lg bg-stone-900/60">
                        <p className="text-lg sm:text-xl font-black text-rose-400">240 GSM</p>
                        <p className="text-xs font-semibold text-stone-200 mt-1">High-Density Combed Jersey</p>
                        <p className="text-[11px] text-stone-400 mt-1">Structured drape that never clings</p>
                      </div>

                      <div className="border border-stone-800 p-4 rounded-lg bg-stone-900/60">
                        <p className="text-lg sm:text-xl font-black text-rose-400">1.25″ Width</p>
                        <p className="text-xs font-semibold text-stone-200 mt-1">Anti-Bacon Ribbing</p>
                        <p className="text-[11px] text-stone-400 mt-1">5% elastane memory reinforcement</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleNavigate('news')}
                      className="inline-flex items-center gap-2 text-xs font-bold text-white hover:text-rose-400 pt-2 group"
                    >
                      <span>Read the full Fabric Engineering Journal</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>

                  <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-stone-800 shadow-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=85"
                      alt="Garment Fabric Texture Detail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* MODALS & DRAWERS */}
      {/* 1. Product Detail Modal */}
      <AnimatePresence>
        {selectedProductId && (
          <ProductDetailModal
            key="product-modal"
            productId={selectedProductId}
            onClose={() => setSelectedProductId(null)}
            onOpenCart={() => setCartOpen(true)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* 2. Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCurrentView('checkout');
        }}
        onOpenAuth={() => {
          setCartOpen(false);
          setAuthOpen(true);
        }}
      />

      {/* 3. Customer Authentication Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          // If customer has items in cart, can route straight to checkout
          if (cart.length > 0) {
            setCurrentView('checkout');
          }
        }}
      />

      {/* 4. Customer Account Portal */}
      <AnimatePresence>
        {accountOpen && (
          <CustomerPortal
            key="customer-portal"
            initialOrderId={accountInitialOrderId}
            onClose={() => {
              setAccountOpen(false);
              setAccountInitialOrderId(null);
            }}
            onTrackOrder={orderNum => {
              setAccountOpen(false);
              handleNavigate('track-order', orderNum);
            }}
          />
        )}
      </AnimatePresence>

      {/* 5. Order Confirmation Receipt Modal */}
      <AnimatePresence>
        {confirmedOrder && (
          <OrderConfirmationModal
            key="confirmation-modal"
            order={confirmedOrder}
            onClose={() => setConfirmedOrder(null)}
            onViewOrder={orderId => {
              setConfirmedOrder(null);
              setAccountInitialOrderId(orderId);
              setAccountOpen(true);
            }}
            onTrackLiveOrder={orderNum => {
              setConfirmedOrder(null);
              handleNavigate('track-order', orderNum);
            }}
          />
        )}
      </AnimatePresence>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
