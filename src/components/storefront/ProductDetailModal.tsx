import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  ShieldAlert,
  Truck,
  RotateCcw,
  Sparkles,
  Ruler,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Star,
  ThumbsUp,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Lock,
  ArrowDown
} from 'lucide-react';
import { Product, TShirtSize, ProductVariant, ProductReview } from '../../types';
import { useStore } from '../../context/StoreContext';

interface ProductDetailModalProps {
  productId: string | null;
  onClose: () => void;
  onOpenCart: () => void;
  onOpenAuth?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  productId,
  onClose,
  onOpenCart,
  onOpenAuth,
}) => {
  const {
    products,
    siteSettings,
    addToCart,
    currentUser,
    orders,
    getProductReviews,
    getProductRatingSummary,
    addProductReview,
    voteReviewHelpful,
    deleteReview,
  } = useStore();

  const product = products.find(p => p.id === productId);

  // Colors available for this product
  const availableColors = product
    ? Array.from(new Map(product.variants.map(v => [v.colorName, { name: v.colorName, hex: v.colorHex }])).values())
    : [];

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<TShirtSize>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; error?: boolean } | null>(null);

  // Accordion open states
  const [specsOpen, setSpecsOpen] = useState(true);
  const [careOpen, setCareOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);

  // Reviews & Rating states
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ text: string; error?: boolean } | null>(null);
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [reviewSortBy, setReviewSortBy] = useState<'newest' | 'highest' | 'lowest' | 'helpful'>('newest');
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);

  const ratingSummary = product
    ? getProductRatingSummary(product.id)
    : { averageRating: 0, reviewCount: 0, ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } };

  const allProductReviews = product ? getProductReviews(product.id) : [];

  const filteredReviews = allProductReviews.filter(rev => {
    if (selectedRatingFilter === 'all') return true;
    return Math.round(rev.rating) === selectedRatingFilter;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (reviewSortBy === 'highest') return b.rating - a.rating;
    if (reviewSortBy === 'lowest') return a.rating - b.rating;
    if (reviewSortBy === 'helpful') return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const hasPurchased =
    currentUser && product
      ? orders.some(o => o.userId === currentUser.id && o.items.some(i => i.productId === product.id))
      : false;

  const ratingLabels: Record<number, string> = {
    1: '1 Star — Poor quality or fit',
    2: '2 Stars — Below expectations',
    3: '3 Stars — Average / Satisfactory',
    4: '4 Stars — Very good / High quality',
    5: '5 Stars — Exceptional! Highly recommended',
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!currentUser) {
      setReviewFeedback({ text: 'Authentication required. Please sign in to submit a review.', error: true });
      return;
    }
    if (newRating < 1 || newRating > 5) {
      setReviewFeedback({ text: 'Please choose a rating from 1 to 5 stars.', error: true });
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      setReviewFeedback({ text: 'Please write a review comment with at least 5 characters.', error: true });
      return;
    }

    setSubmittingReview(true);
    const res = addProductReview({
      productId: product.id,
      rating: newRating,
      title: reviewTitle.trim() || undefined,
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);

    if (res.success) {
      setReviewFeedback({ text: res.message });
      setReviewTitle('');
      setReviewComment('');
      setIsWritingReview(false);
      setTimeout(() => setReviewFeedback(null), 5000);
    } else {
      setReviewFeedback({ text: res.message, error: true });
    }
  };

  // Initialize selected color when product opens
  useEffect(() => {
    if (product && availableColors.length > 0) {
      setSelectedColor(availableColors[0].name);
      setActiveImageIndex(0);
      setQuantity(1);
      setFeedbackMessage(null);

      // Pick an initial in-stock size for this color if possible
      const initialVariant = product.variants.find(
        v => v.colorName.toLowerCase() === availableColors[0].name.toLowerCase() && v.stockQuantity > 0
      );
      if (initialVariant) {
        setSelectedSize(initialVariant.size);
      }
    }
  }, [productId]);

  if (!product) return null;

  // Filter gallery images for the selected color
  const colorImages = product.images.filter(
    img => img.colorName.toLowerCase() === selectedColor.toLowerCase()
  );
  // Fallback to all images if none found for specific color
  const galleryImages = colorImages.length > 0 ? colorImages : product.images;

  // Selected active image
  const currentImage = galleryImages[activeImageIndex] || galleryImages[0];

  // Find exact variant record matching (selectedColor, selectedSize)
  const selectedVariant: ProductVariant | undefined = product.variants.find(
    v =>
      v.colorName.toLowerCase() === selectedColor.toLowerCase() &&
      v.size === selectedSize &&
      v.isActive
  );

  // Calculate price of the active variant
  const currentPrice =
    selectedVariant && selectedVariant.priceOverride !== null
      ? selectedVariant.priceOverride
      : product.basePrice;

  // Available stock for currently selected variant
  const stock = selectedVariant ? selectedVariant.stockQuantity : 0;
  const isOutOfStock = stock <= 0 || !selectedVariant;
  const isLowStock = stock > 0 && stock <= 3;

  // All possible standard sizes
  const standardSizes: TShirtSize[] = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    setActiveImageIndex(0);
    setQuantity(1);
    setFeedbackMessage(null);

    // If current selected size is out of stock in this new color, check for an in-stock size
    const matchingVariant = product.variants.find(
      v => v.colorName.toLowerCase() === colorName.toLowerCase() && v.size === selectedSize
    );
    if (!matchingVariant || matchingVariant.stockQuantity <= 0) {
      const anyAvailable = product.variants.find(
        v => v.colorName.toLowerCase() === colorName.toLowerCase() && v.stockQuantity > 0
      );
      if (anyAvailable) {
        setSelectedSize(anyAvailable.size);
      }
    }
  };

  const handleAddToCart = () => {
    if (!selectedVariant) {
      setFeedbackMessage({ text: 'Please select an available size and color.', error: true });
      return;
    }

    const res = addToCart(selectedVariant.id, quantity);
    if (res.success) {
      setFeedbackMessage({ text: res.message });
      setTimeout(() => {
        onOpenCart();
      }, 500);
    } else {
      setFeedbackMessage({ text: res.message, error: true });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-xl shadow-2xl max-w-5xl 2xl:max-w-6xl w-full max-h-[94dvh] sm:max-h-[92dvh] overflow-y-auto border border-stone-200 flex flex-col"
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="sticky sm:absolute top-3 right-3 sm:top-4 sm:right-4 self-end mr-3 mt-3 sm:m-0 z-20 p-2 rounded-full bg-white/95 hover:bg-stone-100 text-stone-600 hover:text-stone-900 shadow-sm border border-stone-200 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </motion.button>

        {/* Top Product Hero: Image Gallery & Purchasing Details */}
        <div className="flex flex-col md:flex-row -mt-10 sm:mt-0">
          {/* Left Column: Variant-Aware Image Gallery */}
        <div className="md:w-1/2 p-4 sm:p-6 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col gap-4">
          {/* Main Selected Image */}
          <div className="relative aspect-4/5 w-full rounded-lg bg-stone-100 overflow-hidden border border-stone-200">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage?.imageUrl}
                src={currentImage?.imageUrl}
                alt={currentImage?.altText || product.name}
                initial={{ opacity: 0.5, scale: 1.03 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0.5 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full h-full object-cover object-center"
              />
            </AnimatePresence>

            {/* Corner status tag */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              <span className="bg-stone-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded tracking-wide shadow-xs backdrop-blur-xs">
                {selectedColor}
              </span>
              {isOutOfStock ? (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  Only {stock} Left
                </span>
              ) : null}
            </div>
          </div>

          {/* Thumbnails Row for Current Colorway */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {galleryImages.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-20 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-stone-900 ring-1 ring-stone-900 scale-95'
                      : 'border-transparent hover:border-stone-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Variant Selection & Commerce Details */}
        <div className="md:w-1/2 p-4 sm:p-6 lg:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* 1. Header & Quiet Meta */}
            <div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 font-medium mb-1.5">
                <span>{product.fabricWeight}</span>
                <span aria-hidden="true">·</span>
                <span>{product.fitType}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[11px] text-stone-400">
                  SKU: {selectedVariant?.sku || 'N/A'}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight leading-snug">
                {product.name}
              </h2>

              {/* Aggregate Review Score Row */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= Math.round(ratingSummary.averageRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-stone-900">
                  {ratingSummary.reviewCount > 0 ? ratingSummary.averageRating.toFixed(1) : 'New'}
                </span>
                <span className="text-stone-300">·</span>
                <button
                  type="button"
                  onClick={scrollToReviews}
                  className="text-xs text-stone-600 hover:text-rose-600 underline font-medium cursor-pointer flex items-center gap-1"
                >
                  <span>
                    {ratingSummary.reviewCount > 0
                      ? `${ratingSummary.reviewCount} customer ${ratingSummary.reviewCount === 1 ? 'review' : 'reviews'}`
                      : 'Be the first to review'}
                  </span>
                  <ArrowDown className="w-3 h-3 text-stone-400" />
                </button>
              </div>

              {/* Price display with potential variant override */}
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-stone-950">
                  {siteSettings.currencySymbol}
                  {currentPrice}
                </span>
                {selectedVariant?.priceOverride !== null && (
                  <span className="text-xs text-stone-500">
                    (Variant-specific price applied)
                  </span>
                )}
              </div>
            </div>

            {/* 2. Color Selection Swatches */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-900 uppercase tracking-wider">
                  Colorway:{' '}
                  <span className="font-normal text-stone-600 capitalize">{selectedColor}</span>
                </span>
                <span className="text-stone-400">{availableColors.length} configured</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {availableColors.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorChange(color.name)}
                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-semibold transition-all ${
                      selectedColor.toLowerCase() === color.name.toLowerCase()
                        ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Size Selection Grid */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 uppercase tracking-wider">Size:</span>
                  <span className="font-semibold text-rose-600">{selectedSize}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1 text-stone-500 hover:text-stone-900 text-xs font-medium underline underline-offset-2"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Size Guide (Measurements)
                </button>
              </div>

              {/* Size Buttons Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {standardSizes.map(size => {
                  const variantForSize = product.variants.find(
                    v =>
                      v.colorName.toLowerCase() === selectedColor.toLowerCase() &&
                      v.size === size &&
                      v.isActive
                  );
                  const exists = !!variantForSize;
                  const inStock = exists && variantForSize.stockQuantity > 0;
                  const isSelected = selectedSize === size;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={!exists || !inStock}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                        setFeedbackMessage(null);
                      }}
                      className={`h-11 rounded-md text-xs font-bold border transition-all flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-stone-950 bg-stone-950 text-white shadow-xs'
                          : inStock
                          ? 'border-stone-300 bg-white text-stone-800 hover:border-stone-900'
                          : 'border-stone-200 bg-stone-100 text-stone-300 cursor-not-allowed line-through'
                      }`}
                      title={
                        !exists
                          ? 'Size not available for this color'
                          : !inStock
                          ? 'Out of stock'
                          : `${variantForSize.stockQuantity} in stock`
                      }
                    >
                      <span>{size}</span>
                      {exists && inStock && (
                        <span className="text-[9px] font-normal opacity-80">
                          {variantForSize.stockQuantity}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Exact Stock Availability Notification */}
              <div className="text-xs pt-1 flex flex-wrap items-center justify-between gap-2">
                {isOutOfStock ? (
                  <span className="text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Currently sold out in {selectedColor} ({selectedSize})</span>
                  </span>
                ) : isLowStock ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <span>Low Stock: Only {stock} remaining in this size/color</span>
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>In Stock ({stock} units available)</span>
                  </span>
                )}
                <span className="text-[11px] text-stone-400">Validated on server</span>
              </div>
            </div>

            {/* 4. Quantity & Add to Cart Button */}
            <div className="pt-2 border-t border-stone-100 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center justify-between sm:justify-start border border-stone-300 rounded-md bg-stone-50 p-1">
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-200 rounded disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-stone-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= stock || isOutOfStock}
                    onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                    className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-200 rounded disabled:opacity-30 disabled:cursor-not-allowed font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Main Action Button */}
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-1 h-11 bg-stone-950 text-white font-bold text-sm rounded-md hover:bg-rose-600 transition-colors disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {isOutOfStock ? (
                    'Out of Stock'
                  ) : (
                    <>
                      <span>Add to Cart</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {siteSettings.currencySymbol}
                        {currentPrice * quantity}
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Feedback toast message */}
              {feedbackMessage && (
                <div
                  className={`text-xs p-2.5 rounded-md flex items-center gap-2 ${
                    feedbackMessage.error
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {feedbackMessage.error ? (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedbackMessage.text}</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Editorial Accordion Sections (Fabric, Care, Delivery) */}
          <div className="pt-4 border-t border-stone-200 space-y-2 text-xs">
            {/* Fabric & Architecture */}
            <div className="border border-stone-200 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setSpecsOpen(!specsOpen)}
                className="w-full p-3 bg-stone-50 font-bold text-stone-900 flex items-center justify-between text-left hover:bg-stone-100"
              >
                <span>Fabric & Garment Architecture</span>
                {specsOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
              </button>
              {specsOpen && (
                <div className="p-3 bg-white text-stone-600 space-y-2 leading-relaxed border-t border-stone-200">
                  <p>{product.description}</p>
                  <ul className="list-disc list-inside space-y-1 text-stone-700 font-medium pt-1">
                    <li>240 GSM organic combed ring-spun jersey</li>
                    <li>1.25" width high-density 1x1 ribbed collar</li>
                    <li>Pre-shrunk silicone garment wash</li>
                    <li>Reinforced shoulder-to-shoulder neck taping</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Care Instructions */}
            <div className="border border-stone-200 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setCareOpen(!careOpen)}
                className="w-full p-3 bg-stone-50 font-bold text-stone-900 flex items-center justify-between text-left hover:bg-stone-100"
              >
                <span>Washing & Longevity Care</span>
                {careOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
              </button>
              {careOpen && (
                <div className="p-3 bg-white text-stone-600 space-y-1.5 leading-relaxed border-t border-stone-200">
                  <p>{product.careInstructions}</p>
                  <p className="text-[11px] text-stone-500 italic">
                    Pro tip: Always air-dry flat to preserve the structured boxy geometry.
                  </p>
                </div>
              )}
            </div>

            {/* Delivery & Manual Payment Policy */}
            <div className="border border-stone-200 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShippingOpen(!shippingOpen)}
                className="w-full p-3 bg-stone-50 font-bold text-stone-900 flex items-center justify-between text-left hover:bg-stone-100"
              >
                <span>Delivery Zones & Mobile Payments</span>
                {shippingOpen ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
              </button>
              {shippingOpen && (
                <div className="p-3 bg-white text-stone-600 space-y-2 border-t border-stone-200">
                  <div className="space-y-1">
                    <p><strong>Dhaka City:</strong> 24–48 Hours (৳60)</p>
                    <p><strong>Dhaka Suburbs:</strong> 2–3 Days (৳100)</p>
                    <p><strong>Nationwide:</strong> 3–5 Days (৳130)</p>
                  </div>
                  <p className="text-stone-500 text-[11px]">
                    Supported payment methods: bKash, Nagad, Rocket, and Cash on Delivery. Manual verification with zero transaction surcharges.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
        {/* End of Top Product Hero */}

        {/* 6. Customer Reviews & Ratings Section */}
        <div ref={reviewsRef} id="customer-reviews" className="p-6 sm:p-8 bg-stone-50/70 border-t border-stone-200 space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                <h3 className="text-lg font-black text-stone-900 tracking-tight">
                  Customer Reviews & Ratings
                </h3>
                <span className="bg-stone-200 text-stone-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {ratingSummary.reviewCount}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Real feedback from verified buyers on fabric GSM, collar resilience, and streetwear fit.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!currentUser && onOpenAuth) {
                    onOpenAuth();
                  } else {
                    setIsWritingReview(!isWritingReview);
                  }
                }}
                className="px-4 py-2 bg-stone-950 hover:bg-rose-600 text-white rounded-md text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{isWritingReview ? 'Close Review Form' : 'Write a Review'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Banner */}
          {reviewFeedback && (
            <div
              className={`p-3 rounded-md text-xs flex items-center gap-2 ${
                reviewFeedback.error
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}
            >
              {reviewFeedback.error ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : (
                <Check className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{reviewFeedback.text}</span>
            </div>
          )}

          {/* Review Submission Form / Authentication Gate */}
          <AnimatePresence>
            {isWritingReview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                {!currentUser ? (
                  <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-950">
                          Sign In Required to Leave a Review
                        </h4>
                        <p className="text-xs text-amber-800 leading-relaxed">
                          To maintain 100% authentic community reviews, you must be signed in with your ThreadCraft account.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenAuth) onOpenAuth();
                        }}
                        className="px-4 py-2 bg-amber-900 text-white hover:bg-amber-800 rounded-md text-xs font-bold transition-colors cursor-pointer"
                      >
                        Sign In / Register
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsWritingReview(false)}
                        className="text-xs text-amber-900/70 hover:text-amber-900 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={handleReviewSubmit}
                    className="p-5 sm:p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs uppercase">
                          {currentUser.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                          <p className="text-[11px] text-stone-400">{currentUser.email}</p>
                        </div>
                      </div>

                      {hasPurchased ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified Buyer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
                          Community Member
                        </span>
                      )}
                    </div>

                    {/* Star Rating Picker */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                        Your Rating: <span className="text-rose-600">*</span>
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => {
                            const isFilled = star <= (hoverRating || newRating);
                            return (
                              <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setNewRating(star)}
                                className="p-1 hover:scale-115 transition-transform cursor-pointer focus:outline-hidden"
                                title={`${star} Stars`}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    isFilled
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-stone-300 hover:text-stone-400'
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-semibold text-stone-700">
                          {ratingLabels[hoverRating || newRating]}
                        </span>
                      </div>
                    </div>

                    {/* Review Title Input */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                        Review Title (Optional)
                      </label>
                      <input
                        type="text"
                        value={reviewTitle}
                        onChange={e => setReviewTitle(e.target.value)}
                        placeholder="e.g. Best 240 GSM collar in Bangladesh, zero baconing!"
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:border-stone-900 focus:outline-hidden"
                        maxLength={100}
                      />
                    </div>

                    {/* Review Comment Textarea */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
                          Review Comments: <span className="text-rose-600">*</span>
                        </label>
                        <span className="text-[10px] text-stone-400">
                          {reviewComment.length} / 600 characters
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={e => setReviewComment(e.target.value)}
                        placeholder="Share details regarding the fabric thickness, collar tightness, washing experience, sizing, and comfort..."
                        required
                        maxLength={600}
                        className="w-full px-3 py-2 text-xs border border-stone-300 rounded-md focus:border-stone-900 focus:outline-hidden"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsWritingReview(false)}
                        className="px-3.5 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="px-4 py-2 bg-stone-950 hover:bg-rose-600 text-white text-xs font-bold rounded-md transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {submittingReview ? 'Publishing...' : 'Submit Verified Review'}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Aggregate Rating Summary Card */}
          <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Score Box */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-3 border-b md:border-b-0 md:border-r border-stone-100">
              <span className="text-4xl sm:text-5xl font-black text-stone-950 tracking-tight">
                {ratingSummary.reviewCount > 0 ? ratingSummary.averageRating.toFixed(1) : '—'}
              </span>
              <div className="flex items-center gap-1 text-amber-400 my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= Math.round(ratingSummary.averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-stone-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-stone-800">
                {ratingSummary.reviewCount > 0
                  ? `Based on ${ratingSummary.reviewCount} customer ${ratingSummary.reviewCount === 1 ? 'review' : 'reviews'}`
                  : 'No reviews yet'}
              </p>
              {ratingSummary.reviewCount > 0 && (
                <p className="text-[11px] text-emerald-700 font-medium mt-1">
                  {Math.round(
                    (((ratingSummary.ratingDistribution[5] || 0) + (ratingSummary.ratingDistribution[4] || 0)) /
                      ratingSummary.reviewCount) *
                      100
                  )}
                  % positive customer rating
                </p>
              )}
            </div>

            {/* Right Distribution Breakdown Bars */}
            <div className="md:col-span-8 space-y-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = ratingSummary.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
                const percentage =
                  ratingSummary.reviewCount > 0
                    ? Math.round((count / ratingSummary.reviewCount) * 100)
                    : 0;
                const isSelected = selectedRatingFilter === stars;

                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => {
                      setSelectedRatingFilter(selectedRatingFilter === stars ? 'all' : stars);
                    }}
                    className={`w-full flex items-center gap-3 text-xs p-1 rounded-md transition-colors group cursor-pointer ${
                      isSelected ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-1 w-12 font-bold text-stone-700 shrink-0">
                      <span>{stars}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </div>

                    {/* Progress Bar Container */}
                    <div className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden border border-stone-200/60">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          stars >= 4
                            ? 'bg-amber-400'
                            : stars === 3
                            ? 'bg-amber-300'
                            : 'bg-stone-400'
                        }`}
                      />
                    </div>

                    <div className="w-16 text-right shrink-0 text-stone-400 text-[11px] font-medium">
                      <span>{percentage}% ({count})</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtering and Sorting Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-stone-400 font-medium mr-1">Filter:</span>
              <button
                type="button"
                onClick={() => setSelectedRatingFilter('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                  selectedRatingFilter === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                All ({ratingSummary.reviewCount})
              </button>
              {[5, 4, 3, 2, 1].map(star => {
                const count = ratingSummary.ratingDistribution[star as 1 | 2 | 3 | 4 | 5] || 0;
                if (count === 0 && selectedRatingFilter !== star) return null;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRatingFilter(selectedRatingFilter === star ? 'all' : star)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                      selectedRatingFilter === star
                        ? 'bg-stone-900 text-white'
                        : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                    }`}
                  >
                    <span>{star}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] text-stone-400 font-medium">Sort by:</span>
              <select
                value={reviewSortBy}
                onChange={e => setReviewSortBy(e.target.value as any)}
                className="bg-white border border-stone-200 text-stone-800 text-xs rounded-md px-2.5 py-1.5 focus:border-stone-900 focus:outline-hidden font-medium"
              >
                <option value="newest">Most Recent</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
                <option value="helpful">Most Helpful</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3 pt-1">
            {sortedReviews.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-xl p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-stone-900">
                    {selectedRatingFilter !== 'all'
                      ? `No ${selectedRatingFilter}-star reviews found.`
                      : 'No customer reviews yet.'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    {selectedRatingFilter !== 'all'
                      ? 'Try selecting a different star rating filter above.'
                      : `Be the first customer to share your thoughts on the ${product.name}!`}
                  </p>
                </div>
                {selectedRatingFilter !== 'all' ? (
                  <button
                    type="button"
                    onClick={() => setSelectedRatingFilter('all')}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Show All Reviews
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser && onOpenAuth) {
                        onOpenAuth();
                      } else {
                        setIsWritingReview(true);
                      }
                    }}
                    className="px-4 py-2 bg-stone-950 hover:bg-rose-600 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
                  >
                    Write the First Review
                  </button>
                )}
              </div>
            ) : (
              sortedReviews.map(rev => {
                const dateStr = new Date(rev.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });
                const isAuthor = currentUser?.id === rev.userId;
                const isAdmin = currentUser?.role === 'admin';

                return (
                  <motion.div
                    key={rev.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-5 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3"
                  >
                    {/* Header: User, Stars, Date, Verified Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-stone-800 text-white font-bold text-xs flex items-center justify-center uppercase shrink-0">
                          {rev.userName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-stone-900">
                              {rev.userName}
                            </span>
                            {rev.verifiedPurchase && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-full">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Rating Stars */}
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= rev.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-stone-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-stone-400">{dateStr}</span>
                      </div>
                    </div>

                    {/* Review Body */}
                    <div className="space-y-1">
                      {rev.title && (
                        <h5 className="text-xs font-bold text-stone-900">
                          {rev.title}
                        </h5>
                      )}
                      <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>

                    {/* Footer Actions: Helpful button & Author/Admin Delete */}
                    <div className="pt-2 flex items-center justify-between text-xs text-stone-500 border-t border-stone-50">
                      <button
                        type="button"
                        onClick={() => voteReviewHelpful(rev.id)}
                        className="flex items-center gap-1.5 text-[11px] text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        title="Mark this review as helpful"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 text-stone-400" />
                        <span>Helpful ({rev.helpfulCount || 0})</span>
                      </button>

                      {(isAdmin || isAuthor) && (
                        confirmDeleteReviewId === rev.id ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-stone-500">Delete?</span>
                            <button
                              type="button"
                              onClick={() => {
                                deleteReview(rev.id);
                                setConfirmDeleteReviewId(null);
                              }}
                              className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700 cursor-pointer"
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReviewId(null)}
                              className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-medium hover:bg-stone-300 cursor-pointer"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteReviewId(rev.id)}
                            className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-800 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Delete review"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </motion.div>

      {/* Size Chart Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 space-y-4 border border-stone-200 shadow-2xl">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-200">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                ThreadCraft Heavyweight Size Chart (Inches)
              </h3>
              <button onClick={() => setSizeGuideOpen(false)} className="text-stone-500 hover:text-stone-900 p-1 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-500 leading-relaxed">
              Measurements taken with garment lying flat. Our cut features a boxy streetwear drape with dropped shoulders.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[340px]">
                <thead>
                  <tr className="bg-stone-100 text-stone-800 font-bold">
                    <th className="p-2 border border-stone-200">Size</th>
                    <th className="p-2 border border-stone-200">Chest Width</th>
                    <th className="p-2 border border-stone-200">Body Length</th>
                    <th className="p-2 border border-stone-200">Sleeve Length</th>
                  </tr>
                </thead>
                <tbody className="text-stone-700">
                  <tr>
                    <td className="p-2 font-bold border border-stone-200">XS</td>
                    <td className="p-2 border border-stone-200">20.5"</td>
                    <td className="p-2 border border-stone-200">27.0"</td>
                    <td className="p-2 border border-stone-200">8.5"</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="p-2 font-bold border border-stone-200">S</td>
                    <td className="p-2 border border-stone-200">21.5"</td>
                    <td className="p-2 border border-stone-200">28.0"</td>
                    <td className="p-2 border border-stone-200">9.0"</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border border-stone-200">M</td>
                    <td className="p-2 border border-stone-200">22.5"</td>
                    <td className="p-2 border border-stone-200">29.0"</td>
                    <td className="p-2 border border-stone-200">9.5"</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="p-2 font-bold border border-stone-200">L</td>
                    <td className="p-2 border border-stone-200">23.5"</td>
                    <td className="p-2 border border-stone-200">30.0"</td>
                    <td className="p-2 border border-stone-200">10.0"</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border border-stone-200">XL</td>
                    <td className="p-2 border border-stone-200">24.5"</td>
                    <td className="p-2 border border-stone-200">31.0"</td>
                    <td className="p-2 border border-stone-200">10.5"</td>
                  </tr>
                  <tr className="bg-stone-50">
                    <td className="p-2 font-bold border border-stone-200">2XL</td>
                    <td className="p-2 border border-stone-200">25.5"</td>
                    <td className="p-2 border border-stone-200">32.0"</td>
                    <td className="p-2 border border-stone-200">11.0"</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSizeGuideOpen(false)}
                className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-semibold"
              >
                Close Size Chart
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
