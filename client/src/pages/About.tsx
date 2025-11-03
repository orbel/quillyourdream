import { useQuery } from "@tanstack/react-query";
import { MapPin, Award, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";
import { generatePersonSchema, generateBreadcrumbSchema } from "@/lib/schema";
import type { ArtistInfo } from "@shared/schema";
import artistPhoto from "@assets/IMG_8757_1760766148353.jpeg";

export default function About() {
  const { data: artistInfo, isLoading } = useQuery<ArtistInfo>({
    queryKey: ["/api/artist"],
  });

  const personSchema = artistInfo ? generatePersonSchema(artistInfo) : null;
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: window.location.origin },
    { name: "About", url: `${window.location.origin}/about` },
  ]);

  const schemas = personSchema ? [breadcrumbSchema, personSchema] : [breadcrumbSchema];

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="h-12 bg-muted rounded animate-pulse w-1/2 mx-auto" />
            <div className="aspect-square max-w-md mx-auto bg-muted rounded-full animate-pulse" />
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <SEO
        title="About Shushan Aleksanyan | Quill Your Dream"
        description="Learn about Shushan Aleksanyan, a Los Angeles-based paper quilling artist with over a decade of experience creating extraordinary three-dimensional artworks."
        schema={schemas}
      />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h1 className="font-serif text-5xl lg:text-6xl font-bold">About the Artist</h1>
          <p className="text-muted-foreground text-lg">
            Meet the creative force behind the intricate paper artistry
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-2 flex justify-center">
            <div className="relative">
              <div className="aspect-square w-full max-w-sm rounded-full overflow-hidden shadow-2xl border-4 border-primary/10">
                <img
                  src={artistPhoto}
                  alt={artistInfo?.name || "Shushan Aleksanyan"}
                  className="w-full h-full object-cover"
                  data-testid="img-artist-photo"
                />
              </div>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-card border border-card-border rounded-full px-6 py-3 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium">{artistInfo?.location || "Los Angeles, CA"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6 pt-8 lg:pt-0">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-4" data-testid="text-artist-name">
                {artistInfo?.name || "Shushan Aleksanyan"}
              </h2>
              <p className="text-xl text-primary font-accent italic">
                {artistInfo?.tagline || "Paper Quilling Artist & Designer"}
              </p>
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed" data-testid="text-artist-bio">
                {artistInfo?.bio || `Shushan Aleksanyan is a Los Angeles-based paper quilling artist renowned for transforming simple paper strips into extraordinary three-dimensional masterpieces. With over a decade of experience, Shushan has developed a distinctive style that blends traditional quilling techniques with contemporary artistic vision.

Her work has captivated collectors and art enthusiasts worldwide, with each piece reflecting meticulous craftsmanship and boundless creativity. From vibrant florals to intricate portraits, Shushan's artworks celebrate the beauty and versatility of paper as a medium.

Beyond creating stunning original pieces, Shushan is passionate about sharing her craft through workshops and custom commissions, helping others discover the joy of paper artistry.`}
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 text-center space-y-3 border-card-border hover-elevate transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Heart className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">10+ Years</h3>
            <p className="text-sm text-muted-foreground">
              Dedicated to the art of paper quilling
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 border-card-border hover-elevate transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">12K+ Followers</h3>
            <p className="text-sm text-muted-foreground">
              Growing community on Instagram
            </p>
          </Card>

          <Card className="p-6 text-center space-y-3 border-card-border hover-elevate transition-all">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg">Los Angeles</h3>
            <p className="text-sm text-muted-foreground">
              Creating from a vibrant studio
            </p>
          </Card>
        </div>

        {artistInfo?.exhibitions && artistInfo.exhibitions.length > 0 && (
          <div className="mb-16">
            <h2 className="font-serif text-3xl font-bold mb-8 text-center">Exhibitions & Highlights</h2>
            <Card className="divide-y divide-border border-card-border">
              {artistInfo.exhibitions.map((exhibition, idx) => (
                <div key={idx} className="p-6 flex items-start gap-6 hover-elevate transition-all">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{exhibition.year}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{exhibition.title}</h3>
                    <p className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {exhibition.location}
                    </p>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        <div className="bg-card rounded-lg border border-card-border p-8 lg:p-12 text-center space-y-6">
          <h2 className="font-serif text-3xl font-bold">The Creative Process</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Each artwork begins with a vision and meticulous planning. Hundreds of delicate paper strips are carefully rolled, shaped, and arranged by hand to create intricate designs. The process can take anywhere from 50 to 300+ hours depending on the complexity, with every piece reflecting dedication to the craft and attention to the smallest details.
          </p>
        </div>
      </div>
    </div>
  );
}
