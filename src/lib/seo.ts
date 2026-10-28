// Central SEO settings and the head() builder used by every route.

export const SITE = {
  name: "Systemations",
  // Set to the live origin, for example https://example.com.au, before launch.
  // While empty, no canonical link, og:url or absolute URLs are written.
  siteUrl: "",
  // Path or URL of the share image. A 1200x630 image must be supplied and placed in public/
  // (for example "/og-image.png"). While empty, no og:image or twitter:image is written
  // and the Twitter card falls back to "summary".
  ogImage: "",
  locale: "en_AU",
  // These are pre-call pages for people with a booked call, so they stay out of search
  // engines by default (noindex, nofollow). To make the pages searchable, set this to true
  // and also set siteUrl above. It is a one-line change.
  indexable: false,
};

interface BuildHeadInput {
  title: string;
  description: string;
  /** Path of this page, for example "/explore-your-options". */
  path: string;
  /** Force noindex on this page even when the site is indexable. */
  noindex?: boolean;
  /** Path the canonical link should point to when it is not this page (duplicate content). */
  canonicalPath?: string;
}

function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = SITE.siteUrl.replace(/\/+$/, "");
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function buildHead({ title, description, path, noindex, canonicalPath }: BuildHeadInput) {
  const hasUrl = SITE.siteUrl.length > 0;
  const hasImage = SITE.ogImage.length > 0;
  const blocked = !SITE.indexable || noindex === true;
  const pageUrl = hasUrl ? absolute(path) : "";
  const canonical = hasUrl ? absolute(canonicalPath ?? path) : "";
  const imageUrl = hasImage ? (hasUrl ? absolute(SITE.ogImage) : SITE.ogImage) : "";

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    {
      name: "robots",
      content: blocked ? "noindex, nofollow" : "index, follow, max-image-preview:large",
    },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE.name },
    { property: "og:locale", content: SITE.locale },
    { name: "twitter:card", content: hasImage ? "summary_large_image" : "summary" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (hasUrl) meta.push({ property: "og:url", content: pageUrl });
  if (hasImage) {
    meta.push({ property: "og:image", content: imageUrl });
    meta.push({ name: "twitter:image", content: imageUrl });
  }

  const links: Array<Record<string, string>> = [];
  if (hasUrl) links.push({ rel: "canonical", href: canonical });

  const organization: { [key: string]: string; url?: string } = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
  };
  if (hasUrl) organization["url"] = absolute("/");

  const webPage: { [key: string]: string; url?: string } = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
  };
  if (hasUrl) webPage["url"] = pageUrl;

  const scripts = [organization, webPage].map((data) => ({
    type: "application/ld+json",
    children: JSON.stringify(data),
  }));

  return { meta, links, scripts };
}
