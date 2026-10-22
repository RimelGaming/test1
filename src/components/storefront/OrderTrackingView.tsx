import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Copy,
  Check,
  ArrowLeft,
  AlertCircle,
  FileText,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Printer
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';

interface OrderTrackingViewProps {
  initialOrderNumber?: string | null;
  onBack: () => void;
  onExploreShop: () => void;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber,
  onBack,
  onExploreShop,
}) => {
  const {
    orders,
    currentUser,
    siteSettings,
    trackOrderLookup,
    submitPaymentClaim,
  } = useStore();

  const [orderQuery, setOrderQuery] = useState(initialOrderNumber || '');
  const [contactQuery, setContactQuery] = useState(
    currentUser?.phone || currentUser?.email || ''
  );
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // In-situ payment claim update state
  const [isUpdatingClaim, setIsUpdatingClaim] = useState(false);
  const [newTrxId, setNewTrxId] = useState('');
  const [newSenderPhone, setNewSenderPhone] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  // If initialOrderNumber passed, perform initial lookup
  useEffect(() => {
    if (initialOrderNumber) {
      setOrderQuery(initialOrderNumber);
      handleSearch(initialOrderNumber, contactQuery);
    } else if (currentUser && orders.some(o => o.userId === currentUser.id)) {
      // Pre-load customer's latest order for convenience
      const userOrders = orders.filter(o => o.userId === currentUser.id);
      if (userOrders.length > 0) {
        const latest = userOrders[0];
        setOrderQuery(latest.orderNumber);
        setActiveOrder(latest);
      }
    }
  }, [initialOrderNumber]);

  const handleSearch = (queryToUse?: string, contactToUse?: string) => {
    const q = (queryToUse !== undefined ? queryToUse : orderQuery).trim();
    const contact = (contactToUse !== undefined ? contactToUse : contactQuery).trim();

    setLookupError(null);
    setIsSearching(true);

    setTimeout(() => {
      const result = trackOrderLookup(q, contact);
      if (result.success && result.order) {
        setActiveOrder(result.order);
        setLookupError(null);
        setNewSenderPhone(result.order.customerPhone);
        setNewTrxId(result.order.paymentClaim?.transactionId || '');
      } else {
        setActiveOrder(null);
        setLookupError(
          result.error ||
            'Could not locate order. Please check the order number or provide your contact number.'
        );
      }
      setIsSearching(false);
    }, 180);
  };

  const handleCopyTracking = (trackingNum: string) => {
    if (!trackingNum) return;
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleSubmitClaimUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !newTrxId.trim()) return;

    const res = submitPaymentClaim(
      activeOrder.id,
      newSenderPhone.trim() || activeOrder.customerPhone,
      newTrxId.trim(),
      claimNotes.trim()
    );

    setClaimFeedback(res.message);
    setTimeout(() => {
      setClaimFeedback(null);
      setIsUpdatingClaim(false);
      // Re-lookup updated order
      const refreshed = orders.find(o => o.id === activeOrder.id);
      if (refreshed) setActiveOrder({ ...refreshed });
    }, 1600);
  };

  // Helper for tracking stages
  const getTimelineStages = (order: Order) => {
    const statusOrder: OrderStatus[] = [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
    ];

    const currentStatusIndex = statusOrder.indexOf(order.orderStatus);

    const stages = [
      {
        id: 'placed',
        title: 'Order Placed',
        subtitle: 'Digital snapshot recorded & stock units locked',
        isCompleted: true,
        isCurrent: order.orderStatus === 'pending',
        timestamp: order.createdAt,
        actor: order.customerName,
      },
      {
        id: 'verified',
        title:
          order.paymentMethodSnapshot.type === 'cod'
            ? 'Cash on Delivery Approved'
            : 'Payment Verified',
        subtitle:
          order.paymentMethodSnapshot.type === 'cod'
            ? 'Order verified for cash collection at doorstep'
            : order.paymentStatus === 'verified'
            ? `${order.paymentMethodSnapshot.name} verified against account credit`
            : order.paymentStatus === 'rejected'
            ? 'Payment claim requires re-submission'
            : `Awaiting admin check for ${order.paymentMethodSnapshot.name} TrxID`,
        isCompleted:
          order.paymentStatus === 'verified' ||
          order.orderStatus === 'confirmed' ||
          order.orderStatus === 'processing' ||
          order.orderStatus === 'shipped' ||
          order.orderStatus === 'delivered',
        isCurrent:
          order.paymentStatus === 'awaiting_verification' ||
          order.orderStatus === 'confirmed',
        timestamp: order.paymentClaim?.verifiedAt,
        actor: order.paymentClaim?.verifiedBy || 'Admin Center',
      },
      {
        id: 'processing',
        title: 'Packaging & Fabric QC',
        subtitle: '240 GSM organic combed jersey inspected and packed in eco-kraft packaging',
        isCompleted:
          order.orderStatus === 'processing' ||
          order.orderStatus === 'shipped' ||
          order.orderStatus === 'delivered',
        isCurrent: order.orderStatus === 'processing',
        timestamp: order.statusHistory.find(s => s.toStatus === 'processing')?.timestamp,
        actor: 'Dhaka Studio Fulfillment',
      },
      {
        id: 'shipped',
        title: 'Dispatched to Courier',
        subtitle: order.carrierName
          ? `Transferred to ${order.carrierName} · Waybill: ${order.trackingNumber || 'Assigned'}`
          : 'Ready for courier courier vehicle pickup',
        isCompleted:
          order.orderStatus === 'shipped' || order.orderStatus === 'delivered',
        isCurrent: order.orderStatus === 'shipped',
        timestamp: order.statusHistory.find(s => s.toStatus === 'shipped')?.timestamp,
        actor: order.carrierName || 'Courier Partner',
      },
      {
        id: 'delivered',
        title: 'Delivered & Received',
        subtitle:
          order.orderStatus === 'delivered'
            ? 'Customer accepted parcel. Loyalty rewards unlocked.'
            : `Handover at destination in ${order.deliveryAddressSnapshot.areaName}`,
        isCompleted: order.orderStatus === 'delivered',
        isCurrent: order.orderStatus === 'delivered',
        timestamp: order.statusHistory.find(s => s.toStatus === 'delivered')?.timestamp,
        actor: order.orderStatus === 'delivered' ? 'Delivery Agent' : undefined,
      },
    ];

    return { stages, currentStatusIndex };
  };

  // Courier delivery simulation milestones if shipped
  const getCourierMilestones = (order: Order) => {
    if (!order.carrierName) return [];

    const isDelivered = order.orderStatus === 'delivered';
    const isShipped = order.orderStatus === 'shipped';

    return [
      {
        location: 'Dhaka Tejgaon Central Sort Facility',
        status: 'Shipment manifest registered & sorted into district distribution bin',
        time: 'Day 1 · 08:30 PM',
        completed: true,
      },
      {
        location: `${order.deliveryAddressSnapshot.district} Local Dispatch Hub`,
        status: `Arrived at regional delivery hub for ${order.deliveryAddressSnapshot.areaName}`,
        time: 'Day 2 · 09:15 AM',
        completed: isShipped || isDelivered,
      },
      {
        location: `Destination Route · ${order.deliveryAddressSnapshot.areaName}`,
        status: isDelivered
          ? 'Parcel successfully handed over to recipient'
          : 'Assigned to delivery rider for doorstep dispatch',
        time: isDelivered ? 'Delivered · 02:45 PM' : 'Out for delivery today',
        completed: isDelivered,
      },
    ];
  };

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-10 space-y-8 sm:space-y-10">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Store</span>
          </button>
          <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-stone-900 tracking-tight">
            Order & Courier Tracking
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time fulfillment checkpoints, courier waybill status, and manual verification logs across Bangladesh.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={onExploreShop}
            className="px-4 py-2 border border-stone-300 rounded text-xs font-bold text-stone-800 hover:bg-stone-100 transition-colors"
          >
            Explore Catalog
          </button>
          {activeOrder && (
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-stone-900 text-white rounded text-xs font-bold hover:bg-stone-800 flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* SEARCH / LOOKUP CONSOLE */}
      <section className="bg-white rounded-xl border border-stone-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Track Any Order Without Logging In
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Enter your Order Number (e.g. <span className="font-mono font-bold text-stone-800">ORD-2026-7841</span>) and the phone number or email used during checkout.
          </p>
        </div>

        <form
          onSubmit={e => {
            e.preventDefault();
            handleSearch();
          }}
          className="grid grid-cols-1 md:grid-cols-12 gap-3"
        >
          <div className="md:col-span-5">
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Order # or Courier Tracking Code *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={orderQuery}
                onChange={e => setOrderQuery(e.target.value)}
                placeholder="e.g. ORD-2026-7841 or SFC-8942110"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded text-xs font-mono font-bold text-stone-900 focus:border-stone-900 outline-none uppercase"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="md:col-span-4 lg:col-span-5">
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              Customer Phone or Email (Verification)
            </label>
            <div className="relative">
              <input
                type="text"
                value={contactQuery}
                onChange={e => setContactQuery(e.target.value)}
                placeholder="e.g. 01812345678 or customer@threadcraft.com"
                className="w-full pl-9 pr-3 py-2.5 border border-stone-300 rounded text-xs font-medium text-stone-900 focus:border-stone-900 outline-none"
              />
              <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={!orderQuery.trim() || isSearching}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Track Parcel</span>
            </button>
          </div>
        </form>

        {/* Demo Fast-Lookup Chips */}
        <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold text-stone-400">
            Quick Demo Orders:
          </span>
          {orders.slice(0, 4).map(o => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setOrderQuery(o.orderNumber);
                setContactQuery(o.customerPhone);
                handleSearch(o.orderNumber, o.customerPhone);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                activeOrder?.id === o.id
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
            >
              <span className="font-mono font-bold">#{o.orderNumber}</span>
              <span className="ml-1.5 text-[10px] uppercase font-bold text-stone-400">
                ({o.orderStatus})
              </span>
            </button>
          ))}
        </div>

        {/* Lookup Error Message */}
        {lookupError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{lookupError}</span>
          </div>
        )}
      </section>

      {/* TRACKING DETAILS CONTAINER */}
      {activeOrder && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Main Status Hero Card */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6">
            {/* Top row: Order Number, Estimated Delivery, Status */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5 text-xs text-stone-500">
                  <span className="font-mono font-black text-stone-900 text-base">
                    Order #{activeOrder.orderNumber}
                  </span>
                  <span>·</span>
                  <span>
                    Placed {new Date(activeOrder.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-xs text-stone-600">
                  Customer: <strong>{activeOrder.customerName}</strong> · Phone: {activeOrder.customerPhone}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Order Status Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-bold">
                    Status:
                  </span>
                  <span
                    className={`px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wider ${
                      activeOrder.orderStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : activeOrder.orderStatus === 'shipped'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse'
                        : activeOrder.orderStatus === 'processing'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : activeOrder.orderStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {activeOrder.orderStatus}
                  </span>
                </div>

                {/* Payment Status Pill */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider font-bold">
                    Payment:
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-semibold ${
                      activeOrder.paymentStatus === 'verified'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : activeOrder.paymentStatus === 'rejected'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : 'bg-stone-100 text-stone-800 border border-stone-200'
                    }`}
                  >
                    {activeOrder.paymentMethodSnapshot.name}{' '}
                    {activeOrder.paymentStatus === 'verified'
                      ? '(Verified)'
                      : activeOrder.paymentStatus === 'awaiting_verification'
                      ? '(Awaiting Statement Verification)'
                      : '(COD)'}
                  </span>
                </div>
              </div>
            </div>

            {/* VISUAL TIMELINE PROGRESS TRACKER */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Live Dispatch Checkpoints
                </span>
                <span className="text-[11px] text-stone-500 font-medium">
                  Zone: <strong>{activeOrder.deliveryZoneSnapshot.name}</strong>
                </span>
              </div>

              {/* Progress Steps Horizontal Bar (Desktop) & Grid (Tablet/Mobile) */}
              {(() => {
                const { stages } = getTimelineStages(activeOrder);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                    {stages.map((stage, idx) => {
                      return (
                        <div
                          key={stage.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            stage.isCurrent
                              ? 'bg-stone-900 text-white border-stone-900 shadow-md ring-2 ring-stone-900/10'
                              : stage.isCompleted
                              ? 'bg-stone-50 text-stone-900 border-stone-300'
                              : 'bg-white text-stone-400 border-stone-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center ${
                                stage.isCurrent
                                  ? 'bg-white text-stone-900'
                                  : stage.isCompleted
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-200 text-stone-500'
                              }`}
                            >
                              {stage.isCompleted && !stage.isCurrent ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : (
                                idx + 1
                              )}
                            </span>

                            {stage.isCurrent && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Current
                              </span>
                            )}
                          </div>

                          <h4
                            className={`font-bold text-xs ${
                              stage.isCurrent ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {stage.title}
                          </h4>

                          <p
                            className={`text-[11px] mt-1 leading-snug ${
                              stage.isCurrent ? 'text-stone-300' : 'text-stone-500'
                            }`}
                          >
                            {stage.subtitle}
                          </p>

                          {stage.timestamp && (
                            <span
                              className={`text-[10px] font-mono mt-2 block ${
                                stage.isCurrent ? 'text-stone-400' : 'text-stone-400'
                              }`}
                            >
                              {new Date(stage.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* TWO-COLUMN DETAILS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 cols: Courier Waybill & Order Activity Timeline */}
            <div className="lg:col-span-7 space-y-6">
              {/* Courier Consignment Tracker Card */}
              {activeOrder.carrierName ? (
                <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-stone-900 text-sm">
                          Carrier Partner: {activeOrder.carrierName}
                        </h3>
                        <p className="text-[11px] text-stone-500">
                          Direct door-to-door delivery with live courier consignment ID
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded uppercase">
                      Courier Dispatched
                    </span>
                  </div>

                  {/* Tracking Number Highlight Box */}
                  <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                        Waybill / Consignment Tracking Number
                      </span>
                      <span className="font-mono text-base font-black text-stone-900">
                        {activeOrder.trackingNumber || 'Pending Courier Assign'}
                      </span>
                    </div>

                    {activeOrder.trackingNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyTracking(activeOrder.trackingNumber!)}
                        className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded font-bold text-xs text-stone-800 flex items-center gap-1.5 transition-colors shadow-2xs"
                      >
                        {copiedTracking ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-stone-500" />
                            <span>Copy Waybill</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Simulated Courier Hub Scans */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Carrier Transit Scans & Hub Milestones
                    </span>

                    <div className="space-y-2.5">
                      {getCourierMilestones(activeOrder).map((milestone, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 text-xs p-2.5 rounded-lg bg-white border border-stone-100"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
                              milestone.completed ? 'bg-emerald-500' : 'bg-stone-300'
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-stone-900">
                                {milestone.location}
                              </span>
                              <span className="text-[11px] text-stone-400 font-mono">
                                {milestone.time}
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              {milestone.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl border border-dashed border-stone-300 p-6 text-center space-y-2 text-xs">
                  <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center mx-auto">
                    <Package className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-stone-800 text-sm">
                    In Packing & Verification Queue
                  </h4>
                  <p className="text-stone-500 max-w-md mx-auto">
                    Your order is currently being inspected and packaged. Once handed over to Steadfast or Pathao Courier, your live tracking code and rider contacts will appear here.
                  </p>
                </div>
              )}

              {/* Order Status History Audit Trail */}
              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <h3 className="font-extrabold text-stone-900 text-sm">
                    Immutable Activity Log ({activeOrder.statusHistory.length} events)
                  </h3>
                  <span className="text-[11px] text-stone-400 font-mono">
                    Audit Certified
                  </span>
                </div>

                <div className="space-y-3">
                  {activeOrder.statusHistory.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-start gap-3 text-xs pb-3 border-b border-stone-100 last:border-b-0 last:pb-0"
                    >
                      <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-900">{item.note}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono block mt-0.5">
                          Actor: {item.actor}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* In-Situ Payment Claim Form (if awaiting review or rejected) */}
              {activeOrder.paymentMethodSnapshot.type !== 'cod' && (
                <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-stone-900 text-sm">
                        Manual Payment Claim & TrxID Verification
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        activeOrder.paymentStatus === 'verified'
                          ? 'bg-emerald-100 text-emerald-800'
                          : activeOrder.paymentStatus === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {activeOrder.paymentStatus}
                    </span>
                  </div>

                  <div className="text-xs space-y-2 text-stone-600">
                    <div className="flex items-center justify-between p-2.5 rounded bg-stone-50 border border-stone-200">
                      <span>Submitted TrxID:</span>
                      <span className="font-mono font-black text-stone-900 text-xs">
                        {activeOrder.paymentClaim?.transactionId || 'None'}
                      </span>
                    </div>

                    {activeOrder.paymentClaim?.rejectionReason && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded text-rose-800 text-[11px]">
                        <strong>Rejection Reason from Admin:</strong>{' '}
                        {activeOrder.paymentClaim.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Toggle claim editing */}
                  {!isUpdatingClaim ? (
                    <button
                      type="button"
                      onClick={() => setIsUpdatingClaim(true)}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded font-semibold text-xs transition-colors"
                    >
                      {activeOrder.paymentClaim?.transactionId
                        ? 'Update or Correct TrxID'
                        : 'Submit TrxID Now'}
                    </button>
                  ) : (
                    <form
                      onSubmit={handleSubmitClaimUpdate}
                      className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs"
                    >
                      <h4 className="font-bold text-stone-900">
                        Update {activeOrder.paymentMethodSnapshot.name} Payment Claim
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-stone-700 mb-1">
                            Sender Phone Number *
                          </label>
                          <input
                            type="text"
                            required
                            value={newSenderPhone}
                            onChange={e => setNewSenderPhone(e.target.value)}
                            className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-stone-700 mb-1">
                            Correct Transaction ID (TrxID) *
                          </label>
                          <input
                            type="text"
                            required
                            value={newTrxId}
                            onChange={e => setNewTrxId(e.target.value)}
                            placeholder="e.g. 9J8B29X14A"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white font-mono font-bold uppercase"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-stone-700 mb-1">
                            Additional Notes for Admin
                          </label>
                          <input
                            type="text"
                            value={claimNotes}
                            onChange={e => setClaimNotes(e.target.value)}
                            placeholder="e.g. Sent from brother's bKash account"
                            className="w-full px-3 py-1.5 border border-stone-300 rounded bg-white"
                          />
                        </div>
                      </div>

                      {claimFeedback && (
                        <p className="text-emerald-700 font-bold text-xs">{claimFeedback}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsUpdatingClaim(false)}
                          className="px-3 py-1.5 border border-stone-300 rounded font-semibold text-stone-700 hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
                        >
                          Save TrxID Claim
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>

            {/* Right 5 cols: Destination & Immutable Items Snapshot */}
            <div className="lg:col-span-5 space-y-6">
              {/* Delivery Address Card */}
              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                  <MapPin className="w-4 h-4 text-stone-800" />
                  <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider">
                    Delivery Destination
                  </h3>
                </div>

                <div className="text-xs text-stone-700 space-y-1">
                  <p className="font-black text-sm text-stone-950">
                    {activeOrder.deliveryAddressSnapshot.recipientName}
                  </p>
                  <p className="text-stone-600">
                    {activeOrder.deliveryAddressSnapshot.addressLine}
                  </p>
                  <p className="text-stone-600">
                    {activeOrder.deliveryAddressSnapshot.areaName},{' '}
                    {activeOrder.deliveryAddressSnapshot.district}
                  </p>
                  <p className="text-stone-500 font-mono pt-1">
                    Phone: {activeOrder.deliveryAddressSnapshot.phone}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-500">Zone Applied:</span>
                  <span className="font-bold text-stone-900">
                    {activeOrder.deliveryZoneSnapshot.name} ({siteSettings.currencySymbol}
                    {activeOrder.deliveryFee})
                  </span>
                </div>
              </div>

              {/* Items Purchased Snapshot */}
              <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="font-extrabold text-stone-900 text-xs uppercase tracking-wider">
                    Purchased Garments ({activeOrder.items.length})
                  </h3>
                  <span className="text-[10px] text-stone-400 font-mono">
                    240 GSM Combed
                  </span>
                </div>

                <div className="space-y-3">
                  {activeOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-2 rounded bg-stone-50 border border-stone-200 text-xs"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-14 object-cover rounded bg-stone-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-stone-900 truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {item.colorName} · Size {item.size} · Qty {item.quantity}
                        </p>
                        <p className="font-mono text-[10px] text-stone-400">{item.sku}</p>
                      </div>
                      <span className="font-black text-stone-900 text-xs">
                        {siteSettings.currencySymbol}
                        {item.lineTotal}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Financial Ledger */}
                <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span>
                      {siteSettings.currencySymbol}
                      {activeOrder.subtotal}
                    </span>
                  </div>

                  {activeOrder.couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Promo Coupon ({activeOrder.couponCodeApplied}):</span>
                      <span>
                        -{siteSettings.currencySymbol}
                        {activeOrder.couponDiscount}
                      </span>
                    </div>
                  )}

                  {activeOrder.loyaltyDiscount > 0 && (
                    <div className="flex justify-between text-amber-700 font-semibold">
                      <span>
                        Loyalty Rewards ({activeOrder.loyaltyPointsUsed} pts):
                      </span>
                      <span>
                        -{siteSettings.currencySymbol}
                        {activeOrder.loyaltyDiscount}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-600">
                    <span>Delivery Fee ({activeOrder.deliveryZoneSnapshot.name}):</span>
                    <span>
                      {siteSettings.currencySymbol}
                      {activeOrder.deliveryFee}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between text-sm font-black text-stone-950">
                    <span>Grand Total:</span>
                    <span>
                      {siteSettings.currencySymbol}
                      {activeOrder.grandTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
