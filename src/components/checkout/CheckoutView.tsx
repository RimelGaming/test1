import React, { useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  Truck,
  Copy,
  Check,
  AlertCircle,
  Tag,
  Sparkles,
  ArrowLeft,
  Lock,
  Loader2,
  Wifi,
  WifiOff,
  Webhook,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, PaymentMethodType } from '../../types';

interface CheckoutViewProps {
  onBack: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({ onBack, onOrderPlaced }) => {
  const {
    currentUser,
    cart,
    products,
    deliveryZones,
    deliveryAreas,
    paymentMethods,
    siteSettings,
    validateCoupon,
    placeOrder,
    pendingCheckoutDraft,
    savePendingCheckoutDraft,
    offlineOrderQueue,
    queueOfflineOrder,
    syncOfflineOrders,
    receivePaymentWebhook,
    webhookConfig,
  } = useStore();

  // Stable pre-allocated Order Reference for Webhook matching even if customer disconnects
  const [draftOrderNumber] = useState<string>(
    () => pendingCheckoutDraft?.draftOrderNumber || `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Network & Offline Simulation State
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [simulateCustomerOffline, setSimulateCustomerOffline] = useState<boolean>(false);
  const isCustomerOffline = !isBrowserOnline || simulateCustomerOffline;
  const [webhookStatusBanner, setWebhookStatusBanner] = useState<{
    type: 'success' | 'info' | 'warning';
    title: string;
    message: string;
    verifiedOrder?: Order;
  } | null>(null);

  // 1. Address State
  const defaultAddr = currentUser?.addresses.find(a => a.isDefault) || currentUser?.addresses[0];
  const [selectedSavedAddrId, setSelectedSavedAddrId] = useState<string>(defaultAddr?.id || 'new');

  const [recipientName, setRecipientName] = useState(
    pendingCheckoutDraft?.deliveryAddress.recipientName || defaultAddr?.recipientName || currentUser?.name || ''
  );
  const [phone, setPhone] = useState(
    pendingCheckoutDraft?.deliveryAddress.phone || defaultAddr?.phone || currentUser?.phone || ''
  );
  const [addressLine, setAddressLine] = useState(
    pendingCheckoutDraft?.deliveryAddress.addressLine || defaultAddr?.addressLine || ''
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string>(
    defaultAddr?.areaId || deliveryAreas[0]?.id || ''
  );

  // 2. Zone resolution based on areaId
  const selectedArea = deliveryAreas.find(a => a.id === selectedAreaId) || deliveryAreas[0];
  const matchedZone = deliveryZones.find(z => z.id === selectedArea?.zoneId) || deliveryZones[0];

  // 3. Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // 4. Loyalty Points State
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // 5. Payment State
  const enabledPaymentMethods = paymentMethods.filter(p => p.isEnabled);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>(
    pendingCheckoutDraft?.paymentMethodId || enabledPaymentMethods[0]?.id || 'pm-bkash'
  );
  const selectedPaymentMethod = paymentMethods.find(p => p.id === selectedPaymentMethodId);

  // Mobile payment fields
  const [senderPhone, setSenderPhone] = useState(
    pendingCheckoutDraft?.senderPhone || currentUser?.phone || ''
  );
  const [transactionId, setTransactionId] = useState(pendingCheckoutDraft?.transactionId || '');
  const [customerNotes, setCustomerNotes] = useState(pendingCheckoutDraft?.customerNotes || '');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Error & Submission
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute live cart subtotal
  const resolvedItems = cart.map(item => {
    let pMatch = null;
    let vMatch = null;
    for (const p of products) {
      const v = p.variants.find(x => x.id === item.variantId);
      if (v) {
        pMatch = p;
        vMatch = v;
        break;
      }
    }
    if (!pMatch || !vMatch) return null;
    const unitPrice = vMatch.priceOverride !== null ? vMatch.priceOverride : pMatch.basePrice;
    return {
      product: pMatch,
      variant: vMatch,
      unitPrice,
      quantity: item.quantity,
      lineTotal: unitPrice * item.quantity,
    };
  }).filter(Boolean);

  const subtotal = resolvedItems.reduce((acc, i) => acc + (i?.lineTotal || 0), 0);
  const deliveryFee = matchedZone ? matchedZone.fee : 60;

  // Compute coupon discount
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;

  // Compute loyalty discount
  const maxEligiblePoints = currentUser ? currentUser.loyaltyPoints : 0;
  const loyaltyRate = siteSettings.loyaltySettings.pointsRedeemValueRate; // e.g. 0.5 BDT per point
  const loyaltyDiscount = useLoyaltyPoints ? pointsToRedeem * loyaltyRate : 0;

  const grandTotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount + deliveryFee);

  // Listen to browser online/offline status & auto-sync queued orders on reconnect
  React.useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Automatically sync any queued offline orders as soon as internet reconnects
  React.useEffect(() => {
    if (!isCustomerOffline && offlineOrderQueue.length > 0) {
      const res = syncOfflineOrders();
      if (res.syncedCount > 0 && res.orders[0]) {
        try {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#10b981', '#0f172a', '#e11d48']
          });
        } catch (e) {}
        onOrderPlaced(res.orders[0]);
      }
    }
  }, [isCustomerOffline, offlineOrderQueue.length]);

  // Auto-save Checkout Draft so if customer's internet turns off during mobile payment, the server/webhook can still process the order!
  React.useEffect(() => {
    if (!currentUser || cart.length === 0 || !selectedArea || !matchedZone) return;
    savePendingCheckoutDraft({
      draftOrderNumber,
      userId: currentUser.id,
      customerName: recipientName.trim() || currentUser.name,
      customerEmail: currentUser.email,
      deliveryAddress: {
        recipientName: recipientName.trim() || currentUser.name,
        phone: phone.trim() || currentUser.phone,
        addressLine: addressLine.trim() || 'Pending street address (Draft)',
        district: selectedArea.districtName,
        areaName: selectedArea.areaName,
      },
      zoneId: matchedZone.id,
      paymentMethodId: selectedPaymentMethodId,
      couponCode: appliedCoupon?.code,
      loyaltyPointsToUse: useLoyaltyPoints ? pointsToRedeem : 0,
      senderPhone: senderPhone.trim() || phone.trim() || currentUser.phone,
      transactionId: transactionId.trim().toUpperCase(),
      customerNotes: customerNotes.trim(),
      expectedGrandTotal: grandTotal,
      updatedAt: new Date().toISOString(),
    });
  }, [
    draftOrderNumber,
    currentUser,
    cart.length,
    recipientName,
    phone,
    addressLine,
    selectedArea,
    matchedZone,
    selectedPaymentMethodId,
    appliedCoupon,
    useLoyaltyPoints,
    pointsToRedeem,
    senderPhone,
    transactionId,
    customerNotes,
    grandTotal,
  ]);

  // Handle saved address switch
  const handleSavedAddressChange = (addrId: string) => {
    setSelectedSavedAddrId(addrId);
    if (addrId === 'new') {
      setRecipientName(currentUser?.name || '');
      setPhone(currentUser?.phone || '');
      setAddressLine('');
    } else {
      const addr = currentUser?.addresses.find(a => a.id === addrId);
      if (addr) {
        setRecipientName(addr.recipientName);
        setPhone(addr.phone);
        setAddressLine(addr.addressLine);
        if (addr.areaId) setSelectedAreaId(addr.areaId);
      }
    }
  };

  // Handle coupon apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError(null);
    if (!couponCodeInput.trim()) return;

    const res = validateCoupon(couponCodeInput, subtotal);
    if (res.valid) {
      setAppliedCoupon({ code: couponCodeInput.toUpperCase(), discount: res.discount });
      setCouponError(null);
    } else {
      setCouponError(res.message);
      setAppliedCoupon(null);
    }
  };

  // Copy number helper
  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyOrderRef = () => {
    navigator.clipboard.writeText(draftOrderNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Simulate an asynchronous Gateway Payment Webhook (IPN) arriving even when customer's internet is turned OFF!
  const handleSimulateGatewayWebhook = () => {
    setSubmissionError(null);
    const gatewayType: PaymentMethodType =
      selectedPaymentMethod && selectedPaymentMethod.type !== 'cod'
        ? selectedPaymentMethod.type
        : 'bkash';
    const generatedTrx =
      transactionId.trim().toUpperCase() ||
      `${gatewayType.slice(0, 2).toUpperCase()}${Math.floor(10000000 + Math.random() * 90000000)}`;
    const senderMsisdn = senderPhone.trim() || phone.trim() || currentUser?.phone || '01712-345678';

    // Ensure draft has valid address defaults if user hasn't typed street address yet
    if (!addressLine.trim()) {
      setAddressLine('House 14, Road 5, Block C');
    }

    const webhookResult = receivePaymentWebhook({
      gateway: gatewayType,
      transactionId: generatedTrx,
      senderPhone: senderMsisdn,
      amount: grandTotal,
      orderReference: draftOrderNumber,
    });

    setTransactionId(generatedTrx);

    if (webhookResult.order) {
      try {
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.6 },
          colors: ['#10b981', '#0f172a', '#e11d48', '#f59e0b']
        });
      } catch (e) {}

      if (isCustomerOffline) {
        // Show clear confirmation that the server processed their order via webhook despite customer internet being OFF
        setWebhookStatusBanner({
          type: 'success',
          title: `Payment Webhook Processed Order #${webhookResult.order.orderNumber} While Your Internet Was Off!`,
          message: `Even though your browser internet is disconnected, the ${gatewayType.toUpperCase()} IPN Webhook (TrxID: ${generatedTrx}) reached our server, locked your inventory, and marked your order as VERIFIED & PROCESSING.`,
          verifiedOrder: webhookResult.order,
        });
      } else {
        onOrderPlaced(webhookResult.order);
      }
    } else {
      setWebhookStatusBanner({
        type: 'info',
        title: `Pre-Verified Webhook Received (${generatedTrx})`,
        message: webhookResult.message,
      });
    }
  };

  // Handle Order Submit
  const handlePlaceOrder = () => {
    setSubmissionError(null);

    if (!recipientName.trim()) {
      setSubmissionError('Please enter recipient full name.');
      return;
    }
    if (!phone.trim()) {
      setSubmissionError('Please enter valid contact phone number.');
      return;
    }
    if (!addressLine.trim()) {
      setSubmissionError('Please enter complete delivery street address.');
      return;
    }
    if (!matchedZone) {
      setSubmissionError('Please select a valid delivery zone/area.');
      return;
    }

    // If customer's internet is turned off, queue the order locally and allow webhook or reconnect to process it!
    if (isCustomerOffline) {
      const queued = queueOfflineOrder({
        draftOrderNumber,
        deliveryAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          addressLine: addressLine.trim(),
          district: selectedArea.districtName,
          areaName: selectedArea.areaName,
        },
        zoneId: matchedZone.id,
        paymentMethodId: selectedPaymentMethodId,
        couponCode: appliedCoupon?.code,
        loyaltyPointsToUse: useLoyaltyPoints ? pointsToRedeem : 0,
        senderPhone: senderPhone.trim() || phone.trim(),
        transactionId: transactionId.trim().toUpperCase() || 'AWAITING-WEBHOOK-IPN',
        customerNotes: customerNotes.trim(),
        expectedGrandTotal: grandTotal,
      });

      setWebhookStatusBanner({
        type: 'warning',
        title: `Order #${queued.draftOrderNumber} Queued in Offline-Resilient Storage`,
        message: `Your internet is currently turned off. Your order is safely locked with reference #${queued.draftOrderNumber}. It will automatically process as soon as the Payment Gateway Webhook (IPN) arrives or when your internet reconnects!`,
      });
      return;
    }

    // If manual mobile payment (bKash/Nagad/Rocket), require transactionId unless webhook already pre-verified it
    if (selectedPaymentMethod && selectedPaymentMethod.type !== 'cod') {
      if (!transactionId.trim() && !webhookConfig.isEnabled) {
        setSubmissionError(
          `Please enter the ${selectedPaymentMethod.name} Transaction ID (TrxID) after transferring ${siteSettings.currencySymbol}${grandTotal}.`
        );
        return;
      }
      if (!senderPhone.trim()) {
        setSubmissionError('Please provide the sender phone number used to make the payment.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = placeOrder({
        deliveryAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          addressLine: addressLine.trim(),
          district: selectedArea.districtName,
          areaName: selectedArea.areaName,
        },
        zoneId: matchedZone.id,
        paymentMethodId: selectedPaymentMethodId,
        couponCode: appliedCoupon?.code,
        loyaltyPointsToUse: useLoyaltyPoints ? pointsToRedeem : 0,
        senderPhone: senderPhone.trim(),
        transactionId: transactionId.trim().toUpperCase() || 'AWAITING-WEBHOOK-IPN',
        customerNotes: customerNotes.trim(),
        orderNumberOverride: draftOrderNumber,
      });

      if (result.success && result.order) {
        try {
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#e11d48', '#0f172a', '#10b981', '#f59e0b']
          });
        } catch (e) {}
        onOrderPlaced(result.order);
      } else {
        setSubmissionError(result.error || 'Failed to place order. Please review your cart.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setSubmissionError(err.message || 'An unexpected error occurred during order creation.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-10">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Store</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">Checkout & Order Placement</h1>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Logged in as <strong className="text-stone-800">{currentUser?.name}</strong> ({currentUser?.email}) · Pre-Allocated Order Ref:{' '}
            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded">
              #{draftOrderNumber}
            </span>
          </p>
        </div>

        {/* Network & Webhook Resilience Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <Webhook className="w-3.5 h-3.5 text-emerald-600" />
            <span>Payment Webhook Active</span>
          </div>

          <button
            type="button"
            onClick={() => setSimulateCustomerOffline(prev => !prev)}
            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 border transition-colors cursor-pointer ${
              isCustomerOffline
                ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
            }`}
            title="Toggle simulated customer internet drop to test offline webhook order processing"
          >
            {isCustomerOffline ? (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Internet: OFF (Click to Reconnect)</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Test: Turn Customer Internet Off</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Offline / Webhook Resilience Status Banner */}
      {(isCustomerOffline || webhookStatusBanner || offlineOrderQueue.length > 0) && (
        <div
          className={`mt-6 p-4 rounded-xl border space-y-3 ${
            webhookStatusBanner?.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : isCustomerOffline
              ? 'bg-amber-50 border-amber-300 text-amber-950'
              : 'bg-stone-900 border-stone-800 text-white'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {webhookStatusBanner?.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : isCustomerOffline ? (
                <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Webhook className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider">
                  {webhookStatusBanner
                    ? webhookStatusBanner.title
                    : `Customer Internet Disconnected — Webhook Order Protection Active (#${draftOrderNumber})`}
                </h3>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {webhookStatusBanner
                    ? webhookStatusBanner.message
                    : `Your checkout session (#${draftOrderNumber}) is saved. Even while your internet is turned off, if ${
                        selectedPaymentMethod?.name || 'bKash/Nagad'
                      } sends a Payment Webhook callback (or when your internet reconnects), your order will automatically process and verify!`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {webhookStatusBanner?.verifiedOrder ? (
                <button
                  type="button"
                  onClick={() => onOrderPlaced(webhookStatusBanner.verifiedOrder!)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-xs font-extrabold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>View Confirmed Order #{webhookStatusBanner.verifiedOrder.orderNumber} →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSimulateGatewayWebhook}
                  className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simulate Gateway Webhook (IPN) Now</span>
                </button>
              )}

              {isCustomerOffline && (
                <button
                  type="button"
                  onClick={() => setSimulateCustomerOffline(false)}
                  className="px-3 py-2 bg-white text-stone-900 border border-stone-300 hover:bg-stone-100 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Internet</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column (Steps: Address, Zone, Loyalty, Payment) - 7 cols */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          {/* STEP 1: Delivery Address & Zone Selection */}
          <section className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Shipping Address & Delivery Zone
              </h2>
            </div>

            {/* Saved Address Selector if available */}
            {currentUser?.addresses && currentUser.addresses.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-700">Choose Saved Address</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentUser.addresses.map(addr => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSavedAddressChange(addr.id)}
                      className={`text-left p-3 rounded-md border text-xs transition-all ${
                        selectedSavedAddrId === addr.id
                          ? 'border-stone-900 bg-stone-50 font-medium'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span>{addr.label}</span>
                        {addr.isDefault && (
                          <span className="text-[10px] text-stone-400 font-normal">Default</span>
                        )}
                      </div>
                      <p className="text-stone-600 truncate mt-1">{addr.recipientName}</p>
                      <p className="text-stone-500 truncate text-[11px]">{addr.addressLine}</p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSavedAddressChange('new')}
                    className={`text-left p-3 rounded-md border text-xs transition-all flex items-center justify-center font-semibold ${
                      selectedSavedAddrId === 'new'
                        ? 'border-stone-900 bg-stone-50 text-stone-900'
                        : 'border-dashed border-stone-300 text-stone-500 hover:border-stone-400'
                    }`}
                  >
                    + Enter New Address
                  </button>
                </div>
              </div>
            )}

            {/* Address Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 01712-345678"
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md outline-none focus:border-stone-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Street Address (House, Road, Apartment, Thana) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={addressLine}
                  onChange={e => setAddressLine(e.target.value)}
                  placeholder="e.g. House 42, Road 9A, Dhanmondi R/A, Apt 4B"
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md outline-none focus:border-stone-900 resize-none"
                />
              </div>

              {/* Delivery Area Mapping to Zone */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  District & Delivery Area *
                </label>
                <select
                  value={selectedAreaId}
                  onChange={e => setSelectedAreaId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-stone-300 rounded-md outline-none focus:border-stone-900 bg-white"
                >
                  {deliveryAreas.map(area => {
                    const z = deliveryZones.find(zone => zone.id === area.zoneId);
                    return (
                      <option key={area.id} value={area.id}>
                        {area.districtName} — {area.areaName} ({z?.name} · {siteSettings.currencySymbol}{z?.fee})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Zone Fee Snapshot preview box */}
            {matchedZone && (
              <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-700">
                  <Truck className="w-4 h-4 text-stone-900" />
                  <span>
                    <strong>{matchedZone.name}:</strong> Estimated {matchedZone.estimatedDeliveryTime}
                  </span>
                </div>
                <span className="font-extrabold text-stone-900">
                  {siteSettings.currencySymbol}{matchedZone.fee}
                </span>
              </div>
            )}
          </section>

          {/* STEP 2: Loyalty Rewards Program */}
          {siteSettings.loyaltySettings.isEnabled && currentUser && currentUser.loyaltyPoints > 0 && (
            <section className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    ★
                  </span>
                  <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                    Loyalty Rewards Balance
                  </h2>
                </div>
                <span className="text-xs font-semibold text-amber-700">
                  {currentUser.loyaltyPoints} Points Available
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-600">
                <p>
                  Redeem your points for an instant order discount (1 point = {siteSettings.currencySymbol}{loyaltyRate}).
                </p>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-stone-900 shrink-0">
                  <input
                    type="checkbox"
                    checked={useLoyaltyPoints}
                    onChange={e => {
                      setUseLoyaltyPoints(e.target.checked);
                      if (e.target.checked) {
                        setPointsToRedeem(Math.min(currentUser.loyaltyPoints, 200));
                      }
                    }}
                    className="rounded border-stone-300 text-stone-900 focus:ring-0"
                  />
                  <span>Apply Rewards</span>
                </label>
              </div>

              {useLoyaltyPoints && (
                <div className="pt-2 flex flex-wrap sm:flex-nowrap items-center gap-3 text-xs bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <span className="font-semibold text-amber-900 shrink-0">Points to redeem:</span>
                  <input
                    type="range"
                    min={siteSettings.loyaltySettings.minPointsToRedeem}
                    max={currentUser.loyaltyPoints}
                    step={10}
                    value={pointsToRedeem}
                    onChange={e => setPointsToRedeem(Number(e.target.value))}
                    className="flex-1 min-w-[120px] accent-stone-900"
                  />
                  <span className="font-bold text-stone-900 text-right shrink-0">
                    {pointsToRedeem} pts (-{siteSettings.currencySymbol}{pointsToRedeem * loyaltyRate})
                  </span>
                </div>
              )}
            </section>
          )}

          {/* STEP 3: Payment Method (Manual Mobile Verification / COD) */}
          <section className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Payment Method — Manual Verification
              </h2>
            </div>

            <div className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-200">
              <p>
                <strong>Security Policy:</strong> We process mobile payments manually with zero gateway intermediaries. Transfer the exact grand total ({siteSettings.currencySymbol}{grandTotal}) and enter your Transaction ID (TrxID) below.
              </p>
            </div>

            {/* Payment Method Selector Radio Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enabledPaymentMethods.map(pm => {
                const isSelected = selectedPaymentMethodId === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethodId(pm.id);
                      setSubmissionError(null);
                    }}
                    className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-stone-950 bg-stone-950 text-white shadow-xs'
                        : 'border-stone-200 bg-white text-stone-800 hover:border-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold">{pm.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                          isSelected ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {pm.type === 'cod' ? 'Cash' : pm.accountType}
                      </span>
                    </div>

                    <p className={`text-[11px] mt-2 line-clamp-2 ${isSelected ? 'text-stone-300' : 'text-stone-500'}`}>
                      {pm.type === 'cod'
                        ? 'Pay physical cash to courier rider upon parcel delivery.'
                        : `Recipient: ${pm.recipientNumber}`}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Detailed Instructions & Submission Fields for Selected Method */}
            {selectedPaymentMethod && selectedPaymentMethod.type !== 'cod' ? (
              <div className="bg-stone-50 p-3.5 sm:p-4 rounded-xl border border-stone-200 space-y-4 text-xs animate-in fade-in duration-150">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                  <span className="font-bold text-stone-900">
                    Step-by-Step {selectedPaymentMethod.name} Instructions
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-stone-900 text-sm">
                      {selectedPaymentMethod.recipientNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(selectedPaymentMethod.recipientNumber)}
                      className="p-1 text-stone-600 hover:text-stone-900 border rounded bg-white shadow-2xs"
                      title="Copy Account Number"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="whitespace-pre-line text-stone-600 leading-relaxed font-sans">
                  {selectedPaymentMethod.instructions}
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    Amount to transfer:{' '}
                    <strong className="text-base font-extrabold text-stone-950">
                      {siteSettings.currencySymbol}{grandTotal}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] bg-white px-2.5 py-1 rounded border border-amber-300">
                    <span className="text-stone-500">Payment Reference:</span>
                    <span className="font-mono font-bold text-stone-900">{draftOrderNumber}</span>
                    <button
                      type="button"
                      onClick={handleCopyOrderRef}
                      className="text-stone-500 hover:text-stone-900"
                      title="Copy Order Reference for Payment"
                    >
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Webhook Protection Note */}
                <div className="p-3 bg-emerald-50/80 rounded-lg border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <Webhook className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong>Webhook Auto-Processing Enabled:</strong> Enter reference <code className="font-mono font-bold">{draftOrderNumber}</code> when paying. Even if your internet turns off before you enter the TrxID, our payment webhook will automatically capture your payment and process your order!
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSimulateGatewayWebhook}
                    className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[11px] font-bold shrink-0 flex items-center gap-1 cursor-pointer self-start sm:self-center"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Simulate Webhook IPN</span>
                  </button>
                </div>

                {/* Claim Submission Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Sender Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 01812-345678"
                      value={senderPhone}
                      onChange={e => setSenderPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded bg-white outline-none focus:border-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">
                      Transaction ID (TrxID) <span className="text-[10px] font-normal text-stone-500">(Optional if Webhook IPN used)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BK9A77209X or auto-filled by Webhook"
                      value={transactionId}
                      onChange={e => setTransactionId(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded bg-white font-mono font-bold uppercase outline-none focus:border-stone-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-800 mb-1">
                      Customer Payment Notes (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sent from brother's bKash at 3:15 PM"
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded bg-white outline-none focus:border-stone-900"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                <p className="font-bold text-stone-900">Cash on Delivery Policy</p>
                <p>
                  You will pay <strong>{siteSettings.currencySymbol}{grandTotal}</strong> in cash directly to the courier delivery agent after inspecting the packaging.
                </p>
                <p className="text-[11px] text-stone-500">
                  Please keep exact currency ready to ensure seamless drop-off.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Order Snapshot Summary & Place Order - 5 cols */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-xs space-y-5 lg:sticky lg:top-24">
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider pb-3 border-b border-stone-100">
              Order Snapshot Summary ({resolvedItems.length} items)
            </h2>

            {/* Line items list */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {resolvedItems.map((item, idx) => {
                if (!item) return null;
                const { product, variant, unitPrice, quantity, lineTotal } = item;
                const colorImg = product.images.find(
                  img => img.colorName.toLowerCase() === variant.colorName.toLowerCase()
                );
                const imgUrl = colorImg ? colorImg.imageUrl : product.images[0]?.imageUrl || '';

                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <img
                      src={imgUrl}
                      alt={product.name}
                      className="w-12 h-14 object-cover rounded bg-stone-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-stone-900 truncate">{product.name}</h4>
                      <p className="text-[11px] text-stone-500">
                        {variant.colorName} · {variant.size} · Qty {quantity}
                      </p>
                      <p className="font-mono text-[10px] text-stone-400">{variant.sku}</p>
                    </div>
                    <span className="font-extrabold text-stone-900 text-right shrink-0">
                      {siteSettings.currencySymbol}{lineTotal}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Coupon Application Box */}
            <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-stone-100">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-stone-500" />
                <span>Promo Coupon Code</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME10 or HEAVY50"
                  value={couponCodeInput}
                  onChange={e => setCouponCodeInput(e.target.value)}
                  className="flex-1 min-w-0 text-xs px-3 py-2 border border-stone-300 rounded outline-none uppercase font-mono font-bold focus:border-stone-900"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 shrink-0"
                >
                  Apply
                </button>
              </div>
              {appliedCoupon && (
                <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center justify-between bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                  <span>Code {appliedCoupon.code} applied (-{siteSettings.currencySymbol}{appliedCoupon.discount})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponCodeInput('');
                    }}
                    className="text-stone-500 hover:text-stone-900 font-normal underline"
                  >
                    Remove
                  </button>
                </div>
              )}
              {couponError && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{couponError}</p>
              )}
            </form>

            {/* Price Calculations Breakdown */}
            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal</span>
                <span className="font-semibold text-stone-900">
                  {siteSettings.currencySymbol}{subtotal}
                </span>
              </div>

              <div className="flex justify-between text-stone-600">
                <span>Delivery Fee ({matchedZone?.name || 'Standard'})</span>
                <span className="font-semibold text-stone-900">
                  {siteSettings.currencySymbol}{deliveryFee}
                </span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-{siteSettings.currencySymbol}{couponDiscount}</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Loyalty Rewards ({pointsToRedeem} pts)</span>
                  <span>-{siteSettings.currencySymbol}{loyaltyDiscount}</span>
                </div>
              )}

              <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-stone-900">Grand Total</span>
                  <p className="text-[10px] text-stone-400">All local taxes & snapshots included</p>
                </div>
                <span className="text-xl font-black text-stone-950">
                  {siteSettings.currencySymbol}{grandTotal}
                </span>
              </div>
            </div>

            {/* Error Message */}
            {submissionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-md text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submissionError}</span>
              </div>
            )}

            {/* Final Place Order Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handlePlaceOrder}
              className="w-full py-4 bg-stone-950 hover:bg-rose-600 text-white font-extrabold text-sm rounded-md transition-colors shadow-md disabled:bg-stone-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                  <span>Locking Stock & Creating Order...</span>
                </>
              ) : isCustomerOffline ? (
                <>
                  <WifiOff className="w-4 h-4 text-amber-400" />
                  <span>Queue Order Offline — Webhook Protected ({siteSettings.currencySymbol}{grandTotal})</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm & Place Order ({siteSettings.currencySymbol}{grandTotal})</span>
                </>
              )}
            </motion.button>

            <p className="text-[11px] text-center text-stone-500 leading-relaxed">
              By confirming, your order snapshot and inventory lock are recorded permanently into the authoritative database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
