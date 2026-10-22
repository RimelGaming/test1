import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Package,
  Award,
  MapPin,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  ExternalLink,
  Plus,
  Trash2,
  Calendar,
  Send,
  Star,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';

interface CustomerPortalProps {
  onClose: () => void;
  initialOrderId?: string | null;
  onTrackOrder?: (orderNumber: string) => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  onClose,
  initialOrderId,
  onTrackOrder,
}) => {
  const {
    currentUser,
    orders,
    loyaltyTransactions,
    siteSettings,
    deliveryAreas,
    deliveryZones,
    updateUserProfile,
    addUserAddress,
    deleteUserAddress,
    submitPaymentClaim,
    reviews,
    products,
    deleteReview,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'loyalty' | 'addresses' | 'reviews' | 'profile'>('orders');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);

  // Address form modal
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Home');
  const [newAddrName, setNewAddrName] = useState(currentUser?.name || '');
  const [newAddrPhone, setNewAddrPhone] = useState(currentUser?.phone || '');
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrAreaId, setNewAddrAreaId] = useState(deliveryAreas[0]?.id || '');

  // Payment Claim update form
  const [claimOrderId, setClaimOrderId] = useState<string | null>(null);
  const [claimSenderPhone, setClaimSenderPhone] = useState(currentUser?.phone || '');
  const [claimTrxId, setClaimTrxId] = useState('');
  const [claimNotes, setClaimNotes] = useState('');
  const [claimFeedback, setClaimFeedback] = useState<string | null>(null);

  // Profile Form
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Filter orders for ONLY this authenticated user (enforcing authorization)
  const myOrders = orders.filter(o => o.userId === currentUser.id);
  const selectedOrder = myOrders.find(o => o.id === selectedOrderId) || myOrders[0];

  // Loyalty transactions for ONLY this user
  const myLoyaltyTxs = loyaltyTransactions.filter(tx => tx.userId === currentUser.id);

  // Reviews authored by this customer
  const myReviews = reviews.filter(r => r.userId === currentUser.id);

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const area = deliveryAreas.find(a => a.id === newAddrAreaId);
    if (!area) return;

    addUserAddress({
      label: newAddrLabel,
      recipientName: newAddrName,
      phone: newAddrPhone,
      addressLine: newAddrLine,
      district: area.districtName,
      areaId: newAddrAreaId,
      isDefault: currentUser.addresses.length === 0,
    });

    setShowAddAddressModal(false);
    setNewAddrLine('');
  };

  const handleUpdateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimOrderId || !claimTrxId.trim()) return;

    const res = submitPaymentClaim(claimOrderId, claimSenderPhone, claimTrxId, claimNotes);
    setClaimFeedback(res.message);
    setTimeout(() => {
      setClaimFeedback(null);
      setClaimOrderId(null);
      setClaimTrxId('');
    }, 2000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileName, profilePhone);
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="bg-white rounded-xl shadow-2xl max-w-5xl 2xl:max-w-6xl w-full md:min-h-[600px] max-h-[94dvh] sm:max-h-[90dvh] overflow-hidden border border-stone-200 flex flex-col md:flex-row"
      >
        {/* Left Sidebar Navigation (Compact horizontal bar on mobile/landscape, vertical sidebar on md+) */}
        <aside className="md:w-64 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200 p-3.5 sm:p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-3 md:space-y-6">
            {/* User Badge & Mobile Back Button */}
            <div className="flex items-center justify-between gap-3 pb-3 md:pb-4 border-b border-stone-200">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-stone-900 text-white font-black text-xs sm:text-sm flex items-center justify-center shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 truncate">{currentUser.name}</h3>
                  <p className="text-[11px] text-stone-500 truncate">{currentUser.email}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="md:hidden px-2.5 py-1.5 bg-white border border-stone-300 rounded text-[11px] font-semibold text-stone-700 hover:bg-stone-100 shrink-0"
              >
                Back to Store
              </button>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex md:flex-col gap-1.5 md:gap-1 overflow-x-auto no-scrollbar text-xs font-semibold text-stone-600">
              <button
                onClick={() => {
                  setActiveTab('orders');
                  setSelectedOrderId(null);
                }}
                className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 py-2 md:py-2.5 rounded-md transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-white md:bg-transparent border md:border-0 border-stone-200 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Orders & Tracking</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'orders' ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'}`}>
                  {myOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('loyalty')}
                className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 py-2 md:py-2.5 rounded-md transition-colors ${
                  activeTab === 'loyalty'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-white md:bg-transparent border md:border-0 border-stone-200 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="whitespace-nowrap">Loyalty Rewards</span>
                </div>
                <span className="text-[10px] text-amber-600 font-bold whitespace-nowrap">
                  {currentUser.loyaltyPoints} pts
                </span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`shrink-0 md:w-full flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-md transition-colors ${
                  activeTab === 'addresses'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-white md:bg-transparent border md:border-0 border-stone-200 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Saved Addresses</span>
              </button>

              <button
                onClick={() => setActiveTab('reviews')}
                className={`shrink-0 md:w-full flex items-center justify-between gap-2 px-3 py-2 md:py-2.5 rounded-md transition-colors ${
                  activeTab === 'reviews'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-white md:bg-transparent border md:border-0 border-stone-200 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="whitespace-nowrap">My Reviews</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${activeTab === 'reviews' ? 'bg-stone-800 text-stone-300' : 'bg-stone-200 text-stone-700'}`}>
                  {myReviews.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`shrink-0 md:w-full flex items-center gap-2 px-3 py-2 md:py-2.5 rounded-md transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'bg-white md:bg-transparent border md:border-0 border-stone-200 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                <UserIcon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Profile Settings</span>
              </button>
            </nav>
          </div>

          <div className="hidden md:block pt-4 border-t border-stone-200">
            <button
              onClick={onClose}
              className="w-full py-2 bg-white border border-stone-300 rounded text-xs font-semibold text-stone-700 hover:bg-stone-100"
            >
              Back to Store
            </button>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* TAB 1: ORDERS & TRACKING */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Your Order History</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Real-time status tracking, manual payment claims, and immutable item snapshots.
                </p>
              </div>

              {myOrders.length === 0 ? (
                <div className="text-center py-12 text-stone-400 space-y-2">
                  <Package className="w-12 h-12 mx-auto stroke-1 text-stone-300" />
                  <p className="font-semibold text-stone-700">No orders placed yet</p>
                  <p className="text-xs text-stone-500">Your future order snapshots will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map(order => (
                    <div
                      key={order.id}
                      className="border border-stone-200 rounded-lg p-4 sm:p-5 bg-white space-y-4 hover:border-stone-300 transition-colors"
                    >
                      {/* Top Order Ribbon */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            #{order.orderNumber}
                          </span>
                          <span className="text-stone-400">·</span>
                          <span className="text-stone-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Status Tags */}
                        <div className="flex items-center gap-2">
                          {/* Order Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
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

                          {/* Payment Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              order.paymentStatus === 'verified'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : order.paymentStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {order.paymentStatus === 'awaiting_verification'
                              ? 'Awaiting Verification'
                              : order.paymentStatus}
                          </span>

                          {onTrackOrder && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onTrackOrder(order.orderNumber);
                              }}
                              className="px-2.5 py-0.5 bg-stone-900 hover:bg-stone-800 text-white rounded text-[11px] font-bold flex items-center gap-1 transition-colors"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Track Parcel</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs">
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-10 h-12 object-cover rounded bg-stone-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-stone-900 truncate">{item.productName}</p>
                              <p className="text-stone-500 text-[11px]">
                                {item.colorName} · {item.size} · Qty {item.quantity} · SKU: {item.sku}
                              </p>
                              <p className="font-extrabold text-stone-800 mt-0.5">
                                {siteSettings.currencySymbol}{item.lineTotal}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Timeline and Payment Claim Info */}
                      <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200 text-xs space-y-2">
                        <div className="flex flex-wrap items-center justify-between text-stone-600">
                          <div>
                            <strong>Delivery Destination:</strong> {order.deliveryAddressSnapshot.recipientName},{' '}
                            {order.deliveryAddressSnapshot.areaName} ({order.deliveryZoneSnapshot.name} · Fee: {siteSettings.currencySymbol}{order.deliveryFee})
                          </div>
                          <div>
                            <strong>Grand Total:</strong>{' '}
                            <span className="font-black text-stone-900 text-sm">
                              {siteSettings.currencySymbol}{order.grandTotal}
                            </span>
                          </div>
                        </div>

                        {/* Courier Tracking if Shipped */}
                        {order.carrierName && order.trackingNumber && (
                          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded text-blue-900 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-blue-700" />
                              <span>
                                Dispatched via <strong>{order.carrierName}</strong> (Tracking #:{' '}
                                <strong className="font-mono">{order.trackingNumber}</strong>)
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-blue-700 uppercase">
                              In Transit
                            </span>
                          </div>
                        )}

                        {/* Payment Claim details & Action to update */}
                        {order.paymentMethodSnapshot.type !== 'cod' && (
                          <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-semibold text-stone-800">
                                {order.paymentMethodSnapshot.name} Claim:
                              </span>{' '}
                              <span className="font-mono text-stone-600">
                                TrxID: {order.paymentClaim?.transactionId || 'None'}
                              </span>
                              {order.paymentClaim?.rejectionReason && (
                                <p className="text-rose-600 text-[11px] font-medium mt-0.5">
                                  Rejection Note: {order.paymentClaim.rejectionReason}
                                </p>
                              )}
                            </div>

                            {(order.paymentStatus === 'awaiting_verification' ||
                              order.paymentStatus === 'rejected') && (
                              <button
                                onClick={() => {
                                  setClaimOrderId(order.id);
                                  setClaimSenderPhone(order.customerPhone);
                                  setClaimTrxId(order.paymentClaim?.transactionId || '');
                                }}
                                className="px-2.5 py-1 bg-white border border-stone-300 rounded text-stone-800 hover:bg-stone-100 font-semibold text-[11px]"
                              >
                                {order.paymentClaim ? 'Update TrxID' : 'Submit TrxID'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Order Status History Timeline */}
                        <div className="pt-2 border-t border-stone-200 space-y-1">
                          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Activity Timeline
                          </p>
                          <div className="space-y-1">
                            {order.statusHistory.map((sh, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-[11px] text-stone-600">
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                                <div>
                                  <span className="font-medium text-stone-800">{sh.note}</span>
                                  <span className="text-stone-400 ml-1.5">
                                    ({new Date(sh.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOYALTY REWARDS */}
          {activeTab === 'loyalty' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Loyalty Rewards Ledger</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Earn points automatically on qualifying delivered orders. Auditable transactional history.
                </p>
              </div>

              {/* Balance Card */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-semibold text-stone-300 uppercase tracking-wider">
                      Current Rewards Balance
                    </span>
                  </div>
                  <span className="text-xs text-amber-400 font-medium">Active Member</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">{currentUser.loyaltyPoints}</span>
                  <span className="text-sm text-stone-400 font-semibold">Reward Points</span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed max-w-md">
                  Worth <strong>{siteSettings.currencySymbol}{currentUser.loyaltyPoints * siteSettings.loyaltySettings.pointsRedeemValueRate}</strong> discount at checkout. Earn 5 points for every ৳100 spent on delivered orders.
                </p>
              </div>

              {/* Transaction Ledger Table */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Transaction Audit History
                </h3>

                <div className="border border-stone-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse min-w-[480px]">
                    <thead>
                      <tr className="bg-stone-50 text-stone-700 font-bold border-b border-stone-200">
                        <th className="p-3">Date</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description / Reason</th>
                        <th className="p-3 text-right">Points</th>
                        <th className="p-3 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-600">
                      {myLoyaltyTxs.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-stone-400">
                            No loyalty transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        myLoyaltyTxs.map(tx => (
                          <tr key={tx.id} className="hover:bg-stone-50">
                            <td className="p-3 text-stone-500">
                              {new Date(tx.timestamp).toLocaleDateString()}
                            </td>
                            <td className="p-3 font-semibold capitalize text-stone-800">
                              {tx.type}
                            </td>
                            <td className="p-3">{tx.reason}</td>
                            <td
                              className={`p-3 text-right font-bold ${
                                tx.pointsDelta > 0 ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {tx.pointsDelta > 0 ? `+${tx.pointsDelta}` : tx.pointsDelta}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-stone-900">
                              {tx.balanceAfter}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-stone-900 tracking-tight">Saved Addresses</h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Speed up checkout with pre-verified delivery destinations.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="px-3.5 py-2 bg-stone-900 text-white rounded-md text-xs font-semibold hover:bg-stone-800 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Address</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentUser.addresses.map(addr => (
                  <div
                    key={addr.id}
                    className="p-4 rounded-lg border border-stone-200 bg-white space-y-2 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{addr.label}</span>
                      <div className="flex items-center gap-2">
                        {addr.isDefault && (
                          <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-semibold">
                            Default
                          </span>
                        )}
                        <button
                          onClick={() => deleteUserAddress(addr.id)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="font-semibold text-xs text-stone-800">{addr.recipientName}</p>
                    <p className="text-xs text-stone-600">{addr.addressLine}</p>
                    <p className="text-xs text-stone-500">{addr.district}</p>
                    <p className="text-xs text-stone-500">Phone: {addr.phone}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: MY PRODUCT REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">My Product Reviews</h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Star ratings, fit commentary, and fabric feedback you've shared with the ThreadCraft community.
                </p>
              </div>

              {myReviews.length === 0 ? (
                <div className="bg-stone-50 rounded-xl p-8 border border-stone-200 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center mx-auto">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">No reviews published yet</h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                      When you review any heavyweight tee or garment from the product detail page, it will appear here.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-stone-900 hover:bg-rose-600 text-white rounded text-xs font-bold transition-colors"
                  >
                    Explore Products
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.map(rev => {
                    const prod = products.find(p => p.id === rev.productId);
                    return (
                      <div
                        key={rev.id}
                        className="p-5 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-100">
                          <div className="flex items-center gap-3">
                            {prod?.images[0]?.imageUrl && (
                              <img
                                src={prod.images[0].imageUrl}
                                alt=""
                                className="w-10 h-12 object-cover rounded bg-stone-100 border border-stone-200"
                              />
                            )}
                            <div>
                              <h4 className="font-bold text-xs text-stone-900">{prod?.name || rev.productId}</h4>
                              <p className="text-[11px] text-stone-400">
                                Reviewed on {new Date(rev.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5 text-amber-400">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-3.5 h-3.5 ${
                                    star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs font-bold text-stone-900 ml-1">{rev.rating}.0</span>
                            </div>

                            {rev.verifiedPurchase && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                Verified Buyer
                              </span>
                            )}
                          </div>
                        </div>

                        {rev.title && <h5 className="font-bold text-xs text-stone-900">{rev.title}</h5>}
                        <p className="text-xs text-stone-700 leading-relaxed">{rev.comment}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px] text-stone-500">
                          <span>Helpful votes received: {rev.helpfulCount || 0}</span>
                          {confirmDeleteReviewId === rev.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-stone-500">Delete?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  deleteReview(rev.id);
                                  setConfirmDeleteReviewId(null);
                                }}
                                className="px-2 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-700"
                              >
                                Yes
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteReviewId(null)}
                                className="px-2 py-0.5 bg-stone-200 text-stone-700 rounded font-medium hover:bg-stone-300"
                              >
                                No
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteReviewId(rev.id)}
                              className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-lg">
              <div>
                <h2 className="text-xl font-black text-stone-900 tracking-tight">Account Profile</h2>
                <p className="text-xs text-stone-500 mt-0.5">Manage your identity and phone credentials.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-6 rounded-lg border border-stone-200 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Primary Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email}
                    className="w-full px-3 py-2 border border-stone-200 rounded bg-stone-100 text-stone-500 cursor-not-allowed"
                  />
                  <span className="text-[10px] text-stone-400">Email cannot be changed directly.</span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mobile Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded outline-none focus:border-stone-900"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-stone-900 text-white rounded-md font-bold hover:bg-stone-800"
                  >
                    Save Changes
                  </button>
                  {profileSavedMsg && (
                    <span className="text-emerald-700 font-semibold">Changes saved successfully!</span>
                  )}
                </div>
              </form>
            </div>
          )}
        </main>
      </motion.div>

      {/* Add Address Modal */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveAddress}
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl text-xs"
          >
            <h3 className="font-extrabold text-stone-900 text-sm">Add Delivery Address</h3>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Address Label</label>
              <input
                type="text"
                value={newAddrLabel}
                onChange={e => setNewAddrLabel(e.target.value)}
                placeholder="e.g. Home, Studio, Office"
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Recipient Name</label>
              <input
                type="text"
                required
                value={newAddrName}
                onChange={e => setNewAddrName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={newAddrPhone}
                onChange={e => setNewAddrPhone(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Delivery Area / Zone</label>
              <select
                value={newAddrAreaId}
                onChange={e => setNewAddrAreaId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded bg-white"
              >
                {deliveryAreas.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.districtName} — {a.areaName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Street Address</label>
              <textarea
                required
                rows={2}
                value={newAddrLine}
                onChange={e => setNewAddrLine(e.target.value)}
                placeholder="House, Road, Apartment"
                className="w-full px-3 py-2 border border-stone-300 rounded resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="px-4 py-2 border border-stone-300 rounded text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
              >
                Save Address
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Payment Claim Update Modal */}
      {claimOrderId && (
        <div className="fixed inset-0 z-60 bg-stone-950/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdateClaim}
            className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 border border-stone-200 shadow-2xl text-xs"
          >
            <h3 className="font-extrabold text-stone-900 text-sm">
              Submit / Update Transaction ID
            </h3>
            <p className="text-stone-500 leading-relaxed">
              If you made a payment transfer or noticed a typo in your TrxID, enter your correct details below for manual verification.
            </p>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Sender Mobile Number</label>
              <input
                type="tel"
                required
                value={claimSenderPhone}
                onChange={e => setClaimSenderPhone(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Transaction ID (TrxID)</label>
              <input
                type="text"
                required
                placeholder="e.g. BK9A77209X"
                value={claimTrxId}
                onChange={e => setClaimTrxId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Notes for Admin (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Sent via Nagad at 4:10 PM"
                value={claimNotes}
                onChange={e => setClaimNotes(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded"
              />
            </div>

            {claimFeedback && (
              <p className="text-emerald-700 font-semibold">{claimFeedback}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClaimOrderId(null)}
                className="px-4 py-2 border border-stone-300 rounded text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-stone-900 text-white rounded font-bold hover:bg-stone-800"
              >
                Submit Claim
              </button>
            </div>
          </form>
        </div>
      )}
    </motion.div>
  );
};
