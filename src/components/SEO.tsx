import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
}

const SEO = ({
  title = 'Kamyaab — Execution Intelligence System',
  description = 'AI-powered execution intelligence system. Define objectives, execute with deterministic speed, and adapt through behavioral memory. Plans that actually get completed.',
  canonical,
  ogImage = 'https://kamyaab-ai.com/apple-touch-icon.png',
  noIndex = false,
}: SEOProps) => {
  const siteUrl = 'https://kamyaab-ai.com';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Kamyaab AI',
          operatingSystem: 'Web',
          applicationCategory: 'ProductivityApplication',
          description,
          url: siteUrl,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
            description: 'Standard tier is free',
          },
        })}
      </script>

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Kamyaab',
          url: siteUrl,
          logo: `${siteUrl}/apple-touch-icon.png`,
          sameAs: [],
        })}
      </script>
    </Helmet>
  );
};

export default SEO;
