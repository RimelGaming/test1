import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Award } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { siteSettings } = useStore();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 sm:pt-16 pb-10 sm:pb-12 border-t border-stone-800">
      {/* 1. Value Badges (Unboxed, clean typographic structure) */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pb-10 sm:pb-12 border-b border-stone-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">240 GSM Combed Jersey</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                60% denser than regular tees. Anti-bacon ribbed collars that retain form.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Nationwide Delivery</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Express 24-48h in Dhaka (৳60). 3-5 days across all 64 districts (৳130).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">Verified Mobile Payments</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Manual bKash, Nagad & Rocket verification. Cash on Delivery available.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight">7-Day Free Size Exchange</h4>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                Hassle-free sizing exchanges with instant courier dispatch.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Columns */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Column 1: Brand Info */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              {siteSettings.logoUrl ? (
                <img
                  src={siteSettings.logoUrl}
                  alt={siteSettings.siteName || siteSettings.logoText}
                  className="h-8 w-auto max-w-[140px] object-contain brightness-0 invert"
                />
              ) : null}
              <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-white">
                {siteSettings.logoText || 'THREADCRAFT'}
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-sm leading-relaxed">
              {siteSettings.siteDescription} Engineered in Dhaka with organic combed ring-spun cotton and boxy streetwear geometry.
            </p>
            <div className="text-xs text-stone-400 space-y-1 break-words">
              <p><strong className="text-stone-300">HQ:</strong> {siteSettings.contact.address}</p>
              <p><strong className="text-stone-300">Direct Support:</strong> {siteSettings.contact.phone}</p>
              <p><strong className="text-stone-300">Email:</strong> {siteSettings.contact.email}</p>
            </div>
          </div>

          {/* Column 2: Shop & Categories */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Catalog</h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors text-left">
                  All T-Shirts
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors text-left">
                  Heavyweight Blanks (240 GSM)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors text-left">
                  Oversized Drop-Shoulder
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors text-left">
                  Acid Wash & Patina
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('shop')} className="hover:text-white transition-colors text-left">
                  Minimalist Graphic Drops
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Policies */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Customer Care</h4>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <button
                  onClick={() => onNavigate('track-order')}
                  className="text-rose-400 hover:text-rose-300 font-semibold transition-colors flex items-center gap-1.5 text-left"
                >
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>Track Your Order</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', 'shipping-delivery')} className="hover:text-white transition-colors text-left">
                  Shipping & Delivery Zones
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', 'returns-refunds')} className="hover:text-white transition-colors text-left">
                  Return & Exchange Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', 'faq')} className="hover:text-white transition-colors text-left">
                  FAQ & Payment Guide
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('news')} className="hover:text-white transition-colors text-left">
                  Fabric & Care Journal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('page', 'about-us')} className="hover:text-white transition-colors text-left">
                  About Our Dhaka Studio
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Manual Payment Support Notice */}
          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Accepted Payments</h4>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              We process manual mobile payments without middleman gateways for zero transaction markup:
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-stone-200">
              <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">bKash</span>
              <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">Nagad</span>
              <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">Rocket</span>
              <span className="px-2 py-1 bg-stone-800 rounded border border-stone-700">Cash on Delivery</span>
            </div>
            <div className="mt-4 p-2.5 rounded bg-stone-800/60 border border-stone-700/60 text-[11px] text-stone-400">
              <span className="text-rose-400 font-semibold">Admin Verification:</span> Payments are verified directly against account statements before dispatch.
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Legal & Architecture Notice */}
      <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left text-xs text-stone-500 gap-4">
        <div>
          © {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved. Built for shared cPanel & Apache deployment.
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
          <span>PHP 8.x + MySQL Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Variant-Level Inventory</span>
          <span aria-hidden="true">·</span>
          <span>Zero Gateway Dependencies</span>
        </div>
      </div>
    </footer>
  );
};
