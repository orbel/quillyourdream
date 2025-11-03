# Design Guidelines: Quill Your Dream Art Portfolio

## Design Approach
**Reference-Based:** Drawing from premium artist portfolios (Behance curated, Squarespace artist templates) and museum websites (MoMA, Tate Modern). Philosophy: Let artwork breathe through generous whitespace, refined typography, and restrained color palette that defers to the art.

## Color Palette

**Light Mode:**
- Background: 40 5% 98% (warm off-white)
- Surface: 40 5% 100%
- Text Primary: 240 10% 15%
- Text Secondary: 240 5% 45%
- Border: 40 5% 90%

**Dark Mode:**
- Background: 240 8% 8%
- Surface: 240 7% 12%
- Text Primary: 40 5% 95%
- Text Secondary: 40 5% 70%
- Border: 240 5% 20%

**Brand/Accent (Admin Configurable - Default Teal):**
- Primary: 180 45% 55% (soft teal)
- Primary Hover: 180 50% 45%
- Alternate options: 50 60% 70% (soft yellow), 210 45% 60% (soft blue)

## Typography
- **Headings:** Playfair Display (serif, elegant) - 700 weight
- **Body:** Inter (sans-serif, clean) - 400/500 weights
- **Scale:** text-6xl (hero titles), text-4xl (section headers), text-2xl (card titles), text-base (body), text-sm (captions)

## Layout System
**Spacing Units:** Tailwind 4, 8, 12, 16, 24, 32 (p-4, gap-8, py-12, mt-16, py-24, py-32)
**Containers:** max-w-7xl for sections, max-w-4xl for text content, full-width for galleries
**Grid System:** 12-column base, masonry layouts for galleries

## Component Library

**Navigation:**
- Sticky header with blur backdrop (backdrop-blur-md bg-background/80)
- Logo left, navigation center, dark mode toggle + CTA right
- Mobile: Slide-in drawer with artwork background pattern overlay

**Hero Section (Homepage):**
- Full-height (min-h-screen) with large featured artwork image (60% width, offset right)
- Artist name + tagline left-aligned with generous negative space
- Subtle parallax scroll on artwork image
- Outline buttons with backdrop-blur-sm bg-background/20

**Artwork Gallery Grid:**
- Masonry layout (3 columns desktop, 2 tablet, 1 mobile)
- Cards: Artwork image, title overlay on hover (gradient from transparent to dark)
- Lightbox modal for full-size viewing with image details, description

**Artist Biography:**
- Two-column: Portrait photo left (sticky), bio content right (scrollable)
- Timeline component for artistic journey
- Soft shadow on portrait: shadow-2xl with brand color tint

**FAQ Section:**
- Accordion components with brand accent left border (border-l-4)
- Icons from Heroicons (ChevronDown)
- Smooth expand/collapse transitions

**Contact Form:**
- Split layout: Form left (60%), contact details + map placeholder right (40%)
- Input fields: Floating labels, subtle focus states with brand accent
- Success/error states with appropriate color feedback

**Footer:**
- Three columns: Quick links, social media (Instagram prominent for visual art), newsletter signup
- Copyright + artist signature graphic
- Subtle top border with brand accent

**Gallery Categories:**
- Filter tabs with underline animation on active state
- Category cards with artwork count badges

## Specific Features

**Admin Color Configurator (Settings Page):**
- Color picker for accent selection
- Live preview cards showing buttons, links, borders in selected color
- Preset options: Teal (default), Yellow, Blue, Custom

**Artwork Detail Pages:**
- Hero: Large artwork image (80vw max-width, centered)
- Metadata sidebar: Dimensions, materials, year, price (if applicable)
- Related artworks carousel at bottom
- Share buttons with brand styling

**Animations:**
- Minimal: Fade-in on scroll for gallery items (stagger 50ms)
- Hover lift on cards (translate-y-1)
- Smooth page transitions (200ms ease-in-out)

## Images

**Homepage Hero:** Large, high-quality featured paper quilling artwork showcasing intricate detail and vibrant colors. Position: Right-aligned, occupying 55-60% viewport width. Aspect ratio 3:4 portrait orientation preferred.

**Artist Portrait:** Professional headshot of Shushan Aleksanyan in studio setting. Size: 400x500px, positioned in biography section.

**Gallery Artworks:** 15-20 high-resolution quilling pieces. Mix of portrait/landscape/square formats for dynamic masonry layout. Each min 1200px width.

**Process Images (About Section):** 3-4 behind-the-scenes photos showing quilling technique, workspace, tools. Arranged in horizontal strip.

**Category Thumbnails:** Representative artwork for each gallery category (Florals, Portraits, Abstract, Custom Commissions). Square format 600x600px.

**Background Textures (Subtle):** Light paper texture overlay at 3% opacity on light mode surfaces, darker on dark mode for depth.