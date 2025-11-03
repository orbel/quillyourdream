import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Ruler, Calendar, Palette, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArtworkCard } from "@/components/ArtworkCard";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SEO } from "@/components/SEO";
import { generateVisualArtworkSchema, generateBreadcrumbSchema } from "@/lib/schema";
import type { Artwork } from "@shared/schema";

export default function ArtworkDetail() {
  const [, params] = useRoute("/artwork/:slug");
  const slug = params?.slug;

  const { data: artwork, isLoading } = useQuery<Artwork>({
    queryKey: ["/api/artworks", slug],
    enabled: !!slug,
  });

  const { data: relatedArtworks } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks/related", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-[4/5] bg-muted rounded-lg animate-pulse" />
            <div className="space-y-6">
              <div className="h-12 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-6 bg-muted rounded animate-pulse w-1/2" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center py-24">
          <h1 className="font-serif text-4xl font-bold mb-4">Artwork Not Found</h1>
          <p className="text-muted-foreground mb-8">The artwork you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/portfolio">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Portfolio
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const primaryImage = artwork.images.find((img) => img.isPrimary) || artwork.images[0];

  const artworkSchema = generateVisualArtworkSchema(artwork);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "Portfolio", url: `${window.location.origin}/portfolio` },
    { name: artwork.title, url: `${window.location.origin}/artwork/${artwork.slug}` },
  ]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <SEO
        title={`${artwork.title} | Quill Your Dream`}
        description={artwork.description}
        image={primaryImage.url}
        type="article"
        schema={[breadcrumbSchema, artworkSchema]}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <Button variant="ghost" asChild data-testid="button-back">
          <Link href="/portfolio">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portfolio
          </Link>
        </Button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          <div className="space-y-4">
            <div className="aspect-[4/5] rounded-lg overflow-hidden bg-muted shadow-xl">
              <OptimizedImage
                src={primaryImage.url}
                alt={primaryImage.alt}
                size="feature"
                eager={true}
                className="w-full h-full object-cover"
                data-testid="img-artwork-primary"
              />
            </div>
            {artwork.images.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {artwork.images.slice(1, 4).map((image, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover-elevate transition-all">
                    <OptimizedImage
                      src={image.url}
                      alt={image.alt}
                      size="thumbnail"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <h1 className="font-serif text-4xl lg:text-5xl font-bold" data-testid="text-artwork-title">
                  {artwork.title}
                </h1>
                {artwork.featured && (
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <p className="text-xl text-muted-foreground">{artwork.medium}</p>
            </div>

            <Card className="p-6 space-y-4 border-card-border">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Ruler className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Dimensions</p>
                    <p className="font-semibold" data-testid="text-artwork-dimensions">
                      {artwork.width}" × {artwork.height}"
                      {artwork.depth ? ` × ${artwork.depth}"` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-semibold">{artwork.dateCreated}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Palette className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Art Form</p>
                    <p className="font-semibold">{artwork.artform}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 flex items-center justify-center text-primary mt-0.5 font-bold">
                    $
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{artwork.status}</p>
                  </div>
                </div>
              </div>
            </Card>

            {artwork.price && artwork.status === "available" && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Price</span>
                  <span className="text-3xl font-bold" data-testid="text-artwork-price">
                    ${artwork.price.toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">About This Piece</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-artwork-description">
                {artwork.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="flex-1" asChild data-testid="button-inquire">
                <Link href="/contact">
                  Inquire About This Piece
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="flex-1" asChild data-testid="button-commission">
                <Link href="/contact">
                  Commission Similar Work
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {relatedArtworks && relatedArtworks.length > 0 && (
          <div className="mt-24">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-12 text-center">
              Related Artworks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedArtworks.slice(0, 3).map((related) => (
                <ArtworkCard key={related.id} artwork={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
