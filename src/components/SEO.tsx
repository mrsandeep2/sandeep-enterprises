import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

export const SEO = ({
  title = "Sandeep Enterprises - Premium Quality Rice, Atta, Kapila Feed",
  description = "Buy premium quality Basmati Rice, Sona Masoori, Parmal Rice, Wheat Atta, Kapila Cattle Feed at wholesale prices.",
  keywords = "rice wholesale, basmati rice, wheat atta, kapila feed, cattle feed",
  image = "/products/basmati-rice.jpg",
  url = "",
  type = "website"
}: SEOProps) => {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (meta) {
        meta.setAttribute('content', content);
      } else {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', image, true);
    updateMeta('og:type', type, true);
    if (url) {
      updateMeta('og:url', url, true);
    }
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);

  }, [title, description, keywords, image, url, type]);

  return null;
};
