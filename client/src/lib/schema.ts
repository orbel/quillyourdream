import type { Artwork, ArtistInfo, FAQ } from "@shared/schema";

export function generatePersonSchema(artist: ArtistInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: artist.name,
    jobTitle: artist.tagline,
    description: artist.bio,
    url: window.location.origin,
    image: artist.profileImage,
    email: artist.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: artist.location.split(",")[0],
      addressRegion: artist.location.split(",")[1]?.trim(),
      addressCountry: "US",
    },
    sameAs: Object.values(artist.social).filter(Boolean),
  };
}

export function generateVisualArtworkSchema(artwork: Artwork) {
  const primaryImage = artwork.images.find((img) => img.isPrimary) || artwork.images[0];
  
  return {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: artwork.title,
    description: artwork.description,
    image: {
      "@type": "ImageObject",
      url: primaryImage.url,
      caption: primaryImage.alt,
    },
    creator: {
      "@type": "Person",
      name: "Shushan Aleksanyan",
    },
    artMedium: artwork.medium,
    artform: artwork.artform,
    dateCreated: artwork.dateCreated,
    width: {
      "@type": "Distance",
      value: artwork.width,
      unitCode: "INH",
    },
    height: {
      "@type": "Distance",
      value: artwork.height,
      unitCode: "INH",
    },
    ...(artwork.depth && {
      depth: {
        "@type": "Distance",
        value: artwork.depth,
        unitCode: "INH",
      },
    }),
    copyrightHolder: {
      "@type": "Person",
      name: "Shushan Aleksanyan",
    },
    ...(artwork.price && artwork.status === "available" && {
      offers: {
        "@type": "Offer",
        price: artwork.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
    }),
  };
}

export function generateCollectionPageSchema(artworks: Artwork[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Paper Quilling Art Portfolio",
    description: "A collection of handcrafted paper quilling artworks by Shushan Aleksanyan",
    author: {
      "@type": "Person",
      name: "Shushan Aleksanyan",
    },
    hasPart: artworks.slice(0, 10).map((artwork) => ({
      "@type": "VisualArtwork",
      name: artwork.title,
      image: artwork.images.find((img) => img.isPrimary)?.url || artwork.images[0]?.url,
      url: `${window.location.origin}/artwork/${artwork.slug}`,
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQPageSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
