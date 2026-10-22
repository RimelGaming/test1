import type {
  Category,
  Product,
  DeliveryZone,
  DeliveryArea,
  PaymentMethod,
  Coupon,
  User,
  Order,
  LoyaltyTransaction,
  SiteSettings,
  NewsPost,
  StaticPage,
  AdminAuditLog,
  ProductReview
} from '../types';

export const initialCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Heavyweight Blank Tees (240 GSM)',
    slug: 'heavyweight-blanks',
    description: 'Ultra-dense 100% combed cotton with structured boxy drape and double-needle ribbed collar.',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    displayOrder: 1,
    isActive: true,
  },
  {
    id: 'cat-2',
    name: 'Oversized Streetwear',
    slug: 'oversized-streetwear',
    description: 'Relaxed drop-shoulder silhouettes engineered for street fashion and all-day ease.',
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    displayOrder: 2,
    isActive: true,
  },
  {
    id: 'cat-3',
    name: 'Acid Wash & Vintage',
    slug: 'acid-wash-vintage',
    description: 'Hand-treated vintage garment dye with subtle distressed patina and buttery soft hand-feel.',
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
    displayOrder: 3,
    isActive: true,
  },
  {
    id: 'cat-4',
    name: 'Minimalist Pocket & Graphic',
    slug: 'minimalist-pocket-graphic',
    description: 'Clean typographic prints and reinforced bar-tacked chest pockets for low-key styling.',
    imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    displayOrder: 4,
    isActive: true,
  },
];

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Raw Studio Heavyweight 240 GSM Boxy Tee',
    slug: 'raw-studio-heavyweight-240-gsm-boxy-tee',
    description: `Constructed from proprietary 240 GSM organic combed ring-spun cotton. Features a 1.25" thick 1x1 ribbed collar that will never bacon or fold, taped neck and shoulders, and a generous boxy fit that retains its clean geometry wash after wash.\n\nPre-shrunk and silicone washed for zero hand-feel shrinkage. Perfect weight for layering or wearing solo with cargo pants or denim.`,
    shortDescription: 'Signature 240 GSM combed cotton with high-density ribbed neck and relaxed boxy drape.',
    categoryId: 'cat-1',
    basePrice: 850,
    isFeatured: true,
    status: 'published',
    fabricWeight: '240 GSM 100% Combed Cotton',
    fitType: 'Boxy Heavyweight',
    careInstructions: 'Machine wash cold inside out with like colors. Do not tumble dry. Warm iron avoiding collar ribbing.',
    seoTitle: 'Raw Studio 240 GSM Heavyweight T-Shirt | ThreadCraft V2',
    seoDescription: 'Premium 240 GSM organic combed cotton t-shirt with durable ribbed collar and boxy streetwear fit.',
    createdAt: '2026-09-01T10:00:00Z',
    images: [
      // Washed Charcoal Black
      {
        id: 'img-1-blk-1',
        colorName: 'Washed Charcoal',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85',
        altText: 'Washed Charcoal 240 GSM Boxy Tee Front',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        id: 'img-1-blk-2',
        colorName: 'Washed Charcoal',
        imageUrl: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=1000&q=85',
        altText: 'Washed Charcoal 240 GSM Boxy Tee Angle',
        isPrimary: false,
        displayOrder: 2,
      },
      // Vintage Bone Cream
      {
        id: 'img-1-crm-1',
        colorName: 'Vintage Bone Cream',
        imageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=85',
        altText: 'Vintage Bone Cream Boxy Tee Front',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        id: 'img-1-crm-2',
        colorName: 'Vintage Bone Cream',
        imageUrl: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&w=1000&q=85',
        altText: 'Vintage Bone Cream Fabric Texture',
        isPrimary: false,
        displayOrder: 2,
      },
      // Olive Moss
      {
        id: 'img-1-olv-1',
        colorName: 'Olive Moss',
        imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?auto=format&fit=crop&w=1000&q=85',
        altText: 'Olive Moss Heavyweight Tee Front',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
    variants: [
      // Washed Charcoal
      { id: 'v-1-blk-s', productId: 'prod-1', colorName: 'Washed Charcoal', colorHex: '#262626', size: 'S', sku: 'TC-HVY-BLK-S', priceOverride: null, stockQuantity: 12, isActive: true },
      { id: 'v-1-blk-m', productId: 'prod-1', colorName: 'Washed Charcoal', colorHex: '#262626', size: 'M', sku: 'TC-HVY-BLK-M', priceOverride: null, stockQuantity: 18, isActive: true },
      { id: 'v-1-blk-l', productId: 'prod-1', colorName: 'Washed Charcoal', colorHex: '#262626', size: 'L', sku: 'TC-HVY-BLK-L', priceOverride: null, stockQuantity: 15, isActive: true },
      { id: 'v-1-blk-xl', productId: 'prod-1', colorName: 'Washed Charcoal', colorHex: '#262626', size: 'XL', sku: 'TC-HVY-BLK-XL', priceOverride: null, stockQuantity: 8, isActive: true },
      { id: 'v-1-blk-2xl', productId: 'prod-1', colorName: 'Washed Charcoal', colorHex: '#262626', size: '2XL', sku: 'TC-HVY-BLK-2XL', priceOverride: 900, stockQuantity: 3, isActive: true },

      // Vintage Bone Cream
      { id: 'v-1-crm-s', productId: 'prod-1', colorName: 'Vintage Bone Cream', colorHex: '#F3EFE0', size: 'S', sku: 'TC-HVY-CRM-S', priceOverride: null, stockQuantity: 9, isActive: true },
      { id: 'v-1-crm-m', productId: 'prod-1', colorName: 'Vintage Bone Cream', colorHex: '#F3EFE0', size: 'M', sku: 'TC-HVY-CRM-M', priceOverride: null, stockQuantity: 14, isActive: true },
      { id: 'v-1-crm-l', productId: 'prod-1', colorName: 'Vintage Bone Cream', colorHex: '#F3EFE0', size: 'L', sku: 'TC-HVY-CRM-L', priceOverride: null, stockQuantity: 2, isActive: true }, // Low stock!
      { id: 'v-1-crm-xl', productId: 'prod-1', colorName: 'Vintage Bone Cream', colorHex: '#F3EFE0', size: 'XL', sku: 'TC-HVY-CRM-XL', priceOverride: null, stockQuantity: 0, isActive: true }, // Out of stock to test validation!
      { id: 'v-1-crm-2xl', productId: 'prod-1', colorName: 'Vintage Bone Cream', colorHex: '#F3EFE0', size: '2XL', sku: 'TC-HVY-CRM-2XL', priceOverride: 900, stockQuantity: 4, isActive: true },

      // Olive Moss
      { id: 'v-1-olv-s', productId: 'prod-1', colorName: 'Olive Moss', colorHex: '#4A5340', size: 'S', sku: 'TC-HVY-OLV-S', priceOverride: null, stockQuantity: 5, isActive: true },
      { id: 'v-1-olv-m', productId: 'prod-1', colorName: 'Olive Moss', colorHex: '#4A5340', size: 'M', sku: 'TC-HVY-OLV-M', priceOverride: null, stockQuantity: 11, isActive: true },
      { id: 'v-1-olv-l', productId: 'prod-1', colorName: 'Olive Moss', colorHex: '#4A5340', size: 'L', sku: 'TC-HVY-OLV-L', priceOverride: null, stockQuantity: 7, isActive: true },
      { id: 'v-1-olv-xl', productId: 'prod-1', colorName: 'Olive Moss', colorHex: '#4A5340', size: 'XL', sku: 'TC-HVY-OLV-XL', priceOverride: null, stockQuantity: 6, isActive: true },
      { id: 'v-1-olv-2xl', productId: 'prod-1', colorName: 'Olive Moss', colorHex: '#4A5340', size: '2XL', sku: 'TC-HVY-OLV-2XL', priceOverride: 900, stockQuantity: 2, isActive: true },
    ],
  },
  {
    id: 'prod-2',
    name: 'Metropolis Drop-Shoulder Oversized Tee',
    slug: 'metropolis-drop-shoulder-oversized-tee',
    description: `Engineered for modern street silhouettes. Features dropped shoulder seams, extended sleeve length, and side-slit vents for seamless drape over pants. Crafted in 220 GSM breathable combed cotton. Subtle tonal high-density print on the lower hemline.`,
    shortDescription: 'Modern oversized silhouette with dropped shoulders, elbow sleeves, and breathable 220 GSM knit.',
    categoryId: 'cat-2',
    basePrice: 950,
    isFeatured: true,
    status: 'published',
    fabricWeight: '220 GSM 100% Combed Cotton',
    fitType: 'Oversized',
    careInstructions: 'Gentle cycle 30°C. Do not bleach. Air dry flat to preserve shape.',
    seoTitle: 'Metropolis Oversized T-Shirt | ThreadCraft V2 Streetwear',
    seoDescription: 'Drop shoulder streetwear t-shirt crafted for relaxed aesthetics and all-day comfort.',
    createdAt: '2026-09-05T12:00:00Z',
    images: [
      // Pitch Black
      {
        id: 'img-2-blk-1',
        colorName: 'Pitch Black',
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=85',
        altText: 'Metropolis Oversized Tee in Pitch Black',
        isPrimary: true,
        displayOrder: 1,
      },
      // Earth Clay
      {
        id: 'img-2-cly-1',
        colorName: 'Earth Clay',
        imageUrl: 'https://images.unsplash.com/photo-1618354691792-d1d42acfd860?auto=format&fit=crop&w=1000&q=85',
        altText: 'Metropolis Oversized Tee in Earth Clay',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
    variants: [
      { id: 'v-2-blk-s', productId: 'prod-2', colorName: 'Pitch Black', colorHex: '#111111', size: 'S', sku: 'TC-MET-BLK-S', priceOverride: null, stockQuantity: 10, isActive: true },
      { id: 'v-2-blk-m', productId: 'prod-2', colorName: 'Pitch Black', colorHex: '#111111', size: 'M', sku: 'TC-MET-BLK-M', priceOverride: null, stockQuantity: 16, isActive: true },
      { id: 'v-2-blk-l', productId: 'prod-2', colorName: 'Pitch Black', colorHex: '#111111', size: 'L', sku: 'TC-MET-BLK-L', priceOverride: null, stockQuantity: 20, isActive: true },
      { id: 'v-2-blk-xl', productId: 'prod-2', colorName: 'Pitch Black', colorHex: '#111111', size: 'XL', sku: 'TC-MET-BLK-XL', priceOverride: null, stockQuantity: 5, isActive: true },

      { id: 'v-2-cly-s', productId: 'prod-2', colorName: 'Earth Clay', colorHex: '#945341', size: 'S', sku: 'TC-MET-CLY-S', priceOverride: null, stockQuantity: 6, isActive: true },
      { id: 'v-2-cly-m', productId: 'prod-2', colorName: 'Earth Clay', colorHex: '#945341', size: 'M', sku: 'TC-MET-CLY-M', priceOverride: null, stockQuantity: 12, isActive: true },
      { id: 'v-2-cly-l', productId: 'prod-2', colorName: 'Earth Clay', colorHex: '#945341', size: 'L', sku: 'TC-MET-CLY-L', priceOverride: null, stockQuantity: 8, isActive: true },
      { id: 'v-2-cly-xl', productId: 'prod-2', colorName: 'Earth Clay', colorHex: '#945341', size: 'XL', sku: 'TC-MET-CLY-XL', priceOverride: null, stockQuantity: 1, isActive: true },
    ],
  },
  {
    id: 'prod-3',
    name: 'Tokyo Neon Kanji Back-Graphic Tee',
    slug: 'tokyo-neon-kanji-back-graphic-tee',
    description: `Featuring an original hand-drawn cyberpunk Tokyo nightscape screen-printed on the reverse with crack-resistant plastisol ink. Clean minimalist chest typography on the front. Cut in our relaxed streetwear block.`,
    shortDescription: 'Striking Japanese graphic back print with water-base chest logo and relaxed drape.',
    categoryId: 'cat-4',
    basePrice: 990,
    isFeatured: true,
    status: 'published',
    fabricWeight: '230 GSM 100% Combed Cotton',
    fitType: 'Regular Fit',
    careInstructions: 'Iron on reverse side only. Do not iron over graphic print. Wash cold.',
    seoTitle: 'Tokyo Kanji Back-Graphic Tee | ThreadCraft Graphic Drop',
    seoDescription: 'Premium streetwear graphic t-shirt featuring high-density Tokyo print.',
    createdAt: '2026-09-10T14:30:00Z',
    images: [
      {
        id: 'img-3-blk-1',
        colorName: 'Onyx Black',
        imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=85',
        altText: 'Tokyo Kanji Tee in Onyx Black',
        isPrimary: true,
        displayOrder: 1,
      },
      {
        id: 'img-3-wht-1',
        colorName: 'Chalk White',
        imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=85',
        altText: 'Tokyo Kanji Tee in Chalk White',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
    variants: [
      { id: 'v-3-blk-s', productId: 'prod-3', colorName: 'Onyx Black', colorHex: '#18181B', size: 'S', sku: 'TC-TYO-BLK-S', priceOverride: null, stockQuantity: 8, isActive: true },
      { id: 'v-3-blk-m', productId: 'prod-3', colorName: 'Onyx Black', colorHex: '#18181B', size: 'M', sku: 'TC-TYO-BLK-M', priceOverride: null, stockQuantity: 15, isActive: true },
      { id: 'v-3-blk-l', productId: 'prod-3', colorName: 'Onyx Black', colorHex: '#18181B', size: 'L', sku: 'TC-TYO-BLK-L', priceOverride: null, stockQuantity: 12, isActive: true },
      { id: 'v-3-blk-xl', productId: 'prod-3', colorName: 'Onyx Black', colorHex: '#18181B', size: 'XL', sku: 'TC-TYO-BLK-XL', priceOverride: null, stockQuantity: 4, isActive: true },

      { id: 'v-3-wht-s', productId: 'prod-3', colorName: 'Chalk White', colorHex: '#FAFAFA', size: 'S', sku: 'TC-TYO-WHT-S', priceOverride: null, stockQuantity: 6, isActive: true },
      { id: 'v-3-wht-m', productId: 'prod-3', colorName: 'Chalk White', colorHex: '#FAFAFA', size: 'M', sku: 'TC-TYO-WHT-M', priceOverride: null, stockQuantity: 10, isActive: true },
      { id: 'v-3-wht-l', productId: 'prod-3', colorName: 'Chalk White', colorHex: '#FAFAFA', size: 'L', sku: 'TC-TYO-WHT-L', priceOverride: null, stockQuantity: 9, isActive: true },
      { id: 'v-3-wht-xl', productId: 'prod-3', colorName: 'Chalk White', colorHex: '#FAFAFA', size: 'XL', sku: 'TC-TYO-WHT-XL', priceOverride: null, stockQuantity: 3, isActive: true },
    ],
  },
  {
    id: 'prod-4',
    name: 'Sun-Drenched Mineral Acid Wash Tee',
    slug: 'sun-drenched-mineral-acid-wash-tee',
    description: `Each piece undergoes an individual artisanal stone and mineral acid wash, resulting in unique marble-like variations where no two garments are identical. Ultra-soft worn-in collar and blind stitch hems.`,
    shortDescription: 'Individually washed mineral dyed tee with authentic vintage character and ultra-soft handle.',
    categoryId: 'cat-3',
    basePrice: 1050,
    isFeatured: false,
    status: 'published',
    fabricWeight: '210 GSM Combed Ring-Spun Cotton',
    fitType: 'Relaxed',
    careInstructions: 'Wash separately before first wear to prevent indigo transfer. Cold gentle wash.',
    seoTitle: 'Mineral Acid Wash T-Shirt | Vintage Patina | ThreadCraft',
    seoDescription: 'Unique mineral wash t-shirt with custom vintage distress.',
    createdAt: '2026-09-15T09:15:00Z',
    images: [
      {
        id: 'img-4-ash-1',
        colorName: 'Mineral Ash Slate',
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=85',
        altText: 'Mineral Ash Slate Acid Wash Tee',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
    variants: [
      { id: 'v-4-ash-s', productId: 'prod-4', colorName: 'Mineral Ash Slate', colorHex: '#475569', size: 'S', sku: 'TC-ACD-ASH-S', priceOverride: null, stockQuantity: 7, isActive: true },
      { id: 'v-4-ash-m', productId: 'prod-4', colorName: 'Mineral Ash Slate', colorHex: '#475569', size: 'M', sku: 'TC-ACD-ASH-M', priceOverride: null, stockQuantity: 14, isActive: true },
      { id: 'v-4-ash-l', productId: 'prod-4', colorName: 'Mineral Ash Slate', colorHex: '#475569', size: 'L', sku: 'TC-ACD-ASH-L', priceOverride: null, stockQuantity: 10, isActive: true },
      { id: 'v-4-ash-xl', productId: 'prod-4', colorName: 'Mineral Ash Slate', colorHex: '#475569', size: 'XL', sku: 'TC-ACD-ASH-XL', priceOverride: null, stockQuantity: 5, isActive: true },
    ],
  },
  {
    id: 'prod-5',
    name: 'Heritage Reinforced Pocket Heavy Tee',
    slug: 'heritage-reinforced-pocket-heavy-tee',
    description: `A utilitarian staple. Features a reinforced dual-needle bar-tacked chest pocket with a hidden pen compartment. Cut from 240 GSM heavy combed jersey with pre-washed shrinkage protection.`,
    shortDescription: 'Classic workwear pocket tee with bar-tack reinforcement and 240 GSM heavy jersey.',
    categoryId: 'cat-4',
    basePrice: 890,
    isFeatured: false,
    status: 'published',
    fabricWeight: '240 GSM 100% Cotton',
    fitType: 'Regular Fit',
    careInstructions: 'Machine wash warm, tumble dry low.',
    seoTitle: 'Heavy Pocket T-Shirt | ThreadCraft Workwear',
    seoDescription: 'Heavyweight pocket tee for durable daily utility.',
    createdAt: '2026-09-18T16:00:00Z',
    images: [
      {
        id: 'img-5-nv-1',
        colorName: 'Deep Indigo Navy',
        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=85',
        altText: 'Heritage Pocket Tee in Deep Navy',
        isPrimary: true,
        displayOrder: 1,
      },
    ],
    variants: [
      { id: 'v-5-nv-m', productId: 'prod-5', colorName: 'Deep Indigo Navy', colorHex: '#1E293B', size: 'M', sku: 'TC-PKT-NVY-M', priceOverride: null, stockQuantity: 11, isActive: true },
      { id: 'v-5-nv-l', productId: 'prod-5', colorName: 'Deep Indigo Navy', colorHex: '#1E293B', size: 'L', sku: 'TC-PKT-NVY-L', priceOverride: null, stockQuantity: 8, isActive: true },
      { id: 'v-5-nv-xl', productId: 'prod-5', colorName: 'Deep Indigo Navy', colorHex: '#1E293B', size: 'XL', sku: 'TC-PKT-NVY-XL', priceOverride: null, stockQuantity: 3, isActive: true },
    ],
  },
];

export const initialDeliveryZones: DeliveryZone[] = [
  {
    id: 'zone-1',
    name: 'Inside Dhaka Metropolitan',
    fee: 60,
    estimatedDeliveryTime: '24–48 Hours',
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'zone-2',
    name: 'Dhaka Suburbs (Savar / Gazipur / Keraniganj)',
    fee: 100,
    estimatedDeliveryTime: '2–3 Business Days',
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'zone-3',
    name: 'Outside Dhaka (All Districts Nationwide)',
    fee: 130,
    estimatedDeliveryTime: '3–5 Business Days',
    isActive: true,
    displayOrder: 3,
  },
];

export const initialDeliveryAreas: DeliveryArea[] = [
  // Zone 1: Inside Dhaka
  { id: 'area-1', zoneId: 'zone-1', districtName: 'Dhaka', areaName: 'Dhanmondi / Mohammadpur' },
  { id: 'area-2', zoneId: 'zone-1', districtName: 'Dhaka', areaName: 'Gulshan / Banani / Baridhara' },
  { id: 'area-3', zoneId: 'zone-1', districtName: 'Dhaka', areaName: 'Mirpur (All Sections)' },
  { id: 'area-4', zoneId: 'zone-1', districtName: 'Dhaka', areaName: 'Uttara (Sectors 1-18)' },
  { id: 'area-5', zoneId: 'zone-1', districtName: 'Dhaka', areaName: 'Old Dhaka / Motijheel / Ramna' },
  { id: 'area-6', zoneId: 'zone-1', districtName: 'Dhaka', areaName: 'Bashundhara R/A / Badda' },
  // Zone 2: Suburbs
  { id: 'area-7', zoneId: 'zone-2', districtName: 'Dhaka Suburbs', areaName: 'Savar / EPZ / Ashulia' },
  { id: 'area-8', zoneId: 'zone-2', districtName: 'Gazipur', areaName: 'Gazipur Sadar / Joydebpur / Tongi' },
  { id: 'area-9', zoneId: 'zone-2', districtName: 'Narayanganj', areaName: 'Narayanganj Sadar / Fatullah' },
  { id: 'area-10', zoneId: 'zone-2', districtName: 'Keraniganj', areaName: 'Keraniganj / Zinzira' },
  // Zone 3: Outside Dhaka
  { id: 'area-11', zoneId: 'zone-3', districtName: 'Chittagong', areaName: 'Chittagong Metro & Districts' },
  { id: 'area-12', zoneId: 'zone-3', districtName: 'Sylhet', areaName: 'Sylhet Sadar & Districts' },
  { id: 'area-13', zoneId: 'zone-3', districtName: 'Rajshahi', areaName: 'Rajshahi Sadar & Districts' },
  { id: 'area-14', zoneId: 'zone-3', districtName: 'Khulna', areaName: 'Khulna Sadar & Districts' },
  { id: 'area-15', zoneId: 'zone-3', districtName: 'Barisal', areaName: 'Barisal Sadar & Districts' },
  { id: 'area-16', zoneId: 'zone-3', districtName: 'Rangpur', areaName: 'Rangpur Sadar & Districts' },
  { id: 'area-17', zoneId: 'zone-3', districtName: 'Mymensingh', areaName: 'Mymensingh Sadar & Districts' },
  { id: 'area-18', zoneId: 'zone-3', districtName: 'Other Districts', areaName: 'All Other Bangladesh Thanas' },
];

export const initialPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm-cod',
    name: 'Cash on Delivery (COD)',
    type: 'cod',
    recipientNumber: 'N/A',
    accountType: 'personal',
    instructions: 'Pay in cash directly to the delivery rider after inspecting your package. Please keep exact change ready.',
    isEnabled: true,
    displayOrder: 1,
  },
  {
    id: 'pm-bkash',
    name: 'bKash (Merchant / Payment)',
    type: 'bkash',
    recipientNumber: '01712-345678',
    accountType: 'merchant',
    instructions: `1. Open your bKash app and tap "Make Payment" (Merchant: 01712-345678).\n2. Enter the exact order total amount.\n3. Enter Reference as your Order Number.\n4. Complete PIN and submit.\n5. Copy your 10-character Transaction ID (TrxID) and enter it below.`,
    isEnabled: true,
    displayOrder: 2,
  },
  {
    id: 'pm-nagad',
    name: 'Nagad (Send Money / Personal)',
    type: 'nagad',
    recipientNumber: '01819-876543',
    accountType: 'personal',
    instructions: `1. Open your Nagad app and select "Send Money".\n2. Recipient Number: 01819-876543.\n3. Enter exact Order Amount.\n4. Enter your Order Number in the Reference field.\n5. Confirm with your PIN and paste the 8-character TrxID below.`,
    isEnabled: true,
    displayOrder: 3,
  },
  {
    id: 'pm-rocket',
    name: 'Rocket (DBBL Mobile Banking)',
    type: 'rocket',
    recipientNumber: '01912-334455-8',
    accountType: 'personal',
    instructions: `1. Dial *322# or open Rocket App.\n2. Select Send Money to 01912-334455-8.\n3. Enter Order Amount and PIN.\n4. Enter the generated Txn ID below for verification.`,
    isEnabled: true,
    displayOrder: 4,
  },
];

export const initialCoupons: Coupon[] = [
  {
    id: 'cp-1',
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 1000,
    maxDiscountAmount: 300,
    usageLimitGlobal: 500,
    usageLimitPerUser: 1,
    usedCount: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
  },
  {
    id: 'cp-2',
    code: 'HEAVY50',
    discountType: 'fixed',
    discountValue: 50,
    minOrderAmount: 800,
    usageLimitGlobal: 200,
    usageLimitPerUser: 2,
    usedCount: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
  },
  {
    id: 'cp-3',
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 100,
    minOrderAmount: 2000,
    usageLimitGlobal: 100,
    usageLimitPerUser: 1,
    usedCount: 0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isActive: true,
  },
];

export const initialUsers: User[] = [];

export const initialOrders: Order[] = [];

export const initialLoyaltyTransactions: LoyaltyTransaction[] = [];

export const initialAuditLogs: AdminAuditLog[] = [];

export const initialSiteSettings: SiteSettings = {
  siteName: 'ThreadCraft Studio',
  siteDescription: 'Heavyweight & streetwear apparel engineered with 240 GSM organic cotton and boxy drop silhouettes.',
  logoText: 'THREADCRAFT',
  currencySymbol: '৳',
  announcementBar: {
    text: '⚡ Free Express Delivery on all orders over ৳2,000 | Use Code WELCOME10 for 10% Off',
    enabled: true,
    linkText: 'Shop New Arrivals',
    linkUrl: '/shop',
  },
  hero: {
    badge: 'AUTUMN / WINTER 2026 COLLECTION',
    headline: 'HEAVYWEIGHT DRAPE. UNCOMPROMISING FORM.',
    subheadline: 'Crafted from 240 GSM organic combed ring-spun cotton. Engineered with high-density ribbed collars that never deform and clean boxy architecture.',
    ctaText: 'Explore Drop 01',
    ctaLink: '/shop',
    secondaryCtaText: 'The 240 GSM Story',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=90',
  },
  theme: {
    primaryColor: '#0F172A', // Slate 900
    accentColor: '#E11D48',  // Rose 600
    fontFamily: 'Inter',
    borderRadius: 'sm',
  },
  contact: {
    phone: '+880 1700-112233',
    email: 'support@threadcraft.com',
    address: 'Road 9A, Dhanmondi R/A, Dhaka 1209, Bangladesh',
    facebook: 'https://facebook.com/threadcraft.bd',
    instagram: 'https://instagram.com/threadcraft.studio',
  },
  loyaltySettings: {
    isEnabled: true,
    earnPointsPerHundredCurrency: 5, // 5 points per ৳100 spent
    pointsRedeemValueRate: 0.5, // 1 point = ৳0.5 discount (100 points = ৳50)
    minPointsToRedeem: 50,
    qualifyingOrderStatus: 'delivered',
  },
  seo: {
    metaTitle: 'ThreadCraft V2 — Heavyweight Streetwear & 240 GSM T-Shirts',
    metaDescription: 'Shop engineered 240 GSM organic combed cotton t-shirts with anti-bacon ribbed collars and boxy streetwear drape. Fast express delivery across Bangladesh.',
    ogImage: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&h=630&q=85',
    keywords: '240 GSM t-shirt, heavyweight streetwear, boxy oversized tee, organic combed cotton, streetwear Dhaka, premium menswear Bangladesh, ThreadCraft',
    author: 'ThreadCraft Studio',
    twitterHandle: '@threadcraft',
    structuredDataEnabled: true,
  },
};

export const initialNewsPosts: NewsPost[] = [
  {
    id: 'post-1',
    title: 'Why 240 GSM Combed Cotton is the Golden Standard for Streetwear',
    slug: 'why-240-gsm-combed-cotton-golden-standard',
    excerpt: 'Lighter tees lose their drape after three washes. Here is the engineering science behind high-density combed ring-spun jersey.',
    content: `When designing the ThreadCraft V2 collection, we tested fabrics from 160 GSM up to 300 GSM. Standard fast-fashion t-shirts use 140–160 GSM carded open-end yarns that twist and develop the dreaded "bacon neck" fold after minimal laundry cycles.\n\nOur 240 GSM fabric utilizes 26/1s combed long-staple ring-spun cotton. The combing process eliminates short fibers and impurities, yielding an exceptionally smooth surface with tight stitch density.\n\nCombined with a 1.25" width 1x1 heavy ribbed collar with 5% elastane memory fiber, the tee holds its sharp shoulder line whether you wear it fresh out of the wardrobe or after months of daily rotation.`,
    imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80',
    author: 'Tanvir Ahmed',
    publishedAt: '2026-09-08',
    isPublished: true,
    category: 'Fabric Engineering',
  },
  {
    id: 'post-2',
    title: 'The Oversized Fit Guide: Drop Shoulders Done Right',
    slug: 'oversized-fit-guide-drop-shoulders',
    excerpt: 'An oversized tee shouldn’t feel like you just bought two sizes too big. Discover how proportional grading preserves armhole balance.',
    content: `True oversized patterning requires deliberate grading. Simply buying an XXL when you are a Medium results in excessively long hemlines that bunch awkwardly around your hips.\n\nOur pattern masters reduce total garment length while extending chest width and dropping the shoulder seam 2.5 inches. The sleeve circumference is widened and lengthened to hit right above the elbow, creating the authentic Tokyo and Seoul street silhouette without drowning the wearer.`,
    imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80',
    author: 'Design Studio',
    publishedAt: '2026-09-18',
    isPublished: true,
    category: 'Styling & Fit',
  },
  {
    id: 'post-3',
    title: 'Care Instructions: How to Keep Black Tees Pitch Black for Years',
    slug: 'care-instructions-pitch-black-tees',
    excerpt: 'Simple laundry protocols to prevent sulfur fading, color bleeding, and rib distortion.',
    content: `All ThreadCraft garments undergo reactive dye processing with silicone washing. To preserve deepest black tones:\n\n1. Always turn inside-out before loading into the drum.\n2. Wash in cold water (30°C max).\n3. Avoid harsh bleach or optical brighteners.\n4. Dry flat away from direct tropical sunlight.\n5. Never press an iron directly over prints or heavy collar ribbing.`,
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
    author: 'Quality Team',
    publishedAt: '2026-10-02',
    isPublished: true,
    category: 'Garment Care',
  },
];

export const initialStaticPages: StaticPage[] = [
  {
    id: 'page-about',
    slug: 'about-us',
    title: 'About ThreadCraft Studio',
    content: `Founded in 2026 in Dhaka, ThreadCraft Studio was born out of frustration with flimsy, mass-produced fast-fashion t-shirts that deform after two washes.\n\nWe design, weave, dye, and cut every garment locally in Bangladesh, upholding rigorous fair-trade labor standards and using only 100% sustainably farmed combed organic cotton.\n\nOur mission is minimalist: build the world's most durable, comfortable, and beautifully proportioned heavyweight t-shirts with an obsessive focus on fabric weight, collar resilience, and timeless street drape.`,
    updatedAt: '2026-10-01',
  },
  {
    id: 'page-shipping',
    slug: 'shipping-delivery',
    title: 'Shipping & Delivery Policy',
    content: `### Delivery Zones & Timelines\n- **Inside Dhaka Metropolitan**: 24 to 48 hours via our dedicated dispatch team (৳60).\n- **Dhaka Suburbs (Savar, Gazipur, Tongi, Keraniganj)**: 2 to 3 business days (৳100).\n- **Outside Dhaka (All 64 Districts Nationwide)**: 3 to 5 business days via Steadfast or RedX Courier (৳130).\n\n### Order Verification & Dispatch\nOrders placed with manual mobile payment (bKash/Nagad/Rocket) are dispatched within 2 hours of payment claim verification by our accounts team.\nCash on Delivery (COD) orders are confirmed via phone or SMS before dispatch.`,
    updatedAt: '2026-10-01',
  },
  {
    id: 'page-returns',
    slug: 'returns-refunds',
    title: 'Returns & Exchange Policy',
    content: `We want you to love your fit. If your garment does not fit as expected or arrived with any defect, we offer a hassle-free 7-day exchange window.\n\n### Eligibility Criteria\n1. Garments must be unwashed, unworn, and retain original ThreadCraft hangtags.\n2. Exchanges for size or color are completely free (customer covers the standard courier fee for zone delivery).\n3. In case of manufacturing defect, ThreadCraft covers 100% of return shipping and provides an instant replacement or refund via original payment channel.`,
    updatedAt: '2026-10-01',
  },
  {
    id: 'page-faq',
    slug: 'faq',
    title: 'Frequently Asked Questions',
    content: `### What makes 240 GSM different from regular t-shirts?\nGSM stands for Grams per Square Meter. Standard t-shirts in the market are 140–160 GSM. Our 240 GSM tees are nearly 60% denser, offering a structured silhouette that doesn't cling to the body and maintains clean boxy lines.\n\n### How does manual mobile payment work?\nWe do not use third-party payment gateways. You simply transfer the order amount via your bKash or Nagad app to our displayed merchant or personal number, copy the Transaction ID (TrxID), and submit it at checkout. Our team verifies the transaction against our account statement and instantly marks your order as verified.\n\n### Can I pay Cash on Delivery?\nYes! Cash on Delivery is available across all 64 districts in Bangladesh.\n\n### How do loyalty points work?\nYou earn 5 reward points for every ৳100 spent on delivered orders. Every 100 points can be redeemed for a ৳50 instant discount on your next checkout!`,
    updatedAt: '2026-10-01',
  },
];

export const initialReviews: ProductReview[] = [];
