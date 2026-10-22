export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'archived';

export interface UserAddress {
  id: string;
  userId: string;
  label: string; // e.g. 'Home', 'Office'
  recipientName: string;
  phone: string;
  addressLine: string;
  district: string;
  areaId: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status?: UserStatus;
  mustChangePassword?: boolean;
  notes?: string;
  addresses: UserAddress[];
  loyaltyPoints: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
}

export interface VariantImage {
  id: string;
  colorName: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  displayOrder: number;
}

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL';

export interface ProductVariant {
  id: string;
  productId: string;
  colorName: string;
  colorHex: string;
  size: TShirtSize;
  sku: string;
  priceOverride: number | null; // if null, uses product.basePrice
  stockQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  basePrice: number; // in BDT (৳) or currency units
  isFeatured: boolean;
  status: 'published' | 'draft' | 'archived';
  fabricWeight: string; // e.g., '240 GSM 100% Combed Cotton'
  fitType: 'Oversized' | 'Regular Fit' | 'Boxy Heavyweight' | 'Relaxed';
  careInstructions: string;
  seoTitle?: string;
  seoDescription?: string;
  variants: ProductVariant[];
  images: VariantImage[];
  createdAt: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedDeliveryTime: string;
  isActive: boolean;
  displayOrder: number;
}

export interface DeliveryArea {
  id: string;
  zoneId: string;
  districtName: string;
  areaName: string;
}

export type PaymentMethodType = 'cod' | 'bkash' | 'nagad' | 'rocket' | 'bank';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  recipientNumber: string;
  accountType: 'personal' | 'merchant' | 'bank';
  instructions: string;
  isEnabled: boolean;
  displayOrder: number;
}

export type DiscountType = 'percentage' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimitGlobal: number;
  usageLimitPerUser: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface CouponRedemption {
  id: string;
  couponId: string;
  couponCode: string;
  orderId: string;
  userId: string;
  discountAmount: number;
  timestamp: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'unpaid'
  | 'awaiting_verification'
  | 'verified'
  | 'rejected'
  | 'refunded';

export interface OrderItemSnapshot {
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  colorName: string;
  size: TShirtSize;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  imageUrl: string;
}

export interface PaymentClaim {
  id: string;
  orderId: string;
  paymentMethodId: string;
  paymentMethodName: string;
  senderPhone: string;
  transactionId: string; // TrxID
  amountClaimed: number;
  customerNotes?: string;
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export interface OrderStatusHistoryItem {
  id: string;
  orderId: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  note: string;
  actor: string;
  timestamp: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. 'ORD-2026-89420'
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddressSnapshot: {
    recipientName: string;
    phone: string;
    addressLine: string;
    district: string;
    areaName: string;
  };
  deliveryZoneSnapshot: {
    id: string;
    name: string;
    fee: number;
  };
  items: OrderItemSnapshot[];
  subtotal: number;
  couponCodeApplied?: string;
  couponDiscount: number;
  loyaltyPointsUsed: number;
  loyaltyDiscount: number;
  deliveryFee: number;
  grandTotal: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethodId: string;
  paymentMethodSnapshot: {
    name: string;
    type: PaymentMethodType;
    recipientNumber: string;
    accountType: string;
  };
  paymentClaim: PaymentClaim | null;
  carrierName?: string;
  trackingNumber?: string;
  statusHistory: OrderStatusHistoryItem[];
  createdAt: string;
}

export type LoyaltyTxType = 'earn' | 'redeem' | 'admin_adjustment' | 'bonus' | 'refund_reversal';

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  orderId?: string;
  pointsDelta: number;
  balanceAfter: number;
  type: LoyaltyTxType;
  reason: string;
  timestamp: string;
}

export interface AdminAuditLog {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoText: string;
  logoUrl?: string; // Optional Brand Logo image URL or Base64 Data URL
  faviconUrl?: string; // Optional Favicon image URL or Base64 Data URL
  currencySymbol: string; // e.g. '৳' or '$'
  announcementBar: {
    text: string;
    enabled: boolean;
    linkText?: string;
    linkUrl?: string;
  };
  hero: {
    badge: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    imageUrl: string;
  };
  theme: {
    primaryColor: string; // Hex e.g. '#0F172A'
    accentColor: string; // Hex e.g. '#E11D48' or '#2563EB'
    fontFamily: string; // 'Inter' | 'Outfit' | 'Plus Jakarta Sans' | 'Space Grotesk' | 'Playfair Display'
    borderRadius: 'none' | 'sm' | 'md' | 'lg';
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    facebook: string;
    instagram: string;
  };
  loyaltySettings: {
    isEnabled: boolean;
    earnPointsPerHundredCurrency: number; // e.g. 5 points per ৳100
    pointsRedeemValueRate: number; // e.g. 1 point = ৳0.5
    minPointsToRedeem: number; // e.g. 50
    qualifyingOrderStatus: OrderStatus; // e.g. 'delivered' or 'confirmed'
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    keywords?: string;
    author?: string;
    twitterHandle?: string;
    structuredDataEnabled?: boolean;
  };
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  imageUrl: string;
  author: string;
  publishedAt: string;
  isPublished: boolean;
  category: string;
}

export interface StaticPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updatedAt: string;
}

