import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Package,
  ShoppingCart,
  Truck,
  CreditCard,
  Tag,
  Award,
  Palette,
  FileText,
  History,
  Download,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowUpRight,
  Mail,
  Star,
  Sliders,
  Upload,
  Image as ImageIcon,
  Globe,
  RefreshCw,
  AlertTriangle,
  Check,
  Copy,
  Webhook,
  Zap,
  WifiOff,
  MapPin,
  Users,
  UserPlus,
  ShieldCheck,
  Eye,
  Ban,
  Phone
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { SmtpMailerHub } from './SmtpMailerHub';
import {
  Product,
  ProductVariant,
  Category,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  PaymentMethodType,
  DeliveryZone,
  DeliveryArea,
  Coupon,
  SiteSettings,
  NewsPost,
  StaticPage,
  User,
  UserRole,
  UserStatus
} from '../../types';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const {
    products,
    categories,
    orders,
    paymentMethods,
    deliveryZones,
    deliveryAreas,
    coupons,
    users,
    currentUser,
    loyaltyTransactions,
    auditLogs,
    emailLogs,
    siteSettings,
    newsPosts,
    staticPages,
    adminVerifyPayment,
    adminRejectPayment,
    adminConfirmCodCollection,
    adminUpdateOrderStatus,
    adminSaveProduct,
    adminDeleteProduct,
    adminUpdateVariantStock,
    adminSaveCategory,
    adminDeleteCategory,
    adminSavePaymentMethod,
    adminDeletePaymentMethod,
    adminSaveDeliveryZone,
    adminDeleteDeliveryZone,
    adminSaveDeliveryArea,
    adminDeleteDeliveryArea,
    adminSaveCoupon,
    adminDeleteCoupon,
    adminAdjustLoyaltyPoints,
    adminSaveUser,
    adminUpdateUserStatus,
    adminDeleteUser,
    adminUpdateSiteSettings,
    adminSaveNewsPost,
    adminDeleteNewsPost,
    adminSaveStaticPage,
    reviews,
    getProductRatingSummary,
    deleteReview,
    webhookLogs,
    webhookConfig,
    updateWebhookConfig,
    pendingCheckoutDraft,
    offlineOrderQueue,
    syncOfflineOrders,
    receivePaymentWebhook,
  } = useStore();

  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'payments'
    | 'orders'
    | 'users'
    | 'products'
    | 'reviews'
    | 'zones'
    | 'payment_methods'
    | 'coupons'
    | 'loyalty'
    | 'customizer'
    | 'cms'
    | 'smtp'
    | 'audit_logs'
    | 'cpanel_export'
  >('overview');

  // Search & Filters
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');

  // Payment Verification Modals
  const [verifyOrderId, setVerifyOrderId] = useState<string | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');
  const [rejectOrderId, setRejectOrderId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Order Details Modal
  const [inspectOrderId, setInspectOrderId] = useState<string | null>(null);
  const [orderStatusUpdate, setOrderStatusUpdate] = useState<OrderStatus>('processing');
  const [orderStatusNote, setOrderStatusNote] = useState('');
  const [carrierNameInput, setCarrierNameInput] = useState('');
  const [trackingNumberInput, setTrackingNumberInput] = useState('');

  // Product Edit Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);

  // Payment Method Edit Modal State
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isNewPaymentMethod, setIsNewPaymentMethod] = useState(false);

  // Delivery Zone & Area Edit Modal State
  const [editingDeliveryZone, setEditingDeliveryZone] = useState<DeliveryZone | null>(null);
  const [isNewDeliveryZone, setIsNewDeliveryZone] = useState(false);
  const [inlineZoneFees, setInlineZoneFees] = useState<Record<string, string>>({});
  const [editingDeliveryArea, setEditingDeliveryArea] = useState<DeliveryArea | null>(null);
  const [isNewDeliveryArea, setIsNewDeliveryArea] = useState(false);
  const [areaSearchQuery, setAreaSearchQuery] = useState('');
  const [areaZoneFilter, setAreaZoneFilter] = useState<string>('all');

  // Payment Webhook Simulator State
  const [simWebhookGateway, setSimWebhookGateway] = useState<PaymentMethodType>('bkash');
  const [simWebhookTrxId, setSimWebhookTrxId] = useState('');
  const [simWebhookPhone, setSimWebhookPhone] = useState('');
  const [simWebhookAmount, setSimWebhookAmount] = useState<number>(0);
  const [simWebhookOrderRef, setSimWebhookOrderRef] = useState('');
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Loyalty Manual Adjustment Modal
  const [loyaltyUserId, setLoyaltyUserId] = useState<string | null>(null);
  const [loyaltyDelta, setLoyaltyDelta] = useState<number>(50);
  const [loyaltyReason, setLoyaltyReason] = useState('');

  // Stock Control Modal State
  const [stockControlVariant, setStockControlVariant] = useState<{ product: Product; variant: ProductVariant } | null>(null);
  const [stockControlNewQty, setStockControlNewQty] = useState<number>(0);
  const [stockControlReason, setStockControlReason] = useState<string>('Inventory count adjustment');

  // Bulk Product Stock Manager Modal State
  const [bulkStockProduct, setBulkStockProduct] = useState<Product | null>(null);
  const [bulkStockMap, setBulkStockMap] = useState<Record<string, number>>({});

  // Logo & Favicon Upload State
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [faviconUploadError, setFaviconUploadError] = useState<string | null>(null);

  // SEO Simulator Preview Mode State
  const [seoPreviewMode, setSeoPreviewMode] = useState<'desktop' | 'mobile' | 'social'>('desktop');

  // Inline CMS Edit State (replaces browser prompt)
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostTitle, setEditingPostTitle] = useState<string>('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageContent, setEditingPageContent] = useState<string>('');

  // User Management State
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | UserStatus>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingUserPassword, setEditingUserPassword] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);

  // Quick Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // --- ANALYTICS CALCULATIONS (Real queries over orders, no fake numbers) ---
  const totalRevenue = orders
    .filter(o => o.orderStatus !== 'cancelled')
    .reduce((acc, o) => acc + o.grandTotal, 0);

  const totalDiscountGiven = orders.reduce(
    (acc, o) => acc + o.couponDiscount + o.loyaltyDiscount,
    0
  );

  const completedOrders = orders.filter(o => o.orderStatus === 'delivered');
  const pendingPaymentClaims = orders.filter(o => o.paymentStatus === 'awaiting_verification');
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // Low stock variants calculation
  const lowStockVariants: { product: Product; variant: ProductVariant }[] = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      if (v.isActive && v.stockQuantity <= 3) {
        lowStockVariants.push({ product: p, variant: v });
      }
    });
  });

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col overflow-x-hidden">
      {/* Admin Top Header */}
      <header className="bg-stone-900 text-white px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          {siteSettings.logoUrl ? (
            <img
              src={siteSettings.logoUrl}
              alt=""
              className="h-8 w-auto max-w-[110px] sm:max-w-[120px] object-contain rounded bg-white/10 p-1 shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              TC
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold tracking-tight truncate">
              {siteSettings.siteName || 'ThreadCraft V2'} Admin Center
            </h1>
            <p className="text-[10px] text-stone-400 truncate hidden xs:block">
              cPanel Production Architecture · Manual Verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {pendingPaymentClaims.length > 0 && (
            <button
              onClick={() => setActiveSection('payments')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-bold animate-pulse"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{pendingPaymentClaims.length} Claims Awaiting Verification</span>
            </button>
          )}

          <button
            onClick={onBackToStore}
            className="px-3 sm:px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span>View Storefront</span>
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Sidebar Navigation (Horizontal scrollable tab bar on mobile/tablet, Vertical sidebar on lg+) */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-stone-200 p-3 sm:p-4 lg:space-y-6 shrink-0 sticky top-[57px] sm:top-[61px] lg:static z-20">
          <nav className="flex lg:flex-col gap-1.5 lg:gap-1 overflow-x-auto no-scrollbar text-xs font-semibold text-stone-700 pb-0.5 lg:pb-0">
            <button
              onClick={() => setActiveSection('overview')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'overview'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard & Analytics</span>
            </button>

            <button
              onClick={() => setActiveSection('payments')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'payments'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Verify Payments</span>
              </div>
              {pendingPaymentClaims.length > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0">
                  {pendingPaymentClaims.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('orders')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'orders'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <ShoppingCart className="w-4 h-4 shrink-0" />
                <span>Orders & Fulfillment</span>
              </div>
              <span className="text-[11px] text-stone-400 font-normal">{orders.length}</span>
            </button>

            <button
              onClick={() => setActiveSection('users')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'users'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>User Management</span>
              </div>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                {users.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('products')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'products'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <Package className="w-4 h-4 shrink-0" />
                <span>Products & Variants</span>
              </div>
              {lowStockVariants.length > 0 && (
                <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                  {lowStockVariants.length} low
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('reviews')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'reviews'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <Star className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Customer Reviews</span>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded shrink-0">
                {reviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('zones')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'zones'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <Truck className="w-4 h-4 shrink-0" />
              <span>Delivery Zones & Areas</span>
            </button>

            <button
              onClick={() => setActiveSection('payment_methods')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'payment_methods'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>Payment Methods Config</span>
            </button>

            <button
              onClick={() => setActiveSection('coupons')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'coupons'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <Tag className="w-4 h-4 shrink-0" />
              <span>Coupons & Promos</span>
            </button>

            <button
              onClick={() => setActiveSection('loyalty')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'loyalty'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <Award className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Loyalty Rewards Ledger</span>
            </button>

            <button
              onClick={() => setActiveSection('customizer')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'customizer'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <Palette className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Live Website Customizer</span>
            </button>

            <button
              onClick={() => setActiveSection('cms')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'cms'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>News & Pages CMS</span>
            </button>

            <button
              onClick={() => setActiveSection('smtp')}
              className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'smtp'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <div className="flex items-center gap-2 lg:gap-2.5">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>SMTP Mailer & Dispatch</span>
              </div>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded shrink-0">
                {emailLogs.length} logs
              </span>
            </button>

            <button
              onClick={() => setActiveSection('audit_logs')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'audit_logs'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <History className="w-4 h-4 shrink-0" />
              <span>Security Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveSection('cpanel_export')}
              className={`shrink-0 lg:w-full flex items-center gap-2 lg:gap-2.5 px-3 py-2 lg:py-2.5 rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'cpanel_export'
                  ? 'bg-stone-900 text-white font-bold'
                  : 'hover:bg-stone-100 text-stone-700 bg-stone-50 lg:bg-transparent'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>cPanel PHP/MySQL Export</span>
            </button>
          </nav>
        </aside>

        {/* Center Content Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 2xl:p-10 overflow-y-auto max-w-7xl 2xl:max-w-[1600px] w-full mx-auto">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="mb-4 p-3 bg-stone-900 text-white rounded-lg text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. OVERVIEW / ANALYTICS SECTION */}
          {activeSection === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Store Performance Overview</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Database-calculated metrics over all saved customer orders. Zero synthetic numbers.
                </p>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Total Gross Sales
                  </span>
                  <p className="text-2xl font-black text-stone-900">
                    {siteSettings.currencySymbol}{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-stone-500">{orders.length} total orders recorded</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Average Order Value
                  </span>
                  <p className="text-2xl font-black text-stone-900">
                    {siteSettings.currencySymbol}{avgOrderValue}
                  </p>
                  <p className="text-[11px] text-stone-500">Across all customer checkouts</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Pending Verification
                  </span>
                  <p className="text-2xl font-black text-amber-600">
                    {pendingPaymentClaims.length}
                  </p>
                  <p className="text-[11px] text-stone-500">Manual mobile payments</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Low Stock Alert
                  </span>
                  <p className="text-2xl font-black text-rose-600">
                    {lowStockVariants.length}
                  </p>
                  <p className="text-[11px] text-stone-500">Variants with ≤ 3 units left</p>
                </div>
              </div>

              {/* Action Alert Banner for Pending Claims */}
              {pendingPaymentClaims.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-700" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">
                        {pendingPaymentClaims.length} Manual Payment Claims Need Your Review
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Customers have submitted bKash/Nagad/Rocket transaction IDs awaiting bank statement verification.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveSection('payments')}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 shadow-2xs"
                  >
                    Open Claims Center →
                  </button>
                </div>
              )}

              {/* Low Stock Variants Alert Table */}
              {lowStockVariants.length > 0 && (
                <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Inventory Warning: Low Stock Variants
                    </h3>
                    <span className="text-xs text-stone-500">Update stock directly</span>
                  </div>

                  <div className="space-y-2">
                    {lowStockVariants.map(({ product, variant }) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-2 rounded bg-stone-50 border border-stone-200 text-xs"
                      >
                        <div>
                          <span className="font-bold text-stone-900">{product.name}</span>
                          <span className="text-stone-500 ml-2">
                            ({variant.colorName} · {variant.size} · SKU: {variant.sku})
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-rose-600 font-extrabold">
                            {variant.stockQuantity === 0 ? 'Out of stock' : `${variant.stockQuantity} remaining`}
                          </span>
                          <button
                            onClick={() => {
                              setStockControlVariant({ product, variant });
                              setStockControlNewQty(variant.stockQuantity);
                              setStockControlReason('Replenish low stock variant');
                            }}
                            className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                            title={`Open Stock Control for ${variant.sku}`}
                          >
                            <Sliders className="w-3 h-3 text-stone-300" />
                            <span>Stock Control</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. MANUAL PAYMENT VERIFICATION SECTION (Core Mandatory Requirement!) */}
          {activeSection === 'payments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Manual Payment Verification</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Cross-verify customer-submitted mobile banking TrxIDs against your statement. No payment gateway APIs.
                </p>
              </div>

              {/* Table of Orders with Claims */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                      <th className="p-3.5">Order</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">TrxID / Claim</th>
                      <th className="p-3.5">Sender Phone</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Payment State</th>
                      <th className="p-3.5 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-stone-400">
                          No orders recorded.
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => (
                        <tr key={order.id} className="hover:bg-stone-50">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-stone-900">#{order.orderNumber}</span>
                            <p className="text-[11px] text-stone-500">{order.customerName}</p>
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-stone-900">{order.paymentMethodSnapshot.name}</span>
                            <p className="text-[10px] text-stone-400 uppercase font-mono">{order.paymentMethodSnapshot.type}</p>
                          </td>

                          <td className="p-3.5 font-mono">
                            {order.paymentClaim ? (
                              <div>
                                <span className="font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
                                  {order.paymentClaim.transactionId}
                                </span>
                                {order.paymentClaim.customerNotes && (
                                  <p className="text-[11px] text-stone-500 mt-0.5 font-sans">
                                    "{order.paymentClaim.customerNotes}"
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-400">N/A (Cash on Delivery)</span>
                            )}
                          </td>

                          <td className="p-3.5 font-mono">
                            {order.paymentClaim?.senderPhone || order.customerPhone}
                          </td>

                          <td className="p-3.5 font-extrabold text-stone-900">
                            {siteSettings.currencySymbol}{order.grandTotal}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                order.paymentStatus === 'verified'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.paymentStatus === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800 animate-pulse'
                              }`}
                            >
                              {order.paymentStatus === 'awaiting_verification' ? 'Awaiting Review' : order.paymentStatus}
                            </span>
                          </td>

                          <td className="p-3.5 text-right space-x-2">
                            {order.paymentStatus === 'awaiting_verification' && (
                              <>
                                <button
                                  onClick={() => setVerifyOrderId(order.id)}
                                  className="px-2.5 py-1 bg-emerald-600 text-white rounded font-bold text-[11px] hover:bg-emerald-700"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectOrderId(order.id)}
                                  className="px-2.5 py-1 bg-rose-600 text-white rounded font-bold text-[11px] hover:bg-rose-700"
                                >
                                  Reject
                                </button>
                              </>
                            )}

                            {order.paymentMethodSnapshot.type === 'cod' && order.paymentStatus !== 'verified' && (
                              <button
                                onClick={() => {
                                  adminConfirmCodCollection(order.id);
                                  showToast(`COD collection confirmed for ${order.orderNumber}`);
                                }}
                                className="px-2.5 py-1 bg-stone-900 text-white rounded font-bold text-[11px] hover:bg-stone-800"
                              >
                                Confirm Collection
                              </button>
                            )}

                            {order.paymentStatus === 'verified' && (
                              <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                              </span>
                            )}

                            {order.paymentStatus === 'rejected' && (
                              <span className="text-[11px] text-rose-600 font-semibold">
                                Rejected
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>

              {/* PAYMENT WEBHOOK (IPN) & OFFLINE ORDER RECOVERY HUB */}
              <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-stone-900 tracking-tight">
                          Asynchronous Payment Webhook (IPN) & Offline Order Engine
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            webhookConfig.isEnabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {webhookConfig.isEnabled ? 'Listener Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        Processes and verifies orders automatically when bKash/Nagad/Rocket IPN callbacks arrive — even if the customer&apos;s internet turns off during payment.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-stone-800 shrink-0">
                    <input
                      type="checkbox"
                      checked={webhookConfig.isEnabled}
                      onChange={e => {
                        updateWebhookConfig({ ...webhookConfig, isEnabled: e.target.checked });
                        showToast(`Payment Webhook Listener ${e.target.checked ? 'Enabled' : 'Paused'}`);
                      }}
                      className="rounded text-stone-900"
                    />
                    <span>Enable Webhook IPN</span>
                  </label>
                </div>

                {/* Endpoint Config + Offline Draft / Queue Monitor */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Endpoint & Settings (7 cols) */}
                  <div className="lg:col-span-7 space-y-4 bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Webhook Receiver Endpoint URL (POST)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={webhookConfig.endpointUrl}
                          onChange={e =>
                            updateWebhookConfig({ ...webhookConfig, endpointUrl: e.target.value })
                          }
                          className="flex-1 px-3 py-1.5 border border-stone-300 rounded bg-white font-mono text-xs text-stone-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(webhookConfig.endpointUrl);
                            setCopiedWebhookUrl(true);
                            setTimeout(() => setCopiedWebhookUrl(false), 2000);
                            showToast('Webhook Endpoint URL copied!');
                          }}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded font-bold flex items-center gap-1.5 hover:bg-stone-800"
                        >
                          {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Copy</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">
                          HMAC Signing Secret Key
                        </label>
                        <input
                          type="text"
                          value={webhookConfig.secretKey}
                          onChange={e =>
                            updateWebhookConfig({ ...webhookConfig, secretKey: e.target.value })
                          }
                          className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white font-mono text-xs text-stone-700"
                        />
                      </div>

                      <div className="flex flex-col justify-end space-y-1.5 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-800">
                          <input
                            type="checkbox"
                            checked={webhookConfig.autoCreateOrderFromDraftOnWebhook}
                            onChange={e =>
                              updateWebhookConfig({
                                ...webhookConfig,
                                autoCreateOrderFromDraftOnWebhook: e.target.checked,
                              })
                            }
                            className="rounded text-stone-900"
                          />
                          <span>Auto-Convert Offline Customer Drafts on Webhook</span>
                        </label>
                        <p className="text-[10px] text-stone-500 pl-5">
                          If customer loses internet before clicking Place Order, incoming gateway webhook still creates & verifies the order.
                        </p>
                      </div>
                    </div>

                    {/* Offline Queue & Active Draft Status */}
                    <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <WifiOff className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-stone-700">
                          Offline Queued Orders: <strong>{offlineOrderQueue.length}</strong> · Active Checkout Draft:{' '}
                          <strong>{pendingCheckoutDraft ? `#${pendingCheckoutDraft.draftOrderNumber}` : 'None'}</strong>
                        </span>
                      </div>

                      {offlineOrderQueue.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = syncOfflineOrders();
                            showToast(`Synced ${res.syncedCount} offline queued order(s)!`);
                          }}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Force Sync Offline Queue</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Live Incoming Webhook (IPN) Simulator (5 cols) */}
                  <div className="lg:col-span-5 bg-stone-900 text-white p-4 rounded-xl space-y-3 text-xs">
                    <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="font-extrabold uppercase tracking-wider">
                          Simulate Incoming Gateway Webhook (IPN)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const targetOrder =
                            orders.find(o => o.paymentStatus === 'awaiting_verification') || orders[0];
                          if (targetOrder) {
                            setSimWebhookGateway(
                              targetOrder.paymentMethodSnapshot.type === 'cod'
                                ? 'bkash'
                                : targetOrder.paymentMethodSnapshot.type
                            );
                            setSimWebhookOrderRef(targetOrder.orderNumber);
                            setSimWebhookAmount(targetOrder.grandTotal);
                            setSimWebhookPhone(
                              targetOrder.paymentClaim?.senderPhone || targetOrder.customerPhone
                            );
                            setSimWebhookTrxId(
                              targetOrder.paymentClaim?.transactionId &&
                                targetOrder.paymentClaim.transactionId !== 'AWAITING-WEBHOOK-IPN'
                                ? targetOrder.paymentClaim.transactionId
                                : `BK${Math.floor(10000000 + Math.random() * 90000000)}`
                            );
                            showToast(`Auto-filled from Order #${targetOrder.orderNumber}`);
                          } else if (pendingCheckoutDraft) {
                            setSimWebhookOrderRef(pendingCheckoutDraft.draftOrderNumber);
                            setSimWebhookAmount(pendingCheckoutDraft.expectedGrandTotal);
                            setSimWebhookPhone(pendingCheckoutDraft.deliveryAddress.phone);
                            setSimWebhookTrxId(`BK${Math.floor(10000000 + Math.random() * 90000000)}`);
                            showToast(`Auto-filled from Offline Draft #${pendingCheckoutDraft.draftOrderNumber}`);
                          }
                        }}
                        className="text-[10px] text-amber-300 hover:underline font-semibold"
                      >
                        Auto-Fill Pending Order
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-stone-400 font-bold uppercase mb-1">
                          Gateway Provider
                        </label>
                        <select
                          value={simWebhookGateway}
                          onChange={e => setSimWebhookGateway(e.target.value as PaymentMethodType)}
                          className="w-full px-2.5 py-1.5 rounded bg-stone-800 border border-stone-700 text-white text-xs"
                        >
                          <option value="bkash">bKash IPN</option>
                          <option value="nagad">Nagad Callback</option>
                          <option value="rocket">Rocket IPN</option>
                          <option value="bank">Bank NPSB Webhook</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-stone-400 font-bold uppercase mb-1">
                          Order Ref (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. ORD-2026-7841"
                          value={simWebhookOrderRef}
                          onChange={e => setSimWebhookOrderRef(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-stone-800 border border-stone-700 text-white font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-stone-400 font-bold uppercase mb-1">
                          Transaction ID (TrxID)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. BK98A4209X"
                          value={simWebhookTrxId}
                          onChange={e => setSimWebhookTrxId(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded bg-stone-800 border border-stone-700 text-white font-mono uppercase text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-stone-400 font-bold uppercase mb-1">
                          Amount ({siteSettings.currencySymbol})
                        </label>
                        <input
                          type="number"
                          value={simWebhookAmount}
                          onChange={e => setSimWebhookAmount(parseFloat(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 rounded bg-stone-800 border border-stone-700 text-white font-bold text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const trx =
                          simWebhookTrxId.trim().toUpperCase() ||
                          `${simWebhookGateway.slice(0, 2).toUpperCase()}${Math.floor(
                            10000000 + Math.random() * 90000000
                          )}`;
                        const res = receivePaymentWebhook({
                          gateway: simWebhookGateway,
                          transactionId: trx,
                          senderPhone: simWebhookPhone || '01712-345678',
                          amount: simWebhookAmount || 950,
                          orderReference: simWebhookOrderRef.trim() || undefined,
                        });
                        setSimWebhookTrxId('');
                        showToast(res.message);
                      }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <Webhook className="w-3.5 h-3.5" />
                      <span>Fire Payment Webhook Callback</span>
                    </button>
                  </div>
                </div>

                {/* Webhook Event Log Table */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Recent Payment Webhook Deliveries ({webhookLogs.length})
                    </h4>
                    <span className="text-[11px] text-stone-500">
                      HMAC-SHA256 verified callbacks from MFS gateways
                    </span>
                  </div>

                  <div className="border border-stone-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-xs text-left border-collapse">
                        <thead>
                        <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                          <th className="p-2.5">Timestamp</th>
                          <th className="p-2.5">Gateway</th>
                          <th className="p-2.5">TrxID</th>
                          <th className="p-2.5">Sender & Amount</th>
                          <th className="p-2.5">Matched Order</th>
                          <th className="p-2.5">Resolution Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {webhookLogs.map(log => (
                          <tr key={log.id} className="hover:bg-stone-50">
                            <td className="p-2.5 text-[11px] text-stone-500 font-mono">
                              {new Date(log.receivedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded bg-stone-900 text-white font-mono text-[10px] font-bold uppercase">
                                {log.gateway}
                              </span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-stone-900">
                              {log.transactionId}
                            </td>
                            <td className="p-2.5">
                              <span className="font-bold text-stone-900">
                                {siteSettings.currencySymbol}{log.amount}
                              </span>
                              <span className="text-stone-400 ml-1.5 font-mono text-[11px]">
                                ({log.senderPhone})
                              </span>
                            </td>
                            <td className="p-2.5 font-mono font-bold text-stone-900">
                              {log.matchedOrderNumber ? `#${log.matchedOrderNumber}` : log.orderReference || '—'}
                            </td>
                            <td className="p-2.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.status === 'matched_and_verified' ||
                                  log.status === 'offline_draft_converted'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.status === 'unmatched_queued'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {log.status.replace(/_/g, ' ')}
                              </span>
                              <p className="text-[11px] text-stone-500 mt-0.5">{log.processedNote}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. ORDERS & FULFILLMENT SECTION */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Orders & Fulfillment</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage statuses, carrier tracking numbers, and view complete immutable order snapshots.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-stone-400" />
                  <select
                    value={orderFilter}
                    onChange={e => setOrderFilter(e.target.value)}
                    className="text-xs px-2.5 py-1.5 border border-stone-300 rounded bg-white font-medium"
                  >
                    <option value="all">All Statuses ({orders.length})</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-xs text-left border-collapse">
                    <thead>
                    <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                      <th className="p-3.5">Order</th>
                      <th className="p-3.5">Customer & Destination</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Total</th>
                      <th className="p-3.5">Order Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {orders
                      .filter(o => orderFilter === 'all' || o.orderStatus === orderFilter)
                      .map(order => (
                        <tr key={order.id} className="hover:bg-stone-50">
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-stone-900">#{order.orderNumber}</span>
                            <p className="text-[10px] text-stone-400">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </td>

                          <td className="p-3.5">
                            <p className="font-bold text-stone-900">{order.customerName}</p>
                            <p className="text-[11px] text-stone-500">
                              {order.deliveryAddressSnapshot.areaName}, {order.deliveryAddressSnapshot.district}
                            </p>
                            <span className="text-[10px] text-stone-400 font-medium">
                              Zone: {order.deliveryZoneSnapshot.name}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-stone-900">
                              {order.items.reduce((a, b) => a + b.quantity, 0)} units
                            </span>
                            <p className="text-[11px] text-stone-500 truncate max-w-xs">
                              {order.items.map(i => `${i.productName} (${i.size})`).join(', ')}
                            </p>
                          </td>

                          <td className="p-3.5 font-black text-stone-900">
                            {siteSettings.currencySymbol}{order.grandTotal}
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                order.orderStatus === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : order.orderStatus === 'shipped'
                                  ? 'bg-blue-100 text-blue-800'
                                  : order.orderStatus === 'processing'
                                  ? 'bg-purple-100 text-purple-800'
                                  : order.orderStatus === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setInspectOrderId(order.id);
                                setOrderStatusUpdate(order.orderStatus);
                                setCarrierNameInput(order.carrierName || 'Steadfast Courier');
                                setTrackingNumberInput(order.trackingNumber || '');
                              }}
                              className="px-2.5 py-1 bg-stone-900 text-white rounded font-bold text-[11px] hover:bg-stone-800"
                            >
                              Manage / Snapshot
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. PRODUCTS & VARIANTS INVENTORY SECTION */}
          {activeSection === 'products' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Products & Variant Inventory</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Every color/size combination is a distinct database record with independent SKU and stock count.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const newProd: Product = {
                      id: `prod-${Date.now()}`,
                      name: 'New Heavyweight Street Tee',
                      slug: `new-heavyweight-street-tee-${Date.now()}`,
                      description: 'Constructed from 240 GSM organic combed cotton.',
                      shortDescription: 'Signature 240 GSM combed jersey with double-needle ribbed collar.',
                      categoryId: categories[0]?.id || 'cat-1',
                      basePrice: 890,
                      isFeatured: false,
                      status: 'published',
                      fabricWeight: '240 GSM 100% Cotton',
                      fitType: 'Boxy Heavyweight',
                      careInstructions: 'Machine wash cold inside out.',
                      variants: [
                        { id: `v-${Date.now()}-1`, productId: `prod-${Date.now()}`, colorName: 'Pitch Black', colorHex: '#111111', size: 'M', sku: `TC-NEW-BLK-M`, priceOverride: null, stockQuantity: 15, isActive: true },
                        { id: `v-${Date.now()}-2`, productId: `prod-${Date.now()}`, colorName: 'Pitch Black', colorHex: '#111111', size: 'L', sku: `TC-NEW-BLK-L`, priceOverride: null, stockQuantity: 10, isActive: true },
                      ],
                      images: [
                        { id: `img-${Date.now()}-1`, colorName: 'Pitch Black', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85', altText: 'Front View', isPrimary: true, displayOrder: 1 }
                      ],
                      createdAt: new Date().toISOString(),
                    };
                    setIsNewProduct(true);
                    setEditingProduct(newProd);
                  }}
                  className="px-4 py-2 bg-stone-900 text-white rounded-md text-xs font-bold hover:bg-stone-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Product</span>
                </button>
              </div>

              {/* Products Table with Variant Accordion */}
              <div className="space-y-4">
                {products.map(prod => {
                  const prodRating = getProductRatingSummary(prod.id);
                  return (
                    <div key={prod.id} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.images[0]?.imageUrl}
                            alt=""
                            className="w-12 h-14 object-cover rounded bg-stone-100 border"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-sm text-stone-900">{prod.name}</h3>
                              {prodRating.reviewCount > 0 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                  <span>{prodRating.averageRating.toFixed(1)}</span>
                                  <span className="text-amber-700 font-normal">({prodRating.reviewCount} reviews)</span>
                                </span>
                              ) : (
                                <span className="text-[11px] text-stone-400 font-normal">No reviews</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                              <span>Base: {siteSettings.currencySymbol}{prod.basePrice}</span>
                              <span>·</span>
                              <span>{prod.fabricWeight}</span>
                              <span>·</span>
                              <span className="font-semibold text-stone-700">{prod.variants.length} Configured Variants</span>
                            </div>
                          </div>
                        </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setBulkStockProduct(prod);
                            const initialMap: Record<string, number> = {};
                            prod.variants.forEach(v => {
                              initialMap[v.id] = v.stockQuantity;
                            });
                            setBulkStockMap(initialMap);
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                          title="Manage stock for all variants of this product"
                        >
                          <Sliders className="w-3.5 h-3.5 text-amber-700" />
                          <span>Stock Control ({prod.variants.reduce((acc, v) => acc + v.stockQuantity, 0)} units)</span>
                        </button>
                        <button
                          onClick={() => {
                            setIsNewProduct(false);
                            setEditingProduct(prod);
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-semibold flex items-center gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete product ${prod.name}?`)) {
                              adminDeleteProduct(prod.id);
                              showToast(`Deleted ${prod.name}`);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Variants Breakdown Table for this Product */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                          Variant SKUs, Colors, Sizes & Stock
                        </h4>
                        <span className="text-[11px] text-stone-500">
                          Click "Stock Control" or any stock count to adjust inventory
                        </span>
                      </div>
                      <div className="border border-stone-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                              <th className="p-2.5">Colorway</th>
                              <th className="p-2.5">Size</th>
                              <th className="p-2.5">SKU</th>
                              <th className="p-2.5">Price</th>
                              <th className="p-2.5">Stock Available</th>
                              <th className="p-2.5 text-right">Stock Control Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-100">
                            {prod.variants.map(v => (
                              <tr key={v.id} className="hover:bg-stone-50">
                                <td className="p-2.5 flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full border border-black/20"
                                    style={{ backgroundColor: v.colorHex }}
                                  />
                                  <span className="font-semibold text-stone-900">{v.colorName}</span>
                                </td>

                                <td className="p-2.5 font-bold text-stone-900">{v.size}</td>

                                <td className="p-2.5 font-mono text-stone-500">{v.sku}</td>

                                <td className="p-2.5">
                                  {v.priceOverride !== null ? (
                                    <span className="font-bold text-rose-600">
                                      {siteSettings.currencySymbol}{v.priceOverride} (Override)
                                    </span>
                                  ) : (
                                    <span>{siteSettings.currencySymbol}{prod.basePrice}</span>
                                  )}
                                </td>

                                <td className="p-2.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setStockControlVariant({ product: prod, variant: v });
                                      setStockControlNewQty(v.stockQuantity);
                                      setStockControlReason('Manual inventory adjustment');
                                    }}
                                    className="group flex items-center gap-1.5 text-left"
                                    title="Click to open Stock Control modal"
                                  >
                                    <span
                                      className={`font-extrabold px-2 py-0.5 rounded text-xs transition-transform group-hover:scale-105 ${
                                        v.stockQuantity === 0
                                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                          : v.stockQuantity <= 3
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      }`}
                                    >
                                      {v.stockQuantity} units
                                    </span>
                                    <span className="text-[10px] text-stone-400 group-hover:text-stone-900 underline decoration-dotted">
                                      adjust
                                    </span>
                                  </button>
                                </td>

                                <td className="p-2.5 text-right">
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        const next = Math.max(0, v.stockQuantity - 1);
                                        adminUpdateVariantStock(v.id, next, 'Quick stock decrement (-1)');
                                        showToast(`${v.sku} stock reduced to ${next}`);
                                      }}
                                      className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center transition-colors text-xs"
                                      title="Decrease stock by 1"
                                    >
                                      -1
                                    </button>
                                    <button
                                      onClick={() => {
                                        const next = v.stockQuantity + 5;
                                        adminUpdateVariantStock(v.id, next, 'Quick stock increment (+5)');
                                        showToast(`${v.sku} stock increased to ${next}`);
                                      }}
                                      className="px-2 h-6 rounded bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 flex items-center justify-center transition-colors text-[11px]"
                                      title="Increase stock by 5"
                                    >
                                      +5
                                    </button>
                                    <button
                                      onClick={() => {
                                        setStockControlVariant({ product: prod, variant: v });
                                        setStockControlNewQty(v.stockQuantity);
                                        setStockControlReason('Manual inventory adjustment');
                                      }}
                                      className="px-2.5 h-6 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-colors"
                                      title="Open detailed Stock Control modal"
                                    >
                                      <Sliders className="w-3 h-3 text-stone-300" />
                                      <span>Stock Control</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}

          {/* CUSTOMER REVIEWS MANAGEMENT SECTION */}
          {activeSection === 'reviews' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    Customer Product Reviews
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage and moderate product ratings and comments across all catalog items ({reviews.length} total reviews).
                  </p>
                </div>
              </div>

              {/* Reviews Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Total Reviews</span>
                  <p className="text-2xl font-black text-stone-900 mt-1">{reviews.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Store Average Rating</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="text-2xl font-black text-stone-900">
                      {reviews.length > 0
                        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
                        : '0.0'}
                    </span>
                    <span className="text-stone-400 text-xs">/ 5.0</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Verified Buyer Reviews</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">
                    {reviews.filter(r => r.verifiedPurchase).length}
                  </p>
                </div>
              </div>

              {/* Reviews Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                {reviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    No customer reviews published yet.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {reviews.map(rev => {
                      const prod = products.find(p => p.id === rev.productId);
                      return (
                        <div key={rev.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-stone-50/50">
                          <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-extrabold text-sm text-stone-900">{rev.userName}</span>
                              {rev.userEmail && <span className="text-stone-400 text-xs">({rev.userEmail})</span>}
                              {rev.verifiedPurchase ? (
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                  Verified Purchase
                                </span>
                              ) : (
                                <span className="bg-stone-100 text-stone-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                                  Community
                                </span>
                              )}
                              <span className="text-stone-300">·</span>
                              <span className="text-[11px] text-stone-400">
                                {new Date(rev.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-stone-600">Product:</span>
                              <span className="text-xs font-semibold text-stone-900">{prod?.name || rev.productId}</span>
                            </div>

                            <div className="flex items-center gap-1 text-amber-400">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-bold text-stone-800 ml-1.5">{rev.rating}.0</span>
                            </div>

                            {rev.title && <h4 className="text-xs font-bold text-stone-900">{rev.title}</h4>}
                            <p className="text-xs text-stone-700 leading-relaxed max-w-2xl">{rev.comment}</p>
                            <div className="text-[11px] text-stone-400">Helpful upvotes: {rev.helpfulCount || 0}</div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => {
                                deleteReview(rev.id);
                                showToast(`Deleted review from ${rev.userName}`);
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. DELIVERY ZONES & AREAS SECTION (Fixed & Fully Editable!) */}
          {activeSection === 'zones' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    Delivery Zones, Fees & Mapped Areas
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Configure authoritative server-side delivery zones, shipping fees, estimated delivery times, and district-to-zone routing.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const newZone: DeliveryZone = {
                        id: `zone-${Date.now()}`,
                        name: 'Express Same-Day (Dhaka Metro)',
                        fee: 90,
                        estimatedDeliveryTime: 'Same Day (6–10 Hours)',
                        isActive: true,
                        displayOrder: deliveryZones.length + 1,
                      };
                      setIsNewDeliveryZone(true);
                      setEditingDeliveryZone(newZone);
                    }}
                    className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Delivery Zone</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newArea: DeliveryArea = {
                        id: `area-${Date.now()}`,
                        zoneId: deliveryZones[0]?.id || 'zone-1',
                        districtName: 'Dhaka',
                        areaName: '',
                      };
                      setIsNewDeliveryArea(true);
                      setEditingDeliveryArea(newArea);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-900 border border-stone-300 rounded-md text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Add Delivery Area / District</span>
                  </button>
                </div>
              </div>

              {/* Delivery Zones Cards with Inline Fee Input & Full Modal Editor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...deliveryZones]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map(zone => {
                    const mappedCount = deliveryAreas.filter(a => a.zoneId === zone.id).length;
                    const inlineFeeValue =
                      inlineZoneFees[zone.id] !== undefined ? inlineZoneFees[zone.id] : String(zone.fee);

                    return (
                      <div
                        key={zone.id}
                        className={`bg-white rounded-xl border p-5 space-y-4 shadow-2xs flex flex-col justify-between transition-all ${
                          zone.isActive ? 'border-stone-200' : 'border-stone-200 opacity-70 bg-stone-50'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2 pb-3 border-b border-stone-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm text-stone-900">{zone.name}</h3>
                              </div>
                              <span className="text-[10px] font-mono text-stone-400">
                                Order #{zone.displayOrder} · {mappedCount} mapped area{mappedCount === 1 ? '' : 's'}
                              </span>
                            </div>

                            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold">
                              <input
                                type="checkbox"
                                checked={zone.isActive}
                                onChange={e => {
                                  adminSaveDeliveryZone({ ...zone, isActive: e.target.checked });
                                  showToast(`${zone.name} ${e.target.checked ? 'Activated' : 'Disabled'}`);
                                }}
                                className="rounded text-stone-900"
                              />
                              <span
                                className={`text-[11px] font-bold ${
                                  zone.isActive ? 'text-emerald-700' : 'text-stone-400'
                                }`}
                              >
                                {zone.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </label>
                          </div>

                          {/* Quick Inline Fee Adjustment */}
                          <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-stone-600">
                                Delivery Fee ({siteSettings.currencySymbol})
                              </span>
                              <span className="font-black text-base text-rose-600">
                                {siteSettings.currencySymbol}{zone.fee}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
                                  {siteSettings.currencySymbol}
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  value={inlineFeeValue}
                                  onChange={e =>
                                    setInlineZoneFees(prev => ({ ...prev, [zone.id]: e.target.value }))
                                  }
                                  className="w-full pl-6 pr-2 py-1.5 text-xs font-bold border border-stone-300 rounded bg-white text-stone-900 focus:border-stone-900 outline-none"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const parsed = Math.max(0, parseFloat(inlineFeeValue) || 0);
                                  adminSaveDeliveryZone({ ...zone, fee: parsed });
                                  setInlineZoneFees(prev => {
                                    const next = { ...prev };
                                    delete next[zone.id];
                                    return next;
                                  });
                                  showToast(`Updated ${zone.name} fee to ${siteSettings.currencySymbol}${parsed}`);
                                }}
                                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                              >
                                Save Fee
                              </button>
                            </div>
                          </div>

                          <div className="text-xs text-stone-600 flex items-center justify-between">
                            <span>Estimated Delivery:</span>
                            <strong className="text-stone-900">{zone.estimatedDeliveryTime}</strong>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNewDeliveryZone(false);
                              setEditingDeliveryZone({ ...zone });
                            }}
                            className="flex-1 py-1.5 bg-stone-100 hover:bg-stone-200 rounded text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit Zone & Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const res = adminDeleteDeliveryZone(zone.id);
                              showToast(res.message);
                            }}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded border border-stone-200 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Delivery Zone"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Mapped Delivery Areas & District Fee Routing */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900">
                      Mapped Delivery Areas & District Routing ({deliveryAreas.length})
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      Reassign any area&apos;s delivery zone directly below or add/edit supported locations.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search district or area..."
                        value={areaSearchQuery}
                        onChange={e => setAreaSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-stone-300 rounded-md bg-white outline-none focus:border-stone-900"
                      />
                    </div>

                    <select
                      value={areaZoneFilter}
                      onChange={e => setAreaZoneFilter(e.target.value)}
                      className="text-xs px-2.5 py-1.5 border border-stone-300 rounded-md bg-white font-semibold text-stone-700"
                    >
                      <option value="all">All Zones ({deliveryAreas.length})</option>
                      {deliveryZones.map(z => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({siteSettings.currencySymbol}{z.fee})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {deliveryAreas
                    .filter(area => {
                      const matchesZone = areaZoneFilter === 'all' || area.zoneId === areaZoneFilter;
                      const q = areaSearchQuery.trim().toLowerCase();
                      const matchesSearch =
                        !q ||
                        area.districtName.toLowerCase().includes(q) ||
                        area.areaName.toLowerCase().includes(q);
                      return matchesZone && matchesSearch;
                    })
                    .map(area => {
                      const z = deliveryZones.find(zone => zone.id === area.zoneId);
                      return (
                        <div
                          key={area.id}
                          className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex flex-col justify-between gap-2.5 hover:border-stone-300 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-extrabold text-stone-900">{area.areaName}</p>
                              <p className="text-stone-500 text-[11px] font-medium">
                                District: {area.districtName}
                              </p>
                            </div>
                            <span className="text-xs font-black text-rose-600 bg-white px-2 py-0.5 rounded border border-stone-200">
                              {siteSettings.currencySymbol}{z?.fee ?? 0}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200/70">
                            <select
                              value={area.zoneId}
                              onChange={e => {
                                const newZone = deliveryZones.find(dz => dz.id === e.target.value);
                                adminSaveDeliveryArea({ ...area, zoneId: e.target.value });
                                showToast(
                                  `Assigned "${area.areaName}" to ${newZone?.name} (${siteSettings.currencySymbol}${newZone?.fee})`
                                );
                              }}
                              className="flex-1 text-[11px] px-2 py-1 border border-stone-300 rounded bg-white font-semibold text-stone-800 outline-none focus:border-stone-900"
                            >
                              {deliveryZones.map(dz => (
                                <option key={dz.id} value={dz.id}>
                                  {dz.name} ({siteSettings.currencySymbol}{dz.fee})
                                </option>
                              ))}
                            </select>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNewDeliveryArea(false);
                                  setEditingDeliveryArea({ ...area });
                                }}
                                className="p-1 text-stone-500 hover:text-stone-900 bg-white border border-stone-200 rounded cursor-pointer"
                                title="Edit Area"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (deliveryAreas.length <= 1) {
                                    showToast('At least one delivery area must remain.');
                                    return;
                                  }
                                  adminDeleteDeliveryArea(area.id);
                                  showToast(`Removed delivery area "${area.areaName}"`);
                                }}
                                className="p-1 text-stone-400 hover:text-rose-600 bg-white border border-stone-200 rounded cursor-pointer"
                                title="Delete Area"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* 6. PAYMENT METHODS CONFIG SECTION */}
          {activeSection === 'payment_methods' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Payment Methods Configuration</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage merchant/personal recipient numbers, payment channels, and checkout instructions. All settings persist directly.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newPm: PaymentMethod = {
                      id: `pm-${Date.now()}`,
                      name: 'bKash (Merchant)',
                      type: 'bkash',
                      recipientNumber: '01712-000000',
                      accountType: 'merchant',
                      instructions: '1. Open your bKash Mobile App or dial *247#\n2. Select "Make Payment"\n3. Enter Merchant Number: 01712-000000\n4. Enter Reference: Your Order Number\n5. Enter your PIN to confirm payment\n6. Copy and paste the 10-character TrxID in the box below',
                      isEnabled: true,
                      displayOrder: paymentMethods.length + 1,
                    };
                    setIsNewPaymentMethod(true);
                    setEditingPaymentMethod(newPm);
                  }}
                  className="px-4 py-2 bg-stone-900 text-white rounded-md text-xs font-bold hover:bg-stone-800 flex items-center gap-1.5 shadow-2xs self-start sm:self-auto transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Payment Method</span>
                </button>
              </div>

              {/* Grid of Payment Methods */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paymentMethods.map(pm => {
                  const getBrandBadge = (type: string) => {
                    switch (type) {
                      case 'bkash':
                        return { bg: 'bg-[#e2136e]', text: 'text-white', label: 'bKash' };
                      case 'nagad':
                        return { bg: 'bg-[#f7931e]', text: 'text-white', label: 'Nagad' };
                      case 'rocket':
                        return { bg: 'bg-[#8c3494]', text: 'text-white', label: 'Rocket' };
                      case 'bank':
                        return { bg: 'bg-blue-600', text: 'text-white', label: 'Bank Transfer' };
                      case 'cod':
                      default:
                        return { bg: 'bg-emerald-700', text: 'text-white', label: 'COD' };
                    }
                  };
                  const badge = getBrandBadge(pm.type);

                  return (
                    <div key={pm.id} className="bg-white rounded-xl border border-stone-200 p-5 space-y-4 shadow-2xs flex flex-col justify-between">
                      <div>
                        {/* Top Row: Brand & Status Toggle */}
                        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                            <div>
                              <h3 className="font-extrabold text-sm text-stone-900">{pm.name}</h3>
                              <span className="text-[10px] font-mono uppercase text-stone-500">
                                {pm.accountType} account · Order #{pm.displayOrder}
                              </span>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700">
                            <input
                              type="checkbox"
                              checked={pm.isEnabled}
                              onChange={e => {
                                adminSavePaymentMethod({ ...pm, isEnabled: e.target.checked });
                                showToast(`${pm.name} ${e.target.checked ? 'Enabled' : 'Disabled'}`);
                              }}
                              className="rounded text-stone-900"
                            />
                            <span className={`text-[11px] font-bold ${pm.isEnabled ? 'text-emerald-700' : 'text-stone-400'}`}>
                              {pm.isEnabled ? 'Active' : 'Disabled'}
                            </span>
                          </label>
                        </div>

                        {/* Recipient Number & Instructions */}
                        <div className="text-xs space-y-2 mt-3">
                          <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded border border-stone-200">
                            <span className="text-stone-500 font-medium">Recipient Account:</span>
                            <span className="font-mono font-bold text-stone-900 text-xs bg-white px-2 py-0.5 rounded border border-stone-200">
                              {pm.recipientNumber || 'None (Cash)'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">
                              Customer Checkout Instructions
                            </span>
                            <div className="text-stone-600 bg-stone-50 p-3 rounded-lg border border-stone-200 text-[11px] whitespace-pre-line leading-relaxed font-sans max-h-32 overflow-y-auto">
                              {pm.instructions}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewPaymentMethod(false);
                            setEditingPaymentMethod({ ...pm });
                          }}
                          className="flex-1 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Config</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (paymentMethods.length <= 1) {
                              showToast('Cannot delete: at least one payment method must remain configured.');
                              return;
                            }
                            adminDeletePaymentMethod(pm.id);
                            showToast(`Deleted ${pm.name}`);
                          }}
                          className="p-1.5 text-stone-400 hover:text-rose-600 rounded border border-stone-200 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                          title="Delete Payment Method"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. COUPONS & PROMOTIONS SECTION */}
          {activeSection === 'coupons' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Coupons & Promotions</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Server-validated promo codes, minimum spend thresholds, and redemption caps.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const newC: Coupon = {
                      id: `cp-${Date.now()}`,
                      code: `FLASH${Math.floor(Math.random() * 90 + 10)}`,
                      discountType: 'percentage',
                      discountValue: 15,
                      minOrderAmount: 1000,
                      maxDiscountAmount: 250,
                      usageLimitGlobal: 100,
                      usageLimitPerUser: 1,
                      usedCount: 0,
                      startDate: '2026-01-01',
                      endDate: '2026-12-31',
                      isActive: true,
                    };
                    adminSaveCoupon(newC);
                    showToast(`Created coupon ${newC.code}`);
                  }}
                  className="px-4 py-2 bg-stone-900 text-white rounded-md text-xs font-bold hover:bg-stone-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Flash Coupon</span>
                </button>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-xs text-left border-collapse">
                    <thead>
                    <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                      <th className="p-3.5">Coupon Code</th>
                      <th className="p-3.5">Discount</th>
                      <th className="p-3.5">Min Order</th>
                      <th className="p-3.5">Redemptions</th>
                      <th className="p-3.5">Validity Period</th>
                      <th className="p-3.5 text-right">Status / Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {coupons.map(c => (
                      <tr key={c.id} className="hover:bg-stone-50">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-stone-900 text-sm bg-stone-100 px-2 py-0.5 rounded">
                            {c.code}
                          </span>
                        </td>

                        <td className="p-3.5 font-bold text-rose-600">
                          {c.discountType === 'percentage'
                            ? `${c.discountValue}% (Max: ৳${c.maxDiscountAmount || 'No Limit'})`
                            : `৳${c.discountValue} Flat`}
                        </td>

                        <td className="p-3.5">৳{c.minOrderAmount}</td>

                        <td className="p-3.5">
                          <span className="font-bold text-stone-900">{c.usedCount}</span> / {c.usageLimitGlobal}
                        </td>

                        <td className="p-3.5 text-stone-500">
                          {c.startDate} to {c.endDate}
                        </td>

                        <td className="p-3.5 text-right space-x-2">
                          <button
                            onClick={() => {
                              adminSaveCoupon({ ...c, isActive: !c.isActive });
                              showToast(`Coupon ${c.code} ${!c.isActive ? 'Activated' : 'Disabled'}`);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              c.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            {c.isActive ? 'Active' : 'Disabled'}
                          </button>

                          <button
                            onClick={() => adminDeleteCoupon(c.id)}
                            className="p-1 text-stone-400 hover:text-rose-600"
                            title="Delete coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* 8. LOYALTY REWARDS CONFIG & BALANCES SECTION */}
          {activeSection === 'loyalty' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Loyalty Rewards Program</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Configure point earning rates and perform auditable manual balance adjustments.
                </p>
              </div>

              {/* Settings Card */}
              <div className="bg-white p-5 rounded-xl border border-stone-200 space-y-4 shadow-2xs">
                <h3 className="font-bold text-sm text-stone-900">Points Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Points Earned per ৳100 Spent
                    </label>
                    <input
                      type="number"
                      value={siteSettings.loyaltySettings.earnPointsPerHundredCurrency}
                      onChange={e =>
                        adminUpdateSiteSettings({
                          ...siteSettings,
                          loyaltySettings: {
                            ...siteSettings.loyaltySettings,
                            earnPointsPerHundredCurrency: parseInt(e.target.value, 10) || 5,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Redemption Value Rate (1 pt = ৳)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={siteSettings.loyaltySettings.pointsRedeemValueRate}
                      onChange={e =>
                        adminUpdateSiteSettings({
                          ...siteSettings,
                          loyaltySettings: {
                            ...siteSettings.loyaltySettings,
                            pointsRedeemValueRate: parseFloat(e.target.value) || 0.5,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Min Points to Redeem
                    </label>
                    <input
                      type="number"
                      value={siteSettings.loyaltySettings.minPointsToRedeem}
                      onChange={e =>
                        adminUpdateSiteSettings({
                          ...siteSettings,
                          loyaltySettings: {
                            ...siteSettings.loyaltySettings,
                            minPointsToRedeem: parseInt(e.target.value, 10) || 50,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Balances & Adjustment Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                    Customer Point Balances
                  </h3>
                  <span className="text-xs text-stone-500">Every adjustment is logged in audit trail</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[580px] text-xs text-left border-collapse">
                    <thead>
                    <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Email / Phone</th>
                      <th className="p-3.5">Current Balance</th>
                      <th className="p-3.5">Discount Value</th>
                      <th className="p-3.5 text-right">Adjustment Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users
                      .filter(u => u.role === 'customer')
                      .map(user => (
                        <tr key={user.id} className="hover:bg-stone-50">
                          <td className="p-3.5 font-bold text-stone-900">{user.name}</td>
                          <td className="p-3.5 text-stone-500">
                            {user.email} · {user.phone}
                          </td>
                          <td className="p-3.5 font-black text-amber-600 text-sm">
                            {user.loyaltyPoints} pts
                          </td>
                          <td className="p-3.5 font-semibold text-stone-900">
                            ৳{user.loyaltyPoints * siteSettings.loyaltySettings.pointsRedeemValueRate}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => {
                                setLoyaltyUserId(user.id);
                                setLoyaltyDelta(50);
                                setLoyaltyReason('Store goodwill compensation');
                              }}
                              className="px-2.5 py-1 bg-stone-900 text-white rounded font-bold text-[11px] hover:bg-stone-800"
                            >
                              Adjust Balance
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}

          {/* 8B. USER & ROLE MANAGEMENT SECTION */}
          {activeSection === 'users' && (
            <div className="space-y-6">
              {/* Section Header & Create User Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">
                    User & Role Management
                  </h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage customer accounts, administrator privileges, account statuses, loyalty balances, and order history.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const newU: User = {
                      id: `user-${Date.now()}`,
                      name: '',
                      email: '',
                      phone: '+8801',
                      role: 'customer',
                      status: 'active',
                      notes: '',
                      loyaltyPoints: 100,
                      addresses: [],
                      createdAt: new Date().toISOString(),
                    };
                    setUserFormError(null);
                    setIsNewUser(true);
                    setEditingUser(newU);
                  }}
                  className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User / Admin</span>
                </button>
              </div>

              {/* User Directory KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Total Registered Users
                  </span>
                  <p className="text-2xl font-black text-stone-900">{users.length}</p>
                  <p className="text-[11px] text-stone-500">All customer & staff accounts</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Active Customers
                  </span>
                  <p className="text-2xl font-black text-emerald-600">
                    {users.filter(u => u.role === 'customer' && (u.status || 'active') === 'active').length}
                  </p>
                  <p className="text-[11px] text-stone-500">Eligible for checkout & rewards</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Administrator Staff
                  </span>
                  <p className="text-2xl font-black text-indigo-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                  <p className="text-[11px] text-stone-500">Full back-office access</p>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-stone-200 shadow-2xs space-y-1">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    Suspended / Archived
                  </span>
                  <p className="text-2xl font-black text-rose-600">
                    {users.filter(u => (u.status || 'active') !== 'active').length}
                  </p>
                  <p className="text-[11px] text-stone-500">Restricted from signing in</p>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, phone number, or ID..."
                    value={userSearchQuery}
                    onChange={e => setUserSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg bg-stone-50 focus:bg-white text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-stone-400" />
                    <span className="text-stone-500 font-semibold">Role:</span>
                    <select
                      value={userRoleFilter}
                      onChange={e => setUserRoleFilter(e.target.value as 'all' | UserRole)}
                      className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-semibold text-stone-800 outline-none"
                    >
                      <option value="all">All Roles ({users.length})</option>
                      <option value="customer">Customers ({users.filter(u => u.role === 'customer').length})</option>
                      <option value="admin">Admins ({users.filter(u => u.role === 'admin').length})</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500 font-semibold">Status:</span>
                    <select
                      value={userStatusFilter}
                      onChange={e => setUserStatusFilter(e.target.value as 'all' | UserStatus)}
                      className="px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white font-semibold text-stone-800 outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Users Directory Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[780px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                        <th className="p-3.5">User / Identity</th>
                        <th className="p-3.5">Contact & Addresses</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Orders & Spend</th>
                        <th className="p-3.5">Loyalty Points</th>
                        <th className="p-3.5">Account Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {(() => {
                        const filteredUsers = users.filter(u => {
                          const status = u.status || 'active';
                          const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
                          const matchesStatus = userStatusFilter === 'all' || status === userStatusFilter;
                          const q = userSearchQuery.trim().toLowerCase();
                          const matchesQuery =
                            !q ||
                            u.name.toLowerCase().includes(q) ||
                            u.email.toLowerCase().includes(q) ||
                            u.phone.toLowerCase().includes(q) ||
                            u.id.toLowerCase().includes(q);
                          return matchesRole && matchesStatus && matchesQuery;
                        });

                        if (filteredUsers.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-stone-400">
                                No users match your current search or filter criteria.
                              </td>
                            </tr>
                          );
                        }

                        return filteredUsers.map(u => {
                          const userOrders = orders.filter(
                            o => o.userId === u.id || o.customerEmail.toLowerCase() === u.email.toLowerCase()
                          );
                          const lifetimeSpend = userOrders
                            .filter(o => o.orderStatus !== 'cancelled')
                            .reduce((sum, o) => sum + o.grandTotal, 0);
                          const userStatus = u.status || 'active';
                          const isCurrentSession = currentUser?.id === u.id;

                          return (
                            <tr key={u.id} className="hover:bg-stone-50/80 transition-colors">
                              {/* User Identity */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                                      u.role === 'admin'
                                        ? 'bg-indigo-950 text-indigo-300'
                                        : 'bg-stone-200 text-stone-800'
                                    }`}
                                  >
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-bold text-stone-900">{u.name}</span>
                                      {isCurrentSession && (
                                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[9px] font-extrabold uppercase">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-stone-400 font-mono">
                                      ID: {u.id} · Joined {new Date(u.createdAt).toLocaleDateString()}
                                    </p>
                                    {u.notes && (
                                      <p className="text-[10px] text-stone-500 italic mt-0.5 truncate max-w-[210px]">
                                        &ldquo;{u.notes}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </td>

                              {/* Contact & Addresses */}
                              <td className="p-3.5">
                                <p className="font-medium text-stone-900">{u.email}</p>
                                <p className="text-[11px] text-stone-500 font-mono">{u.phone || 'No phone'}</p>
                                <span className="text-[10px] text-stone-400">
                                  {u.addresses.length} saved address{u.addresses.length === 1 ? '' : 'es'}
                                </span>
                              </td>

                              {/* Role Switcher */}
                              <td className="p-3.5">
                                <select
                                  value={u.role}
                                  onChange={e => {
                                    const newRole = e.target.value as UserRole;
                                    const res = adminSaveUser({ ...u, role: newRole });
                                    showToast(res.message);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold border outline-none cursor-pointer ${
                                    u.role === 'admin'
                                      ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                      : 'bg-stone-100 text-stone-700 border-stone-200'
                                  }`}
                                >
                                  <option value="customer">Customer</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </td>

                              {/* Orders & Spend */}
                              <td className="p-3.5">
                                <span className="font-bold text-stone-900">
                                  {userOrders.length} order{userOrders.length === 1 ? '' : 's'}
                                </span>
                                <p className="text-[11px] font-semibold text-stone-600">
                                  {siteSettings.currencySymbol}{lifetimeSpend.toLocaleString()} spent
                                </p>
                              </td>

                              {/* Loyalty Points */}
                              <td className="p-3.5">
                                <div className="flex items-center gap-2">
                                  <div>
                                    <span className="font-black text-amber-600 text-xs">
                                      {u.loyaltyPoints} pts
                                    </span>
                                    <p className="text-[10px] text-stone-400">
                                      ≈ {siteSettings.currencySymbol}
                                      {u.loyaltyPoints * siteSettings.loyaltySettings.pointsRedeemValueRate}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLoyaltyUserId(u.id);
                                      setLoyaltyDelta(50);
                                      setLoyaltyReason('Admin manual points adjustment');
                                    }}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold transition-colors cursor-pointer"
                                    title="Adjust Loyalty Points"
                                  >
                                    ± Pts
                                  </button>
                                </div>
                              </td>

                              {/* Account Status */}
                              <td className="p-3.5">
                                <select
                                  value={userStatus}
                                  onChange={e => {
                                    const nextStatus = e.target.value as UserStatus;
                                    const res = adminUpdateUserStatus(u.id, nextStatus);
                                    showToast(res.message);
                                  }}
                                  className={`px-2 py-1 rounded text-[11px] font-bold uppercase border outline-none cursor-pointer ${
                                    userStatus === 'active'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : userStatus === 'suspended'
                                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                                      : 'bg-stone-200 text-stone-700 border-stone-300'
                                  }`}
                                >
                                  <option value="active">Active</option>
                                  <option value="suspended">Suspended</option>
                                  <option value="archived">Archived</option>
                                </select>
                              </td>

                              {/* Actions */}
                              <td className="p-3.5 text-right whitespace-nowrap">
                                {confirmDeleteUserId === u.id ? (
                                  <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-2 py-1 rounded">
                                    <span className="text-[10px] font-bold text-rose-800">Delete?</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = adminDeleteUser(u.id);
                                        setConfirmDeleteUserId(null);
                                        showToast(res.message);
                                      }}
                                      className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold hover:bg-rose-700 cursor-pointer"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUserId(null)}
                                      className="px-2 py-0.5 bg-white text-stone-600 border border-stone-200 rounded text-[10px] font-semibold cursor-pointer"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setInspectingUser(u)}
                                      className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                      title="View User Profile & Orders"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Inspect</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUserFormError(null);
                                        setIsNewUser(false);
                                        setEditingUser({ ...u, status: u.status || 'active' });
                                      }}
                                      className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                                      title="Edit User Account"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteUserId(u.id)}
                                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded border border-stone-200 hover:border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Delete User Account"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 9. LIVE WEBSITE CUSTOMIZER SECTION */}
          {activeSection === 'customizer' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Live Website Customizer</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Updates persist directly to database and reflect on the public site without rebuilding code or restarting.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-200 space-y-6 shadow-2xs text-xs">
                {/* Brand Identity & Logo/Favicon Assets */}
                <div className="space-y-6">
                  <div className="border-b pb-2">
                    <h3 className="font-bold text-sm text-stone-900">Store Identity & Visual Assets</h3>
                    <p className="text-[11px] text-stone-500">Configure your storefront brand name, upload official brand logo, and customize the browser favicon tab icon.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Store Name</label>
                      <input
                        type="text"
                        value={siteSettings.siteName}
                        onChange={e => adminUpdateSiteSettings({ ...siteSettings, siteName: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Navbar Logo Fallback Text</label>
                      <input
                        type="text"
                        value={siteSettings.logoText}
                        onChange={e => adminUpdateSiteSettings({ ...siteSettings, logoText: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded font-bold tracking-tight"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1">Store Tagline / Description</label>
                      <input
                        type="text"
                        value={siteSettings.siteDescription}
                        onChange={e => adminUpdateSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                        className="w-full px-3 py-2 border border-stone-300 rounded"
                      />
                    </div>
                  </div>

                  {/* 1. BRAND LOGO UPLOAD SECTION */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-rose-600" />
                          <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                            Storefront Brand Logo
                          </h4>
                          {siteSettings.logoUrl && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Renders in storefront navigation bar, footer, and admin dashboard header. Supports PNG, SVG, WebP, JPG.
                        </p>
                      </div>

                      {siteSettings.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            adminUpdateSiteSettings({ ...siteSettings, logoUrl: undefined });
                            showToast('Logo cleared. Reverted to typographic brand name.');
                          }}
                          className="text-stone-500 hover:text-rose-600 text-xs font-semibold underline self-start sm:self-auto"
                        >
                          Remove Logo
                        </button>
                      )}
                    </div>

                    {logoUploadError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{logoUploadError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Upload controls & Direct URL */}
                      <div className="lg:col-span-7 space-y-3">
                        <div>
                          <label className="block font-semibold text-stone-700 mb-1.5 text-xs">
                            Upload Logo Image File (from your device)
                          </label>
                          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 hover:border-stone-900 rounded-lg cursor-pointer bg-white transition-colors group">
                            <Upload className="w-6 h-6 text-stone-400 group-hover:text-stone-900 mb-1.5 transition-colors" />
                            <span className="font-bold text-xs text-stone-800 group-hover:text-stone-950">
                              Click to choose image file or drag here
                            </span>
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              PNG with transparent background or SVG recommended (Max 2MB)
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/svg+xml,image/jpeg,image/webp"
                              className="hidden"
                              onChange={e => {
                                setLogoUploadError(null);
                                const file = e.target.files?.[0];
                                if (!file) return;

                                if (file.size > 2 * 1024 * 1024) {
                                  setLogoUploadError('Logo file size exceeds 2MB limit. Please upload a smaller image.');
                                  return;
                                }

                                const reader = new FileReader();
                                reader.onload = evt => {
                                  const result = evt.target?.result as string;
                                  if (result) {
                                    adminUpdateSiteSettings({ ...siteSettings, logoUrl: result });
                                    showToast('Custom logo uploaded and applied across storefront!');
                                  }
                                };
                                reader.onerror = () => {
                                  setLogoUploadError('Failed to read image file.');
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block font-semibold text-stone-700 mb-1 text-xs">
                            Or Enter External Logo Image URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="url"
                              placeholder="https://example.com/assets/logo.png"
                              value={siteSettings.logoUrl || ''}
                              onChange={e =>
                                adminUpdateSiteSettings({ ...siteSettings, logoUrl: e.target.value.trim() || undefined })
                              }
                              className="flex-1 px-3 py-1.5 border border-stone-300 rounded bg-white text-xs font-mono"
                            />
                            {siteSettings.logoUrl && (
                              <button
                                type="button"
                                onClick={() => showToast('Logo URL applied!')}
                                className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800"
                              >
                                Apply
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Logo Presets */}
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Or pick a curated Streetwear Brand Logo preset:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const preset1 = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'><rect width='200' height='60' rx='8' fill='%230F172A'/><path d='M25 18 H45 V24 H37 V42 H31 V24 H25 Z' fill='%23FFFFFF'/><path d='M48 18 H56 L64 30 L72 18 H80 L70 33 L81 42 H72 L64 35 L56 42 H48 Z' fill='%23E11D48'/><text x='92' y='36' font-family='sans-serif' font-size='16' font-weight='900' fill='%23FFFFFF' letter-spacing='2'>THREAD</text><text x='92' y='48' font-family='sans-serif' font-size='10' font-weight='700' fill='%2394A3B8' letter-spacing='3'>CRAFT</text></svg>";
                                adminUpdateSiteSettings({ ...siteSettings, logoUrl: preset1 });
                                showToast('Applied TC Atelier Monogram Logo Preset!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-semibold text-stone-700"
                            >
                              ⚡ TC Atelier Emblem
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const preset2 = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 50'><rect width='180' height='50' rx='6' fill='%23E11D48'/><circle cx='25' cy='25' r='14' fill='%23FFFFFF'/><path d='M20 20 H30 V23 H26 V31 H24 V23 H20 Z' fill='%23E11D48'/><text x='48' y='32' font-family='sans-serif' font-size='16' font-weight='900' fill='%23FFFFFF' letter-spacing='1'>THREADCRAFT</text></svg>";
                                adminUpdateSiteSettings({ ...siteSettings, logoUrl: preset2 });
                                showToast('Applied Crimson Streetwear Crest Logo Preset!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-semibold text-stone-700"
                            >
                              🔥 Crimson Street Crest
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const preset3 = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 50'><path d='M10 25 L25 10 L40 25 L25 40 Z' fill='%230F172A'/><text x='25' y='29' font-family='sans-serif' font-size='12' font-weight='900' fill='%23FFFFFF' text-anchor='middle'>240</text><text x='52' y='32' font-family='sans-serif' font-size='15' font-weight='800' fill='%230F172A' letter-spacing='1'>HEAVYWEIGHT</text></svg>";
                                adminUpdateSiteSettings({ ...siteSettings, logoUrl: preset3 });
                                showToast('Applied 240 GSM Diamond Logo Preset!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-semibold text-stone-700"
                            >
                              💎 240 GSM Diamond Logo
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Live Surface Previews */}
                      <div className="lg:col-span-5 space-y-2.5">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Live Multi-Surface Previews
                        </span>

                        {/* Light Navbar Preview */}
                        <div className="p-3 rounded-lg border border-stone-200 bg-white shadow-2xs">
                          <span className="text-[10px] text-stone-400 font-semibold block mb-1.5">
                            Storefront Navbar (Light Surface):
                          </span>
                          <div className="h-12 px-3 border border-stone-100 rounded bg-stone-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {siteSettings.logoUrl ? (
                                <img
                                  src={siteSettings.logoUrl}
                                  alt="Logo Preview"
                                  className="h-8 max-w-[130px] object-contain"
                                />
                              ) : null}
                              <div>
                                <span className="font-extrabold text-sm tracking-tight text-stone-900 block leading-none">
                                  {siteSettings.logoText || 'THREADCRAFT'}
                                </span>
                                <span className="text-[8px] tracking-widest text-stone-400 uppercase font-bold">
                                  Heavyweight Studio
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono">Navbar</span>
                          </div>
                        </div>

                        {/* Dark Footer & Admin Header Preview */}
                        <div className="p-3 rounded-lg border border-stone-800 bg-stone-950 text-white shadow-2xs">
                          <span className="text-[10px] text-stone-400 font-semibold block mb-1.5">
                            Footer & Admin Header (Dark Surface):
                          </span>
                          <div className="h-12 px-3 border border-stone-800 rounded bg-stone-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {siteSettings.logoUrl ? (
                                <img
                                  src={siteSettings.logoUrl}
                                  alt="Logo Preview Dark"
                                  className="h-8 max-w-[130px] object-contain"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">
                                  TC
                                </div>
                              )}
                              <span className="font-extrabold text-sm tracking-tight text-white leading-none">
                                {siteSettings.logoText || 'THREADCRAFT'}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-500 font-mono">Header</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. FAVICON UPLOAD SECTION & BROWSER TAB SIMULATOR */}
                  <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-amber-600" />
                          <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                            Browser Favicon & Tab Icon
                          </h4>
                          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Live Synced to DOM
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Immediately updates the active browser tab icon via document head link tag. Supports ICO, PNG, SVG (32x32 to 64x64 recommended).
                        </p>
                      </div>

                      {siteSettings.faviconUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            adminUpdateSiteSettings({ ...siteSettings, faviconUrl: undefined });
                            showToast('Favicon reset to default ThreadCraft icon.');
                          }}
                          className="text-stone-500 hover:text-rose-600 text-xs font-semibold underline self-start sm:self-auto"
                        >
                          Reset to Default Favicon
                        </button>
                      )}
                    </div>

                    {faviconUploadError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{faviconUploadError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      {/* Left: Favicon upload input & presets */}
                      <div className="lg:col-span-7 space-y-3">
                        <div>
                          <label className="block font-semibold text-stone-700 mb-1.5 text-xs">
                            Upload Favicon File (ICO, SVG, PNG)
                          </label>
                          <label className="flex flex-col items-center justify-center p-3.5 border-2 border-dashed border-stone-300 hover:border-stone-900 rounded-lg cursor-pointer bg-white transition-colors group">
                            <Upload className="w-5 h-5 text-stone-400 group-hover:text-stone-900 mb-1 transition-colors" />
                            <span className="font-bold text-xs text-stone-800 group-hover:text-stone-950">
                              Upload Favicon (.ico, .svg, .png)
                            </span>
                            <span className="text-[10px] text-stone-400 mt-0.5">
                              Square icon format recommended (Max 1MB)
                            </span>
                            <input
                              type="file"
                              accept="image/x-icon,image/png,image/svg+xml,image/jpeg,image/vnd.microsoft.icon"
                              className="hidden"
                              onChange={e => {
                                setFaviconUploadError(null);
                                const file = e.target.files?.[0];
                                if (!file) return;

                                if (file.size > 1024 * 1024) {
                                  setFaviconUploadError('Favicon file exceeds 1MB limit.');
                                  return;
                                }

                                const reader = new FileReader();
                                reader.onload = evt => {
                                  const result = evt.target?.result as string;
                                  if (result) {
                                    adminUpdateSiteSettings({ ...siteSettings, faviconUrl: result });
                                    showToast('New favicon uploaded and synced to browser tab!');
                                  }
                                };
                                reader.onerror = () => {
                                  setFaviconUploadError('Failed to read favicon file.');
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>

                        <div>
                          <label className="block font-semibold text-stone-700 mb-1 text-xs">
                            Or Enter Direct Favicon URL or SVG String
                          </label>
                          <input
                            type="text"
                            placeholder="data:image/svg+xml,... or https://.../favicon.png"
                            value={siteSettings.faviconUrl || ''}
                            onChange={e =>
                              adminUpdateSiteSettings({
                                ...siteSettings,
                                faviconUrl: e.target.value.trim() || undefined,
                              })
                            }
                            className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white text-xs font-mono"
                          />
                        </div>

                        {/* Curated Favicon Presets */}
                        <div>
                          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Quick-Apply Favicon Presets:
                          </span>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const tcSlate = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F172A'/><text x='50' y='68' font-family='sans-serif' font-size='52' font-weight='900' fill='%23FFFFFF' text-anchor='middle'>TC</text></svg>";
                                adminUpdateSiteSettings({ ...siteSettings, faviconUrl: tcSlate });
                                showToast('Applied TC Classic Slate Favicon!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-semibold text-stone-700 flex items-center gap-1.5"
                            >
                              <div className="w-3.5 h-3.5 rounded bg-slate-900 text-white font-bold text-[8px] flex items-center justify-center">
                                TC
                              </div>
                              <span>Classic Slate</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const tcRose = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23E11D48'/><polygon points='50,18 78,74 22,74' fill='%23FFFFFF'/><text x='50' y='68' font-family='sans-serif' font-size='32' font-weight='900' fill='%23E11D48' text-anchor='middle'>T</text></svg>";
                                adminUpdateSiteSettings({ ...siteSettings, faviconUrl: tcRose });
                                showToast('Applied Crimson Fire Favicon!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-semibold text-stone-700 flex items-center gap-1.5"
                            >
                              <div className="w-3.5 h-3.5 rounded-full bg-rose-600 text-white font-bold text-[8px] flex items-center justify-center">
                                T
                              </div>
                              <span>Crimson Fire</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const tcGold = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%231C1917'/><circle cx='50' cy='50' r='36' stroke='%23F59E0B' stroke-width='8' fill='none'/><text x='50' y='63' font-family='sans-serif' font-size='42' font-weight='900' fill='%23F59E0B' text-anchor='middle'>24</text></svg>";
                                adminUpdateSiteSettings({ ...siteSettings, faviconUrl: tcGold });
                                showToast('Applied Amber 240 GSM Gold Favicon!');
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded text-[11px] font-semibold text-stone-700 flex items-center gap-1.5"
                            >
                              <div className="w-3.5 h-3.5 rounded bg-stone-900 border border-amber-500 text-amber-400 font-bold text-[8px] flex items-center justify-center">
                                24
                              </div>
                              <span>Amber 240 Gold</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Realistic Browser Tab Simulator */}
                      <div className="lg:col-span-5 space-y-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Browser Tab Simulator (Live Chrome Mockup)
                        </span>

                        <div className="bg-stone-200 p-2.5 rounded-xl border border-stone-300 space-y-2 shadow-sm">
                          {/* Simulated browser window controls */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                            <span className="text-[9px] text-stone-500 font-mono ml-2">Chrome Tab Preview</span>
                          </div>

                          {/* The Simulated Tab */}
                          <div className="bg-white rounded-t-lg px-3 py-2 flex items-center justify-between shadow-2xs border-t border-x border-stone-300">
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={
                                  siteSettings.faviconUrl ||
                                  "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F172A'/><text x='50' y='68' font-family='sans-serif' font-size='52' font-weight='900' fill='%23FFFFFF' text-anchor='middle'>TC</text></svg>"
                                }
                                alt="Favicon"
                                className="w-4 h-4 object-contain rounded shrink-0 shadow-2xs"
                              />
                              <span className="text-xs font-semibold text-stone-900 truncate">
                                {siteSettings.siteName || 'ThreadCraft V2'} — Premium Store
                              </span>
                            </div>
                            <span className="text-stone-400 hover:text-stone-700 text-xs ml-2 font-bold cursor-default">
                              ×
                            </span>
                          </div>

                          {/* Address bar mockup */}
                          <div className="bg-white rounded px-2.5 py-1 text-[10px] text-stone-600 font-mono flex items-center justify-between border border-stone-300">
                            <span className="truncate text-stone-700">https://threadcraft.com/shop</span>
                            <span className="text-emerald-700 text-[9px] font-bold">🔒 Secure</span>
                          </div>
                        </div>

                        <p className="text-[10px] text-stone-400 italic">
                          Changes to this favicon are applied directly to the browser window and persisted in local storage.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Announcement Bar */}
                <div className="space-y-3 pt-3 border-t border-stone-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-sm text-stone-900">Header Announcement Banner</h3>
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-700">
                      <input
                        type="checkbox"
                        checked={siteSettings.announcementBar.enabled}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            announcementBar: { ...siteSettings.announcementBar, enabled: e.target.checked },
                          })
                        }
                      />
                      <span>Show Announcement Bar</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Banner Text</label>
                    <input
                      type="text"
                      value={siteSettings.announcementBar.text}
                      onChange={e =>
                        adminUpdateSiteSettings({
                          ...siteSettings,
                          announcementBar: { ...siteSettings.announcementBar, text: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border border-stone-300 rounded"
                    />
                  </div>
                </div>

                {/* Hero Banner Customizer */}
                <div className="space-y-3 pt-3 border-t border-stone-200">
                  <h3 className="font-bold text-sm text-stone-900 border-b pb-2">Homepage Hero Banner</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={siteSettings.hero.badge}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            hero: { ...siteSettings.hero, badge: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">Primary CTA Button Label</label>
                      <input
                        type="text"
                        value={siteSettings.hero.ctaText}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            hero: { ...siteSettings.hero, ctaText: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1">Hero Headline</label>
                      <input
                        type="text"
                        value={siteSettings.hero.headline}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            hero: { ...siteSettings.hero, headline: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded font-black uppercase"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1">Hero Subheadline</label>
                      <textarea
                        rows={2}
                        value={siteSettings.hero.subheadline}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            hero: { ...siteSettings.hero, subheadline: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 border border-stone-300 rounded resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SEARCH ENGINE OPTIMIZATION (SEO) & SOCIAL SHARING CARDS */}
                <div className="space-y-4 pt-4 border-t border-stone-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-rose-600" />
                        <h3 className="font-bold text-sm text-stone-900">
                          Search Engine Optimization (SEO) & Social Sharing Cards
                        </h3>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Configure page title, meta description, target keywords, OpenGraph social share cards, and Schema.org structured data (JSON-LD).
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        JSON-LD Active
                      </span>
                    </div>
                  </div>

                  {/* SEO Form Inputs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Meta Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-stone-700 text-xs">
                          Meta Page Title (<span className="font-mono">&lt;title&gt;</span> &amp; <span className="font-mono">og:title</span>)
                        </label>
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            (siteSettings.seo?.metaTitle?.length || 0) >= 30 && (siteSettings.seo?.metaTitle?.length || 0) <= 60
                              ? 'text-emerald-700'
                              : 'text-amber-600'
                          }`}
                        >
                          {siteSettings.seo?.metaTitle?.length || 0} / 60 chars (ideal: 30–60)
                        </span>
                      </div>
                      <input
                        type="text"
                        value={siteSettings.seo?.metaTitle || ''}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            seo: { ...siteSettings.seo, metaTitle: e.target.value },
                          })
                        }
                        placeholder="ThreadCraft V2 — Heavyweight Streetwear & 240 GSM T-Shirts"
                        className="w-full px-3 py-2 border border-stone-300 rounded font-medium text-xs text-stone-900"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Appears as the primary clickable headline in Google search snippets and browser tab titles.
                      </p>
                    </div>

                    {/* OpenGraph Image URL */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-stone-700 text-xs">
                          Social Share Card Image (<span className="font-mono">og:image</span> &amp; <span className="font-mono">twitter:image</span>)
                        </label>
                        <span className="text-[10px] text-stone-400 font-mono">1200 x 630 px (1.91:1)</span>
                      </div>
                      <input
                        type="text"
                        value={siteSettings.seo?.ogImage || ''}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            seo: { ...siteSettings.seo, ogImage: e.target.value },
                          })
                        }
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-3 py-2 border border-stone-300 rounded font-mono text-xs"
                      />
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-stone-400">Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            adminUpdateSiteSettings({
                              ...siteSettings,
                              seo: {
                                ...siteSettings.seo,
                                ogImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&h=630&q=85',
                              },
                            });
                            showToast('Applied Streetwear Studio Banner for Social Share Cards!');
                          }}
                          className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[10px] font-semibold"
                        >
                          Streetwear Studio
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            adminUpdateSiteSettings({
                              ...siteSettings,
                              seo: {
                                ...siteSettings.seo,
                                ogImage: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&h=630&q=85',
                              },
                            });
                            showToast('Applied Combed Cotton Flatlay for Social Share Cards!');
                          }}
                          className="px-2 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[10px] font-semibold"
                        >
                          Fabric Flatlay
                        </button>
                      </div>
                    </div>

                    {/* Meta Description */}
                    <div className="lg:col-span-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-stone-700 text-xs">
                          Meta Description (<span className="font-mono">&lt;meta name="description"&gt;</span> &amp; <span className="font-mono">og:description</span>)
                        </label>
                        <span
                          className={`font-mono text-[10px] font-bold ${
                            (siteSettings.seo?.metaDescription?.length || 0) >= 120 && (siteSettings.seo?.metaDescription?.length || 0) <= 160
                              ? 'text-emerald-700'
                              : 'text-amber-600'
                          }`}
                        >
                          {siteSettings.seo?.metaDescription?.length || 0} / 160 chars (ideal: 120–160)
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={siteSettings.seo?.metaDescription || ''}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            seo: { ...siteSettings.seo, metaDescription: e.target.value },
                          })
                        }
                        placeholder="Shop engineered 240 GSM organic combed cotton t-shirts with anti-bacon ribbed collars and boxy streetwear drape. Fast express delivery in Bangladesh."
                        className="w-full px-3 py-2 border border-stone-300 rounded resize-none text-xs text-stone-900"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Brief, actionable summary that entices customers to click your link in search results.
                      </p>
                    </div>

                    {/* Focus Keywords */}
                    <div className="lg:col-span-2">
                      <label className="block font-semibold text-stone-700 mb-1 text-xs">
                        Target Focus Keywords (<span className="font-mono">&lt;meta name="keywords"&gt;</span>)
                      </label>
                      <input
                        type="text"
                        value={siteSettings.seo?.keywords || ''}
                        onChange={e =>
                          adminUpdateSiteSettings({
                            ...siteSettings,
                            seo: { ...siteSettings.seo, keywords: e.target.value },
                          })
                        }
                        placeholder="240 GSM t-shirt, heavyweight streetwear, boxy oversized tee, organic combed cotton, streetwear Dhaka, premium menswear Bangladesh"
                        className="w-full px-3 py-2 border border-stone-300 rounded text-xs font-medium"
                      />
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] text-stone-400">Quick-Add Keywords:</span>
                        {[
                          '240 GSM combed cotton',
                          'anti-bacon ribbed collar',
                          'heavyweight t-shirt',
                          'boxy oversized fit',
                          'streetwear apparel Dhaka',
                          'cash on delivery t-shirt',
                        ].map(kw => (
                          <button
                            key={kw}
                            type="button"
                            onClick={() => {
                              const currentKw = siteSettings.seo?.keywords || '';
                              if (!currentKw.includes(kw)) {
                                const next = currentKw ? `${currentKw}, ${kw}` : kw;
                                adminUpdateSiteSettings({
                                  ...siteSettings,
                                  seo: { ...siteSettings.seo, keywords: next },
                                });
                                showToast(`Added "${kw}" to SEO keywords!`);
                              }
                            }}
                            className="px-2 py-0.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[10px] font-medium transition-colors"
                          >
                            + {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Search Engine & Social Media Simulators */}
                  <div className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                          Live Snippet Simulator
                        </span>
                        <span className="text-[10px] text-stone-500">
                          (How customers and search engines see your site)
                        </span>
                      </div>

                      {/* Simulator Tab Buttons */}
                      <div className="flex items-center gap-1 bg-stone-200 p-0.5 rounded-lg text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setSeoPreviewMode('desktop')}
                          className={`px-2.5 py-1 rounded transition-colors ${
                            seoPreviewMode === 'desktop'
                              ? 'bg-white text-stone-900 font-bold shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Google Desktop
                        </button>
                        <button
                          type="button"
                          onClick={() => setSeoPreviewMode('mobile')}
                          className={`px-2.5 py-1 rounded transition-colors ${
                            seoPreviewMode === 'mobile'
                              ? 'bg-white text-stone-900 font-bold shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Google Mobile
                        </button>
                        <button
                          type="button"
                          onClick={() => setSeoPreviewMode('social')}
                          className={`px-2.5 py-1 rounded transition-colors ${
                            seoPreviewMode === 'social'
                              ? 'bg-white text-stone-900 font-bold shadow-2xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          Social Share Card
                        </button>
                      </div>
                    </div>

                    {/* Preview 1: Google Desktop Search Result */}
                    {seoPreviewMode === 'desktop' && (
                      <div className="p-4 bg-white rounded-lg border border-stone-200 shadow-2xs max-w-2xl font-sans">
                        <div className="flex items-center gap-2 mb-1">
                          <img
                            src={
                              siteSettings.faviconUrl ||
                              "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F172A'/><text x='50' y='68' font-family='sans-serif' font-size='52' font-weight='900' fill='%23FFFFFF' text-anchor='middle'>TC</text></svg>"
                            }
                            alt=""
                            className="w-4 h-4 rounded-full"
                          />
                          <div className="text-[12px] text-[#202124] leading-tight">
                            <span className="font-medium">{siteSettings.siteName || 'ThreadCraft'}</span>
                            <span className="text-[#5f6368] ml-1.5 font-mono text-[11px]">https://threadcraft.studio</span>
                          </div>
                        </div>

                        <h4 className="text-[18px] text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug line-clamp-1">
                          {siteSettings.seo?.metaTitle || `${siteSettings.siteName} — Heavyweight Streetwear & 240 GSM T-Shirts`}
                        </h4>

                        <p className="text-[13px] text-[#4d5156] mt-1 leading-relaxed line-clamp-2">
                          {siteSettings.seo?.metaDescription ||
                            'Shop engineered 240 GSM organic combed cotton t-shirts with anti-bacon ribbed collars and boxy streetwear drape. Fast express delivery across Bangladesh.'}
                        </p>

                        <div className="flex items-center gap-3 mt-2 text-[11px] text-[#5f6368] font-medium border-t border-stone-100 pt-1.5">
                          <span>Rating: ★ 4.9 · 8 reviews</span>
                          <span>·</span>
                          <span>In Stock</span>
                          <span>·</span>
                          <span>Currency: BDT (৳)</span>
                        </div>
                      </div>
                    )}

                    {/* Preview 2: Google Mobile Search Result */}
                    {seoPreviewMode === 'mobile' && (
                      <div className="p-4 bg-white rounded-xl border border-stone-200 shadow-2xs max-w-sm font-sans">
                        <div className="flex items-center gap-2 mb-1.5">
                          <img
                            src={
                              siteSettings.faviconUrl ||
                              "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F172A'/><text x='50' y='68' font-family='sans-serif' font-size='52' font-weight='900' fill='%23FFFFFF' text-anchor='middle'>TC</text></svg>"
                            }
                            alt=""
                            className="w-5 h-5 rounded-full"
                          />
                          <div>
                            <p className="text-[12px] font-semibold text-[#202124] leading-none">
                              {siteSettings.siteName || 'ThreadCraft'}
                            </p>
                            <p className="text-[10px] text-[#5f6368] font-mono leading-none mt-0.5">
                              threadcraft.studio
                            </p>
                          </div>
                        </div>

                        <h4 className="text-[16px] text-[#1a0dab] font-medium leading-snug">
                          {siteSettings.seo?.metaTitle || `${siteSettings.siteName} — Heavyweight Streetwear & 240 GSM T-Shirts`}
                        </h4>

                        <p className="text-[12px] text-[#4d5156] mt-1 leading-normal">
                          {siteSettings.seo?.metaDescription ||
                            'Shop engineered 240 GSM organic combed cotton t-shirts with anti-bacon ribbed collars and boxy streetwear drape. Fast express delivery across Bangladesh.'}
                        </p>
                      </div>
                    )}

                    {/* Preview 3: Social Sharing Card (Twitter / Discord / Facebook) */}
                    {seoPreviewMode === 'social' && (
                      <div className="bg-white rounded-xl border border-stone-200 shadow-2xs max-w-lg overflow-hidden">
                        <div className="relative aspect-[1.91/1] bg-stone-900 overflow-hidden">
                          <img
                            src={
                              siteSettings.seo?.ogImage ||
                              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&h=630&q=85'
                            }
                            alt="Social Card Preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] text-white font-mono uppercase tracking-wider">
                            THREADCRAFT.STUDIO
                          </div>
                        </div>

                        <div className="p-3.5 space-y-1">
                          <span className="text-[10px] font-mono text-stone-400 uppercase tracking-widest block">
                            threadcraft.studio
                          </span>
                          <h4 className="font-extrabold text-sm text-stone-900 line-clamp-1">
                            {siteSettings.seo?.metaTitle || `${siteSettings.siteName} — Heavyweight Streetwear & 240 GSM T-Shirts`}
                          </h4>
                          <p className="text-xs text-stone-500 line-clamp-2">
                            {siteSettings.seo?.metaDescription ||
                              'Shop engineered 240 GSM organic combed cotton t-shirts with anti-bacon ribbed collars and boxy streetwear drape. Fast express delivery across Bangladesh.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Schema.org Status Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                      <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Storefront Schema
                        </span>
                        <span className="font-extrabold text-stone-900 text-xs block mt-0.5">
                          schema.org/OnlineStore
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                          ✓ Organization & BDT Currency
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Sitelinks Search
                        </span>
                        <span className="font-extrabold text-stone-900 text-xs block mt-0.5">
                          schema.org/SearchAction
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                          ✓ Catalog Query Sitelinks Box
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-stone-200">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                          Product Rich Snippets
                        </span>
                        <span className="font-extrabold text-stone-900 text-xs block mt-0.5">
                          AggregateRating &amp; Offers
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium mt-0.5 block">
                          ✓ Dynamic star reviews in Google
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    onClick={() => showToast('All site customization saved to database!')}
                    className="px-6 py-2.5 bg-stone-900 text-white rounded-md font-bold text-xs hover:bg-stone-800"
                  >
                    Save All Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 10. NEWS & PAGES CMS SECTION */}
          {activeSection === 'cms' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 tracking-tight">Content Management (CMS)</h2>
                  <p className="text-xs text-stone-500 mt-1">
                    Manage Fabric Journal articles and informational content pages.
                  </p>
                </div>

                <button
                  onClick={() => {
                    const newPost: NewsPost = {
                      id: `post-${Date.now()}`,
                      title: 'New Fabric Drop Article',
                      slug: `new-fabric-drop-${Date.now()}`,
                      excerpt: 'Discover our latest 240 GSM organic ring-spun cotton drop.',
                      content: 'Detailed discussion about textile engineering and streetwear drape.',
                      imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
                      author: 'Editorial Team',
                      publishedAt: new Date().toISOString().split('T')[0],
                      isPublished: true,
                      category: 'Textile Science',
                    };
                    adminSaveNewsPost(newPost);
                    showToast('Created new journal post draft');
                  }}
                  className="px-4 py-2 bg-stone-900 text-white rounded-md text-xs font-bold hover:bg-stone-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Journal Post</span>
                </button>
              </div>

              {/* News Posts Table */}
              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-stone-100 font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Journal Articles ({newsPosts.length})
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[540px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                        <th className="p-3">Title & Category</th>
                        <th className="p-3">Author</th>
                        <th className="p-3">Published Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {newsPosts.map(post => (
                        <tr key={post.id} className="hover:bg-stone-50">
                          <td className="p-3">
                            {editingPostId === post.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingPostTitle}
                                  onChange={e => setEditingPostTitle(e.target.value)}
                                  className="px-2 py-1 border border-stone-300 rounded text-xs font-bold text-stone-900 bg-white flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (editingPostTitle.trim()) {
                                      adminSaveNewsPost({ ...post, title: editingPostTitle.trim() });
                                      showToast('Updated article title');
                                    }
                                    setEditingPostId(null);
                                  }}
                                  className="px-2 py-1 bg-stone-900 text-white rounded text-[11px] font-bold"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPostId(null)}
                                  className="px-2 py-1 border border-stone-200 rounded text-[11px] text-stone-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="font-bold text-stone-900">{post.title}</p>
                                <span className="text-[10px] text-stone-500 font-mono">/{post.slug}</span>
                              </>
                            )}
                          </td>
                          <td className="p-3 text-stone-600">{post.author}</td>
                          <td className="p-3 text-stone-500">{post.publishedAt}</td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingPostId(post.id);
                                setEditingPostTitle(post.title);
                              }}
                              className="text-stone-700 hover:text-stone-900 font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => adminDeleteNewsPost(post.id)}
                              className="text-stone-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Static Pages */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3 shadow-2xs">
                <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Informational Content Pages ({staticPages.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {staticPages.map(page => (
                    <div key={page.id} className="p-3 rounded bg-stone-50 border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-stone-900">{page.title}</p>
                        <span className="font-mono text-[10px] text-stone-500">/{page.slug}</span>
                      </div>
                      {editingPageId === page.id ? (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={3}
                            value={editingPageContent}
                            onChange={e => setEditingPageContent(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white text-xs text-stone-800"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingPageId(null)}
                              className="px-2.5 py-1 border border-stone-300 rounded text-[11px] font-semibold text-stone-600 bg-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                adminSaveStaticPage({
                                  ...page,
                                  content: editingPageContent,
                                  updatedAt: new Date().toISOString(),
                                });
                                setEditingPageId(null);
                                showToast(`Updated ${page.title}`);
                              }}
                              className="px-2.5 py-1 bg-stone-900 text-white rounded text-[11px] font-bold"
                            >
                              Save Content
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] text-stone-500 line-clamp-2">{page.content}</p>
                          <button
                            onClick={() => {
                              setEditingPageId(page.id);
                              setEditingPageContent(page.content);
                            }}
                            className="text-rose-600 font-semibold hover:underline mt-1"
                          >
                            Edit Body Text →
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 11. AUDIT LOGS SECTION */}
          {activeSection === 'audit_logs' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">Security Audit Logs</h2>
                <p className="text-xs text-stone-500 mt-1">
                  Immutable record of sensitive admin operations: payment verifications, status changes, inventory adjustments.
                </p>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                        <th className="p-3.5">Timestamp</th>
                        <th className="p-3.5">Actor</th>
                        <th className="p-3.5">Action</th>
                        <th className="p-3.5">Target Entity</th>
                        <th className="p-3.5">Audit Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-stone-50">
                          <td className="p-3.5 text-stone-500 font-mono text-[11px] whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-stone-900">{log.actorName}</span>
                            <span className="text-[10px] text-stone-400 block font-mono capitalize">{log.actorRole}</span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                              {log.action}
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                            {log.entityType} ({log.entityId})
                          </td>

                          <td className="p-3.5 font-sans leading-relaxed text-stone-800">
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 12. CPANEL PHP/MYSQL DEPLOYMENT CENTER & EXPORT */}
          {activeSection === 'cpanel_export' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black text-stone-900 tracking-tight">cPanel PHP/MySQL Production Package</h2>
                <p className="text-xs text-stone-500 mt-1">
                  100% compliant with <strong>STRUCTURE.md</strong> and <strong>RULES.md</strong>. Ready to import into phpMyAdmin and shared cPanel hosting.
                </p>
              </div>

              {/* Package Details Banner */}
              <div className="bg-stone-900 text-white p-6 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-stone-100">
                      ThreadCraft V2 — Production Deliverables Ready
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      PHP 8.x + MySQL/MariaDB PDO Prepared Statements · No Node.js runtime required on cPanel.
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold">
                    Apache .htaccess Ready
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-stone-800">
                  <div>
                    <p className="text-stone-400 font-bold">SQL Migration</p>
                    <p className="font-mono text-stone-200">database/migrations/001_initial_schema.sql</p>
                  </div>
                  <div>
                    <p className="text-stone-400 font-bold">Apache Rewrite</p>
                    <p className="font-mono text-stone-200">public/.htaccess & public/index.php</p>
                  </div>
                  <div>
                    <p className="text-stone-400 font-bold">Documentation</p>
                    <p className="font-mono text-stone-200">README.md & RULES.md</p>
                  </div>
                </div>
              </div>

              {/* SQL Migration Script Viewer */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                    MySQL Schema Migration File (001_initial_schema.sql)
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`-- SQL Schema from database/migrations/001_initial_schema.sql`);
                      showToast('Copied schema location to clipboard');
                    }}
                    className="text-xs text-rose-600 font-semibold hover:underline"
                  >
                    Copy Path
                  </button>
                </div>

                <p className="text-xs text-stone-600">
                  This migration provisions all 18 tables including <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">product_variants</code> with unique <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">(product_id, color_name, size)</code> constraints, independent stock counters, and immutable <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">order_items</code> snapshots.
                </p>

                <div className="p-4 bg-stone-950 text-stone-200 rounded-lg font-mono text-xs overflow-x-auto max-h-72">
                  <pre>{`-- 1. Users table (Customer & Admin Accounts)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`uuid\` VARCHAR(36) NOT NULL UNIQUE,
  \`name\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`phone\` VARCHAR(30) NOT NULL,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  \`status\` ENUM('active', 'suspended', 'archived') NOT NULL DEFAULT 'active',
  \`loyalty_points\` INT UNSIGNED NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Product Variants (Independent SKU & Stock)
CREATE TABLE IF NOT EXISTS \`product_variants\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`color_name\` VARCHAR(60) NOT NULL,
  \`color_hex\` VARCHAR(10) NOT NULL,
  \`size\` ENUM('XS', 'S', 'M', 'L', 'XL', '2XL') NOT NULL,
  \`sku\` VARCHAR(60) NOT NULL UNIQUE,
  \`price_override\` DECIMAL(10,2) NULL,
  \`stock_quantity\` INT NOT NULL DEFAULT 0,
  \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY \`uk_product_color_size\` (\`product_id\`, \`color_name\`, \`size\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`}</pre>
                </div>
              </div>

              {/* cPanel 5-Step Deployment Guide */}
              <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-3">
                <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  5-Step cPanel Deployment Guide
                </h3>
                <ol className="list-decimal list-inside text-xs text-stone-700 space-y-2 leading-relaxed font-sans">
                  <li>
                    <strong>Upload Files:</strong> In cPanel File Manager, extract the private application code to <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">/home/USER/private_app/</code> and public assets to <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">/home/USER/public_html/</code>.
                  </li>
                  <li>
                    <strong>Create MySQL Database:</strong> In cPanel MySQL Databases, create a new database (e.g. <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">threadcraft_db</code>) and grant All Privileges to your database user.
                  </li>
                  <li>
                    <strong>Import Schema:</strong> Open phpMyAdmin, select your database, click "Import", and select <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">database/migrations/001_initial_schema.sql</code>.
                  </li>
                  <li>
                    <strong>Configure .env:</strong> Copy <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">.env.example</code> to <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">.env</code> in the private directory and enter your database credentials.
                  </li>
                  <li>
                    <strong>Verify Apache .htaccess:</strong> Ensure <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">public_html/.htaccess</code> has <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">RewriteEngine On</code> enabled to route requests through <code className="bg-stone-100 px-1 py-0.5 rounded font-mono">index.php</code>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* SECTION: SMTP Mailer & Dispatch Hub */}
          {activeSection === 'smtp' && <SmtpMailerHub />}
        </main>
      </div>

      {/* MODAL: Verify Manual Payment */}
      {verifyOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl text-xs">
            <h3 className="font-extrabold text-stone-900 text-sm">Approve Manual Payment</h3>
            <p className="text-stone-600 leading-relaxed">
              Confirm that you have cross-checked the customer's TrxID with your merchant or personal bank/mobile statement.
            </p>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Admin Verification Notes</label>
              <input
                type="text"
                placeholder="e.g. Verified in bKash Merchant statement at 3:30 PM"
                value={verifyNotes}
                onChange={e => setVerifyNotes(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyOrderId(null)}
                className="px-4 py-2 border border-stone-300 rounded text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adminVerifyPayment(verifyOrderId, verifyNotes);
                  setVerifyOrderId(null);
                  setVerifyNotes('');
                  showToast('Payment verified successfully!');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700"
              >
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Manual Payment */}
      {rejectOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl text-xs">
            <h3 className="font-extrabold text-stone-900 text-sm text-rose-600">Reject Payment Claim</h3>
            <p className="text-stone-600 leading-relaxed">
              State the exact reason for rejecting this claim (e.g. TrxID not found in statement, incorrect amount). This note is saved in the audit log.
            </p>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Rejection Reason *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. TrxID BK9A77209X does not appear in our statement. Please verify transaction."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectOrderId(null)}
                className="px-4 py-2 border border-stone-300 rounded text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectReason.trim()}
                onClick={() => {
                  adminRejectPayment(rejectOrderId, rejectReason);
                  setRejectOrderId(null);
                  setRejectReason('');
                  showToast('Payment claim rejected.');
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Inspect & Update Order Snapshot */}
      {inspectOrderId && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 flex items-center justify-center p-4 overflow-y-auto">
          {(() => {
            const inspectedOrder = orders.find(o => o.id === inspectOrderId);
            if (!inspectedOrder) return null;

            return (
              <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl text-xs max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="font-extrabold text-stone-900 text-base">
                      Order #{inspectedOrder.orderNumber}
                    </h3>
                    <p className="text-stone-500 text-[11px]">
                      Created: {new Date(inspectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button onClick={() => setInspectOrderId(null)} className="text-stone-400 hover:text-stone-900 font-bold">
                    ✕
                  </button>
                </div>

                {/* Items Snapshot */}
                <div className="space-y-2">
                  <p className="font-bold text-stone-700 uppercase tracking-wider text-[10px]">
                    Preserved Order Item Snapshots
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {inspectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-stone-50 border">
                        <div className="flex items-center gap-2">
                          <img src={item.imageUrl} alt="" className="w-8 h-10 object-cover rounded" />
                          <div>
                            <p className="font-bold text-stone-900">{item.productName}</p>
                            <p className="text-stone-500 text-[10px]">
                              {item.colorName} · {item.size} · Qty {item.quantity} · SKU: {item.sku}
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-stone-900">
                          {siteSettings.currencySymbol}{item.lineTotal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address and Zone Snapshot */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded border">
                  <div>
                    <p className="font-bold text-stone-800">Delivery Address</p>
                    <p className="text-stone-600">{inspectedOrder.deliveryAddressSnapshot.recipientName}</p>
                    <p className="text-stone-500">{inspectedOrder.deliveryAddressSnapshot.addressLine}</p>
                    <p className="text-stone-500">Phone: {inspectedOrder.deliveryAddressSnapshot.phone}</p>
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">Zone Snapshot</p>
                    <p className="text-stone-600">{inspectedOrder.deliveryZoneSnapshot.name}</p>
                    <p className="text-stone-500">Fee: {siteSettings.currencySymbol}{inspectedOrder.deliveryFee}</p>
                    <p className="text-stone-800 font-bold mt-1">Total: {siteSettings.currencySymbol}{inspectedOrder.grandTotal}</p>
                  </div>
                </div>

                {/* Status Update Form */}
                <div className="space-y-3 pt-2 border-t border-stone-200">
                  <p className="font-bold text-stone-900">Update Order Fulfillment Status</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-600 mb-1 font-semibold">New Status</label>
                      <select
                        value={orderStatusUpdate}
                        onChange={e => setOrderStatusUpdate(e.target.value as OrderStatus)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white font-medium"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered (Awards Loyalty Points)</option>
                        <option value="cancelled">Cancelled (Restores Stock)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 font-semibold">Status Update Note</label>
                      <input
                        type="text"
                        placeholder="e.g. Packed and ready for carrier dispatch"
                        value={orderStatusNote}
                        onChange={e => setOrderStatusNote(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 font-semibold">Courier / Carrier Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Steadfast Courier"
                        value={carrierNameInput}
                        onChange={e => setCarrierNameInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 font-semibold">Courier Tracking Number</label>
                      <input
                        type="text"
                        placeholder="e.g. SFC-8942110"
                        value={trackingNumberInput}
                        onChange={e => setTrackingNumberInput(e.target.value)}
                        className="w-full px-2.5 py-1.5 border border-stone-300 rounded font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setInspectOrderId(null)}
                      className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        adminUpdateOrderStatus(
                          inspectedOrder.id,
                          orderStatusUpdate,
                          orderStatusNote,
                          carrierNameInput,
                          trackingNumberInput
                        );
                        setInspectOrderId(null);
                        showToast(`Order status updated to ${orderStatusUpdate}`);
                      }}
                      className="px-4 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                    >
                      Save Status Update
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL: Edit Product & Variants */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-extrabold text-stone-900 text-base">
                {isNewProduct ? 'Create New Product' : `Edit Product: ${editingProduct.name}`}
              </h3>
              <button onClick={() => setEditingProduct(null)} className="text-stone-400 hover:text-stone-900 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Base Price ({siteSettings.currencySymbol})</label>
                <input
                  type="number"
                  value={editingProduct.basePrice}
                  onChange={e => setEditingProduct({ ...editingProduct, basePrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Fabric Weight</label>
                <input
                  type="text"
                  value={editingProduct.fabricWeight}
                  onChange={e => setEditingProduct({ ...editingProduct, fabricWeight: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Fit Silhouette</label>
                <select
                  value={editingProduct.fitType}
                  onChange={e => setEditingProduct({ ...editingProduct, fitType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white"
                >
                  <option value="Boxy Heavyweight">Boxy Heavyweight</option>
                  <option value="Oversized">Oversized</option>
                  <option value="Regular Fit">Regular Fit</option>
                  <option value="Relaxed">Relaxed</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Short Description</label>
                <input
                  type="text"
                  value={editingProduct.shortDescription}
                  onChange={e => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">Detailed Description</label>
                <textarea
                  rows={3}
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded resize-none"
                />
              </div>
            </div>

            {/* Configured Variants */}
            <div className="space-y-3 pt-3 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Configured Variants ({editingProduct.variants.length})
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    const newV: ProductVariant = {
                      id: `v-${Date.now()}`,
                      productId: editingProduct.id,
                      colorName: 'Vintage Sand',
                      colorHex: '#D2B48C',
                      size: 'L',
                      sku: `TC-SND-${Date.now().toString().slice(-4)}`,
                      priceOverride: null,
                      stockQuantity: 10,
                      isActive: true,
                    };
                    setEditingProduct({
                      ...editingProduct,
                      variants: [...editingProduct.variants, newV],
                    });
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-[11px]"
                >
                  + Add Variant
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {editingProduct.variants.map((v, i) => (
                  <div key={v.id} className="p-2.5 rounded bg-stone-50 border border-stone-200 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Color Name"
                      value={v.colorName}
                      onChange={e => {
                        const updated = [...editingProduct.variants];
                        updated[i].colorName = e.target.value;
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="px-2 py-1 border rounded bg-white min-w-0"
                    />

                    <select
                      value={v.size}
                      onChange={e => {
                        const updated = [...editingProduct.variants];
                        updated[i].size = e.target.value as any;
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="px-2 py-1 border rounded bg-white font-bold"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="2XL">2XL</option>
                    </select>

                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={e => {
                        const updated = [...editingProduct.variants];
                        updated[i].sku = e.target.value;
                        setEditingProduct({ ...editingProduct, variants: updated });
                      }}
                      className="px-2 py-1 border rounded bg-white font-mono min-w-0"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-stone-400">Stock:</span>
                      <input
                        type="number"
                        value={v.stockQuantity}
                        onChange={e => {
                          const updated = [...editingProduct.variants];
                          updated[i].stockQuantity = parseInt(e.target.value, 10) || 0;
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="w-16 px-1.5 py-1 border rounded bg-white font-bold"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-stone-400">Price:</span>
                      <input
                        type="number"
                        placeholder="Base"
                        value={v.priceOverride !== null ? v.priceOverride : ''}
                        onChange={e => {
                          const updated = [...editingProduct.variants];
                          updated[i].priceOverride = e.target.value === '' ? null : parseFloat(e.target.value);
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="w-20 px-1.5 py-1 border rounded bg-white text-[11px]"
                      />
                    </div>

                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingProduct.variants.filter((_, idx) => idx !== i);
                          setEditingProduct({ ...editingProduct, variants: updated });
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1"
                        title="Delete variant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  adminSaveProduct(editingProduct);
                  setEditingProduct(null);
                  showToast('Product and variants saved successfully!');
                }}
                className="px-5 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
              >
                Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Dedicated Variant Stock Control Modal */}
      {stockControlVariant && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 border border-stone-200 shadow-2xl text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">
                    Variant Stock Control
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Live inventory adjustment for single SKU record
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockControlVariant(null)}
                className="text-stone-400 hover:text-stone-900 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Target Variant Metadata Card */}
            <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Product
                  </span>
                  <span className="font-extrabold text-stone-900 text-sm">
                    {stockControlVariant.product.name}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                  {stockControlVariant.variant.sku}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs pt-1 border-t border-stone-200/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500">Color:</span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: stockControlVariant.variant.colorHex }}
                  />
                  <span className="font-bold text-stone-900">
                    {stockControlVariant.variant.colorName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-500">Size:</span>
                  <span className="font-bold text-stone-900 px-1.5 py-0.2 rounded bg-stone-200">
                    {stockControlVariant.variant.size}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-stone-500">Currently:</span>
                  <span
                    className={`font-black ${
                      stockControlVariant.variant.stockQuantity === 0
                        ? 'text-rose-600'
                        : stockControlVariant.variant.stockQuantity <= 3
                        ? 'text-amber-600'
                        : 'text-stone-900'
                    }`}
                  >
                    {stockControlVariant.variant.stockQuantity} units
                  </span>
                </div>
              </div>
            </div>

            {/* Main Stock Quantity Stepper & Input */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800 text-xs">
                  New Available Stock Quantity
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-stone-500">Inventory Status:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      stockControlNewQty === 0
                        ? 'bg-rose-100 text-rose-700'
                        : stockControlNewQty <= 3
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {stockControlNewQty === 0
                      ? 'Out of Stock'
                      : stockControlNewQty <= 3
                      ? 'Low Stock Alert'
                      : 'In Stock & Ready'}
                  </span>
                </div>
              </div>

              {/* Stepper Input Widget */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(Math.max(0, stockControlNewQty - 10))}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold transition-colors"
                  title="Minus 10"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(Math.max(0, stockControlNewQty - 1))}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold transition-colors"
                  title="Minus 1"
                >
                  -1
                </button>
                <input
                  type="number"
                  min="0"
                  value={stockControlNewQty}
                  onChange={e => setStockControlNewQty(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="flex-1 text-center py-2 px-3 border-2 border-stone-900 rounded font-black text-lg text-stone-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(stockControlNewQty + 1)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold transition-colors"
                  title="Plus 1"
                >
                  +1
                </button>
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(stockControlNewQty + 10)}
                  className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-bold transition-colors"
                  title="Plus 10"
                >
                  +10
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(0)}
                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px]"
                >
                  Set to 0 (Out of Stock)
                </button>
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(5)}
                  className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px]"
                >
                  5 (Low Buffer)
                </button>
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(15)}
                  className="px-2 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200 font-semibold text-[11px]"
                >
                  15 (Standard Safety)
                </button>
                <button
                  type="button"
                  onClick={() => setStockControlNewQty(50)}
                  className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px]"
                >
                  50 (Factory Restock)
                </button>
              </div>
            </div>

            {/* Audit Reason Input */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Adjustment Reason / Reference Note (Recorded in Audit Ledger)
              </label>
              <input
                type="text"
                value={stockControlReason}
                onChange={e => setStockControlReason(e.target.value)}
                placeholder="e.g. Factory delivery consignment #402, monthly physical count"
                className="w-full px-3 py-2 border border-stone-300 rounded bg-white text-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <span className="text-[11px] text-stone-500">
                Delta: {stockControlNewQty - stockControlVariant.variant.stockQuantity > 0 ? '+' : ''}
                {stockControlNewQty - stockControlVariant.variant.stockQuantity} units
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStockControlVariant(null)}
                  className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adminUpdateVariantStock(
                      stockControlVariant.variant.id,
                      stockControlNewQty,
                      stockControlReason
                    );
                    showToast(
                      `Stock for ${stockControlVariant.variant.sku} successfully updated to ${stockControlNewQty} units!`
                    );
                    setStockControlVariant(null);
                  }}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Stock Quantity</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Bulk Product Stock Control Matrix */}
      {bulkStockProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl text-xs max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">
                    Product-Wide Stock Control: {bulkStockProduct.name}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Adjust stock quantities across all {bulkStockProduct.variants.length} color/size variants simultaneously
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBulkStockProduct(null)}
                className="text-stone-400 hover:text-stone-900 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Quick Batch Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
              <span className="text-[11px] font-semibold text-stone-700">
                Batch Quick Adjustment (Applies to all variants):
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...bulkStockMap };
                    bulkStockProduct.variants.forEach(v => {
                      updated[v.id] = (updated[v.id] || 0) + 5;
                    });
                    setBulkStockMap(updated);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded font-semibold text-stone-800 text-[11px]"
                >
                  +5 All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...bulkStockMap };
                    bulkStockProduct.variants.forEach(v => {
                      updated[v.id] = (updated[v.id] || 0) + 10;
                    });
                    setBulkStockMap(updated);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded font-semibold text-stone-800 text-[11px]"
                >
                  +10 All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...bulkStockMap };
                    bulkStockProduct.variants.forEach(v => {
                      updated[v.id] = 20;
                    });
                    setBulkStockMap(updated);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 border border-stone-300 rounded font-semibold text-stone-800 text-[11px]"
                >
                  Set All to 20
                </button>
              </div>
            </div>

            {/* Variants Stock Table */}
            <div className="border border-stone-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                    <th className="p-2.5">Variant Colorway</th>
                    <th className="p-2.5">Size</th>
                    <th className="p-2.5">SKU</th>
                    <th className="p-2.5">Current</th>
                    <th className="p-2.5">New Stock</th>
                    <th className="p-2.5 text-right">Quick Steppers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bulkStockProduct.variants.map(v => {
                    const currentVal = bulkStockMap[v.id] !== undefined ? bulkStockMap[v.id] : v.stockQuantity;
                    return (
                      <tr key={v.id} className="hover:bg-stone-50">
                        <td className="p-2.5 flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/20"
                            style={{ backgroundColor: v.colorHex }}
                          />
                          <span className="font-semibold text-stone-900">{v.colorName}</span>
                        </td>
                        <td className="p-2.5 font-bold text-stone-900">{v.size}</td>
                        <td className="p-2.5 font-mono text-stone-500">{v.sku}</td>
                        <td className="p-2.5 text-stone-500">{v.stockQuantity}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min="0"
                            value={currentVal}
                            onChange={e => {
                              const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                              setBulkStockMap(prev => ({ ...prev, [v.id]: val }));
                            }}
                            className="w-20 px-2 py-1 border-2 border-stone-400 focus:border-stone-900 rounded font-bold text-stone-900 text-center"
                          />
                        </td>
                        <td className="p-2.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setBulkStockMap(prev => ({
                                  ...prev,
                                  [v.id]: Math.max(0, currentVal - 1),
                                }));
                              }}
                              className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center text-xs"
                            >
                              -1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBulkStockMap(prev => ({
                                  ...prev,
                                  [v.id]: currentVal + 1,
                                }));
                              }}
                              className="w-6 h-6 rounded bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center text-xs"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setBulkStockMap(prev => ({
                                  ...prev,
                                  [v.id]: currentVal + 5,
                                }));
                              }}
                              className="px-1.5 h-6 rounded bg-stone-100 hover:bg-stone-200 font-semibold text-stone-700 flex items-center justify-center text-[11px]"
                            >
                              +5
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total count and save */}
            <div className="flex items-center justify-between pt-3 border-t border-stone-200">
              <span className="font-bold text-stone-800 text-xs">
                Total Product Units After Save:{' '}
                {Object.values(bulkStockMap).reduce((acc, qty) => acc + qty, 0)} units
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBulkStockProduct(null)}
                  className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    Object.entries(bulkStockMap).forEach(([variantId, newQty]) => {
                      adminUpdateVariantStock(variantId, newQty, 'Bulk product stock matrix update');
                    });
                    showToast(`All variant stock levels for ${bulkStockProduct.name} saved!`);
                    setBulkStockProduct(null);
                  }}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save All Stock Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {loyaltyUserId && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl text-xs">
            <h3 className="font-extrabold text-stone-900 text-sm">Manual Loyalty Points Adjustment</h3>
            <p className="text-stone-600 leading-relaxed">
              Manually add or deduct rewards points. This operation is recorded in the permanent audit ledger.
            </p>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Points Delta (+ to add, - to deduct)</label>
              <input
                type="number"
                value={loyaltyDelta}
                onChange={e => setLoyaltyDelta(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-stone-300 rounded font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Reason / Reference *</label>
              <input
                type="text"
                required
                value={loyaltyReason}
                onChange={e => setLoyaltyReason(e.target.value)}
                placeholder="e.g. VIP goodwill bonus or dispute compensation"
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLoyaltyUserId(null)}
                className="px-4 py-2 border border-stone-300 rounded text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!loyaltyReason.trim()}
                onClick={() => {
                  adminAdjustLoyaltyPoints(loyaltyUserId, loyaltyDelta, loyaltyReason);
                  setLoyaltyUserId(null);
                  showToast(`Adjusted points by ${loyaltyDelta}`);
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800 disabled:opacity-50"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Payment Method Config Editor */}
      {editingPaymentMethod && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-5 border border-stone-200 shadow-2xl text-xs max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm">
                    {isNewPaymentMethod ? 'Add New Payment Method' : `Edit Payment Method: ${editingPaymentMethod.name}`}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Configure payment channel, recipient account details, and customer checkout instructions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPaymentMethod(null)}
                className="text-stone-400 hover:text-stone-900 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Method Name */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-stone-700 mb-1">
                  Method Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={editingPaymentMethod.name}
                  onChange={e =>
                    setEditingPaymentMethod({ ...editingPaymentMethod, name: e.target.value })
                  }
                  placeholder="e.g. bKash Merchant, Nagad Personal, Bank Transfer (City Bank)"
                  className="w-full px-3 py-2 border border-stone-300 rounded font-bold text-stone-900 text-xs focus:border-stone-900"
                />
              </div>

              {/* Payment Type */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Payment Gateway / Method Type
                </label>
                <select
                  value={editingPaymentMethod.type}
                  onChange={e => {
                    const newType = e.target.value as PaymentMethodType;
                    const defaultAccountType = newType === 'bank' ? 'bank' : newType === 'cod' ? 'personal' : 'merchant';
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      type: newType,
                      accountType: defaultAccountType,
                    });
                  }}
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs bg-white text-stone-900 font-semibold"
                >
                  <option value="bkash">bKash (Mobile Financial Service)</option>
                  <option value="nagad">Nagad (Post Office MFS)</option>
                  <option value="rocket">Rocket (DBBL MFS)</option>
                  <option value="bank">Direct Bank Transfer / Wire</option>
                  <option value="cod">Cash on Delivery (COD)</option>
                </select>
              </div>

              {/* Account Type */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Account Type
                </label>
                <select
                  value={editingPaymentMethod.accountType}
                  onChange={e =>
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      accountType: e.target.value as 'personal' | 'merchant' | 'bank',
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs bg-white text-stone-900 font-semibold"
                >
                  <option value="merchant">Merchant Account ("Make Payment")</option>
                  <option value="personal">Personal Account ("Send Money")</option>
                  <option value="bank">Bank Account / Corporate Account</option>
                </select>
              </div>

              {/* Recipient Account / Phone */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Recipient Account Number / Information *
                </label>
                <input
                  type="text"
                  value={editingPaymentMethod.recipientNumber}
                  onChange={e =>
                    setEditingPaymentMethod({ ...editingPaymentMethod, recipientNumber: e.target.value })
                  }
                  placeholder={
                    editingPaymentMethod.type === 'cod'
                      ? 'N/A (Cash on Delivery)'
                      : editingPaymentMethod.type === 'bank'
                      ? 'Bank: City Bank, A/C: 11029384758'
                      : '01712-345678'
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded font-mono text-xs text-stone-900 focus:border-stone-900"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Displayed prominently to buyers at checkout with one-click copy button.
                </p>
              </div>

              {/* Display Sequence Order */}
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Display Order Sequence
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingPaymentMethod.displayOrder}
                  onChange={e =>
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      displayOrder: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded text-xs text-stone-900 font-bold focus:border-stone-900"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  Lower numbers display first in the checkout radio selection list.
                </p>
              </div>

              {/* Active Toggle */}
              <div className="sm:col-span-2 flex items-center justify-between p-3 bg-stone-50 rounded-lg border border-stone-200">
                <div>
                  <span className="font-bold text-stone-900 block text-xs">Active in Checkout</span>
                  <span className="text-[11px] text-stone-500">
                    When enabled, customers can select this payment method during checkout.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPaymentMethod.isEnabled}
                    onChange={e =>
                      setEditingPaymentMethod({
                        ...editingPaymentMethod,
                        isEnabled: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Quick Templates for Instructions */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-700 text-xs">
                  Customer Checkout Instructions *
                </label>
                <span className="text-[10px] text-stone-400 font-medium">
                  Click a template to auto-populate instructions
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const num = editingPaymentMethod.recipientNumber || '01712-XXXXXX';
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      instructions: `1. Open your bKash Mobile App or dial *247#\n2. Select "Make Payment"\n3. Enter Merchant Number: ${num}\n4. Enter total order amount in BDT\n5. Enter reference: Your Order Number\n6. Enter your bKash PIN to confirm payment\n7. Copy the 10-character TrxID and paste it below.`,
                    });
                    showToast('Populated bKash Merchant template');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  bKash Merchant
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const num = editingPaymentMethod.recipientNumber || '01712-XXXXXX';
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      instructions: `1. Open your bKash Mobile App or dial *247#\n2. Select "Send Money"\n3. Enter Personal Number: ${num}\n4. Enter total order amount in BDT\n5. Enter your phone number as reference\n6. Enter PIN to confirm payment\n7. Copy the TrxID and paste it below.`,
                    });
                    showToast('Populated bKash Personal template');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  bKash Personal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const num = editingPaymentMethod.recipientNumber || '01812-XXXXXX';
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      instructions: `1. Open Nagad Mobile App or dial *167#\n2. Select "Send Money" (or "Make Payment" if merchant)\n3. Enter Nagad Number: ${num}\n4. Enter total payable amount\n5. Enter reference: Your order number or phone\n6. Enter your Nagad PIN to confirm\n7. Copy the 8-character TrxID and paste it below.`,
                    });
                    showToast('Populated Nagad template');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  Nagad MFS
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const num = editingPaymentMethod.recipientNumber || '01912-XXXXXX';
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      instructions: `1. Open Rocket App or dial *322#\n2. Select "Send Money" / "Merchant Pay"\n3. Enter 12-digit Rocket Account: ${num}\n4. Enter order bill amount\n5. Enter reference: Order Number\n6. Confirm with PIN and copy the Transaction ID here.`,
                    });
                    showToast('Populated Rocket template');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  Rocket DBBL
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const num = editingPaymentMethod.recipientNumber || '11029384758';
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      instructions: `1. Transfer total order amount via BEFTN, NPSB, or Internet Banking to:\n   Bank: City Bank PLC\n   Account Name: ThreadCraft Apparel Ltd.\n   Account Number: ${num}\n   Branch: Gulshan-2, Dhaka\n   Routing Number: 225271890\n2. Paste your bank deposit slip or transaction reference number below.`,
                    });
                    showToast('Populated Bank Wire template');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  Bank Transfer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingPaymentMethod({
                      ...editingPaymentMethod,
                      recipientNumber: 'N/A (Cash)',
                      instructions: `1. Pay the exact order amount in physical cash to the courier delivery agent.\n2. Please inspect the parcel exterior before payment.\n3. Keep exact change ready to expedite parcel handover.`,
                    });
                    showToast('Populated Cash on Delivery template');
                  }}
                  className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-[11px] font-semibold border border-stone-200 transition-colors"
                >
                  Cash on Delivery
                </button>
              </div>

              <textarea
                rows={5}
                required
                value={editingPaymentMethod.instructions}
                onChange={e =>
                  setEditingPaymentMethod({ ...editingPaymentMethod, instructions: e.target.value })
                }
                placeholder="Enter step-by-step instructions shown to customers during checkout..."
                className="w-full px-3 py-2 border border-stone-300 rounded font-sans text-xs text-stone-800 focus:border-stone-900 leading-relaxed"
              />
            </div>

            {/* Live Customer Checkout Preview */}
            <div className="space-y-2 pt-2 border-t border-stone-200">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                Live Customer Checkout Preview
              </span>

              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                {/* Method selector preview */}
                <div className="p-3 bg-stone-950 text-white rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="font-bold text-xs">{editingPaymentMethod.name || 'Untitled Payment Method'}</span>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-stone-800 text-stone-300 px-2 py-0.5 rounded font-bold">
                    {editingPaymentMethod.type === 'cod' ? 'Cash' : editingPaymentMethod.accountType}
                  </span>
                </div>

                {/* Instructions preview */}
                <div className="bg-white p-3 rounded-lg border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                    <span className="font-bold text-stone-900 text-xs">
                      Step-by-Step {editingPaymentMethod.name} Instructions
                    </span>
                    <div className="flex items-center gap-1 font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                      <span>{editingPaymentMethod.recipientNumber || 'None'}</span>
                      <Copy className="w-3 h-3 text-stone-400" />
                    </div>
                  </div>

                  <div className="text-stone-700 text-[11px] whitespace-pre-line leading-relaxed font-sans">
                    {editingPaymentMethod.instructions || 'No instructions provided.'}
                  </div>

                  {editingPaymentMethod.type !== 'cod' && (
                    <div className="pt-2 border-t border-stone-100">
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Customer TrxID Input Field (Simulated):
                      </label>
                      <input
                        type="text"
                        disabled
                        placeholder="e.g. 9J8B29X14A"
                        className="w-full px-3 py-1.5 border border-stone-300 rounded bg-stone-100 text-stone-500 font-mono text-xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingPaymentMethod(null)}
                className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!editingPaymentMethod.name.trim()}
                onClick={() => {
                  adminSavePaymentMethod(editingPaymentMethod);
                  showToast(
                    isNewPaymentMethod
                      ? `Added new payment method "${editingPaymentMethod.name}"!`
                      : `Updated payment method "${editingPaymentMethod.name}"!`
                  );
                  setEditingPaymentMethod(null);
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Payment Method</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY ZONE EDIT / CREATE MODAL */}
      {editingDeliveryZone && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-5 shadow-xl border border-stone-200 text-xs my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">
                    {isNewDeliveryZone ? 'Add New Delivery Zone' : `Edit Zone: ${editingDeliveryZone.name}`}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Configure zone name, delivery fee, and estimated transit window.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDeliveryZone(null)}
                className="text-stone-400 hover:text-stone-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Zone Name *</label>
                <input
                  type="text"
                  value={editingDeliveryZone.name}
                  onChange={e =>
                    setEditingDeliveryZone({ ...editingDeliveryZone, name: e.target.value })
                  }
                  placeholder="e.g. Inside Dhaka Metro"
                  className="w-full px-3 py-2 border border-stone-300 rounded font-semibold text-stone-900 outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Delivery Fee ({siteSettings.currencySymbol}) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingDeliveryZone.fee}
                    onChange={e =>
                      setEditingDeliveryZone({
                        ...editingDeliveryZone,
                        fee: Math.max(0, parseFloat(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded font-bold text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    min={1}
                    value={editingDeliveryZone.displayOrder}
                    onChange={e =>
                      setEditingDeliveryZone({
                        ...editingDeliveryZone,
                        displayOrder: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded font-semibold text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Estimated Delivery Time Window *
                </label>
                <input
                  type="text"
                  value={editingDeliveryZone.estimatedDeliveryTime}
                  onChange={e =>
                    setEditingDeliveryZone({
                      ...editingDeliveryZone,
                      estimatedDeliveryTime: e.target.value,
                    })
                  }
                  placeholder="e.g. 24–48 Hours or 3–5 Business Days"
                  className="w-full px-3 py-2 border border-stone-300 rounded text-stone-900 outline-none focus:border-stone-900"
                />
              </div>

              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-stone-900 block">Zone Active at Checkout</span>
                  <span className="text-[11px] text-stone-500">
                    When enabled, customers in mapped areas can select this delivery zone.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={editingDeliveryZone.isActive}
                  onChange={e =>
                    setEditingDeliveryZone({ ...editingDeliveryZone, isActive: e.target.checked })
                  }
                  className="rounded text-stone-900 w-4 h-4"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingDeliveryZone(null)}
                className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingDeliveryZone.name.trim()}
                onClick={() => {
                  adminSaveDeliveryZone(editingDeliveryZone);
                  showToast(
                    isNewDeliveryZone
                      ? `Created delivery zone "${editingDeliveryZone.name}" (${siteSettings.currencySymbol}${editingDeliveryZone.fee})`
                      : `Updated delivery zone "${editingDeliveryZone.name}" (${siteSettings.currencySymbol}${editingDeliveryZone.fee})`
                  );
                  setEditingDeliveryZone(null);
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Delivery Zone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELIVERY AREA / DISTRICT MAPPING MODAL */}
      {editingDeliveryArea && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-5 shadow-xl border border-stone-200 text-xs my-8">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">
                    {isNewDeliveryArea ? 'Add Mapped Delivery Area' : `Edit Area: ${editingDeliveryArea.areaName}`}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Map a district and neighborhood/thana to a specific delivery zone.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDeliveryArea(null)}
                className="text-stone-400 hover:text-stone-900 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">District Name *</label>
                <input
                  type="text"
                  value={editingDeliveryArea.districtName}
                  onChange={e =>
                    setEditingDeliveryArea({ ...editingDeliveryArea, districtName: e.target.value })
                  }
                  placeholder="e.g. Dhaka, Chattogram, Sylhet, Gazipur"
                  className="w-full px-3 py-2 border border-stone-300 rounded font-semibold text-stone-900 outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Area / Thana / Neighborhood Name *
                </label>
                <input
                  type="text"
                  value={editingDeliveryArea.areaName}
                  onChange={e =>
                    setEditingDeliveryArea({ ...editingDeliveryArea, areaName: e.target.value })
                  }
                  placeholder="e.g. Banani, Uttara, Agrabad, Zindabazar"
                  className="w-full px-3 py-2 border border-stone-300 rounded font-semibold text-stone-900 outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Assigned Delivery Zone & Fee *
                </label>
                <select
                  value={editingDeliveryArea.zoneId}
                  onChange={e =>
                    setEditingDeliveryArea({ ...editingDeliveryArea, zoneId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-stone-300 rounded bg-white font-bold text-stone-900 outline-none focus:border-stone-900"
                >
                  {deliveryZones.map(z => (
                    <option key={z.id} value={z.id}>
                      {z.name} — {siteSettings.currencySymbol}{z.fee} ({z.estimatedDeliveryTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingDeliveryArea(null)}
                className="px-4 py-2 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingDeliveryArea.districtName.trim() || !editingDeliveryArea.areaName.trim()}
                onClick={() => {
                  adminSaveDeliveryArea({
                    ...editingDeliveryArea,
                    districtName: editingDeliveryArea.districtName.trim(),
                    areaName: editingDeliveryArea.areaName.trim(),
                  });
                  showToast(
                    isNewDeliveryArea
                      ? `Added delivery area "${editingDeliveryArea.areaName}" (${editingDeliveryArea.districtName})`
                      : `Updated delivery area "${editingDeliveryArea.areaName}"`
                  );
                  setEditingDeliveryArea(null);
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded font-bold shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Delivery Area</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit User Account */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-stone-200 text-xs max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">
                    {isNewUser ? 'Create New User Account' : `Edit User: ${editingUser.name}`}
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Configure profile details, role permissions, status, and loyalty balance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-stone-400 hover:text-stone-900 font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>

            {userFormError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{userFormError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                    placeholder="e.g. Tariqul Islam"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-medium text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={editingUser.phone}
                    onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                    placeholder="e.g. +8801712345678"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    placeholder="e.g. customer@example.com"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-mono text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isNewUser ? 'Initial Password (min 8 chars)' : 'Reset Password (optional)'}
                  </label>
                  <input
                    type="password"
                    value={editingUserPassword}
                    onChange={e => setEditingUserPassword(e.target.value)}
                    placeholder={isNewUser ? 'Min 8 characters' : 'Leave blank to keep existing'}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Account Role</label>
                  <select
                    value={editingUser.role}
                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-bold text-stone-900 outline-none focus:border-stone-900"
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Account Status</label>
                  <select
                    value={editingUser.status || 'active'}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white font-bold text-stone-900 outline-none focus:border-stone-900"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Loyalty Points</label>
                  <input
                    type="number"
                    min={0}
                    value={editingUser.loyaltyPoints}
                    onChange={e =>
                      setEditingUser({
                        ...editingUser,
                        loyaltyPoints: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg font-black text-amber-600 outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Internal Admin Notes (Visible only to staff)
                </label>
                <textarea
                  rows={2}
                  value={editingUser.notes || ''}
                  onChange={e => setEditingUser({ ...editingUser, notes: e.target.value })}
                  placeholder="e.g. VIP repeat buyer, prefers afternoon delivery, or reason for status change..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-800 outline-none focus:border-stone-900 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 border border-stone-300 rounded-lg font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = adminSaveUser(editingUser, isNewUser, editingUserPassword);
                  if (!res.success) {
                    setUserFormError(res.message);
                    return;
                  }
                  setEditingUser(null);
                  setEditingUserPassword('');
                  setUserFormError(null);
                  showToast(res.message);
                }}
                className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isNewUser ? 'Create User Account' : 'Save User Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Inspect 360° User Profile, Addresses & Order History */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          {(() => {
            const liveUser = users.find(u => u.id === inspectingUser.id) || inspectingUser;
            const userOrders = orders.filter(
              o => o.userId === liveUser.id || o.customerEmail.toLowerCase() === liveUser.email.toLowerCase()
            );
            const userLoyaltyLogs = loyaltyTransactions.filter(tx => tx.userId === liveUser.id);
            const totalSpent = userOrders
              .filter(o => o.orderStatus !== 'cancelled')
              .reduce((acc, o) => acc + o.grandTotal, 0);

            return (
              <div className="bg-white rounded-xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-stone-200 text-xs max-h-[92dvh] overflow-y-auto">
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-base shrink-0 ${
                        liveUser.role === 'admin'
                          ? 'bg-indigo-950 text-indigo-300'
                          : 'bg-stone-900 text-white'
                      }`}
                    >
                      {liveUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-extrabold text-base text-stone-900">{liveUser.name}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            liveUser.role === 'admin'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {liveUser.role}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            (liveUser.status || 'active') === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : (liveUser.status || 'active') === 'suspended'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-stone-200 text-stone-700'
                          }`}
                        >
                          {liveUser.status || 'active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5 font-mono">
                        {liveUser.email} · {liveUser.phone}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setInspectingUser(null)}
                    className="text-stone-400 hover:text-stone-900 font-bold text-sm p-1"
                  >
                    ✕
                  </button>
                </div>

                {/* User Summary Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Total Orders</span>
                    <span className="text-lg font-black text-stone-900">{userOrders.length}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Lifetime Spend</span>
                    <span className="text-lg font-black text-stone-900">
                      {siteSettings.currencySymbol}{totalSpent.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-stone-50 border border-stone-200">
                    <span className="text-[10px] font-bold text-stone-400 uppercase block">Loyalty Points</span>
                    <span className="text-lg font-black text-amber-600">{liveUser.loyaltyPoints} pts</span>
                  </div>
                </div>

                {liveUser.notes && (
                  <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-stone-800">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-0.5">
                      Internal Staff Notes
                    </span>
                    <p>{liveUser.notes}</p>
                  </div>
                )}

                {/* Saved Delivery Addresses */}
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Saved Delivery Addresses ({liveUser.addresses.length})
                  </h4>
                  {liveUser.addresses.length === 0 ? (
                    <p className="text-stone-400 italic">No saved addresses on file.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {liveUser.addresses.map(addr => (
                        <div key={addr.id} className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{addr.label}</span>
                            {addr.isDefault && (
                              <span className="text-[9px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-stone-700 font-medium">{addr.recipientName}</p>
                          <p className="text-stone-500 text-[11px]">{addr.addressLine}, {addr.district}</p>
                          <p className="text-stone-400 font-mono text-[10px]">{addr.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Order History */}
                <div className="space-y-2">
                  <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                    Order History ({userOrders.length})
                  </h4>
                  {userOrders.length === 0 ? (
                    <p className="text-stone-400 italic">This user has not placed any orders yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {userOrders.map(ord => (
                        <div
                          key={ord.id}
                          className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-2"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-900">#{ord.orderNumber}</span>
                              <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-800 text-[10px] font-bold uppercase">
                                {ord.orderStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {new Date(ord.createdAt).toLocaleDateString()} · {ord.paymentMethodSnapshot.name} ({ord.paymentStatus})
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-stone-900 text-sm">
                              {siteSettings.currencySymbol}{ord.grandTotal}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setInspectingUser(null);
                                setInspectOrderId(ord.id);
                                setOrderStatusUpdate(ord.orderStatus);
                                setCarrierNameInput(ord.carrierName || 'Steadfast Courier');
                                setTrackingNumberInput(ord.trackingNumber || '');
                              }}
                              className="block text-[10px] text-rose-600 font-bold hover:underline mt-0.5"
                            >
                              Open Order →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Loyalty Ledger */}
                {userLoyaltyLogs.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-900 uppercase tracking-wider text-[11px]">
                      Recent Loyalty Ledger ({userLoyaltyLogs.length})
                    </h4>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {userLoyaltyLogs.slice(0, 6).map(tx => (
                        <div
                          key={tx.id}
                          className="p-2 rounded bg-stone-50 border border-stone-200 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-medium text-stone-800">{tx.reason}</span>
                            <span className="text-[10px] text-stone-400 block">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              tx.pointsDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {tx.pointsDelta >= 0 ? `+${tx.pointsDelta}` : tx.pointsDelta} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => {
                      setInspectingUser(null);
                      setUserFormError(null);
                      setIsNewUser(false);
                      setEditingUser({ ...liveUser, status: liveUser.status || 'active' });
                    }}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit User Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInspectingUser(null)}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
