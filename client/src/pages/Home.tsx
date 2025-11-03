import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArtworkCard } from "@/components/ArtworkCard";
import { OptimizedImage } from "@/components/OptimizedImage";
import { SEO } from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/lib/schema";
import type { Artwork } from "@shared/schema";

export default function Home() {
  const { data: artworks, isLoading } = useQuery<Artwork[]>({
    queryKey: ["/api/artworks/featured"],
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
  ]);

  return (
    <div className="min-h-screen">
      <SEO schema={[breadcrumbSchema]} />
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>Los Angeles Based Artist</span>
              </div>
              
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                Shushan Aleksanyan
              </h1>
              
              <p className="font-accent text-2xl sm:text-3xl text-muted-foreground italic">
                Paper Quilling Artistry
              </p>
              
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                Transforming delicate paper strips into extraordinary three-dimensional artworks. Each piece is meticulously handcrafted, celebrating the timeless art of paper quilling with contemporary vision.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button size="lg" asChild data-testid="button-view-portfolio">
                  <Link href="/portfolio">
                    <span>View Portfolio</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild data-testid="button-commission">
                  <Link href="/contact">
                    <span>Commission Artwork</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[4/5] bg-muted rounded-lg animate-pulse"
                    />
                  ))
                ) : artworks && artworks.length > 0 ? (
                  artworks.slice(0, 4).map((artwork, idx) => {
                    const primaryImage = artwork.images.find((img) => img.isPrimary) || artwork.images[0];
                    return (
                      <Link
                        key={artwork.id}
                        href={`/artwork/${artwork.slug}`}
                        data-testid={`link-hero-artwork-${idx}`}
                      >
                        <div className="aspect-[4/5] rounded-lg overflow-hidden hover-elevate cursor-pointer transition-all duration-500 group">
                          <OptimizedImage
                            src={primaryImage.url}
                            alt={primaryImage.alt}
                            size="grid"
                            eager={idx < 2}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>
                    );
                  })
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold">Featured Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Explore a curated selection of handcrafted paper quilling masterpieces
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-[4/5] bg-muted rounded-lg animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                  <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          ) : artworks && artworks.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {artworks.slice(0, 6).map((artwork) => (
                  <ArtworkCard key={artwork.id} artwork={artwork} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Button size="lg" variant="outline" asChild data-testid="button-view-all">
                  <Link href="/portfolio">
                    <span>View All Artworks</span>
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No artworks available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="font-serif text-4xl lg:text-5xl font-bold">
            Commission Custom Artwork
          </h2>
          <p className="text-lg text-muted-foreground">
            Bring your vision to life with a bespoke paper quilling creation. From portraits to abstract designs, each commission is crafted with meticulous attention to detail and artistic excellence.
          </p>
          <Button size="lg" asChild data-testid="button-get-started">
            <Link href="/contact">
              <span>Get Started</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
