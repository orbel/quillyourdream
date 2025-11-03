import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  schema?: Record<string, any> | Record<string, any>[];
}

export function SEO({
  title = "Shushan Aleksanyan | Paper Quilling Artist Los Angeles",
  description = "Discover exquisite paper quilling art by Shushan Aleksanyan. Based in Los Angeles, creating intricate handcrafted artwork, custom commissions, and unique paper sculptures.",
  image = "/attached_assets/IMG_8757_1760766148353.jpeg",
  url,
  type = "website",
  schema,
}: SEOProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? "name" : "property";
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute("content", content);
    };

    // Basic meta tags
    updateMetaTag("description", description, true);

    // Open Graph tags
    updateMetaTag("og:title", title);
    updateMetaTag("og:description", description);
    updateMetaTag("og:type", type);
    if (image) updateMetaTag("og:image", image);
    if (url) updateMetaTag("og:url", url);

    // Twitter Card tags
    updateMetaTag("twitter:card", "summary_large_image", true);
    updateMetaTag("twitter:title", title, true);
    updateMetaTag("twitter:description", description, true);
    if (image) updateMetaTag("twitter:image", image, true);

    // JSON-LD Schema - Support multiple schemas
    // Remove existing schema scripts
    const existingSchemas = document.querySelectorAll('script[data-schema]');
    existingSchemas.forEach((script) => script.remove());

    if (schema) {
      const schemas = Array.isArray(schema) ? schema : [schema];
      
      schemas.forEach((schemaObj, index) => {
        const schemaScript = document.createElement("script");
        schemaScript.setAttribute("type", "application/ld+json");
        schemaScript.setAttribute("data-schema", `schema-${index}`);
        schemaScript.textContent = JSON.stringify(schemaObj);
        document.head.appendChild(schemaScript);
      });
    }
  }, [title, description, image, url, type, schema]);

  return null;
}
