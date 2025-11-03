import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArtworkCard } from "@/components/ArtworkCard";
import { SEO } from "@/components/SEO";
import { generateCollectionPageSchema, generateBreadcrumbSchema } from "@/lib/schema";
import type { Artwork } from "@shared/schema";

const categories = [
  { value: "all", label: "All Works" },
  { value: "original", label: "Original Pieces" },
  { value: "commission", label: "Commissions" },
  { value: "exhibition", label: "Exhibitions" },
];

export default function Portfolio() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: artworks, isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks"],
  });

  const filteredArtworks = artworks?.filter((artwork) => {
    if (selectedCategory === "all") return true;
    return artwork.category === selectedCategory;
  });

  const collectionSchema = artworks ? generateCollectionPageSchema(artworks) : null;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "Portfolio", url: `${window.location.origin}/portfolio` },
  ]);

  const schemas = collectionSchema ? [breadcrumbSchema, collectionSchema] : [breadcrumbSchema];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <SEO
        title="Portfolio | Quill Your Dream"
        description="Browse the complete collection of handcrafted paper quilling artworks by Shushan Aleksanyan. Original pieces, commissions, and exhibition works available."
        schema={schemas}
      />
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-16 space-y-6">
          <h1 className="font-serif text-5xl lg:text-6xl font-bold text-center">
            Portfolio
          </h1>
          <p className="text-center text-muted-foreground text-lg max-w-2xl mx-auto">
            A collection of meticulously crafted paper quilling artworks, each piece telling its own unique story through intricate design and vibrant colors.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.value)}
              data-testid={`button-filter-${category.value}`}
              className="min-w-[120px]"
            >
              {category.label}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/5] bg-muted rounded-lg animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredArtworks && filteredArtworks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" data-testid="grid-artworks">
            {filteredArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="text-muted-foreground text-lg">No artworks found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
