import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Package, Truck, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';

interface OrderConfirmationModalProps {
  order: Order;
  onClose: () => void;
  onViewOrder: (orderId: string) => void;
  onTrackLiveOrder?: (orderNumber: string) => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({
  order,
  onClose,
  onViewOrder,
  onTrackLiveOrder,
}) => {
  const { siteSettings } = useStore();

  useEffect(() => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#e11d48', '#0f172a', '#10b981', '#f59e0b'],
      });
    } catch (e) {
      // safe fallback if canvas is not ready
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[94dvh] overflow-y-auto border border-stone-200"
      >
        {/* Header Ribbon */}
        <div className="bg-stone-900 text-white p-5 sm:p-8 text-center space-y-2.5 sm:space-y-3">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.15, stiffness: 350, damping: 20 }}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg"
          >
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Order Confirmed!</h2>
          <p className="text-stone-300 text-xs sm:text-sm max-w-md mx-auto">
            Thank you for ordering with {siteSettings.siteName}. Your order snapshot is permanently saved.
          </p>
          <div className="pt-1 sm:pt-2">
            <span className="font-mono text-xs font-bold bg-stone-800 text-stone-100 px-3.5 py-1.5 rounded border border-stone-700 shadow-inner">
              Order #{order.orderNumber}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-5 sm:space-y-6 text-xs text-stone-700">
          {/* Status banner */}
          <div className="p-3.5 sm:p-4 rounded-lg bg-stone-50 border border-stone-200 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                Payment Status:{' '}
                {order.paymentStatus === 'awaiting_verification'
                  ? 'Awaiting Manual Verification'
                  : order.paymentStatus === 'verified'
                  ? 'Payment Verified'
                  : 'Unpaid (COD)'}
              </h4>
              <p className="text-stone-600 mt-1 leading-relaxed">
                {order.paymentMethodSnapshot.type === 'cod'
                  ? 'You selected Cash on Delivery. Please keep exact change ready upon parcel arrival.'
                  : `Your ${order.paymentMethodSnapshot.name} transaction claim (TrxID: ${order.paymentClaim?.transactionId || 'Submitted'}) has been queued for admin verification.`}
              </p>
            </div>
          </div>

          {/* Delivery & Address Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-stone-200">
            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                Delivery Destination
              </p>
              <p className="font-bold text-stone-900">{order.deliveryAddressSnapshot.recipientName}</p>
              <p className="text-stone-600">{order.deliveryAddressSnapshot.addressLine}</p>
              <p className="text-stone-600">
                {order.deliveryAddressSnapshot.areaName}, {order.deliveryAddressSnapshot.district}
              </p>
              <p className="text-stone-500 mt-1">Phone: {order.deliveryAddressSnapshot.phone}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
                Zone & Delivery Fee Snapshot
              </p>
              <p className="font-bold text-stone-900">{order.deliveryZoneSnapshot.name}</p>
              <p className="text-stone-600">
                Delivery Fee: {siteSettings.currencySymbol}{order.deliveryFee}
              </p>
              <p className="text-stone-500 mt-2">
                Payment Method: <strong>{order.paymentMethodSnapshot.name}</strong>
              </p>
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
              Immutable Items Snapshot
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-stone-50 border border-stone-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.productName}
                      className="w-10 h-12 object-cover rounded bg-stone-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-stone-900 truncate">{item.productName}</p>
                      <p className="text-[11px] text-stone-500">
                        {item.colorName} · {item.size} · Qty {item.quantity} · SKU: {item.sku}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    {siteSettings.currencySymbol}{item.lineTotal}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="pt-3 border-t border-stone-200 space-y-1 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal:</span>
              <span>{siteSettings.currencySymbol}{order.subtotal}</span>
            </div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Coupon Discount ({order.couponCodeApplied}):</span>
                <span>-{siteSettings.currencySymbol}{order.couponDiscount}</span>
              </div>
            )}
            {order.loyaltyDiscount > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Loyalty Points Discount ({order.loyaltyPointsUsed} pts):</span>
                <span>-{siteSettings.currencySymbol}{order.loyaltyDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Delivery Fee ({order.deliveryZoneSnapshot.name}):</span>
              <span>{siteSettings.currencySymbol}{order.deliveryFee}</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-950">
              <span>Grand Total Paid / Due:</span>
              <span>{siteSettings.currencySymbol}{order.grandTotal}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-stone-200">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-semibold text-xs transition-colors"
            >
              Continue Shopping
            </button>
            {onTrackLiveOrder && (
              <button
                onClick={() => {
                  onClose();
                  onTrackLiveOrder(order.orderNumber);
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Truck className="w-4 h-4" />
                <span>Track Live Shipment</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onViewOrder(order.id);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-stone-950 hover:bg-stone-800 text-white rounded-md font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Account Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
