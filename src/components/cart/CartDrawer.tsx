import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trash2, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
  onOpenAuth: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedToCheckout,
  onOpenAuth,
}) => {
  const {
    cart,
    products,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    siteSettings,
    currentUser,
  } = useStore();

  // Resolve items with live variant and product data
  const resolvedItems = cart.map(item => {
    let matchedProduct = null;
    let matchedVariant = null;

    for (const p of products) {
      const v = p.variants.find(x => x.id === item.variantId);
      if (v) {
        matchedProduct = p;
        matchedVariant = v;
        break;
      }
    }

    if (!matchedProduct || !matchedVariant) return null;

    const unitPrice =
      matchedVariant.priceOverride !== null
        ? matchedVariant.priceOverride
        : matchedProduct.basePrice;

    const colorImg = matchedProduct.images.find(
      img => img.colorName.toLowerCase() === matchedVariant!.colorName.toLowerCase()
    );
    const imageUrl = colorImg ? colorImg.imageUrl : matchedProduct.images[0]?.imageUrl || '';

    return {
      cartItem: item,
      product: matchedProduct,
      variant: matchedVariant,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      imageUrl,
    };
  }).filter(Boolean);

  const subtotal = resolvedItems.reduce((acc, item) => acc + (item?.lineTotal || 0), 0);

  // Free shipping threshold: ৳2,000
  const freeShippingThreshold = 2000;
  const freeShippingDiff = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleCheckoutClick = () => {
    if (!currentUser) {
      onOpenAuth();
    } else {
      onProceedToCheckout();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-hidden bg-stone-950/65 backdrop-blur-xs flex justify-end"
        >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-md bg-white h-[100dvh] shadow-2xl flex flex-col justify-between border-l border-stone-200"
      >
        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-stone-900" />
            <h2 className="font-extrabold text-base text-stone-900">Your Cart</h2>
            <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-stone-400 hover:text-rose-600 transition-colors mr-2 font-medium"
              >
                Clear
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-4 sm:px-5 py-2.5 sm:py-3 bg-stone-50 border-b border-stone-200 text-xs shrink-0">
          <div className="flex justify-between items-center gap-2 font-medium mb-1.5">
            {freeShippingDiff > 0 ? (
              <span className="text-stone-700">
                Add <strong className="text-stone-900">{siteSettings.currencySymbol}{freeShippingDiff}</strong> more for free delivery!
              </span>
            ) : (
              <motion.span
                initial={{ scale: 0.95 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-emerald-700 font-bold flex items-center gap-1"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>You unlocked Free Delivery! (Code: FREESHIP)</span>
              </motion.span>
            )}
            <span className="text-[11px] text-stone-400 font-bold shrink-0">{freeShippingPercent}%</span>
          </div>
          <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${freeShippingPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full ${
                freeShippingPercent === 100 ? 'bg-emerald-500' : 'bg-stone-900'
              }`}
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
          {resolvedItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-base text-stone-900">Your bag is empty</h3>
              <p className="text-xs text-stone-500 max-w-xs">
                Explore our signature 240 GSM organic combed cotton heavyweight blanks and oversized streetwear tees.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-stone-900 text-white rounded-md text-xs font-semibold hover:bg-stone-800"
              >
                Browse Shop
              </button>
            </div>
          ) : (
            resolvedItems.map(item => {
              if (!item) return null;
              const { cartItem, product, variant, unitPrice, lineTotal, imageUrl } = item;

              return (
                <div
                  key={variant.id}
                  className="flex gap-3 sm:gap-3.5 p-3 rounded-lg border border-stone-200 bg-white relative group"
                >
                  {/* Thumbnail */}
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="w-16 h-20 sm:w-20 sm:h-24 object-cover rounded bg-stone-100 shrink-0"
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-stone-900 leading-snug truncate">
                          {product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(variant.id)}
                          className="text-stone-400 hover:text-rose-600 p-1 shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Variant metadata */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-stone-500 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 shrink-0"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                          {variant.colorName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-bold text-stone-800">{variant.size}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[10px] text-stone-400 break-all">{variant.sku}</span>
                      </div>
                    </div>

                    {/* Stepper & Price Row */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-stone-200 rounded bg-stone-50">
                        <button
                          onClick={() => updateCartQuantity(variant.id, cartItem.quantity - 1)}
                          className="w-7 h-7 sm:w-8 sm:h-7 flex items-center justify-center text-xs text-stone-700 hover:bg-stone-200 font-bold"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-xs font-bold text-stone-900 tabular-nums">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQuantity(variant.id, cartItem.quantity + 1)}
                          disabled={cartItem.quantity >= variant.stockQuantity}
                          className="w-7 h-7 sm:w-8 sm:h-7 flex items-center justify-center text-xs text-stone-700 hover:bg-stone-200 font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            cartItem.quantity >= variant.stockQuantity
                              ? `Maximum available stock (${variant.stockQuantity}) reached`
                              : ''
                          }
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-stone-900 tabular-nums">
                          {siteSettings.currencySymbol}{lineTotal}
                        </span>
                        {cartItem.quantity > 1 && (
                          <p className="text-[10px] text-stone-400 tabular-nums">
                            {siteSettings.currencySymbol}{unitPrice} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout Bar */}
        {resolvedItems.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 space-y-3">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-semibold text-stone-700">Subtotal</span>
              <span className="font-black text-lg text-stone-900">
                {siteSettings.currencySymbol}{subtotal}
              </span>
            </div>

            <p className="text-[11px] text-stone-500">
              Delivery zones and manual payment claims (bKash/Nagad/Rocket/COD) calculated at checkout.
            </p>

            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 bg-stone-950 hover:bg-rose-600 text-white font-bold text-sm rounded-md transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <span>{currentUser ? 'Proceed to Checkout' : 'Sign In & Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {!currentUser && (
              <p className="text-[11px] text-center text-amber-700 font-medium">
                * Customer authentication required before order placement as per security rules.
              </p>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
  );
};
