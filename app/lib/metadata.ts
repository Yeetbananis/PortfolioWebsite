// app/lib/metadata.ts
import type { Metadata } from 'next';
import siteConfig from '@/site.config.js';

type MetaProps = {
  title?: string;
  description?: string;
};

export function generatePageMetadata({ title, description }: MetaProps): Metadata {
  const pageTitle = title 
    ? `${title} | ${siteConfig.title}` 
    : siteConfig.title;

  const pageDescription = description || `Portfolio of ${siteConfig.author}, a quantitative trader.`;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      siteName: siteConfig.title,
      type: 'website',
    },
  };
}