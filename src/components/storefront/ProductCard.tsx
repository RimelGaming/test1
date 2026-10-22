import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onSelect: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { siteSettings, getProductRatingSummary } = useStore();
  const ratingSummary = getProductRatingSummary(product.id);

  // Extract unique colors available for this product
  const availableColors = Array.from(
    new Map(product.variants.map(v => [v.colorName, { name: v.colorName, hex: v.colorHex }])).values()
  );

  // Active color for preview image
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0]?.name || '');

  // Find image corresponding to the selected color
  const activeImage =
    product.images.find(img => img.colorName.toLowerCase() === selectedColor.toLowerCase())?.imageUrl ||
    product.images[0]?.imageUrl ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';

  // Calculate stock stats
  const totalStock = product.variants.reduce((acc, v) => acc + (v.isActive ? v.stockQuantity : 0), 0);
  const isSoldOut = totalStock === 0;
  const isLowStock = !isSoldOut && totalStock <= 6;

  // Price range calculation
  const prices = product.variants
    .filter(v => v.isActive)
    .map(v => (v.priceOverride !== null ? v.priceOverride : product.basePrice));
  const minPrice = prices.length > 0 ? Math.min(...prices) : product.basePrice;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : product.basePrice;

  // Extract unique sizes
  const sizes = Array.from(new Set(product.variants.filter(v => v.isActive).map(v => v.size)));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -5, transition: { duration: 0.25, ease: 'easeOut' } }}
      onClick={() => onSelect(product.id)}
      className="group relative flex flex-col bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl transition-shadow duration-300 cursor-pointer"
    >
      {/* 1. Image Canvas with hover swap and crossfade */}
      <div className="relative aspect-4/5 w-full bg-stone-100 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeImage}
            src={activeImage}
            alt={product.name}
            initial={{ opacity: 0.8, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.8 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </AnimatePresence>

        {/* Stock Status Label */}
        {isSoldOut ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 bg-stone-900/90 text-white text-[10px] font-bold px-2.5 py-1 rounded tracking-wider uppercase backdrop-blur-xs"
          >
            Sold Out
          </motion.div>
        ) : isLowStock ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 bg-amber-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded tracking-wider uppercase backdrop-blur-xs"
          >
            Only {totalStock} Left
          </motion.div>
        ) : product.isFeatured ? (
          <div className="absolute top-3 left-3 bg-stone-900 text-white text-[10px] font-bold px-2.5 py-1 rounded tracking-wider uppercase">
            Featured
          </div>
        ) : null}

        {/* Quick Sizes Preview (visible on hover on desktop, subtly visible at bottom on mobile/tablet) */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 backdrop-blur-md py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-lg shadow-md opacity-95 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300 flex items-center justify-between text-xs text-stone-700">
          <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium">Sizes:</span>
          <div className="flex items-center gap-1.5 font-bold text-stone-900 text-[11px] sm:text-xs">
            {sizes.map(s => (
              <span key={s} className="hover:text-rose-600 transition-colors">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Product Meta & Details */}
      <div className="p-3.5 sm:p-5 flex flex-col flex-1 justify-between space-y-3">
        <div>
          {/* Metadata: Fabric weight, fit and Star Rating */}
          <div className="flex items-center justify-between gap-2 text-xs text-stone-500 font-medium mb-1.5">
            <div className="flex items-center gap-1.5 truncate">
              <span>{product.fabricWeight.split(' ')[0]} {product.fabricWeight.split(' ')[1]}</span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{product.fitType}</span>
            </div>

            {/* Aggregate Review Score */}
            {ratingSummary.reviewCount > 0 ? (
              <div
                className="flex items-center gap-1 text-[11px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70 font-semibold text-amber-900 shrink-0"
                title={`${ratingSummary.averageRating} out of 5 stars based on ${ratingSummary.reviewCount} customer reviews`}
              >
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{ratingSummary.averageRating.toFixed(1)}</span>
                <span className="text-amber-700/70 font-normal">({ratingSummary.reviewCount})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-stone-400 font-normal shrink-0">
                <Star className="w-3 h-3 text-stone-300 shrink-0" />
                <span>New</span>
              </div>
            )}
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-bold text-stone-900 group-hover:text-rose-600 transition-colors line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
            {product.shortDescription}
          </p>
        </div>

        {/* Bottom row: Color swatches & Price */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
          {/* Color swatch dots with click/hover handling and tap feedback */}
          <div
            className="flex items-center flex-wrap gap-2"
            onClick={e => e.stopPropagation()}
          >
            {availableColors.map(color => (
              <motion.button
                key={color.name}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setSelectedColor(color.name)}
                title={color.name}
                aria-label={`Select color ${color.name}`}
                className={`w-5 h-5 sm:w-4 sm:h-4 rounded-full border transition-all ${
                  selectedColor.toLowerCase() === color.name.toLowerCase()
                    ? 'ring-2 ring-stone-900 ring-offset-1 scale-110'
                    : 'border-stone-300 opacity-80 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.hex }}
              />
            ))}
            {availableColors.length > 1 && (
              <span className="text-[10px] text-stone-400 font-medium ml-0.5">
                {availableColors.length} colors
              </span>
            )}
          </div>

          {/* Price */}
          <div className="text-right shrink-0">
            <span className="text-sm font-black text-stone-950 tabular-nums">
              {siteSettings.currencySymbol}
              {minPrice === maxPrice ? minPrice : `${minPrice}–${maxPrice}`}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
