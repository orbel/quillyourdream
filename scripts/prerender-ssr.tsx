import { renderToString } from "react-dom/server";
import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { db } from "../server/db.js";
import { artworks, artistInfo, faqs } from "../shared/schema.js";
import type { Artwork, ArtistInfo, FAQ } from "../shared/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface RouteData {
  path: string;
  title: string;
  description: string;
  component: string;
  data?: any;
}

function truncateDescription(text: string, maxLength: number = 155): string {
  if (text.length <= maxLength) return text;
  
  // Find the last space before maxLength
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function generateStaticRoutes(): Promise<RouteData[]> {
  const routes: RouteData[] = [];
  
  // Fetch all data upfront
  const [allArtworks, artist, allFaqs] = await Promise.all([
    db.select().from(artworks),
    db.select().from(artistInfo).then(rows => rows[0]),
    db.select().from(faqs)
  ]);

  const featuredArtworks = allArtworks.filter(a => a.featured).slice(0, 6);

  // Homepage
  routes.push({
    path: "/",
    title: "Shushan Aleksanyan | Paper Quilling Artist Los Angeles",
    description: "Discover exquisite paper quilling art by Shushan Aleksanyan. Based in Los Angeles, creating intricate handcrafted artwork, custom commissions, and unique paper sculptures.",
    component: "home",
    data: { featuredArtworks }
  });

  // Portfolio
  routes.push({
    path: "/portfolio",
    title: "Portfolio | Shushan Aleksanyan Paper Quilling Art",
    description: "Browse the complete collection of paper quilling artworks by Shushan Aleksanyan. Each piece is handcrafted with intricate detail and available for purchase.",
    component: "portfolio",
    data: { artworks: allArtworks }
  });

  // About
  routes.push({
    path: "/about",
    title: "About | Shushan Aleksanyan Paper Quilling Artist",
    description: escapeHtml(truncateDescription(artist?.bio || "")),
    component: "about",
    data: { artist }
  });

  // FAQ
  routes.push({
    path: "/faq",
    title: "FAQ | Shushan Aleksanyan Paper Quilling Art",
    description: "Frequently asked questions about paper quilling art, commissions, shipping, and care instructions for Shushan Aleksanyan's artworks.",
    component: "faq",
    data: { faqs: allFaqs }
  });

  // Contact
  routes.push({
    path: "/contact",
    title: "Contact | Shushan Aleksanyan Paper Quilling Artist",
    description: "Get in touch with Shushan Aleksanyan for custom commissions, inquiries, or to purchase paper quilling artwork.",
    component: "contact",
    data: { artist }
  });

  // Artwork detail pages
  for (const artwork of allArtworks) {
    const relatedArtworks = allArtworks
      .filter(a => a.id !== artwork.id && a.category === artwork.category)
      .slice(0, 3);

    routes.push({
      path: `/artwork/${artwork.slug}`,
      title: `${artwork.title} | Shushan Aleksanyan Paper Quilling Art`,
      description: escapeHtml(truncateDescription(artwork.description)),
      component: "artwork",
      data: { artwork, relatedArtworks }
    });
  }

  return routes;
}

async function generateHtmlWithData(route: RouteData, assetManifest: any): Promise<string> {
  const cssFile = assetManifest["index.css"];
  const jsFile = assetManifest["index.js"];

  // Embed route data as JSON for client-side hydration
  const dataScript = route.data 
    ? `<script id="__SSG_DATA__" type="application/json">${JSON.stringify(route.data).replace(/</g, '\\u003c')}</script>`
    : '';

  // For now, keep the empty root div but include data for hydration
  // True SSR would render the component here, but that requires more complex setup with Wouter
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />
    <title>${route.title}</title>
    <meta name="description" content="${route.description}" />
    <meta property="og:title" content="${route.title}" />
    <meta property="og:description" content="${route.description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://quillyourdream.com${route.path}" />
    <link rel="canonical" href="https://quillyourdream.com${route.path}" />
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Inter:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap" rel="stylesheet">
    ${cssFile ? `<link rel="stylesheet" href="${cssFile}">` : ''}
    ${jsFile ? `<link rel="modulepreload" href="${jsFile}">` : ''}
  </head>
  <body>
    <div id="root"></div>
    ${dataScript}
    ${jsFile ? `<script type="module" src="${jsFile}"></script>` : ''}
  </body>
</html>`;
}

async function findBuiltAssets(distDir: string): Promise<{ [key: string]: string }> {
  const manifest: { [key: string]: string } = {};
  
  try {
    const manifestPath = join(distDir, ".vite", "manifest.json");
    const manifestContent = await readFile(manifestPath, "utf-8");
    const viteManifest = JSON.parse(manifestContent);
    
    if (viteManifest["index.html"]) {
      const entry = viteManifest["index.html"];
      if (entry.css && entry.css.length > 0) {
        manifest["index.css"] = `/${entry.css[0]}`;
      }
      if (entry.file) {
        manifest["index.js"] = `/${entry.file}`;
      }
    }
  } catch (error) {
    console.warn("Could not load Vite manifest, using fallback asset paths");
    const files = await import('fs').then(fs => fs.promises.readdir(join(distDir, "assets")));
    const cssFile = files.find(f => f.endsWith(".css"));
    const jsFile = files.find(f => f.endsWith(".js"));
    
    if (cssFile) manifest["index.css"] = `/assets/${cssFile}`;
    if (jsFile) manifest["index.js"] = `/assets/${jsFile}`;
  }
  
  return manifest;
}

async function prebuildStatic() {
  console.log("🚀 Generating static site with data...");
  
  const routes = await generateStaticRoutes();
  const distDir = join(__dirname, "..", "dist", "public");
  const assetManifest = await findBuiltAssets(distDir);

  console.log(`📝 Found ${routes.length} routes to prerender`);
  console.log(`📦 Asset manifest:`, assetManifest);

  for (const route of routes) {
    const html = await generateHtmlWithData(route, assetManifest);
    
    let filePath: string;
    if (route.path === "/") {
      filePath = join(distDir, "index.html");
    } else {
      const routePath = route.path.slice(1);
      const routeDir = join(distDir, routePath);
      await mkdir(routeDir, { recursive: true });
      filePath = join(routeDir, "index.html");
    }

    await writeFile(filePath, html, "utf-8");
    console.log(`✅ Generated: ${route.path} (${route.component})`);
  }

  console.log("✨ Static site generation complete!");
  
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>https://quillyourdream.com${route.path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route.path === "/" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  await writeFile(join(distDir, "sitemap.xml"), sitemapContent, "utf-8");
  console.log("✅ Generated sitemap.xml");
  
  const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://quillyourdream.com/sitemap.xml`;

  await writeFile(join(distDir, "robots.txt"), robotsTxt, "utf-8");
  console.log("✅ Generated robots.txt");
}

prebuildStatic().catch((err) => {
  console.error("Error during prerendering:", err);
  process.exit(1);
});
