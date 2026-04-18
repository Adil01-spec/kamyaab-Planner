/**
 * SEO component — uses <Head> from vite-react-ssg which is wired into the
 * SSG build's helmetContext so tags are flushed into the static <head>.
 * Falls back to the same react-helmet-async API on the client.
 */
import { Head } from 'vite-react-ssg';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  keywords?: string;
}

const SEO = ({
  title = 'KAMYAAB AI | The Execution Intelligence System for Builders',
  description = 'Stop over-planning and start executing. KAMYAAB AI generates structured multi-week plans, tracks execution with deep-work timers, and syncs with your Google & Apple calendars.',
  canonical,
  ogImage = 'https://kamyaab-ai.com/apple-touch-icon.png',
  noIndex = false,
  keywords = 'KAMYAAB AI, Execution Intelligence, structured planning, deep-work timer, productivity system, AI planner, Google Calendar sync, Apple Calendar sync',
}: SEOProps) => {
  const siteUrl = 'https://kamyaab-ai.com';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : undefined;

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="KAMYAAB AI" />
      <meta name="application-name" content="KAMYAAB AI" />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {fullCanonical && <link rel="canonical" href={fullCanonical} />}

      {/* Open Graph */}
      <meta property="og:site_name" content="KAMYAAB AI" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      {fullCanonical && <meta property="og:url" content={fullCanonical} />}

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@KamyaabAI" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD: SoftwareApplication */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'KAMYAAB AI',
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

      {/* JSON-LD: Organization */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'KAMYAAB AI',
          url: siteUrl,
          logo: `${siteUrl}/apple-touch-icon.png`,
          sameAs: [],
        })}
      </script>
    </Head>
  );
};

export default SEO;
