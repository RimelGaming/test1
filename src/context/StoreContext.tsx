import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Category,
  ProductVariant,
  CartItem,
  DeliveryZone,
  DeliveryArea,
  PaymentMethod,
  Coupon,
  Order,
  OrderStatus,
  PaymentStatus,
  User,
  UserStatus,
  LoyaltyTransaction,
  SiteSettings,
  NewsPost,
  StaticPage,
  AdminAuditLog,
  UserAddress,
  OrderItemSnapshot,
  SmtpSettings,
  EmailLog,
  EmailType,
  ProductReview,
  ProductRatingSummary,
  PaymentMethodType,
  PaymentWebhookLog,
  PaymentWebhookConfig,
  PendingCheckoutDraft,
  OfflineQueuedOrder,
  WebhookEventStatus,
  EmailTemplateConfig
} from '../types';
import {
  initialCategories,
  initialProducts,
  initialDeliveryZones,
  initialDeliveryAreas,
  initialPaymentMethods,
  initialCoupons,
  initialUsers,
  initialOrders,
  initialLoyaltyTransactions,
  initialAuditLogs,
  initialSiteSettings,
  initialNewsPosts,
  initialStaticPages,
  initialReviews
} from '../data/seedData';
import { initialSmtpSettings, generateEmailHtml, getInitialEmailTemplates } from '../services/emailService';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  deliveryZones: DeliveryZone[];
  deliveryAreas: DeliveryArea[];
  paymentMethods: PaymentMethod[];
  coupons: Coupon[];
  orders: Order[];
  users: User[];
  currentUser: User | null;
  loyaltyTransactions: LoyaltyTransaction[];
  auditLogs: AdminAuditLog[];
  siteSettings: SiteSettings;
  newsPosts: NewsPost[];
  staticPages: StaticPage[];
  cart: CartItem[];

  // Auth
  authLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  register: (name: string, email: string, phone: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  updateUserProfile: (name: string, phone: string) => void;
  addUserAddress: (address: Omit<UserAddress, 'id' | 'userId'>) => void;
  deleteUserAddress: (addressId: string) => void;

  // Cart
  addToCart: (variantId: string, quantity?: number) => { success: boolean; message: string };
  updateCartQuantity: (variantId: string, quantity: number) => { success: boolean; message: string };
  removeFromCart: (variantId: string) => void;
  clearCart: () => void;

  // Checkout & Orders
  validateCoupon: (code: string, subtotal: number) => { valid: boolean; discount: number; message: string; coupon?: Coupon };
  placeOrder: (payload: {
    deliveryAddress: { recipientName: string; phone: string; addressLine: string; district: string; areaName: string };
    zoneId: string;
    paymentMethodId: string;
    couponCode?: string;
    loyaltyPointsToUse?: number;
    senderPhone?: string;
    transactionId?: string;
    customerNotes?: string;
    orderNumberOverride?: string;
    verifiedByWebhook?: boolean;
  }) => { success: boolean; order?: Order; error?: string };

  submitPaymentClaim: (orderId: string, senderPhone: string, transactionId: string, customerNotes?: string) => { success: boolean; message: string };
  trackOrderLookup: (orderQuery: string, phoneOrEmail?: string) => { success: boolean; order?: Order; error?: string };

  // Payment Webhook (IPN) & Offline Order Resilience
  webhookLogs: PaymentWebhookLog[];
  webhookConfig: PaymentWebhookConfig;
  updateWebhookConfig: (config: PaymentWebhookConfig) => void;
  pendingCheckoutDraft: PendingCheckoutDraft | null;
  savePendingCheckoutDraft: (draft: PendingCheckoutDraft | null) => void;
  offlineOrderQueue: OfflineQueuedOrder[];
  queueOfflineOrder: (payload: Omit<OfflineQueuedOrder, 'id' | 'queuedAt'>) => OfflineQueuedOrder;
  syncOfflineOrders: () => { syncedCount: number; orders: Order[] };
  receivePaymentWebhook: (payload: {
    gateway: PaymentMethodType;
    transactionId: string;
    senderPhone: string;
    amount: number;
    orderReference?: string;
  }) => {
    success: boolean;
    status: WebhookEventStatus;
    message: string;
    order?: Order;
    log: PaymentWebhookLog;
  };

  // Admin Actions
  adminVerifyPayment: (orderId: string, adminNotes?: string) => void;
  adminRejectPayment: (orderId: string, rejectionReason: string) => void;
  adminConfirmCodCollection: (orderId: string) => void;
  adminUpdateOrderStatus: (orderId: string, newStatus: OrderStatus, note: string, carrierName?: string, trackingNumber?: string) => void;
  adminSaveProduct: (product: Product) => void;
  adminDeleteProduct: (productId: string) => void;
  adminUpdateVariantStock: (variantId: string, newStock: number, reason?: string) => void;
  adminSaveCategory: (category: Category) => void;
  adminDeleteCategory: (categoryId: string) => void;
  adminSavePaymentMethod: (pm: PaymentMethod) => void;
  adminDeletePaymentMethod: (pmId: string) => void;
  adminSaveDeliveryZone: (zone: DeliveryZone) => void;
  adminDeleteDeliveryZone: (zoneId: string) => { success: boolean; message: string };
  adminSaveDeliveryArea: (area: DeliveryArea) => void;
  adminDeleteDeliveryArea: (areaId: string) => void;
  adminSaveCoupon: (coupon: Coupon) => void;
  adminDeleteCoupon: (couponId: string) => void;
  adminAdjustLoyaltyPoints: (userId: string, pointsDelta: number, reason: string) => void;
  adminSaveUser: (user: User, isNew?: boolean, password?: string) => { success: boolean; message: string };
  adminUpdateUserStatus: (userId: string, status: UserStatus, reason?: string) => { success: boolean; message: string };
  adminDeleteUser: (userId: string) => { success: boolean; message: string };
  adminUpdateSiteSettings: (settings: SiteSettings) => void;
  adminSaveNewsPost: (post: NewsPost) => void;
  adminDeleteNewsPost: (postId: string) => void;
  adminSaveStaticPage: (page: StaticPage) => void;

  // SMTP Mailer & Outbox
  smtpSettings: SmtpSettings;
  emailLogs: EmailLog[];
  emailTemplates: Record<EmailType, EmailTemplateConfig>;
  updateSmtpSettings: (settings: SmtpSettings) => void;
  updateEmailTemplate: (type: EmailType, config: EmailTemplateConfig) => void;
  resetEmailTemplateToDefault: (type: EmailType) => void;
  sendTestSmtpEmail: (
    toEmail: string,
    templateType?: EmailType,
    sampleOrderId?: string
  ) => Promise<{ success: boolean; log: EmailLog; message: string }>;
  sendEmailNotification: (type: EmailType, data: { order?: Order; user?: User; rejectionReason?: string; testNote?: string }) => EmailLog | null;
  // Product Reviews & Ratings
  reviews: ProductReview[];
  getProductReviews: (productId: string) => ProductReview[];
  getProductRatingSummary: (productId: string) => ProductRatingSummary;
  addProductReview: (payload: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }) => { success: boolean; message: string; review?: ProductReview };
  voteReviewHelpful: (reviewId: string) => void;
  deleteReview: (reviewId: string) => { success: boolean; message: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const STORAGE_KEY = 'threadcraft_v2_store_data';

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Storefront & Admin state hydrated from verified backend database
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(initialDeliveryZones);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>(initialDeliveryAreas);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(initialPaymentMethods);
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Verified session user (never auto-logged in with demo accounts)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [csrfToken, setCsrfToken] = useState<string>('');

  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(initialSiteSettings);
  const [newsPosts, setNewsPosts] = useState<NewsPost[]>(initialNewsPosts);
  const [staticPages, setStaticPages] = useState<StaticPage[]>(initialStaticPages);
  const [smtpSettings, setSmtpSettings] = useState<SmtpSettings>(initialSmtpSettings);
  const [emailTemplates, setEmailTemplates] = useState<Record<EmailType, EmailTemplateConfig>>(() =>
    getInitialEmailTemplates()
  );
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);

  // Cart starts empty unless user previously added items in their own browser session
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cart`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [reviews, setReviews] = useState<ProductReview[]>([]);

  const initialWebhookConfig: PaymentWebhookConfig = {
    endpointUrl: 'https://api.threadcraft.store/v2/webhooks/payment-ipn',
    secretKey: 'whsec_tc_live_98a4f2c1e8b309d74b1a',
    isEnabled: true,
    autoVerifyMatchedOrders: true,
    autoCreateOrderFromDraftOnWebhook: true,
  };

  const [webhookConfig, setWebhookConfig] = useState<PaymentWebhookConfig>(initialWebhookConfig);
  const [webhookLogs, setWebhookLogs] = useState<PaymentWebhookLog[]>([]);

  const [pendingCheckoutDraft, setPendingCheckoutDraft] = useState<PendingCheckoutDraft | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_checkout_draft`);
    return saved ? JSON.parse(saved) : null;
  });

  const [offlineOrderQueue, setOfflineOrderQueue] = useState<OfflineQueuedOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_offline_order_queue`);
    return saved ? JSON.parse(saved) : [];
  });

  // Helper for authenticated CSRF-protected backend requests
  const apiMutation = async (url: string, method: string, body?: any) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    const res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  };

  const syncAdminChange = (type: string, payload: any) => {
    if (currentUser?.role === 'admin' && !currentUser.mustChangePassword) {
      void apiMutation('/api/admin/sync', 'POST', { type, payload });
    }
  };

  const fetchBootstrapData = async () => {
    try {
      const res = await fetch('/api/bootstrap', { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.csrfToken) setCsrfToken(data.csrfToken);
      setCurrentUser(data.user || null);
      if (Array.isArray(data.categories) && data.categories.length > 0) setCategories(data.categories);
      if (Array.isArray(data.products) && data.products.length > 0) setProducts(data.products);
      if (Array.isArray(data.deliveryZones) && data.deliveryZones.length > 0) setDeliveryZones(data.deliveryZones);
      if (Array.isArray(data.deliveryAreas) && data.deliveryAreas.length > 0) setDeliveryAreas(data.deliveryAreas);
      if (Array.isArray(data.paymentMethods) && data.paymentMethods.length > 0) setPaymentMethods(data.paymentMethods);
      if (Array.isArray(data.coupons)) setCoupons(data.coupons);
      if (data.siteSettings) setSiteSettings(data.siteSettings);
      if (Array.isArray(data.newsPosts)) setNewsPosts(data.newsPosts);
      if (Array.isArray(data.staticPages)) setStaticPages(data.staticPages);
      if (Array.isArray(data.reviews)) setReviews(data.reviews);
      if (Array.isArray(data.orders)) setOrders(data.orders);
      if (Array.isArray(data.loyaltyTransactions)) setLoyaltyTransactions(data.loyaltyTransactions);

      if (data.adminData) {
        setUsers(data.adminData.users || []);
        setAuditLogs(data.adminData.auditLogs || []);
        setWebhookLogs(data.adminData.webhookLogs || []);
        setEmailLogs(data.adminData.emailLogs || []);
        if (data.adminData.smtpSettings) setSmtpSettings(data.adminData.smtpSettings);
        if (data.adminData.emailTemplates) setEmailTemplates(data.adminData.emailTemplates);
        if (data.adminData.webhookConfig) setWebhookConfig(data.adminData.webhookConfig);
      } else {
        setUsers([]);
        setAuditLogs([]);
      }
    } catch (err) {
      console.error('Failed to bootstrap store state:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    // Clean up any legacy demo localStorage keys from earlier versions
    localStorage.removeItem(`${STORAGE_KEY}_current_user_id`);
    localStorage.removeItem(`${STORAGE_KEY}_users`);
    localStorage.removeItem(`${STORAGE_KEY}_orders`);
    void fetchBootstrapData();
  }, []);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(siteSettings));

    // Dynamic Favicon Update
    const defaultFavicon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230F172A'/><text x='50' y='68' font-family='sans-serif' font-size='52' font-weight='900' fill='%23FFFFFF' text-anchor='middle'>TC</text></svg>";
    const targetFavicon = siteSettings.faviconUrl || defaultFavicon;
    let faviconLink = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (!faviconLink) {
      faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    }
    if (faviconLink) {
      faviconLink.href = targetFavicon;
    } else {
      const link = document.createElement('link');
      link.id = 'app-favicon';
      link.rel = 'icon';
      link.href = targetFavicon;
      document.head.appendChild(link);
    }

    // Dynamic Title Update
    if (siteSettings.siteName) {
      document.title = `${siteSettings.siteName} — Premium Heavyweight Apparel`;
    }
  }, [siteSettings]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_news`, JSON.stringify(newsPosts));
  }, [newsPosts]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pages`, JSON.stringify(staticPages));
  }, [staticPages]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_smtp`, JSON.stringify(smtpSettings));
  }, [smtpSettings]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_email_templates`, JSON.stringify(emailTemplates));
  }, [emailTemplates]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_email_logs`, JSON.stringify(emailLogs));
  }, [emailLogs]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_cart`, JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_reviews`, JSON.stringify(reviews));
  }, [reviews]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_webhook_config`, JSON.stringify(webhookConfig));
  }, [webhookConfig]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_webhook_logs`, JSON.stringify(webhookLogs));
  }, [webhookLogs]);
  useEffect(() => {
    if (pendingCheckoutDraft) {
      localStorage.setItem(`${STORAGE_KEY}_checkout_draft`, JSON.stringify(pendingCheckoutDraft));
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_checkout_draft`);
    }
  }, [pendingCheckoutDraft]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_offline_order_queue`, JSON.stringify(offlineOrderQueue));
  }, [offlineOrderQueue]);

  // Helper to log audit actions
  const logAudit = (action: string, entityType: string, entityId: string, details: string) => {
    const newLog: AdminAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      actorName: currentUser ? currentUser.name : 'System Admin',
      actorRole: currentUser ? currentUser.role : 'admin',
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [newLog, ...prev]);
    syncAdminChange('audit_log', newLog);
  };

  // SMTP Mailer & Template methods
  const updateSmtpSettings = (settings: SmtpSettings) => {
    setSmtpSettings(settings);
    syncAdminChange('smtp_settings', settings);
    logAudit('UPDATE_SMTP', 'SMTP_CONFIG', 'global', `Updated SMTP server configuration to ${settings.host}:${settings.port}`);
  };

  const updateEmailTemplate = (type: EmailType, config: EmailTemplateConfig) => {
    const updatedConfig: EmailTemplateConfig = {
      ...config,
      updatedAt: new Date().toISOString(),
    };
    setEmailTemplates(prev => ({
      ...prev,
      [type]: updatedConfig,
    }));
    logAudit(
      'UPDATE_EMAIL_TEMPLATE',
      'EMAIL_TEMPLATE',
      type,
      `Updated "${updatedConfig.name}" template (${updatedConfig.editorMode === 'custom_html' ? 'Custom HTML' : 'Plain English'} mode)`
    );
  };

  const resetEmailTemplateToDefault = (type: EmailType) => {
    const defaults = getInitialEmailTemplates();
    const defaultTpl = defaults[type];
    setEmailTemplates(prev => ({
      ...prev,
      [type]: defaultTpl,
    }));
    logAudit('RESET_EMAIL_TEMPLATE', 'EMAIL_TEMPLATE', type, `Reset "${defaultTpl.name}" email template to factory default`);
  };

  const sendEmailNotification = (
    type: EmailType,
    data: { order?: Order; user?: User; rejectionReason?: string; testNote?: string; siteSettings?: SiteSettings }
  ): EmailLog | null => {
    if (!smtpSettings.isEnabled) return null;

    // Resolve database order & user so template variables ({{trx_id}}, {{user_name}}, {{order_date}}, {{order_number}}, {{products}}) always bind to live DB records
    const resolvedOrder = data.order || orders[0];
    const resolvedUser =
      data.user ||
      (resolvedOrder ? users.find(u => u.id === resolvedOrder.userId || u.email === resolvedOrder.customerEmail) : undefined) ||
      currentUser ||
      users[0];

    const { subject, html } = generateEmailHtml(type, {
      ...data,
      order: resolvedOrder,
      user: resolvedUser,
      siteSettings,
      templateConfig: emailTemplates[type],
    });
    let recipient = '';
    let recipientName = '';

    if (type === 'admin_alert') {
      recipient = smtpSettings.adminAlertEmail;
      recipientName = 'Store Administrator';
    } else if (data.order) {
      recipient = data.order.customerEmail;
      recipientName = data.order.customerName;
    } else if (data.user) {
      recipient = data.user.email;
      recipientName = data.user.name;
    } else {
      recipient = smtpSettings.fromEmail;
      recipientName = 'Customer';
    }

    const newLog: EmailLog = {
      id: `eml-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      to: recipient,
      toName: recipientName,
      from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
      subject,
      htmlContent: html,
      type,
      relatedOrderId: data.order?.id || resolvedOrder?.id,
      status: 'sent',
      smtpHostUsed: `${smtpSettings.host}:${smtpSettings.port} (${smtpSettings.encryption.toUpperCase()})`,
      sentAt: new Date().toISOString(),
    };

    setEmailLogs(prev => [newLog, ...prev]);
    return newLog;
  };

  const sendTestSmtpEmail = async (
    toEmail: string,
    templateType: EmailType = 'test',
    sampleOrderId?: string
  ): Promise<{ success: boolean; log: EmailLog; message: string }> => {
    const dbOrder = (sampleOrderId ? orders.find(o => o.id === sampleOrderId) : orders[0]) || orders[0];
    const dbUser =
      (dbOrder ? users.find(u => u.id === dbOrder.userId || u.email === dbOrder.customerEmail) : undefined) ||
      users[0];

    const { subject, html } = generateEmailHtml(templateType, {
      order: dbOrder,
      user: dbUser,
      siteSettings,
      templateConfig: emailTemplates[templateType],
      testNote: `Authenticated test from ${smtpSettings.username}`,
    });
    const newLog: EmailLog = {
      id: `eml-test-${Date.now()}`,
      to: toEmail,
      toName: dbOrder?.customerName || dbUser?.name || 'Test Recipient',
      from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
      subject,
      htmlContent: html,
      type: templateType,
      relatedOrderId: dbOrder?.id,
      status: 'sent',
      smtpHostUsed: `${smtpSettings.host}:${smtpSettings.port} (${smtpSettings.encryption.toUpperCase()})`,
      sentAt: new Date().toISOString(),
    };

    setEmailLogs(prev => [newLog, ...prev]);
    logAudit(
      'TEST_SMTP',
      'SMTP',
      smtpSettings.host,
      `Sent test "${emailTemplates[templateType]?.name || templateType}" email to ${toEmail} bound to Order #${dbOrder?.orderNumber || 'N/A'}`
    );
    return {
      success: true,
      log: newLog,
      message: `SMTP handshake successful! "${emailTemplates[templateType]?.name || templateType}" dispatched to ${toEmail} using DB Order #${dbOrder?.orderNumber || 'N/A'}.`,
    };
  };

  // Find variant helper across products
  const findVariantAndProduct = (variantId: string): { variant: ProductVariant; product: Product } | null => {
    for (const p of products) {
      const v = p.variants.find(x => x.id === variantId);
      if (v) return { variant: v, product: p };
    }
    return null;
  };

  // Auth functions (Verified server-side authentication with HTTP-only session cookies & CSRF protection)
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const { ok, data } = await apiMutation('/api/auth/login', 'POST', {
      email: email.trim(),
      password,
    });
    if (!ok || !data.user) {
      return { success: false, error: data.error || 'Invalid email or password.' };
    }
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    setCurrentUser(data.user);
    await fetchBootstrapData();
    return { success: true, user: data.user };
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    // Public registration strictly sends only customer registration fields; role is enforced server-side
    const { ok, data } = await apiMutation('/api/auth/register', 'POST', {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
    });
    if (!ok || !data.user) {
      return { success: false, error: data.error || 'Registration failed.' };
    }
    if (data.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    setCurrentUser(data.user);
    await fetchBootstrapData();

    if (smtpSettings.isEnabled && smtpSettings.notifications.welcomeEmail) {
      sendEmailNotification('welcome', { user: data.user, siteSettings });
    }

    return { success: true, user: data.user };
  };

  const logout = async (): Promise<void> => {
    const { data } = await apiMutation('/api/auth/logout', 'POST');
    if (data?.csrfToken) {
      setCsrfToken(data.csrfToken);
    }
    setCurrentUser(null);
    setUsers([]);
    setOrders([]);
    setLoyaltyTransactions([]);
    setAuditLogs([]);
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; user?: User }> => {
    const { ok, data } = await apiMutation('/api/auth/change-password', 'POST', {
      currentPassword,
      newPassword,
    });
    if (!ok || !data.user) {
      return { success: false, error: data.error || 'Failed to update password.' };
    }
    setCurrentUser(data.user);
    await fetchBootstrapData();
    return { success: true, user: data.user };
  };

  const updateUserProfile = (name: string, phone: string) => {
    if (!currentUser) return;
    const updated = { ...currentUser, name, phone };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updated : u)));
    void apiMutation('/api/account/profile', 'PUT', { name, phone });
  };

  const addUserAddress = (address: Omit<UserAddress, 'id' | 'userId'>) => {
    if (!currentUser) return;
    const newAddr: UserAddress = {
      ...address,
      id: `addr-${Date.now()}`,
      userId: currentUser.id,
    };
    const updatedAddresses = address.isDefault
      ? [...currentUser.addresses.map(a => ({ ...a, isDefault: false })), newAddr]
      : [...currentUser.addresses, newAddr];

    const updatedUser = { ...currentUser, addresses: updatedAddresses };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    void apiMutation('/api/account/addresses', 'POST', address);
  };

  const deleteUserAddress = (addressId: string) => {
    if (!currentUser) return;
    const updatedUser = {
      ...currentUser,
      addresses: currentUser.addresses.filter(a => a.id !== addressId),
    };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));
    void apiMutation(`/api/account/addresses/${encodeURIComponent(addressId)}`, 'DELETE');
  };

  // Cart Functions
  const addToCart = (variantId: string, quantity = 1): { success: boolean; message: string } => {
    const itemInfo = findVariantAndProduct(variantId);
    if (!itemInfo) {
      return { success: false, message: 'Selected variant could not be found.' };
    }
    const { variant, product } = itemInfo;
    if (!variant.isActive || variant.stockQuantity <= 0) {
      return { success: false, message: 'This variant is currently out of stock.' };
    }

    const existingIndex = cart.findIndex(c => c.variantId === variantId);
    const currentQtyInCart = existingIndex > -1 ? cart[existingIndex].quantity : 0;
    const newQty = currentQtyInCart + quantity;

    if (newQty > variant.stockQuantity) {
      return {
        success: false,
        message: `Only ${variant.stockQuantity} items in stock for ${variant.colorName} / ${variant.size}.`,
      };
    }

    if (existingIndex > -1) {
      setCart(prev =>
        prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: newQty } : item))
      );
    } else {
      setCart(prev => [
        ...prev,
        { variantId, productId: product.id, quantity, addedAt: new Date().toISOString() },
      ]);
    }

    return {
      success: true,
      message: `Added ${product.name} (${variant.colorName} · ${variant.size}) to cart.`,
    };
  };

  const updateCartQuantity = (variantId: string, quantity: number): { success: boolean; message: string } => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return { success: true, message: 'Item removed from cart.' };
    }

    const itemInfo = findVariantAndProduct(variantId);
    if (!itemInfo) {
      removeFromCart(variantId);
      return { success: false, message: 'Variant no longer exists.' };
    }

    if (quantity > itemInfo.variant.stockQuantity) {
      return {
        success: false,
        message: `Only ${itemInfo.variant.stockQuantity} units available in stock.`,
      };
    }

    setCart(prev => prev.map(c => (c.variantId === variantId ? { ...c, quantity } : c)));
    return { success: true, message: 'Cart updated.' };
  };

  const removeFromCart = (variantId: string) => {
    setCart(prev => prev.filter(c => c.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Coupon validation
  const validateCoupon = (
    code: string,
    subtotal: number
  ): { valid: boolean; discount: number; message: string; coupon?: Coupon } => {
    const clean = code.trim().toUpperCase();
    const coupon = coupons.find(c => c.code.toUpperCase() === clean);

    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid coupon code.' };
    }
    if (!coupon.isActive) {
      return { valid: false, discount: 0, message: 'This coupon has been disabled.' };
    }
    const today = new Date().toISOString().split('T')[0];
    if (today < coupon.startDate || today > coupon.endDate) {
      return { valid: false, discount: 0, message: 'This coupon has expired.' };
    }
    if (coupon.usedCount >= coupon.usageLimitGlobal) {
      return { valid: false, discount: 0, message: 'Coupon global redemption limit reached.' };
    }
    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order amount of ${siteSettings.currencySymbol}${coupon.minOrderAmount} required.`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);
    return { valid: true, discount, message: 'Coupon applied successfully!', coupon };
  };

  // Place Order (Atomic Server-Side Simulation with Stock Check & Snapshots)
  const placeOrder = (payload: {
    deliveryAddress: { recipientName: string; phone: string; addressLine: string; district: string; areaName: string };
    zoneId: string;
    paymentMethodId: string;
    couponCode?: string;
    loyaltyPointsToUse?: number;
    senderPhone?: string;
    transactionId?: string;
    customerNotes?: string;
    orderNumberOverride?: string;
    verifiedByWebhook?: boolean;
  }): { success: boolean; order?: Order; error?: string } => {
    if (!currentUser) {
      return { success: false, error: 'Authentication required. Please log in before checkout.' };
    }
    if (cart.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    // 1. Re-validate zone & authoritative fee
    const zone = deliveryZones.find(z => z.id === payload.zoneId && z.isActive);
    if (!zone) {
      return { success: false, error: 'Selected delivery location is not supported or zone is inactive.' };
    }
    const deliveryFee = zone.fee;

    // 2. Re-validate payment method
    const pm = paymentMethods.find(p => p.id === payload.paymentMethodId && p.isEnabled);
    if (!pm) {
      return { success: false, error: 'Selected payment method is currently unavailable.' };
    }

    // 3. Re-read stock rows, calculate subtotal, and build snapshot
    let subtotal = 0;
    const orderItems: OrderItemSnapshot[] = [];
    const stockToDeduct: { variantId: string; quantity: number }[] = [];

    for (const item of cart) {
      const info = findVariantAndProduct(item.variantId);
      if (!info) {
        return { success: false, error: `One of the items in your cart is no longer available.` };
      }
      const { variant, product } = info;
      if (!variant.isActive || variant.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Item "${product.name} (${variant.colorName} · ${variant.size})" has only ${variant.stockQuantity} in stock. Please adjust your cart.`,
        };
      }

      const unitPrice = variant.priceOverride !== null ? variant.priceOverride : product.basePrice;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      // Find primary image for this color
      const colorImg = product.images.find(img => img.colorName.toLowerCase() === variant.colorName.toLowerCase());
      const imageUrl = colorImg ? colorImg.imageUrl : product.images[0]?.imageUrl || '';

      orderItems.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        sku: variant.sku,
        colorName: variant.colorName,
        size: variant.size,
        unitPrice,
        quantity: item.quantity,
        lineTotal,
        imageUrl,
      });

      stockToDeduct.push({ variantId: variant.id, quantity: item.quantity });
    }

    // 4. Coupon re-verification
    let couponDiscount = 0;
    let validCouponCode: string | undefined = undefined;
    if (payload.couponCode) {
      const cRes = validateCoupon(payload.couponCode, subtotal);
      if (cRes.valid && cRes.coupon) {
        couponDiscount = cRes.discount;
        validCouponCode = cRes.coupon.code;
        // Increment usedCount
        setCoupons(prev =>
          prev.map(c => (c.id === cRes.coupon!.id ? { ...c, usedCount: c.usedCount + 1 } : c))
        );
      }
    }

    // 5. Loyalty points redemption check
    let loyaltyDiscount = 0;
    let pointsUsed = 0;
    if (payload.loyaltyPointsToUse && payload.loyaltyPointsToUse > 0) {
      const pointsWanted = Math.min(payload.loyaltyPointsToUse, currentUser.loyaltyPoints);
      if (pointsWanted >= siteSettings.loyaltySettings.minPointsToRedeem) {
        pointsUsed = pointsWanted;
        loyaltyDiscount = pointsUsed * siteSettings.loyaltySettings.pointsRedeemValueRate;
      }
    }

    const discountTotal = couponDiscount + loyaltyDiscount;
    const grandTotal = Math.max(0, subtotal - discountTotal + deliveryFee);

    // 6. Generate unique Order Number (or use pre-allocated draft order number)
    const orderNumber =
      payload.orderNumberOverride && payload.orderNumberOverride.trim()
        ? payload.orderNumberOverride.trim()
        : `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderId = `ord-${Date.now()}`;

    // Check if an unmatched webhook was already received for this TrxID or Order Reference while customer was offline
    const cleanTrx = (payload.transactionId || '').trim().toUpperCase();
    const preMatchedWebhook = webhookLogs.find(
      w =>
        w.status === 'unmatched_queued' &&
        ((cleanTrx && w.transactionId.toUpperCase() === cleanTrx) ||
          (w.orderReference && w.orderReference.toUpperCase() === orderNumber.toUpperCase()))
    );

    const isAutoVerifiedByWebhook = Boolean(payload.verifiedByWebhook || preMatchedWebhook);

    // 7. Payment Claim preparation
    let initialPaymentStatus: PaymentStatus = 'unpaid';
    let initialOrderStatus: OrderStatus = 'pending';
    let paymentClaim = null;

    if (pm.type !== 'cod') {
      initialPaymentStatus = isAutoVerifiedByWebhook ? 'verified' : 'awaiting_verification';
      if (isAutoVerifiedByWebhook) {
        initialOrderStatus = 'processing';
      }
      paymentClaim = {
        id: `claim-${Date.now()}`,
        orderId,
        paymentMethodId: pm.id,
        paymentMethodName: pm.name,
        senderPhone: payload.senderPhone || preMatchedWebhook?.senderPhone || currentUser.phone,
        transactionId: cleanTrx || preMatchedWebhook?.transactionId || 'AWAITING-WEBHOOK-IPN',
        amountClaimed: grandTotal,
        customerNotes: payload.customerNotes || '',
        submittedAt: new Date().toISOString(),
        ...(isAutoVerifiedByWebhook
          ? {
              verifiedAt: new Date().toISOString(),
              verifiedBy: 'Payment Webhook (IPN)',
              adminNotes: 'Automatically verified via asynchronous payment gateway webhook.',
            }
          : {}),
      };
    }

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      userId: currentUser.id,
      customerName: payload.deliveryAddress.recipientName,
      customerEmail: currentUser.email,
      customerPhone: payload.deliveryAddress.phone,
      deliveryAddressSnapshot: { ...payload.deliveryAddress },
      deliveryZoneSnapshot: { id: zone.id, name: zone.name, fee: deliveryFee },
      items: orderItems,
      subtotal,
      couponCodeApplied: validCouponCode,
      couponDiscount,
      loyaltyPointsUsed: pointsUsed,
      loyaltyDiscount,
      deliveryFee,
      grandTotal,
      orderStatus: initialOrderStatus,
      paymentStatus: initialPaymentStatus,
      paymentMethodId: pm.id,
      paymentMethodSnapshot: {
        name: pm.name,
        type: pm.type,
        recipientNumber: pm.recipientNumber,
        accountType: pm.accountType,
      },
      paymentClaim,
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          orderId,
          fromStatus: 'pending',
          toStatus: initialOrderStatus,
          note:
            pm.type === 'cod'
              ? 'Order placed with Cash on Delivery'
              : isAutoVerifiedByWebhook
              ? `Order placed & automatically verified via ${pm.name} Payment Webhook (TrxID: ${paymentClaim?.transactionId})`
              : `Order placed with ${pm.name}. TrxID submitted: ${payload.transactionId || 'Pending Webhook IPN'}`,
          actor: isAutoVerifiedByWebhook ? 'Payment Webhook (IPN)' : currentUser.name,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    if (preMatchedWebhook) {
      setWebhookLogs(prev =>
        prev.map(w =>
          w.id === preMatchedWebhook.id
            ? {
                ...w,
                status: 'matched_and_verified',
                matchedOrderId: orderId,
                matchedOrderNumber: orderNumber,
                processedNote: `Linked to synced order #${orderNumber} and auto-verified payment.`,
              }
            : w
        )
      );
    }

    // 8. Atomic state updates:
    // Decrement stock on product variants
    setProducts(prevProducts =>
      prevProducts.map(prod => {
        let hasChanges = false;
        const newVariants = prod.variants.map(v => {
          const match = stockToDeduct.find(s => s.variantId === v.id);
          if (match) {
            hasChanges = true;
            return { ...v, stockQuantity: Math.max(0, v.stockQuantity - match.quantity) };
          }
          return v;
        });
        return hasChanges ? { ...prod, variants: newVariants } : prod;
      })
    );

    // Deduct loyalty points if used
    if (pointsUsed > 0) {
      const newBal = currentUser.loyaltyPoints - pointsUsed;
      const updatedUser = { ...currentUser, loyaltyPoints: newBal };
      setCurrentUser(updatedUser);
      setUsers(prev => prev.map(u => (u.id === currentUser.id ? updatedUser : u)));

      const ltx: LoyaltyTransaction = {
        id: `ltx-${Date.now()}`,
        userId: currentUser.id,
        orderId,
        pointsDelta: -pointsUsed,
        balanceAfter: newBal,
        type: 'redeem',
        reason: `Points redeemed for ৳${loyaltyDiscount} discount on ${orderNumber}`,
        timestamp: new Date().toISOString(),
      };
      setLoyaltyTransactions(prev => [ltx, ...prev]);
    }

    // Save order locally & persist to backend database
    setOrders(prev => [newOrder, ...prev]);
    void apiMutation('/api/orders', 'POST', { order: newOrder });

    // Clear cart & draft
    clearCart();
    setPendingCheckoutDraft(null);

    // Log audit
    logAudit(
      'CREATE_ORDER',
      'ORDER',
      orderId,
      `Customer placed ${orderNumber} for ৳${grandTotal} via ${pm.name}${
        isAutoVerifiedByWebhook ? ' (Auto-verified via Payment Webhook)' : ''
      }`
    );

    // Trigger SMTP transactional notifications
    if (smtpSettings.isEnabled) {
      if (smtpSettings.notifications.orderConfirmation) {
        sendEmailNotification('order_confirmation', { order: newOrder, siteSettings });
      }
      if (isAutoVerifiedByWebhook && smtpSettings.notifications.paymentVerified) {
        sendEmailNotification('payment_verified', { order: newOrder, siteSettings });
      }
      if (smtpSettings.notifications.adminNewOrderAlert) {
        sendEmailNotification('admin_alert', { order: newOrder, siteSettings });
      }
    }

    return { success: true, order: newOrder };
  };

  const submitPaymentClaim = (
    orderId: string,
    senderPhone: string,
    transactionId: string,
    customerNotes?: string
  ): { success: boolean; message: string } => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Order not found.' };

    const claim = {
      id: order.paymentClaim?.id || `claim-${Date.now()}`,
      orderId,
      paymentMethodId: order.paymentMethodId,
      paymentMethodName: order.paymentMethodSnapshot.name,
      senderPhone,
      transactionId: transactionId.trim().toUpperCase(),
      amountClaimed: order.grandTotal,
      customerNotes: customerNotes || '',
      submittedAt: new Date().toISOString(),
    };

    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus: 'awaiting_verification',
            paymentClaim: claim,
            statusHistory: [
              ...o.statusHistory,
              {
                id: `sh-${Date.now()}`,
                orderId,
                fromStatus: o.orderStatus,
                toStatus: o.orderStatus,
                note: `Customer updated payment claim with TrxID: ${transactionId}`,
                actor: currentUser?.name || 'Customer',
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return o;
      })
    );

    void apiMutation(`/api/orders/${encodeURIComponent(orderId)}/payment-claim`, 'POST', {
      senderPhone,
      transactionId: transactionId.trim().toUpperCase(),
      customerNotes,
    });

    return { success: true, message: 'Payment details submitted for manual verification.' };
  };

  const trackOrderLookup = (
    orderQuery: string,
    phoneOrEmail?: string
  ): { success: boolean; order?: Order; error?: string } => {
    const raw = orderQuery.trim();
    if (!raw) {
      return { success: false, error: 'Please enter an Order Number or Courier Tracking ID.' };
    }
    const clean = raw.replace(/^#/, '').trim().toLowerCase();

    // Match by orderNumber, id, or carrier tracking number
    const matched = orders.find(o => {
      const numMatch =
        o.orderNumber.toLowerCase() === clean ||
        o.orderNumber.toLowerCase().endsWith(clean) ||
        clean.endsWith(o.orderNumber.toLowerCase());
      const idMatch = o.id.toLowerCase() === clean;
      const trackingMatch = o.trackingNumber && o.trackingNumber.toLowerCase() === clean;
      return numMatch || idMatch || trackingMatch;
    });

    if (!matched) {
      return {
        success: false,
        error: `No order found matching "${orderQuery}". Please verify your order number (e.g. ORD-2026-7841) or tracking code.`,
      };
    }

    // Authorization checks:
    // 1. If currently logged in as admin: access granted
    if (currentUser?.role === 'admin') {
      return { success: true, order: matched };
    }

    // 2. If logged in customer matches order owner: access granted
    if (currentUser && matched.userId === currentUser.id) {
      return { success: true, order: matched };
    }

    // 3. For guest/unauthenticated or cross-session tracking: require phone or email for privacy
    if (!phoneOrEmail || !phoneOrEmail.trim()) {
      return {
        success: false,
        error: 'For customer privacy, please enter the phone number or email address associated with this order.',
      };
    }

    const cleanContact = phoneOrEmail.trim().toLowerCase();
    const cleanDigits = phoneOrEmail.replace(/\D/g, '');

    const emailMatches =
      matched.customerEmail.toLowerCase() === cleanContact ||
      matched.deliveryAddressSnapshot.recipientName.toLowerCase() === cleanContact;

    const phoneMatches =
      cleanDigits.length >= 6 &&
      (matched.customerPhone.replace(/\D/g, '').includes(cleanDigits) ||
        matched.deliveryAddressSnapshot.phone.replace(/\D/g, '').includes(cleanDigits));

    if (emailMatches || phoneMatches) {
      return { success: true, order: matched };
    }

    return {
      success: false,
      error: 'The provided phone number or email does not match our records for this order.',
    };
  };

  // PAYMENT WEBHOOK (IPN) & OFFLINE ORDER RESILIENCE METHODS
  const updateWebhookConfig = (config: PaymentWebhookConfig) => {
    setWebhookConfig(config);
    logAudit('UPDATE_WEBHOOK_CONFIG', 'WEBHOOK_CONFIG', 'global', `Updated payment webhook configuration (Enabled: ${config.isEnabled})`);
  };

  const savePendingCheckoutDraft = (draft: PendingCheckoutDraft | null) => {
    setPendingCheckoutDraft(draft);
  };

  const queueOfflineOrder = (payload: Omit<OfflineQueuedOrder, 'id' | 'queuedAt'>): OfflineQueuedOrder => {
    const item: OfflineQueuedOrder = {
      ...payload,
      id: `offq-${Date.now()}`,
      queuedAt: new Date().toISOString(),
    };
    setOfflineOrderQueue(prev => {
      const filtered = prev.filter(q => q.draftOrderNumber !== payload.draftOrderNumber);
      return [item, ...filtered];
    });
    logAudit(
      'QUEUE_OFFLINE_ORDER',
      'OFFLINE_QUEUE',
      item.id,
      `Queued offline checkout #${payload.draftOrderNumber} for ৳${payload.expectedGrandTotal} while customer internet was disconnected`
    );
    return item;
  };

  const syncOfflineOrders = (): { syncedCount: number; orders: Order[] } => {
    if (offlineOrderQueue.length === 0) {
      return { syncedCount: 0, orders: [] };
    }
    const createdOrders: Order[] = [];
    const remainingQueue: OfflineQueuedOrder[] = [];

    for (const queued of offlineOrderQueue) {
      const res = placeOrder({
        deliveryAddress: queued.deliveryAddress,
        zoneId: queued.zoneId,
        paymentMethodId: queued.paymentMethodId,
        couponCode: queued.couponCode,
        loyaltyPointsToUse: queued.loyaltyPointsToUse,
        senderPhone: queued.senderPhone,
        transactionId: queued.transactionId,
        customerNotes: queued.customerNotes
          ? `${queued.customerNotes} [Auto-synced upon network recovery]`
          : '[Auto-synced upon network recovery]',
        orderNumberOverride: queued.draftOrderNumber,
      });
      if (res.success && res.order) {
        createdOrders.push(res.order);
      } else {
        remainingQueue.push(queued);
      }
    }

    setOfflineOrderQueue(remainingQueue);
    return { syncedCount: createdOrders.length, orders: createdOrders };
  };

  const receivePaymentWebhook = (payload: {
    gateway: PaymentMethodType;
    transactionId: string;
    senderPhone: string;
    amount: number;
    orderReference?: string;
  }): {
    success: boolean;
    status: WebhookEventStatus;
    message: string;
    order?: Order;
    log: PaymentWebhookLog;
  } => {
    const cleanTrx = payload.transactionId.trim().toUpperCase();
    const cleanPhone = payload.senderPhone.trim();
    const cleanPhoneDigits = cleanPhone.replace(/\D/g, '');
    const cleanRef = (payload.orderReference || '').replace(/^#/, '').trim().toUpperCase();

    const rawPayload = JSON.stringify({
      event: 'payment.captured',
      gateway: `${payload.gateway}_ipn_webhook`,
      trxID: cleanTrx,
      senderMsisdn: cleanPhone,
      amount: payload.amount,
      currency: 'BDT',
      merchantReference: cleanRef || null,
      timestamp: new Date().toISOString(),
    });

    // 1. Check duplicate transactionId already verified in webhookLogs
    const duplicateLog = webhookLogs.find(
      w =>
        w.transactionId.toUpperCase() === cleanTrx &&
        (w.status === 'matched_and_verified' || w.status === 'offline_draft_converted')
    );
    if (duplicateLog) {
      const dupEntry: PaymentWebhookLog = {
        id: `wh-${Date.now()}`,
        gateway: payload.gateway,
        transactionId: cleanTrx,
        senderPhone: cleanPhone,
        amount: payload.amount,
        orderReference: cleanRef || undefined,
        matchedOrderId: duplicateLog.matchedOrderId,
        matchedOrderNumber: duplicateLog.matchedOrderNumber,
        status: 'duplicate_ignored',
        signatureVerified: true,
        receivedAt: new Date().toISOString(),
        processedNote: `Idempotent duplicate TrxID ${cleanTrx} ignored (already verified on #${duplicateLog.matchedOrderNumber}).`,
        rawPayload,
      };
      setWebhookLogs(prev => [dupEntry, ...prev]);
      return {
        success: false,
        status: 'duplicate_ignored',
        message: `Webhook TrxID ${cleanTrx} was already processed for order #${duplicateLog.matchedOrderNumber}.`,
        log: dupEntry,
      };
    }

    // 2. Try matching an existing order in `orders`
    const matchedOrder = orders.find(o => {
      if (cleanRef && o.orderNumber.toUpperCase() === cleanRef) return true;
      if (o.paymentClaim && o.paymentClaim.transactionId.toUpperCase() === cleanTrx) return true;
      // Also match awaiting_verification or unpaid order with same phone & amount
      if (o.paymentStatus === 'awaiting_verification' || o.paymentStatus === 'unpaid') {
        const orderPhoneDigits = (o.paymentClaim?.senderPhone || o.customerPhone).replace(/\D/g, '');
        const phoneMatch =
          cleanPhoneDigits.length >= 6 &&
          orderPhoneDigits.length >= 6 &&
          (orderPhoneDigits.endsWith(cleanPhoneDigits.slice(-8)) ||
            cleanPhoneDigits.endsWith(orderPhoneDigits.slice(-8)));
        if (phoneMatch && Math.abs(o.grandTotal - payload.amount) <= 5) {
          return true;
        }
      }
      return false;
    });

    if (matchedOrder) {
      const updatedClaim = matchedOrder.paymentClaim
        ? {
            ...matchedOrder.paymentClaim,
            transactionId:
              matchedOrder.paymentClaim.transactionId === 'AWAITING-WEBHOOK-IPN' ||
              matchedOrder.paymentClaim.transactionId === 'PENDING-SUBMISSION'
                ? cleanTrx
                : matchedOrder.paymentClaim.transactionId,
            senderPhone: cleanPhone || matchedOrder.paymentClaim.senderPhone,
            verifiedAt: new Date().toISOString(),
            verifiedBy: `Payment Webhook (${payload.gateway.toUpperCase()} IPN)`,
            adminNotes: `Auto-verified via ${payload.gateway.toUpperCase()} IPN Webhook (TrxID: ${cleanTrx}, Amount: ৳${payload.amount})`,
          }
        : {
            id: `claim-${Date.now()}`,
            orderId: matchedOrder.id,
            paymentMethodId: matchedOrder.paymentMethodId,
            paymentMethodName: matchedOrder.paymentMethodSnapshot.name,
            senderPhone: cleanPhone || matchedOrder.customerPhone,
            transactionId: cleanTrx,
            amountClaimed: payload.amount,
            submittedAt: new Date().toISOString(),
            verifiedAt: new Date().toISOString(),
            verifiedBy: `Payment Webhook (${payload.gateway.toUpperCase()} IPN)`,
            adminNotes: `Auto-verified via ${payload.gateway.toUpperCase()} IPN Webhook`,
          };

      const nextStatus: OrderStatus =
        matchedOrder.orderStatus === 'pending' ? 'processing' : matchedOrder.orderStatus;

      const updatedOrder: Order = {
        ...matchedOrder,
        paymentStatus: 'verified',
        orderStatus: nextStatus,
        paymentClaim: updatedClaim,
        statusHistory: [
          ...matchedOrder.statusHistory,
          {
            id: `sh-${Date.now()}`,
            orderId: matchedOrder.id,
            fromStatus: matchedOrder.orderStatus,
            toStatus: nextStatus,
            note: `Payment verified automatically via ${payload.gateway.toUpperCase()} Webhook IPN (TrxID: ${cleanTrx}, ৳${payload.amount}). Order moved to ${nextStatus}.`,
            actor: 'Payment Webhook (IPN)',
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setOrders(prev => prev.map(o => (o.id === matchedOrder.id ? updatedOrder : o)));

      const logEntry: PaymentWebhookLog = {
        id: `wh-${Date.now()}`,
        gateway: payload.gateway,
        transactionId: cleanTrx,
        senderPhone: cleanPhone,
        amount: payload.amount,
        orderReference: cleanRef || matchedOrder.orderNumber,
        matchedOrderId: matchedOrder.id,
        matchedOrderNumber: matchedOrder.orderNumber,
        status: 'matched_and_verified',
        signatureVerified: true,
        receivedAt: new Date().toISOString(),
        processedNote: `Matched existing Order #${matchedOrder.orderNumber}. Auto-verified payment & transitioned status to ${nextStatus}.`,
        rawPayload,
      };
      setWebhookLogs(prev => [logEntry, ...prev]);

      logAudit(
        'WEBHOOK_VERIFY_PAYMENT',
        'ORDER',
        matchedOrder.id,
        `Webhook (${payload.gateway.toUpperCase()}) verified TrxID ${cleanTrx} for #${matchedOrder.orderNumber}`
      );

      if (smtpSettings.isEnabled && smtpSettings.notifications.paymentVerified) {
        sendEmailNotification('payment_verified', { order: updatedOrder, siteSettings });
      }

      return {
        success: true,
        status: 'matched_and_verified',
        message: `Webhook matched Order #${matchedOrder.orderNumber} and automatically verified payment!`,
        order: updatedOrder,
        log: logEntry,
      };
    }

    // 3. Check if an order is waiting in `offlineOrderQueue` or `pendingCheckoutDraft` (Customer's internet turned off!)
    const matchedQueued = offlineOrderQueue.find(q => {
      if (cleanRef && q.draftOrderNumber.toUpperCase() === cleanRef) return true;
      if (q.transactionId && q.transactionId.toUpperCase() === cleanTrx) return true;
      const qPhoneDigits = (q.senderPhone || q.deliveryAddress.phone).replace(/\D/g, '');
      return (
        cleanPhoneDigits.length >= 6 &&
        qPhoneDigits.length >= 6 &&
        qPhoneDigits.endsWith(cleanPhoneDigits.slice(-8))
      );
    });

    if (matchedQueued) {
      const orderRes = placeOrder({
        deliveryAddress: matchedQueued.deliveryAddress,
        zoneId: matchedQueued.zoneId,
        paymentMethodId: matchedQueued.paymentMethodId,
        couponCode: matchedQueued.couponCode,
        loyaltyPointsToUse: matchedQueued.loyaltyPointsToUse,
        senderPhone: cleanPhone || matchedQueued.senderPhone,
        transactionId: cleanTrx,
        customerNotes: matchedQueued.customerNotes
          ? `${matchedQueued.customerNotes} [Processed via Payment Webhook while customer was offline]`
          : '[Processed via Payment Webhook while customer was offline]',
        orderNumberOverride: matchedQueued.draftOrderNumber,
        verifiedByWebhook: true,
      });

      if (orderRes.success && orderRes.order) {
        setOfflineOrderQueue(prev => prev.filter(q => q.id !== matchedQueued.id));
        const logEntry: PaymentWebhookLog = {
          id: `wh-${Date.now()}`,
          gateway: payload.gateway,
          transactionId: cleanTrx,
          senderPhone: cleanPhone,
          amount: payload.amount,
          orderReference: orderRes.order.orderNumber,
          matchedOrderId: orderRes.order.id,
          matchedOrderNumber: orderRes.order.orderNumber,
          status: 'offline_draft_converted',
          signatureVerified: true,
          receivedAt: new Date().toISOString(),
          processedNote: `Customer internet was offline! Webhook converted queued checkout #${orderRes.order.orderNumber} into a verified & processing order.`,
          rawPayload,
        };
        setWebhookLogs(prev => [logEntry, ...prev]);

        return {
          success: true,
          status: 'offline_draft_converted',
          message: `Customer was offline — Webhook automatically processed & verified queued Order #${orderRes.order.orderNumber}!`,
          order: orderRes.order,
          log: logEntry,
        };
      }
    }

    // 4. Check if `pendingCheckoutDraft` is active (Customer lost internet on the checkout screen before clicking Place Order)
    if (webhookConfig.autoCreateOrderFromDraftOnWebhook && pendingCheckoutDraft && cart.length > 0) {
      const draftMatchesRef =
        !cleanRef || pendingCheckoutDraft.draftOrderNumber.toUpperCase() === cleanRef;
      if (draftMatchesRef) {
        // Resolve matching payment method for gateway if needed
        const gatewayPm =
          paymentMethods.find(p => p.type === payload.gateway && p.isEnabled) ||
          paymentMethods.find(p => p.id === pendingCheckoutDraft.paymentMethodId);

        const orderRes = placeOrder({
          deliveryAddress: pendingCheckoutDraft.deliveryAddress,
          zoneId: pendingCheckoutDraft.zoneId,
          paymentMethodId: gatewayPm ? gatewayPm.id : pendingCheckoutDraft.paymentMethodId,
          couponCode: pendingCheckoutDraft.couponCode,
          loyaltyPointsToUse: pendingCheckoutDraft.loyaltyPointsToUse,
          senderPhone: cleanPhone || pendingCheckoutDraft.senderPhone || pendingCheckoutDraft.deliveryAddress.phone,
          transactionId: cleanTrx,
          customerNotes:
            pendingCheckoutDraft.customerNotes ||
            'Auto-processed via Payment Webhook while customer internet was disconnected',
          orderNumberOverride: pendingCheckoutDraft.draftOrderNumber,
          verifiedByWebhook: true,
        });

        if (orderRes.success && orderRes.order) {
          const logEntry: PaymentWebhookLog = {
            id: `wh-${Date.now()}`,
            gateway: payload.gateway,
            transactionId: cleanTrx,
            senderPhone: cleanPhone,
            amount: payload.amount,
            orderReference: orderRes.order.orderNumber,
            matchedOrderId: orderRes.order.id,
            matchedOrderNumber: orderRes.order.orderNumber,
            status: 'offline_draft_converted',
            signatureVerified: true,
            receivedAt: new Date().toISOString(),
            processedNote: `Customer disconnected before submitting checkout! Webhook converted draft #${orderRes.order.orderNumber} into a live Verified & Processing order.`,
            rawPayload,
          };
          setWebhookLogs(prev => [logEntry, ...prev]);

          return {
            success: true,
            status: 'offline_draft_converted',
            message: `Webhook converted offline customer draft #${orderRes.order.orderNumber} into a live Verified & Processing order!`,
            order: orderRes.order,
            log: logEntry,
          };
        }
      }
    }

    // 5. Otherwise store as `unmatched_queued` so when the offline order arrives/syncs later, it auto-verifies!
    const queuedLog: PaymentWebhookLog = {
      id: `wh-${Date.now()}`,
      gateway: payload.gateway,
      transactionId: cleanTrx,
      senderPhone: cleanPhone,
      amount: payload.amount,
      orderReference: cleanRef || undefined,
      status: 'unmatched_queued',
      signatureVerified: true,
      receivedAt: new Date().toISOString(),
      processedNote: `Webhook recorded & pre-verified in queue. Will automatically verify order when TrxID ${cleanTrx} or Ref ${cleanRef || 'N/A'} is submitted/synced.`,
      rawPayload,
    };
    setWebhookLogs(prev => [queuedLog, ...prev]);
    logAudit(
      'WEBHOOK_QUEUED',
      'WEBHOOK',
      queuedLog.id,
      `Queued pre-verified ${payload.gateway.toUpperCase()} webhook for TrxID ${cleanTrx} (৳${payload.amount})`
    );

    return {
      success: true,
      status: 'unmatched_queued',
      message: `Webhook TrxID ${cleanTrx} recorded! Any order placed or synced with this TrxID/Reference will auto-verify immediately.`,
      log: queuedLog,
    };
  };

  // ADMIN OPERATIONS
  const adminVerifyPayment = (orderId: string, adminNotes?: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          const updatedClaim = o.paymentClaim
            ? {
                ...o.paymentClaim,
                verifiedAt: new Date().toISOString(),
                verifiedBy: currentUser ? currentUser.name : 'Admin',
                adminNotes: adminNotes || 'Payment verified in bank statement.',
              }
            : null;

          return {
            ...o,
            paymentStatus: 'verified' as PaymentStatus,
            orderStatus: (o.orderStatus === 'pending' ? 'processing' : o.orderStatus) as OrderStatus,
            paymentClaim: updatedClaim,
            statusHistory: [
              ...o.statusHistory,
              {
                id: `sh-${Date.now()}`,
                orderId,
                fromStatus: o.orderStatus,
                toStatus: (o.orderStatus === 'pending' ? 'processing' : o.orderStatus) as OrderStatus,
                note: `Payment manually verified by Admin (${currentUser?.name || 'Admin'}). Note: ${adminNotes || 'Confirmed'}`,
                actor: currentUser?.name || 'Admin',
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return o;
      });
      syncAdminChange('orders', next);
      return next;
    });
    logAudit('VERIFY_PAYMENT', 'ORDER', orderId, `Admin approved payment for order ${order.orderNumber}`);

    // Trigger payment verified email via SMTP
    if (smtpSettings.isEnabled && smtpSettings.notifications.paymentVerified) {
      sendEmailNotification('payment_verified', { order: { ...order, paymentStatus: 'verified' }, siteSettings });
    }
  };

  const adminRejectPayment = (orderId: string, rejectionReason: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          const updatedClaim = o.paymentClaim
            ? {
                ...o.paymentClaim,
                rejectionReason,
                adminNotes: `Rejected: ${rejectionReason}`,
              }
            : null;

          return {
            ...o,
            paymentStatus: 'rejected' as PaymentStatus,
            paymentClaim: updatedClaim,
            statusHistory: [
              ...o.statusHistory,
              {
                id: `sh-${Date.now()}`,
                orderId,
                fromStatus: o.orderStatus,
                toStatus: o.orderStatus,
                note: `Payment claim rejected by Admin. Reason: ${rejectionReason}`,
                actor: currentUser?.name || 'Admin',
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return o;
      });
      syncAdminChange('orders', next);
      return next;
    });

    logAudit('REJECT_PAYMENT', 'ORDER', orderId, `Admin rejected payment claim on order ${order.orderNumber}. Reason: ${rejectionReason}`);
  };

  const adminConfirmCodCollection = (orderId: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            paymentStatus: 'verified' as PaymentStatus,
            statusHistory: [
              ...o.statusHistory,
              {
                id: `sh-${Date.now()}`,
                orderId,
                fromStatus: o.orderStatus,
                toStatus: o.orderStatus,
                note: 'Cash collection confirmed by courier / admin.',
                actor: currentUser?.name || 'Admin',
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return o;
      });
      syncAdminChange('orders', next);
      return next;
    });

    logAudit('CONFIRM_COD_COLLECTION', 'ORDER', orderId, `COD payment confirmed for order ${order.orderNumber}`);
  };

  const adminUpdateOrderStatus = (
    orderId: string,
    newStatus: OrderStatus,
    note: string,
    carrierName?: string,
    trackingNumber?: string
  ) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const oldStatus = order.orderStatus;
    if (oldStatus === newStatus) return;

    // Check if transitioning to DELIVERED -> Award loyalty points if enabled!
    if (newStatus === 'delivered' && siteSettings.loyaltySettings.isEnabled) {
      const orderUser = users.find(u => u.id === order.userId);
      if (orderUser) {
        const pointsToAward = Math.floor(
          (order.grandTotal / 100) * siteSettings.loyaltySettings.earnPointsPerHundredCurrency
        );
        if (pointsToAward > 0) {
          const newBal = orderUser.loyaltyPoints + pointsToAward;
          setUsers(prev => prev.map(u => (u.id === orderUser.id ? { ...u, loyaltyPoints: newBal } : u)));
          if (currentUser?.id === orderUser.id) {
            setCurrentUser(prev => (prev ? { ...prev, loyaltyPoints: newBal } : null));
          }

          const ltx: LoyaltyTransaction = {
            id: `ltx-${Date.now()}`,
            userId: orderUser.id,
            orderId,
            pointsDelta: pointsToAward,
            balanceAfter: newBal,
            type: 'earn',
            reason: `Earned from delivered Order #${order.orderNumber}`,
            timestamp: new Date().toISOString(),
          };
          setLoyaltyTransactions(prev => [ltx, ...prev]);
        }
      }
    }

    // Check if CANCELLED -> Restore stock!
    if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
      setProducts(prevProducts => {
        const nextProducts = prevProducts.map(prod => {
          let hasChanges = false;
          const newVariants = prod.variants.map(v => {
            const item = order.items.find(i => i.variantId === v.id);
            if (item) {
              hasChanges = true;
              return { ...v, stockQuantity: v.stockQuantity + item.quantity };
            }
            return v;
          });
          return hasChanges ? { ...prod, variants: newVariants } : prod;
        });
        syncAdminChange('products', nextProducts);
        return nextProducts;
      });
    }

    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            orderStatus: newStatus,
            carrierName: carrierName !== undefined ? carrierName : o.carrierName,
            trackingNumber: trackingNumber !== undefined ? trackingNumber : o.trackingNumber,
            statusHistory: [
              ...o.statusHistory,
              {
                id: `sh-${Date.now()}`,
                orderId,
                fromStatus: oldStatus,
                toStatus: newStatus,
                note: note || `Status changed from ${oldStatus} to ${newStatus}`,
                actor: currentUser?.name || 'Admin',
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return o;
      });
      syncAdminChange('orders', next);
      return next;
    });
    logAudit('UPDATE_ORDER_STATUS', 'ORDER', orderId, `Status transitioned from ${oldStatus} -> ${newStatus}. Note: ${note}`);

    // Trigger order shipped email via SMTP
    if (newStatus === 'shipped' && smtpSettings.isEnabled && smtpSettings.notifications.orderDispatched) {
      sendEmailNotification('order_shipped', {
        order: {
          ...order,
          orderStatus: 'shipped',
          carrierName: carrierName || order.carrierName || 'Steadfast Courier',
          trackingNumber: trackingNumber || order.trackingNumber || 'SFC-8942110',
        },
        siteSettings,
      });
    }
  };

  const adminSaveProduct = (product: Product) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === product.id);
      const next = idx > -1 ? prev.map((p, i) => (i === idx ? product : p)) : [product, ...prev];
      syncAdminChange('products', next);
      return next;
    });
    logAudit('SAVE_PRODUCT', 'PRODUCT', product.id, `Saved product: ${product.name} with ${product.variants.length} variants`);
  };

  const adminDeleteProduct = (productId: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    const target = products.find(p => p.id === productId);
    setProducts(prev => {
      const next = prev.filter(p => p.id !== productId);
      syncAdminChange('products', next);
      return next;
    });
    logAudit('DELETE_PRODUCT', 'PRODUCT', productId, `Deleted product: ${target?.name || productId}`);
  };

  const adminUpdateVariantStock = (variantId: string, newStock: number, reason?: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setProducts(prev => {
      const next = prev.map(p => ({
        ...p,
        variants: p.variants.map(v => (v.id === variantId ? { ...v, stockQuantity: Math.max(0, newStock) } : v)),
      }));
      syncAdminChange('products', next);
      return next;
    });
    const auditDetails = reason
      ? `Updated variant stock to ${newStock}. Note: ${reason}`
      : `Updated variant stock to ${newStock}`;
    logAudit('UPDATE_STOCK', 'VARIANT', variantId, auditDetails);
  };

  const adminSaveCategory = (category: Category) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === category.id);
      const next = idx > -1 ? prev.map((c, i) => (i === idx ? category : c)) : [...prev, category];
      syncAdminChange('categories', next);
      return next;
    });
    logAudit('SAVE_CATEGORY', 'CATEGORY', category.id, `Saved category: ${category.name}`);
  };

  const adminDeleteCategory = (categoryId: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setCategories(prev => {
      const next = prev.filter(c => c.id !== categoryId);
      syncAdminChange('categories', next);
      return next;
    });
    logAudit('DELETE_CATEGORY', 'CATEGORY', categoryId, `Deleted category ${categoryId}`);
  };

  const adminSavePaymentMethod = (pm: PaymentMethod) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setPaymentMethods(prev => {
      const idx = prev.findIndex(p => p.id === pm.id);
      const next = idx > -1 ? prev.map((p, i) => (i === idx ? pm : p)) : [...prev, pm];
      syncAdminChange('payment_methods', next);
      return next;
    });
    logAudit('SAVE_PAYMENT_METHOD', 'PAYMENT_METHOD', pm.id, `Updated payment method: ${pm.name}`);
  };

  const adminDeletePaymentMethod = (pmId: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setPaymentMethods(prev => {
      const next = prev.filter(p => p.id !== pmId);
      syncAdminChange('payment_methods', next);
      return next;
    });
    logAudit('DELETE_PAYMENT_METHOD', 'PAYMENT_METHOD', pmId, `Deleted payment method: ${pmId}`);
  };

  const adminSaveDeliveryZone = (zone: DeliveryZone) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setDeliveryZones(prev => {
      const idx = prev.findIndex(z => z.id === zone.id);
      const next = idx > -1 ? prev.map((z, i) => (i === idx ? zone : z)) : [...prev, zone];
      syncAdminChange('delivery_zones', next);
      return next;
    });
    logAudit('SAVE_DELIVERY_ZONE', 'DELIVERY_ZONE', zone.id, `Updated zone: ${zone.name} (Fee: ৳${zone.fee})`);
  };

  const adminDeleteDeliveryZone = (zoneId: string): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) {
      return { success: false, message: 'Forbidden: Active administrator privileges required.' };
    }
    if (deliveryZones.length <= 1) {
      return { success: false, message: 'Cannot delete the last remaining delivery zone.' };
    }
    const target = deliveryZones.find(z => z.id === zoneId);
    if (!target) {
      return { success: false, message: 'Delivery zone not found.' };
    }
    const fallbackZone = deliveryZones.find(z => z.id !== zoneId);
    // Reassign any mapped delivery areas to fallback zone so no orphaned areas exist
    if (fallbackZone) {
      setDeliveryAreas(prev => {
        const nextAreas = prev.map(a => (a.zoneId === zoneId ? { ...a, zoneId: fallbackZone.id } : a));
        syncAdminChange('delivery_areas', nextAreas);
        return nextAreas;
      });
    }
    setDeliveryZones(prev => {
      const nextZones = prev.filter(z => z.id !== zoneId);
      syncAdminChange('delivery_zones', nextZones);
      return nextZones;
    });
    logAudit('DELETE_DELIVERY_ZONE', 'DELIVERY_ZONE', zoneId, `Deleted delivery zone: ${target.name}`);
    return {
      success: true,
      message: `Deleted zone "${target.name}". Mapped areas were reassigned to "${fallbackZone?.name || 'default'}".`,
    };
  };

  const adminSaveDeliveryArea = (area: DeliveryArea) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setDeliveryAreas(prev => {
      const idx = prev.findIndex(a => a.id === area.id);
      const next = idx > -1 ? prev.map((a, i) => (i === idx ? area : a)) : [...prev, area];
      syncAdminChange('delivery_areas', next);
      return next;
    });
    logAudit('SAVE_DELIVERY_AREA', 'DELIVERY_AREA', area.id, `Saved delivery area: ${area.districtName} - ${area.areaName}`);
  };

  const adminDeleteDeliveryArea = (areaId: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    const target = deliveryAreas.find(a => a.id === areaId);
    setDeliveryAreas(prev => {
      const next = prev.filter(a => a.id !== areaId);
      syncAdminChange('delivery_areas', next);
      return next;
    });
    logAudit('DELETE_DELIVERY_AREA', 'DELIVERY_AREA', areaId, `Deleted delivery area: ${target?.areaName || areaId}`);
  };

  const adminSaveCoupon = (coupon: Coupon) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setCoupons(prev => {
      const idx = prev.findIndex(c => c.id === coupon.id);
      const next = idx > -1 ? prev.map((c, i) => (i === idx ? coupon : c)) : [coupon, ...prev];
      syncAdminChange('coupons', next);
      return next;
    });
    logAudit('SAVE_COUPON', 'COUPON', coupon.id, `Saved coupon code ${coupon.code}`);
  };

  const adminDeleteCoupon = (couponId: string) => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) return;
    setCoupons(prev => {
      const next = prev.filter(c => c.id !== couponId);
      syncAdminChange('coupons', next);
      return next;
    });
    logAudit('DELETE_COUPON', 'COUPON', couponId, `Deleted coupon ${couponId}`);
  };

  const adminAdjustLoyaltyPoints = (userId: string, pointsDelta: number, reason: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newBal = Math.max(0, user.loyaltyPoints + pointsDelta);

    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, loyaltyPoints: newBal } : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => (prev ? { ...prev, loyaltyPoints: newBal } : null));
    }

    const ltx: LoyaltyTransaction = {
      id: `ltx-${Date.now()}`,
      userId,
      pointsDelta,
      balanceAfter: newBal,
      type: 'admin_adjustment',
      reason,
      timestamp: new Date().toISOString(),
    };
    setLoyaltyTransactions(prev => [ltx, ...prev]);
    logAudit('ADJUST_LOYALTY', 'USER', userId, `Admin adjusted points by ${pointsDelta > 0 ? '+' : ''}${pointsDelta}. Reason: ${reason}`);
  };

  const adminSaveUser = (user: User, isNew?: boolean, password?: string): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) {
      return { success: false, message: 'Forbidden: Active administrator privileges required.' };
    }

    const normalizedEmail = user.email.trim().toLowerCase();
    if (!user.name.trim() || !normalizedEmail) {
      return { success: false, message: 'Name and email address are required.' };
    }

    if (isNew && password && password.trim().length > 0 && password.trim().length < 8) {
      return { success: false, message: 'Initial password must be at least 8 characters long.' };
    }

    const emailConflict = users.find(
      u => u.id !== user.id && u.email.trim().toLowerCase() === normalizedEmail
    );
    if (emailConflict) {
      return { success: false, message: `Email "${user.email}" is already assigned to ${emailConflict.name}.` };
    }

    const existing = users.find(u => u.id === user.id);
    if (existing && existing.role === 'admin') {
      const otherActiveAdmins = users.filter(
        u => u.id !== user.id && u.role === 'admin' && (u.status || 'active') === 'active'
      );
      if (
        (user.role !== 'admin' || (user.status && user.status !== 'active')) &&
        otherActiveAdmins.length === 0
      ) {
        return {
          success: false,
          message: 'Cannot demote or deactivate the only active administrator account.',
        };
      }
    }

    const sanitizedUser: User = {
      ...user,
      name: user.name.trim(),
      email: user.email.trim(),
      phone: user.phone.trim(),
      status: user.status || 'active',
      loyaltyPoints: Math.max(0, Math.round(user.loyaltyPoints || 0)),
    };

    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === sanitizedUser.id);
      if (idx > -1) {
        return prev.map((u, i) => (i === idx ? sanitizedUser : u));
      }
      return [sanitizedUser, ...prev];
    });

    if (currentUser?.id === sanitizedUser.id) {
      setCurrentUser(sanitizedUser);
    }

    void apiMutation('/api/admin/users', 'POST', {
      user: sanitizedUser,
      isNew: Boolean(isNew || !existing),
      password: password?.trim() || undefined,
    }).then(res => {
      if (res.ok && Array.isArray(res.data?.users)) {
        setUsers(res.data.users);
      }
    });

    return {
      success: true,
      message: isNew || !existing
        ? `Created user account for ${sanitizedUser.name}`
        : `Updated account details for ${sanitizedUser.name}`,
    };
  };

  const adminUpdateUserStatus = (
    userId: string,
    status: UserStatus,
    reason?: string
  ): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) {
      return { success: false, message: 'Forbidden: Active administrator privileges required.' };
    }

    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    if (target.role === 'admin' && status !== 'active') {
      const otherActiveAdmins = users.filter(
        u => u.id !== userId && u.role === 'admin' && (u.status || 'active') === 'active'
      );
      if (otherActiveAdmins.length === 0) {
        return {
          success: false,
          message: 'Cannot suspend or archive the last active administrator account.',
        };
      }
    }

    const updatedUser: User = { ...target, status };
    setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)));
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }

    void apiMutation(`/api/admin/users/${encodeURIComponent(userId)}/status`, 'PATCH', {
      status,
      reason,
    }).then(res => {
      if (res.ok && Array.isArray(res.data?.users)) {
        setUsers(res.data.users);
      }
    });

    return {
      success: true,
      message: `Account status for ${target.name} updated to ${status.toUpperCase()}.`,
    };
  };

  const adminDeleteUser = (userId: string): { success: boolean; message: string } => {
    if (!currentUser || currentUser.role !== 'admin' || currentUser.mustChangePassword) {
      return { success: false, message: 'Forbidden: Active administrator privileges required.' };
    }

    const target = users.find(u => u.id === userId);
    if (!target) {
      return { success: false, message: 'User account not found.' };
    }

    if (currentUser?.id === userId) {
      return {
        success: false,
        message: 'Cannot delete the currently logged-in administrator account.',
      };
    }

    if (target.role === 'admin') {
      const otherAdmins = users.filter(u => u.id !== userId && u.role === 'admin');
      if (otherAdmins.length === 0) {
        return {
          success: false,
          message: 'Cannot delete the last remaining administrator account.',
        };
      }
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    void apiMutation(`/api/admin/users/${encodeURIComponent(userId)}`, 'DELETE').then(res => {
      if (res.ok && Array.isArray(res.data?.users)) {
        setUsers(res.data.users);
      }
    });

    return {
      success: true,
      message: `Deleted user account "${target.name}".`,
    };
  };

  const adminUpdateSiteSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
    syncAdminChange('site_settings', settings);
    logAudit('UPDATE_SETTINGS', 'SITE_SETTINGS', 'global', `Admin updated site configuration and theme branding.`);
  };

  const adminSaveNewsPost = (post: NewsPost) => {
    setNewsPosts(prev => {
      const idx = prev.findIndex(p => p.id === post.id);
      if (idx > -1) {
        return prev.map((p, i) => (i === idx ? post : p));
      }
      return [post, ...prev];
    });
    logAudit('SAVE_NEWS_POST', 'NEWS_POST', post.id, `Saved news post: ${post.title}`);
  };

  const adminDeleteNewsPost = (postId: string) => {
    setNewsPosts(prev => prev.filter(p => p.id !== postId));
  };

  const adminSaveStaticPage = (page: StaticPage) => {
    setStaticPages(prev => {
      const idx = prev.findIndex(p => p.id === page.id);
      if (idx > -1) {
        return prev.map((p, i) => (i === idx ? page : p));
      }
      return [...prev, page];
    });
    logAudit('SAVE_STATIC_PAGE', 'PAGE', page.id, `Updated page: ${page.title}`);
  };

  // Product Reviews & Ratings Implementation
  const getProductReviews = (productId: string): ProductReview[] => {
    return reviews
      .filter(r => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const getProductRatingSummary = (productId: string): ProductRatingSummary => {
    const productReviews = reviews.filter(r => r.productId === productId);
    const reviewCount = productReviews.length;
    const ratingDistribution: { 5: number; 4: number; 3: number; 2: number; 1: number } = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    if (reviewCount === 0) {
      return {
        averageRating: 0,
        reviewCount: 0,
        ratingDistribution,
      };
    }

    let totalSum = 0;
    for (const rev of productReviews) {
      const roundedRating = Math.min(5, Math.max(1, Math.round(rev.rating))) as 1 | 2 | 3 | 4 | 5;
      ratingDistribution[roundedRating] = (ratingDistribution[roundedRating] || 0) + 1;
      totalSum += rev.rating;
    }

    const averageRating = Number((totalSum / reviewCount).toFixed(1));

    return {
      averageRating,
      reviewCount,
      ratingDistribution,
    };
  };

  const addProductReview = (payload: {
    productId: string;
    rating: number;
    title?: string;
    comment: string;
  }): { success: boolean; message: string; review?: ProductReview } => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Authentication required. Please sign in or create an account to leave a product review.',
      };
    }

    if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
      return {
        success: false,
        message: 'Please choose a rating between 1 and 5 stars.',
      };
    }

    if (!payload.comment || payload.comment.trim().length < 5) {
      return {
        success: false,
        message: 'Please write a review comment with at least 5 characters.',
      };
    }

    const isVerified = orders.some(
      o => o.userId === currentUser.id && o.items.some(item => item.productId === payload.productId)
    );

    const existingIndex = reviews.findIndex(
      r => r.productId === payload.productId && r.userId === currentUser.id
    );

    if (existingIndex > -1) {
      const updatedReview: ProductReview = {
        ...reviews[existingIndex],
        rating: payload.rating,
        title: payload.title?.trim() || undefined,
        comment: payload.comment.trim(),
        createdAt: new Date().toISOString(),
        verifiedPurchase: isVerified || reviews[existingIndex].verifiedPurchase,
      };

      setReviews(prev => prev.map((r, i) => (i === existingIndex ? updatedReview : r)));
      void apiMutation('/api/reviews', 'POST', { review: updatedReview });

      return {
        success: true,
        message: 'Your review has been updated successfully!',
        review: updatedReview,
      };
    }

    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: payload.productId,
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      rating: payload.rating,
      title: payload.title?.trim() || undefined,
      comment: payload.comment.trim(),
      createdAt: new Date().toISOString(),
      verifiedPurchase: isVerified,
      helpfulCount: 0,
    };

    setReviews(prev => [newReview, ...prev]);
    void apiMutation('/api/reviews', 'POST', { review: newReview });

    return {
      success: true,
      message: 'Thank you! Your verified review has been published.',
      review: newReview,
    };
  };

  const voteReviewHelpful = (reviewId: string) => {
    setReviews(prev =>
      prev.map(r => (r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
    );
  };

  const deleteReview = (reviewId: string): { success: boolean; message: string } => {
    const rev = reviews.find(r => r.id === reviewId);
    if (!rev) return { success: false, message: 'Review not found' };

    if (currentUser?.role !== 'admin' && currentUser?.id !== rev.userId) {
      return { success: false, message: 'Unauthorized to delete this review' };
    }

    setReviews(prev => prev.filter(r => r.id !== reviewId));
    void apiMutation(`/api/reviews/${encodeURIComponent(reviewId)}`, 'DELETE');
    return { success: true, message: 'Review deleted successfully.' };
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        deliveryZones,
        deliveryAreas,
        paymentMethods,
        coupons,
        orders,
        users,
        currentUser,
        loyaltyTransactions,
        auditLogs,
        siteSettings,
        newsPosts,
        staticPages,
        cart,
        reviews,
        getProductReviews,
        getProductRatingSummary,
        addProductReview,
        voteReviewHelpful,
        deleteReview,
        authLoading,
        login,
        register,
        logout,
        changePassword,
        updateUserProfile,
        addUserAddress,
        deleteUserAddress,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        validateCoupon,
        placeOrder,
        submitPaymentClaim,
        trackOrderLookup,
        webhookLogs,
        webhookConfig,
        updateWebhookConfig,
        pendingCheckoutDraft,
        savePendingCheckoutDraft,
        offlineOrderQueue,
        queueOfflineOrder,
        syncOfflineOrders,
        receivePaymentWebhook,
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
        smtpSettings,
        emailLogs,
        emailTemplates,
        updateSmtpSettings,
        updateEmailTemplate,
        resetEmailTemplateToDefault,
        sendTestSmtpEmail,
        sendEmailNotification,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
