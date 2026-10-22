import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface StaticPageViewProps {
  slug: string;
  onBack: () => void;
}

export const StaticPageView: React.FC<StaticPageViewProps> = ({ slug, onBack }) => {
  const { staticPages } = useStore();
  const page = staticPages.find(p => p.slug === slug) || staticPages[0];

  return (
    <div className="max-w-4xl 2xl:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Store</span>
        </button>
      </div>

      <article className="bg-white rounded-xl border border-stone-200 p-5 sm:p-8 lg:p-10 space-y-6 shadow-xs">
        <div className="border-b border-stone-200 pb-4">
          <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-stone-900 tracking-tight">
            {page.title}
          </h1>
          <p className="text-[11px] text-stone-400 mt-1">
            Last updated: {page.updatedAt} · ThreadCraft Studio Policy
          </p>
        </div>

        <div className="text-xs sm:text-sm 2xl:text-base text-stone-700 leading-relaxed space-y-4 whitespace-pre-line font-sans break-words">
          {page.content}
        </div>
      </article>
    </div>
  );
};
