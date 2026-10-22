import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';

interface SEOManagerProps {
  currentView: string;
  selectedProductId: string | null;
  staticPageSlug?: string;
}

export const SEOManager: React.FC<SEOManagerProps> = ({
  currentView,
  selectedProductId,
  staticPageSlug,
}) => {
  const {
    siteSettings,
    products,
    staticPages,
    newsPosts,
    getProductRatingSummary,
    getProductReviews,
  } = useStore();

  useEffect(() => {
    // 1. Determine Dynamic Route SEO details
    let title = siteSettings.seo?.metaTitle || `${siteSettings.siteName || 'ThreadCraft'} — Heavyweight Streetwear & 240 GSM T-Shirts`;
    let description = siteSettings.seo?.metaDescription || siteSettings.siteDescription || 'Shop engineered 240 GSM organic combed cotton t-shirts with anti-bacon ribbed collars and boxy streetwear drape.';
    let imageUrl = siteSettings.seo?.ogImage || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&h=630&q=85';
    let isNoIndex = false;
    let schemaGraph: any = null;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://threadcraft.studio';
    let canonicalUrl = `${baseUrl}/${currentView === 'home' ? '' : currentView}`;

    // Case A: Product Modal is Active
    if (selectedProductId) {
      const activeProduct = products.find(p => p.id === selectedProductId);
      if (activeProduct) {
        const rating = getProductRatingSummary(activeProduct.id);
        const reviews = getProductReviews(activeProduct.id);
        const inStock = activeProduct.variants.some(v => v.stockQuantity > 0);

        title = `${activeProduct.name} (${activeProduct.fabricWeight}) — ${siteSettings.siteName || 'ThreadCraft'}`;
        description = activeProduct.shortDescription || activeProduct.description.slice(0, 155);
        if (activeProduct.images[0]?.imageUrl) {
          imageUrl = activeProduct.images[0].imageUrl;
        }
        canonicalUrl = `${baseUrl}/product/${activeProduct.slug || activeProduct.id}`;

        // Schema.org Product Rich Snippet
        const productSchema: any = {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: activeProduct.name,
          image: activeProduct.images.map(img => img.imageUrl),
          description: activeProduct.description,
          sku: activeProduct.variants[0]?.sku || activeProduct.id,
          brand: {
            '@type': 'Brand',
            name: siteSettings.siteName || 'ThreadCraft',
          },
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'BDT',
            lowPrice: activeProduct.basePrice,
            highPrice: activeProduct.basePrice,
            offerCount: activeProduct.variants.length,
            availability: inStock
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            seller: {
              '@type': 'Organization',
              name: siteSettings.siteName || 'ThreadCraft',
            },
          },
        };

        if (rating.reviewCount > 0) {
          productSchema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: rating.averageRating.toFixed(1),
            reviewCount: rating.reviewCount,
            bestRating: '5',
            worstRating: '1',
          };
          productSchema.review = reviews.slice(0, 5).map(rev => ({
            '@type': 'Review',
            author: {
              '@type': 'Person',
              name: rev.userName,
            },
            datePublished: rev.createdAt.split('T')[0],
            reviewBody: rev.comment,
            name: rev.title,
            reviewRating: {
              '@type': 'Rating',
              ratingValue: rev.rating,
              bestRating: '5',
              worstRating: '1',
            },
          }));
        }

        schemaGraph = productSchema;
      }
    } else if (currentView === 'shop') {
      title = `Heavyweight T-Shirt Collection & Drops — ${siteSettings.siteName || 'ThreadCraft'}`;
      description = `Explore our full catalog of ${products.length} artisanal 240 GSM organic combed cotton t-shirts, boxy drops, and oversized silhouettes in Bangladesh.`;
      canonicalUrl = `${baseUrl}/shop`;
    } else if (currentView === 'news') {
      title = `Fabric Journal & Streetwear News — ${siteSettings.siteName || 'ThreadCraft'}`;
      description = `Discover editorial insights into textile technology, 240 GSM organic ring-spun cotton, and streetwear styling guides.`;
      canonicalUrl = `${baseUrl}/news`;
    } else if (currentView.startsWith('page-')) {
      const slug = staticPageSlug || currentView.replace('page-', '');
      const page = staticPages.find(p => p.slug === slug);
      if (page) {
        title = `${page.title} — ${siteSettings.siteName || 'ThreadCraft'}`;
        description = `Official ${page.title} guide and customer service information for ${siteSettings.siteName || 'ThreadCraft'}.`;
        canonicalUrl = `${baseUrl}/page/${page.slug}`;
      }
    } else if (currentView === 'checkout') {
      title = `Secure Checkout & Mobile Payment Claim — ${siteSettings.siteName || 'ThreadCraft'}`;
      description = `Complete your order with verified manual bKash, Nagad, Rocket, or Cash on Delivery.`;
      isNoIndex = true;
    } else if (currentView === 'admin') {
      title = `Admin Center — ${siteSettings.siteName || 'ThreadCraft'}`;
      description = `ThreadCraft private management center.`;
      isNoIndex = true;
    }

    // Default Organization + WebSite graph for home
    if (!schemaGraph) {
      schemaGraph = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'OnlineStore',
            '@id': `${baseUrl}/#store`,
            name: siteSettings.siteName || 'ThreadCraft Studio',
            url: baseUrl,
            logo: siteSettings.logoUrl || `${baseUrl}/favicon.svg`,
            description: siteSettings.siteDescription,
            currenciesAccepted: 'BDT',
            paymentAccepted: 'Cash on Delivery, bKash, Nagad, Rocket',
            priceRange: '৳৳',
            address: {
              '@type': 'PostalAddress',
              streetAddress: siteSettings.contact?.address || 'Road 9A, Dhanmondi R/A',
              addressLocality: 'Dhaka',
              postalCode: '1209',
              addressCountry: 'BD',
            },
            contactPoint: {
              '@type': 'ContactPoint',
              telephone: siteSettings.contact?.phone || '+880 1700-112233',
              contactType: 'Customer Support',
              areaServed: 'BD',
              availableLanguage: ['English', 'Bengali'],
            },
          },
          {
            '@type': 'WebSite',
            '@id': `${baseUrl}/#website`,
            url: baseUrl,
            name: siteSettings.siteName || 'ThreadCraft',
            description: siteSettings.siteDescription,
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${baseUrl}/shop?q={search_term_string}`,
              },
              'query-input': 'required name=search_term_string',
            },
          },
        ],
      };
    }

    // 2. Synchronize DOM Meta tags
    document.title = title;

    const setMeta = (attrName: string, attrVal: string, contentVal: string) => {
      let meta = document.querySelector(`meta[${attrName}='${attrVal}']`) as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrVal);
        document.head.appendChild(meta);
      }
      meta.content = contentVal;
    };

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', imageUrl);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);

    if (siteSettings.seo?.keywords) {
      setMeta('name', 'keywords', siteSettings.seo.keywords);
    }
    if (siteSettings.seo?.twitterHandle) {
      setMeta('name', 'twitter:site', siteSettings.seo.twitterHandle);
    }

    // Robots meta: noindex for admin/checkout, index follow for storefront
    setMeta(
      'name',
      'robots',
      isNoIndex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // Canonical link tag
    let canonical = document.getElementById('canonical-url') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    }
    if (canonical) {
      canonical.href = canonicalUrl;
    } else {
      const link = document.createElement('link');
      link.id = 'canonical-url';
      link.rel = 'canonical';
      link.href = canonicalUrl;
      document.head.appendChild(link);
    }

    // Schema.org JSON-LD tag
    let scriptTag = document.getElementById('schema-org-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'schema-org-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(schemaGraph, null, 2);
  }, [
    currentView,
    selectedProductId,
    staticPageSlug,
    siteSettings,
    products,
    staticPages,
    newsPosts,
    getProductRatingSummary,
    getProductReviews,
  ]);

  return null;
};