export type SmtpEncryption = 'tls' | 'ssl' | 'none';

export interface SmtpSettings {
  host: string;
  port: number;
  encryption: SmtpEncryption;
  username: string;
  password: string;
  fromName: string;
  fromEmail: string;
  adminAlertEmail: string;
  isEnabled: boolean;
  notifications: {
    orderConfirmation: boolean;
    paymentVerified: boolean;
    orderDispatched: boolean;
    welcomeEmail: boolean;
    adminNewOrderAlert: boolean;
  };
}

export type EmailType =
  | 'order_confirmation'
  | 'payment_verified'
  | 'payment_rejected'
  | 'order_shipped'
  | 'welcome'
  | 'admin_alert'
  | 'test';

export interface EmailLog {
  id: string;
  to: string;
  toName: string;
  from: string;
  subject: string;
  htmlContent: string;
  type: EmailType;
  relatedOrderId?: string;
  status: 'sent' | 'failed';
  smtpHostUsed: string;
  sentAt: string;
}

export type EmailEditorMode = 'plain_english' | 'custom_html';

export interface EmailTemplateConfig {
  type: EmailType;
  name: string;
  editorMode: EmailEditorMode;
  subjectTemplate: string;
  plainEnglish: {
    heading: string;
    greeting: string;
    openingParagraph: string;
    bodyMessage: string;
    includeOrderDetailsBox: boolean;
    includeProductsTable: boolean;
    closingParagraph: string;
    accentColor: string;
  };
  customHtmlTemplate: string;
  updatedAt: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  createdAt: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
}

export interface ProductRatingSummary {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export type WebhookEventStatus =
  | 'matched_and_verified'
  | 'offline_draft_converted'
  | 'unmatched_queued'
  | 'duplicate_ignored';

export interface PaymentWebhookLog {
  id: string;
  gateway: PaymentMethodType;
  transactionId: string;
  senderPhone: string;
  amount: number;
  orderReference?: string;
  matchedOrderId?: string;
  matchedOrderNumber?: string;
  status: WebhookEventStatus;
  signatureVerified: boolean;
  receivedAt: string;
  processedNote: string;
  rawPayload: string;
}

export interface PaymentWebhookConfig {
  endpointUrl: string;
  secretKey: string;
  isEnabled: boolean;
  autoVerifyMatchedOrders: boolean;
  autoCreateOrderFromDraftOnWebhook: boolean;
}

export interface PendingCheckoutDraft {
  draftOrderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  deliveryAddress: {
    recipientName: string;
    phone: string;
    addressLine: string;
    district: string;
    areaName: string;
  };
  zoneId: string;
  paymentMethodId: string;
  couponCode?: string;
  loyaltyPointsToUse?: number;
  senderPhone?: string;
  transactionId?: string;
  customerNotes?: string;
  expectedGrandTotal: number;
  updatedAt: string;
}

export interface OfflineQueuedOrder {
  id: string;
  draftOrderNumber: string;
  deliveryAddress: {
    recipientName: string;
    phone: string;
    addressLine: string;
    district: string;
    areaName: string;
  };
  zoneId: string;
  paymentMethodId: string;
  couponCode?: string;
  loyaltyPointsToUse?: number;
  senderPhone?: string;
  transactionId?: string;
  customerNotes?: string;
  expectedGrandTotal: number;
  queuedAt: string;
}


