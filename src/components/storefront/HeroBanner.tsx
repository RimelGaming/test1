import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../context/StoreContext';

interface HeroBannerProps {
  onExplore: () => void;
  onJournal: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onExplore, onJournal }) => {
  const { siteSettings } = useStore();
  const { hero } = siteSettings;

  return (
    <section className="relative bg-stone-950 text-white min-h-[460px] sm:min-h-[540px] lg:min-h-[640px] 2xl:min-h-[720px] flex items-center overflow-hidden">
      {/* Background image with dramatic gradient overlay and subtle parallax zoom */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.4 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        className="absolute inset-0 z-0 pointer-events-none"
      >
        <img
          src={hero.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1600&q=90'}
          alt="Heavyweight T-Shirt Studio Backdrop"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40" />
      </motion.div>

      {/* Subtle animated ambient glow orbs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 left-1/4 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl pointer-events-none"
      />

      {/* Hero Content with Staggered Entrance */}
      <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 2xl:px-12 py-12 sm:py-20 lg:py-28">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.12, delayChildren: 0.1 },
            },
          }}
          className="max-w-2xl 2xl:max-w-3xl space-y-5 sm:space-y-6"
        >
          {/* Badge */}
          {hero.badge && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: -16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
              }}
              className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold tracking-widest uppercase text-rose-400 bg-rose-950/50 border border-rose-800/50 px-3 sm:px-3.5 py-1.5 rounded-full shadow-lg backdrop-blur-xs max-w-full"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              </motion.span>
              <span className="truncate">{hero.badge}</span>
            </motion.div>
          )}

          {/* Headline */}
          <motion.h1
            variants={{
              hidden: { opacity: 0, y: 24 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
            }}
            className="text-3xl sm:text-5xl lg:text-6xl 2xl:text-7xl font-black tracking-tight leading-[1.08] text-stone-100 uppercase break-words"
          >
            {hero.headline}
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
            }}
            className="text-sm sm:text-base lg:text-lg 2xl:text-xl text-stone-300 font-normal leading-relaxed max-w-xl 2xl:max-w-2xl"
          >
            {hero.subheadline}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
            }}
            className="pt-1 sm:pt-2 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onExplore}
              className="px-6 py-3.5 bg-white text-stone-950 hover:bg-rose-500 hover:text-white font-bold text-sm tracking-wide rounded-md transition-colors shadow-lg flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{hero.ctaText || 'Shop Collection'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onJournal}
              className="px-6 py-3.5 bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 font-semibold text-sm tracking-wide rounded-md transition-colors text-center cursor-pointer"
            >
              {hero.secondaryCtaText || 'The 240 GSM Story'}
            </motion.button>
          </motion.div>

          {/* Quick Stats Bar */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
            }}
            className="pt-6 sm:pt-8 grid grid-cols-3 gap-3 sm:gap-6 border-t border-stone-800/80 text-stone-400 text-xs"
          >
            <div>
              <p className="text-base sm:text-xl font-bold text-white tracking-tight">240 GSM</p>
              <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">Combed Ring-Spun</p>
            </div>
            <div>
              <p className="text-base sm:text-xl font-bold text-white tracking-tight">1.25″ Rib</p>
              <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">Zero-Bacon Collar</p>
            </div>
            <div>
              <p className="text-base sm:text-xl font-bold text-white tracking-tight">64 Districts</p>
              <p className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">Nationwide COD</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
