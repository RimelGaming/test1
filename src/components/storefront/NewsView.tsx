import React, { useState } from 'react';
import { ArrowLeft, Calendar, User, BookOpen } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { NewsPost } from '../../types';

interface NewsViewProps {
  onBack: () => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onBack }) => {
  const { newsPosts } = useStore();
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);

  return (
    <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-8 sm:py-12">
      <div className="mb-6">
        <button
          onClick={selectedPost ? () => setSelectedPost(null) : onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-950 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{selectedPost ? 'Back to All Articles' : 'Return to Home'}</span>
        </button>
      </div>

      {selectedPost ? (
        <article className="max-w-3xl 2xl:max-w-4xl mx-auto space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              {selectedPost.category}
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 tracking-tight leading-tight">
              {selectedPost.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-stone-500 pb-4 border-b border-stone-200">
              <span className="flex items-center gap-1.5 font-medium text-stone-800">
                <User className="w-3.5 h-3.5" />
                {selectedPost.author}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {selectedPost.publishedAt}
              </span>
            </div>
          </div>

          <div className="aspect-16/9 w-full rounded-xl overflow-hidden bg-stone-100">
            <img
              src={selectedPost.imageUrl}
              alt={selectedPost.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="prose prose-stone text-sm 2xl:text-base text-stone-700 leading-relaxed space-y-4 whitespace-pre-line pt-4">
            {selectedPost.content}
          </div>
        </article>
      ) : (
        <div className="space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-rose-600">
              Fabric Engineering & Culture
            </span>
            <h1 className="text-2xl sm:text-3xl 2xl:text-4xl font-black text-stone-900 tracking-tight mt-1">
              The ThreadCraft Journal
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-xl">
              An architectural exploration of yarn density, combed jersey mechanics, oversized garment drape, and mindful care.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 2xl:gap-8">
            {newsPosts.map(post => (
              <div
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="group bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/10 w-full overflow-hidden bg-stone-100">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500 font-semibold">
                      <span className="text-rose-600">{post.category}</span>
                      <span>·</span>
                      <span>{post.publishedAt}</span>
                    </div>

                    <h3 className="text-base font-bold text-stone-900 group-hover:text-rose-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <span className="text-xs font-bold text-stone-900 group-hover:text-rose-600 flex items-center gap-1">
                    Read Article →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
