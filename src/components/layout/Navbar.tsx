import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  User as UserIcon,
  Search,
  ShieldCheck,
  Menu,
  X,
  Sparkles,
  RotateCcw,
  LogOut,
  ChevronDown,
  Truck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenAccount: () => void;
  onNavigate: (view: string, param?: string) => void;
  currentView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCart,
  onOpenAuth,
  onOpenAccount,
  onNavigate,
  currentView,
}) => {
  const {
    siteSettings,
    cart,
    currentUser,
    logout,
    products,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const searchResults = searchQuery.trim()
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.fabricWeight.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* 1. Announcement Bar */}
      {siteSettings.announcementBar.enabled && (
        <div className="bg-stone-900 text-stone-100 text-[11px] sm:text-xs py-2 px-3 sm:px-4 text-center font-medium tracking-wide flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
          <span className="line-clamp-1 sm:line-clamp-none">{siteSettings.announcementBar.text}</span>
          {siteSettings.announcementBar.linkText && (
            <button
              onClick={() => onNavigate('shop')}
              className="underline underline-offset-4 hover:text-rose-400 font-semibold transition-colors shrink-0"
            >
              {siteSettings.announcementBar.linkText} →
            </button>
          )}
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 2xl:px-12 h-16 sm:h-18 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile/Tablet hamburger & Logo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-1 text-stone-700 hover:text-stone-900 rounded-md hover:bg-stone-100 shrink-0"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onNavigate('home')}
            className="text-left group flex items-center gap-2 sm:gap-2.5 min-w-0"
          >
            {siteSettings.logoUrl ? (
              <img
                src={siteSettings.logoUrl}
                alt={siteSettings.siteName || siteSettings.logoText || 'ThreadCraft'}
                className="h-7 sm:h-9 w-auto max-w-[120px] sm:max-w-[160px] object-contain shrink-0"
              />
            ) : null}
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-lg sm:text-xl xl:text-2xl tracking-tighter text-stone-900 group-hover:text-rose-600 transition-colors leading-none truncate">
                {siteSettings.logoText || 'THREADCRAFT'}
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-stone-500 uppercase mt-0.5 font-semibold leading-none truncate">
                Heavyweight Studio V2
              </span>
            </div>
          </button>
        </div>

        {/* Center: Desktop Nav Links (lg+ to prevent tablet crowding) */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-8 text-xs xl:text-sm font-medium text-stone-700 whitespace-nowrap">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors hover:text-stone-950 ${
              currentView === 'home' ? 'text-stone-950 font-bold border-b-2 border-stone-900 pb-0.5' : ''
            }`}
          >
            Home
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className={`transition-colors hover:text-stone-950 ${
              currentView === 'shop' ? 'text-stone-950 font-bold border-b-2 border-stone-900 pb-0.5' : ''
            }`}
          >
            Shop All
          </button>
          <button
            onClick={() => onNavigate('news')}
            className={`transition-colors hover:text-stone-950 ${
              currentView === 'news' ? 'text-stone-950 font-bold border-b-2 border-stone-900 pb-0.5' : ''
            }`}
          >
            Journal / Fabric
          </button>
          <button
            onClick={() => onNavigate('track-order')}
            className={`transition-colors hover:text-stone-950 flex items-center gap-1.5 ${
              currentView === 'track-order' ? 'text-stone-950 font-bold border-b-2 border-stone-900 pb-0.5' : ''
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Track Order</span>
          </button>
          <button
            onClick={() => onNavigate('page', 'about-us')}
            className={`transition-colors hover:text-stone-950 ${
              currentView === 'page-about-us' ? 'text-stone-950 font-bold border-b-2 border-stone-900 pb-0.5' : ''
            }`}
          >
            About
          </button>
          <button
            onClick={() => onNavigate('page', 'faq')}
            className={`transition-colors hover:text-stone-950 ${
              currentView === 'page-faq' ? 'text-stone-950 font-bold border-b-2 border-stone-900 pb-0.5' : ''
            }`}
          >
            FAQ
          </button>
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onNavigate('admin')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 text-xs font-semibold transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </button>
          )}

          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 text-stone-600 hover:text-stone-900 transition-colors"
            title="Search products"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* User Account / Auth */}
          <div className="relative">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1.5 text-stone-700 hover:text-stone-900 text-sm font-medium rounded-md hover:bg-stone-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-800 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0)}
                  </div>
                  <span className="hidden xl:inline text-xs truncate max-w-[100px]">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white border border-stone-200 rounded-lg shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-semibold text-stone-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                        <Sparkles className="w-3 h-3" />
                        <span>{currentUser.loyaltyPoints} Loyalty Points</span>
                      </div>
                    </div>

                    {currentUser.role === 'admin' ? (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-600" />
                        Admin Dashboard
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          onOpenAccount();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-stone-500" />
                        My Orders & Rewards
                      </button>
                    )}

                    <div className="border-t border-stone-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1 p-2 text-stone-700 hover:text-stone-950 text-xs font-semibold"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>

          {/* Cart Drawer Trigger */}
          <button
            onClick={onOpenCart}
            className="relative p-2 text-stone-900 hover:text-rose-600 transition-colors"
            title="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <AnimatePresence>
              {totalCartCount > 0 && (
                <motion.span
                  key={totalCartCount}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 450 }}
                  className="absolute top-1 right-0 w-4 h-4 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs"
                >
                  {totalCartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu (supports landscape scroll) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="lg:hidden border-t border-stone-200 bg-white px-4 pt-3 pb-5 space-y-3 max-h-[calc(100dvh-4rem)] overflow-y-auto shadow-lg"
          >
          {currentUser?.role === 'admin' && (
            <div className="pb-2 border-b border-stone-100">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('admin');
                }}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-stone-900 text-white text-xs font-bold"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Dashboard</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm font-medium text-stone-800">
            <button
              onClick={() => {
                onNavigate('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 rounded-md hover:bg-stone-50 hover:text-rose-600"
            >
              Home
            </button>
            <button
              onClick={() => {
                onNavigate('shop');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 rounded-md hover:bg-stone-50 hover:text-rose-600"
            >
              Shop All Products
            </button>
            <button
              onClick={() => {
                onNavigate('news');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 rounded-md hover:bg-stone-50 hover:text-rose-600"
            >
              Fabric Journal & Care
            </button>
            <button
              onClick={() => {
                onNavigate('track-order');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 rounded-md hover:bg-stone-50 hover:text-rose-600 flex items-center gap-2 font-semibold text-stone-900"
            >
              <Truck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Track Your Order</span>
            </button>
            <button
              onClick={() => {
                onNavigate('page', 'about-us');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 rounded-md hover:bg-stone-50 hover:text-rose-600"
            >
              About us
            </button>
            <button
              onClick={() => {
                onNavigate('page', 'faq');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-2 rounded-md hover:bg-stone-50 hover:text-rose-600"
            >
              FAQ
            </button>
            {currentUser && (
              <button
                onClick={() => {
                  onOpenAccount();
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-2 rounded-md hover:bg-rose-50 text-rose-600 font-semibold sm:col-span-2"
              >
                My Account & Orders
              </button>
            )}
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-start justify-center pt-10 sm:pt-20 px-3 sm:px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: -12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -12, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden"
            >
            <div className="p-3.5 sm:p-4 border-b border-stone-200 flex items-center gap-3">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Search products by name, 240 GSM, fit, or category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-0 text-sm outline-none text-stone-900 placeholder:text-stone-400"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                }}
                className="text-stone-400 hover:text-stone-700 p-1 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[65dvh] sm:max-h-96 overflow-y-auto p-3.5 sm:p-4">
              {searchQuery.trim() === '' ? (
                <div className="text-center py-8 text-xs text-stone-500">
                  <p className="font-medium text-stone-700 mb-1">Search ThreadCraft V2</p>
                  <p>Try searching "Heavyweight", "Oversized", "Acid Wash", or "Pocket"</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500">
                  No products found matching "{searchQuery}".
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    {searchResults.length} Products Found
                  </p>
                  {searchResults.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery('');
                        onNavigate('product', prod.id);
                      }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors"
                    >
                      <img
                        src={prod.images[0]?.imageUrl}
                        alt={prod.name}
                        className="w-12 h-14 object-cover rounded bg-stone-100"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-stone-900 truncate">{prod.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                          <span>{prod.fabricWeight}</span>
                          <span aria-hidden="true">·</span>
                          <span>{siteSettings.currencySymbol}{prod.basePrice}</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-rose-600">View →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
